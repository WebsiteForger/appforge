import { useState } from 'react';
import { MessageSquare, Code, Eye, Terminal, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils/format';

type MobileTab = 'chat' | 'code' | 'preview';

interface SidebarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

/**
 * Mobile sidebar — switches between Chat, Code, and Preview tabs
 * on small screens. Hidden on desktop where panels are shown side-by-side.
 */
export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: { id: MobileTab; icon: typeof MessageSquare; label: string }[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'code', icon: Code, label: 'Code' },
    { id: 'preview', icon: Eye, label: 'Preview' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-around z-50">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors',
            activeTab === id
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
