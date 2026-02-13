import { CheckCircle2, Circle, Loader2, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/lib/store/agent';
import { onPlanApproved, onPlanChangeRequested } from '@/lib/agent/engine';
import { useState } from 'react';

export default function PlanView() {
  const phase = useAgentStore((s) => s.phase);
  const plan = useAgentStore((s) => s.plan);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  if (phase !== 'awaiting_approval' && plan.length === 0) return null;

  return (
    <div className="border-t border-border bg-card/50">
      {/* Plan steps */}
      {plan.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Build Plan
          </p>
          <div className="space-y-1.5">
            {plan.map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                {step.status === 'done' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : step.status === 'in-progress' ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={step.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval buttons */}
      {phase === 'awaiting_approval' && (
        <div className="px-4 py-3 border-t border-border space-y-3">
          <div className="flex gap-2">
            <Button size="sm" onClick={onPlanApproved} className="gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              Approve & Build
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedback(!showFeedback)}
              className="gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Request Changes
            </Button>
          </div>

          {showFeedback && (
            <div className="flex gap-2">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What would you like changed?"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && feedback.trim()) {
                    onPlanChangeRequested(feedback.trim());
                    setFeedback('');
                    setShowFeedback(false);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (feedback.trim()) {
                    onPlanChangeRequested(feedback.trim());
                    setFeedback('');
                    setShowFeedback(false);
                  }
                }}
              >
                Send
              </Button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
