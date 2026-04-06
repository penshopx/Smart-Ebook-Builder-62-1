import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  EBOOK_SERIES_DATA, CHAPTER_TEMPLATES, DOCUMENT_TYPES, PACK_TYPES, MARKETING_ASSETS,
  TONES, WRITING_STYLES, AI_CHARACTERS
} from '@shared/schema';
import type { ProjectData, TaskConfig, ExtendConfig, EbookStyle } from '@shared/schema';
import { Settings2, Palette, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_TONES_PANEL = ["Authoritative", "Professional", "Technical", "Narrative", "Friendly", "Persuasive", "Conversational", "Instructive"];
const QUICK_STYLES_PANEL = ["Instructive", "Technical", "Narrative", "Conversational", "Storytelling", "Analytical", "Direct Response", "Informative"];

interface TaskConfigPanelProps {
  activeMode: string;
  projectData: ProjectData;
  taskConfig: TaskConfig;
  extendConfig: ExtendConfig;
  onTaskConfigChange: (name: string, value: string | number) => void;
  onExtendConfigChange: (name: string, value: string) => void;
  onEbookStyleChange: (ebookId: number, style: Partial<EbookStyle>) => void;
}

function EbookStyleOverride({
  ebookId,
  ebookLabel,
  globalStyle,
  currentStyle,
  onStyleChange,
  onReset,
}: {
  ebookId: number;
  ebookLabel: string;
  globalStyle: EbookStyle;
  currentStyle: EbookStyle;
  onStyleChange: (field: keyof EbookStyle, value: string) => void;
  onReset: () => void;
}) {
  const hasOverride =
    currentStyle.tone !== globalStyle.tone ||
    currentStyle.writingStyle !== globalStyle.writingStyle ||
    currentStyle.aiCharacter !== globalStyle.aiCharacter;

  const isQuickTone = QUICK_TONES_PANEL.includes(currentStyle.tone);
  const isQuickStyle = QUICK_STYLES_PANEL.includes(currentStyle.writingStyle);
  const otherTones = Array.from(TONES).filter(t => !QUICK_TONES_PANEL.includes(t));
  const otherStyles = Array.from(WRITING_STYLES).filter(s => !QUICK_STYLES_PANEL.includes(s));

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Gaya Khusus Ebook Ini</span>
          {hasOverride && (
            <Badge className="text-[9px] px-1.5 py-0 h-3.5 bg-primary text-primary-foreground">Dikustom</Badge>
          )}
        </div>
        {hasOverride && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            data-testid={`button-reset-ebook-style-${ebookId}`}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset ke default
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px]">Tone</Label>
        <div className="flex flex-wrap gap-1">
          {QUICK_TONES_PANEL.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onStyleChange('tone', opt)}
              data-testid={`chip-ebook-tone-${ebookId}-${opt.toLowerCase()}`}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                currentStyle.tone === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
          <Select
            value={isQuickTone ? "" : currentStyle.tone}
            onValueChange={(v) => onStyleChange('tone', v)}
          >
            <SelectTrigger
              data-testid={`select-ebook-tone-more-${ebookId}`}
              className={cn(
                "h-6 px-2 rounded-full text-[10px] w-auto border transition-all",
                !isQuickTone
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              {!isQuickTone ? currentStyle.tone : "Lainnya ▾"}
            </SelectTrigger>
            <SelectContent>
              {otherTones.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px]">Gaya Penulisan</Label>
        <div className="flex flex-wrap gap-1">
          {QUICK_STYLES_PANEL.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onStyleChange('writingStyle', opt)}
              data-testid={`chip-ebook-style-${ebookId}-${opt.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                currentStyle.writingStyle === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
          <Select
            value={isQuickStyle ? "" : currentStyle.writingStyle}
            onValueChange={(v) => onStyleChange('writingStyle', v)}
          >
            <SelectTrigger
              data-testid={`select-ebook-style-more-${ebookId}`}
              className={cn(
                "h-6 px-2 rounded-full text-[10px] w-auto border transition-all",
                !isQuickStyle
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              {!isQuickStyle ? currentStyle.writingStyle : "Lainnya ▾"}
            </SelectTrigger>
            <SelectContent>
              {otherStyles.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px]">AI Character</Label>
        <Select
          value={currentStyle.aiCharacter}
          onValueChange={(v) => onStyleChange('aiCharacter', v)}
        >
          <SelectTrigger data-testid={`select-ebook-ai-character-${ebookId}`} className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(AI_CHARACTERS).map(c => (
              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasOverride && (
        <div className="flex items-start gap-1.5 rounded-md bg-primary/10 p-2">
          <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-primary/80 leading-snug">
            Ebook ini akan menggunakan gaya <strong>{currentStyle.tone} / {currentStyle.writingStyle}</strong> yang berbeda dari setting global.
          </p>
        </div>
      )}
    </div>
  );
}

export function TaskConfigPanel({
  activeMode,
  projectData,
  taskConfig,
  extendConfig,
  onTaskConfigChange,
  onExtendConfigChange,
  onEbookStyleChange,
}: TaskConfigPanelProps) {
  const currentSeriesList = EBOOK_SERIES_DATA[projectData.level] || [];
  const isMultiEbook = currentSeriesList.length > 1;

  const globalStyle: EbookStyle = {
    tone: projectData.tone,
    writingStyle: projectData.writingStyle,
    aiCharacter: projectData.aiCharacter,
  };

  const getEbookStyle = (ebookId: number): EbookStyle => {
    const override = projectData.ebookStyles?.[ebookId.toString()];
    return override
      ? { ...globalStyle, ...override }
      : { ...globalStyle };
  };

  const renderContent = () => {
    switch (activeMode) {
      case 'BRAINSTORM':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Ide yang Dihasilkan</Label>
                <Select
                  value={taskConfig.jumlahIde}
                  onValueChange={(value) => onTaskConfigChange('jumlahIde', value)}
                >
                  <SelectTrigger data-testid="select-jumlah-ide">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Ide (Fokus)</SelectItem>
                    <SelectItem value="5">5 Ide (Standard)</SelectItem>
                    <SelectItem value="7">7 Ide (Lebih Banyak Pilihan)</SelectItem>
                    <SelectItem value="10">10 Ide (Eksplorasi Penuh)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Angle / Pendekatan Utama</Label>
                <Select
                  value={taskConfig.brainstormAngle}
                  onValueChange={(value) => onTaskConfigChange('brainstormAngle', value)}
                >
                  <SelectTrigger data-testid="select-brainstorm-angle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Problem-Solution">Problem-Solution (Masalah → Solusi)</SelectItem>
                    <SelectItem value="How-To Guide">How-To Guide (Panduan Langkah)</SelectItem>
                    <SelectItem value="Case Study">Case Study (Studi Kasus Nyata)</SelectItem>
                    <SelectItem value="Inspirational">Inspirational (Kisah Motivasi)</SelectItem>
                    <SelectItem value="Reference">Reference (Ensiklopedia / Acuan)</SelectItem>
                    <SelectItem value="Workbook">Workbook (Latihan & Praktik)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Level Kedalaman Ebook</Label>
              <Select
                value={taskConfig.fokusLevel}
                onValueChange={(value) => onTaskConfigChange('fokusLevel', value)}
              >
                <SelectTrigger data-testid="select-brainstorm-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner — untuk pemula total</SelectItem>
                  <SelectItem value="Intermediate">Intermediate — untuk yang sudah paham dasar</SelectItem>
                  <SelectItem value="Advanced">Advanced — untuk praktisi berpengalaman</SelectItem>
                  <SelectItem value="Expert">Expert — untuk profesional/spesialis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'BIG_IDEA':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Angle Positioning Utama</Label>
              <Select
                value={taskConfig.bigIdeaAngle}
                onValueChange={(value) => onTaskConfigChange('bigIdeaAngle', value)}
              >
                <SelectTrigger data-testid="select-big-idea-angle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unik & Berbeda">Unik & Berbeda dari buku sejenis</SelectItem>
                  <SelectItem value="Otoritas">Otoritas — posisikan sebagai referensi terpercaya</SelectItem>
                  <SelectItem value="Transformasi">Transformasi — hasil nyata yang dijanjikan</SelectItem>
                  <SelectItem value="Niche Spesifik">Niche Spesifik — untuk segmen sangat sempit</SelectItem>
                  <SelectItem value="Anti-Mainstream">Anti-Mainstream — melawan anggapan umum</SelectItem>
                  <SelectItem value="Sistem/Framework">Sistem/Framework — metode eksklusif milik saya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kompetitor / Buku Sejenis (Opsional)</Label>
              <Input
                placeholder="Contoh: Rich Dad Poor Dad, Atomic Habits, dll..."
                value={taskConfig.judulScript}
                onChange={(e) => onTaskConfigChange('judulScript', e.target.value)}
                data-testid="input-kompetitor"
              />
            </div>
            <div className="space-y-2">
              <Label>Keunikan / USP yang Ingin Ditonjolkan</Label>
              <Textarea
                placeholder="Apa yang benar-benar membedakan ebook Anda? Keahlian unik, pengalaman, data eksklusif..."
                value={taskConfig.tujuanBab}
                onChange={(e) => onTaskConfigChange('tujuanBab', e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-usp"
              />
            </div>
          </div>
        );

      case 'OUTLINE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Bab</Label>
                <Select
                  value={taskConfig.jumlahBab}
                  onValueChange={(value) => onTaskConfigChange('jumlahBab', value)}
                >
                  <SelectTrigger data-testid="select-jumlah-bab">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Bab (Compact)</SelectItem>
                    <SelectItem value="7">7 Bab (Standard)</SelectItem>
                    <SelectItem value="10">10 Bab (Komprehensif)</SelectItem>
                    <SelectItem value="12">12 Bab (Extended)</SelectItem>
                    <SelectItem value="15">15 Bab (Masterclass)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kedalaman Outline</Label>
                <Select
                  value={taskConfig.outlineDepth}
                  onValueChange={(value) => onTaskConfigChange('outlineDepth', value)}
                >
                  <SelectTrigger data-testid="select-outline-depth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple (Judul Bab saja)</SelectItem>
                    <SelectItem value="Standard">Standard (Bab + Sub-bab)</SelectItem>
                    <SelectItem value="Detailed">Detailed (Bab + Sub-bab + Poin Kunci)</SelectItem>
                    <SelectItem value="Full">Full (Bab + Sub-bab + Poin + Latihan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Struktur Alur</Label>
              <Select
                value={taskConfig.fokusLevel}
                onValueChange={(value) => onTaskConfigChange('fokusLevel', value)}
              >
                <SelectTrigger data-testid="select-outline-struktur">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Linear">Linear (Bertahap dari awal ke akhir)</SelectItem>
                  <SelectItem value="Modular">Modular (Tiap bab berdiri sendiri)</SelectItem>
                  <SelectItem value="Progressive">Progressive (Skill building — simpel ke kompleks)</SelectItem>
                  <SelectItem value="Problem-Solution">Problem-Solution (Masalah → Solusi per bab)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'DRAFT_BAB':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pilih Ebook (dalam seri)</Label>
                <Select
                  value={taskConfig.selectedEbookId.toString()}
                  onValueChange={(value) => onTaskConfigChange('selectedEbookId', parseInt(value))}
                >
                  <SelectTrigger data-testid="select-ebook">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSeriesList.map((ebook) => (
                      <SelectItem key={ebook.id} value={ebook.id.toString()}>
                        {ebook.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Template Judul Bab</Label>
                <Select
                  value={taskConfig.judulBab}
                  onValueChange={(value) => onTaskConfigChange('judulBab', value)}
                >
                  <SelectTrigger data-testid="select-judul-bab">
                    <SelectValue placeholder="Pilih template bab..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAPTER_TEMPLATES.map((chapter) => (
                      <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {taskConfig.judulBab === "Custom / Tulis Judul Sendiri..." && (
              <div className="space-y-2">
                <Label>Judul Bab Custom</Label>
                <Input
                  placeholder="Tulis judul bab Anda sendiri..."
                  value={taskConfig.manualJudulBab}
                  onChange={(e) => onTaskConfigChange('manualJudulBab', e.target.value)}
                  data-testid="input-manual-judul-bab"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Tujuan/Fokus Bab Ini</Label>
              <Textarea
                placeholder="Apa yang ingin dicapai dari bab ini? Skill apa yang pembaca dapatkan?"
                value={taskConfig.tujuanBab}
                onChange={(e) => onTaskConfigChange('tujuanBab', e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-tujuan-bab"
              />
            </div>
            {isMultiEbook && (
              <EbookStyleOverride
                ebookId={taskConfig.selectedEbookId}
                ebookLabel={currentSeriesList.find(e => e.id === taskConfig.selectedEbookId)?.label || ''}
                globalStyle={globalStyle}
                currentStyle={getEbookStyle(taskConfig.selectedEbookId)}
                onStyleChange={(field, value) =>
                  onEbookStyleChange(taskConfig.selectedEbookId, { [field]: value })
                }
                onReset={() => {
                  const newStyles = { ...(projectData.ebookStyles || {}) };
                  delete newStyles[taskConfig.selectedEbookId.toString()];
                  onEbookStyleChange(taskConfig.selectedEbookId, globalStyle);
                }}
              />
            )}
          </div>
        );

      case 'VIDEO_SCRIPT':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Judul Video/Episode</Label>
                <Input
                  placeholder="Contoh: 5 Kesalahan Fatal dalam Digital Marketing"
                  value={taskConfig.judulScript}
                  onChange={(e) => onTaskConfigChange('judulScript', e.target.value)}
                  data-testid="input-judul-script"
                />
              </div>
              <div className="space-y-2">
                <Label>Durasi Target</Label>
                <Select
                  value={taskConfig.durasiScript}
                  onValueChange={(value) => onTaskConfigChange('durasiScript', value)}
                >
                  <SelectTrigger data-testid="select-durasi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 menit">1-3 menit (Short/Reels)</SelectItem>
                    <SelectItem value="5-10 menit">5-10 menit (Standard)</SelectItem>
                    <SelectItem value="15-20 menit">15-20 menit (Deep Dive)</SelectItem>
                    <SelectItem value="30+ menit">30+ menit (Podcast/Webinar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bab Sumber (Opsional)</Label>
              <Select
                value={taskConfig.judulBab}
                onValueChange={(value) => onTaskConfigChange('judulBab', value)}
              >
                <SelectTrigger data-testid="select-bab-sumber">
                  <SelectValue placeholder="Pilih bab sebagai sumber materi..." />
                </SelectTrigger>
                <SelectContent>
                  {CHAPTER_TEMPLATES.slice(0, -1).map((chapter) => (
                    <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'ECOURSE_BUILDER':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durasi Kursus</Label>
                <Select
                  value={taskConfig.courseDuration}
                  onValueChange={(value) => onTaskConfigChange('courseDuration', value)}
                >
                  <SelectTrigger data-testid="select-course-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 Minggu">1 Minggu (Intensif)</SelectItem>
                    <SelectItem value="2 Minggu">2 Minggu</SelectItem>
                    <SelectItem value="4 Minggu">4 Minggu (Standard)</SelectItem>
                    <SelectItem value="8 Minggu">8 Minggu (Komprehensif)</SelectItem>
                    <SelectItem value="12 Minggu">12 Minggu (Bootcamp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format Delivery</Label>
                <Select
                  value={taskConfig.courseFormat}
                  onValueChange={(value) => onTaskConfigChange('courseFormat', value)}
                >
                  <SelectTrigger data-testid="select-course-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Video Only">Video Only</SelectItem>
                    <SelectItem value="Video + Worksheet">Video + Worksheet</SelectItem>
                    <SelectItem value="Video + Live Session">Video + Live Session</SelectItem>
                    <SelectItem value="Self-Paced Text">Self-Paced Text</SelectItem>
                    <SelectItem value="Hybrid (Video + Text + Live)">Hybrid (Video + Text + Live)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tujuan Akhir Siswa</Label>
              <Textarea
                placeholder="Apa yang bisa dilakukan siswa setelah menyelesaikan kursus ini?"
                value={taskConfig.courseGoal}
                onChange={(e) => onTaskConfigChange('courseGoal', e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-course-goal"
              />
            </div>
          </div>
        );

      case 'DOC_GENERATOR': {
        const selectedDocs = taskConfig.docType
          ? taskConfig.docType.split('|||').map(s => s.trim()).filter(Boolean)
          : [];
        const toggleDoc = (doc: string) => {
          const updated = selectedDocs.includes(doc)
            ? selectedDocs.filter(d => d !== doc)
            : [...selectedDocs, doc];
          onTaskConfigChange('docType', updated.join('|||'));
        };
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Jenis Dokumen</Label>
                {selectedDocs.length > 0 && (
                  <span className="text-xs text-muted-foreground">{selectedDocs.length} dipilih</span>
                )}
              </div>
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-md border">
                  {selectedDocs.map(doc => (
                    <Badge
                      key={doc}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => toggleDoc(doc)}
                      data-testid={`badge-doc-${doc}`}
                    >
                      {doc} ×
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border rounded-md p-2 max-h-56 overflow-y-auto space-y-1" data-testid="checklist-doc-types">
                {DOCUMENT_TYPES.map((doc) => {
                  const checked = selectedDocs.includes(doc);
                  return (
                    <label
                      key={doc}
                      className={cn(
                        "flex items-start gap-2.5 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors",
                        checked
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                      data-testid={`checkbox-doc-${doc}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleDoc(doc)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="leading-snug">{doc}</span>
                    </label>
                  );
                })}
              </div>
              {selectedDocs.length === 0 && (
                <p className="text-xs text-muted-foreground">Pilih satu atau lebih jenis dokumen yang ingin dibuat.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Konteks Spesifik Dokumen</Label>
              <Textarea
                placeholder="Jelaskan konteks spesifik dokumen ini. Untuk apa? Siapa yang terlibat?"
                value={taskConfig.docContext}
                onChange={(e) => onTaskConfigChange('docContext', e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="textarea-doc-context"
              />
            </div>
          </div>
        );
      }

      case 'PROMPT_PACK':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Workflow Pack</Label>
              <Select
                value={taskConfig.packType}
                onValueChange={(value) => onTaskConfigChange('packType', value)}
              >
                <SelectTrigger data-testid="select-pack-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PACK_TYPES.map((pack) => (
                    <SelectItem key={pack} value={pack}>{pack}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Prompt Pack adalah rangkaian prompt berurutan yang memandu Anda menyelesaikan project besar langkah demi langkah.
            </p>
          </div>
        );

      case 'GPT_BUILDER':
        return (
          <div className="space-y-5">
            {/* IDENTITAS BOT */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identitas Bot</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bot (Opsional)</Label>
                  <Input
                    placeholder="Contoh: Mentor Bisnis AI"
                    value={taskConfig.botName}
                    onChange={(e) => onTaskConfigChange('botName', e.target.value)}
                    data-testid="input-bot-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peran Bot</Label>
                  <Select
                    value={taskConfig.botRole}
                    onValueChange={(value) => onTaskConfigChange('botRole', value)}
                  >
                    <SelectTrigger data-testid="select-bot-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mentor Pribadi">Mentor Pribadi</SelectItem>
                      <SelectItem value="Konsultan Ahli">Konsultan Ahli</SelectItem>
                      <SelectItem value="Tutor Pembelajaran">Tutor Pembelajaran</SelectItem>
                      <SelectItem value="Asisten Produktivitas">Asisten Produktivitas</SelectItem>
                      <SelectItem value="Coach Bisnis">Coach Bisnis</SelectItem>
                      <SelectItem value="Customer Service AI">Customer Service AI</SelectItem>
                      <SelectItem value="Sales Assistant">Sales Assistant</SelectItem>
                      <SelectItem value="Onboarding Bot">Onboarding Bot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* PERSONA */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Persona</p>
              <div className="space-y-2">
                <Label>Kepribadian Bot</Label>
                <Input
                  placeholder="Contoh: Ramah, Suportif, dan Berbasis Data"
                  value={taskConfig.botPersonality}
                  onChange={(e) => onTaskConfigChange('botPersonality', e.target.value)}
                  data-testid="input-bot-personality"
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Persona Detail <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  placeholder={`Contoh: Bot ini berbicara seperti seorang mentor berpengalaman — tegas tapi hangat. Selalu memberi contoh nyata dan menghindari teori yang terlalu abstrak. Jika ada pertanyaan di luar topik ebook, bot mengarahkan kembali dengan sopan.`}
                  rows={3}
                  value={taskConfig.botPersonaDetail}
                  onChange={(e) => onTaskConfigChange('botPersonaDetail', e.target.value)}
                  data-testid="textarea-bot-persona-detail"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bahasa Chatbot</Label>
                  <Select
                    value={taskConfig.botLanguage}
                    onValueChange={(value) => onTaskConfigChange('botLanguage', value)}
                  >
                    <SelectTrigger data-testid="select-bot-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Bilingual (Indonesia + English)">Bilingual (ID + EN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Pengguna Bot <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    placeholder="Contoh: Pengusaha UMKM pemula"
                    value={taskConfig.botAudience}
                    onChange={(e) => onTaskConfigChange('botAudience', e.target.value)}
                    data-testid="input-bot-audience"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topik yang Harus Dihindari <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input
                  placeholder="Contoh: Saran medis, hukum, investasi saham"
                  value={taskConfig.botAvoidTopics}
                  onChange={(e) => onTaskConfigChange('botAvoidTopics', e.target.value)}
                  data-testid="input-bot-avoid-topics"
                />
              </div>
            </div>

            {/* SYSTEM PROMPT KUSTOM */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Prompt Kustom</p>
              <div className="space-y-2">
                <Label>
                  Instruksi Tambahan / System Prompt
                  <span className="text-muted-foreground text-xs ml-2">(opsional — akan ditambahkan ke hasil generate)</span>
                </Label>
                <Textarea
                  placeholder={`Tulis instruksi khusus yang ingin kamu sertakan langsung di system prompt.\n\nContoh:\n- Selalu akhiri setiap jawaban dengan pertanyaan lanjutan.\n- Jika user menanyakan harga, arahkan ke link: https://yoursite.com/beli\n- Jawab maksimal 3 paragraf per respons.`}
                  rows={5}
                  value={taskConfig.botSystemPrompt}
                  onChange={(e) => onTaskConfigChange('botSystemPrompt', e.target.value)}
                  data-testid="textarea-bot-system-prompt"
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Jika kosong, AI akan generate system prompt otomatis dari data ebook & konfigurasi di atas.
              </p>
            </div>
          </div>
        );

      case 'MARKETING_KIT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Aset Marketing</Label>
              <Select
                value={taskConfig.marketingAsset}
                onValueChange={(value) => onTaskConfigChange('marketingAsset', value)}
              >
                <SelectTrigger data-testid="select-marketing-asset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETING_ASSETS.map((asset) => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Angle/Hook Khusus</Label>
              <Input
                placeholder="Contoh: Fokus pada Transformasi, Urgency, FOMO, Social Proof..."
                value={taskConfig.marketingAngle}
                onChange={(e) => onTaskConfigChange('marketingAngle', e.target.value)}
                data-testid="input-marketing-angle"
              />
            </div>
          </div>
        );

      case 'EXTEND_TEXT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Teks Awal yang Ingin Dikembangkan</Label>
              <Textarea
                placeholder="Paste teks pendek Anda di sini untuk dikembangkan..."
                value={extendConfig.teksAwal}
                onChange={(e) => onExtendConfigChange('teksAwal', e.target.value)}
                className="min-h-[150px] resize-none"
                data-testid="textarea-teks-awal"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Panjang</Label>
              <Select
                value={extendConfig.targetPanjang}
                onValueChange={(value) => onExtendConfigChange('targetPanjang', value)}
              >
                <SelectTrigger data-testid="select-target-panjang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150-300 kata">150-300 kata (Paragraf)</SelectItem>
                  <SelectItem value="300-500 kata">300-500 kata (Artikel Pendek)</SelectItem>
                  <SelectItem value="500-800 kata">500-800 kata (Artikel Medium)</SelectItem>
                  <SelectItem value="800-1500 kata">800-1500 kata (Artikel Panjang)</SelectItem>
                  <SelectItem value="1500+ kata">1500+ kata (Deep Content)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'MINI_APP_BUILDER': {
        const appCount = parseInt(taskConfig.appCount || '1', 10);
        const isMultiApp = appCount > 1;

        type AppEntry = { name: string; type: string; complexity: string; description: string; features: string };
        let multiApps: AppEntry[] = [];
        try {
          multiApps = taskConfig.appMultiConfig ? JSON.parse(taskConfig.appMultiConfig) : [];
        } catch { multiApps = []; }

        const ensureAppEntries = (count: number): AppEntry[] => {
          const existing = multiApps.slice(0, count);
          while (existing.length < count) {
            existing.push({ name: '', type: 'web', complexity: 'simple', description: '', features: '' });
          }
          return existing;
        };

        const updateAppEntry = (idx: number, field: keyof AppEntry, value: string) => {
          const updated = ensureAppEntries(appCount);
          updated[idx] = { ...updated[idx], [field]: value };
          onTaskConfigChange('appMultiConfig', JSON.stringify(updated));
        };

        const APP_PLATFORMS = [
          { value: 'web', label: '🌐 Web App (React/Next.js)' },
          { value: 'mobile', label: '📱 Mobile App (React Native)' },
          { value: 'pwa', label: '📲 PWA (Progressive Web App)' },
          { value: 'chrome', label: '🧩 Chrome Extension' },
          { value: 'telegram', label: '✈️ Telegram Bot' },
          { value: 'whatsapp', label: '💬 WhatsApp Bot' },
          { value: 'notion', label: '📄 Notion Template + API' },
          { value: 'dashboard', label: '📊 Admin Dashboard' },
          { value: 'api', label: '⚙️ API / Backend Service' },
        ];

        const currentApps = ensureAppEntries(appCount);

        return (
          <div className="space-y-5">

            {/* JUMLAH APLIKASI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Jumlah Aplikasi yang Dibuat</Label>
                {isMultiApp && (
                  <Badge variant="secondary" className="text-xs">{appCount} App</Badge>
                )}
              </div>
              <Select
                value={taskConfig.appCount || '1'}
                onValueChange={(value) => {
                  onTaskConfigChange('appCount', value);
                  const newCount = parseInt(value, 10);
                  const updated = ensureAppEntries(newCount).slice(0, newCount);
                  onTaskConfigChange('appMultiConfig', JSON.stringify(updated));
                }}
              >
                <SelectTrigger data-testid="select-app-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Aplikasi</SelectItem>
                  <SelectItem value="2">2 Aplikasi (Paket Duo)</SelectItem>
                  <SelectItem value="3">3 Aplikasi (Paket Trio)</SelectItem>
                  <SelectItem value="4">4 Aplikasi (Paket Ekosistem)</SelectItem>
                  <SelectItem value="5">5 Aplikasi (Paket Enterprise)</SelectItem>
                </SelectContent>
              </Select>
              {isMultiApp && (
                <p className="text-xs text-muted-foreground">
                  AI akan membuat blueprint terpisah untuk setiap aplikasi. Isi detail masing-masing di bawah.
                </p>
              )}
            </div>

            {/* SINGLE APP MODE */}
            {!isMultiApp && (
              <>
                {/* IDENTITAS APLIKASI */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identitas Aplikasi</p>
                  <div className="space-y-2">
                    <Label>Nama Aplikasi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                    <Input
                      placeholder="Contoh: SBU Tracker Pro, Jurnal Bisnis AI, LKUTGen"
                      value={taskConfig.appName || ''}
                      onChange={(e) => onTaskConfigChange('appName', e.target.value)}
                      data-testid="input-app-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Platform / Format App</Label>
                      <Select
                        value={taskConfig.appType || 'web'}
                        onValueChange={(value) => onTaskConfigChange('appType', value)}
                      >
                        <SelectTrigger data-testid="select-app-type">
                          <SelectValue placeholder="Pilih platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {APP_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kompleksitas App</Label>
                      <Select
                        value={taskConfig.appComplexity || 'simple'}
                        onValueChange={(value) => onTaskConfigChange('appComplexity', value)}
                      >
                        <SelectTrigger data-testid="select-app-complexity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">🟢 Simple (1-2 fitur utama)</SelectItem>
                          <SelectItem value="medium">🟡 Medium (3-5 fitur)</SelectItem>
                          <SelectItem value="complex">🔴 Complex (6+ fitur + dashboard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* DESKRIPSI */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deskripsi & Konteks</p>
                  <div className="space-y-2">
                    <Label>Uraian Aplikasi</Label>
                    <Textarea
                      placeholder={`Jelaskan fungsi utama dan tujuan aplikasi ini.\nContoh: Aplikasi web untuk membantu kontraktor mengelola dokumen LKUT dan perpanjangan SBU secara otomatis.`}
                      rows={3}
                      value={taskConfig.appDescription || ''}
                      onChange={(e) => onTaskConfigChange('appDescription', e.target.value)}
                      data-testid="textarea-app-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Problem yang Diselesaikan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                    <Textarea
                      placeholder="Contoh: Kontraktor kesulitan tracking status dokumen SBU yang tersebar di banyak folder."
                      rows={2}
                      value={taskConfig.appProblem || ''}
                      onChange={(e) => onTaskConfigChange('appProblem', e.target.value)}
                      data-testid="textarea-app-problem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fitur-Fitur yang Diinginkan <span className="text-muted-foreground text-xs">(satu baris per fitur)</span></Label>
                    <Textarea
                      placeholder={`- Upload & parsing dokumen LKUT otomatis\n- Dashboard status perpanjangan SBU\n- Notifikasi H-30 deadline ke WhatsApp\n- Export laporan ke PDF`}
                      rows={4}
                      value={taskConfig.appKeyFeatures || ''}
                      onChange={(e) => onTaskConfigChange('appKeyFeatures', e.target.value)}
                      data-testid="textarea-app-key-features"
                    />
                  </div>
                </div>
              </>
            )}

            {/* MULTI APP MODE */}
            {isMultiApp && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Konfigurasi Per-Aplikasi</p>
                <div className="space-y-3">
                  {currentApps.map((app, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {app.name || `Aplikasi ${idx + 1}`}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nama Aplikasi</Label>
                          <Input
                            placeholder={`Contoh: App ${idx + 1} Name`}
                            value={app.name}
                            onChange={(e) => updateAppEntry(idx, 'name', e.target.value)}
                            className="h-8 text-sm"
                            data-testid={`input-multi-app-name-${idx}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Platform</Label>
                          <Select
                            value={app.type || 'web'}
                            onValueChange={(value) => updateAppEntry(idx, 'type', value)}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid={`select-multi-app-type-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APP_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Kompleksitas</Label>
                        <Select
                          value={app.complexity || 'simple'}
                          onValueChange={(value) => updateAppEntry(idx, 'complexity', value)}
                        >
                          <SelectTrigger className="h-8 text-sm" data-testid={`select-multi-app-complexity-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">🟢 Simple</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="complex">🔴 Complex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Uraian & Fitur Utama</Label>
                        <Textarea
                          placeholder={`Contoh:\nAplikasi untuk tracking deadline SBU.\nFitur: upload dokumen, notifikasi H-30, export PDF.`}
                          rows={3}
                          value={app.description}
                          onChange={(e) => updateAppEntry(idx, 'description', e.target.value)}
                          className="text-sm resize-none"
                          data-testid={`textarea-multi-app-desc-${idx}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEKNOLOGI & MONETISASI (berlaku untuk semua app) */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Teknologi & Monetisasi {isMultiApp ? '(berlaku untuk semua app)' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferensi Teknologi</Label>
                  <Select
                    value={taskConfig.appTechPreference || 'auto'}
                    onValueChange={(value) => onTaskConfigChange('appTechPreference', value)}
                  >
                    <SelectTrigger data-testid="select-app-tech">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 Auto (AI pilihkan terbaik)</SelectItem>
                      <SelectItem value="nocode">🎨 No-Code (Lovable / Bolt.new)</SelectItem>
                      <SelectItem value="lowcode">⚡ Low-Code (Bubble / Webflow)</SelectItem>
                      <SelectItem value="react">⚛️ React + Node.js</SelectItem>
                      <SelectItem value="nextjs">▲ Next.js + Supabase</SelectItem>
                      <SelectItem value="python">🐍 Python (FastAPI / Django)</SelectItem>
                      <SelectItem value="flutter">🦋 Flutter (Cross-platform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model Monetisasi</Label>
                  <Select
                    value={taskConfig.appMonetization || 'gratis'}
                    onValueChange={(value) => onTaskConfigChange('appMonetization', value)}
                  >
                    <SelectTrigger data-testid="select-app-monetization">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gratis">🎁 Gratis / Open Source</SelectItem>
                      <SelectItem value="freemium">✨ Freemium (fitur dasar gratis)</SelectItem>
                      <SelectItem value="berbayar">💳 Berbayar (one-time)</SelectItem>
                      <SelectItem value="subscription">🔄 Subscription / SaaS</SelectItem>
                      <SelectItem value="internal">🏢 Internal Tool (perusahaan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Deploy / Hosting <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input
                  placeholder="Contoh: Vercel, Railway, Google Play Store, internal server"
                  value={taskConfig.appDeployTarget || ''}
                  onChange={(e) => onTaskConfigChange('appDeployTarget', e.target.value)}
                  data-testid="input-app-deploy-target"
                />
              </div>
            </div>

          </div>
        );
      }

      case 'QUIZ_MAKER': {
        const QUIZ_TYPE_OPTIONS = [
          { type: 'pg',       label: 'Pilihan Ganda (MCQ)',        defaultCount: 10 },
          { type: 'bs',       label: 'Benar / Salah',              defaultCount: 5  },
          { type: 'isian',    label: 'Isian Singkat',               defaultCount: 5  },
          { type: 'es',       label: 'Esai Pendek',                defaultCount: 3  },
          { type: 'matching', label: 'Menjodohkan (Matching)',      defaultCount: 5  },
          { type: 'sk',       label: 'Studi Kasus',                defaultCount: 1  },
          { type: 'praktik',  label: 'Unjuk Kerja / Praktik',      defaultCount: 1  },
        ];

        type QuizTypeEntry = { type: string; label: string; count: number; enabled: boolean };
        let quizTypes: QuizTypeEntry[] = [];
        try {
          quizTypes = taskConfig.quizTypeConfig ? JSON.parse(taskConfig.quizTypeConfig) : [];
        } catch { quizTypes = []; }

        // Ensure all options are represented
        const mergedTypes: QuizTypeEntry[] = QUIZ_TYPE_OPTIONS.map(opt => {
          const existing = quizTypes.find(q => q.type === opt.type);
          return existing ?? { type: opt.type, label: opt.label, count: opt.defaultCount, enabled: false };
        });
        // Default: enable pg and es if nothing selected
        const hasAnyEnabled = mergedTypes.some(q => q.enabled);
        if (!hasAnyEnabled && !taskConfig.quizTypeConfig) {
          mergedTypes[0].enabled = true; // pg
          mergedTypes[3].enabled = true; // es
        }

        const toggleQuizType = (type: string) => {
          const updated = mergedTypes.map(q => q.type === type ? { ...q, enabled: !q.enabled } : q);
          onTaskConfigChange('quizTypeConfig', JSON.stringify(updated));
        };
        const setQuizCount = (type: string, count: number) => {
          const updated = mergedTypes.map(q => q.type === type ? { ...q, count: Math.max(1, count) } : q);
          onTaskConfigChange('quizTypeConfig', JSON.stringify(updated));
        };

        const totalSoal = mergedTypes.filter(q => q.enabled).reduce((sum, q) => sum + q.count, 0);
        const scopeNeedsBab = ['per_bab', 'per_sesi'].includes(taskConfig.quizScope || 'komprehensif');

        return (
          <div className="space-y-5">

            {/* LINGKUP QUIZ */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lingkup & Cakupan</p>
              <div className="space-y-2">
                <Label>Jenis Quiz</Label>
                <Select
                  value={taskConfig.quizScope || 'komprehensif'}
                  onValueChange={(value) => onTaskConfigChange('quizScope', value)}
                >
                  <SelectTrigger data-testid="select-quiz-scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_test">📋 Pre-Test (sebelum materi)</SelectItem>
                    <SelectItem value="per_bab">📖 Quiz Per Bab</SelectItem>
                    <SelectItem value="per_sesi">🎯 Quiz Per Sesi/Modul</SelectItem>
                    <SelectItem value="akhir_modul">✅ Quiz Akhir Modul</SelectItem>
                    <SelectItem value="post_test">🎓 Post-Test (setelah semua materi)</SelectItem>
                    <SelectItem value="komprehensif">📚 Komprehensif (semua bab)</SelectItem>
                    <SelectItem value="remedial">🔁 Remedial / Pengulangan</SelectItem>
                    <SelectItem value="sertifikasi">🏆 Ujian Sertifikasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scopeNeedsBab && (
                <div className="space-y-2">
                  <Label>Referensi Bab / Sesi <span className="text-muted-foreground text-xs">(soal dibuat dari bab/sesi ini)</span></Label>
                  <Input
                    placeholder="Contoh: Bab 3 – Strategi Pemasaran Digital, atau Sesi 2: Analisis Keuangan"
                    value={taskConfig.quizBabRef || ''}
                    onChange={(e) => onTaskConfigChange('quizBabRef', e.target.value)}
                    data-testid="input-quiz-bab-ref"
                  />
                </div>
              )}
            </div>

            {/* JENIS SOAL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jenis Soal & Jumlah</p>
                {totalSoal > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Total: {totalSoal} soal
                  </span>
                )}
              </div>
              <div className="border rounded-md divide-y" data-testid="quiz-type-list">
                {mergedTypes.map((qt) => (
                  <div
                    key={qt.type}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 transition-colors",
                      qt.enabled ? "bg-primary/5" : "hover:bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={qt.enabled}
                      onCheckedChange={() => toggleQuizType(qt.type)}
                      data-testid={`checkbox-quiz-type-${qt.type}`}
                    />
                    <span className={cn("flex-1 text-sm", qt.enabled ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {qt.label}
                    </span>
                    {qt.enabled && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          className="w-6 h-6 rounded border text-xs hover:bg-muted flex items-center justify-center"
                          onClick={() => setQuizCount(qt.type, qt.count - 1)}
                          data-testid={`btn-quiz-dec-${qt.type}`}
                        >−</button>
                        <span className="w-8 text-center text-sm font-mono font-semibold">{qt.count}</span>
                        <button
                          className="w-6 h-6 rounded border text-xs hover:bg-muted flex items-center justify-center"
                          onClick={() => setQuizCount(qt.type, qt.count + 1)}
                          data-testid={`btn-quiz-inc-${qt.type}`}
                        >+</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Centang jenis soal yang diinginkan, lalu atur jumlahnya.</p>
            </div>

            {/* TINGKAT & FOKUS */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tingkat Kesulitan & Fokus</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level Kesulitan</Label>
                  <Select
                    value={taskConfig.fokusLevel || 'Intermediate'}
                    onValueChange={(value) => onTaskConfigChange('fokusLevel', value)}
                  >
                    <SelectTrigger data-testid="select-quiz-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">🟢 Beginner (dasar)</SelectItem>
                      <SelectItem value="Intermediate">🟡 Intermediate (menengah)</SelectItem>
                      <SelectItem value="Advanced">🟠 Advanced (lanjut)</SelectItem>
                      <SelectItem value="Expert">🔴 Expert (profesional)</SelectItem>
                      <SelectItem value="Mixed">🎯 Mixed (campuran semua level)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fokus Penilaian</Label>
                  <Select
                    value={taskConfig.quizFocus || 'komprehensif'}
                    onValueChange={(value) => onTaskConfigChange('quizFocus', value)}
                  >
                    <SelectTrigger data-testid="select-quiz-focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="komprehensif">Komprehensif (semua aspek)</SelectItem>
                      <SelectItem value="teori">Teori & Konsep</SelectItem>
                      <SelectItem value="praktik">Praktik & Aplikasi</SelectItem>
                      <SelectItem value="analisis">Analisis & Evaluasi</SelectItem>
                      <SelectItem value="hafalan">Hafalan & Definisi</SelectItem>
                      <SelectItem value="pemecahan">Pemecahan Masalah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* FORMAT & OUTPUT */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format Output & Lainnya</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format Output</Label>
                  <Select
                    value={taskConfig.quizFormat || 'plain'}
                    onValueChange={(value) => onTaskConfigChange('quizFormat', value)}
                  >
                    <SelectTrigger data-testid="select-quiz-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain">📄 Plain Text (siap copy-paste)</SelectItem>
                      <SelectItem value="google_form">📊 Google Form (template siap isi)</SelectItem>
                      <SelectItem value="cetak">🖨️ Siap Cetak (format lembar ujian)</SelectItem>
                      <SelectItem value="lms">💻 LMS / Moodle (format GIFT/XML)</SelectItem>
                      <SelectItem value="markdown">✍️ Markdown (untuk Notion/Obsidian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimasi Durasi Pengerjaan</Label>
                  <Select
                    value={taskConfig.quizDuration || '30 menit'}
                    onValueChange={(value) => onTaskConfigChange('quizDuration', value)}
                  >
                    <SelectTrigger data-testid="select-quiz-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10 menit">⚡ 10 menit (quick check)</SelectItem>
                      <SelectItem value="15 menit">15 menit</SelectItem>
                      <SelectItem value="30 menit">30 menit</SelectItem>
                      <SelectItem value="45 menit">45 menit</SelectItem>
                      <SelectItem value="60 menit">60 menit (1 jam)</SelectItem>
                      <SelectItem value="90 menit">90 menit (1,5 jam)</SelectItem>
                      <SelectItem value="120 menit">🎓 120 menit (ujian penuh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sertakan Kunci Jawaban</Label>
                  <Select
                    value={taskConfig.quizIncludeKey || 'ya'}
                    onValueChange={(value) => onTaskConfigChange('quizIncludeKey', value)}
                  >
                    <SelectTrigger data-testid="select-quiz-include-key">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ya">✅ Ya — sertakan kunci + pembahasan</SelectItem>
                      <SelectItem value="kunci_only">🔑 Kunci saja (tanpa pembahasan)</SelectItem>
                      <SelectItem value="tidak">❌ Tidak — soal saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Konteks / Topik Fokus Tambahan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  placeholder="Contoh: Fokuskan soal pada subtopik Manajemen Keuangan dan Perencanaan Anggaran saja. Hindari pertanyaan tentang bab 1."
                  rows={2}
                  value={taskConfig.quizContext || ''}
                  onChange={(e) => onTaskConfigChange('quizContext', e.target.value)}
                  data-testid="textarea-quiz-context"
                />
              </div>
            </div>

          </div>
        );
      }

      case 'PODCAST_GENERATOR': {
        const INTERACTION_OPTIONS = [
          { id: 'sokrates',      label: '🧠 Pertanyaan Sokratik',    desc: 'Host menggali asumsi & definisi secara mendalam' },
          { id: 'devil',         label: '😈 Devil\'s Advocate',       desc: 'Host menantang argumen Guest secara kritis' },
          { id: 'roleplay',      label: '🎭 Role-Play Pemula',        desc: 'Host pura-pura tidak tahu, Guest jelaskan dari dasar' },
          { id: 'analogi',       label: '🔗 Analogi & Metafora',      desc: 'Terjemahkan konsep kompleks dengan perumpamaan nyata' },
          { id: 'hot_take',      label: '🔥 Hot Take',                desc: 'Pernyataan kontroversial lalu dibedah bersama' },
          { id: 'data_driven',   label: '📊 Data-Driven Dialog',      desc: 'Referensi angka, riset, dan data dari materi ebook' },
          { id: 'reflektif',     label: '🪞 Momen Reflektif',         desc: 'Jeda dan renungkan makna mendalam dari insight buku' },
          { id: 'storytelling',  label: '📖 Sharing Cerita Nyata',    desc: 'Guest berbagi pengalaman nyata yang relevan' },
        ];
        const SPECIAL_SEGMENT_OPTIONS = [
          { id: 'lightning',   label: '⚡ Lightning Round',         desc: '5 pertanyaan cepat di akhir episode' },
          { id: 'qa_live',     label: '🙋 Sesi Q&A Simulasi',      desc: 'Host bawakan pertanyaan dari audiens/pembaca' },
          { id: 'hot_seat',    label: '🪑 Hot Seat',                desc: 'Satu pertanyaan paling krusial dibahas tuntas' },
          { id: 'mitos_fakta', label: '🔍 Mitos vs Fakta',         desc: 'Debunking miskonsepsi umum seputar topik ebook' },
          { id: 'top3',        label: '🏆 Top 3 Key Insight',      desc: 'Tiga poin paling berharga dari materi buku' },
          { id: 'aksi_nyata',  label: '🎯 Satu Aksi Nyata',        desc: '1 langkah konkret yang bisa pendengar lakukan hari ini' },
        ];

        const selectedInteractions = (taskConfig.podcastInteractionStyle || '').split('|||').filter(Boolean);
        const selectedSpecials = (taskConfig.podcastSpecialSegments || '').split('|||').filter(Boolean);

        const togglePodcastOption = (field: string, currentVal: string, id: string) => {
          const parts = currentVal.split('|||').filter(Boolean);
          const updated = parts.includes(id) ? parts.filter(p => p !== id) : [...parts, id];
          onTaskConfigChange(field, updated.join('|||'));
        };

        return (
          <div className="space-y-5">

            {/* KARAKTER PODCAST */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Karakter Pembicara</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Host (Pembawa Acara)</Label>
                  <Input
                    placeholder="Contoh: Andi, Budi, Reza..."
                    value={taskConfig.podcastHost || 'Andi'}
                    onChange={(e) => onTaskConfigChange('podcastHost', e.target.value)}
                    data-testid="input-podcast-host"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Guest / Narasumber</Label>
                  <Input
                    placeholder="Contoh: Sari, Michael, Dewi..."
                    value={taskConfig.podcastGuest || 'Sari'}
                    onChange={(e) => onTaskConfigChange('podcastGuest', e.target.value)}
                    data-testid="input-podcast-guest"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Persona Host <span className="text-muted-foreground text-xs">(karakter & gaya bicara)</span></Label>
                  <Textarea
                    placeholder={`Contoh: Host yang kritis dan antusias, suka menggali detail. Berpengalaman sebagai jurnalis, bicara lugas namun ramah. Sering minta contoh nyata.`}
                    rows={3}
                    value={taskConfig.podcastHostPersona || ''}
                    onChange={(e) => onTaskConfigChange('podcastHostPersona', e.target.value)}
                    className="text-sm resize-none"
                    data-testid="textarea-podcast-host-persona"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Persona Guest <span className="text-muted-foreground text-xs">(latar belakang & keahlian)</span></Label>
                  <Textarea
                    placeholder={`Contoh: Praktisi dengan 10 tahun pengalaman di industri. Penulis buku ini. Berbicara berbasis data dan pengalaman nyata, kadang menggunakan analogi sederhana.`}
                    rows={3}
                    value={taskConfig.podcastGuestPersona || ''}
                    onChange={(e) => onTaskConfigChange('podcastGuestPersona', e.target.value)}
                    className="text-sm resize-none"
                    data-testid="textarea-podcast-guest-persona"
                  />
                </div>
              </div>
            </div>

            {/* FORMAT & GAYA */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format & Gaya Dialog</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gaya Utama Podcast</Label>
                  <Select
                    value={taskConfig.podcastStyle || 'interview'}
                    onValueChange={(value) => onTaskConfigChange('podcastStyle', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">🎤 Interview — Host tanya, Guest paparkan</SelectItem>
                      <SelectItem value="debate">⚔️ Debate — Dua sudut pandang berbeda</SelectItem>
                      <SelectItem value="masterclass">🎓 Masterclass — Guest ajar seperti kelas</SelectItem>
                      <SelectItem value="fireside">🔥 Fireside Chat — Percakapan intim & mendalam</SelectItem>
                      <SelectItem value="educational">📚 Educational — Step-by-step dengan penjelasan</SelectItem>
                      <SelectItem value="storytelling">📖 Storytelling — Narasi & pengalaman nyata</SelectItem>
                      <SelectItem value="panel">👥 Panel Discussion — Beberapa perspektif</SelectItem>
                      <SelectItem value="casual">☕ Casual Talk — Obrolan santai tapi informatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gaya Bahasa</Label>
                  <Select
                    value={taskConfig.podcastLanguageStyle || 'semiformal'}
                    onValueChange={(value) => onTaskConfigChange('podcastLanguageStyle', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">🎩 Formal (Bahasa Indonesia baku)</SelectItem>
                      <SelectItem value="semiformal">👔 Semi-Formal (baku tapi mengalir)</SelectItem>
                      <SelectItem value="casual">👕 Kasual (santai, campuran sehari-hari)</SelectItem>
                      <SelectItem value="gaul">🤙 Gaul/Kekinian (milenial & gen-Z friendly)</SelectItem>
                      <SelectItem value="bilingual">🌐 Bilingual (campur Indonesia-Inggris)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Energi & Tempo Dialog</Label>
                  <Select
                    value={taskConfig.podcastEnergyLevel || 'moderate'}
                    onValueChange={(value) => onTaskConfigChange('podcastEnergyLevel', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-energy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calm">🧘 Tenang & Reflektif — tempo lambat, banyak jeda pikir</SelectItem>
                      <SelectItem value="moderate">⚖️ Seimbang — natural dan mengalir</SelectItem>
                      <SelectItem value="energetic">⚡ Energik & Dinamis — cepat, banyak back-and-forth</SelectItem>
                      <SelectItem value="intense">🔥 Intens & Serius — fokus, tidak banyak basa-basi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durasi Episode</Label>
                  <Select
                    value={taskConfig.podcastEpisodeLength || '15-20 menit'}
                    onValueChange={(value) => onTaskConfigChange('podcastEpisodeLength', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-length">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-10 menit">5-10 menit (Mini Episode)</SelectItem>
                      <SelectItem value="15-20 menit">15-20 menit (Standard)</SelectItem>
                      <SelectItem value="30-45 menit">30-45 menit (Deep Dive)</SelectItem>
                      <SelectItem value="60+ menit">60+ menit (Webinar Style)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Segmen / Babak</Label>
                <Select
                  value={taskConfig.podcastSegments || '5'}
                  onValueChange={(value) => onTaskConfigChange('podcastSegments', value)}
                >
                  <SelectTrigger data-testid="select-podcast-segments">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Segmen (Opening → Inti → Closing)</SelectItem>
                    <SelectItem value="5">5 Segmen (Standard)</SelectItem>
                    <SelectItem value="7">7 Segmen (Detail)</SelectItem>
                    <SelectItem value="10">10 Segmen (Full Episode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TEKNIK INTERAKSI */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Teknik Interaksi Dialog
                {selectedInteractions.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-primary">({selectedInteractions.length} aktif)</span>
                )}
              </p>
              <div className="border rounded-md divide-y" data-testid="podcast-interaction-list">
                {INTERACTION_OPTIONS.map((opt) => {
                  const isSelected = selectedInteractions.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={cn("flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted/40")}
                      onClick={() => togglePodcastOption('podcastInteractionStyle', taskConfig.podcastInteractionStyle || '', opt.id)}
                      data-testid={`checkbox-interaction-${opt.id}`}
                    >
                      <Checkbox checked={isSelected} className="mt-0.5 shrink-0" />
                      <div>
                        <p className={cn("text-sm", isSelected ? "font-medium text-foreground" : "text-muted-foreground")}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Pilih teknik yang akan mendominasi percakapan. Bisa pilih lebih dari satu.</p>
            </div>

            {/* KNOWLEDGE MINING */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penggalian Knowledge Base Ebook</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kedalaman Eksplorasi Materi</Label>
                  <Select
                    value={taskConfig.podcastKnowledgeDepth || 'deep'}
                    onValueChange={(value) => onTaskConfigChange('podcastKnowledgeDepth', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-knowledge-depth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surface">🌊 Permukaan — Poin utama & highlight saja</SelectItem>
                      <SelectItem value="intermediate">⚓ Menengah — Bahas konsep + beberapa contoh</SelectItem>
                      <SelectItem value="deep">🤿 Mendalam — Gali detail, nuansa, dan konteks</SelectItem>
                      <SelectItem value="exhaustive">🔬 Exhaustif — Kupas tuntas termasuk lampiran & referensi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fokus Konten dari Ebook</Label>
                  <Select
                    value={taskConfig.podcastKnowledgeFocus || 'semua'}
                    onValueChange={(value) => onTaskConfigChange('podcastKnowledgeFocus', value)}
                  >
                    <SelectTrigger data-testid="select-podcast-knowledge-focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">📚 Semua Aspek (komprehensif)</SelectItem>
                      <SelectItem value="teori">🧪 Teori & Konsep Inti</SelectItem>
                      <SelectItem value="praktik">🛠️ Tips & Langkah Praktis</SelectItem>
                      <SelectItem value="studi_kasus">🏢 Studi Kasus & Contoh Nyata</SelectItem>
                      <SelectItem value="data_riset">📊 Data, Angka & Riset</SelectItem>
                      <SelectItem value="insight">💡 Insight & Perspektif Unik Penulis</SelectItem>
                      <SelectItem value="lampiran">📎 Lampiran & Referensi Tambahan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pertanyaan / Topik Kunci yang Harus Dibahas <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  placeholder={`Contoh:\n1. Apa perbedaan antara strategi X dan Y di bab 3?\n2. Bagaimana menerapkan framework Z untuk UMKM?\n3. Kenapa penulis tidak setuju dengan pendapat konvensional soal...`}
                  rows={4}
                  value={taskConfig.podcastKeyQuestions || ''}
                  onChange={(e) => onTaskConfigChange('podcastKeyQuestions', e.target.value)}
                  className="text-sm resize-none"
                  data-testid="textarea-podcast-key-questions"
                />
                <p className="text-xs text-muted-foreground">Pertanyaan ini akan diprioritaskan Host untuk menggali jawaban Guest.</p>
              </div>
            </div>

            {/* SEGMEN KHUSUS */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Segmen Khusus (Opsional)
                {selectedSpecials.length > 0 && (
                  <span className="ml-2 normal-case font-normal text-primary">({selectedSpecials.length} dipilih)</span>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="podcast-special-segments">
                {SPECIAL_SEGMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedSpecials.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={cn("flex items-start gap-2.5 px-3 py-2 rounded-md border cursor-pointer transition-colors", isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/40 border-transparent")}
                      onClick={() => togglePodcastOption('podcastSpecialSegments', taskConfig.podcastSpecialSegments || '', opt.id)}
                      data-testid={`checkbox-special-${opt.id}`}
                    >
                      <Checkbox checked={isSelected} className="mt-0.5 shrink-0" />
                      <div>
                        <p className={cn("text-sm", isSelected ? "font-medium text-foreground" : "text-muted-foreground")}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      }

      case 'AUDIOBOOK_SCRIPT': {
        const AB_SPECIAL_ELEMENTS = [
          { id: 'metafora',    label: '🔗 Metafora & Analogi Kreatif', desc: 'Terjemahkan konsep abstrak dengan perumpamaan nyata yang mudah divisualisasi' },
          { id: 'anekdot',     label: '📖 Anekdot Pembuka Bab',        desc: 'Setiap bab dibuka dengan mini-cerita nyata yang relevan sebelum masuk materi' },
          { id: 'cta_bab',     label: '🎯 Call-to-Action Per Bab',     desc: 'Ajakan bertindak spesifik di akhir setiap bab yang bisa langsung dilakukan' },
          { id: 'quiz_mini',   label: '🧠 Kuis Refleksi Mini',         desc: 'Pertanyaan reflektif di akhir bab: "Sebelum lanjut, coba jawab dalam hati..."' },
          { id: 'motivasi',    label: '💫 Kutipan Motivasional',       desc: 'Sisipkan kutipan kuat dari tokoh relevan untuk memperkuat poin kunci' },
          { id: 'recap',       label: '📋 Recap Visual Verbal',        desc: 'Deskripsi verbal dari tabel/diagram dalam buku agar pendengar bisa membayangkan' },
          { id: 'challenge',   label: '🏆 Daily Challenge',            desc: 'Tantangan konkret 24 jam yang bisa langsung dipraktikkan setelah bab selesai' },
          { id: 'afirmasi',    label: '✨ Afirmasi & Reinforcement',   desc: 'Pernyataan positif dan penguatan di akhir bab untuk internalisasi materi' },
        ];

        const selectedSpecials = (taskConfig.audiobookSpecialElements || '').split('|||').filter(Boolean);
        const toggleAbElement = (id: string) => {
          const parts = (taskConfig.audiobookSpecialElements || '').split('|||').filter(Boolean);
          const updated = parts.includes(id) ? parts.filter(p => p !== id) : [...parts, id];
          onTaskConfigChange('audiobookSpecialElements', updated.join('|||'));
        };
        const needsChapterRef = ['per_bab', 'single_bab', 'intro'].includes(taskConfig.audiobookChapterFocus || 'full');

        return (
          <div className="space-y-5">

            {/* PERSONA NARATOR */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Persona Narator</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Narator <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    placeholder="Contoh: Budi Santoso, Sarah Wijaya..."
                    value={taskConfig.audiobookNarrator || ''}
                    onChange={(e) => onTaskConfigChange('audiobookNarrator', e.target.value)}
                    data-testid="input-audiobook-narrator"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gaya Narasi / Tone Suara</Label>
                  <Select
                    value={taskConfig.audiobookTone || 'conversational'}
                    onValueChange={(value) => onTaskConfigChange('audiobookTone', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">☕ Conversational — Santai, seperti ngobrol langsung</SelectItem>
                      <SelectItem value="authoritative">🎓 Authoritative — Tegas & meyakinkan seperti pakar</SelectItem>
                      <SelectItem value="warm">🌸 Warm & Friendly — Hangat, empatik, suportif</SelectItem>
                      <SelectItem value="dramatic">🎭 Dramatic — Dramatis, penuh penghayatan emosi</SelectItem>
                      <SelectItem value="academic">📐 Academic — Formal, ilmiah, terminologi tepat</SelectItem>
                      <SelectItem value="motivational">🔥 Motivational — Penuh semangat & energi tinggi</SelectItem>
                      <SelectItem value="storyteller">📚 Storyteller — Seperti mendongeng, penuh imajinasi</SelectItem>
                      <SelectItem value="mentor">🤝 Mentor — Bijak, sabar, membimbing step by step</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Karakter & Persona Narator <span className="text-muted-foreground text-xs">(opsional — deskripsikan karakter suara)</span></Label>
                <Textarea
                  placeholder={`Contoh: Narator perempuan berusia 35 tahun dengan suara hangat dan berwibawa. Bicara dengan ritme yang tenang namun penuh keyakinan. Sesekali menyapa pendengar langsung dengan "kamu" atau "Anda". Tidak terlalu formal, tapi selalu profesional.`}
                  rows={3}
                  value={taskConfig.audiobookNarratorPersona || ''}
                  onChange={(e) => onTaskConfigChange('audiobookNarratorPersona', e.target.value)}
                  className="text-sm resize-none"
                  data-testid="textarea-audiobook-narrator-persona"
                />
              </div>
            </div>

            {/* GAYA & PRODUKSI */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gaya & Produksi Narasi</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kecepatan Pacing</Label>
                  <Select
                    value={taskConfig.audiobookPace || 'medium'}
                    onValueChange={(value) => onTaskConfigChange('audiobookPace', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-pace">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_slow">🐢 Sangat Lambat — meditasi, tidur, deep focus</SelectItem>
                      <SelectItem value="slow">🚶 Lambat — penuh jeda, kontemplatif</SelectItem>
                      <SelectItem value="medium">🚴 Sedang — standar audiobook profesional</SelectItem>
                      <SelectItem value="fast">🏃 Cepat — ringkas, langsung ke inti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gaya Bahasa</Label>
                  <Select
                    value={taskConfig.audiobookLanguageStyle || 'semiformal'}
                    onValueChange={(value) => onTaskConfigChange('audiobookLanguageStyle', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">🎩 Formal — Baku, "Anda", tanpa ekspresi informal</SelectItem>
                      <SelectItem value="semiformal">👔 Semi-Formal — Baku tapi mengalir natural</SelectItem>
                      <SelectItem value="casual">👕 Kasual — Santai, "kamu", sehari-hari</SelectItem>
                      <SelectItem value="bilingual">🌐 Bilingual — Campuran Indonesia-Inggris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Penekanan Emosi</Label>
                  <Select
                    value={taskConfig.audiobookEmphasis || 'moderate'}
                    onValueChange={(value) => onTaskConfigChange('audiobookEmphasis', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-emphasis">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">📊 Minimal — Netral, informatif, tanpa drama</SelectItem>
                      <SelectItem value="moderate">⚖️ Moderate — Seimbang fakta & nuansa emosi</SelectItem>
                      <SelectItem value="strong">🎭 Kuat — Penuh penghayatan & ekspresi mendalam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Konteks Mendengarkan</Label>
                  <Select
                    value={taskConfig.audiobookListeningContext || 'general'}
                    onValueChange={(value) => onTaskConfigChange('audiobookListeningContext', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-context">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📻 Umum / Fleksibel</SelectItem>
                      <SelectItem value="commute">🚗 Perjalanan (commute) — fokus tetap di jalan</SelectItem>
                      <SelectItem value="study">📖 Belajar Serius — konsentrasi penuh</SelectItem>
                      <SelectItem value="workout">🏋️ Olahraga — energik, memompa semangat</SelectItem>
                      <SelectItem value="relax">🛋️ Santai di Rumah — nyaman, tidak terburu</SelectItem>
                      <SelectItem value="sleep">🌙 Menjelang Tidur — pelan, menenangkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Musik Latar / Suasana Audio</Label>
                  <Select
                    value={taskConfig.audiobookMusicStyle || 'instrumental'}
                    onValueChange={(value) => onTaskConfigChange('audiobookMusicStyle', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-music">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">🔇 Tanpa Musik — narasi saja</SelectItem>
                      <SelectItem value="instrumental">🎵 Instrumental Ringan — standar audiobook</SelectItem>
                      <SelectItem value="ambient">🌊 Ambient / Nature Sound</SelectItem>
                      <SelectItem value="cinematic">🎬 Cinematic / Dramatis</SelectItem>
                      <SelectItem value="motivational">⚡ Upbeat Motivational</SelectItem>
                      <SelectItem value="meditation">🧘 Meditasi / Lo-fi Tenang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* CAKUPAN & STRUKTUR */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cakupan & Struktur Bab</p>
              <div className="space-y-2">
                <Label>Fokus Output</Label>
                <Select
                  value={taskConfig.audiobookChapterFocus || 'full'}
                  onValueChange={(value) => onTaskConfigChange('audiobookChapterFocus', value)}
                >
                  <SelectTrigger data-testid="select-audiobook-chapter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">📚 Seluruh Buku — narasi lengkap semua bab</SelectItem>
                    <SelectItem value="intro">🎬 Intro + Bab 1 — preview menarik untuk promosi</SelectItem>
                    <SelectItem value="per_bab">📖 Per Bab Tertentu — pilih bab spesifik</SelectItem>
                    <SelectItem value="summary">📝 Ringkasan Per Bab — poin utama saja</SelectItem>
                    <SelectItem value="highlights">✨ Highlight Terbaik — kutipan & insight paling impactful</SelectItem>
                    <SelectItem value="single_bab">🎯 Satu Bab Saja — deep dive satu bab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {needsChapterRef && (
                <div className="space-y-2">
                  <Label>Referensi Bab / Bagian Spesifik</Label>
                  <Input
                    placeholder="Contoh: Bab 3 – Strategi Pemasaran Digital, atau Bab 5 & 6, atau Pendahuluan"
                    value={taskConfig.audiobookChapterRef || ''}
                    onChange={(e) => onTaskConfigChange('audiobookChapterRef', e.target.value)}
                    data-testid="input-audiobook-chapter-ref"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gaya Pembuka Setiap Bab</Label>
                  <Select
                    value={taskConfig.audiobookOpeningStyle || 'hook'}
                    onValueChange={(value) => onTaskConfigChange('audiobookOpeningStyle', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-opening">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hook">🪝 Hook Kuat — pernyataan mengejutkan atau pertanyaan provokatif</SelectItem>
                      <SelectItem value="anekdot">📖 Anekdot / Mini-Cerita — kisah nyata sebelum masuk materi</SelectItem>
                      <SelectItem value="fakta">📊 Fakta Mengejutkan — statistik atau data yang tidak terduga</SelectItem>
                      <SelectItem value="pertanyaan">❓ Pertanyaan Reflektif — ajak pendengar berpikir</SelectItem>
                      <SelectItem value="kutipan">💬 Kutipan Inspiratif — dari tokoh relevan</SelectItem>
                      <SelectItem value="langsung">⚡ Langsung ke Inti — tanpa basa-basi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gaya Penutup Setiap Bab</Label>
                  <Select
                    value={taskConfig.audiobookClosingStyle || 'summary'}
                    onValueChange={(value) => onTaskConfigChange('audiobookClosingStyle', value)}
                  >
                    <SelectTrigger data-testid="select-audiobook-closing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">📋 Ringkasan 3 Poin — recap singkat</SelectItem>
                      <SelectItem value="teaser">🔮 Teaser Bab Berikutnya — cliffhanger menarik</SelectItem>
                      <SelectItem value="challenge">🏆 Tantangan Praktis — 1 aksi nyata untuk dilakukan</SelectItem>
                      <SelectItem value="refleksi">🪞 Pertanyaan Refleksi — ajak introspeksi</SelectItem>
                      <SelectItem value="motivasi">💪 Pesan Motivasi — kata-kata penguatan</SelectItem>
                      <SelectItem value="kombinasi">⚡ Kombinasi — ringkasan + teaser + aksi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ELEMEN KHUSUS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elemen Khusus dalam Narasi</p>
                {selectedSpecials.length > 0 && (
                  <span className="text-xs text-primary">({selectedSpecials.length} aktif)</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="audiobook-special-elements">
                {AB_SPECIAL_ELEMENTS.map((el) => {
                  const isSelected = selectedSpecials.includes(el.id);
                  return (
                    <div
                      key={el.id}
                      className={cn("flex items-start gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors", isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/40 border-transparent")}
                      onClick={() => toggleAbElement(el.id)}
                      data-testid={`checkbox-ab-element-${el.id}`}
                    >
                      <Checkbox checked={isSelected} className="mt-0.5 shrink-0" />
                      <div>
                        <p className={cn("text-sm leading-tight", isSelected ? "font-medium text-foreground" : "text-muted-foreground")}>{el.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{el.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TIP */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Notasi Produksi:</strong> Script dilengkapi cue{' '}
                <code className="bg-muted px-1 rounded text-xs">[JEDA PENDEK]</code>{' '}
                <code className="bg-muted px-1 rounded text-xs">[PENEKANAN]</code>{' '}
                <code className="bg-muted px-1 rounded text-xs">[NADA NAIK]</code>{' '}
                <code className="bg-muted px-1 rounded text-xs">[MUSIK INTRO]</code>{' '}
                untuk memandu rekaman secara profesional.
              </p>
            </div>

          </div>
        );
      }

      case 'LANDING_PAGE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Landing Page</Label>
                <Select
                  value={taskConfig.landingPageStyle || 'long-form'}
                  onValueChange={(v) => onTaskConfigChange('landingPageStyle', v)}
                >
                  <SelectTrigger data-testid="select-lp-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long-form">Long-Form Sales Letter (konversi tinggi)</SelectItem>
                    <SelectItem value="short">Short Copy (simpel & langsung)</SelectItem>
                    <SelectItem value="vsl">VSL Page (Video Sales Letter)</SelectItem>
                    <SelectItem value="webinar">Webinar Registration Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tujuan Utama</Label>
                <Select
                  value={taskConfig.landingPageGoal || 'sell'}
                  onValueChange={(v) => onTaskConfigChange('landingPageGoal', v)}
                >
                  <SelectTrigger data-testid="select-lp-goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sell">Jual Ebook (direct selling)</SelectItem>
                    <SelectItem value="lead">Kumpulkan Lead (email/WA)</SelectItem>
                    <SelectItem value="webinar">Daftar Webinar Gratis</SelectItem>
                    <SelectItem value="waitlist">Join Waitlist / Pre-launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga Produk</Label>
                <Input
                  placeholder="Contoh: Rp 97.000 / Rp 197.000 / Gratis"
                  value={taskConfig.landingPagePrice || ''}
                  onChange={(e) => onTaskConfigChange('landingPagePrice', e.target.value)}
                  data-testid="input-lp-price"
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol CTA</Label>
                <Input
                  placeholder="Contoh: Beli Sekarang / Dapatkan Gratis / Daftar"
                  value={taskConfig.landingPageCTA || 'Beli Sekarang'}
                  onChange={(e) => onTaskConfigChange('landingPageCTA', e.target.value)}
                  data-testid="input-lp-cta"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bonus / Materi Tambahan (opsional)</Label>
              <Textarea
                placeholder="Contoh: Bonus Worksheet PDF, Template Canva, Akses Grup WA Premium, Video Tutorial 2 Jam..."
                value={taskConfig.landingPageBonuses || ''}
                onChange={(e) => onTaskConfigChange('landingPageBonuses', e.target.value)}
                rows={3}
                data-testid="textarea-lp-bonuses"
              />
              <p className="text-xs text-muted-foreground">Satu bonus per baris. Bonus yang relevan meningkatkan konversi secara signifikan.</p>
            </div>

            <div className="space-y-2">
              <Label>Format Output</Label>
              <Select
                value={taskConfig.landingPageOutputFormat || 'copy'}
                onValueChange={(v) => onTaskConfigChange('landingPageOutputFormat', v)}
              >
                <SelectTrigger data-testid="select-lp-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copy">Copy Only — Teks siap paste ke builder mana saja</SelectItem>
                  <SelectItem value="html">HTML + Inline CSS — Siap upload langsung</SelectItem>
                  <SelectItem value="sections">Per Seksi — Dipisah: Hero, Problem, Solution, dll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                🚀 <strong>Hasilnya mencakup:</strong> Headline + Subheadline · Problem Agitation · Unique Value Proposition · Fitur & Manfaat · Testimoni template · FAQ · Harga & CTA · Garansi copy
              </p>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Mode ini menggunakan data proyek utama. Tidak ada konfigurasi tambahan yang diperlukan.
          </p>
        );
    }
  };

  const getModeDescription = () => {
    switch (activeMode) {
      case 'BRAINSTORM': return `Generate ${taskConfig.jumlahIde} ide ebook dengan pendekatan ${taskConfig.brainstormAngle}`;
      case 'BIG_IDEA': return `Pertajam positioning dengan angle "${taskConfig.bigIdeaAngle}"`;
      case 'OUTLINE': return `Susun daftar isi ${taskConfig.jumlahBab} bab dengan kedalaman ${taskConfig.outlineDepth}`;
      case 'DRAFT_BAB': return 'Tulis konten bab secara lengkap dan terstruktur';
      case 'VIDEO_SCRIPT': return 'Buat script video/podcast dari materi ebook';
      case 'ECOURSE_BUILDER': return 'Ubah ebook menjadi kurikulum kursus online';
      case 'DOC_GENERATOR': return 'Buat dokumen kerja profesional (SOP, Policy, dll)';
      case 'PROMPT_PACK': return 'Generate rangkaian prompt workflow untuk berbagai kebutuhan';
      case 'GPT_BUILDER': return 'Buat system prompt untuk chatbot berbasis ebook';
      case 'MARKETING_KIT': return 'Buat materi marketing untuk promosi ebook';
      case 'EXTEND_TEXT': return 'Kembangkan teks pendek menjadi konten yang lebih lengkap';
      case 'MINI_APP_BUILDER': return 'Rancang blueprint mini app interaktif dari konten ebook';
      case 'QUIZ_MAKER': return 'Buat soal kuis & asesmen lengkap dari materi ebook';
      case 'PODCAST_GENERATOR': {
        const interCount = (taskConfig.podcastInteractionStyle || '').split('|||').filter(Boolean).length;
        const specCount = (taskConfig.podcastSpecialSegments || '').split('|||').filter(Boolean).length;
        const extras = [interCount > 0 ? `${interCount} teknik interaksi` : '', specCount > 0 ? `${specCount} segmen khusus` : ''].filter(Boolean).join(', ');
        return `Script ${taskConfig.podcastStyle || 'interview'} | ${taskConfig.podcastHost || 'Andi'} & ${taskConfig.podcastGuest || 'Sari'} | ${taskConfig.podcastEpisodeLength || '15-20 menit'}${extras ? ` | ${extras}` : ''}`;
      }
      case 'AUDIOBOOK_SCRIPT': {
        const elCount = (taskConfig.audiobookSpecialElements || '').split('|||').filter(Boolean).length;
        const focusLabel: Record<string, string> = { full: 'Seluruh buku', intro: 'Intro+Bab1', per_bab: 'Per Bab', single_bab: 'Deep Dive', summary: 'Ringkasan', highlights: 'Highlight' };
        return `${taskConfig.audiobookTone || 'conversational'} | ${taskConfig.audiobookPace || 'medium'} pace | ${focusLabel[taskConfig.audiobookChapterFocus || 'full']}${elCount > 0 ? ` | ${elCount} elemen khusus` : ''}`;
      }
      case 'LANDING_PAGE': return `${taskConfig.landingPageStyle === 'long-form' ? 'Long-form' : taskConfig.landingPageStyle === 'short' ? 'Short copy' : 'VSL'} landing page${taskConfig.landingPagePrice ? ` · Harga: ${taskConfig.landingPagePrice}` : ''}`;
      default: return 'Konfigurasi mode';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" />
          Konfigurasi Mode
        </CardTitle>
        <CardDescription>{getModeDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
