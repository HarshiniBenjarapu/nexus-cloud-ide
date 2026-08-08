import { Project, FileNode, GitStatus, DatabaseConnection, AIConversation, Deployment } from '../types';

// Users, organizations and workspaces now come from the real API — see
// services/{auth,organization,workspace}.service.ts. The fixtures below still
// back the panels whose backend modules are not built yet (projects, files,
// git, database, AI, deployments) and will be removed as each module lands.

export const mockProjects: Project[] = [
  {
    id: 'proj_react_app',
    workspaceId: 'ws_1',
    name: 'nexus-dashboard-v2',
    description: 'React TypeScript SaaS Dashboard with real-time telemetry',
    template: 'React',
    language: 'TypeScript',
    visibility: 'public',
    gitEnabled: true,
    deploymentEnabled: true,
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-08-04T14:10:00Z',
  },
  {
    id: 'proj_express_api',
    workspaceId: 'ws_1',
    name: 'cloud-gateway-api',
    description: 'Express.js REST API with JWT Auth and MongoDB Mongoose ORM',
    template: 'Express.js',
    language: 'TypeScript',
    visibility: 'private',
    gitEnabled: true,
    deploymentEnabled: true,
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-07-22T14:30:00Z',
    updatedAt: '2026-08-04T11:45:00Z',
  },
  {
    id: 'proj_python_script',
    workspaceId: 'ws_2',
    name: 'code-analyzer-ml',
    description: 'Python AST Code Analysis and Automated Syntax Inspector',
    template: 'Python',
    language: 'Python',
    visibility: 'public',
    gitEnabled: false,
    deploymentEnabled: false,
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-03T15:20:00Z',
  },
];

export const mockFileTree: FileNode[] = [
  {
    id: 'node_src',
    projectId: 'proj_react_app',
    name: 'src',
    path: '/src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'node_app_tsx',
        projectId: 'proj_react_app',
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        extension: 'tsx',
        content: `import React, { useState } from 'react';
import { Terminal, Code, Cpu, Cloud, Zap } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0F1115] text-white p-8 font-sans">
      <header className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#C58A42]/10 border border-[#C58A42]/30 rounded-xl text-[#C58A42]">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Nexus Cloud IDE Platform</h1>
            <p className="text-xs text-[#9DA5B4]">Environment: Production Ready | v1.0.0</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#C58A42] hover:bg-[#D69A4E] text-white font-medium rounded-xl text-sm transition-all shadow-md shadow-[#C58A42]/20">
          Run Project
        </button>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#171A1F] border border-white/10 rounded-2xl">
          <div className="flex items-center text-[#C58A42] space-x-2 mb-4">
            <Code className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Monaco Code Editor</h2>
          </div>
          <p className="text-sm text-[#9DA5B4]">
            Browser-based syntax highlighting, multi-tab editing, split view, and auto-save capabilities.
          </p>
        </div>

        <div className="p-6 bg-[#171A1F] border border-white/10 rounded-2xl">
          <div className="flex items-center text-[#4CAF50] space-x-2 mb-4">
            <Terminal className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Interactive Web Terminal</h2>
          </div>
          <p className="text-sm text-[#9DA5B4]">
            WebSocket-powered shared terminal session executing native commands inside containerized environments.
          </p>
        </div>

        <div className="p-6 bg-[#171A1F] border border-white/10 rounded-2xl">
          <div className="flex items-center text-[#4D8DFF] space-x-2 mb-4">
            <Cpu className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Workspace AI Copilot</h2>
          </div>
          <p className="text-sm text-[#9DA5B4]">
            Context-aware AI developer companion capable of explaining code, generating unit tests, and drafting commits.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;`,
      },
      {
        id: 'node_main_tsx',
        projectId: 'proj_react_app',
        name: 'main.tsx',
        path: '/src/main.tsx',
        type: 'file',
        extension: 'tsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        id: 'node_index_css',
        projectId: 'proj_react_app',
        name: 'index.css',
        path: '/src/index.css',
        type: 'file',
        extension: 'css',
        content: `body {\n  background-color: #0F1115;\n  color: #ffffff;\n}`,
      },
    ],
  },
  {
    id: 'node_package_json',
    projectId: 'proj_react_app',
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    extension: 'json',
    content: `{\n  "name": "nexus-dashboard-v2",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}`,
  },
  {
    id: 'node_readme',
    projectId: 'proj_react_app',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    extension: 'md',
    content: `# Nexus Dashboard v2\n\nBuilt on Nexus Cloud IDE.`,
  },
];

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
