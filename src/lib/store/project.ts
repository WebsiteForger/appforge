import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string;
  template: string;
  githubRepo: string | null;
  netlifyUrl: string | null;
  netlifySiteId: string | null;
  deployStatus: 'idle' | 'building' | 'live' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;

  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  updateProject: (updates: Partial<Project>) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  loading: false,

  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  updateProject: (updates) =>
    set((state) => ({
      currentProject: state.currentProject
        ? { ...state.currentProject, ...updates }
        : null,
    })),
  setLoading: (loading) => set({ loading }),
}));
