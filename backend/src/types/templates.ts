import { OrgRole } from './roles';

/**
 * Supported project templates (SRS Module 4 / 6.9).
 * Future templates may be added here without affecting existing projects.
 */
export const PROJECT_TEMPLATES = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'Express.js',
  'React + Express',
  'Python',
  'Java',
  'C++',
  'Empty',
] as const;

export type ProjectTemplate = (typeof PROJECT_TEMPLATES)[number];

/** Default language recorded on the project for each template. */
export const TEMPLATE_LANGUAGE: Record<ProjectTemplate, string> = {
  HTML: 'HTML',
  CSS: 'CSS',
  JavaScript: 'JavaScript',
  React: 'TypeScript',
  'Next.js': 'TypeScript',
  'Node.js': 'JavaScript',
  'Express.js': 'JavaScript',
  'React + Express': 'TypeScript',
  Python: 'Python',
  Java: 'Java',
  'C++': 'C++',
  Empty: '',
};

// ─── Project permissions (SRS 2.7) ───────────────────────────────────────────

/**
 * Create, rename, duplicate, archive and delete projects.
 *
 * SRS 2.7 grants "create projects" to Developer and above, and project
 * maintenance to Maintainer. Viewer is read-only and is the only role excluded.
 */
export const PROJECT_CONTRIBUTORS: OrgRole[] = [
  'Owner',
  'Admin',
  'Maintainer',
  'Developer',
];

/**
 * Edit file contents and the file tree.
 * Same set as above — SRS 2.7 gives Developer "edit code" and Viewer read-only.
 */
export const FILE_EDITORS: OrgRole[] = PROJECT_CONTRIBUTORS;
