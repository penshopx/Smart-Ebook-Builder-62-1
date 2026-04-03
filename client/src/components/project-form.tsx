import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LANGUAGES, OUTPUT_FORMATS, TONES, WRITING_STYLES, AI_CHARACTERS, EBOOK_LEVELS, INDUSTRIES
} from '@shared/schema';
import type { ProjectData } from '@shared/schema';
import {
  Book, Target, Settings, BrainCircuit, Factory, Wrench, Building2, Mountain, Flame, Zap,
  Store, Sparkles, ChevronDown, MessageSquare, HelpCircle, Lightbulb, Briefcase, BarChart2,
  Palette, Pen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const industryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Building2, Mountain, Flame, Zap, Factory, Store, Sparkles,
};

const AI_CHARACTER_CONFIG = [
  {
    value: "Agentic Strategist (Attentive & Proactive)",
    label: "Agentic Strategist",
    description: "Proaktif & antisipatif",
    icon: BrainCircuit,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  {
    value: "Standard Assistant (Helpful & Direct)",
    label: "Standard Assistant",
    description: "Membantu & langsung",
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    value: "Socratic Mentor (Guide by Questioning)",
    label: "Socratic Mentor",
    description: "Membimbing lewat pertanyaan",
    icon: HelpCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    value: "Creative Visionary (Out of the Box)",
    label: "Creative Visionary",
    description: "Kreatif & inovatif",
    icon: Lightbulb,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  {
    value: "Strict Professional (Formal & Concise)",
    label: "Strict Professional",
    description: "Formal & ringkas",
    icon: Briefcase,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
  {
    value: "Data-Driven Analyst (Logical & Factual)",
    label: "Data-Driven Analyst",
    description: "Logis & berbasis data",
    icon: BarChart2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
];

const QUICK_TONES = [
  "Authoritative", "Professional", "Friendly", "Inspirational",
  "Persuasive", "Warm", "Formal", "Encouraging", "Conversational", "Serious"
];

const QUICK_STYLES = [
  "Instructive", "Conversational", "Narrative", "Technical",
  "Storytelling", "Informative", "Analytical", "Direct Response", "StoryBrand", "Academic"
];

interface ProjectFormProps {
  projectData: ProjectData;
  onChange: (name: string, value: string) => void;
}

function CollapsibleCard({
  icon: Icon,
  title,
  badge,
  defaultOpen = true,
  children,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className={cn(
          "pb-3 cursor-pointer select-none hover:bg-muted/40 transition-colors rounded-t-lg",
          !open && "rounded-b-lg"
        )}
        onClick={() => setOpen((v) => !v)}
        data-testid={testId}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
            {badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                {badge}
              </Badge>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function QuickChipSelect({
  label,
  value,
  onChange,
  quickOptions,
  allOptions,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  quickOptions: string[];
  allOptions: readonly string[];
  testIdPrefix: string;
}) {
  const isQuick = quickOptions.includes(value);
  const otherOptions = allOptions.filter((o) => !quickOptions.includes(o));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {quickOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            data-testid={`chip-${testIdPrefix}-${opt.toLowerCase().replace(/\s+/g, '-')}`}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
              value === opt
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
        <Select
          value={isQuick ? "" : value}
          onValueChange={onChange}
        >
          <SelectTrigger
            data-testid={`select-${testIdPrefix}-more`}
            className={cn(
              "h-7 px-2.5 rounded-full text-xs w-auto border transition-all",
              !isQuick
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {!isQuick ? value : "Lainnya ▾"}
          </SelectTrigger>
          <SelectContent>
            {otherOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function ProjectForm({ projectData, onChange }: ProjectFormProps) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-4 w-4 text-primary" />
            Pilih Industri / Sektor
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pilih sektor untuk mendapatkan template dan rekomendasi AI yang optimal
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INDUSTRIES.map((industry) => {
              const Icon = industryIconMap[industry.icon] || Sparkles;
              const isSelected = projectData.industry === industry.id;

              return (
                <button
                  key={industry.id}
                  onClick={() => onChange('industry', industry.id)}
                  data-testid={`button-industry-${industry.id}`}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-center",
                    "hover-elevate active-elevate-2",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md",
                    industry.bgColor
                  )}>
                    <Icon className={cn("h-4 w-4", industry.color)} />
                  </div>
                  <p className={cn(
                    "text-[10px] font-medium leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {industry.name}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CollapsibleCard
        icon={Book}
        title="Data Proyek Ebook"
        defaultOpen={true}
        testId="card-header-data-proyek"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topik">Topik / Kata Kunci Utama</Label>
            <Input
              id="topik"
              name="topik"
              placeholder="Contoh: Digital Marketing untuk UMKM"
              value={projectData.topik}
              onChange={(e) => onChange('topik', e.target.value)}
              data-testid="input-topik"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Ebook (Opsional)</Label>
            <Input
              id="judul"
              name="judul"
              placeholder="Contoh: Rahasia Jualan Laris di Era Digital"
              value={projectData.judul}
              onChange={(e) => onChange('judul', e.target.value)}
              data-testid="input-judul"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target Pembaca</Label>
            <Input
              id="target"
              name="target"
              placeholder="Contoh: Pemilik UMKM usia 25-45 tahun"
              value={projectData.target}
              onChange={(e) => onChange('target', e.target.value)}
              data-testid="input-target"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level/Struktur Ebook</Label>
            <Select
              value={projectData.level}
              onValueChange={(value) => onChange('level', value)}
            >
              <SelectTrigger id="level" data-testid="select-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EBOOK_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tujuan">Tujuan Ebook</Label>
          <Textarea
            id="tujuan"
            name="tujuan"
            placeholder="Apa tujuan utama ebook ini? Skill apa yang akan dikuasai pembaca?"
            value={projectData.tujuan}
            onChange={(e) => onChange('tujuan', e.target.value)}
            className="min-h-[60px] resize-none"
            data-testid="textarea-tujuan"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="painPoint">Pain Point / Masalah Target Pembaca</Label>
          <Textarea
            id="painPoint"
            name="painPoint"
            placeholder="Jelaskan masalah utama yang dihadapi target pembaca Anda..."
            value={projectData.painPoint}
            onChange={(e) => onChange('painPoint', e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="textarea-painpoint"
          />
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={Target}
        title="Data Tambahan"
        badge="Opsional"
        defaultOpen={false}
        testId="card-header-data-tambahan"
      >
        <div className="space-y-2">
          <Label htmlFor="bigIdea">Big Idea / Konsep Unik</Label>
          <Textarea
            id="bigIdea"
            name="bigIdea"
            placeholder="Apa yang membuat ebook Anda berbeda? Metode atau framework unik?"
            value={projectData.bigIdea}
            onChange={(e) => onChange('bigIdea', e.target.value)}
            className="min-h-[60px] resize-none"
            data-testid="textarea-bigidea"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hasilRiset">Hasil Riset / Data Pendukung</Label>
          <Textarea
            id="hasilRiset"
            name="hasilRiset"
            placeholder="Data, statistik, atau insight dari riset yang sudah Anda lakukan..."
            value={projectData.hasilRiset}
            onChange={(e) => onChange('hasilRiset', e.target.value)}
            className="min-h-[60px] resize-none"
            data-testid="textarea-hasilriset"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="produk">Produk/Layanan Terkait (Jika ada)</Label>
          <Input
            id="produk"
            name="produk"
            placeholder="Contoh: Kursus Online, Konsultasi, Software"
            value={projectData.produk}
            onChange={(e) => onChange('produk', e.target.value)}
            data-testid="input-produk"
          />
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={Palette}
        title="Gaya Penulisan & Output"
        defaultOpen={true}
        testId="card-header-pengaturan-output"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="language">Bahasa</Label>
            <Select
              value={projectData.language}
              onValueChange={(value) => onChange('language', value)}
            >
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputFormat">Format Output</Label>
            <Select
              value={projectData.outputFormat}
              onValueChange={(value) => onChange('outputFormat', value)}
            >
              <SelectTrigger id="outputFormat" data-testid="select-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-px bg-border" />

        <QuickChipSelect
          label="Tone Penulisan"
          value={projectData.tone}
          onChange={(v) => onChange('tone', v)}
          quickOptions={QUICK_TONES}
          allOptions={TONES}
          testIdPrefix="tone"
        />

        <QuickChipSelect
          label="Gaya Penulisan"
          value={projectData.writingStyle}
          onChange={(v) => onChange('writingStyle', v)}
          quickOptions={QUICK_STYLES}
          allOptions={WRITING_STYLES}
          testIdPrefix="style"
        />
      </CollapsibleCard>

      <CollapsibleCard
        icon={BrainCircuit}
        title="AI Character / Brain Mode"
        defaultOpen={true}
        testId="card-header-ai-character"
      >
        <p className="text-xs text-muted-foreground -mt-1">
          Pilih karakter AI yang menentukan cara AI "berpikir" dan merespons konten Anda.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {AI_CHARACTER_CONFIG.map((char) => {
            const Icon = char.icon;
            const isSelected = projectData.aiCharacter === char.value;
            return (
              <button
                key={char.value}
                type="button"
                onClick={() => onChange('aiCharacter', char.value)}
                data-testid={`button-ai-character-${char.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "relative flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? `${char.border} ${char.bg} ring-1 ring-inset ${char.border}`
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className={cn("h-2 w-2 rounded-full animate-pulse", char.color.replace('text-', 'bg-'))} />
                  </div>
                )}
                <div className={cn("flex items-center justify-center h-8 w-8 rounded-md shrink-0 mt-0.5", char.bg)}>
                  <Icon className={cn("h-4 w-4", char.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "text-xs font-semibold leading-tight",
                    isSelected ? char.color : "text-foreground"
                  )}>
                    {char.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                    {char.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {projectData.aiCharacter === "Agentic Strategist (Attentive & Proactive)" && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-600 dark:text-violet-400">
              <span className="font-semibold">Agentic Strategist</span> adalah mode paling cerdas — proaktif, antisipatif, dan selalu memberikan konteks lebih dari yang diminta.
            </p>
          </div>
        )}
      </CollapsibleCard>
    </div>
  );
}
