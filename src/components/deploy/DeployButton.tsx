import { useState } from 'react';
import { Rocket, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/lib/store/project';
import { listFilesRecursive, readFile } from '@/lib/webcontainer/filesystem';
import { fullDeploy, getDeployStatus } from '@/lib/deploy/api';

type DeployState = 'idle' | 'saving' | 'deploying' | 'polling' | 'success' | 'error';

export default function DeployButton() {
  const project = useProjectStore((s) => s.currentProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const [state, setState] = useState<DeployState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  async function handleDeploy() {
    if (!project?.githubRepo) {
      setError('No GitHub repo linked. Save the project first.');
      setState('error');
      return;
    }

    setState('saving');
    setError(null);

    try {
      // 1. Collect all files from WebContainer
      const filePaths = await listFilesRecursive();
      const files = await Promise.all(
        filePaths.map(async (path) => {
          const content = await readFile(path);
          return { path, content };
        }),
      );

      // 2. Deploy
      setState('deploying');
      const result = await fullDeploy(
        project.githubRepo.split('/')[1] || project.githubRepo,
        files,
        project.netlifySiteId,
        project.includeAuth,
      );

      updateProject({
        netlifySiteId: result.siteId,
        netlifyUrl: result.url || project.netlifyUrl,
        deployStatus: 'building',
      });

      // 3. Poll for completion
      setState('polling');
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes

      const poll = setInterval(async () => {
        attempts++;
        const status = await getDeployStatus(result.siteId);

        if (status?.state === 'ready') {
          clearInterval(poll);
          setState('success');
          setDeployUrl(status.deployUrl ?? project.netlifyUrl ?? '');
          updateProject({ deployStatus: 'live' });
          setTimeout(() => setState('idle'), 10000);
        } else if (status?.state === 'error' || attempts >= maxAttempts) {
          clearInterval(poll);
          setState('error');
          setError(status?.errorMessage ?? 'Deploy timed out');
          updateProject({ deployStatus: 'failed' });
        }
      }, 5000);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Deploy failed');
      setTimeout(() => setState('idle'), 5000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleDeploy}
        disabled={state !== 'idle' && state !== 'error' && state !== 'success'}
        className="gap-1.5"
      >
        {state === 'idle' && <Rocket className="w-3.5 h-3.5" />}
        {(state === 'saving' || state === 'deploying' || state === 'polling') && (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        )}
        {state === 'success' && <Check className="w-3.5 h-3.5" />}
        {state === 'error' && <AlertCircle className="w-3.5 h-3.5" />}

        {state === 'idle' && 'Deploy'}
        {state === 'saving' && 'Saving...'}
        {state === 'deploying' && 'Deploying...'}
        {state === 'polling' && 'Building...'}
        {state === 'success' && 'Live!'}
        {state === 'error' && 'Retry'}
      </Button>

      {state === 'success' && deployUrl && (
        <a
          href={deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate max-w-48"
        >
          {deployUrl}
        </a>
      )}

      {state === 'error' && error && (
        <span className="text-xs text-destructive truncate max-w-48">{error}</span>
      )}
    </div>
  );
}
