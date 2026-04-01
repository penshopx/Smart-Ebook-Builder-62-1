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
import { Book, Target, Settings, BrainCircuit, Factory, Wrench, Building2, Mountain, Flame, Zap, Store, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const industryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Building2, Mountain, Flame, Zap, Factory, Store, Sparkles,
};

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
        icon={Settings}
        title="Pengaturan Output"
        defaultOpen={false}
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
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select
              value={projectData.tone}
              onValueChange={(value) => onChange('tone', value)}
            >
              <SelectTrigger id="tone" data-testid="select-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((tone) => (
                  <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="writingStyle">Gaya Penulisan</Label>
            <Select
              value={projectData.writingStyle}
              onValueChange={(value) => onChange('writingStyle', value)}
            >
              <SelectTrigger id="writingStyle" data-testid="select-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WRITING_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        icon={BrainCircuit}
        title="AI Character / Brain Mode"
        defaultOpen={false}
        testId="card-header-ai-character"
      >
        <Select
          value={projectData.aiCharacter}
          onValueChange={(value) => onChange('aiCharacter', value)}
        >
          <SelectTrigger data-testid="select-ai-character">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_CHARACTERS.map((char) => (
              <SelectItem key={char} value={char}>{char}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Mode AI menentukan bagaimana AI akan "berpikir" dan merespons.
          <span className="text-primary font-medium"> Agentic Strategist</span> adalah mode paling cerdas yang proaktif dan antisipatif.
        </p>
      </CollapsibleCard>
    </div>
  );
}
