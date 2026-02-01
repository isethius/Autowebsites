import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '../utils/supabase';
import { logLoginAttempt, logSecurityEvent } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

// In-memory caches (backed by database for persistence across restarts)
interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

const loginAttemptsCache = new Map<string, LoginAttempt>();
const tokenVersionsCache = new Map<string, number>();

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MIN = 15;

// Token configuration
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

function getLoginAttemptKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

// Database-backed login attempts functions
async function checkLoginAttemptsDb(email: string, ip: string): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const key = getLoginAttemptKey(email, ip);

  // Check cache first
  const cached = loginAttemptsCache.get(key);
  if (cached) {
    // Check if locked out
    if (cached.lockedUntil && new Date() < cached.lockedUntil) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: cached.lockedUntil };
    }

    // Clear lockout if it has passed
    if (cached.lockedUntil && new Date() >= cached.lockedUntil) {
      cached.lockedUntil = undefined;
      cached.count = 0;
    }

    const remaining = MAX_LOGIN_ATTEMPTS - cached.count;
    return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining) };
  }

  // Query database
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('check_login_attempts', { p_key: key });

    if (error || !data || data.length === 0) {
      return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    const row = data[0];
    const lockedUntil = row.locked_until ? new Date(row.locked_until) : undefined;

    // Update cache
    loginAttemptsCache.set(key, {
      count: row.attempts,
      lastAttempt: new Date(),
      lockedUntil,
    });

    if (row.is_locked) {
      return { allowed: false, remainingAttempts: 0, lockedUntil };
    }

    const remaining = MAX_LOGIN_ATTEMPTS - row.attempts;
    return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining) };
  } catch (error) {
    console.error('Error checking login attempts from DB:', error);
    // Fall back to cache-only behavior if DB is unavailable
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }
}

async function recordFailedLoginDb(email: string, ip: string): Promise<void> {
  const key = getLoginAttemptKey(email, ip);

  // Update cache
  const cached = loginAttemptsCache.get(key) || { count: 0, lastAttempt: new Date() };
  cached.count++;
  cached.lastAttempt = new Date();

  if (cached.count >= MAX_LOGIN_ATTEMPTS) {
    cached.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    logSecurityEvent('account_locked', {
      email,
      ip,
      attempts: cached.count,
      lockDuration: LOCKOUT_DURATION_MIN + ' minutes',
    });
  }

  loginAttemptsCache.set(key, cached);

  // Persist to database
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc('record_failed_login', {
      p_key: key,
      p_max_attempts: MAX_LOGIN_ATTEMPTS,
      p_lockout_minutes: LOCKOUT_DURATION_MIN,
    });
  } catch (error) {
    console.error('Error recording failed login to DB:', error);
    // Cache is still updated, so rate limiting works locally
  }
}

async function clearLoginAttemptsDb(email: string, ip: string): Promise<void> {
  const key = getLoginAttemptKey(email, ip);

  // Clear cache
  loginAttemptsCache.delete(key);

  // Clear from database
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc('clear_login_attempts', { p_key: key });
  } catch (error) {
    console.error('Error clearing login attempts from DB:', error);
  }
}

// Database-backed token version functions
async function getTokenVersionDb(userId: string): Promise<number> {
  // Check cache first
  const cached = tokenVersionsCache.get(userId);
  if (cached !== undefined) {
    return cached;
  }

  // Query database
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_token_version', { p_user_id: userId });

    const version = error ? 1 : (data || 1);
    tokenVersionsCache.set(userId, version);
    return version;
  } catch (error) {
    console.error('Error getting token version from DB:', error);
    return 1;
  }
}

async function incrementTokenVersionDb(userId: string): Promise<number> {
  // Update cache
  const current = tokenVersionsCache.get(userId) || 1;
  const newVersion = current + 1;
  tokenVersionsCache.set(userId, newVersion);

  // Persist to database
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('increment_token_version', { p_user_id: userId });

    if (!error && data) {
      tokenVersionsCache.set(userId, data);
      return data;
    }
  } catch (error) {
    console.error('Error incrementing token version in DB:', error);
  }

  return newVersion;
}

// Sync functions - kept for backwards compatibility
function getTokenVersion(userId: string): number {
  return tokenVersionsCache.get(userId) || 1;
}

function incrementTokenVersion(userId: string): void {
  const current = tokenVersionsCache.get(userId) || 1;
  tokenVersionsCache.set(userId, current + 1);
  // Fire and forget DB update
  incrementTokenVersionDb(userId).catch(() => {});
}

export function authMiddleware(jwtSecret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'AUTH_ERROR', message: 'No token provided' }
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, jwtSecret) as UserPayload & { version?: number };

      // Check token version for invalidation
      const currentVersion = getTokenVersion(decoded.id);
      if (decoded.version && decoded.version < currentVersion) {
        return res.status(401).json({
          error: { code: 'AUTH_ERROR', message: 'Token has been invalidated' }
        });
      }

      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
        });
      }
      return res.status(401).json({
        error: { code: 'AUTH_ERROR', message: 'Invalid token' }
      });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'AUTH_ERROR', message: 'Not authenticated' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }

    next();
  };
}

export function createAuthRouter(jwtSecret: string): Router {
  const router = Router();

  const supabase = getSupabaseClient();

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      if (!email || !password) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
        });
      }

      // Check login attempts (database-backed for persistence across restarts)
      const attemptCheck = await checkLoginAttemptsDb(email, ip);
      if (!attemptCheck.allowed) {
        logLoginAttempt(email, false, ip, { reason: 'account_locked' });
        return res.status(429).json({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Too many failed attempts. Account temporarily locked.',
            lockedUntil: attemptCheck.lockedUntil,
          }
        });
      }

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        await recordFailedLoginDb(email, ip);
        logLoginAttempt(email, false, ip, { reason: 'user_not_found' });
        return res.status(401).json({
          error: {
            code: 'AUTH_ERROR',
            message: 'Invalid credentials',
            remainingAttempts: attemptCheck.remainingAttempts - 1,
          }
        });
      }

      // Check if active
      if (!user.is_active) {
        logLoginAttempt(email, false, ip, { reason: 'account_disabled' });
        return res.status(401).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        await recordFailedLoginDb(email, ip);
        logLoginAttempt(email, false, ip, { reason: 'invalid_password' });
        return res.status(401).json({
          error: {
            code: 'AUTH_ERROR',
            message: 'Invalid credentials',
            remainingAttempts: attemptCheck.remainingAttempts - 1,
          }
        });
      }

      // Successful login - clear attempts
      await clearLoginAttemptsDb(email, ip);
      logLoginAttempt(email, true, ip);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Generate tokens with version (database-backed for persistence)
      const tokenVersion = await getTokenVersionDb(user.id);
      const payload: UserPayload & { version: number } = {
        id: user.id,
        email: user.email,
        role: user.role,
        version: tokenVersion,
      };

      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh', version: tokenVersion },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      res.json({
        token: accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
      });
    }
  });

  // Register (admin only or first user)
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
        });
      }

      // Enhanced password validation
      if (password.length < 8) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' }
        });
      }

      // Check for password complexity (recommended)
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must contain uppercase, lowercase, and number',
            details: {
              hasUppercase,
              hasLowercase,
              hasNumber,
              hasSpecial,
            }
          }
        });
      }

      // Check if first user (gets admin role)
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const isFirstUser = count === 0;

      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return res.status(400).json({
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12); // Increased from 10

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name: name || null,
          role: isFirstUser ? 'admin' : 'user',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Register error:', error);
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
        });
      }

      // Generate tokens (database-backed for persistence)
      const tokenVersion = await getTokenVersionDb(user.id);
      const payload: UserPayload & { version: number } = {
        id: user.id,
        email: user.email,
        role: user.role,
        version: tokenVersion,
      };

      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh', version: tokenVersion },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      res.status(201).json({
        token: accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
      });
    }
  });

  // Get current user
  router.get('/me', authMiddleware(jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, created_at, last_login_at')
        .eq('id', req.user!.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'User not found' }
        });
      }

      res.json({ user });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' }
      });
    }
  });

  // Update password
  router.post('/change-password', authMiddleware(jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Current and new password required' }
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' }
        });
      }

      // Check password complexity
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must contain uppercase, lowercase, and number'
          }
        });
      }

      // Get current user
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user!.id)
        .single();

      if (!user) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'User not found' }
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          error: { code: 'AUTH_ERROR', message: 'Current password is incorrect' }
        });
      }

      // Update password
      const newHash = await bcrypt.hash(newPassword, 12);
      await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', req.user!.id);

      // Invalidate all existing tokens by incrementing version
      incrementTokenVersion(req.user!.id);

      logSecurityEvent('password_changed', {
        userId: req.user!.id,
        ip: req.ip || 'unknown',
      });

      res.json({ message: 'Password updated successfully. Please log in again.' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' }
      });
    }
  });

  // Refresh token
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' }
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtSecret) as { id: string; type: string; version: number };

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          error: { code: 'AUTH_ERROR', message: 'Invalid refresh token' }
        });
      }

      // Check token version
      const currentVersion = getTokenVersion(decoded.id);
      if (decoded.version < currentVersion) {
        return res.status(401).json({
          error: { code: 'AUTH_ERROR', message: 'Refresh token has been invalidated' }
        });
      }

      // Get user data
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, is_active')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({
          error: { code: 'AUTH_ERROR', message: 'User not found' }
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
        });
      }

      // Generate new access token (refresh token rotation - issue new refresh token too)
      const payload: UserPayload & { version: number } = {
        id: user.id,
        email: user.email,
        role: user.role,
        version: currentVersion,
      };

      const newAccessToken = jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
      const newRefreshToken = jwt.sign(
        { id: user.id, type: 'refresh', version: currentVersion },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: { code: 'TOKEN_EXPIRED', message: 'Refresh token has expired' }
        });
      }
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh token' }
      });
    }
  });

  // Logout (invalidate tokens)
  router.post('/logout', authMiddleware(jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Increment token version to invalidate all existing tokens
      incrementTokenVersion(req.user!.id);

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Logout failed' }
      });
    }
  });

  return router;
}
