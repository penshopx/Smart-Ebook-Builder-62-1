import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Clock, Mail, ShieldX, LogOut, RefreshCw } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useState } from 'react';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    setTimeout(() => setRefreshing(false), 1500);
  };

  const isRejected = user?.accountStatus === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${
            isRejected
              ? 'bg-red-100 dark:bg-red-950/40'
              : 'bg-amber-100 dark:bg-amber-950/40'
          }`}>
            {isRejected
              ? <ShieldX className="h-10 w-10 text-red-500" />
              : <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
            }
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isRejected ? 'Akses Ditolak' : 'Menunggu Persetujuan'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isRejected
              ? 'Permintaan akses Anda ke Chaesa AI Studio telah ditolak oleh admin. Hubungi admin untuk informasi lebih lanjut.'
              : 'Akun Anda sedang menunggu persetujuan dari admin Chaesa AI Studio. Anda akan mendapat akses penuh setelah disetujui.'
            }
          </p>
        </div>

        {/* Info card */}
        <div className={`rounded-xl border p-4 mb-6 ${
          isRejected
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-start gap-3">
            <Mail className={`h-4 w-4 mt-0.5 shrink-0 ${isRejected ? 'text-red-500' : 'text-amber-600'}`} />
            <div>
              <p className="text-xs font-medium mb-0.5">Email terdaftar:</p>
              <p className="text-sm font-semibold">{user?.email}</p>
              {!isRejected && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Admin akan memverifikasi email Anda dan memberikan akses dalam waktu singkat.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* What they can expect */}
        {!isRejected && (
          <div className="rounded-xl border bg-card p-4 mb-6 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Setelah disetujui, Anda bisa:</p>
            {[
              'Mengisi profil dan melengkapi registrasi',
              'Membuat ebook dengan 16 mode AI',
              'Mengakses asisten topik Chaesa Prime',
              'Menyimpan dan mengelola proyek ebook',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!isRejected && (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              data-testid="button-check-approval"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memeriksa status...' : 'Cek Status Persetujuan'}
            </Button>
          )}
          <Button
            className="w-full"
            variant={isRejected ? 'default' : 'ghost'}
            onClick={() => logout()}
            data-testid="button-logout-pending"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Chaesa AI Studio · Sistem akses terkontrol
        </p>
      </div>
    </div>
  );
}
