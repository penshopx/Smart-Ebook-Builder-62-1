import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ModeSelector } from '@/components/mode-selector';
import { ProjectForm } from '@/components/project-form';
import { TaskConfigPanel } from '@/components/task-config-panel';
import { FileUpload } from '@/components/file-upload';
import { PromptOutput } from '@/components/prompt-output';
import { SavedProjects } from '@/components/saved-projects';
import { ThemeToggle } from '@/components/theme-toggle';
import { DokumenterChatButton } from '@/components/dokumentender-chat-button';
import { ChaesaChatbot } from '@/components/chaesa-chatbot';
import { BookPreview } from '@/components/book-preview';
import { EcosystemTracker } from '@/components/ecosystem-tracker';
import { generatePrompt } from '@/lib/prompt-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Book, Sparkles, Save, RotateCcw, FolderOpen, LogOut, Factory, Crown, Zap, User, Settings, ChevronDown } from 'lucide-react';
import { TopicSuggester } from '@/components/topic-suggester';
import { JudulTerlaris } from '@/components/judul-terlaris';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { ProjectData, TaskConfig, ExtendConfig, UploadedFile } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const defaultProjectData: ProjectData = {
  topik: '',
  judul: '',
  target: '',
  language: 'Bahasa Indonesia',
  outputFormat: 'eBook',
  tone: 'Authoritative',
  writingStyle: 'Instructive',
  aiCharacter: 'Agentic Strategist (Attentive & Proactive)',
  tujuan: '',
  painPoint: '',
  bigIdea: '',
  hasilRiset: '',
  produk: '',
  level: '1 Ebook',
  industry: 'general',
  selectedAiModel: 'dokumentender',
  ebookStyles: {},
};

const defaultTaskConfig: TaskConfig = {
  selectedEbookId: 1,
  selectedEbookLabel: '',
  judulBab: '',
  manualJudulBab: '',
  tujuanBab: '',
  fokusLevel: 'Basic',
  jenisTemplate: 'SOP',
  topikModul: '',
  durasiScript: '5-10 menit',
  judulScript: '',
  botName: '',
  botRole: 'Mentor Pribadi',
  botPersonality: 'Ramah, Suportif, dan Berbasis Data',
  docType: 'Standard Operating Procedure (SOP)',
  docContext: '',
  packType: 'The Ebook Author Kit (Ide -> Outline -> Bab -> Editing)',
  courseDuration: '4 Minggu',
  courseFormat: 'Video + Worksheet',
  courseGoal: '',
  marketingAsset: 'Landing Page Copy (Long Form)',
  marketingAngle: '',
  appType: 'web',
  appComplexity: 'simple',
  quizFocus: 'komprehensif',
  jumlahIde: '5',
  brainstormAngle: 'Problem-Solution',
  bigIdeaAngle: 'Unik & Berbeda',
  jumlahBab: '7',
  outlineDepth: 'Standard',
  podcastHost: 'Andi',
  podcastGuest: 'Sari',
  podcastStyle: 'interview',
  podcastEpisodeLength: '15-20 menit',
  podcastSegments: '5',
  audiobookNarrator: '',
  audiobookTone: 'conversational',
  audiobookPace: 'medium',
  audiobookChapterFocus: 'full',
  audiobookEmphasis: 'moderate',
  landingPageStyle: 'long-form',
  landingPageGoal: 'sell',
  landingPagePrice: '',
  landingPageBonuses: '',
  landingPageCTA: 'Beli Sekarang',
  landingPageOutputFormat: 'copy',
};

const defaultExtendConfig: ExtendConfig = {
  teksAwal: '',
  targetPanjang: '300-500 kata',
};

const PLAN_BADGE_STYLE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

function UserProfileDropdown({ user }: { user: any }) {
  const { logout } = useAuth();
  const { data: planData } = useQuery<{ plan: string; promptsUsedToday: number; dailyLimit: number | null }>({
    queryKey: ['/api/user/plan'],
    staleTime: 1000 * 60 * 2,
  });

  const plan = planData?.plan ?? user?.plan ?? 'free';
  const promptsUsed = planData?.promptsUsedToday ?? 0;
  const dailyLimit = planData?.dailyLimit;
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Pengguna';

  const PlanIcon = plan === 'enterprise' ? Crown : plan === 'pro' ? Zap : Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-full hover:bg-muted px-1.5 py-1 transition-colors"
          data-testid="button-profile-dropdown"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Badge className={`hidden sm:flex text-[10px] px-1.5 py-0 h-4 gap-0.5 border-0 ${PLAN_BADGE_STYLE[plan]}`}>
            <PlanIcon className="h-2.5 w-2.5" />
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Badge className={`text-[10px] gap-1 border-0 ${PLAN_BADGE_STYLE[plan]}`}>
              <PlanIcon className="h-2.5 w-2.5" />
              Paket {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Badge>
            {dailyLimit && (
              <span className="text-xs text-muted-foreground">{promptsUsed}/{dailyLimit} prompt hari ini</span>
            )}
            {!dailyLimit && (
              <span className="text-xs text-green-600 dark:text-green-400">Unlimited</span>
            )}
          </div>
          {dailyLimit && (
            <Progress
              value={Math.min((promptsUsed / dailyLimit) * 100, 100)}
              className="h-1 mt-1.5"
            />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2 cursor-pointer" data-testid="menu-account">
            <Settings className="h-4 w-4" />
            Akun & Langganan
          </Link>
        </DropdownMenuItem>
        {plan === 'free' && (
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center gap-2 cursor-pointer text-primary" data-testid="menu-upgrade">
              <Zap className="h-4 w-4" />
              Upgrade ke Pro
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => logout()}
          data-testid="menu-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Home() {
  const [projectData, setProjectData] = useState<ProjectData>(defaultProjectData);
  const [taskConfig, setTaskConfig] = useState<TaskConfig>(defaultTaskConfig);
  const [extendConfig, setExtendConfig] = useState<ExtendConfig>(defaultExtendConfig);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeMode, setActiveMode] = useState('BRAINSTORM');
  const [refreshKey, setRefreshKey] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: planData } = useQuery<{ plan: string; allowedModes: string[] | 'all' }>({
    queryKey: ['/api/user/plan'],
    staleTime: 1000 * 60 * 5,
  });
  const allowedModes: string[] | 'all' = planData?.allowedModes ?? 'all';

  const handleProjectChange = (name: string, value: string) => {
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskConfigChange = (name: string, value: string | number) => {
    setTaskConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleExtendConfigChange = (name: string, value: string) => {
    setExtendConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleEbookStyleChange = (ebookId: number, style: Partial<import('@shared/schema').EbookStyle>) => {
    setProjectData(prev => {
      const globalStyle = { tone: prev.tone, writingStyle: prev.writingStyle, aiCharacter: prev.aiCharacter };
      const merged = { ...globalStyle, ...(prev.ebookStyles?.[ebookId.toString()] || {}), ...style };
      const isIdenticalToGlobal =
        merged.tone === globalStyle.tone &&
        merged.writingStyle === globalStyle.writingStyle &&
        merged.aiCharacter === globalStyle.aiCharacter;
      const newStyles = { ...(prev.ebookStyles || {}) };
      if (isIdenticalToGlobal) {
        delete newStyles[ebookId.toString()];
      } else {
        newStyles[ebookId.toString()] = merged;
      }
      return { ...prev, ebookStyles: newStyles };
    });
  };

  const handleReset = () => {
    setProjectData(defaultProjectData);
    setTaskConfig(defaultTaskConfig);
    setExtendConfig(defaultExtendConfig);
    setUploadedFiles([]);
    setActiveMode('BRAINSTORM');
    setProjectName('');
  };

  const handleTopicUpdate = (topik: string, judul?: string) => {
    setProjectData(prev => ({
      ...prev,
      topik,
      judul: judul || topik,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: projectName || projectData.judul || projectData.topik || 'Proyek Tanpa Judul',
        projectData,
        taskConfig,
      };
      return await apiRequest('POST', '/api/projects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Proyek tersimpan!",
        description: "Konfigurasi proyek berhasil disimpan.",
      });
      setSaveDialogOpen(false);
      setProjectName('');
    },
    onError: (error: any) => {
      const is401 = error?.message?.startsWith('401');
      const is403 = error?.message?.startsWith('403');
      toast({
        title: "Gagal menyimpan",
        description: is401
          ? "Sesi login kadaluarsa. Silakan refresh halaman dan login ulang."
          : is403
          ? "Batas proyek tercapai pada paket ini. Upgrade ke Pro untuk menyimpan lebih banyak proyek."
          : "Terjadi kesalahan saat menyimpan proyek. Coba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleLoadProject = (project: any) => {
    setProjectData(project.projectData);
    setTaskConfig(project.taskConfig);
    setProjectName(project.name);
    toast({
      title: "Proyek dimuat",
      description: `"${project.name}" berhasil dimuat.`,
    });
  };

  const handleApplyBigIdea = (template: { title: string; target: string; problem: string; solution: string }) => {
    setProjectData(prev => ({
      ...prev,
      judul: template.title,
      target: template.target,
      painPoint: template.problem,
      bigIdea: template.solution,
    }));
    setActiveMode('BIG_IDEA');
    toast({
      title: "Template diterapkan",
      description: "Big Idea template telah diisi ke form proyek.",
    });
  };

  const generatedPrompt = useMemo(() => {
    return generatePrompt(activeMode, projectData, taskConfig, extendConfig, uploadedFiles);
  }, [activeMode, projectData, taskConfig, extendConfig, uploadedFiles, refreshKey]);

  const handleRegenerate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 px-2 sm:px-4 mx-auto max-w-screen-2xl gap-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-primary text-primary-foreground shrink-0">
              <Book className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-semibold tracking-tight truncate">Chaesa AI Studio</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Ekosistem Kompetensi Digital · Ebook → Chatbot · E-Course · Mini App
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="secondary" className="hidden md:flex items-center gap-1">
              <Factory className="h-3 w-3" />
              Industri Ready
            </Badge>
            <Badge variant="outline" className="hidden lg:flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by AI
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden" data-testid="button-open-projects-mobile">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex" data-testid="button-open-projects">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span>Proyek</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Proyek Tersimpan</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SavedProjects onLoad={handleLoadProject} />
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setSaveDialogOpen(true)}
              data-testid="button-save-project-mobile"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setSaveDialogOpen(true)}
              data-testid="button-save-project"
            >
              <Save className="h-4 w-4 mr-2" />
              <span>Simpan</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l">
              <UserProfileDropdown user={user} />
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 mx-auto max-w-screen-2xl">
        <div className="mb-6">
          <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} allowedModes={allowedModes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Tabs defaultValue="project" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="project" data-testid="tab-project">
                  Data Proyek
                </TabsTrigger>
                <TabsTrigger value="config" data-testid="tab-config">
                  Konfigurasi
                </TabsTrigger>
                <TabsTrigger value="files" data-testid="tab-files">
                  File Referensi
                </TabsTrigger>
              </TabsList>
              <TabsContent value="project" className="mt-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">Isi data ebook kamu di bawah</p>
                  <div className="flex items-center gap-2">
                    <JudulTerlaris
                      onSelectJudul={(judul) => {
                        handleProjectChange('judul', judul);
                        if (!projectData.topik) handleProjectChange('topik', judul);
                      }}
                    />
                    <TopicSuggester
                      currentNiche={projectData.topik || 'bisnis digital'}
                      onSelectTopic={(topic) => {
                        handleProjectChange('topik', topic);
                        handleProjectChange('judul', topic);
                      }}
                    />
                  </div>
                </div>
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  <ProjectForm
                    projectData={projectData}
                    onChange={handleProjectChange}
                  />
                </div>
              </TabsContent>
              <TabsContent value="config" className="mt-4">
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  <TaskConfigPanel
                    activeMode={activeMode}
                    projectData={projectData}
                    taskConfig={taskConfig}
                    extendConfig={extendConfig}
                    onTaskConfigChange={handleTaskConfigChange}
                    onExtendConfigChange={handleExtendConfigChange}
                    onEbookStyleChange={handleEbookStyleChange}
                  />
                </div>
              </TabsContent>
              <TabsContent value="files" className="mt-4">
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  <FileUpload
                    uploadedFiles={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <EcosystemTracker />
          </div>

          <div className="space-y-4">
            <BookPreview 
              projectData={projectData} 
              activeMode={activeMode} 
            />
            <div className="lg:sticky lg:top-20">
              <PromptOutput
                prompt={generatedPrompt}
                onRegenerate={handleRegenerate}
                onModeChange={setActiveMode}
                activeMode={activeMode}
                selectedAiModel={projectData.selectedAiModel}
                onAiModelChange={(model) => handleProjectChange('selectedAiModel', model)}
                projectTitle={projectData.judul}
                projectTopik={projectData.topik}
                projectTarget={projectData.target}
                uploadedFiles={uploadedFiles}
                onTopicUpdate={handleTopicUpdate}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container px-4 mx-auto max-w-screen-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Chaesa AI Studio - Smart Prompt Generator</p>
            <p>Gunakan prompt yang dihasilkan dengan AI favorit Anda</p>
          </div>
        </div>
      </footer>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Proyek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nama Proyek</Label>
              <Input
                id="projectName"
                placeholder="Contoh: Ebook Digital Marketing v1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="input-project-name"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Simpan konfigurasi proyek untuk digunakan kembali nanti.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Buttons: Left = DokumenTender (eksekusi prompt), Right = Chaesa (knowledge base) */}
      <DokumenterChatButton />
      <ChaesaChatbot />
    </div>
  );
}
