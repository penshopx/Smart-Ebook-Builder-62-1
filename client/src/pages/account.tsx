import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Book,
  ArrowLeft,
  Crown,
  Zap,
  Check,
  CheckCircle2,
  MessageSquare,
  Mail,
  ExternalLink,
  Sparkles,
  Users,
  Shield,
  Star,
  LogOut,
  ChevronRight,
  Activity,
  Layers,
  Download,
} from 'lucide-react';
import { Link } from 'wouter';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  premium: 'bg-primary/10 text-primary',
  advance: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Sparkles,
  pro: Zap,
  premium: Star,
  advance: Shield,
  enterprise: Crown,
};

interface PlanData {
  plan: string;
  promptsUsedToday: number;
  dailyLimit: number | null;
  allowedModes: string | string[];
  exports: string[];
  label: string;
}

interface UpgradeResult {
  success: boolean;
  contactInfo: { whatsapp: string; email: string; subject: string };
  requestedPlan: string;
}

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp 0',
    period: '/bulan',
    desc: 'Untuk mencoba fitur dasar',
    features: [
      '5 prompt per hari',
      '3 mode generasi (Brainstorm, Big Idea, Outline)',
      '1 proyek tersimpan',
      'Export TXT',
      '3 industri themes',
    ],
    cta: 'Paket Aktif',
    highlight: false,
    color: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp 99K',
    period: '/bulan',
    desc: 'Mulai berkarya lebih produktif',
    features: [
      '25 prompt per hari',
      '8 mode generasi',
      '5 proyek tersimpan',
      'Export TXT/PDF',
      '8 industri themes',
      'Draft Bab, Video Script, Quiz Maker',
      'Extend Text, Marketing Kit',
    ],
    cta: 'Upgrade ke Pro',
    highlight: false,
    color: 'border-blue-300 dark:border-blue-700',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Rp 199K',
    period: '/bulan',
    desc: 'Untuk content creator serius',
    features: [
      '75 prompt per hari',
      '12 mode generasi',
      '20 proyek tersimpan',
      'Export TXT/PDF/DOCX/MD',
      '16 industri themes',
      'E-Course Builder + GPT Builder',
      'Document Generator + Mini App Blueprint',
      'AI Image Mockup via DALL-E 3',
    ],
    cta: 'Upgrade ke Premium',
    highlight: true,
    color: '',
  },
  {
    id: 'advance',
    name: 'Advance',
    price: 'Rp 299K',
    period: '/bulan',
    desc: 'Ekosistem penuh tanpa batas',
    features: [
      'Unlimited prompt',
      'Semua 16 mode generasi',
      'Unlimited proyek',
      'Export TXT/PDF/DOCX/MD/HTML',
      '24 industri themes',
      'Podcast Script + Audiobook Script',
      'Landing Page Copy + Cover HTML',
      'TTS narasi + Ekosistem 9-Langkah penuh',
      'Priority support',
    ],
    cta: 'Upgrade ke Advance',
    highlight: false,
    color: 'border-purple-300 dark:border-purple-700',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Rp 499K',
    period: '/bulan',
    desc: 'Untuk tim dan bisnis skala besar',
    features: [
      'Semua fitur Advance',
      'Hingga 10 anggota tim',
      'White-label export',
      'API access',
      'Custom AI training',
      'Dedicated support',
      'SLA & onboarding',
    ],
    cta: 'Hubungi Sales',
    highlight: false,
    color: 'border-amber-300 dark:border-amber-700',
  },
];

export default function Account() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<UpgradeResult | null>(null);
  const [targetPlan, setTargetPlan] = useState('pro');

  const { data: planData, isLoading: planLoading } = useQuery<PlanData>({
    queryKey: ['/api/user/plan'],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest('POST', '/api/user/upgrade-request', { targetPlan: plan });
      return res.json() as Promise<UpgradeResult>;
    },
    onSuccess: (data) => {
      setUpgradeResult(data);
    },
    onError: () => {
      toast({ title: "Terjadi kesalahan", description: "Coba lagi beberapa saat", variant: "destructive" });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const validPlans = ['pro', 'premium', 'advance', 'enterprise'];
    if (upgrade && validPlans.includes(upgrade)) {
      setTargetPlan(upgrade);
      setUpgradeResult(null);
      setUpgradeDialogOpen(true);
      window.history.replaceState({}, '', '/account');
      upgradeMutation.mutate(upgrade);
    }
  }, []);

  const handleUpgradeClick = (planId: string) => {
    if (planId === 'free') return;
    setTargetPlan(planId);
    setUpgradeResult(null);
    setUpgradeDialogOpen(true);
    upgradeMutation.mutate(planId);
  };

  const currentPlan = planData?.plan ?? user?.plan ?? 'free';
  const PlanIcon = PLAN_ICONS[currentPlan] ?? Sparkles;

  const promptsUsed = planData?.promptsUsedToday ?? 0;
  const dailyLimit = planData?.dailyLimit;
  const usagePercent = dailyLimit ? Math.min((promptsUsed / dailyLimit) * 100, 100) : 0;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] ?? 'Pengguna';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-14 px-4 mx-auto max-w-screen-xl">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke App
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2" data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Profile + Plan Status */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <Card data-testid="card-profile">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-lg">{displayName}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email || '—'}</p>
                  </div>
                  <Badge className={`${PLAN_COLORS[currentPlan]} border-0 gap-1`} data-testid="badge-current-plan">
                    <PlanIcon className="h-3 w-3" />
                    Paket {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Usage Card */}
            <Card data-testid="card-usage">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Penggunaan Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {planLoading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Prompt digunakan</span>
                        <span className="font-semibold" data-testid="text-prompts-used">
                          {promptsUsed}
                          {dailyLimit ? ` / ${dailyLimit}` : ' (unlimited)'}
                        </span>
                      </div>
                      {dailyLimit && (
                        <>
                          <Progress value={usagePercent} className="h-2" data-testid="progress-usage" />
                          {usagePercent >= 80 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {usagePercent >= 100
                                ? 'Batas harian tercapai. Upgrade untuk unlimited!'
                                : `Hampir mencapai batas (${promptsUsed}/${dailyLimit})`}
                            </p>
                          )}
                        </>
                      )}
                      {!dailyLimit && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Unlimited prompt tersedia
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          Mode generasi
                        </span>
                        <span className="font-medium">
                          {planData?.allowedModes === 'all' ? '16 mode' : `${(planData?.allowedModes as string[])?.length ?? 3} mode`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          Format export
                        </span>
                        <span className="font-medium uppercase">
                          {(planData?.exports ?? ['txt']).join(', ')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              {currentPlan === 'free' && (
                <CardFooter className="pt-0">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-purple-600"
                    size="sm"
                    onClick={() => handleUpgradeClick('premium')}
                    data-testid="button-upgrade-from-usage"
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade ke Premium
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Keamanan Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Login via Replit Auth (aman)</span>
                </div>
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sesi terenkripsi</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">
                    Bergabung sejak {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Pricing & Features */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Akun & Langganan</h1>
              <p className="text-muted-foreground text-sm">
                Kelola paket berlangganan dan lihat penggunaan Anda
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {PRICING_PLANS.map((plan) => {
                const isActive = currentPlan === plan.id;
                const PIcon = PLAN_ICONS[plan.id] ?? Sparkles;
                const iconColor: Record<string, string> = {
                  free: 'text-gray-500',
                  pro: 'text-blue-500',
                  premium: 'text-primary',
                  advance: 'text-purple-500',
                  enterprise: 'text-amber-500',
                };
                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col ${plan.highlight ? 'border-2 border-primary shadow-lg' : plan.color ? `border-2 ${plan.color}` : ''} ${isActive ? 'ring-2 ring-green-500' : ''}`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-xs px-3">
                          <Star className="h-2.5 w-2.5 mr-1" />
                          Populer
                        </Badge>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute -top-3 right-3">
                        <Badge className="bg-green-500 text-xs">Aktif</Badge>
                      </div>
                    )}
                    <CardHeader className={`pb-2 ${plan.highlight ? 'pt-6' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <PIcon className={`h-4 w-4 ${iconColor[plan.id] ?? 'text-gray-500'}`} />
                        <CardTitle className="text-sm">{plan.name}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{plan.desc}</CardDescription>
                      <div className="mt-2">
                        <span className="text-xl font-bold">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-1.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-xs">
                            <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isActive ? (
                        <Button variant="outline" className="w-full text-xs" disabled>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                          Paket Aktif
                        </Button>
                      ) : plan.id === 'free' ? (
                        <Button variant="outline" className="w-full text-xs" disabled>
                          Paket Dasar
                        </Button>
                      ) : (
                        <Button
                          className={`w-full text-xs ${plan.highlight ? 'bg-gradient-to-r from-primary to-purple-600' : ''}`}
                          variant={plan.highlight ? 'default' : 'outline'}
                          onClick={() => handleUpgradeClick(plan.id)}
                          disabled={upgradeMutation.isPending}
                          data-testid={`button-upgrade-${plan.id}`}
                        >
                          {plan.id === 'enterprise' ? (
                            <>
                              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              {plan.cta}
                            </>
                          ) : (
                            <>
                              <Zap className="h-3.5 w-3.5 mr-1.5" />
                              {plan.cta}
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Feature Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kenapa Upgrade ke Premium atau Lebih Tinggi?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Layers, title: "16 Mode Generasi", desc: "Semua mode: Chatbot, E-Course, Mini App, Podcast, Audiobook, Landing Page, Cover HTML, dan lainnya" },
                    { icon: Zap, title: "Unlimited Prompt", desc: "Generate prompt sebanyak yang Anda mau, tanpa batas harian" },
                    { icon: Star, title: "Ekosistem 10-Langkah", desc: "Pipeline lengkap: 1 ebook → chatbot AI, kursus, mini app, SOP, membership, dan 5 output lainnya" },
                    { icon: Download, title: "5 Format Export", desc: "TXT, PDF, DOCX, Markdown, dan HTML siap pakai + proteksi watermark" },
                    { icon: Shield, title: "24 Industry Themes", desc: "Template prompt untuk semua 24 industri Indonesia — engineering, kesehatan, UMKM, fintech, dan lainnya" },
                    { icon: Users, title: "Priority Support", desc: "Bantuan prioritas via WhatsApp & email, respon cepat" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Competitor Comparison */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  Mengapa Chaesa AI Studio vs Kompetitor?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-48">Fitur</th>
                        {[
                          { name: 'FlipHTML5', price: '$14/bln', color: 'text-blue-500' },
                          { name: 'Canva', price: '$17/bln', color: 'text-purple-500' },
                          { name: 'Visme', price: '$12/bln', color: 'text-green-600' },
                          { name: '⭐ Pro (Kita)', price: 'Rp99K/bln', color: 'text-primary font-bold' },
                        ].map(c => (
                          <th key={c.name} className={`text-center py-2 px-2 ${c.color}`}>
                            <div>{c.name}</div>
                            <div className="font-normal text-muted-foreground">{c.price}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Pipeline Ekosistem (10 output)', '❌', '❌', '❌', '✅'],
                        ['Podcast & Audiobook Script', '❌', '❌', '❌', '✅'],
                        ['Landing Page Copy (4 style)', '❌', '❌', '❌', '✅'],
                        ['Cover HTML Generator', '⚠️', '✅', '✅', '✅'],
                        ['Quiz & Silabus Kursus', '❌', '❌', '❌', '✅'],
                        ['Konteks Industri Indonesia', '❌', '❌', '❌', '✅'],
                        ['Agentic AI Prompting', '❌', '❌', '❌', '✅'],
                        ['Export HTML + DOCX + MD', '⚠️', '❌', '⚠️', '✅'],
                      ].map(([feature, ...vals]) => (
                        <tr key={feature as string} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-3 text-muted-foreground">{feature}</td>
                          {vals.map((v, i) => (
                            <td key={i} className={`text-center py-2 px-2 ${i === 3 ? 'bg-primary/5 font-medium' : ''}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Satu-satunya di Indonesia</strong> yang punya pipeline lengkap dari 1 ebook → 10 output aset digital, dengan konteks 24 industri lokal. Canva & Visme fokus desain, bukan pipeline konten.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Butuh Bantuan?
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Chaesa%2C%20saya%20butuh%20bantuan%20dengan%20Chaesa%20AI%20Studio', '_blank')}
                  data-testid="button-contact-wa"
                >
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  WhatsApp Support
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => window.open('mailto:support@chaesaai.com', '_blank')}
                  data-testid="button-contact-email"
                >
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Support
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade ke {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Hubungi kami untuk proses upgrade dan aktivasi akun Pro Anda.
            </DialogDescription>
          </DialogHeader>

          {upgradeMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : upgradeResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                  Siap untuk diproses!
                </p>
                <p className="text-xs text-muted-foreground">
                  Hubungi kami via WhatsApp atau email di bawah. Sebutkan email akun Anda dan paket yang dipilih.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full gap-2 bg-green-500 hover:bg-green-600"
                  onClick={() => window.open(upgradeResult.contactInfo.whatsapp, '_blank')}
                  data-testid="button-upgrade-wa"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat via WhatsApp
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(`mailto:${upgradeResult.contactInfo.email}?subject=${encodeURIComponent(upgradeResult.contactInfo.subject)}`, '_blank')}
                  data-testid="button-upgrade-email"
                >
                  <Mail className="h-4 w-4" />
                  Kirim Email
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
                <p className="font-medium">Informasi yang perlu disertakan:</p>
                <p className="text-muted-foreground">• Email akun: <span className="font-mono">{user?.email}</span></p>
                <p className="text-muted-foreground">• Paket yang dipilih: <span className="font-medium">{targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}</span></p>
                <p className="text-muted-foreground">• Harga: {targetPlan === 'pro' ? 'Rp 99.000/bulan' : 'Rp 499.000/bulan'}</p>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Aktivasi dalam 1×24 jam kerja setelah pembayaran dikonfirmasi
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
