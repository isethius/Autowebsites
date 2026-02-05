const STORAGE_KEY = 'autowebsites.studio.projects';
const SCHEMA_VERSION = 1;

export interface StudioProject<T = unknown> {
  id: string;
  name: string;
  version: number;
  data: T;
  createdAt: string;
  updatedAt: string;
}

export interface StudioProjectExport<T = unknown> {
  schemaVersion: number;
  exportedAt: string;
  projects: StudioProject<T>[];
}

interface StoredProjects<T = unknown> {
  schemaVersion: number;
  projects: StudioProject<T>[];
}

type ImportMode = 'merge' | 'replace';
type ConflictMode = 'overwrite' | 'skip' | 'duplicate';

interface ImportOptions {
  mode?: ImportMode;
  onConflict?: ConflictMode;
}

function getStorage(): Storage {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    throw new Error('localStorage is not available in this environment');
  }
  return globalThis.localStorage;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function generateId(): string {
  const cryptoRef = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `proj_${Date.now().toString(36)}_${random}`;
}

function cloneData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeProject<T>(input: unknown, fallbackId?: string): StudioProject<T> | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const id = typeof record.id === 'string' && record.id.trim().length > 0
    ? record.id
    : (fallbackId || generateId());
  const name = typeof record.name === 'string' && record.name.trim().length > 0
    ? record.name.trim()
    : 'Untitled Project';
  const version = typeof record.version === 'number' && Number.isFinite(record.version)
    ? Math.max(1, Math.floor(record.version))
    : 1;
  const createdAt = typeof record.createdAt === 'string' && record.createdAt.length > 0
    ? record.createdAt
    : new Date().toISOString();
  const updatedAt = typeof record.updatedAt === 'string' && record.updatedAt.length > 0
    ? record.updatedAt
    : createdAt;
  const data = ('data' in record ? record.data : null) as T;

  return {
    id,
    name,
    version,
    data,
    createdAt,
    updatedAt,
  };
}

function loadStore<T>(): StoredProjects<T> {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return { schemaVersion: SCHEMA_VERSION, projects: [] };
  }

  const parsed = safeJsonParse<StoredProjects<T>>(raw);
  if (!parsed || !Array.isArray(parsed.projects)) {
    return { schemaVersion: SCHEMA_VERSION, projects: [] };
  }

  const projects = parsed.projects
    .map((project) => normalizeProject<T>(project))
    .filter((project): project is StudioProject<T> => !!project);

  return {
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : SCHEMA_VERSION,
    projects,
  };
}

function saveStore<T>(store: StoredProjects<T>): void {
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function persistProjects<T>(projects: StudioProject<T>[]): void {
  saveStore({
    schemaVersion: SCHEMA_VERSION,
    projects,
  });
}

function findProjectIndex<T>(projects: StudioProject<T>[], id: string): number {
  return projects.findIndex(project => project.id === id);
}

function applyConflictStrategy<T>(
  existing: StudioProject<T>[],
  incoming: StudioProject<T>,
  conflictMode: ConflictMode
): StudioProject<T>[] {
  const index = findProjectIndex(existing, incoming.id);

  if (index === -1) {
    return [...existing, incoming];
  }

  if (conflictMode === 'skip') {
    return existing;
  }

  if (conflictMode === 'duplicate') {
    const duplicated = {
      ...incoming,
      id: generateId(),
      name: `${incoming.name} Copy`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [...existing, duplicated];
  }

  const updated = [...existing];
  updated[index] = incoming;
  return updated;
}

export function listProjects<T = unknown>(): StudioProject<T>[] {
  const store = loadStore<T>();
  return [...store.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject<T = unknown>(id: string): StudioProject<T> | null {
  const store = loadStore<T>();
  const project = store.projects.find(item => item.id === id);
  return project ? { ...project } : null;
}

export function createProject<T = unknown>(
  name: string,
  data: T,
  options: { id?: string; version?: number } = {}
): StudioProject<T> {
  const store = loadStore<T>();
  const now = new Date().toISOString();
  const project: StudioProject<T> = {
    id: options.id || generateId(),
    name: name.trim().length > 0 ? name.trim() : 'Untitled Project',
    version: options.version && Number.isFinite(options.version) ? Math.max(1, Math.floor(options.version)) : 1,
    data,
    createdAt: now,
    updatedAt: now,
  };

  persistProjects([...store.projects, project]);
  return { ...project };
}

export function updateProject<T = unknown>(
  id: string,
  updates: {
    name?: string;
    data?: T;
    version?: number;
    bumpVersion?: boolean;
  }
): StudioProject<T> | null {
  const store = loadStore<T>();
  const index = findProjectIndex(store.projects, id);

  if (index === -1) {
    return null;
  }

  const existing = store.projects[index];
  const shouldBump = updates.bumpVersion ?? ('name' in updates || 'data' in updates);
  const version = typeof updates.version === 'number' && Number.isFinite(updates.version)
    ? Math.max(1, Math.floor(updates.version))
    : (shouldBump ? existing.version + 1 : existing.version);

  const updated: StudioProject<T> = {
    ...existing,
    name: typeof updates.name === 'string'
      ? (updates.name.trim().length > 0 ? updates.name.trim() : existing.name)
      : existing.name,
    data: 'data' in updates ? (updates.data as T) : existing.data,
    version,
    updatedAt: new Date().toISOString(),
  };

  const projects = [...store.projects];
  projects[index] = updated;
  persistProjects(projects);
  return { ...updated };
}

export function deleteProject(id: string): boolean {
  const store = loadStore();
  const projects = store.projects.filter(project => project.id !== id);
  if (projects.length === store.projects.length) {
    return false;
  }
  persistProjects(projects);
  return true;
}

export function duplicateProject<T = unknown>(
  id: string,
  options: { name?: string; version?: number } = {}
): StudioProject<T> | null {
  const store = loadStore<T>();
  const original = store.projects.find(project => project.id === id);
  if (!original) {
    return null;
  }

  const now = new Date().toISOString();
  const duplicated: StudioProject<T> = {
    ...original,
    id: generateId(),
    name: options.name && options.name.trim().length > 0 ? options.name.trim() : `${original.name} Copy`,
    version: options.version && Number.isFinite(options.version) ? Math.max(1, Math.floor(options.version)) : 1,
    data: cloneData(original.data),
    createdAt: now,
    updatedAt: now,
  };

  persistProjects([...store.projects, duplicated]);
  return { ...duplicated };
}

export function exportProjects<T = unknown>(): string {
  const store = loadStore<T>();
  const payload: StudioProjectExport<T> = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    projects: store.projects,
  };

  return JSON.stringify(payload, null, 2);
}

export function exportProject<T = unknown>(id: string): string | null {
  const project = getProject<T>(id);
  if (!project) {
    return null;
  }
  const payload: StudioProjectExport<T> = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    projects: [project],
  };
  return JSON.stringify(payload, null, 2);
}

export function importProjects<T = unknown>(
  input: string,
  options: ImportOptions = {}
): { imported: StudioProject<T>[]; skipped: number } {
  const parsed = safeJsonParse<unknown>(input);
  if (!parsed) {
    throw new Error('Invalid JSON payload');
  }

  let incomingProjects: StudioProject<T>[] = [];

  if (Array.isArray(parsed)) {
    incomingProjects = parsed
      .map((project) => normalizeProject<T>(project))
      .filter((project): project is StudioProject<T> => !!project);
  } else if (parsed && typeof parsed === 'object' && 'projects' in parsed) {
    const payload = parsed as StudioProjectExport<T>;
    if (Array.isArray(payload.projects)) {
      incomingProjects = payload.projects
        .map((project) => normalizeProject<T>(project))
        .filter((project): project is StudioProject<T> => !!project);
    }
  } else {
    const single = normalizeProject<T>(parsed);
    if (single) {
      incomingProjects = [single];
    }
  }

  if (incomingProjects.length === 0) {
    return { imported: [], skipped: 0 };
  }

  const mode: ImportMode = options.mode || 'merge';
  const conflictMode: ConflictMode = options.onConflict || 'overwrite';
  const store = loadStore<T>();
  let projects = mode === 'replace' ? [] : [...store.projects];
  let skipped = 0;

  for (const incoming of incomingProjects) {
    const beforeLength = projects.length;
    projects = applyConflictStrategy(projects, incoming, conflictMode);
    if (projects.length === beforeLength && conflictMode === 'skip') {
      skipped += 1;
    }
  }

  persistProjects(projects);
  return { imported: incomingProjects, skipped };
}

export function clearProjects(): void {
  persistProjects([]);
}
