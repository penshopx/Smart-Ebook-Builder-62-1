import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, ShieldCheck, ShieldAlert, Users, ArrowLeft, Search, Crown,
  UserCog, BarChart3, RefreshCw, ChevronDown, Key, Loader2, Eye,
  ListFilter, Clock, CheckCircle2, XCircle, Plus, Trash2, Mail, ShieldBan,
} from "lucide-react";
import type { User, EmailWhitelistEntry } from "@shared/models/auth";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:       { label: "Free",       color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  pro:        { label: "Pro",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  premium:    { label: "Premium",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  advance:    { label: "Advance",    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" },
  enterprise: { label: "Enterprise", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

const ROLE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  user:        { label: "User",        color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",       icon: Users },
  sub_admin:   { label: "Sub Admin",   color: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",           icon: ShieldCheck },
  admin:       { label: "Admin",       color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",           icon: Crown },
  super_admin: { label: "Super Admin", color: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300", icon: Crown },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_LABELS[role] ?? ROLE_LABELS.user;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: number | string; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [secretKey, setSecretKey] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [changePlanDialog, setChangePlanDialog] = useState<{ open: boolean; targetUser: User | null; newPlan: string }>({ open: false, targetUser: null, newPlan: "" });
  const [changeRoleDialog, setChangeRoleDialog] = useState<{ open: boolean; targetUser: User | null; newRole: string }>({ open: false, targetUser: null, newRole: "" });
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistNote, setWhitelistNote] = useState("");
  const [whitelistGrantAdmin, setWhitelistGrantAdmin] = useState(false);

  const { data: adminMe } = useQuery<{ role: string; isSuperAdmin: boolean; isAdmin: boolean; isSubAdmin: boolean }>({
    queryKey: ["/api/admin/me"],
  });

  const { data: stats } = useQuery<{ total: number; byPlan: Record<string, number>; byRole: Record<string, number> }>({
    queryKey: ["/api/admin/stats"],
    enabled: adminMe?.isAdmin || adminMe?.isSubAdmin,
  });

  const { data: userList = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users", search, planFilter, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: adminMe?.isAdmin || adminMe?.isSubAdmin,
  });

  const claimAdminMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/claim", { secretKey });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Berhasil!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSecretKey("");
    },
    onError: async (err: any) => {
      const msg = err?.message ?? "Gagal mengklaim admin.";
      let desc = msg;
      if (msg.includes("403")) desc = "Kunci rahasia tidak valid. Pastikan kunci benar dan coba lagi.";
      else if (msg.includes("401")) desc = "Sesi login habis. Silakan logout lalu login ulang, kemudian coba klaim admin kembali.";
      toast({ title: "Gagal", description: desc, variant: "destructive" });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/plan`, { plan });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plan diperbarui!", description: "Plan pengguna berhasil diubah." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setChangePlanDialog({ open: false, targetUser: null, newPlan: "" });
    },
    onError: () => toast({ title: "Gagal", description: "Gagal mengubah plan pengguna.", variant: "destructive" }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Role diperbarui!", description: "Role pengguna berhasil diubah." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setChangeRoleDialog({ open: false, targetUser: null, newRole: "" });
    },
    onError: () => toast({ title: "Gagal", description: "Gagal mengubah role pengguna.", variant: "destructive" }),
  });

  // Admin Role Requests (only super_admin can see + process)
  const { data: adminRequests = [], refetch: refetchAdminRequests } = useQuery<User[]>({
    queryKey: ["/api/super-admin/admin-requests"],
    enabled: adminMe?.isSuperAdmin,
  });

  const processAdminRequestMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const res = await apiRequest("PATCH", `/api/super-admin/admin-requests/${userId}`, { approve });
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.approve ? "Permohonan Disetujui!" : "Permohonan Ditolak", description: vars.approve ? "Pengguna kini memiliki hak Admin." : "Permohonan admin ditolak." });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => toast({ title: "Gagal", description: "Gagal memproses permohonan admin.", variant: "destructive" }),
  });

  // Email Whitelist
  const { data: whitelist = [], refetch: refetchWhitelist } = useQuery<EmailWhitelistEntry[]>({
    queryKey: ["/api/admin/whitelist"],
    enabled: adminMe?.isAdmin,
  });

  const addWhitelistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/whitelist", {
        email: whitelistEmail,
        note: whitelistNote || undefined,
        grantRole: whitelistGrantAdmin ? 'admin' : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      const roleLabel = whitelistGrantAdmin ? " sebagai Admin Utama" : "";
      toast({ title: "Berhasil!", description: `Email ${whitelistEmail} ditambahkan ke whitelist${roleLabel}.` });
      setWhitelistEmail(""); setWhitelistNote(""); setWhitelistGrantAdmin(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whitelist"] });
    },
    onError: () => toast({ title: "Gagal", description: "Gagal menambahkan email ke whitelist.", variant: "destructive" }),
  });

  const removeWhitelistMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("DELETE", `/api/admin/whitelist/${encodeURIComponent(email)}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dihapus", description: "Email dihapus dari whitelist." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whitelist"] });
    },
    onError: () => toast({ title: "Gagal", description: "Gagal menghapus email.", variant: "destructive" }),
  });

  const isAdminOrSub = adminMe?.isAdmin || adminMe?.isSubAdmin;
  const displayName = user?.firstName ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : (user?.email ?? "Pengguna");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="btn-back-home">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel — Chaesa AI Studio
            </h1>
            <p className="text-sm text-muted-foreground">Manajemen pengguna dan akses sistem</p>
          </div>
          {adminMe && <RoleBadge role={adminMe.role} />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── KLAIM ADMIN UTAMA ── */}
        {!isAdminOrSub && (
          <Card className="border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Crown className="h-5 w-5" /> Registrasi Admin Utama
              </CardTitle>
              <CardDescription>
                Masukkan kunci rahasia untuk mengklaim akses Admin Utama. Kunci ini hanya diketahui oleh pemilik sistem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 max-w-md">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Masukkan kunci rahasia Admin..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="pl-9"
                    data-testid="input-admin-secret"
                    onKeyDown={(e) => e.key === "Enter" && secretKey && claimAdminMutation.mutate()}
                  />
                </div>
                <Button
                  onClick={() => claimAdminMutation.mutate()}
                  disabled={!secretKey || claimAdminMutation.isPending}
                  className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  data-testid="btn-claim-admin"
                >
                  {claimAdminMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Klaim Admin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Login sebagai: <span className="font-medium">{displayName}</span> ({user?.email})
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── DASHBOARD ADMIN ── */}
        {isAdminOrSub && (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Pengguna" value={stats.total} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" />
                <StatCard title="Admin Utama" value={stats.byRole?.admin ?? 0} icon={Crown} color="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" />
                <StatCard title="Sub Admin" value={stats.byRole?.sub_admin ?? 0} icon={ShieldCheck} color="bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400" />
                <StatCard title="Pengguna Pro+" value={(stats.byPlan?.pro ?? 0) + (stats.byPlan?.premium ?? 0) + (stats.byPlan?.advance ?? 0) + (stats.byPlan?.enterprise ?? 0)} sub="Pro, Premium, Advance, Enterprise" icon={BarChart3} color="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" />
              </div>
            )}

            {/* Plan Distribution */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Distribusi Paket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(PLAN_LABELS).map(([planKey, cfg]) => (
                      <div key={planKey} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.color.includes("gray") ? "bg-gray-400" : cfg.color.includes("blue") ? "bg-blue-500" : cfg.color.includes("purple") ? "bg-purple-500" : cfg.color.includes("indigo") ? "bg-indigo-500" : "bg-amber-500"}`} />
                        <span className="text-sm font-medium">{cfg.label}</span>
                        <span className="text-sm text-muted-foreground font-bold">{stats.byPlan?.[planKey] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" /> Manajemen Pengguna
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {adminMe?.isAdmin
                        ? "Sebagai Admin Utama, Anda dapat mengubah plan dan role pengguna."
                        : "Sebagai Sub Admin, Anda dapat mengubah plan pengguna."}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchUsers()} data-testid="btn-refresh-users">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama / email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-40" data-testid="select-filter-plan">
                      <SelectValue placeholder="Semua Paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Paket</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40" data-testid="select-filter-role">
                      <SelectValue placeholder="Semua Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="sub_admin">Sub Admin</SelectItem>
                      <SelectItem value="admin">Admin Utama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Prompt Hari Ini</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Memuat data...
                          </TableCell>
                        </TableRow>
                      ) : userList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            Tidak ada pengguna ditemukan.
                          </TableCell>
                        </TableRow>
                      ) : userList.map((u) => {
                        const isCurrentUser = u.id === user?.id;
                        const isTargetAdmin = u.role === "admin" || u.role === "super_admin";
                        return (
                          <TableRow key={u.id} className={isCurrentUser ? "bg-primary/5" : ""} data-testid={`row-user-${u.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {u.profileImageUrl ? (
                                  <img src={u.profileImageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                    {(u.firstName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">
                                    {u.firstName}{u.lastName ? " " + u.lastName : ""}
                                    {isCurrentUser && <span className="ml-1 text-xs text-primary font-normal">(Saya)</span>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{u.email ?? u.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><RoleBadge role={u.role ?? "user"} /></TableCell>
                            <TableCell><PlanBadge plan={u.plan} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{u.promptsUsedToday ?? 0}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Ubah Plan (Admin & Sub Admin) */}
                                {!isTargetAdmin || adminMe?.isAdmin ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs h-7"
                                    onClick={() => setChangePlanDialog({ open: true, targetUser: u, newPlan: u.plan })}
                                    disabled={isTargetAdmin && !adminMe?.isAdmin}
                                    data-testid={`btn-change-plan-${u.id}`}
                                  >
                                    <ChevronDown className="h-3 w-3" /> Paket
                                  </Button>
                                ) : null}
                                {/* Ubah Role (hanya Admin Utama) */}
                                {adminMe?.isAdmin && !isCurrentUser && !isTargetAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs h-7"
                                    onClick={() => setChangeRoleDialog({ open: true, targetUser: u, newRole: u.role ?? "user" })}
                                    data-testid={`btn-change-role-${u.id}`}
                                  >
                                    <Shield className="h-3 w-3" /> Role
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground text-right">{userList.length} pengguna ditemukan</p>
              </CardContent>
            </Card>

            {/* ── PERMOHONAN MENJADI ADMIN — Super Admin only ── */}
            {adminMe?.isSuperAdmin && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <ShieldCheck className="h-5 w-5" />
                        Permohonan Hak Admin
                        {adminRequests.length > 0 && (
                          <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{adminRequests.length}</span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Pengguna yang mengajukan permohonan menjadi Admin. Hanya Super Admin yang bisa menyetujui.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchAdminRequests()} className="gap-2" data-testid="btn-refresh-admin-requests">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {adminRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400 opacity-50" />
                      <p className="text-sm">Belum ada permohonan Admin yang masuk.</p>
                      <p className="text-xs mt-1">Pengguna dapat mengajukan permohonan dari halaman akun mereka.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminRequests.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{u.displayName || u.email}</p>
                              <p className="text-xs text-muted-foreground">{u.email} · {u.profession || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => processAdminRequestMutation.mutate({ userId: u.id, approve: true })}
                              disabled={processAdminRequestMutation.isPending}
                              data-testid={`btn-approve-admin-${u.id}`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                              onClick={() => processAdminRequestMutation.mutate({ userId: u.id, approve: false })}
                              disabled={processAdminRequestMutation.isPending}
                              data-testid={`btn-reject-admin-${u.id}`}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Tolak
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── EMAIL WHITELIST — Admin only ── */}
            {adminMe?.isAdmin && (
              <Card className="border-violet-200 dark:border-violet-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                    <ListFilter className="h-5 w-5" />
                    Whitelist Email
                  </CardTitle>
                  <CardDescription>
                    Email yang di-whitelist akan langsung disetujui otomatis tanpa menunggu persetujuan manual. Cocok untuk kolega dan rekan yang sudah dipercaya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add to whitelist */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="email@contoh.com"
                          value={whitelistEmail}
                          onChange={(e) => setWhitelistEmail(e.target.value)}
                          className="pl-9"
                          data-testid="input-whitelist-email"
                          onKeyDown={(e) => e.key === 'Enter' && whitelistEmail && addWhitelistMutation.mutate()}
                        />
                      </div>
                      <Input
                        placeholder="Catatan (opsional)"
                        value={whitelistNote}
                        onChange={(e) => setWhitelistNote(e.target.value)}
                        className="sm:w-48"
                        data-testid="input-whitelist-note"
                      />
                      <Button
                        className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                        onClick={() => addWhitelistMutation.mutate()}
                        disabled={!whitelistEmail || addWhitelistMutation.isPending}
                        data-testid="btn-add-whitelist"
                      >
                        {addWhitelistMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Tambahkan
                      </Button>
                    </div>
                    {/* Grant Admin toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit" data-testid="toggle-grant-admin">
                      <div
                        className={`relative w-9 h-5 rounded-full transition-colors ${whitelistGrantAdmin ? 'bg-red-500' : 'bg-muted-foreground/30'}`}
                        onClick={() => setWhitelistGrantAdmin(!whitelistGrantAdmin)}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${whitelistGrantAdmin ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Jadikan <strong className={whitelistGrantAdmin ? 'text-red-600 dark:text-red-400' : ''}>Admin Utama</strong> saat pertama login
                      </span>
                    </label>
                  </div>

                  {/* Whitelist table */}
                  {whitelist.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                      <ListFilter className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada email dalam whitelist.</p>
                      <p className="text-xs mt-1">Tambahkan email yang boleh langsung mengakses sistem.</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead>Ditambahkan</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {whitelist.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium text-sm">{entry.email}</TableCell>
                              <TableCell>
                                {(entry as any).grantRole === 'admin' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <Crown className="h-3 w-3" /> Admin Utama
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Pengguna</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{entry.note || '-'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('id-ID') : '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  onClick={() => removeWhitelistMutation.mutate(entry.email)}
                                  disabled={removeWhitelistMutation.isPending}
                                  data-testid={`btn-remove-whitelist-${entry.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Perbedaan Kewenangan */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Kewenangan Akses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-400">
                      <Crown className="h-4 w-4" /> Super Admin
                    </div>
                    <ul className="space-y-1 text-muted-foreground pl-6 list-disc">
                      <li>Melihat semua pengguna</li>
                      <li>Mengubah paket & role pengguna</li>
                      <li>Menyetujui permohonan menjadi Admin</li>
                      <li>Mengelola whitelist email</li>
                      <li>Melihat statistik sistem</li>
                      <li>Kewenangan penuh sistem</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
                      <Crown className="h-4 w-4" /> Admin
                    </div>
                    <ul className="space-y-1 text-muted-foreground pl-6 list-disc">
                      <li>Melihat semua pengguna</li>
                      <li>Mengubah paket langganan</li>
                      <li>Memberikan / mencabut Sub Admin</li>
                      <li>Melihat statistik sistem</li>
                      <li className="line-through opacity-50">Tidak dapat setujui permohonan Admin</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sky-600 dark:text-sky-400">
                      <ShieldCheck className="h-4 w-4" /> Sub Admin
                    </div>
                    <ul className="space-y-1 text-muted-foreground pl-6 list-disc">
                      <li>Melihat semua pengguna</li>
                      <li>Mengubah paket langganan</li>
                      <li>Melihat statistik sistem</li>
                      <li className="line-through opacity-50">Tidak dapat mengubah role</li>
                      <li className="line-through opacity-50">Tidak dapat setujui permohonan Admin</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Blocked state */}
        {!isAdminOrSub && adminMe && (
          <Card className="text-center py-10">
            <CardContent>
              <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Akun ini belum memiliki akses admin.</p>
              <p className="text-sm text-muted-foreground mt-1">Gunakan form di atas untuk klaim Admin Utama, atau minta Admin Utama untuk memberikan akses Sub Admin.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Ubah Plan */}
      <Dialog open={changePlanDialog.open} onOpenChange={(v) => !v && setChangePlanDialog({ open: false, targetUser: null, newPlan: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Paket Langganan</DialogTitle>
            <DialogDescription>
              Mengubah paket untuk: <span className="font-semibold">{changePlanDialog.targetUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Paket saat ini: <PlanBadge plan={changePlanDialog.targetUser?.plan ?? "free"} /></p>
            <Select value={changePlanDialog.newPlan} onValueChange={(v) => setChangePlanDialog((prev) => ({ ...prev, newPlan: v }))}>
              <SelectTrigger data-testid="select-new-plan">
                <SelectValue placeholder="Pilih paket baru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog({ open: false, targetUser: null, newPlan: "" })}>Batal</Button>
            <Button
              disabled={!changePlanDialog.newPlan || changePlanMutation.isPending}
              onClick={() => changePlanDialog.targetUser && changePlanMutation.mutate({ userId: changePlanDialog.targetUser.id, plan: changePlanDialog.newPlan })}
              data-testid="btn-confirm-plan"
            >
              {changePlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ubah Role */}
      <Dialog open={changeRoleDialog.open} onOpenChange={(v) => !v && setChangeRoleDialog({ open: false, targetUser: null, newRole: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
            <DialogDescription>
              Mengubah role untuk: <span className="font-semibold">{changeRoleDialog.targetUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Role saat ini: <RoleBadge role={changeRoleDialog.targetUser?.role ?? "user"} /></p>
            <Select value={changeRoleDialog.newRole} onValueChange={(v) => setChangeRoleDialog((prev) => ({ ...prev, newRole: v }))}>
              <SelectTrigger data-testid="select-new-role">
                <SelectValue placeholder="Pilih role baru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User (Pengguna Biasa)</SelectItem>
                <SelectItem value="sub_admin">Sub Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-2">
              ⚠️ Sub Admin dapat melihat semua pengguna dan mengubah paket, tetapi tidak dapat mengubah role pengguna lain.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialog({ open: false, targetUser: null, newRole: "" })}>Batal</Button>
            <Button
              disabled={!changeRoleDialog.newRole || changeRoleMutation.isPending}
              onClick={() => changeRoleDialog.targetUser && changeRoleMutation.mutate({ userId: changeRoleDialog.targetUser.id, role: changeRoleDialog.newRole })}
              data-testid="btn-confirm-role"
            >
              {changeRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
