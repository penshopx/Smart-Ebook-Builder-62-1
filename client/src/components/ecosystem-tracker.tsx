import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ECOSYSTEM_STEPS = [
  { id: 'ebook', emoji: '📖', label: 'Ebook Dibuat', desc: 'Kompetensi terdokumentasi dalam ebook', phase: 'Fondasi' },
  { id: 'publish', emoji: '🔒', label: 'Publish & Proteksi', desc: 'Export terproteksi atau Baca Online', phase: 'Publish' },
  { id: 'distribusi', emoji: '🌐', label: 'Distribusi', desc: 'Platform listing & reseller kit', phase: 'Distribusi' },
  { id: 'sosmed', emoji: '📸', label: 'Konten Sosmed', desc: 'IG Caption, Reels, LinkedIn Article', phase: 'Sosmed' },
  { id: 'landing', emoji: '🎯', label: 'Landing Page', desc: 'Copy konversi & headline pack', phase: 'Konversi' },
  { id: 'iklan', emoji: '📣', label: 'Iklan Aktif', desc: 'TikTok Ads, Google Ads, Meta Ads', phase: 'Iklan' },
  { id: 'chatbot', emoji: '🤖', label: 'Chatbot AI', desc: 'Kompetensi ebook diakses 24 jam', phase: 'Ekosistem' },
  { id: 'ecourse', emoji: '🎓', label: 'E-Course', desc: 'Silabus kursus dari ebook', phase: 'Ekosistem' },
  { id: 'miniapp', emoji: '📱', label: 'Mini App', desc: 'Blueprint tools dari kompetensi', phase: 'Ekosistem' },
  { id: 'sop', emoji: '📋', label: 'SOP / Dokumen', desc: 'Prosedur & template profesional', phase: 'Ekosistem' },
  { id: 'membership', emoji: '🏆', label: 'Membership Site', desc: 'Komunitas & konten berlangganan', phase: 'Funnel' },
];

const STORAGE_KEY = 'chaesa_ecosystem_progress';

function loadProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function EcosystemTracker() {
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggle = (id: string) => {
    setProgress(p => ({ ...p, [id]: !p[id] }));
  };

  const completed = ECOSYSTEM_STEPS.filter(s => progress[s.id]).length;
  const percent = Math.round((completed / ECOSYSTEM_STEPS.length) * 100);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden" data-testid="ecosystem-tracker">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        data-testid="button-tracker-toggle"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Rocket className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight">Ekosistem Kompetensi</div>
            <div className="text-[10px] text-muted-foreground">{completed}/{ECOSYSTEM_STEPS.length} produk digital selesai</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={percent === 100 ? 'default' : 'secondary'} className="text-[10px]">
            {percent}%
          </Badge>
          {collapsed ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2.5 border-t bg-muted/20">
          <div className="pt-3">
            <Progress value={percent} className="h-1.5" />
          </div>
          <div className="space-y-1">
            {ECOSYSTEM_STEPS.map(step => (
              <button
                key={step.id}
                onClick={() => toggle(step.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  progress[step.id]
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/60'
                }`}
                data-testid={`button-tracker-step-${step.id}`}
              >
                <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  progress[step.id]
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40'
                }`}
                  style={{ minWidth: '18px', minHeight: '18px' }}
                >
                  {progress[step.id] && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm">{step.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium truncate ${progress[step.id] ? 'line-through opacity-60' : ''}`}>
                    {step.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">{step.desc}</div>
                </div>
                <Badge variant="outline" className="text-[8px] py-0 shrink-0 opacity-60">{step.phase}</Badge>
              </button>
            ))}
          </div>
          {percent === 100 && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-lg">🎉</span>
              <p className="text-xs font-medium text-primary">Ekosistem kompetensi digital Anda LENGKAP!</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground"
            onClick={() => setProgress({})}
            data-testid="button-tracker-reset"
          >
            Reset Progress
          </Button>
        </div>
      )}
    </div>
  );
}
