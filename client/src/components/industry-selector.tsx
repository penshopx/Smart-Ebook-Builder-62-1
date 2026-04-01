import { INDUSTRIES } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Wrench, Building2, Mountain, Flame, Zap, Factory, Store, Sparkles,
  Wallet, Users, Heart, Dumbbell, Palette,
  FileCheck, ClipboardList, Award, GraduationCap, Kanban, Database,
  Box, Leaf, BookOpen, ShieldCheck, Scale
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Building2,
  Mountain,
  Flame,
  Zap,
  Factory,
  Store,
  Sparkles,
  Wallet,
  Users,
  Heart,
  Dumbbell,
  Palette,
  FileCheck,
  ClipboardList,
  Award,
  GraduationCap,
  Kanban,
  Database,
  Box,
  Leaf,
  BookOpen,
  ShieldCheck,
  Scale,
};

interface IndustrySelectorProps {
  selectedIndustry: string;
  onSelect: (industryId: string) => void;
}

export function IndustrySelector({ selectedIndustry, onSelect }: IndustrySelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="h-4 w-4 text-primary" />
          Pilih Industri / Sektor
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pilih sektor industri untuk mendapatkan template dan rekomendasi AI yang optimal
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INDUSTRIES.map((industry) => {
            const Icon = iconMap[industry.icon];
            const isSelected = selectedIndustry === industry.id;
            
            return (
              <button
                key={industry.id}
                onClick={() => onSelect(industry.id)}
                data-testid={`button-industry-${industry.id}`}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center",
                  "hover-elevate active-elevate-2",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg",
                  industry.bgColor
                )}>
                  {Icon && <Icon className={cn("h-5 w-5", industry.color)} />}
                </div>
                <div className="space-y-0.5">
                  <p className={cn(
                    "text-xs font-medium leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {industry.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                    {industry.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        {selectedIndustry && selectedIndustry !== 'general' && (
          <div className="mt-4 p-3 rounded-lg bg-accent/50 border border-accent">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Rekomendasi
              </Badge>
            </div>
            {(() => {
              const industry = INDUSTRIES.find(i => i.id === selectedIndustry);
              if (!industry) return null;
              return (
                <p className="text-xs text-muted-foreground">
                  Untuk industri <span className="font-medium text-foreground">{industry.name}</span>, 
                  disarankan menggunakan Tone: <span className="font-medium text-primary">{industry.recommendedTone}</span> dan 
                  Style: <span className="font-medium text-primary">{industry.recommendedStyle}</span>
                </p>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
