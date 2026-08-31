import path from 'path';
import { ProjectTemplate } from '../types/templates';

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

/** npm-safe package name derived from the project name. */
const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';

export const buildTemplateFiles = (
  rawTemplate: ProjectTemplate | string,
  projectName: string
): TemplateFile[] => {
  const norm = String(rawTemplate || '').trim().toLowerCase();

  if (norm.includes('html')) {
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
    <div class="container">
      <h1>Welcome to ${projectName}</h1>
      <p>Your cloud environment is ready. Edit index.html to begin!</p>
    </div>
    <script src="script.js"></script>
  </body>
</html>
`,
      },
      {
        path: 'styles.css',
        content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 2rem;
  background-color: #0F1115;
  color: #FFFFFF;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #171A1F;
}

h1 {
  color: #C58A42;
}
`,
      },
      { path: 'script.js', content: `console.log('${projectName} static HTML app initialized.');\n` },
      README(projectName, 'A static HTML project created with Nexus Cloud IDE.'),
    ];
  }

  if (norm.includes('css')) {
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
      <p>Styled with modern CSS.</p>
    </div>
  </body>
</html>
`,
      },
      {
        path: 'styles.css',
        content: `:root {
  --accent: #C58A42;
  --bg: #0F1115;
}

body {
  background-color: var(--bg);
  color: white;
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.card {
  padding: 32px;
  border-radius: 16px;
  background: #171A1F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
`,
      },
      README(projectName, 'A CSS design project.'),
    ];
  }

  if (norm.includes('react') && norm.includes('express')) {
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
    "vite": "^8.2.0"
  }
}
`,
      },
      {
        path: 'client/src/App.tsx',
        content: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>${projectName} Fullstack</h1>
      <p>React Frontend + Express API Server</p>
    </div>
  );
}
`,
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
        content: `const express = require('express');
const app = express();

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: '${projectName}' }));
app.listen(3001, () => console.log('API Server running on port 3001'));
`,
      },
      GITIGNORE,
      README(projectName, 'Fullstack React client + Express API project.'),
    ];
  }

  if (norm.includes('react')) {
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
        content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
      },
      {
        path: 'src/App.tsx',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#0F1115', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#C58A42' }}>${projectName}</h1>
      <p>React + TypeScript project running in Nexus Cloud IDE.</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#C58A42', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Count is: {count}
      </button>
    </div>
  );
}
`,
      },
      GITIGNORE,
      README(projectName, 'A React + TypeScript project created in Nexus Cloud IDE.'),
    ];
  }

  if (norm.includes('next')) {
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
        content: `export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome to ${projectName}</h1>
      <p>Next.js App Router application built on Nexus Cloud IDE.</p>
    </main>
  );
}
`,
      },
      {
        path: 'app/layout.tsx',
        content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
      },
      GITIGNORE,
      README(projectName, 'A Next.js application.'),
    ];
  }

  if (norm.includes('express')) {
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
        content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${projectName} API', status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`[Server] Listening on port \${PORT}\`);
});
`,
      },
      GITIGNORE,
      README(projectName, 'An Express.js REST API.'),
    ];
  }

  if (norm.includes('node') || norm.includes('js') || norm.includes('javascript')) {
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
        content: `console.log('${projectName} is running!');\n\nfunction init() {\n  console.log('Nexus Cloud IDE Node.js execution ready.');\n}\n\ninit();\n`,
      },
      GITIGNORE,
      README(projectName, 'A Node.js project.'),
    ];
  }

  if (norm.includes('py') || norm.includes('python')) {
    return [
      {
        path: 'main.py',
        content: `def main() -> None:
    print("${projectName} Python project is running!")

if __name__ == "__main__":
    main()
`,
      },
      { path: 'requirements.txt', content: '# Add Python dependencies here\n' },
      {
        path: '.gitignore',
        content: '__pycache__/\n*.pyc\n.venv/\n.env\n',
      },
      README(projectName, 'A Python application.'),
    ];
  }

  if (norm.includes('java')) {
    return [
      {
        path: 'src/Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("${projectName} Java project running!");
    }
}
`,
      },
      { path: '.gitignore', content: '*.class\nout/\ntarget/\n' },
      README(projectName, 'A Java project.'),
    ];
  }

  if (norm.includes('c++') || norm.includes('cpp') || norm.includes('c')) {
    return [
      {
        path: 'main.cpp',
        content: `#include <iostream>

int main() {
    std::cout << "${projectName} C++ project running!" << std::endl;
    return 0;
}
`,
      },
      {
        path: 'Makefile',
        content: `all:\n\tg++ -std=c++17 -o app main.cpp\n\nclean:\n\trm -f app\n`,
      },
      { path: '.gitignore', content: 'app\n*.o\n' },
      README(projectName, 'A C++ project.'),
    ];
  }

  // Default / Empty fallback
  return [
    {
      path: 'main.js',
      content: `console.log('Welcome to ${projectName}!');\n`,
    },
    README(projectName, 'A new project created in Nexus Cloud IDE.'),
  ];
};

/**
 * Returns intelligent default boilerplate code for single files created in File Explorer.
 */
export const getDefaultFileBoilerplate = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase().replace(/^\./, '');
  const basename = path.basename(filename, path.extname(filename));
  const componentName = basename.charAt(0).toUpperCase() + basename.slice(1);

  switch (ext) {
    case 'tsx':
    case 'jsx':
      return `import React from 'react';

export default function ${componentName || 'Component'}() {
  return (
    <div style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
      <h2>${componentName || 'Component'}</h2>
      <p>Created in Nexus Cloud IDE.</p>
    </div>
  );
}
`;

    case 'ts':
      return `/**
 * ${filename}
 */

export interface AppConfig {
  name: string;
  version: string;
}

export function initialize(config: AppConfig): void {
  console.log(\`[Nexus IDE] Initializing \${config.name} v\${config.version}\`);
}
`;

    case 'js':
      return `/**
 * ${filename}
 */

console.log("Running ${filename}...");

export function run() {
  return { success: true };
}
`;

    case 'html':
      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${componentName || 'Nexus Document'}</title>
  </head>
  <body>
    <h1>${componentName || 'Nexus Document'}</h1>
  </body>
</html>
`;

    case 'css':
      return `/* ${filename} */

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
`;

    case 'py':
      return `# ${filename}

def main():
    print("${filename} is running")

if __name__ == "__main__":
    main()
`;

    case 'json':
      return `{
  "name": "${basename.toLowerCase()}",
  "version": "1.0.0"
}
`;

    case 'md':
      return `# ${basename}\n\nDocument created in **Nexus Cloud IDE**.\n`;

    default:
      return `// ${filename}\n`;
  }
};
