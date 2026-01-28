import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChaesaChatbot } from '@/components/chaesa-chatbot';
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
  Shield
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-screen-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground">
              <Book className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Ebook Builder Pro</h1>
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
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="container px-4 mx-auto max-w-screen-xl relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered Prompt Generator
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Buat Ekosistem Ebook
                <span className="text-primary"> Profesional</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Generator prompt AI lengkap untuk membuat ebook, video script, e-course, dan materi marketing. 
                Dari ide hingga monetisasi dalam satu platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-8" data-testid="button-cta-main">
                  <a href="/api/login">
                    Mulai Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Lihat Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Gratis untuk memulai. Tidak perlu kartu kredit.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">11 Mode Generasi Prompt</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Dari brainstorming ide hingga materi marketing, semua yang Anda butuhkan untuk membangun ekosistem ebook profesional.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Lightbulb, title: 'Brainstorm Ide', desc: 'Eksplorasi ide-ide kreatif untuk ebook Anda' },
                { icon: Sparkles, title: 'Big Idea', desc: 'Pertajam positioning dan konsep unik' },
                { icon: FileText, title: 'Outline', desc: 'Susun kerangka dan daftar isi lengkap' },
                { icon: FileText, title: 'Draft Bab', desc: 'Tulis konten bab per bab dengan mudah' },
                { icon: Video, title: 'Video Script', desc: 'Buat script video dan podcast' },
                { icon: GraduationCap, title: 'E-Course Builder', desc: 'Ubah ebook jadi kurikulum kursus' },
                { icon: FileText, title: 'Document Generator', desc: 'Buat SOP, Policy, dan dokumen lainnya' },
                { icon: Zap, title: 'Prompt Pack', desc: 'Generate rangkaian prompt workflow' },
                { icon: Megaphone, title: 'Marketing Kit', desc: 'Buat materi marketing dan promosi' },
              ].map((feature, index) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader className="pb-2">
                    <feature.icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Pilih Paket Anda</h2>
              <p className="text-muted-foreground">
                Mulai gratis, upgrade kapan saja sesuai kebutuhan.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                    {['5 prompt per hari', '3 mode generasi', 'Simpan 1 proyek', 'Export teks'].map((feature) => (
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

              <Card className="relative border-primary shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Paling Populer</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Untuk content creator serius</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Rp 99K</span>
                    <span className="text-muted-foreground">/bulan</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Unlimited prompt',
                      'Semua 11 mode generasi',
                      'Unlimited proyek',
                      'Export semua format',
                      'AI Character modes',
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
                  <Button className="w-full" asChild data-testid="button-subscribe-pro">
                    <a href="/api/login">Pilih Pro</a>
                  </Button>
                </CardFooter>
              </Card>

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
          </div>
        </section>

        <section className="py-20 border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-screen-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cepat & Efisien</h3>
                <p className="text-muted-foreground">
                  Generate prompt berkualitas dalam hitungan detik, bukan jam.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Untuk Semua Level</h3>
                <p className="text-muted-foreground">
                  Baik pemula atau profesional, tool ini mudah digunakan.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aman & Terpercaya</h3>
                <p className="text-muted-foreground">
                  Data Anda aman dengan enkripsi dan login yang terjamin.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t">
          <div className="container px-4 mx-auto max-w-screen-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Siap Membangun Ekosistem Ebook Anda?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Bergabung dengan ribuan content creator yang sudah menggunakan Ebook Builder Pro.
            </p>
            <Button size="lg" asChild className="text-lg px-8" data-testid="button-cta-bottom">
              <a href="/api/login">
                Mulai Sekarang - Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container px-4 mx-auto max-w-screen-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-semibold">Ebook Builder Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Ebook Builder Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <ChaesaChatbot />
    </div>
  );
}
