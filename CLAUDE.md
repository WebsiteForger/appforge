# AppForge — AI-Powered App Builder

> A Lovable/Bolt clone where users describe apps in chat, AI builds them
> in real-time in a WebContainer sandbox, and they deploy to Netlify.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 + shadcn/ui
- **State**: Zustand stores (project, editor, chat, agent)
- **Code Execution**: @webcontainer/api (browser-side Node.js)
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Auth**: Clerk (@clerk/clerk-react)
- **Database**: Netlify DB (Postgres via Drizzle ORM)
- **Git**: GitHub API via Octokit (Netlify Functions)
- **Deploy**: Netlify API (Netlify Functions)
- **LLM**: User's own API key, OpenAI-compatible streaming

## Key Design Decisions

1. **LLM calls from browser**: User's key in localStorage, never on server
2. **WebContainer filesystem is source of truth** during editing
3. **GitHub for persistence**: Save = commit snapshot to repo
4. **Two agent modes**: PLAN (architecture first) → BUILD (implement)
5. **Same tool loop**: Both modes use identical agentic tool-use loop

## Project Structure

- `src/lib/agent/` — Agent engine, tools, prompts, parser
- `src/lib/llm/` — LLM client, provider presets, config
- `src/lib/webcontainer/` — WebContainer instance, filesystem, processes
- `src/lib/store/` — Zustand stores
- `src/components/` — React components (chat, editor, preview, deploy)
- `src/pages/` — Page components (Landing, Dashboard, Editor, Settings)
- `netlify/functions/` — Server-side API (GitHub, deploy, webhook)
- `templates/` — Starter templates for user projects
- `db/` — Drizzle schema for platform database

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth
- `GITHUB_PAT` — GitHub API token
- `GITHUB_ORG` — GitHub organization
- `NETLIFY_AUTH_TOKEN` — Netlify API token
- `NETLIFY_ACCOUNT_SLUG` — Netlify account
- `NETLIFY_GITHUB_INSTALLATION_ID` — For linking repos to sites
