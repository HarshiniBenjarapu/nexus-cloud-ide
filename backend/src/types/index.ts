import { ProjectTemplate } from './templates';
import { OrgRole } from './roles';

/**
 * API response shapes for Modules 4 & 6.
 *
 * Declared explicitly so controllers cannot accidentally leak internal fields
 * (absolute disk paths, soft-delete markers) into a response.
 */

export interface ProjectDTO {
  _id: string;
  workspaceId: string;
  name: string;
  description: string;
  template: ProjectTemplate;
  language: string;
  visibility: 'public' | 'private';
  gitEnabled: boolean;
  deploymentEnabled: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileNodeDTO {
  name: string;
  /** Project-relative POSIX path. Absolute paths are never returned. */
  path: string;
  type: 'file' | 'folder';
  children?: FileNodeDTO[];
}

export interface FileContentDTO {
  path: string;
  content: string;
  size: number;
  updatedAt: string | null;
}

/** Echoed on project/file responses so the client can gate its own UI. */
export interface WithMemberRole {
  memberRole: OrgRole;
}
