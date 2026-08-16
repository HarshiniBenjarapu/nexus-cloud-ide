import { GitStatus, DatabaseConnection, AIConversation, Deployment } from '../types';

// Users, organizations, workspaces, projects and files now come from the real
// API — see services/{auth,organization,workspace,project,file}.service.ts. The
// fixtures below still back the panels whose backend modules are not built yet
// (git, database, AI, deployments) and will be removed as each module lands.

export const mockGitStatus: GitStatus = {
  currentBranch: 'main',
  branches: ['main', 'feature/ai-assistant', 'bugfix/sidebar-collapse'],
  ahead: 1,
  behind: 0,
  files: [
    { path: '/src/App.tsx', status: 'modified' },
    { path: '/src/components/Header.tsx', status: 'added' },
    { path: '/README.md', status: 'staged' },
  ],
};

export const mockDatabases: DatabaseConnection[] = [
  {
    id: 'db_mongo',
    workspaceId: 'ws_1',
    name: 'MongoDB Production Atlas',
    provider: 'MongoDB',
    host: 'cluster0.mongodb.net',
    port: 27017,
    databaseName: 'nexus_cloud_db',
    status: 'connected',
  },
  {
    id: 'db_pg',
    workspaceId: 'ws_1',
    name: 'PostgreSQL Analytics DB',
    provider: 'PostgreSQL',
    host: 'db.nexus-cloud.internal',
    port: 5432,
    databaseName: 'telemetry_db',
    status: 'connected',
  },
];

export const mockAIConversation: AIConversation = {
  id: 'conv_1',
  workspaceId: 'ws_1',
  title: 'React Layout Optimization & Error Handling',
  messages: [
    {
      id: 'msg_1',
      sender: 'user',
      content: 'How can I optimize the Monaco Editor layout and prevent re-renders when switching tabs?',
      timestamp: '14:20',
    },
    {
      id: 'msg_2',
      sender: 'assistant',
      content: 'You can wrap the Monaco Editor instance in a `React.memo` or use `useCallback` for file change handlers. Here is an optimized setup snippet:',
      timestamp: '14:21',
      codeSnippet: {
        language: 'typescript',
        code: `const memoizedOnMount = useCallback((editor: any) => {\n  editor.focus();\n}, []);`,
      },
    },
  ],
  updatedAt: '14:21',
};

export const mockDeployments: Deployment[] = [
  {
    id: 'dep_1',
    projectId: 'proj_react_app',
    projectName: 'nexus-dashboard-v2',
    provider: 'Vercel',
    status: 'live',
    liveUrl: 'https://nexus-dashboard-v2.vercel.app',
    buildLogs: [
      'Building production bundle...',
      'TypeScript compilation completed with 0 errors.',
      'Optimizing CSS assets (12.4 kB).',
      'Deployment live at https://nexus-dashboard-v2.vercel.app',
    ],
    createdAt: '2026-08-04T13:45:00Z',
  },
];
