import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Rocket, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const ECO_KEYS: Record<string, string> = {
  ebook:      'chaesa_eco_ebook',
  publish:    'chaesa_eco_publish',
  distribusi: 'chaesa_eco_distribusi',
  sosmed:     'chaesa_eco_sosmed',
  landing:    'chaesa_eco_landing',
  iklan:      'chaesa_eco_iklan',
  chatbot:    'chaesa_eco_chatbot',
  ecourse:    'chaesa_eco_ecourse',
  miniapp:    'chaesa_eco_miniapp',
  sop:        'chaesa_eco_sop',
  membership: 'chaesa_eco_membership',
};

export function markEcoUsed(stepId: keyof typeof ECO_KEYS) {
  try { localStorage.setItem(ECO_KEYS[stepId], '1'); } catch {}
  window.dispatchEvent(new Event('chaesa_eco_update'));
}

const ECOSYSTEM_STEPS = [
  { id: 'ebook',      emoji: '📖', label: 'Ebook Dibuat',       desc: 'Kompetensi terdokumentasi dalam ebook', phase: 'Fondasi',   autoKey: ECO_KEYS.ebook },
  { id: 'publish',    emoji: '🔒', label: 'Publish & Proteksi', desc: 'Export terproteksi atau Baca Online',   phase: 'Publish',   autoKey: ECO_KEYS.publish },
  { id: 'distribusi', emoji: '🌐', label: 'Distribusi',          desc: 'Platform listing & reseller kit',       phase: 'Distribusi',autoKey: ECO_KEYS.distribusi },
  { id: 'sosmed',     emoji: '📸', label: 'Konten Sosmed',       desc: 'IG, Reels, LinkedIn Article',           phase: 'Sosmed',    autoKey: ECO_KEYS.sosmed },
  { id: 'landing',    emoji: '🎯', label: 'Landing Page',        desc: 'Copy konversi & headline pack',         phase: 'Konversi',  autoKey: ECO_KEYS.landing },
  { id: 'iklan',      emoji: '📣', label: 'Iklan Aktif',         desc: 'TikTok Ads, Google Ads, Meta Ads',      phase: 'Iklan',     autoKey: ECO_KEYS.iklan },
  { id: 'chatbot',    emoji: '🤖', label: 'Chatbot AI',          desc: 'Kompetensi ebook diakses 24 jam',       phase: 'Ekosistem', autoKey: ECO_KEYS.chatbot },
  { id: 'ecourse',    emoji: '🎓', label: 'E-Course',            desc: 'Silabus kursus dari ebook',             phase: 'Ekosistem', autoKey: ECO_KEYS.ecourse },
  { id: 'miniapp',    emoji: '📱', label: 'Mini App',            desc: 'Blueprint tools dari kompetensi',       phase: 'Ekosistem', autoKey: ECO_KEYS.miniapp },
  { id: 'sop',        emoji: '📋', label: 'SOP / Dokumen',       desc: 'Prosedur & template profesional',       phase: 'Ekosistem', autoKey: ECO_KEYS.sop },
  { id: 'membership', emoji: '🏆', label: 'Membership Site',     desc: 'Komunitas & konten berlangganan',       phase: 'Funnel',    autoKey: ECO_KEYS.membership },
];

const MANUAL_KEY = 'chaesa_ecosystem_manual';

function readManual(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}'); } catch { return {}; }
}

function readAuto(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  try {
    ECOSYSTEM_STEPS.forEach(s => {
      result[s.id] = localStorage.getItem(s.autoKey) === '1';
    });
  } catch {}
  return result;
}

export function EcosystemTracker() {
  const [manual, setManual] = useState<Record<string, boolean>>(readManual);
  const [auto, setAuto] = useState<Record<string, boolean>>(readAuto);
  const [collapsed, setCollapsed] = useState(false);

  const refresh = useCallback(() => {
    setAuto(readAuto());
  }, []);

  useEffect(() => {
    window.addEventListener('chaesa_eco_update', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('chaesa_eco_update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
  }, [manual]);

  const toggleManual = (id: string) => {
    setManual(p => ({ ...p, [id]: !p[id] }));
  };

  const isDone = (step: typeof ECOSYSTEM_STEPS[0]) => manual[step.id] || auto[step.id];
  const isAuto = (step: typeof ECOSYSTEM_STEPS[0]) => auto[step.id] && !manual[step.id];

  const completed = ECOSYSTEM_STEPS.filter(isDone).length;
  const percent = Math.round((completed / ECOSYSTEM_STEPS.length) * 100);

  const resetAll = () => {
    setManual({});
    try {
      ECOSYSTEM_STEPS.forEach(s => localStorage.removeItem(s.autoKey));
    } catch {}
    setAuto(readAuto());
  };

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
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Manual</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Zap className="h-2.5 w-2.5 text-amber-500" />
              <span>Terdeteksi otomatis</span>
            </div>
          </div>
          <div className="space-y-1">
            {ECOSYSTEM_STEPS.map(step => {
              const done = isDone(step);
              const auto_ = isAuto(step);
              return (
                <button
                  key={step.id}
                  onClick={() => toggleManual(step.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    done
                      ? auto_
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        : 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/60'
                  }`}
                  data-testid={`button-tracker-step-${step.id}`}
                >
                  <div
                    className={`rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? auto_
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-primary border-primary'
                        : 'border-muted-foreground/40'
                    }`}
                    style={{ minWidth: '18px', minHeight: '18px', width: '18px', height: '18px' }}
                  >
                    {done && !auto_ && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    {done && auto_ && <Zap className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />}
                  </div>
                  <span className="text-sm">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-medium truncate ${done ? 'line-through opacity-60' : ''}`}>
                      {step.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate">{step.desc}</div>
                  </div>
                  {auto_ && (
                    <Zap className="h-3 w-3 text-amber-500 shrink-0" title="Terdeteksi otomatis dari aktivitas Anda" />
                  )}
                  <Badge variant="outline" className="text-[8px] py-0 shrink-0 opacity-50">{step.phase}</Badge>
                </button>
              );
            })}
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
            onClick={resetAll}
            data-testid="button-tracker-reset"
          >
            Reset Progress
          </Button>
        </div>
      )}
    </div>
  );
}
