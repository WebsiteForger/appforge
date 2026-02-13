import { formatRelativeTime } from '@/lib/utils/format';
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Deploy {
  id: string;
  state: string;
  url?: string;
  createdAt: string;
}

interface DeployHistoryProps {
  deploys: Deploy[];
}

export default function DeployHistory({ deploys }: DeployHistoryProps) {
  if (deploys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No deployments yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {deploys.map((deploy) => (
        <div
          key={deploy.id}
          className="flex items-center justify-between p-2 rounded-lg border border-border text-sm"
        >
          <div className="flex items-center gap-2">
            {deploy.state === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : deploy.state === 'error' ? (
              <XCircle className="w-4 h-4 text-destructive" />
            ) : (
              <Loader2 className="w-4 h-4 text-warning animate-spin" />
            )}
            <span className="text-muted-foreground">
              {formatRelativeTime(new Date(deploy.createdAt).getTime())}
            </span>
          </div>
          {deploy.url && (
            <a
              href={deploy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
