import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Search, Copy, Check, Star, Mic2, BookOpen, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const JUDUL_DATA: Record<string, { judul: string; format: string; trend: 'hot' | 'rising' | 'steady' }[]> = {
  'Bisnis & Wirausaha': [
    { judul: 'Dari 0 ke 10 Juta: Panduan Bisnis Online untuk Pemula', format: 'Audiobook', trend: 'hot' },
    { judul: 'Rahasia Dropship Anti-Rugi yang Jarang Diajarkan', format: 'Podcast', trend: 'hot' },
    { judul: 'Mindset Sultan: Cara Berpikir Orang Kaya yang Berbeda', format: 'Audiobook', trend: 'hot' },
    { judul: 'Side Hustle 2026: 7 Bisnis Sampingan dengan Modal di Bawah 500rb', format: 'Audiobook', trend: 'rising' },
    { judul: 'Jualan di TikTok Shop: Dari Nol sampai Rp 100 Juta/Bulan', format: 'Podcast', trend: 'hot' },
    { judul: 'Bisnis Digital Tanpa Modal: Strategi yang Terbukti Berhasil', format: 'Audiobook', trend: 'rising' },
    { judul: 'Franchise Murah Meriah: Pilihan Terbaik untuk Modal Kecil', format: 'Audiobook', trend: 'steady' },
    { judul: 'Reseller vs Dropship: Mana yang Lebih Menguntungkan?', format: 'Podcast', trend: 'rising' },
  ],
  'Parenting & Keluarga': [
    { judul: 'Parenting Gen Z: Cara Mendidik Anak di Era Digital', format: 'Audiobook', trend: 'hot' },
    { judul: 'Bicara dengan Anak Tanpa Drama: Komunikasi Efektif untuk Orang Tua', format: 'Audiobook', trend: 'rising' },
    { judul: 'Ayah Hebat: Peran Ayah yang Sering Dilupakan', format: 'Podcast', trend: 'rising' },
    { judul: 'Screen Time Anak: Solusi Nyata yang Bukan Melarang', format: 'Audiobook', trend: 'hot' },
    { judul: 'Sandwich Generation: Cara Mengelola Keuangan Keluarga Besar', format: 'Podcast', trend: 'steady' },
    { judul: 'Homeschooling 101: Panduan Lengkap untuk Orang Tua Pemula', format: 'Audiobook', trend: 'rising' },
  ],
  'Kesehatan & Wellness': [
    { judul: 'Tidur Lebih Baik: Panduan Ilmiah untuk Tidur Berkualitas', format: 'Audiobook', trend: 'hot' },
    { judul: 'Diet Intermiten untuk Wanita: Yang Dokter Tidak Selalu Ceritakan', format: 'Audiobook', trend: 'hot' },
    { judul: 'Mengelola Stres di Dunia yang Makin Cepat', format: 'Podcast', trend: 'rising' },
    { judul: 'Olahraga 15 Menit: Program Efektif untuk yang Super Sibuk', format: 'Audiobook', trend: 'hot' },
    { judul: 'Gut Health: Kenapa Usus Kamu Menentukan Kesehatan Mental', format: 'Audiobook', trend: 'rising' },
    { judul: 'Burnout Recovery: Cara Bangkit dari Kelelahan Ekstrem', format: 'Podcast', trend: 'rising' },
  ],
  'Karir & Produktivitas': [
    { judul: 'Nego Gaji Tanpa Takut: Cara Meminta Kenaikan yang Disetujui', format: 'Audiobook', trend: 'hot' },
    { judul: 'Deep Work di Era Distraksi: Fokus Total dalam 90 Menit', format: 'Audiobook', trend: 'hot' },
    { judul: 'Personal Branding di LinkedIn: Strategi Tanpa Bullshit', format: 'Podcast', trend: 'rising' },
    { judul: 'Remote Work Mastery: Produktif dari Rumah Tanpa Drama', format: 'Audiobook', trend: 'steady' },
    { judul: 'Career Pivot: Ganti Karir di 30an Tanpa Kehilangan Segalanya', format: 'Podcast', trend: 'rising' },
    { judul: 'Second Brain: Sistem Catatan yang Mengubah Hidup', format: 'Audiobook', trend: 'hot' },
  ],
  'Keuangan & Investasi': [
    { judul: 'Investasi Reksa Dana untuk Gajian 5 Juta: Panduan Realistis', format: 'Audiobook', trend: 'hot' },
    { judul: 'Anti Miskin di Hari Tua: Perencanaan Pensiun usia 25-40', format: 'Audiobook', trend: 'hot' },
    { judul: 'Crypto 101: Fakta yang Influencer Tidak Ceritakan', format: 'Podcast', trend: 'rising' },
    { judul: 'Utang Produktif vs Utang Konsumtif: Cara Bijak Berhutang', format: 'Audiobook', trend: 'steady' },
    { judul: 'Dollar Cost Averaging: Investasi Saham Tanpa Pusing Analisis', format: 'Audiobook', trend: 'rising' },
    { judul: 'Emergency Fund yang Benar: Bukan Sekadar 3x Gaji', format: 'Podcast', trend: 'hot' },
  ],
  'Self-Development': [
    { judul: 'Atomic Habits Indonesia: Kebiasaan Kecil, Hasil Luar Biasa', format: 'Audiobook', trend: 'hot' },
    { judul: 'Overthinking Berhenti di Sini: Teknik Sains untuk Pikiran Tenang', format: 'Audiobook', trend: 'hot' },
    { judul: 'Introvert Advantage: Cara Sukses Tanpa Pura-Pura Extrovert', format: 'Audiobook', trend: 'rising' },
    { judul: 'Morning Routine yang Bukan Omong Kosong', format: 'Podcast', trend: 'rising' },
    { judul: 'Belajar Cepat: Teknik Meta-Learning yang Dipakai Para Jenius', format: 'Audiobook', trend: 'hot' },
    { judul: 'No More Toxic Positivity: Menghadapi Masalah dengan Jujur', format: 'Podcast', trend: 'steady' },
  ],
  'Teknologi & AI': [
    { judul: 'ChatGPT untuk Bisnis: 50 Cara Nyata Menghasilkan Uang', format: 'Audiobook', trend: 'hot' },
    { judul: 'AI Automation: Pekerjaan Mana yang Hilang & Mana yang Tumbuh', format: 'Podcast', trend: 'hot' },
    { judul: 'Prompt Engineering Pemula: Cara Ngobrol dengan AI yang Benar', format: 'Audiobook', trend: 'rising' },
    { judul: 'No-Code Tools 2026: Bangun Produk Digital Tanpa Coding', format: 'Audiobook', trend: 'rising' },
    { judul: 'Digital Nomad Ready: Tools & Setup untuk Kerja dari Mana Saja', format: 'Podcast', trend: 'rising' },
  ],
  'Relationship & Sosial': [
    { judul: 'Seni Bicara yang Didengar: Public Speaking Tanpa Bakat Khusus', format: 'Audiobook', trend: 'hot' },
    { judul: 'Networking yang Tidak Terasa Awkward: Strategi Nyata', format: 'Audiobook', trend: 'rising' },
    { judul: 'Red Flags & Green Flags: Memilih Pasangan yang Benar', format: 'Podcast', trend: 'hot' },
    { judul: 'Toxic Relationship: Tanda, Dampak, dan Cara Keluar', format: 'Audiobook', trend: 'rising' },
    { judul: 'Komunikasi Asertif: Berani Berkata Tidak Tanpa Rasa Bersalah', format: 'Audiobook', trend: 'steady' },
  ],
};

const ALL_CATEGORIES = Object.keys(JUDUL_DATA);
const FORMAT_ICONS: Record<string, typeof Mic2> = { Audiobook: BookOpen, Podcast: Mic2 };
const TREND_CONFIG = {
  hot: { label: '🔥 Viral', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  rising: { label: '📈 Naik', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  steady: { label: '⭐ Stabil', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
};

interface JudulTerlarisProps {
  onSelectJudul: (judul: string) => void;
}

export function JudulTerlaris({ onSelectJudul }: JudulTerlarisProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES[0]);
  const [copiedJudul, setCopiedJudul] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = (judul: string) => {
    onSelectJudul(judul);
    setOpen(false);
    toast({
      title: "Judul diterapkan!",
      description: "Judul berhasil diisi ke form proyek.",
    });
  };

  const handleCopy = (judul: string) => {
    navigator.clipboard.writeText(judul);
    setCopiedJudul(judul);
    setTimeout(() => setCopiedJudul(null), 2000);
    toast({ description: "Judul disalin ke clipboard" });
  };

  const filteredData: Record<string, typeof JUDUL_DATA[string]> = {};
  if (search.trim()) {
    for (const [cat, items] of Object.entries(JUDUL_DATA)) {
      const matches = items.filter((i) =>
        i.judul.toLowerCase().includes(search.toLowerCase())
      );
      if (matches.length > 0) filteredData[cat] = matches;
    }
  } else {
    filteredData[activeCategory] = JUDUL_DATA[activeCategory];
  }

  const totalJudul = Object.values(JUDUL_DATA).reduce((a, b) => a + b.length, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-xs border-dashed border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
        onClick={() => setOpen(true)}
        data-testid="button-judul-terlaris"
      >
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{totalJudul} Judul Terlaris</span>
        <span className="sm:hidden">Judul Terlaris</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Database Judul Terlaris
              <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
                {totalJudul} Judul
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Klik judul untuk langsung diterapkan ke proyek, atau salin ke clipboard.
            </DialogDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-judul"
              />
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {!search.trim() && (
              <div className="w-40 shrink-0 border-r bg-muted/30">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-xs transition-colors leading-tight",
                          activeCategory === cat
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {cat}
                        <span className="block text-[10px] opacity-60 mt-0.5">
                          {JUDUL_DATA[cat].length} judul
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {Object.entries(filteredData).map(([cat, items]) => (
                  <div key={cat}>
                    {search.trim() && (
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                        {cat}
                      </p>
                    )}
                    {items.map((item) => {
                      const FIcon = FORMAT_ICONS[item.format] || BookOpen;
                      const trend = TREND_CONFIG[item.trend];
                      const isCopied = copiedJudul === item.judul;
                      return (
                        <div
                          key={item.judul}
                          className="group flex items-start gap-3 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer mb-2"
                          onClick={() => handleSelect(item.judul)}
                          data-testid={`judul-item-${item.judul.slice(0, 20).replace(/\s/g, '-')}`}
                        >
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <FIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                              {item.judul}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground">{item.format}</span>
                              <Badge className={cn("text-[10px] px-1.5 py-0 h-4 border-0", trend.class)}>
                                {trend.label}
                              </Badge>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(item.judul); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted"
                            data-testid="button-copy-judul"
                          >
                            {isCopied
                              ? <Check className="h-3.5 w-3.5 text-green-500" />
                              : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {Object.keys(filteredData).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Tidak ada judul yang cocok dengan pencarian Anda
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="px-6 py-3 border-t shrink-0 bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500" />
              Klik judul untuk langsung mengisi form — atau gunakan sebagai inspirasi topik Anda
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
