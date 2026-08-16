import path from 'path';

/**
 * Path containment for project file operations (SRS 4.11 — Secure file handling).
 *
 * Every client-supplied path is untrusted. These helpers normalize it and prove
 * the result stays inside the project's own directory before any fs call runs.
 * This is the first of two layers; storage.service.ts re-verifies independently.
 */

export class PathTraversalError extends Error {
  statusCode = 400;

  constructor(message = 'Invalid file path.') {
    super(message);
    this.name = 'PathTraversalError';
  }
}

/** Characters that are illegal in a single path segment. */
// eslint-disable-next-line no-control-regex
const ILLEGAL_SEGMENT_CHARS = /[<>:"\\|?*\u0000-\u001f]/;

const RESERVED_SEGMENTS = new Set(['..', '.git']);

/**
 * Normalize an untrusted relative path to a safe, POSIX-style project path.
 *
 * Rejects absolute paths, parent traversal, NUL bytes, Windows drive letters,
 * backslash separators and reserved segments. Returns '' for the project root.
 */
export const normalizeRelativePath = (input: string): string => {
  if (typeof input !== 'string') {
    throw new PathTraversalError();
  }

  // Reject before normalization so encoded traversal cannot be smuggled through
  if (input.includes('\u0000')) {
    throw new PathTraversalError('File path contains an invalid character.');
  }

  // Windows absolute paths and UNC shares
  if (/^[a-zA-Z]:/.test(input) || input.startsWith('\\\\')) {
    throw new PathTraversalError('Absolute file paths are not permitted.');
  }

  // Treat backslash as a separator so mixed separators cannot bypass checks
  const unified = input.replace(/\\/g, '/').trim();

  if (unified.startsWith('/')) {
    throw new PathTraversalError('Absolute file paths are not permitted.');
  }

  // '.' segments are meaningless but harmless ('./src/x' === 'src/x'); drop them.
  const segments = unified
    .split('/')
    .filter((segment) => segment.length > 0 && segment !== '.');

  for (const segment of segments) {
    if (RESERVED_SEGMENTS.has(segment)) {
      throw new PathTraversalError('File path contains a reserved segment.');
    }
    if (ILLEGAL_SEGMENT_CHARS.test(segment)) {
      throw new PathTraversalError('File path contains an invalid character.');
    }
    if (segment.length > 255) {
      throw new PathTraversalError('File or folder name is too long.');
    }
  }

  // No segments means the project root, which is a valid target for listing.
  if (segments.length === 0) {
    return '';
  }

  const normalized = path.posix.normalize(segments.join('/'));

  // normalize() can still surface '..' if the input was crafted; fail closed.
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new PathTraversalError();
  }

  return normalized;
};

/**
 * Resolve an untrusted relative path against a project root and prove the
 * result is contained within it.
 *
 * The containment check compares resolved absolute paths, so it holds even if
 * normalizeRelativePath were ever bypassed.
 */
export const resolveWithinRoot = (rootDir: string, relativePath: string): string => {
  const safeRelative = normalizeRelativePath(relativePath);
  const resolvedRoot = path.resolve(rootDir);
  const resolved = path.resolve(resolvedRoot, safeRelative);

  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new PathTraversalError();
  }

  return resolved;
};

/** Validate a single file or folder name (no separators allowed). */
export const assertValidName = (name: string): string => {
  const trimmed = String(name ?? '').trim();

  if (!trimmed) {
    throw new PathTraversalError('A name is required.');
  }
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    throw new PathTraversalError('A name cannot contain path separators.');
  }
  if (RESERVED_SEGMENTS.has(trimmed) || ILLEGAL_SEGMENT_CHARS.test(trimmed)) {
    throw new PathTraversalError('That name is not permitted.');
  }
  if (trimmed.length > 255) {
    throw new PathTraversalError('That name is too long.');
  }

  return trimmed;
};
