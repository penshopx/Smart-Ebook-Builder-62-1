import { MODES } from '@shared/schema';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, Sparkles, Layers, FileText, Video, GraduationCap, 
  FilePlus, Package, Bot, Megaphone, Wand2, Smartphone, ClipboardList, Mic2, Headphones, LayoutTemplate, Lock
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Sparkles,
  Layers,
  FileText,
  Video,
  GraduationCap,
  FilePlus,
  Package,
  Bot,
  Megaphone,
  Wand2,
  Smartphone,
  ClipboardList,
  Mic2,
  Headphones,
  LayoutTemplate,
};

const PHASE_CONFIG = [
  {
    id: 'fondasi',
    label: '📖 Fondasi Ebook',
    color: 'text-blue-600 dark:text-blue-400',
    divider: 'bg-blue-200 dark:bg-blue-800',
    modeIds: ['BRAINSTORM', 'BIG_IDEA', 'OUTLINE', 'DRAFT_BAB', 'EXTEND_TEXT'],
    tooltip: 'Langkah 1 — Dokumentasikan kompetensi Anda',
  },
  {
    id: 'transfer',
    label: '🔄 Transfer Kompetensi',
    color: 'text-violet-600 dark:text-violet-400',
    divider: 'bg-violet-200 dark:bg-violet-800',
    modeIds: ['ECOURSE_BUILDER', 'DOC_GENERATOR', 'GPT_BUILDER', 'MINI_APP_BUILDER', 'QUIZ_MAKER', 'PODCAST_GENERATOR', 'AUDIOBOOK_SCRIPT'],
    tooltip: 'Transfer ebook ke produk digital lain',
  },
  {
    id: 'marketing',
    label: '📣 Marketing & Distribusi',
    color: 'text-rose-600 dark:text-rose-400',
    divider: 'bg-rose-200 dark:bg-rose-800',
    modeIds: ['VIDEO_SCRIPT', 'PROMPT_PACK', 'MARKETING_KIT', 'LANDING_PAGE'],
    tooltip: 'Promosi dan distribusi ekosistem kompetensi',
  },
];

interface ModeSelectorProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
  allowedModes?: string[] | 'all';
}

export function ModeSelector({ activeMode, onModeChange, allowedModes = 'all' }: ModeSelectorProps) {
  const { toast } = useToast();

  const isLocked = (modeId: string) => {
    if (allowedModes === 'all') return false;
    return !allowedModes.includes(modeId);
  };

  const handleModeClick = (modeId: string) => {
    if (isLocked(modeId)) {
      toast({
        title: '🔒 Mode ini perlu upgrade',
        description: 'Mode ini hanya tersedia untuk paket Pro. Upgrade untuk akses semua 16 mode.',
        action: (
          <a href="/account" className="inline-flex items-center gap-1 rounded bg-primary text-white text-xs px-3 py-1.5 font-medium hover:opacity-90 transition-opacity">
            Upgrade
          </a>
        ),
      });
      return;
    }
    onModeChange(modeId);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-1 pb-3">
        {PHASE_CONFIG.map((phase, phaseIdx) => {
          const phaseModes = MODES.filter(m => phase.modeIds.includes(m.id));
          return (
            <div key={phase.id} className="flex items-center gap-1">
              {phaseIdx > 0 && (
                <div className={`w-px h-8 mx-1 rounded-full ${phase.divider} opacity-60`} />
              )}
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-semibold ${phase.color} whitespace-nowrap mr-0.5 hidden sm:inline`}
                  title={phase.tooltip}
                >
                  {phase.label}
                </span>
                {phaseModes.map((mode) => {
                  const Icon = iconMap[mode.icon];
                  const isActive = activeMode === mode.id;
                  const locked = isLocked(mode.id);
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeClick(mode.id)}
                      data-testid={`button-mode-${mode.id.toLowerCase()}`}
                      title={locked ? `🔒 ${mode.label} — Perlu upgrade ke Pro` : (mode.description || mode.label)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                        "border",
                        locked
                          ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                          : isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105 hover-elevate active-elevate-2"
                            : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40 hover-elevate active-elevate-2"
                      )}
                    >
                      {locked ? <Lock className="h-3 w-3 flex-shrink-0 opacity-60" /> : Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
