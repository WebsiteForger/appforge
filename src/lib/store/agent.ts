import { create } from 'zustand';

export type AgentPhase =
  | 'idle'
  | 'planning'
  | 'awaiting_approval'
  | 'building'
  | 'testing'
  | 'awaiting_test_approval'
  | 'done'
  | 'error';

export type AgentMode = 'plan' | 'build' | 'test' | 'auto';

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'done';
}

interface AgentState {
  phase: AgentPhase;
  mode: AgentMode;
  autoTest: boolean;
  currentTools: string[];
  iterations: number;
  maxIterations: number;
  plan: PlanStep[];
  isRunning: boolean;
  error: string | null;
  abortController: AbortController | null;

  setPhase: (phase: AgentPhase) => void;
  setMode: (mode: AgentMode) => void;
  setAutoTest: (auto: boolean) => void;
  setCurrentTools: (names: string[]) => void;
  incrementIteration: () => void;
  resetIterations: () => void;
  setPlan: (plan: PlanStep[]) => void;
  updatePlanStep: (id: string, status: PlanStep['status']) => void;
  setRunning: (running: boolean) => void;
  setError: (error: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  stop: () => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  phase: 'idle',
  mode: 'auto',
  autoTest: true,
  currentTools: [],
  iterations: 0,
  maxIterations: 200,
  plan: [],
  isRunning: false,
  error: null,
  abortController: null,

  setPhase: (phase) => set({ phase }),
  setMode: (mode) => set({ mode }),
  setAutoTest: (auto) => set({ autoTest: auto }),
  setCurrentTools: (names) => set({ currentTools: names }),
  incrementIteration: () => set((s) => ({ iterations: s.iterations + 1 })),
  resetIterations: () => set({ iterations: 0 }),
  setPlan: (plan) => set({ plan }),
  updatePlanStep: (id, status) =>
    set((s) => ({
      plan: s.plan.map((step) =>
        step.id === id ? { ...step, status } : step
      ),
    })),
  setRunning: (running) => set({ isRunning: running }),
  setError: (error) => set({ error, phase: error ? 'error' : get().phase }),
  setAbortController: (controller) => set({ abortController: controller }),
  stop: () => {
    const { abortController } = get();
    abortController?.abort();
    set({
      isRunning: false,
      phase: 'idle',
      currentTools: [],
      abortController: null,
    });
  },
  reset: () =>
    set({
      phase: 'idle',
      currentTools: [],
      iterations: 0,
      plan: [],
      isRunning: false,
      error: null,
      abortController: null,
    }),
}));
