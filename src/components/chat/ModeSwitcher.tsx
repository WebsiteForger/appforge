import { ClipboardList, Hammer, FlaskConical, Sparkles } from 'lucide-react';
import { useAgentStore, type AgentMode } from '@/lib/store/agent';

const MODES: { id: AgentMode; label: string; icon: typeof ClipboardList; title: string }[] = [
  { id: 'plan', label: 'Plan', icon: ClipboardList, title: 'Plan mode: AI designs the architecture, you approve before building' },
  { id: 'build', label: 'Build', icon: Hammer, title: 'Build mode: AI builds directly without a planning step' },
  { id: 'test', label: 'Test', icon: FlaskConical, title: 'Test mode: AI runs QA checks on the current app' },
  { id: 'auto', label: 'Auto', icon: Sparkles, title: 'Auto mode: Plan, build, and test in one go' },
];

export default function ModeSwitcher() {
  const mode = useAgentStore((s) => s.mode);
  const setMode = useAgentStore((s) => s.setMode);
  const isRunning = useAgentStore((s) => s.isRunning);

  return (
    <div
      className={`inline-flex gap-0.5 p-0.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 ${
        isRunning ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {MODES.map(({ id, label, icon: Icon, title }) => {
        const isActive = mode === id;
        return (
          <button
            key={id}
            onClick={() => setMode(id)}
            title={title}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium
              transition-all duration-200 cursor-pointer
              ${isActive
                ? 'bg-blue-500/15 text-blue-400 shadow-[inset_0_1px_0_rgba(59,130,246,0.15)]'
                : 'text-zinc-500 hover:text-zinc-300'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
