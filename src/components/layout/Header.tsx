import { useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Zap, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/lib/store/project';
import { useAgentStore } from '@/lib/store/agent';
import { cn } from '@/lib/utils/format';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const project = useProjectStore((s) => s.currentProject);
  const agentPhase = useAgentStore((s) => s.phase);
  const isRunning = useAgentStore((s) => s.isRunning);

  const isEditor = location.pathname.startsWith('/editor');

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">AppForge</span>
        </button>

        {isEditor && project && (
          <>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-sm text-muted-foreground">{project.name}</span>

            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {agentPhase === 'planning' ? 'Planning...' : 'Building...'}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SignedIn>
          {!isEditor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className={cn(location.pathname === '/dashboard' && 'bg-accent')}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Button size="sm" onClick={() => navigate('/sign-in')}>
            Sign In
          </Button>
        </SignedOut>
      </div>
    </header>
  );
}
