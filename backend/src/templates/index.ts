import { ProjectTemplate } from '../types/templates';

/**
 * Template scaffolding (SRS Module 4 — Supported Project Templates).
 *
 * Each template is a flat list of relative paths and their starting contents.
 * Directories are created implicitly from the path segments. Kept deliberately
 * minimal: enough to be a runnable starting point without pretending to be a
 * full framework install (dependencies are not vendored).
 */

export interface TemplateFile {
  path: string;
  content: string;
}

const README = (name: string, body: string): TemplateFile => ({
  path: 'README.md',
  content: `# ${name}\n\n${body}\n`,
});

const GITIGNORE: TemplateFile = {
  path: '.gitignore',
  content: 'node_modules/\ndist/\n.env\n*.log\n',
};

export const buildTemplateFiles = (
  template: ProjectTemplate,
  projectName: string
): TemplateFile[] => {
  switch (template) {
    case 'HTML':
      return [
        {
          path: 'index.html',
          content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>${projectName}</h1>
    <p>Edit index.html to get started.</p>
    <script src="script.js"></script>
  </body>
</html>
`,
        },
        {
          path: 'styles.css',
          content: `body {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n}\n`,
        },
        { path: 'script.js', content: `console.log('${projectName} ready');\n` },
        README(projectName, 'A static HTML project.'),
      ];

    case 'CSS':
      return [
        {
          path: 'index.html',
          content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="card">
      <h1>${projectName}</h1>
    </div>
  </body>
</html>
`,
        },
        {
          path: 'styles.css',
          content: `:root {\n  --accent: #C58A42;\n}\n\n.card {\n  padding: 24px;\n  border-radius: 12px;\n  border: 1px solid rgba(0, 0, 0, 0.08);\n}\n`,
        },
        README(projectName, 'A CSS-focused project.'),
      ];

    case 'JavaScript':
      return [
        {
          path: 'index.html',
          content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="main.js"></script>
  </body>
</html>
`,
        },
        {
          path: 'main.js',
          content: `const app = document.querySelector('#app');\napp.textContent = 'Hello from ${projectName}';\n`,
        },
        README(projectName, 'A vanilla JavaScript project.'),
      ];

    case 'React':
      return [
        {
          path: 'package.json',
          content: `{
  "name": "${slug(projectName)}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.0",
    "vite": "^8.2.0",
    "@vitejs/plugin-react": "^6.0.0"
  }
}
`,
        },
        {
          path: 'index.html',
          content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
        },
        {
          path: 'src/main.tsx',
          content: `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n`,
        },
        {
          path: 'src/App.tsx',
          content: `export default function App() {\n  return <h1>${projectName}</h1>;\n}\n`,
        },
        GITIGNORE,
        README(projectName, 'A React + TypeScript project.'),
      ];

    case 'Next.js':
      return [
        {
          path: 'package.json',
          content: `{
  "name": "${slug(projectName)}",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
`,
        },
        {
          path: 'app/page.tsx',
          content: `export default function Home() {\n  return <main><h1>${projectName}</h1></main>;\n}\n`,
        },
        {
          path: 'app/layout.tsx',
          content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`,
        },
        GITIGNORE,
        README(projectName, 'A Next.js application.'),
      ];

    case 'Node.js':
      return [
        {
          path: 'package.json',
          content: `{
  "name": "${slug(projectName)}",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
`,
        },
        {
          path: 'index.js',
          content: `console.log('${projectName} is running');\n`,
        },
        GITIGNORE,
        README(projectName, 'A Node.js project.'),
      ];

    case 'Express.js':
      return [
        {
          path: 'package.json',
          content: `{
  "name": "${slug(projectName)}",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
`,
        },
        {
          path: 'server.js',
          content: `const express = require('express');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Welcome to ${projectName}' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server listening on port \${PORT}\`);\n});\n`,
        },
        GITIGNORE,
        README(projectName, 'An Express.js REST API.'),
      ];

    case 'React + Express':
      return [
        {
          path: 'client/package.json',
          content: `{
  "name": "${slug(projectName)}-client",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.0",
    "vite": "^8.2.0",
    "@vitejs/plugin-react": "^6.0.0"
  }
}
`,
        },
        {
          path: 'client/src/App.tsx',
          content: `export default function App() {\n  return <h1>${projectName}</h1>;\n}\n`,
        },
        {
          path: 'server/package.json',
          content: `{
  "name": "${slug(projectName)}-server",
  "main": "server.js",
  "dependencies": {
    "express": "^4.19.2"
  }
}
`,
        },
        {
          path: 'server/server.js',
          content: `const express = require('express');\n\nconst app = express();\napp.get('/api/health', (req, res) => res.json({ ok: true }));\napp.listen(3001, () => console.log('API on 3001'));\n`,
        },
        GITIGNORE,
        README(projectName, 'A React client with an Express API server.'),
      ];

    case 'Python':
      return [
        {
          path: 'main.py',
          content: `def main() -> None:\n    print("${projectName} is running")\n\n\nif __name__ == "__main__":\n    main()\n`,
        },
        {
          path: 'requirements.txt',
          content: '# Install dependencies with: pip install -r requirements.txt\nrequests>=2.32.0\n',
        },
        {
          path: '.gitignore',
          content: '__pycache__/\n*.pyc\n.venv/\n.env\n',
        },
        README(projectName, 'A Python project.'),
      ];

    case 'Java':
      return [
        {
          path: 'src/Main.java',
          content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("${projectName} is running");\n    }\n}\n`,
        },
        { path: '.gitignore', content: '*.class\nout/\ntarget/\n' },
        README(projectName, 'A Java project. Compile with `javac src/Main.java`.'),
      ];

    case 'C++':
      return [
        {
          path: 'main.cpp',
          content: `#include <iostream>\n\nint main() {\n    std::cout << "${projectName} is running" << std::endl;\n    return 0;\n}\n`,
        },
        {
          path: 'Makefile',
          content: `all:\n\tg++ -std=c++17 -o app main.cpp\n\nclean:\n\trm -f app\n`,
        },
        { path: '.gitignore', content: 'app\n*.o\n' },
        README(projectName, 'A C++ project. Build with `make`.'),
      ];

    case 'Empty':
    default:
      return [README(projectName, 'An empty project. Add your first file to begin.')];
  }
};

/** npm-safe package name derived from the project name. */
const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
