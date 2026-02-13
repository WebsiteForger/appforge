import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Save, Rocket, Settings, ArrowLeft, Zap, Code, EyeOff } from 'lucide-react';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import ChatPanel from '@/components/chat/ChatPanel';
import EditorPanel from '@/components/editor/EditorPanel';
import PreviewPanel from '@/components/preview/PreviewPanel';
import TerminalPanel from '@/components/preview/TerminalPanel';
import DeployButton from '@/components/deploy/DeployButton';
import DeployStatus from '@/components/deploy/DeployStatus';
import Sidebar from '@/components/layout/Sidebar';
import { useProjectStore, type Project } from '@/lib/store/project';
import { useEditorStore } from '@/lib/store/editor';
import { useAgentStore } from '@/lib/store/agent';
import { useChatStore } from '@/lib/store/chat';
import { getWebContainer, teardownWebContainer } from '@/lib/webcontainer/instance';
import { buildFileTree } from '@/lib/webcontainer/filesystem';
import { startProcess, onServerReady, spawnCommand } from '@/lib/webcontainer/process';
import { appendTerminalLine } from '@/components/preview/TerminalPanel';
import { TEMPLATES, type TemplateName } from '@/lib/webcontainer/templates';
import { commitFiles } from '@/lib/github/api';
import { listFilesRecursive, readFile } from '@/lib/webcontainer/filesystem';
import { clearConversation, getConversation, runAgentLoop } from '@/lib/agent/engine';
import { cn } from '@/lib/utils/format';
import { getProjectsKey } from '@/lib/utils/storage';

type MobileTab = 'chat' | 'code' | 'preview';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const project = useProjectStore((s) => s.currentProject);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const agentPhase = useAgentStore((s) => s.phase);
  const isRunning = useAgentStore((s) => s.isRunning);
  const setFileTree = useEditorStore((s) => s.setFileTree);
  const [booting, setBooting] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const prevProjectIdRef = useRef<string | undefined>(undefined);

  // Load chat history and clear agent state when projectId changes
  useEffect(() => {
    if (!projectId) return;

    // If switching projects, stop the agent and clear conversation
    if (prevProjectIdRef.current && prevProjectIdRef.current !== projectId) {
      useChatStore.getState().saveToStorage(); // save old project's chat
      clearConversation();
      useAgentStore.getState().stop();
      useAgentStore.getState().reset();
      setBooting(true);
    }

    // Load persisted chat for this project
    useChatStore.getState().loadForProject(projectId);
    prevProjectIdRef.current = projectId;
  }, [projectId]);

  // Load project if not already set
  useEffect(() => {
    if (!project && projectId) {
      const stored = localStorage.getItem(getProjectsKey(userId));
      if (stored) {
        const projects: Project[] = JSON.parse(stored);
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          setCurrentProject(found);
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [project, projectId, setCurrentProject, navigate, userId]);

  // Boot WebContainer and mount template
  useEffect(() => {
    if (!project) return;

    let mounted = true;

    async function boot() {
      try {
        appendTerminalLine('$ Booting WebContainer...');
        const wc = await getWebContainer();

        if (!mounted) return;
        appendTerminalLine('WebContainer ready.');

        // Mount template
        const templateName = (project!.template || 'react-netlify') as TemplateName;
        const template = TEMPLATES[templateName] ?? TEMPLATES['react-netlify'];

        appendTerminalLine(`$ Mounting template: ${templateName}`);
        await wc.mount(template);

        // Refresh file tree
        const tree = await buildFileTree();
        setFileTree(tree);

        // Install dependencies
        appendTerminalLine('$ npm install');
        await spawnCommand('npm install', (data) => appendTerminalLine(data));

        // Start dev server
        appendTerminalLine('$ npm run dev');
        await startProcess('npm run dev', (data) => appendTerminalLine(data));

        // Inject project context for the AI
        const authNote = project!.includeAuth
          ? 'AUTH IS ENABLED for this project. Use the pre-built auth helpers from src/auth.tsx (useAuth, SignInButton, UserButton, RequireAuth). Clerk is already configured.'
          : 'Auth is NOT enabled for this project. Do not add authentication unless the user asks.';

        const contextMsg = `[Project: ${project!.name} | Template: ${templateName} | ${authNote}]`;
        getConversation().push({ role: 'system', content: contextMsg });

        setBooting(false);

        // Auto-send project description on FIRST EVER open only.
        // If chat already has messages (persisted or from this session), skip.
        if (useChatStore.getState().messages.length === 0) {
          const desc = project!.description?.trim();
          const firstPrompt = desc
            ? desc
            : `Build an app called "${project!.name}".`;
          runAgentLoop(firstPrompt);
        }
      } catch (err) {
        appendTerminalLine(`Error: ${err}`);
        setBooting(false);
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, [project, setFileTree]);

  // Save chat and clean up on unmount
  useEffect(() => {
    return () => {
      useChatStore.getState().saveToStorage();
      clearConversation();
      useAgentStore.getState().reset();
    };
  }, []);

  // Periodically refresh file tree when agent is working
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      try {
        const tree = await buildFileTree();
        setFileTree(tree);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning, setFileTree]);

  async function handleSave() {
    if (!project?.githubRepo || saving) return;
    setSaving(true);
    try {
      const paths = await listFilesRecursive();
      const files = await Promise.all(
        paths.map(async (p) => ({ path: p, content: await readFile(p) })),
      );
      await commitFiles(
        project.githubRepo.split('/')[1] || project.githubRepo,
        files,
        'Save from AppForge',
      );
      appendTerminalLine('Saved to GitHub.');
    } catch (err) {
      appendTerminalLine(`Save error: ${err}`);
    } finally {
      setSaving(false);
    }
  }

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-11 border-b border-zinc-800/60 flex items-center justify-between px-3 shrink-0 bg-zinc-950">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Zap className="w-4 h-4 text-blue-400" />
          </button>
          <span className="text-xs font-semibold">{project.name}</span>

          {isRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              {agentPhase === 'planning' ? 'Planning' : 'Building'}
            </span>
          )}

          {booting && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Booting...
            </span>
          )}

          <DeployStatus />
        </div>

        <div className="flex items-center gap-2">
          {project.githubRepo && (
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="gap-1 text-xs">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditor(!showEditor)}
            className="gap-1 text-xs hidden md:flex"
          >
            {showEditor ? <EyeOff className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            {showEditor ? 'Hide Editor' : 'Show Editor'}
          </Button>
          <DeployButton />
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Desktop: 3-panel layout (or 2-panel when editor hidden) */}
      <div className="flex-1 overflow-hidden hidden md:flex">
        <PanelGroup direction="horizontal">
          {/* Chat */}
          <Panel defaultSize={showEditor ? 25 : 35} minSize={15} maxSize={50}>
            <ChatPanel />
          </Panel>
          <PanelResizeHandle className="w-px bg-zinc-800/60 hover:bg-blue-500/40 transition-colors" />

          {/* Editor (collapsible) */}
          {showEditor && (
            <>
              <Panel defaultSize={40} minSize={20}>
                <EditorPanel />
              </Panel>
              <PanelResizeHandle className="w-px bg-zinc-800/60 hover:bg-blue-500/40 transition-colors" />
            </>
          )}

          {/* Preview + Terminal */}
          <Panel defaultSize={showEditor ? 35 : 65} minSize={20}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <PreviewPanel />
              </Panel>
              <PanelResizeHandle className="h-px bg-zinc-800/60 hover:bg-blue-500/40 transition-colors" />
              <Panel defaultSize={30} minSize={15}>
                <TerminalPanel />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile: tab-based layout */}
      <div className="flex-1 overflow-hidden md:hidden pb-14">
        <div className={cn(mobileTab === 'chat' ? 'block h-full' : 'hidden')}>
          <ChatPanel />
        </div>
        <div className={cn(mobileTab === 'code' ? 'block h-full' : 'hidden')}>
          <EditorPanel />
        </div>
        <div className={cn(mobileTab === 'preview' ? 'flex flex-col h-full' : 'hidden')}>
          <div className="flex-1">
            <PreviewPanel />
          </div>
          <div className="h-1/3 border-t border-zinc-800">
            <TerminalPanel />
          </div>
        </div>
        <Sidebar activeTab={mobileTab} onTabChange={setMobileTab} />
      </div>
    </div>
  );
}
