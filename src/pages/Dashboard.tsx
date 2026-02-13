import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import {
  Plus,
  Folder,
  Loader2,
  Zap,
  Clock,
  ExternalLink,
  Rocket,
  LayoutTemplate,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useProjectStore, type Project } from '@/lib/store/project';
import { formatRelativeTime } from '@/lib/utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const loading = useProjectStore((s) => s.loading);
  const setLoading = useProjectStore((s) => s.setLoading);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTemplate, setNewTemplate] = useState('react-netlify');
  const [includeAuth, setIncludeAuth] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Load projects from localStorage (or API in production)
    setLoading(true);
    try {
      const stored = localStorage.getItem('appforge-projects');
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newDescription.trim(),
      template: newTemplate,
      includeAuth,
      githubRepo: null,
      netlifyUrl: null,
      netlifySiteId: null,
      deployStatus: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [project, ...projects];
    setProjects(updated);
    localStorage.setItem('appforge-projects', JSON.stringify(updated));

    setCreating(false);
    setShowCreate(false);
    setNewName('');
    setNewDescription('');

    // Navigate to editor
    setCurrentProject(project);
    navigate(`/editor/${project.id}`);
  }

  function openProject(project: Project) {
    setCurrentProject(project);
    navigate(`/editor/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">AppForge</span>
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold mb-1">Your Projects</h1>
            <p className="text-sm text-zinc-500">Build, iterate, and deploy full-stack apps.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Create Project Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleCreate}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg"
            >
              <h2 className="text-lg font-semibold mb-1">New Project</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Name it, describe what you want, and the AI will build it.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Project name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-awesome-app"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">
                    What should this app do? (optional — you can describe it in chat too)
                  </label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="A project management app with kanban boards, team auth, and real-time updates..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Template</label>
                  <Select
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value)}
                  >
                    <option value="react-netlify">React + Netlify (Full-stack with DB)</option>
                    <option value="react-static">React Static (No database)</option>
                  </Select>
                </div>

                {/* Auth toggle */}
                <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${includeAuth ? 'bg-blue-600 justify-end' : 'bg-zinc-700 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-medium">User Authentication</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Adds sign-in, sign-up, and user management (Clerk)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeAuth}
                    onChange={(e) => setIncludeAuth(e.target.checked)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newName.trim() || creating} className="gap-1.5">
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  {creating ? 'Creating...' : 'Create & Open'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
              Create your first project and describe what you want — the AI builds it from scratch.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Create Your First Project
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                className="text-left border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Folder className="w-4 h-4 text-blue-400" />
                  </div>
                  {project.deployStatus === 'live' && project.netlifyUrl && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-medium">
                      Live
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-300 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(new Date(project.updatedAt).getTime())}
                  </span>
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{project.template}</span>
                  {project.includeAuth && (
                    <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Auth
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
