import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Book, Sparkles, User, Briefcase, Building2, ChevronRight } from 'lucide-react';

const INDUSTRIES = [
  { value: 'engineering', label: 'Keteknikan & Engineering' },
  { value: 'construction', label: 'Konstruksi & Infrastruktur' },
  { value: 'mining', label: 'Pertambangan & Mineral' },
  { value: 'oil_gas', label: 'Minyak & Gas (Migas)' },
  { value: 'electricity', label: 'Ketenagalistrikan & Energi' },
  { value: 'manufacturing', label: 'Manufaktur & Produksi' },
  { value: 'umkm', label: 'UMKM & Bisnis Kecil' },
  { value: 'wealth', label: 'Kekayaan & Kebebasan Finansial' },
  { value: 'family', label: 'Keluarga & Parenting' },
  { value: 'spirituality', label: 'Kerohanian & Spiritualitas' },
  { value: 'health', label: 'Kebugaran & Kesehatan' },
  { value: 'hobby', label: 'Hobi & Kreativitas' },
  { value: 'perijinan_usaha', label: 'Perijinan Usaha' },
  { value: 'tender', label: 'Tender & Pengadaan' },
  { value: 'sbu', label: 'Sertifikasi SBU' },
  { value: 'skk', label: 'Sertifikasi SKK' },
  { value: 'manajemen_proyek', label: 'Manajemen Proyek' },
  { value: 'erp', label: 'ERP & Sistem Informasi' },
  { value: 'bim', label: 'BIM & Desain Digital' },
  { value: 'pub', label: 'Pengembangan Usaha Berkelanjutan' },
  { value: 'pkb', label: 'Pengembangan Keprofesian (CPD)' },
  { value: 'iso', label: 'Sertifikasi ISO / Sistem Manajemen' },
  { value: 'kpk', label: 'Pancek KPK & Integritas' },
  { value: 'general', label: 'Umum / Lainnya' },
];

const PROFESSIONS = [
  'Konsultan / Advisor',
  'Engineer / Teknisi',
  'Manajer / Supervisor',
  'Direktur / Eksekutif',
  'Pengusaha / Founder',
  'Content Creator',
  'Trainer / Coach',
  'Akademisi / Peneliti',
  'ASN / Pegawai Pemerintah',
  'Pelajar / Mahasiswa',
  'Freelancer',
  'Lainnya',
];

export default function Register() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(
    user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : ''
  );
  const [profession, setProfession] = useState('');
  const [organization, setOrganization] = useState('');
  const [primaryIndustry, setPrimaryIndustry] = useState('');

  const registerMutation = useMutation({
    mutationFn: (data: { displayName: string; profession: string; organization?: string; primaryIndustry?: string }) =>
      apiRequest('POST', '/api/auth/complete-registration', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: 'Selamat datang!', description: 'Profil Anda berhasil didaftarkan.' });
      setLocation('/');
    },
    onError: (err: any) => {
      toast({ title: 'Gagal', description: err?.message ?? 'Terjadi kesalahan.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast({ title: 'Nama diperlukan', description: 'Masukkan nama lengkap minimal 2 karakter.', variant: 'destructive' });
      return;
    }
    if (!profession) {
      toast({ title: 'Profesi diperlukan', description: 'Pilih profesi Anda.', variant: 'destructive' });
      return;
    }
    registerMutation.mutate({
      displayName: displayName.trim(),
      profession,
      organization: organization.trim() || undefined,
      primaryIndustry: primaryIndustry || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Book className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Chaesa AI Studio</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Lengkapi Profil Anda</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Satu langkah lagi untuk mulai membangun ekosistem kompetensi digital Anda bersama Chaesa AI Studio.
            </p>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Formulir Registrasi</CardTitle>
              <CardDescription>
                Informasi ini membantu kami menyesuaikan pengalaman terbaik untuk Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    data-testid="input-displayname"
                    placeholder="Contoh: Budi Santoso"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Profesi / Jabatan <span className="text-destructive">*</span>
                  </Label>
                  <Select value={profession} onValueChange={setProfession}>
                    <SelectTrigger data-testid="select-profession">
                      <SelectValue placeholder="Pilih profesi Anda..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization" className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Perusahaan / Organisasi
                    <span className="text-muted-foreground text-xs ml-1">(opsional)</span>
                  </Label>
                  <Input
                    id="organization"
                    data-testid="input-organization"
                    placeholder="Contoh: PT Maju Bersama"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Industri Utama
                    <span className="text-muted-foreground text-xs ml-1">(opsional)</span>
                  </Label>
                  <Select value={primaryIndustry} onValueChange={setPrimaryIndustry}>
                    <SelectTrigger data-testid="select-industry">
                      <SelectValue placeholder="Pilih industri utama..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    'Menyimpan...'
                  ) : (
                    <span className="flex items-center gap-2">
                      Mulai Sekarang <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Login sebagai <span className="font-medium">{user?.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
