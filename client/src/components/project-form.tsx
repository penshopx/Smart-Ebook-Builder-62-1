import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LANGUAGES, OUTPUT_FORMATS, TONES, WRITING_STYLES, AI_CHARACTERS, EBOOK_LEVELS 
} from '@shared/schema';
import type { ProjectData } from '@shared/schema';
import { Book, Target, Settings, BrainCircuit } from 'lucide-react';

interface ProjectFormProps {
  projectData: ProjectData;
  onChange: (name: string, value: string) => void;
}

export function ProjectForm({ projectData, onChange }: ProjectFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Book className="h-4 w-4 text-primary" />
            Data Proyek Ebook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Data Tambahan (Opsional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            Pengaturan Output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-primary" />
            AI Character / Brain Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          <p className="text-xs text-muted-foreground mt-2">
            Mode AI menentukan bagaimana AI akan "berpikir" dan merespons. 
            <span className="text-primary font-medium"> Agentic Strategist</span> adalah mode paling cerdas yang proaktif dan antisipatif.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
