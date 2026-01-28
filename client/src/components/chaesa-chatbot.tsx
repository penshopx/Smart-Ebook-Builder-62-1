import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Loader2, Lightbulb, X, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BigIdeaTemplate {
  niche: string;
  title: string;
  target: string;
  problem: string;
  solution: string;
  whyAttractive: string;
  dataSupport: string;
}

const BIG_IDEA_TEMPLATES: BigIdeaTemplate[] = [
  {
    niche: "Kekayaan",
    title: "Passive Income Blueprint: Dari Rp0 ke Rp10 Juta/Bulan dengan Digital Product",
    target: "Karyawan 25-45 tahun yang ingin penghasilan tambahan",
    problem: "Gaji bulanan habis sebelum tanggal gajian, tidak punya tabungan/investasi",
    solution: "Panduan step-by-step membangun passive income dari digital product tanpa modal besar",
    whyAttractive: "77% milenial Indonesia khawatir tentang keuangan masa depan (Jakpat 2024). Pencarian 'passive income' naik 340% di Google Trends Indonesia.",
    dataSupport: "Riset OJK: Hanya 49% penduduk Indonesia yang melek keuangan. Pasar edukasi finansial senilai $2.3B di Asia Tenggara."
  },
  {
    niche: "Kekayaan",
    title: "Rahasia Investasi Saham Syariah untuk Pemula",
    target: "Muslim 25-50 tahun yang ingin investasi halal",
    problem: "Bingung cara investasi yang sesuai syariah, takut riba",
    solution: "Panduan lengkap investasi saham syariah dari screening hingga portfolio management",
    whyAttractive: "Indonesia pasar halal terbesar dunia. 87% penduduk Muslim. Aset keuangan syariah tumbuh 20% per tahun.",
    dataSupport: "Data OJK 2024: Investor syariah tumbuh 45% YoY. Nilai kapitalisasi saham syariah Rp4,500 triliun."
  },
  {
    niche: "Kesehatan",
    title: "Reverse Aging: Protokol Awet Muda Berbasis Sains untuk Usia 40+",
    target: "Pria/Wanita 40-60 tahun yang peduli kesehatan",
    problem: "Merasa tubuh menurun, mudah lelah, khawatir penyakit degeneratif",
    solution: "Protokol gaya hidup berbasis riset untuk memperlambat penuaan biologis",
    whyAttractive: "Pasar anti-aging global $67B. Indonesia aging population tercepat di ASEAN. Pencarian 'cara awet muda' naik 200%.",
    dataSupport: "WHO: Populasi 60+ Indonesia akan mencapai 25% pada 2050. Spending kesehatan naik 15% per tahun."
  },
  {
    niche: "Kesehatan",
    title: "Gut Health Revolution: Sembuhkan Pencernaan, Tingkatkan Imunitas",
    target: "Urban professional 25-45 tahun dengan masalah pencernaan",
    problem: "Sering maag, bloating, sembelit akibat pola makan tidak teratur",
    solution: "Program 30 hari restorasi kesehatan usus dengan diet dan suplemen tepat",
    whyAttractive: "70% sistem imun ada di usus. 65% pekerja kantoran alami gangguan pencernaan. Tren wellness food naik drastis.",
    dataSupport: "Riset Kemenkes: Penyakit pencernaan urutan ke-3 penyebab rawat jalan. Pasar probiotik Indonesia $180M."
  },
  {
    niche: "Kerohanian",
    title: "Mindful Muslim: Integrasi Dzikir & Meditasi untuk Ketenangan Jiwa",
    target: "Muslim urban 25-50 tahun yang mencari ketenangan batin",
    problem: "Stress, anxiety, merasa jauh dari spiritualitas di tengah kesibukan",
    solution: "Program praktis menggabungkan dzikir, meditasi Islami, dan mindfulness harian",
    whyAttractive: "Anxiety disorder naik 25% pasca pandemi. Pencarian 'cara menghilangkan cemas' naik 180%. Tren spiritual wellness global.",
    dataSupport: "WHO: 1 dari 4 orang akan mengalami masalah kesehatan mental. Pasar mindfulness app $2B globally."
  },
  {
    niche: "Kerohanian",
    title: "Parenting Qurani: Mendidik Anak Sholeh di Era Digital",
    target: "Orangtua Muslim dengan anak 3-15 tahun",
    problem: "Anak lebih dekat gadget daripada Al-Quran, khawatir pengaruh negatif",
    solution: "Framework parenting berbasis Al-Quran yang aplikatif untuk era modern",
    whyAttractive: "87% orangtua khawatir pengaruh digital pada anak. Demand konten parenting Islami sangat tinggi.",
    dataSupport: "Riset KPAI: Screen time anak Indonesia rata-rata 7 jam/hari. Pasar parenting book Indonesia Rp500M/tahun."
  },
  {
    niche: "Hobby",
    title: "Dari Hobi Jadi Cuan: Monetisasi Keahlian Craft & DIY",
    target: "Crafter/DIY enthusiast yang ingin menghasilkan uang",
    problem: "Punya skill craft tapi tidak tahu cara menjualnya",
    solution: "Blueprint lengkap dari produksi, branding, hingga penjualan online",
    whyAttractive: "Pasar handmade/craft Indonesia tumbuh 35% per tahun. Etsy-like marketplace lokal bermunculan.",
    dataSupport: "Shopee craft category GMV naik 200% 2023. UMKM craft berkontribusi 14% PDB."
  },
  {
    niche: "Hobby",
    title: "Urban Gardening Mastery: Berkebun di Lahan Terbatas",
    target: "Urban dweller yang ingin berkebun di apartemen/rumah kecil",
    problem: "Ingin berkebun tapi tidak punya lahan, bingung mulai dari mana",
    solution: "Panduan lengkap vertical garden, hidroponik, dan container gardening",
    whyAttractive: "Tren urban farming meledak pasca pandemi. Pencarian 'berkebun di rumah' naik 400%.",
    dataSupport: "FAO: Urban agriculture bisa penuhi 20% kebutuhan pangan kota. Market hidroponik Indonesia $50M."
  },
  {
    niche: "Profesional",
    title: "AI-Powered Career: Skill yang Dibutuhkan untuk Bertahan di Era AI",
    target: "Professional 25-45 tahun yang takut tergantikan AI",
    problem: "Khawatir pekerjaan akan diambil alih AI, tidak tahu skill apa yang harus dipelajari",
    solution: "Roadmap pengembangan skill yang AI-proof dan cara leverage AI untuk produktivitas",
    whyAttractive: "85% pekerja khawatir tentang AI. World Economic Forum: 85 juta pekerjaan akan tergantikan 2025.",
    dataSupport: "LinkedIn: Skill AI dan prompt engineering naik 1000% dalam job posting. Gaji AI specialist 2-3x rata-rata."
  },
  {
    niche: "Profesional",
    title: "Personal Branding Magnetic: Menjadi Top of Mind di Industri Anda",
    target: "Professional/entrepreneur yang ingin dikenal sebagai expert",
    problem: "Punya expertise tapi tidak dikenal, kalah bersaing dengan yang lebih vokal",
    solution: "Framework membangun personal brand di LinkedIn dan platform profesional",
    whyAttractive: "92% recruiter cek profil online kandidat. Personal brand kuat = gaji 20% lebih tinggi.",
    dataSupport: "LinkedIn Indonesia: User aktif 25 juta. Engagement rate creator Indonesia tertinggi di APAC."
  },
  {
    niche: "Keharmonisan Rumah Tangga",
    title: "Marriage 2.0: Upgrade Pernikahan untuk Pasangan Milenial",
    target: "Pasangan menikah 1-10 tahun yang ingin hubungan lebih baik",
    problem: "Komunikasi tidak efektif, konflik berulang, kehilangan chemistry",
    solution: "Framework komunikasi dan reconnection untuk pasangan modern",
    whyAttractive: "Angka perceraian Indonesia naik 53% dalam 5 tahun. 70% perceraian karena masalah komunikasi.",
    dataSupport: "Data Badilag 2024: 500rb+ kasus perceraian/tahun. Demand konseling pernikahan naik 150%."
  },
  {
    niche: "Keharmonisan Rumah Tangga",
    title: "Financial Intimacy: Kelola Keuangan Berdua Tanpa Konflik",
    target: "Pasangan menikah yang sering bertengkar soal uang",
    problem: "Konflik keuangan, berbeda gaya spending, tidak transparan",
    solution: "Sistem pengelolaan keuangan rumah tangga yang adil dan harmonis",
    whyAttractive: "Keuangan adalah penyebab konflik #1 dalam pernikahan. 70% pasangan tidak punya financial plan bersama.",
    dataSupport: "Riset VISA: 85% pasangan Indonesia pernah konflik keuangan. Literasi keuangan keluarga masih rendah."
  },
  {
    niche: "Keluarga",
    title: "Screen-Free Parenting: Membesarkan Anak Kreatif Tanpa Ketergantungan Gadget",
    target: "Orangtua dengan anak 3-12 tahun",
    problem: "Anak kecanduan gadget, tantrum kalau gadget diambil",
    solution: "Strategi gradual detox dan 100+ aktivitas pengganti yang engaging",
    whyAttractive: "95% orangtua khawatir screen time anak. WHO rekomendasikan max 1 jam/hari untuk anak.",
    dataSupport: "AAP study: Excessive screen time linked to developmental delays. Pasar toys edukatif naik 40%."
  },
  {
    niche: "Keluarga",
    title: "Multi-Generational Harmony: Rukun dengan Mertua dan Keluarga Besar",
    target: "Pasangan yang tinggal dengan/dekat keluarga besar",
    problem: "Konflik dengan mertua, beda pola asuh, boundary issues",
    solution: "Framework komunikasi dan boundary setting yang menghormati budaya",
    whyAttractive: "60% keluarga Indonesia tinggal extended family. Konflik mertua penyebab 20% perceraian.",
    dataSupport: "BPS: 35% rumah tangga Indonesia multi-generasi. Demand konten hubungan mertua sangat tinggi di sosmed."
  }
];

const NICHE_COLORS: Record<string, string> = {
  "Kekayaan": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Kesehatan": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Kerohanian": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Hobby": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Profesional": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Keharmonisan Rumah Tangga": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "Keluarga": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

interface ChatbotProps {
  onApplyBigIdea?: (template: BigIdeaTemplate) => void;
}

export function ChaesaChatbot({ onApplyBigIdea }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo! Saya Chaesa, asisten AI untuk Ebook Builder Pro. 

Saya bisa membantu Anda:
- Menjelaskan cara menggunakan fitur-fitur aplikasi ini
- Memberikan inspirasi Big Idea untuk ebook Anda
- Menjawab pertanyaan seputar pembuatan ebook

Silakan tanyakan apa saja, atau lihat tab "Template Big Idea" untuk inspirasi topik ebook yang potensial!`
    }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: userMessage,
        history: messages.slice(-10)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' 
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    chatMutation.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredTemplates = selectedNiche 
    ? BIG_IDEA_TEMPLATES.filter(t => t.niche === selectedNiche)
    : BIG_IDEA_TEMPLATES;

  const niches = [...new Set(BIG_IDEA_TEMPLATES.map(t => t.niche))];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground flex items-center justify-center hover-elevate active-elevate-2"
            data-testid="button-open-chaesa"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  C
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-semibold">Chaesa</span>
                <p className="text-xs text-muted-foreground font-normal">Asisten Ebook Builder</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="chat" data-testid="tab-chaesa-chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="templates" data-testid="tab-chaesa-templates">
                <Lightbulb className="h-4 w-4 mr-2" />
                Template Big Idea
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 mt-2">
              <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.role}-${idx}`}
                    >
                      {msg.role === 'assistant' && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                        data-testid={`text-message-${idx}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-2 justify-start">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={chatMutation.isPending}
                    data-testid="input-chaesa-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 mt-2">
              <div className="px-4 py-2 border-b">
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={selectedNiche === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedNiche(null)}
                    data-testid="badge-filter-all"
                  >
                    Semua
                  </Badge>
                  {niches.map((niche, idx) => (
                    <Badge
                      key={niche}
                      variant={selectedNiche === niche ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedNiche(niche)}
                      data-testid={`badge-filter-${idx}`}
                    >
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
              <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
                <div className="p-4 space-y-4">
                  {filteredTemplates.map((template, idx) => (
                    <Card key={idx} className="p-4 space-y-3" data-testid={`card-template-${idx}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge className={NICHE_COLORS[template.niche]} variant="secondary" data-testid={`badge-niche-${idx}`}>
                            {template.niche}
                          </Badge>
                          <h3 className="font-semibold mt-2 text-sm leading-tight" data-testid={`text-template-title-${idx}`}>{template.title}</h3>
                        </div>
                        {onApplyBigIdea && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onApplyBigIdea(template);
                              setIsOpen(false);
                            }}
                            data-testid={`button-apply-template-${idx}`}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Pakai
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">Target:</span> {template.target}</p>
                        <p><span className="font-medium text-foreground">Problem:</span> {template.problem}</p>
                        <p><span className="font-medium text-foreground">Solusi:</span> {template.solution}</p>
                        <div className="pt-2 border-t">
                          <p className="font-medium text-foreground flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" /> Mengapa Menarik:
                          </p>
                          <p className="mt-1">{template.whyAttractive}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="font-medium text-foreground">Data Pendukung:</p>
                          <p className="mt-1">{template.dataSupport}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
