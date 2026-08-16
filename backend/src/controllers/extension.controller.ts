import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const MOCK_EXTENSIONS = [
  {
    id: 'ext_prettier',
    name: 'Prettier - Code Formatter',
    publisher: 'Prettier',
    description: 'Opinionated code formatter supporting TypeScript, JavaScript, HTML, CSS, JSON, and Markdown.',
    version: '3.2.5',
    downloads: '42.8M',
    rating: 4.9,
    category: 'Linters',
    installed: true,
  },
  {
    id: 'ext_eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    description: 'Integrates ESLint JavaScript into Monaco Editor for real-time error reporting and fixers.',
    version: '2.4.4',
    downloads: '31.2M',
    rating: 4.8,
    category: 'Linters',
    installed: true,
  },
  {
    id: 'ext_python',
    name: 'Python IntelliSense & Debugger',
    publisher: 'Microsoft',
    description: 'Rich support for the Python language with IntelliSense, linting, debugging, code navigation.',
    version: '2024.2.0',
    downloads: '104M',
    rating: 4.7,
    category: 'Programming Languages',
    installed: false,
  },
  {
    id: 'ext_docker',
    name: 'Docker Tools',
    publisher: 'Microsoft',
    description: 'Makes it easy to build, manage, and deploy containerized applications from Nexus Cloud IDE.',
    version: '1.29.0',
    downloads: '28.5M',
    rating: 4.8,
    category: 'DevOps',
    installed: false,
  },
  {
    id: 'ext_tailwind',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    description: 'Intelligent Tailwind CSS tooling for Monaco Editor including autocomplete and syntax highlighting.',
    version: '0.10.5',
    downloads: '14.1M',
    rating: 4.9,
    category: 'Formatters',
    installed: true,
  },
  {
    id: 'ext_gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    description: 'Supercharge Git capabilities inside Nexus Cloud IDE with authorship annotations and commit graphs.',
    version: '15.0.1',
    downloads: '29.3M',
    rating: 4.9,
    category: 'Source Control',
    installed: false,
  },
];

export const getExtensions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ status: 'success', data: MOCK_EXTENSIONS });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch extensions' });
  }
};

export const toggleExtensionInstall = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ext = MOCK_EXTENSIONS.find((e) => e.id === id);
    if (!ext) {
      res.status(404).json({ status: 'error', message: 'Extension not found' });
      return;
    }
    ext.installed = !ext.installed;
    res.json({ status: 'success', data: ext });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to toggle extension status' });
  }
};
