// ─── Server-backed types ─────────────────────────────────────────────────────
// These mirror the live API responses. Mongo documents are returned with `_id`;
// only the auth endpoints project the user down to `id`.

// User Types
export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  authProvider: 'email' | 'google' | 'github';
  emailVerified: boolean;
  createdAt: string;
}

// Organization-scoped role (SRS 2.7). There is no global user role — authority
// is always relative to an organization.
export type OrgRole = 'Owner' | 'Admin' | 'Maintainer' | 'Developer' | 'Viewer';

// Organization Types
export interface Organization {
  _id: string;
  name: string;
  slug: string;
  logo?: string | null;
  ownerId: string;
  plan: 'free' | 'pro';
  /** The authenticated user's role in this organization. */
  memberRole: OrgRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  _id: string;
  organizationId: string;
  userId: Pick<User, 'id' | 'fullName' | 'username' | 'email' | 'avatar'>;
  role: OrgRole;
  joinedAt: string;
}

// Workspace Types
export interface Workspace {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  terminalEnabled: boolean;
  aiEnabled: boolean;
  createdBy: string | Pick<User, 'id' | 'fullName' | 'username' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

// ─── Projects & Files (Modules 4 & 6) ────────────────────────────────────────

export type SupportedTemplate =
  | 'HTML'
  | 'CSS'
  | 'JavaScript'
  | 'React'
  | 'Next.js'
  | 'Node.js'
  | 'Express.js'
  | 'React + Express'
  | 'Python'
  | 'Java'
  | 'C++'
  | 'Empty';

/** Every template the backend accepts, in the order the picker shows them. */
export const SUPPORTED_TEMPLATES: SupportedTemplate[] = [
  'React',
  'Next.js',
  'React + Express',
  'Express.js',
  'Node.js',
  'JavaScript',
  'HTML',
  'CSS',
  'Python',
  'Java',
  'C++',
  'Empty',
];

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  description: string;
  template: SupportedTemplate;
  language: string;
  visibility: 'public' | 'private';
  gitEnabled: boolean;
  deploymentEnabled: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdBy: string | Pick<User, 'id' | 'fullName' | 'username' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

/**
 * A node in the project file tree.
 *
 * `path` is the identity — it is project-relative, POSIX, and unique, so the UI
 * keys off it rather than inventing client-side ids. Content is fetched per file
 * on demand and is never part of the tree.
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Editor Tab
export interface EditorTab {
  id: string;
  /** Project this tab's file belongs to, so tabs survive project switches. */
  projectId: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isUnsaved: boolean;
}

// ─── Mock-backed types ───────────────────────────────────────────────────────
// Still served from services/mockData until their own milestones land.

// Git Integration Types
export interface GitFileStatus {
  path: string;
  status: 'modified' | 'staged' | 'untracked' | 'deleted' | 'added';
}

export interface GitStatus {
  currentBranch: string;
  branches: string[];
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  date: string;
  hash: string;
}

// Database Connection
export interface DatabaseConnection {
  id: string;
  workspaceId: string;
  name: string;
  provider: 'MongoDB' | 'PostgreSQL' | 'SQLite';
  host?: string;
  port?: number;
  databaseName: string;
  username?: string;
  status: 'connected' | 'disconnected' | 'error';
}

// AI Conversation
export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface AIConversation {
  id: string;
  workspaceId: string;
  title: string;
  messages: AIMessage[];
  updatedAt: string;
}

// Deployment Types
export interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  provider: 'Vercel' | 'Docker' | 'GitHub Pages';
  status: 'queued' | 'building' | 'live' | 'failed';
  liveUrl?: string;
  buildLogs: string[];
  createdAt: string;
}

// API Response Format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
