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

// ─── Mock-backed types ───────────────────────────────────────────────────────
// Still served from services/mockData until their own milestones land.

// Project Types
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

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  template: SupportedTemplate;
  language: string;
  visibility: 'public' | 'private';
  gitEnabled: boolean;
  deploymentEnabled: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// File Explorer Node
export interface FileNode {
  id: string;
  projectId: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  isUnsaved?: boolean;
}

// Editor Tab
export interface EditorTab {
  id: string;
  fileId: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isUnsaved: boolean;
}

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
