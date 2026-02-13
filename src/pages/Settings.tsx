import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { ArrowLeft, Zap } from 'lucide-react';
import LLMConfigPanel from '@/components/settings/LLMConfig';
import ProjectSettings from '@/components/settings/ProjectSettings';
import { useAgentStore } from '@/lib/store/agent';

export default function Settings() {
  const navigate = useNavigate();
  const autoTest = useAgentStore((s) => s.autoTest);
  const setAutoTest = useAgentStore((s) => s.setAutoTest);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm text-zinc-100">Settings</span>
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-10">
          {/* LLM Configuration */}
          <section className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/20">
            <LLMConfigPanel />
          </section>

          {/* Project Settings */}
          <section className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/20">
            <ProjectSettings />
          </section>

          {/* Agent Settings */}
          <section className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/20">
            <h3 className="text-sm font-semibold mb-4">Agent Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-200">Auto-test after build</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  When using Auto mode, automatically run QA tests after the build completes
                </p>
              </div>
              <button
                onClick={() => setAutoTest(!autoTest)}
                className={`
                  relative w-10 h-5.5 rounded-full transition-colors duration-200
                  ${autoTest ? 'bg-blue-500' : 'bg-zinc-700'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200
                    ${autoTest ? 'translate-x-[18px]' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </section>

          {/* About */}
          <section className="border border-zinc-800/60 rounded-xl p-6 bg-zinc-900/20">
            <h3 className="text-sm font-semibold mb-3">About AppForge</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              AppForge is an AI-powered app builder. Describe what you want in chat,
              watch the AI build it in real-time using a WebContainer sandbox, and
              deploy to Netlify with one click. Your LLM API key stays in your browser
              and is never sent to our servers.
            </p>
            <p className="text-xs text-zinc-600 mt-3">
              Version 0.1.0
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
