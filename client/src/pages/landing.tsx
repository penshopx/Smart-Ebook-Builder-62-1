import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { DokumenterChatButton } from '@/components/dokumentender-chat-button';
import { ChaesaChatbot } from '@/components/chaesa-chatbot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Book, 
  Sparkles, 
  Lightbulb, 
  FileText, 
  Video, 
  GraduationCap, 
  Megaphone, 
  Check, 
  ArrowRight,
  Zap,
  Users,
  Shield,
  Star,
  Clock,
  Target,
  TrendingUp,
  Award,
  Play,
  Quote,
  ChevronRight,
  Building2,
  Factory,
  Pickaxe,
  Fuel,
  Cpu,
  Wallet,
  Heart,
  BookOpen,
  Palette,
  Bot,
  MessageSquare,
  Rocket,
  CheckCircle2,
  XCircle,
  Crown,
  Gift,
  Timer,
  Flame,
  Globe,
  Lock,
  RefreshCw,
  Smartphone,
  ClipboardList,
  Image,
  DollarSign,
  Volume2,
  Search,
  Layers,
  Workflow,
  ExternalLink,
  ShieldCheck,
  Mic,
  ImagePlus
} from 'lucide-react';

const TESTIMONIALS = [
  {
    name: "Budi Santoso",
    role: "Founder, TechConsult Indonesia",
    avatar: "BS",
    content: "Chaesa AI Studio mengubah cara saya membuat konten. Dalam 2 minggu, saya berhasil menerbitkan 3 ebook teknis yang sekarang jadi lead magnet utama bisnis saya.",
    rating: 5,
    industry: "Teknologi"
  },
  {
    name: "Siti Rahayu",
    role: "Content Creator & Coach",
    avatar: "SR",
    content: "Fitur E-Course Builder luar biasa! Saya bisa mengubah ebook saya jadi kursus online lengkap dengan materi yang terstruktur. Pipeline 9-langkah ini game-changer banget!",
    rating: 5,
    industry: "Coaching"
  },
  {
    name: "Ahmad Hidayat",
    role: "CEO, Mining Safety Academy",
    avatar: "AH",
    content: "Untuk industri pertambangan, dokumentasi dan SOP sangat penting. Tool ini membantu tim saya membuat dokumen standar dengan cepat dan profesional.",
    rating: 5,
    industry: "Pertambangan"
  },
  {
    name: "Dewi Kusuma",
    role: "HR Director, Manufacturing Corp",
    avatar: "DK",
    content: "Kami menggunakan Chaesa AI Studio untuk membuat training materials karyawan. Efisiensi meningkat 70% dibanding cara manual sebelumnya.",
    rating: 5,
    industry: "Manufaktur"
  },
  {
    name: "Reza Pratama",
    role: "Electrical Engineer & Author",
    avatar: "RP",
    content: "Sebagai engineer yang juga penulis, tool ini sempurna. Mini App Blueprint dan Chatbot Demo langsung bisa saya pakai untuk klien. Hemat waktu luar biasa!",
    rating: 5,
    industry: "Kelistrikan"
  },
  {
    name: "Maya Indah",
    role: "Family Coach & Therapist",
    avatar: "MI",
    content: "Tema lifestyle sangat membantu! Quiz Generator dan Silabus Kursus dari ebook saya sudah menghasilkan ratusan leads baru. ROI-nya fantastis!",
    rating: 5,
    industry: "Lifestyle"
  }
];

const STATS = [
  { value: "10,000+", label: "Prompt Generated", icon: Sparkles },
  { value: "2,500+", label: "Ebook Created", icon: Book },
  { value: "500+", label: "Active Users", icon: Users },
  { value: "24", label: "Industry Themes", icon: Building2 }
];

const INDUSTRIES = [
  { name: "Engineering", icon: Cpu, color: "from-blue-500 to-cyan-500" },
  { name: "Konstruksi", icon: Building2, color: "from-orange-500 to-amber-500" },
  { name: "Pertambangan", icon: Pickaxe, color: "from-stone-500 to-zinc-600" },
  { name: "Oil & Gas", icon: Fuel, color: "from-emerald-500 to-green-600" },
  { name: "Kelistrikan", icon: Zap, color: "from-yellow-500 to-orange-500" },
  { name: "Manufaktur", icon: Factory, color: "from-indigo-500 to-purple-500" },
  { name: "UMKM", icon: Wallet, color: "from-pink-500 to-rose-500" },
  { name: "Teknologi", icon: Cpu, color: "from-violet-500 to-purple-600" },
  { name: "Kekayaan", icon: TrendingUp, color: "from-amber-500 to-yellow-500" },
  { name: "Keluarga", icon: Heart, color: "from-rose-500 to-pink-500" },
  { name: "Spiritualitas", icon: BookOpen, color: "from-purple-500 to-indigo-500" },
  { name: "Kesehatan", icon: Heart, color: "from-green-500 to-emerald-500" },
  { name: "Hobby", icon: Palette, color: "from-cyan-500 to-blue-500" }
];

const FEATURES = [
  { icon: Lightbulb, title: 'Brainstorm Ide', desc: 'Eksplorasi ide-ide kreatif untuk ebook Anda dengan AI yang memahami konteks industri Anda', benefit: 'Hemat 5+ jam riset' },
  { icon: Sparkles, title: 'Big Idea', desc: 'Pertajam positioning dan konsep unik yang menjual dengan analisis kompetitor otomatis', benefit: '3x lebih menarik' },
  { icon: FileText, title: 'Outline', desc: 'Susun kerangka dan daftar isi lengkap secara otomatis sesuai standar penerbitan profesional', benefit: 'Struktur profesional' },
  { icon: Book, title: 'Draft Bab', desc: 'Tulis konten bab per bab dengan mudah — termasuk studi kasus dan contoh industri spesifik', benefit: '10x lebih cepat' },
  { icon: Video, title: 'Video Script', desc: 'Buat script video dan podcast dari konten ebook, lengkap dengan panduan TTS & narasi', benefit: 'Multi-format content' },
  { icon: GraduationCap, title: 'E-Course Builder', desc: 'Ubah ebook jadi silabus kursus online lengkap — durasi, format, materi, dan modul assessment', benefit: 'Monetisasi 10x lipat' },
  { icon: FileText, title: 'Document Generator', desc: 'Buat SOP, Policy, Kontrak, dan dokumen profesional terstandar untuk berbagai kebutuhan bisnis', benefit: 'Standarisasi bisnis' },
  { icon: Bot, title: 'GPT Builder', desc: 'Buat system prompt untuk chatbot AI custom yang siap di-deploy sebagai asisten virtual bisnis', benefit: 'AI Assistant pribadi' },
  { icon: Megaphone, title: 'Marketing Kit', desc: 'Buat caption, email blast, iklan, dan materi promosi yang terkonversi tinggi dari konten ebook', benefit: 'Konversi naik 200%' },
  { icon: Smartphone, title: 'Mini App Builder', desc: 'Rancang blueprint mini-app dari topik ebook Anda, lengkap dengan deep-link ke Lovable, Bolt, Cursor, Replit', benefit: 'Deploy lebih cepat' },
  { icon: ClipboardList, title: 'Quiz Maker', desc: 'Generate soal kuis asesmen berlevel dari konten ebook — pilihan ganda, esai, dan kasus studi', benefit: 'Engagement naik 3x' },
  { icon: FileText, title: 'Extend Text', desc: 'Kembangkan teks pendek atau poin-poin menjadi konten panjang yang kaya dan terstruktur', benefit: 'Efisiensi maksimal' },
  { icon: Zap, title: 'Prompt Pack', desc: 'Generate rangkaian prompt lengkap untuk seluruh workflow produksi konten sekaligus', benefit: 'Automasi proses' },
];

const ECOSYSTEM_STEPS = [
  { step: 1, icon: Book, title: 'Ebook', desc: 'Konten utama', color: 'from-blue-500 to-cyan-500', phase: 'Foundation' },
  { step: 2, icon: Bot, title: 'Chatbot Demo', desc: 'AI dari konten ebook', color: 'from-violet-500 to-purple-600', phase: 'Konversi' },
  { step: 3, icon: GraduationCap, title: 'Silabus E-Course', desc: 'Kurikulum 8 modul', color: 'from-emerald-500 to-green-600', phase: 'Monetisasi' },
  { step: 4, icon: Smartphone, title: 'Mini App Blueprint', desc: 'Rancangan aplikasi', color: 'from-orange-500 to-amber-500', phase: 'Produk' },
  { step: 5, icon: ClipboardList, title: 'Quiz Generator', desc: 'Soal asesmen berlevel', color: 'from-pink-500 to-rose-500', phase: 'Engagement' },
  { step: 6, icon: Megaphone, title: 'Marketing Kit', desc: '7 kanal promosi', color: 'from-red-500 to-orange-500', phase: 'Growth' },
  { step: 7, icon: Volume2, title: 'Script + TTS', desc: 'Narasi & audio', color: 'from-indigo-500 to-blue-600', phase: 'Distribusi' },
  { step: 8, icon: Image, title: 'Thumbnail AI', desc: 'Cover DALL-E 3', color: 'from-teal-500 to-cyan-600', phase: 'Visual' },
  { step: 9, icon: DollarSign, title: 'Monetisasi', desc: 'Strategi revenue', color: 'from-amber-500 to-yellow-500', phase: 'Revenue' },
  { step: 10, icon: ShieldCheck, title: 'AI Quality Review', desc: 'Cek kualitas otomatis', color: 'from-lime-500 to-green-500', phase: 'QA' },
  { step: 11, icon: Mic, title: 'Podcast Script', desc: 'Script episode podcast', color: 'from-purple-500 to-pink-500', phase: 'Audio' },
  { step: 12, icon: Book, title: 'Audiobook Script', desc: 'Narasi solo profesional', color: 'from-rose-500 to-red-600', phase: 'Audio' },
  { step: 13, icon: ExternalLink, title: 'Landing Page', desc: 'Copy + HTML siap upload', color: 'from-green-500 to-emerald-600', phase: 'Jual' },
  { step: 14, icon: Palette, title: 'Cover Template', desc: 'HTML siap cetak', color: 'from-cyan-500 to-teal-600', phase: 'Visual' },
  { step: 15, icon: Globe, title: 'FlipBook Guide', desc: 'Panduan interaktif', color: 'from-sky-500 to-blue-600', phase: 'Distribusi' },
  { step: 16, icon: ImagePlus, title: 'Mockup 3D', desc: 'Foto produk DALL-E 3', color: 'from-fuchsia-500 to-purple-600', phase: 'Visual' },
];

const FAQ_DATA = [
  {
    question: "Apakah Chaesa AI Studio cocok untuk pemula?",
    answer: "Ya! Tool ini dirancang untuk semua level. Interface yang intuitif, pipeline workflow yang terstruktur, dan panduan langkah demi langkah memudahkan siapa saja untuk mulai membuat ekosistem konten profesional, bahkan tanpa pengalaman sebelumnya."
  },
  {
    question: "Apa itu Pipeline 16-Output?",
    answer: "Pipeline 16-Output adalah ekosistem produksi konten lengkap yang mengubah satu ebook menjadi 16 produk berbeda: Chatbot Demo AI, Silabus E-Course 8 Modul, Mini App Blueprint, Quiz Generator berlevel, Marketing Kit 7 kanal (Instagram, TikTok, WhatsApp, Tokopedia, dll), Script + TTS Audio, Thumbnail AI (DALL-E 3), Strategi Monetisasi, AI Quality Review, Podcast Script, Audiobook Script, Landing Page Copy & HTML, Cover Template HTML, FlipBook Guide, Riset Topik, dan Mockup 3D DALL-E 3. Satu sumber, 16 produk profesional!"
  },
  {
    question: "Bagaimana cara kerja generator prompt?",
    answer: "Anda cukup mengisi form dengan informasi proyek ebook Anda (topik, target audiens, gaya penulisan, industri, dll), lalu sistem akan menghasilkan prompt yang dioptimasi untuk AI seperti ChatGPT, Claude, atau DokumenTender AI. Pipeline workflow memandu Anda dari brainstorm hingga ekosistem konten lengkap."
  },
  {
    question: "Apakah prompt yang dihasilkan bisa digunakan di AI manapun?",
    answer: "Ya! Prompt yang dihasilkan kompatibel dengan berbagai AI seperti ChatGPT, Claude, Gemini, DeepSeek, Perplexity, dan terutama DokumenTender AI yang kami rekomendasikan untuk hasil terbaik dalam Bahasa Indonesia."
  },
  {
    question: "Industri apa saja yang didukung?",
    answer: "Kami mendukung 24 kategori industri: Engineering, Konstruksi, Pertambangan, Oil & Gas, Kelistrikan, Manufaktur, UMKM, Teknologi, Perijinan Usaha, Tender & Pengadaan, Sertifikasi SBU & SKK, Manajemen Proyek, ERP, BIM, PUB, PKB, ISO, Pancek KPK, serta tema lifestyle seperti Kekayaan, Keluarga, Spiritualitas, Kesehatan, dan Hobi."
  },
  {
    question: "Berapa banyak mode generasi yang tersedia?",
    answer: "Tersedia 16 mode generasi lengkap: Brainstorm, Big Idea, Outline, Draft Bab, Video Script, E-Course Builder, Document Generator, GPT Builder, Marketing Kit, Mini App Builder, Quiz Maker, Extend Text, Prompt Pack, Podcast Script, Audiobook Script, dan Riset Topik. Ditambah Pipeline 16-Output untuk ekosistem konten menyeluruh."
  },
  {
    question: "Bagaimana dengan Mini App Builder dan Quiz Maker?",
    answer: "Mini App Builder membantu Anda merancang blueprint aplikasi dari topik ebook, lengkap dengan struktur fitur, tech stack, dan deep-link ke platform seperti Lovable, Bolt.new, Cursor, dan Replit untuk langsung memulai pengembangan. Quiz Maker menghasilkan soal kuis berlevel (Beginner hingga Advanced) yang bisa langsung digunakan untuk kursus online atau lead magnet."
  },
  {
    question: "Bagaimana dengan keamanan data saya?",
    answer: "Keamanan adalah prioritas kami. Semua data dienkripsi, dan kami menggunakan autentikasi Replit yang aman. Proyek Anda hanya bisa diakses oleh Anda."
  }
];

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) {
  return (
    <Card className="h-full hover-elevate">
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <Quote className="h-8 w-8 text-primary/20 mb-2" />
        <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
        <div className="flex items-center gap-3 pt-4 border-t">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{testimonial.avatar}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{testimonial.name}</p>
            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">{testimonial.industry}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonTable() {
  const features = [
    { name: "Prompt per hari", free: "5", pro: "Unlimited", enterprise: "Unlimited" },
    { name: "Mode generasi", free: "3", pro: "16", enterprise: "16 + Custom" },
    { name: "Pipeline 16-Output Penuh", free: false, pro: true, enterprise: true },
    { name: "Simpan proyek", free: "1", pro: "Unlimited", enterprise: "Unlimited" },
    { name: "Export format (TXT/PDF/DOCX/MD/HTML)", free: "Teks", pro: "Semua", enterprise: "Semua + API" },
    { name: "Industry themes", free: "3", pro: "24", enterprise: "24 + Custom" },
    { name: "AI Image (DALL-E 3) cover & thumbnail", free: false, pro: true, enterprise: true },
    { name: "Text-to-Speech (TTS) script", free: false, pro: true, enterprise: true },
    { name: "Mini App Blueprint + deep-link", free: false, pro: true, enterprise: true },
    { name: "AI Character modes", free: false, pro: true, enterprise: true },
    { name: "Priority support", free: false, pro: true, enterprise: true },
    { name: "Team collaboration", free: false, pro: false, enterprise: true },
    { name: "White-label export", free: false, pro: false, enterprise: true },
    { name: "API Access", free: false, pro: false, enterprise: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 px-4 font-semibold">Fitur</th>
            <th className="text-center py-4 px-4 font-semibold">Free</th>
            <th className="text-center py-4 px-4 font-semibold">
              <div className="inline-flex items-center gap-1">
                Pro <Crown className="h-4 w-4 text-amber-500" />
              </div>
            </th>
            <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="py-3 px-4">{feature.name}</td>
              <td className="text-center py-3 px-4">
                {typeof feature.free === 'boolean' ? (
                  feature.free ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                ) : (
                  <span>{feature.free}</span>
                )}
              </td>
              <td className="text-center py-3 px-4 bg-primary/5">
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                ) : (
                  <span className="font-medium text-primary">{feature.pro}</span>
                )}
              </td>
              <td className="text-center py-3 px-4">
                {typeof feature.enterprise === 'boolean' ? (
                  feature.enterprise ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                ) : (
                  <span>{feature.enterprise}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 justify-center">
      <Timer className="h-5 w-5 text-red-500" />
      <div className="flex items-center gap-1 font-mono font-bold text-lg">
        <span className="bg-red-500 text-white px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-red-500 text-white px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-red-500 text-white px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-screen-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
              <Book className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chaesa AI Studio</h1>
              <p className="text-[10px] text-muted-foreground leading-none">AI Prompt Generator · 24 Industri</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">
                Masuk / Daftar
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="container px-4 mx-auto max-w-screen-xl relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Urgency Banner */}
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Promo Spesial: Diskon 50% untuk 100 user pertama!</span>
              </div>

              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Sparkles className="h-3 w-3 mr-2" />
                AI-Powered Prompt Generator · 16 Mode · Pipeline 16-Output
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Satu Ebook,
                <span className="text-primary block mt-2">Sembilan Output Konten</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                Dari brainstorm hingga ekosistem konten lengkap — ebook, chatbot, e-course, mini app, kuis, 
                marketing kit, TTS audio, thumbnail AI, dan strategi monetisasi.
              </p>
              
              <p className="text-lg font-medium mb-8 max-w-2xl mx-auto">
                <span className="text-primary">Chaesa AI Studio</span> menghasilkan prompt AI terstruktur untuk 
                membangun ekosistem konten profesional lengkap — dalam hitungan menit.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button size="lg" asChild className="text-lg px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500" data-testid="button-cta-main">
                  <a href="/api/login">
                    <Rocket className="mr-2 h-5 w-5" />
                    Mulai Gratis Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" data-testid="button-demo">
                  <Play className="mr-2 h-5 w-5" />
                  Lihat Demo (2 menit)
                </Button>
              </div>
              
              {/* Trust Signals */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Gratis untuk memulai</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Tidak perlu kartu kredit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Setup dalam 30 detik</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof: Stats */}
        <section className="py-12 border-t border-b bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline 16-Output */}
        <section className="py-20 border-b">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Workflow className="h-3 w-3 mr-2" />
                Ekosistem Konten
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pipeline 16-Output — Satu Ebook, Enam Belas Produk
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Dari satu ebook, bangun ekosistem konten penuh: chatbot AI, kursus, podcast, 
                landing page, mockup 3D, marketing kit, dan banyak lagi — semua terintegrasi.
              </p>
            </div>

            {/* Central Ebook → 16 outputs visual */}
            <div className="max-w-5xl mx-auto">
              {/* Top row label */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-semibold shadow-lg">
                  <Book className="h-5 w-5" />
                  Ebook Anda (Sumber Utama)
                  <ArrowRight className="h-5 w-5" />
                  16 Output Otomatis
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-8 gap-3">
                {ECOSYSTEM_STEPS.filter(s => s.step > 1).map((step, idx) => (
                  <div key={idx} className="group text-center" data-testid={`card-ecosystem-step-${step.step}`}>
                    <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-3 group-hover:scale-110 transition-transform shadow-md mx-auto`}>
                      <step.icon className="h-7 w-7" />
                    </div>
                    <p className="text-xs font-semibold leading-tight">{step.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                    <Badge variant="outline" className="text-[9px] mt-1 px-1.5">{step.phase}</Badge>
                  </div>
                ))}
              </div>

              {/* Export formats bar */}
              <div className="mt-8 p-4 rounded-xl bg-muted/50 border flex flex-wrap items-center justify-center gap-3 text-sm">
                <span className="font-medium text-muted-foreground">Export semua output ke:</span>
                {['TXT', 'PDF', 'DOCX', 'Markdown', 'HTML'].map(fmt => (
                  <Badge key={fmt} variant="secondary" className="font-mono">{fmt}</Badge>
                ))}
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">AI Image via DALL-E 3 · Audio via TTS-1</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem-Solution */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Masalah Umum</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Apakah Anda Mengalami Ini?</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              {/* Problems */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
                  <XCircle className="h-6 w-6" />
                  Tanpa Chaesa AI Studio
                </h3>
                {[
                  "Menghabiskan berminggu-minggu untuk menulis satu ebook",
                  "Bingung struktur konten dan tidak tahu harus mulai dari mana",
                  "Prompt AI asal-asalan dengan hasil yang tidak konsisten",
                  "Ebook hanya jadi PDF — tidak ada ekosistem konten turunan",
                  "Kehilangan peluang monetisasi dari konten yang sudah ada"
                ].map((problem, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{problem}</span>
                  </div>
                ))}
              </div>
              
              {/* Solutions */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6" />
                  Dengan Chaesa AI Studio
                </h3>
                {[
                  "Generate prompt lengkap dalam hitungan detik, 16 mode pilihan",
                  "Pipeline workflow terstruktur dari brainstorm hingga ekosistem",
                  "Prompt profesional dioptimasi per industri — hasil konsisten",
                  "Satu ebook → 16 output: chatbot AI, kursus, podcast, landing page, mockup 3D...",
                  "Strategi monetisasi lengkap built-in untuk setiap output"
                ].map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* VSL Founder Story */}
        <section className="py-20 border-t bg-gradient-to-br from-amber-50/60 via-background to-orange-50/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
          <div className="container px-4 mx-auto max-w-screen-xl">
            {/* Section header */}
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                <TrendingUp className="h-3 w-3 mr-2" />
                Kisah Nyata · Bukan Teori
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Dari <span className="text-amber-600 dark:text-amber-400">Laptop + Internet</span>
                <br />Jadi <span className="text-primary">1,6 Miliar Rupiah</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tahun 2015–2019. Tanpa sewa ruko, tanpa stok barang, tanpa gaji karyawan. 
                Hanya dari produk digital bernama ebook.
              </p>
            </div>

            {/* Big stat + quote */}
            <div className="grid md:grid-cols-2 gap-8 mb-14 items-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-20" />
                <Card className="relative border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
                  <CardContent className="pt-8 pb-6 px-8 text-center">
                    <div className="text-7xl font-black text-amber-600 dark:text-amber-400 mb-2">1,6M</div>
                    <div className="text-2xl font-bold mb-1">Rupiah</div>
                    <div className="text-sm text-muted-foreground mb-6">dari jualan ebook saja · 4 tahun · 100% digital</div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">0</div>
                        <div className="text-muted-foreground text-xs">Stok barang</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">0</div>
                        <div className="text-muted-foreground text-xs">Sewa toko</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">0</div>
                        <div className="text-muted-foreground text-xs">Gaji karyawan</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-primary">∞</div>
                        <div className="text-muted-foreground text-xs">Dijual berkali-kali</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl border bg-card hover-elevate">
                  <Quote className="h-6 w-6 text-amber-400 mb-2" />
                  <p className="text-base italic text-muted-foreground leading-relaxed">
                    "Bayangin kalau Anda punya resep keluarga masakan yang enak banget... Kalau Anda jual masakannya, 
                    Anda harus belanja bahan, masak, mengemas, mengirim. Ribet. Tapi kalau Anda jual <strong>resepnya</strong> — 
                    Anda cukup nulis sekali dan orang bisa download berkali-kali."
                  </p>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-3">— Mas Harley, Founder</p>
                </div>
                <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-200 dark:border-amber-800 flex items-start gap-3">
                  <Globe className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Tidak terbatas wilayah.</strong> Anda bisa dapat uang bahkan dari tempat terpencil yang Anda tidak pernah tahu di mana lokasinya.
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-green-500/5 border-green-200 dark:border-green-800 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Keuntungan murni masuk ke kantong Anda.</strong> Biaya produksi nol. Tidak ada logistik. Sekali buat, dijual ribuan kali.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Steps */}
            <div className="mb-14">
              <h3 className="text-center text-xl font-bold mb-8">
                3 Langkah yang <span className="text-primary">Bisa Dibantu AI</span> — dari Ide sampai Jual
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    icon: Lightbulb,
                    title: "Temukan Ide",
                    color: "from-blue-500 to-cyan-500",
                    bg: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
                    border: "border-blue-200 dark:border-blue-800",
                    desc: "Dulu harus brainstorming berminggu-minggu. Sekarang cukup ajukan beberapa pertanyaan ke AI — Anda langsung dapat daftar ide yang sudah terbukti ada pasarnya.",
                  },
                  {
                    step: "2",
                    icon: FileText,
                    title: "Tulis Kontennya",
                    color: "from-purple-500 to-violet-500",
                    bg: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
                    border: "border-purple-200 dark:border-purple-800",
                    desc: "Tidak perlu jago nulis. AI bisa bikin kerangka sampai mengisi ebook lengkap sesuai instruksi Anda. Proses yang dulu butuh berbulan-bulan, kini jadi hitungan jam.",
                  },
                  {
                    step: "3",
                    icon: ImagePlus,
                    title: "Desain Cover & Jual",
                    color: "from-amber-500 to-orange-500",
                    bg: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
                    border: "border-amber-200 dark:border-amber-800",
                    desc: "Tidak perlu mahir desain. AI bantu bikin cover yang cantik — warna, layout, gambar — semuanya sudah pintar. Lalu iklan dan konten penjualannya pun bisa dibuatkan AI.",
                  },
                ].map(({ step, icon: Icon, title, color, bg, border, desc }) => (
                  <div key={step} className={`relative p-6 rounded-2xl border ${border} bg-gradient-to-br ${bg} hover-elevate`}>
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${color} text-white font-bold text-lg mb-4`}>
                      {step}
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                    <h4 className="font-bold text-base mb-2">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee + CTA */}
            <div className="max-w-3xl mx-auto">
              <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="pt-8 pb-8 px-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 text-center">
                      <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Garansi</div>
                      <div className="text-2xl font-black text-green-700 dark:text-green-400">24 Jam</div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-bold text-lg mb-2">Garansi Uang Kembali — Tanpa Pertanyaan</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Jika dalam 24 jam Anda mempelajari semua materi dan tidak mendapat ide yang menarik sama sekali, 
                        uang akan dikembalikan penuh. Risiko sepenuhnya di kami. Anda tidak rugi sepeserpun.
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs">
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Tidak ada syarat rumit
                        </div>
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Langsung diproses
                        </div>
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> 100% aman
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4 text-sm">
                  Bayangin dalam 24 jam Anda sudah punya ide, punya produknya, dan bisa langsung jual.
                </p>
                <Button size="lg" asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-10" data-testid="button-cta-vsl">
                  <a href="/api/login">
                    <Rocket className="mr-2 h-5 w-5" />
                    Mulai Bikin Produk Digital Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Gratis untuk memulai · Tidak perlu kartu kredit</p>
              </div>
            </div>
          </div>
        </section>

        {/* Industries Supported */}
        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Multi-Industry</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Cocok untuk 24 Industri & Tema</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Dari industri berat hingga lifestyle, prompt kami disesuaikan dengan terminologi dan konteks spesifik masing-masing bidang.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {INDUSTRIES.map((industry, idx) => (
                <Card key={idx} className="text-center p-4 hover-elevate cursor-pointer group" data-testid={`card-industry-${idx}`}>
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${industry.color} text-white mb-3 group-hover:scale-110 transition-transform`}>
                    <industry.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">{industry.name}</p>
                </Card>
              ))}
              {/* "+11 more" card */}
              <Card className="text-center p-4 hover-elevate cursor-pointer group bg-gradient-to-br from-muted to-muted/50">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-lg font-bold text-primary">+11</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Industri lainnya</p>
              </Card>
            </div>
          </div>
        </section>

        {/* 13 Mode Features */}
        <section className="py-20 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Layers className="h-3 w-3 mr-2" />
                Fitur Lengkap
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">16 Mode Generasi Prompt</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Dari brainstorming ide hingga blueprint mini app dan kuis asesmen — semua yang Anda butuhkan 
                untuk membangun ekosistem konten profesional dalam satu platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, index) => (
                <Card key={index} className="hover-elevate group" data-testid={`card-feature-${index}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <feature.icon className="h-6 w-6 text-primary group-hover:text-white" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                        {feature.benefit}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Mudah Digunakan</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Kerja — 4 Langkah Mudah</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tidak perlu keahlian teknis. Siapapun bisa membangun ekosistem konten profesional dalam hitungan menit.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: 1, title: "Isi Form Proyek", desc: "Masukkan topik, target audiens, industri, dan preferensi gaya ebook Anda.", icon: FileText },
                { step: 2, title: "Pilih Mode Generasi", desc: "Pilih dari 13 mode: brainstorm, outline, draft bab, GPT Builder, Mini App, Quiz, dan lainnya.", icon: Target },
                { step: 3, title: "Eksekusi di AI", desc: "Copy prompt dan jalankan di DokumenTender AI, ChatGPT, atau AI favorit Anda.", icon: Rocket },
                { step: 4, title: "Bangun Ekosistem", desc: "Ikuti pipeline 9-langkah: dari ebook ke chatbot, kursus, mini app, kuis, dan revenue stream.", icon: Workflow }
              ].map((item, idx) => (
                <div key={idx} className="relative text-center group">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                  {idx < 3 && (
                    <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Partner - DokumenTender */}
        <section className="py-20 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden border-2 border-primary/20">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-primary/10 text-primary">Rekomendasi Partner AI</Badge>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                      Eksekusi Prompt dengan <span className="text-primary">DokumenTender AI</span>
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Whitelabel LLM Indonesia yang dioptimasi untuk dokumen teknis, tender, dan konten bisnis. 
                      Hasil lebih akurat dalam Bahasa Indonesia.
                    </p>
                    <ul className="space-y-3 mb-6">
                      {["Gratis untuk akses dasar", "Optimized Bahasa Indonesia", "Spesialis dokumen teknis", "Integrasi seamless dengan prompt kami"].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => window.open('https://chat.dokumentender.com', '_blank')}
                      className="w-fit"
                      data-testid="button-dokumentender"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Coba DokumenTender AI
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 p-8 md:p-12 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl">
                      <Bot className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Testimoni</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Pengguna Kami</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Bergabung dengan ratusan content creator dan profesional yang sudah merasakan manfaatnya.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((testimonial, idx) => (
                <TestimonialCard key={idx} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing with Urgency */}
        <section className="py-20 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-6">
              <Badge variant="outline" className="mb-4">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pilih Paket Anda</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Mulai gratis, upgrade kapan saja sesuai kebutuhan.
              </p>
              
              {/* Urgency Timer */}
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-8">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <Gift className="h-4 w-4" />
                  Promo Launching: Diskon 50% berakhir dalam
                </div>
                <CountdownTimer />
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              {/* Free */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Untuk mencoba fitur dasar</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Rp 0</span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['5 prompt per hari', '3 mode generasi', 'Simpan 1 proyek', 'Export format teks', '3 industry themes'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/api/login">Mulai Gratis</a>
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro - Highlighted */}
              <Card className="relative border-2 border-primary shadow-xl scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-purple-600 px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Paling Populer
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Untuk content creator serius</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-muted-foreground line-through">Rp 199K</span>
                      <Badge variant="destructive" className="text-xs">-50%</Badge>
                    </div>
                    <span className="text-4xl font-bold text-primary">Rp 99K</span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Unlimited prompt',
                      'Semua 16 mode generasi',
                      'Pipeline 16-Output penuh',
                      'Chatbot Demo AI terintegrasi',
                      'Mockup 3D DALL-E 3',
                      'Landing Page Copy & HTML',
                      'Podcast & Audiobook Script',
                      'Marketing Kit 7 Kanal',
                      'Unlimited proyek',
                      'Export TXT/PDF/DOCX/MD/HTML',
                      '24 industry themes',
                      'AI Image via DALL-E 3',
                      'Text-to-Speech (TTS)',
                      'Mini App Blueprint + deep-link',
                      'Priority support',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gradient-to-r from-primary to-purple-600" asChild data-testid="button-subscribe-pro">
                    <a href="/api/login">
                      <Zap className="mr-2 h-4 w-4" />
                      Pilih Pro Sekarang
                    </a>
                  </Button>
                </CardFooter>
              </Card>

              {/* Enterprise */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Untuk tim dan bisnis</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Rp 499K</span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Semua fitur Pro',
                      'Hingga 10 anggota tim',
                      'White-label export',
                      'API access',
                      'Custom AI training',
                      'Dedicated support',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Hubungi Sales
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Perbandingan Fitur Lengkap</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonTable />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trust: Guarantees */}
        <section className="py-16 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "Data Aman", desc: "Enkripsi end-to-end" },
                { icon: RefreshCw, title: "Garansi 30 Hari", desc: "Uang kembali 100%" },
                { icon: Globe, title: "Akses Global", desc: "24/7 dari manapun" },
                { icon: Lock, title: "Login Aman", desc: "Powered by Replit" }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Punya pertanyaan? Temukan jawabannya di sini.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {FAQ_DATA.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="border rounded-lg px-6" data-testid={`accordion-faq-${idx}`}>
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10">
          <div className="container px-4 mx-auto max-w-screen-xl text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Membangun Ekosistem Konten Anda?
              </h2>
              <p className="text-xl text-muted-foreground mb-4">
                Dari satu ebook → 16 output konten profesional. Chatbot AI, kursus, podcast, audiobook, landing page, mockup 3D, marketing kit 7 kanal, dan banyak lagi — semua dalam satu pipeline terintegrasi.
              </p>
              <p className="text-base text-muted-foreground mb-8">
                Bergabung dengan 500+ content creator yang sudah menggunakan Chaesa AI Studio.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" asChild className="text-lg px-8 bg-gradient-to-r from-primary to-purple-600" data-testid="button-cta-bottom">
                  <a href="/api/login">
                    <Rocket className="mr-2 h-5 w-5" />
                    Mulai Sekarang - Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Setup 30 detik</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Tidak perlu kartu kredit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Garansi 30 hari uang kembali</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4 mx-auto max-w-screen-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Book className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">Chaesa AI Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered prompt generator untuk membangun ekosistem konten profesional dari satu ebook — 16 output, 16 mode, 24 industri.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">16 Mode Generasi</li>
                <li className="hover:text-foreground cursor-pointer">Pipeline 16-Output</li>
                <li className="hover:text-foreground cursor-pointer">Pricing</li>
                <li className="hover:text-foreground cursor-pointer">FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Industri</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">Engineering & Konstruksi</li>
                <li className="hover:text-foreground cursor-pointer">Pertambangan & Oil Gas</li>
                <li className="hover:text-foreground cursor-pointer">UMKM & Teknologi</li>
                <li className="hover:text-foreground cursor-pointer">Lifestyle & Coaching</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Partner AI</h4>
              <Button 
                variant="outline" 
                className="w-full mb-3"
                onClick={() => window.open('https://chat.dokumentender.com', '_blank')}
              >
                <Bot className="mr-2 h-4 w-4" />
                DokumenTender AI
              </Button>
              <p className="text-xs text-muted-foreground">
                AI partner untuk eksekusi prompt dalam Bahasa Indonesia
              </p>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Chaesa AI Studio. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer">Terms</span>
              <span className="hover:text-foreground cursor-pointer">Privacy</span>
              <span className="hover:text-foreground cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Buttons: Left = DokumenTender (eksekusi prompt), Right = Chaesa (knowledge base) */}
      <DokumenterChatButton />
      <ChaesaChatbot />
    </div>
  );
}
