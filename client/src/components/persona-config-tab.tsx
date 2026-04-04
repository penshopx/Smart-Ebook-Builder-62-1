import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BrainCircuit, User, BookOpen, MessageSquare, Target,
  Lightbulb, Plus, X, RotateCcw, Sparkles,
} from 'lucide-react';

export interface AssistantPersona {
  namaAsisten: string;
  jabatan: string;
  tagline: string;
  kepribadian: string[];
  sapaanKhas: string;
  knowledgeBase: string;
  metodeFavorit: string;
  caseStudy: string;
  topikFokus: string;
  topikHindari: string;
  instruksiKhusus: string;
}

export const defaultAssistantPersona: AssistantPersona = {
  namaAsisten: '',
  jabatan: '',
  tagline: '',
  kepribadian: [],
  sapaanKhas: '',
  knowledgeBase: '',
  metodeFavorit: '',
  caseStudy: '',
  topikFokus: '',
  topikHindari: '',
  instruksiKhusus: '',
};

const KEPRIBADIAN_OPTIONS = [
  'Profesional', 'Tegas', 'Empati', 'Akademis', 'Praktikal',
  'Inspiratif', 'Sabar', 'Analitis', 'Kreatif', 'Humoris',
  'Mentor', 'Strategis', 'Detail', 'Visioner', 'Kolaboratif',
];

interface PersonaConfigTabProps {
  persona: AssistantPersona;
  onChange: (field: keyof AssistantPersona, value: string | string[]) => void;
  projectTopik?: string;
  industry?: string;
}

const INDUSTRY_LABELS: Record<string, string> = {
  engineering: 'Keteknikan', construction: 'Konstruksi', mining: 'Pertambangan',
  oil_gas: 'Migas', electricity: 'Kelistrikan', manufacturing: 'Manufaktur',
  umkm: 'UMKM', wealth: 'Keuangan', family: 'Keluarga', spirituality: 'Spiritualitas',
  health: 'Kesehatan', hobby: 'Hobi', perijinan_usaha: 'Perijinan',
  tender: 'Tender', sbu: 'SBU', skk: 'SKK', manajemen_proyek: 'Manajemen Proyek',
  erp: 'ERP', bim: 'BIM', pub: 'ESG/CSR', pkb: 'CPD', iso: 'ISO', kpk: 'Integritas', general: 'Umum',
};

export function PersonaConfigTab({ persona, onChange, projectTopik, industry }: PersonaConfigTabProps) {
  const industryLabel = INDUSTRY_LABELS[industry || ''] || industry || 'Umum';

  const toggleKepribadian = (trait: string) => {
    const current = persona.kepribadian;
    if (current.includes(trait)) {
      onChange('kepribadian', current.filter(t => t !== trait));
    } else {
      onChange('kepribadian', [...current, trait]);
    }
  };

  const autoFill = () => {
    if (!projectTopik) return;
    onChange('namaAsisten', `Asisten ${industryLabel}`);
    onChange('jabatan', `Pakar ${industryLabel}`);
    onChange('tagline', `Membantu Anda memahami ${projectTopik} lebih dalam`);
    onChange('kepribadian', ['Profesional', 'Praktikal', 'Empati']);
    onChange('sapaanKhas', `Halo! Saya siap membantu Anda memahami topik "${projectTopik}". Apa yang ingin Anda ketahui?`);
    onChange('topikFokus', `Semua hal yang berkaitan dengan ${projectTopik} dalam konteks ${industryLabel}`);
    onChange('topikHindari', 'Topik di luar bidang keahlian dan konteks ebook');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <BrainCircuit className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Konfigurasi Asisten Topik</p>
            <p className="text-[10px] text-muted-foreground">Persona & knowledge base untuk Chaesa Prime</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] gap-1 border-violet-300/60 dark:border-violet-700/60 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          onClick={autoFill}
          disabled={!projectTopik}
          title={!projectTopik ? 'Isi topik dulu di Data Proyek' : 'Auto-isi dari topik & industri proyek'}
          data-testid="button-autofill-persona"
        >
          <Sparkles className="h-3 w-3" /> Auto-isi
        </Button>
      </div>

      {!projectTopik && (
        <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <Lightbulb className="h-3 w-3 shrink-0" />
          Isi topik di tab Data Proyek terlebih dahulu untuk mengaktifkan konfigurasi asisten ini.
        </div>
      )}

      {/* Identitas Asisten */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-xs font-semibold text-foreground">Identitas Asisten</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Nama Asisten</Label>
            <Input
              value={persona.namaAsisten}
              onChange={e => onChange('namaAsisten', e.target.value)}
              placeholder="cth: Pak Budi, Dr. Sarah..."
              className="h-8 text-xs"
              data-testid="input-persona-nama"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Jabatan / Keahlian</Label>
            <Input
              value={persona.jabatan}
              onChange={e => onChange('jabatan', e.target.value)}
              placeholder="cth: Konsultan Senior..."
              className="h-8 text-xs"
              data-testid="input-persona-jabatan"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Tagline / Kalimat Pembeda</Label>
          <Input
            value={persona.tagline}
            onChange={e => onChange('tagline', e.target.value)}
            placeholder="cth: 20 tahun pengalaman di bidang konstruksi Indonesia"
            className="h-8 text-xs"
            data-testid="input-persona-tagline"
          />
        </div>
      </div>

      <Separator />

      {/* Kepribadian */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-xs font-semibold text-foreground">Karakter & Kepribadian</p>
          <span className="text-[9px] text-muted-foreground ml-auto">Pilih beberapa</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KEPRIBADIAN_OPTIONS.map(trait => (
            <button
              key={trait}
              onClick={() => toggleKepribadian(trait)}
              data-testid={`chip-kepribadian-${trait}`}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                persona.kepribadian.includes(trait)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-background text-muted-foreground border-border hover:border-violet-400/60 hover:text-violet-600'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
        <div className="space-y-1 mt-2">
          <Label className="text-[10px] text-muted-foreground">Sapaan Khas / Opening Statement</Label>
          <Textarea
            value={persona.sapaanKhas}
            onChange={e => onChange('sapaanKhas', e.target.value)}
            placeholder="Kalimat pembuka khas asisten ini ketika memulai percakapan..."
            rows={2}
            className="text-xs resize-none"
            data-testid="textarea-sapaan-khas"
          />
        </div>
      </div>

      <Separator />

      {/* Knowledge Base */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-xs font-semibold text-foreground">Knowledge Base</p>
          <Badge variant="secondary" className="text-[9px] h-4">Kunci</Badge>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">
            Konten & Pengetahuan Utama
            <span className="ml-1 text-muted-foreground/60">(paste dari ebook, atau tulis poin-poin penting)</span>
          </Label>
          <Textarea
            value={persona.knowledgeBase}
            onChange={e => onChange('knowledgeBase', e.target.value)}
            placeholder={`Masukkan konten pengetahuan utama yang harus dikuasai asisten ini:\n\n• Konsep dan teori kunci\n• Terminologi penting\n• Prinsip-prinsip dasar\n• Data dan statistik relevan\n• Definisi istilah teknis\n\nBisa paste langsung dari outline atau draft ebook...`}
            rows={6}
            className="text-xs resize-y min-h-[120px]"
            data-testid="textarea-knowledge-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Metode / Framework Favorit</Label>
            <Textarea
              value={persona.metodeFavorit}
              onChange={e => onChange('metodeFavorit', e.target.value)}
              placeholder="cth: Metode ABC, Framework XYZ, Pendekatan 3-langkah..."
              rows={3}
              className="text-xs resize-none"
              data-testid="textarea-metode"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Contoh Kasus / Case Study</Label>
            <Textarea
              value={persona.caseStudy}
              onChange={e => onChange('caseStudy', e.target.value)}
              placeholder="Ringkasan kasus nyata atau contoh praktis yang bisa dirujuk..."
              rows={3}
              className="text-xs resize-none"
              data-testid="textarea-case-study"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Aturan Percakapan */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-green-500" />
          <p className="text-xs font-semibold text-foreground">Aturan & Fokus Percakapan</p>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Topik yang Difokuskan</Label>
          <Textarea
            value={persona.topikFokus}
            onChange={e => onChange('topikFokus', e.target.value)}
            placeholder="Topik-topik spesifik yang harus selalu diarahkan dalam percakapan..."
            rows={2}
            className="text-xs resize-none"
            data-testid="textarea-topik-fokus"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Topik yang Dihindari</Label>
          <Textarea
            value={persona.topikHindari}
            onChange={e => onChange('topikHindari', e.target.value)}
            placeholder="Topik-topik yang tidak perlu dibahas atau di luar konteks..."
            rows={2}
            className="text-xs resize-none"
            data-testid="textarea-topik-hindari"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Instruksi Khusus (Opsional)</Label>
          <Textarea
            value={persona.instruksiKhusus}
            onChange={e => onChange('instruksiKhusus', e.target.value)}
            placeholder="Instruksi tambahan untuk mengatur perilaku asisten: format jawaban, panjang respons, dll..."
            rows={2}
            className="text-xs resize-none"
            data-testid="textarea-instruksi-khusus"
          />
        </div>
      </div>

      {/* Status */}
      {(persona.namaAsisten || persona.knowledgeBase) && (
        <div className="flex items-center gap-2 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
          <BrainCircuit className="h-3 w-3 shrink-0" />
          Persona aktif: <strong>{persona.namaAsisten || 'Asisten'}</strong>
          {persona.knowledgeBase && <> · Knowledge base: {Math.round(persona.knowledgeBase.length / 5)} kata</>}
          {persona.kepribadian.length > 0 && <> · {persona.kepribadian.slice(0, 3).join(', ')}</>}
        </div>
      )}
    </div>
  );
}
