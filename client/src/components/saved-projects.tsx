import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { FolderOpen, Trash2, Clock, FileText, Pencil, Check, X } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SavedProject {
  id: string;
  name: string;
  projectData: {
    topik: string;
    judul: string;
    level: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SavedProjectsProps {
  onLoad: (project: SavedProject) => void;
}

export function SavedProjects({ onLoad }: SavedProjectsProps) {
  const { toast } = useToast();
  const [editingProject, setEditingProject] = useState<SavedProject | null>(null);
  const [editName, setEditName] = useState('');

  const { data: projects, isLoading, error } = useQuery<SavedProject[]>({
    queryKey: ['/api/projects'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Proyek dihapus', description: 'Proyek berhasil dihapus dari daftar.' });
    },
    onError: () => {
      toast({ title: 'Gagal menghapus', description: 'Terjadi kesalahan saat menghapus proyek.', variant: 'destructive' });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiRequest('PUT', `/api/projects/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setEditingProject(null);
      toast({ title: 'Nama diperbarui', description: 'Nama proyek berhasil diubah.' });
    },
    onError: () => {
      toast({ title: 'Gagal mengubah nama', description: 'Terjadi kesalahan. Coba lagi.', variant: 'destructive' });
    },
  });

  const openEditDialog = (project: SavedProject) => {
    setEditingProject(project);
    setEditName(project.name);
  };

  const handleSaveRename = () => {
    if (!editingProject) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (trimmed === editingProject.name) {
      setEditingProject(null);
      return;
    }
    renameMutation.mutate({ id: editingProject.id, name: trimmed });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-primary" />
            Proyek Tersimpan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-primary" />
            Proyek Tersimpan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gagal memuat proyek tersimpan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-primary" />
            Proyek Tersimpan
            {projects && projects.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {projects.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada proyek tersimpan.</p>
              <p className="text-xs text-muted-foreground mt-1">Klik "Simpan Proyek" untuk menyimpan konfigurasi.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                      {project.projectData?.topik && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {project.projectData.topik.substring(0, 30)}
                          {project.projectData.topik.length > 30 ? '...' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Buka / Load */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Buka proyek"
                        onClick={() => onLoad(project)}
                        data-testid={`button-load-project-${project.id}`}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      {/* Edit nama */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ubah nama"
                        onClick={() => openEditDialog(project)}
                        data-testid={`button-edit-project-${project.id}`}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      {/* Hapus */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            title="Hapus proyek"
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Proyek?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Proyek "<strong>{project.name}</strong>" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(project.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit Nama Proyek */}
      <Dialog open={!!editingProject} onOpenChange={(open) => { if (!open) setEditingProject(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4 text-blue-500" />
              Ubah Nama Proyek
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nama Proyek</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Masukkan nama proyek..."
                className="text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setEditingProject(null);
                }}
                data-testid="input-edit-project-name"
              />
            </div>
            {editingProject && (
              <p className="text-xs text-muted-foreground">
                Topik: {editingProject.projectData?.topik || '—'}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingProject(null)}>
              <X className="h-3.5 w-3.5 mr-1" /> Batal
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveRename}
              disabled={renameMutation.isPending}
              data-testid="button-save-project-name"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {renameMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
