import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  EBOOK_SERIES_DATA, CHAPTER_TEMPLATES, DOCUMENT_TYPES, PACK_TYPES, MARKETING_ASSETS 
} from '@shared/schema';
import type { ProjectData, TaskConfig, ExtendConfig } from '@shared/schema';
import { Settings2 } from 'lucide-react';

interface TaskConfigPanelProps {
  activeMode: string;
  projectData: ProjectData;
  taskConfig: TaskConfig;
  extendConfig: ExtendConfig;
  onTaskConfigChange: (name: string, value: string | number) => void;
  onExtendConfigChange: (name: string, value: string) => void;
}

export function TaskConfigPanel({
  activeMode,
  projectData,
  taskConfig,
  extendConfig,
  onTaskConfigChange,
  onExtendConfigChange,
}: TaskConfigPanelProps) {
  const currentSeriesList = EBOOK_SERIES_DATA[projectData.level] || [];

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

      case 'DOC_GENERATOR':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Dokumen</Label>
              <Select
                value={taskConfig.docType}
                onValueChange={(value) => onTaskConfigChange('docType', value)}
              >
                <SelectTrigger data-testid="select-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((doc) => (
                    <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="space-y-4">
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kepribadian Bot</Label>
              <Input
                placeholder="Contoh: Ramah, Suportif, dan Berbasis Data"
                value={taskConfig.botPersonality}
                onChange={(e) => onTaskConfigChange('botPersonality', e.target.value)}
                data-testid="input-bot-personality"
              />
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

      case 'MINI_APP_BUILDER':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Mini App</Label>
              <Select
                value={taskConfig.appType || 'web'}
                onValueChange={(value) => onTaskConfigChange('appType', value)}
              >
                <SelectTrigger data-testid="select-app-type">
                  <SelectValue placeholder="Pilih jenis app" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web App (React/Next.js)</SelectItem>
                  <SelectItem value="mobile">Mobile App (React Native)</SelectItem>
                  <SelectItem value="chrome">Chrome Extension</SelectItem>
                  <SelectItem value="telegram">Telegram Bot</SelectItem>
                  <SelectItem value="notion">Notion Template + API</SelectItem>
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
                  <SelectItem value="simple">Simple (1-2 fitur utama)</SelectItem>
                  <SelectItem value="medium">Medium (3-5 fitur)</SelectItem>
                  <SelectItem value="complex">Complex (6+ fitur + dashboard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'QUIZ_MAKER':
        return (
          <div className="space-y-4">
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
                  <SelectItem value="Beginner">Beginner (dasar)</SelectItem>
                  <SelectItem value="Intermediate">Intermediate (menengah)</SelectItem>
                  <SelectItem value="Advanced">Advanced (lanjut)</SelectItem>
                  <SelectItem value="Expert">Expert (profesional)</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'PODCAST_GENERATOR':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Host (Pembawa Acara)</Label>
                <Input
                  placeholder="Contoh: Andi, Sarah, Budi..."
                  value={taskConfig.podcastHost || 'Andi'}
                  onChange={(e) => onTaskConfigChange('podcastHost', e.target.value)}
                  data-testid="input-podcast-host"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Guest (Narasumber)</Label>
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
                <Label>Gaya Podcast</Label>
                <Select
                  value={taskConfig.podcastStyle || 'interview'}
                  onValueChange={(value) => onTaskConfigChange('podcastStyle', value)}
                >
                  <SelectTrigger data-testid="select-podcast-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview (Host tanya, Guest jawab)</SelectItem>
                    <SelectItem value="debate">Debate (Dua sudut pandang berbeda)</SelectItem>
                    <SelectItem value="storytelling">Storytelling (Narasi pengalaman nyata)</SelectItem>
                    <SelectItem value="educational">Educational (Ajarin step-by-step)</SelectItem>
                    <SelectItem value="casual">Casual Talk (Obrolan santai tapi informatif)</SelectItem>
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
              <Label>Jumlah Segmen/Babak</Label>
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
        );

      case 'AUDIOBOOK_SCRIPT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Narator (opsional)</Label>
              <Input
                placeholder="Contoh: Budi Santoso, Sarah Wijaya... (kosongkan jika tidak perlu)"
                value={taskConfig.audiobookNarrator || ''}
                onChange={(e) => onTaskConfigChange('audiobookNarrator', e.target.value)}
                data-testid="input-audiobook-narrator"
              />
              <p className="text-xs text-muted-foreground">Nama narator digunakan dalam pembukaan/penutup setiap bab</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gaya Narasi</Label>
                <Select
                  value={taskConfig.audiobookTone || 'conversational'}
                  onValueChange={(value) => onTaskConfigChange('audiobookTone', value)}
                >
                  <SelectTrigger data-testid="select-audiobook-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversational">Conversational — Santai, seperti ngobrol</SelectItem>
                    <SelectItem value="authoritative">Authoritative — Tegas, seperti ahli</SelectItem>
                    <SelectItem value="warm">Warm & Friendly — Hangat, suportif</SelectItem>
                    <SelectItem value="dramatic">Dramatic — Dramatis, penuh penghayatan</SelectItem>
                    <SelectItem value="academic">Academic — Formal, ilmiah</SelectItem>
                    <SelectItem value="motivational">Motivational — Semangat, inspiratif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="slow">Lambat — Pendengar santai, banyak jeda</SelectItem>
                    <SelectItem value="medium">Sedang — Standar audiobook profesional</SelectItem>
                    <SelectItem value="fast">Cepat — Ringkas, langsung ke inti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="full">Seluruh Buku — Narasi lengkap semua bab</SelectItem>
                    <SelectItem value="intro">Intro + Bab 1 — Preview menarik untuk promosi</SelectItem>
                    <SelectItem value="summary">Ringkasan Per Bab — Poin utama saja</SelectItem>
                    <SelectItem value="highlights">Highlight — Kutipan & insight terbaik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="minimal">Minimal — Netral, informatif</SelectItem>
                    <SelectItem value="moderate">Moderate — Seimbang antara fakta & emosi</SelectItem>
                    <SelectItem value="strong">Kuat — Penuh penghayatan & ekspresi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Script yang dihasilkan menyertakan cue narasi seperti{' '}
                <code className="bg-muted px-1 rounded text-xs">[JEDA PANJANG]</code>,{' '}
                <code className="bg-muted px-1 rounded text-xs">[PENEKANAN]</code>, dan{' '}
                <code className="bg-muted px-1 rounded text-xs">[MUSIK LATAR]</code> untuk membantu narasi.
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
      case 'PODCAST_GENERATOR': return `Script podcast ${taskConfig.podcastStyle || 'interview'} antara ${taskConfig.podcastHost || 'Andi'} & ${taskConfig.podcastGuest || 'Sari'} — ${taskConfig.podcastEpisodeLength || '15-20 menit'}`;
      case 'AUDIOBOOK_SCRIPT': return `Narasi ${taskConfig.audiobookTone || 'conversational'}, pace ${taskConfig.audiobookPace || 'medium'} — ${taskConfig.audiobookChapterFocus === 'full' ? 'seluruh bab' : 'per bab'}`;
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
