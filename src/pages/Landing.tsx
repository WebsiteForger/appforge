import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import {
  Zap,
  GitBranch,
  Rocket,
  ServerOff,
  ArrowRight,
  MessageSquare,
  Eye,
  Code2,
  ChevronRight,
  Sparkles,
  Terminal,
  Database,
  Globe,
  KeyRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Animated grid background ── */
function GridBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow from top center */}
      <div
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)',
        }}
      />
      {/* Diagonal slash of light */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(59,130,246,.4) 50%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ── Miniature IDE mockup ── */
function IDEMockup() {
  return (
    <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-blue-500/5 overflow-hidden">
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/60 px-3 py-0.5 rounded-md">
            appforge — my-project
          </span>
        </div>
      </div>
      {/* 3-panel IDE layout */}
      <div className="flex h-64 sm:h-72">
        {/* Chat panel */}
        <div className="w-1/4 border-r border-zinc-800/60 p-3 flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-semibold">Chat</span>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1.5">
            <p className="text-[10px] text-blue-300 leading-snug">"Build a kanban board with drag-and-drop"</p>
          </div>
          <div className="bg-zinc-800/50 rounded-md px-2 py-1.5 flex-1">
            <p className="text-[10px] text-zinc-400 leading-snug">
              I'll design the full architecture first...
            </p>
            <div className="mt-2 space-y-1">
              {['db/schema.ts', 'src/pages/Board.tsx', 'src/components/Column.tsx'].map((f, i) => (
                <div key={f} className="flex items-center gap-1 text-[9px]" style={{ animationDelay: `${i * 0.3}s` }}>
                  <span className="text-emerald-400">&#10003;</span>
                  <span className="text-zinc-500 font-mono">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Code panel */}
        <div className="w-[45%] border-r border-zinc-800/60 p-3">
          <div className="flex gap-2 mb-2">
            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">Board.tsx</span>
            <span className="text-[9px] text-zinc-600 px-2 py-0.5 rounded font-mono">schema.ts</span>
          </div>
          <pre className="text-[10px] font-mono leading-relaxed">
            <span className="text-blue-400">{'export default '}</span>
            <span className="text-yellow-300">{'function '}</span>
            <span className="text-emerald-300">{'Board'}</span>
            <span className="text-zinc-500">{'() {'}</span>{'\n'}
            <span className="text-zinc-500">{'  '}</span>
            <span className="text-blue-400">{'const '}</span>
            <span className="text-zinc-300">{'columns'}</span>
            <span className="text-zinc-500">{' = '}</span>
            <span className="text-blue-400">{'useTasks'}</span>
            <span className="text-zinc-500">{'();'}</span>{'\n'}
            <span className="text-zinc-500">{'  '}</span>
            <span className="text-blue-400">{'return '}</span>
            <span className="text-zinc-500">{'('}</span>{'\n'}
            <span className="text-zinc-500">{'    <'}</span>
            <span className="text-emerald-300">{'div '}</span>
            <span className="text-yellow-300">{'className'}</span>
            <span className="text-zinc-500">{'="'}</span>
            <span className="text-amber-200">{'flex gap-4'}</span>
            <span className="text-zinc-500">{'">'}</span>{'\n'}
            <span className="text-zinc-600">{'      ...'}</span>
          </pre>
        </div>
        {/* Preview panel */}
        <div className="flex-1 p-3 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-semibold mb-2">Preview</span>
          <div className="flex-1 rounded-md bg-zinc-900 border border-zinc-800/60 p-2 flex gap-1.5 overflow-hidden">
            {['To Do', 'In Progress', 'Done'].map((col, i) => (
              <div key={col} className="flex-1 bg-zinc-800/40 rounded p-1.5">
                <span className="text-[8px] font-semibold text-zinc-500 uppercase tracking-wide">{col}</span>
                {Array.from({ length: 3 - i }).map((_, j) => (
                  <div key={j} className="mt-1 h-5 bg-zinc-700/40 rounded-sm border border-zinc-700/30" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom glow */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
  delay,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
  accent: string;
  delay: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="group relative p-6 rounded-xl border border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all duration-500">
        {/* Corner accent */}
        <div
          className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at top right, ${accent}15, transparent 70%)`,
          }}
        />
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
          style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-[13px] leading-relaxed text-zinc-500">{description}</p>
      </div>
    </FadeIn>
  );
}

/* ── Step card ── */
function StepCard({
  number,
  icon: Icon,
  title,
  description,
  delay,
}: {
  number: string;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <FadeIn delay={delay} className="relative">
      <div className="flex items-start gap-5">
        <div className="shrink-0 relative">
          <div className="w-11 h-11 rounded-full border-2 border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-400 font-mono">{number}</span>
          </div>
        </div>
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}

/* ════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════ */

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <GridBg />

      {/* ── NAV ── */}
      <nav className="relative z-10 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-tight">AppForge</span>
          </button>

          <div className="flex items-center gap-3">
            <SignedOut>
              <button
                onClick={() => navigate('/sign-in')}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
              >
                Sign in
              </button>
              <Button size="sm" onClick={() => navigate('/sign-up')} className="gap-1.5 text-xs">
                Get Started <ArrowRight className="w-3 h-3" />
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5 text-xs">
                Dashboard <ArrowRight className="w-3 h-3" />
              </Button>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 mb-8">
              <Sparkles className="w-3 h-3 text-blue-400" />
              AI-powered app builder — bring your own LLM key
            </div>
          </FadeIn>

          <div className="max-w-3xl">
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Describe it.{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    Watch it build.
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-blue-500/60 to-transparent" />
                </span>{' '}
                Deploy.
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mb-10">
                Full-stack apps built live in your browser. The AI writes code, checks errors,
                takes screenshots, and iterates — just like a senior developer. One click to deploy.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap items-center gap-3">
                <SignedOut>
                  <Button
                    onClick={() => navigate('/sign-up')}
                    className="h-11 px-6 gap-2 text-sm font-semibold shadow-lg shadow-blue-500/20"
                  >
                    Start Building <ChevronRight className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="h-11 px-5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all"
                  >
                    See how it works
                  </button>
                </SignedOut>
                <SignedIn>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="h-11 px-6 gap-2 text-sm font-semibold shadow-lg shadow-blue-500/20"
                  >
                    Open Dashboard <ChevronRight className="w-4 h-4" />
                  </Button>
                </SignedIn>
              </div>
            </FadeIn>
          </div>

          {/* IDE Mockup */}
          <FadeIn delay={0.5} className="mt-16 sm:mt-20">
            <IDEMockup />
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Built different
              </h2>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto">
                Not another locked-in platform. AppForge is yours — your models, your repos, your infrastructure.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={KeyRound}
              title="Bring Your Own LLM"
              description="Use any OpenAI-compatible provider — Together, OpenRouter, Fireworks, Ollama, or your own endpoint. Your key, your cost control."
              accent="#3b82f6"
              delay={0.1}
            />
            <FeatureCard
              icon={GitBranch}
              title="Git-Backed"
              description="Every project is a real GitHub repo. Version history, branching, forkable. Your code, always accessible."
              accent="#a78bfa"
              delay={0.2}
            />
            <FeatureCard
              icon={Rocket}
              title="One-Click Deploy"
              description="Ship to Netlify with a working database, serverless functions, and CDN. From idea to production in minutes."
              accent="#34d399"
              delay={0.3}
            />
            <FeatureCard
              icon={ServerOff}
              title="Zero Server Cost"
              description="The AI runs in your browser via WebContainer. LLM calls use your key directly. We never touch your compute."
              accent="#fb923c"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-20 sm:py-28 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                How it works
              </h2>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto">
                The AI operates like Claude Code — exploring, planning, building, and verifying in a real tool-use loop.
              </p>
            </div>
          </FadeIn>

          <div className="max-w-2xl mx-auto space-y-10">
            <StepCard
              number="01"
              icon={MessageSquare}
              title="Describe your app"
              description='Tell the AI what you want in plain language. "Build me a project management app with kanban boards and team auth." The more detail, the better.'
              delay={0.1}
            />
            {/* Connector line */}
            <div className="ml-[21px] w-px h-6 bg-gradient-to-b from-blue-500/20 to-transparent" />
            <StepCard
              number="02"
              icon={Code2}
              title="AI plans, then builds"
              description="First it designs the architecture — database schema, page structure, API routes. Then it implements everything file by file, checking errors and taking screenshots as it goes."
              delay={0.2}
            />
            <div className="ml-[21px] w-px h-6 bg-gradient-to-b from-blue-500/20 to-transparent" />
            <StepCard
              number="03"
              icon={Eye}
              title="Watch it live"
              description="See your app being built in real time. The preview updates instantly via HMR. The AI sees what you see — it takes screenshots to verify the UI looks right."
              delay={0.3}
            />
            <div className="ml-[21px] w-px h-6 bg-gradient-to-b from-blue-500/20 to-transparent" />
            <StepCard
              number="04"
              icon={Rocket}
              title="Deploy with one click"
              description="When you're happy, hit Deploy. Your code is committed to GitHub, built on Netlify with a real Postgres database, and live on a URL you can share."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* ── TECH STRIP ── */}
      <section className="relative z-10 py-16 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-center text-[10px] uppercase tracking-widest text-zinc-600 mb-8 font-semibold">
              Built with
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-zinc-600">
              {[
                { icon: Code2, label: 'React 19' },
                { icon: Zap, label: 'Vite 6' },
                { icon: Terminal, label: 'WebContainer' },
                { icon: Database, label: 'Postgres (PGlite)' },
                { icon: Globe, label: 'Netlify' },
                { icon: GitBranch, label: 'GitHub' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20 sm:py-28 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Ready to build?
            </h2>
            <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto">
              Plug in your LLM key and start shipping full-stack apps in minutes. Free to use — you only pay for your own API calls.
            </p>
            <SignedOut>
              <Button
                onClick={() => navigate('/sign-up')}
                className="h-11 px-8 gap-2 text-sm font-semibold shadow-lg shadow-blue-500/20"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                onClick={() => navigate('/dashboard')}
                className="h-11 px-8 gap-2 text-sm font-semibold shadow-lg shadow-blue-500/20"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </SignedIn>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-zinc-800/40 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">AppForge</span>
          </div>
          <p className="text-[11px] text-zinc-600">
            Open-source AI app builder. Bring your own model.
          </p>
        </div>
      </footer>
    </div>
  );
}
