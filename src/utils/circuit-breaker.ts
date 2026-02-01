import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation - requests pass through
  OPEN = 'OPEN',         // Failing - requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing - limited requests allowed
}

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Time in ms to wait before half-open
  resetTimeout?: number;         // Time in ms before failure count resets (default: 60s)
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: Partial<CircuitBreakerConfig> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  resetTimeout: 60000, // 1 minute
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<CircuitBreakerConfig>;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttempt && new Date() >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(this.config.name, this.nextAttempt);
      }
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failures = 0;
    }
  }

  private onFailure(error: Error): void {
    this.lastFailureTime = new Date();
    this.totalFailures++;
    this.failures++;

    logger.warn(`Circuit breaker ${this.config.name} recorded failure`, {
      circuitName: this.config.name,
      state: this.state,
      failures: this.failures,
      threshold: this.config.failureThreshold,
      error: error.message,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    logger.info(`Circuit breaker ${this.config.name} state change`, {
      circuitName: this.config.name,
      from: oldState,
      to: newState,
    });

    switch (newState) {
      case CircuitState.OPEN:
        this.nextAttempt = new Date(Date.now() + this.config.timeout);
        this.successes = 0;
        break;
      case CircuitState.HALF_OPEN:
        this.successes = 0;
        break;
      case CircuitState.CLOSED:
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = undefined;
        break;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = undefined;
    logger.info(`Circuit breaker ${this.config.name} manually reset`);
  }
}

// Custom error for circuit open state
export class CircuitOpenError extends Error {
  constructor(
    public circuitName: string,
    public nextAttempt?: Date
  ) {
    const retryIn = nextAttempt
      ? Math.ceil((nextAttempt.getTime() - Date.now()) / 1000)
      : 'unknown';
    super(`Circuit breaker '${circuitName}' is OPEN. Retry in ${retryIn}s`);
    this.name = 'CircuitOpenError';
  }
}

// Circuit breaker registry for managing multiple breakers
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    let breaker = this.breakers.get(config.name);
    if (!breaker) {
      breaker = new CircuitBreaker(config);
      this.breakers.set(config.name, breaker);
    }
    return breaker;
  }

  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.values()).map(b => b.getStats());
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Pre-configured circuit breakers for common services
export const circuitBreakers = {
  anthropic: circuitBreakerRegistry.getOrCreate({
    name: 'anthropic',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000, // 1 minute
  }),

  stripe: circuitBreakerRegistry.getOrCreate({
    name: 'stripe',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000, // 30 seconds
  }),

  googlePlaces: circuitBreakerRegistry.getOrCreate({
    name: 'google-places',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000, // 30 seconds
  }),

  supabase: circuitBreakerRegistry.getOrCreate({
    name: 'supabase',
    failureThreshold: 10, // More lenient for database
    successThreshold: 3,
    timeout: 15000, // 15 seconds
  }),
};

// Helper function for wrapping async functions with circuit breaker
export function withCircuitBreaker<T>(
  breaker: CircuitBreaker,
  fn: () => Promise<T>
): Promise<T> {
  return breaker.execute(fn);
}

export default CircuitBreaker;
