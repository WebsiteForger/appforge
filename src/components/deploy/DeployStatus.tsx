import { useProjectStore } from '@/lib/store/project';
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';

export default function DeployStatus() {
  const deployStatus = useProjectStore((s) => s.currentProject?.deployStatus);

  if (!deployStatus || deployStatus === 'idle') return null;

  const config = {
    building: {
      icon: Loader2,
      text: 'Building...',
      className: 'text-warning bg-warning/10 animate-pulse',
      spin: true,
    },
    live: {
      icon: CheckCircle2,
      text: 'Live',
      className: 'text-success bg-success/10',
      spin: false,
    },
    failed: {
      icon: XCircle,
      text: 'Failed',
      className: 'text-destructive bg-destructive/10',
      spin: false,
    },
  }[deployStatus] ?? {
    icon: Circle,
    text: deployStatus,
    className: 'text-muted-foreground',
    spin: false,
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.className}`}>
      <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
      {config.text}
    </span>
  );
}
