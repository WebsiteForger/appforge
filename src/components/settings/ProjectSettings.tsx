import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useProjectStore } from '@/lib/store/project';
import { Settings, Github, Globe } from 'lucide-react';

export default function ProjectSettings() {
  const project = useProjectStore((s) => s.currentProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  if (!project) {
    return (
      <div className="text-sm text-muted-foreground">
        No project selected.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Project Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Project Name</label>
            <Input value={project.name} readOnly />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Template</label>
            <Input value={project.template} readOnly />
          </div>

          {project.githubRepo && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Github className="w-3 h-3" />
                GitHub Repository
              </label>
              <a
                href={`https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {project.githubRepo}
              </a>
            </div>
          )}

          {project.netlifyUrl && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Live URL
              </label>
              <a
                href={project.netlifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {project.netlifyUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
