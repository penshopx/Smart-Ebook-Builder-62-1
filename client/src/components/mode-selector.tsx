import { MODES } from '@shared/schema';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, Sparkles, Layers, FileText, Video, GraduationCap, 
  FilePlus, Package, Bot, Megaphone, Wand2, Smartphone, ClipboardList, Mic2
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
};

interface ModeSelectorProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-3">
        {MODES.map((mode) => {
          const Icon = iconMap[mode.icon];
          const isActive = activeMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              data-testid={`button-mode-${mode.id.toLowerCase()}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                "border hover-elevate active-elevate-2",
                isActive 
                  ? "bg-primary text-primary-foreground border-primary-border" 
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
