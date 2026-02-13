import type { FileSystemTree } from '@webcontainer/api';

/**
 * React + Netlify template — the default starting point for new projects.
 * Includes: React 19, Vite 6, Tailwind 4, React Router 7, Drizzle ORM,
 * PGlite (dev DB), Clerk auth (optional), and lucide-react icons.
 */
export const REACT_NETLIFY_TEMPLATE: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'my-app',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'react-router': '^7.0.0',
            'react-router-dom': '^7.0.0',
            'lucide-react': '^0.460.0',
            '@electric-sql/pglite': '^0.3.0',
            '@neondatabase/serverless': '^1.0.0',
            'drizzle-orm': '^0.38.0',
            '@clerk/clerk-react': '^5.20.0',
          },
          devDependencies: {
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            '@vitejs/plugin-react': '^4.3.0',
            '@tailwindcss/vite': '^4.0.0',
            'drizzle-kit': '^0.30.0',
            tailwindcss: '^4.0.0',
            typescript: '^5.6.0',
            vite: '^6.0.0',
          },
        },
        null,
        2,
      ),
    },
  },
  'vite.config.ts': {
    file: {
      contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'netlify-functions-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          var url = req.url || '';
          var funcPrefix = '/.netlify/functions/';
          var isDevSql = url.startsWith('/__dev/sql');
          var isFunc = url.startsWith(funcPrefix);

          if (!isFunc && !isDevSql) return next();

          var funcName;
          if (isDevSql) {
            funcName = 'dev-sql';
          } else {
            funcName = url.slice(funcPrefix.length).split('?')[0].split('/')[0];
          }

          var modulePath = '/netlify/functions/' + funcName + '.ts';

          try {
            var mod = await server.ssrLoadModule(modulePath);
            var handler = mod.default;
            if (!handler) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No handler for ' + funcName }));
              return;
            }

            var body = '';
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              var chunks = [];
              for await (var chunk of req) chunks.push(chunk);
              body = Buffer.concat(chunks).toString();
            }

            var fullUrl = 'http://' + (req.headers.host || 'localhost') + req.url;
            var headers = new Headers();
            for (var _a of Object.entries(req.headers)) {
              if (_a[1]) headers.set(_a[0], Array.isArray(_a[1]) ? _a[1].join(', ') : _a[1]);
            }

            var init = { method: req.method, headers };
            if (body) init.body = body;

            var request = new Request(fullUrl, init);
            var response = await handler(request);

            res.statusCode = response.status;
            response.headers.forEach(function(v, k) { res.setHeader(k, v); });
            var resBody = await response.text();
            res.end(resBody);
          } catch (err) {
            console.error('Function error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal error' }));
          }
        });
      },
    },
  ],
});
`,
    },
  },
  'tsconfig.json': {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: 'force',
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
          },
          include: ['src', 'db', 'netlify'],
        },
        null,
        2,
      ),
    },
  },
  'index.html': {
    file: {
      contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
  },
  'netlify.toml': {
    file: {
      contents: `[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"
  targetPort = 5173
`,
    },
  },
  src: {
    directory: {
      'main.tsx': {
        file: {
          contents: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function Root() {
  if (clerkKey) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        <App />
      </ClerkProvider>
    );
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
`,
        },
      },
      'App.tsx': {
        file: {
          contents: `import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            <p className="text-zinc-500 text-lg">Building your app...</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
`,
        },
      },
      'auth.tsx': {
        file: {
          contents: `/**
 * Auth helpers — wraps Clerk for easy use throughout the app.
 * Import { useAuth, SignInButton, UserButton, RequireAuth } from './auth';
 *
 * Clerk is optional: if no VITE_CLERK_PUBLISHABLE_KEY is set,
 * auth components show dev placeholders instead.
 */
import { useUser, useAuth as useClerkAuth, SignInButton as ClerkSignIn, UserButton as ClerkUserButton } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuth() {
  if (!hasClerk) return { isSignedIn: true, userId: 'local', user: null, isLoaded: true };
  const { isSignedIn, userId, isLoaded } = useClerkAuth();
  const { user } = useUser();
  return { isSignedIn: isSignedIn ?? false, userId: userId ?? null, user, isLoaded };
}

export function SignInButton({ children }: { children?: ReactNode }) {
  if (!hasClerk) {
    return (
      <button
        onClick={function() { console.log('[Dev] Auth not configured'); }}
        className="px-3 py-1.5 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        {children || 'Sign In'}
      </button>
    );
  }
  return <ClerkSignIn mode="modal">{children}</ClerkSignIn>;
}

export function UserButton() {
  if (!hasClerk) {
    return (
      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center" title="Dev Mode">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }
  return <ClerkUserButton afterSignOutUrl="/" />;
}

export function RequireAuth({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!hasClerk) return <>{children}</>;
  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!isSignedIn) return <>{fallback ?? <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-zinc-400">Sign in to continue</p><SignInButton><button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">Sign In</button></SignInButton></div>}</>;
  return <>{children}</>;
}
`,
        },
      },
      'index.css': {
        file: {
          contents: `@import "tailwindcss";

body {
  margin: 0;
  font-family: "Inter", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`,
        },
      },
      lib: {
        directory: {
          'db.ts': {
            file: {
              contents: `import { drizzle } from 'drizzle-orm/pglite';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';

let _db: any = null;
let _rawClient: any = null;

export async function getDb() {
  if (_db) return _db;

  if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
    // PRODUCTION: Use real Neon Postgres (auto-set by Netlify DB)
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzleNeon(sql);
  } else {
    // DEVELOPMENT: Use PGlite (in-memory Postgres WASM)
    const { PGlite } = await import('@electric-sql/pglite');
    _rawClient = new PGlite();
    _db = drizzle(_rawClient);
  }

  return _db;
}

/** Get the raw PGlite client for direct SQL queries (dev only) */
export async function getRawClient() {
  if (!_rawClient) await getDb();
  return _rawClient;
}
`,
            },
          },
          'types.ts': {
            file: {
              contents: `// AI will populate this file with TypeScript types\nexport {};\n`,
            },
          },
        },
      },
      pages: { directory: {} },
      components: { directory: {} },
    },
  },
  db: {
    directory: {
      'schema.ts': {
        file: {
          contents: `// AI will write the Drizzle schema here\nexport {};\n`,
        },
      },
    },
  },
  netlify: {
    directory: {
      functions: {
        directory: {
          'dev-sql.ts': {
            file: {
              contents: `// Dev-only SQL endpoint for the AI agent
// Allows running raw SQL against the local PGlite database
// Uses the SAME PGlite instance as the rest of the app via getRawClient()
import { getRawClient } from '../../src/lib/db';

export default async (req: Request) => {
  // Only allow in development (no DATABASE_URL = dev mode)
  if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
    return Response.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { sql } = await req.json();
    const client = await getRawClient();
    const result = await client.query(sql);
    return Response.json({ rows: result.rows });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
};
`,
            },
          },
        },
      },
    },
  },
};

/**
 * Simple static React template — no database, no auth
 */
export const REACT_STATIC_TEMPLATE: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'my-app',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'react-router-dom': '^7.0.0',
            'lucide-react': '^0.460.0',
          },
          devDependencies: {
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            '@vitejs/plugin-react': '^4.3.0',
            '@tailwindcss/vite': '^4.0.0',
            tailwindcss: '^4.0.0',
            typescript: '^5.6.0',
            vite: '^6.0.0',
          },
        },
        null,
        2,
      ),
    },
  },
  'vite.config.ts': {
    file: {
      contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
    },
  },
  'index.html': {
    file: {
      contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
  },
  src: {
    directory: {
      'main.tsx': {
        file: {
          contents: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
`,
        },
      },
      'App.tsx': {
        file: {
          contents: `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <p className="text-zinc-500 text-lg">Building your app...</p>
    </div>
  );
}
`,
        },
      },
      'index.css': {
        file: {
          contents: `@import "tailwindcss";

body { margin: 0; font-family: system-ui, sans-serif; }
`,
        },
      },
    },
  },
};

export const TEMPLATES = {
  'react-netlify': REACT_NETLIFY_TEMPLATE,
  'react-static': REACT_STATIC_TEMPLATE,
} as const;

export type TemplateName = keyof typeof TEMPLATES;
