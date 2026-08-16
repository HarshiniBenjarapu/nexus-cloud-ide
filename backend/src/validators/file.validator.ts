import Joi from 'joi';

/**
 * Validation schemas for Module 6 — File Explorer.
 *
 * These enforce request *shape* only. Path safety is decided by
 * utils/pathGuard, which every controller and the storage service both apply —
 * validation here is a convenience, never the security boundary.
 */

const relativePath = Joi.string().trim().max(1024).messages({
  'string.empty': 'A file path is required.',
  'string.max': 'File path cannot exceed 1024 characters.',
});

/** A single file or folder name — separators are rejected by pathGuard. */
const entryName = Joi.string().trim().min(1).max(255).messages({
  'string.empty': 'A name is required.',
  'string.max': 'Name cannot exceed 255 characters.',
});

/** ?path=… on read/stat routes. Omitted or empty means the project root. */
export const filePathQuerySchema = Joi.object({
  path: relativePath.allow('').default(''),
});

export const readFileQuerySchema = Joi.object({
  path: relativePath.required(),
});

export const createEntrySchema = Joi.object({
  // Parent folder, project-relative. Empty string is the project root.
  parentPath: relativePath.allow('').default(''),
  name: entryName.required(),
  type: Joi.string().valid('file', 'folder').required().messages({
    'any.only': 'Type must be either "file" or "folder".',
    'any.required': 'Type is required.',
  }),
  // Only meaningful for files; ignored for folders.
  content: Joi.string().allow('').max(5 * 1024 * 1024).messages({
    'string.max': 'File content cannot exceed 5 MB.',
  }),
});

export const writeFileSchema = Joi.object({
  path: relativePath.required(),
  content: Joi.string()
    .allow('')
    .max(5 * 1024 * 1024)
    .required()
    .messages({
      'string.max': 'File content cannot exceed 5 MB.',
      'any.required': 'File content is required.',
    }),
});

export const renameEntrySchema = Joi.object({
  path: relativePath.required(),
  // Rename only — the entry stays in its current folder. Moves are out of
  // scope for Version 1 (SRS Module 6: no drag-and-drop).
  newName: entryName.required(),
});

export const deleteEntrySchema = Joi.object({
  path: relativePath.required(),
});

export const duplicateEntrySchema = Joi.object({
  path: relativePath.required(),
  // Optional; the controller derives "name copy.ext" when omitted.
  newName: entryName.optional(),
});
