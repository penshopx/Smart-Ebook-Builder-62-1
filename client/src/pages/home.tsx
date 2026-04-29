import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { Book, Sparkles, Save, RotateCcw, FolderOpen, LogOut, Factory, Crown, Zap, User, Settings, ChevronDown, Shield, Upload, X, FilePlus } from 'lucide-react';
import { TopicSuggester } from '@/components/topic-suggester';
import { JudulTerlaris } from '@/components/judul-terlaris';
import { ExternalEbookImport } from '@/components/external-ebook-import';
import { PersonaConfigTab, defaultAssistantPersona } from '@/components/persona-config-tab';
import type { AssistantPersona } from '@/components/persona-config-tab';
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
  videoType: 'talking_head',
  videoPlatform: 'youtube',
  videoStyle: 'educational',
  videoPresenterName: '',
  videoPresenterPersona: '',
  videoCTA: 'subscribe',
  videoHookStyle: 'question',
  videoTone: 'casual',
  videoSpecialElements: '',
  videoLanguageStyle: 'casual',
  botName: '',
  botRole: 'Mentor Pribadi',
  botPersonality: 'Ramah, Suportif, dan Berbasis Data',
  botSystemPrompt: '',
  botPersonaDetail: '',
  botLanguage: 'Bahasa Indonesia',
  botAudience: '',
  botAvoidTopics: '',
  docType: 'Standard Operating Procedure (SOP)',
  docContext: '',
  docMode: 'generic',
  docIsoKategori: 'smm',
  docIsoJenis: 'manual_mutu',
  docIsoStandar: 'iso_9001',
  docIsoKlausul: '4|||5|||6|||7|||8|||9|||10',
  docIsoNomorDok: '',
  docIsoVersi: '01',
  docIsoTanggal: '',
  docNamaOrg: '',
  docDepartemen: '',
  docLingkup: '',
  docDetailLevel: 'komprehensif',
  docBahasa: 'id',
  docCustomInstruksi: '',
  docGenericKategori: 'tender',
  docGenericJenis: '',
  docGenericTujuan: '',
  docGenericPihak: '',
  docGenericFormat: 'mix',
  docPaket: 'tender_lengkap',
  docNamaDokumen: '',
  docDeskripsi: '',
  docNilaiKontrak: '',
  docPeriode: '',
  docLokasiProyek: '',
  docPenanggungJawab: '',
  docKonteksLain: '',
  packType: 'ebook_author',
  packAiTool: 'chatgpt',
  packNumPrompts: '5',
  packGoal: '',
  packTechniques: 'chain_of_thought|||persona_acting',
  packOutputStyle: 'structured',
  packDepth: 'intermediate',
  packLanguage: 'indonesia',
  packCustomContext: '',
  packCategory: 'content',
  courseDuration: '4 Minggu',
  courseFormat: 'Video + Worksheet',
  courseGoal: '',
  marketingAsset: 'Landing Page Copy (Long Form)',
  marketingAngle: '',
  appType: 'web',
  appComplexity: 'simple',
  appName: '',
  appDescription: '',
  appProblem: '',
  appKeyFeatures: '',
  appMonetization: 'gratis',
  appTechPreference: 'auto',
  appDeployTarget: '',
  appCount: '1',
  appMultiConfig: '',
  quizFocus: 'komprehensif',
  quizScope: 'komprehensif',
  quizBabRef: '',
  quizTypeConfig: '',
  quizFormat: 'plain',
  quizIncludeKey: 'ya',
  quizDuration: '30 menit',
  quizContext: '',
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
  podcastHostPersona: '',
  podcastGuestPersona: '',
  podcastInteractionStyle: '',
  podcastKnowledgeDepth: 'deep',
  podcastKnowledgeFocus: 'semua',
  podcastKeyQuestions: '',
  podcastEnergyLevel: 'moderate',
  podcastLanguageStyle: 'semiformal',
  podcastSpecialSegments: '',
  audiobookNarrator: '',
  audiobookTone: 'conversational',
  audiobookPace: 'medium',
  audiobookChapterFocus: 'full',
  audiobookEmphasis: 'moderate',
  audiobookNarratorPersona: '',
  audiobookLanguageStyle: 'semiformal',
  audiobookListeningContext: 'general',
  audiobookChapterRef: '',
  audiobookOpeningStyle: 'hook',
  audiobookClosingStyle: 'summary',
  audiobookSpecialElements: '',
  audiobookMusicStyle: 'instrumental',
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
  const { data: adminMe } = useQuery<{ role: string; isAdmin: boolean; isSubAdmin: boolean }>({
    queryKey: ['/api/admin/me'],
    staleTime: 1000 * 60 * 5,
  });
  const isAdminOrSub = adminMe?.isAdmin || adminMe?.isSubAdmin;

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
        <DropdownMenuItem asChild>
          <Link
            href="/admin"
            className={`flex items-center gap-2 cursor-pointer ${isAdminOrSub ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
            data-testid="menu-admin"
          >
            <Shield className="h-4 w-4" />
            {isAdminOrSub ? 'Admin Panel' : 'Setup Admin'}
            {adminMe?.isAdmin && <span className="ml-auto text-[10px] bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">Utama</span>}
            {adminMe?.isSubAdmin && <span className="ml-auto text-[10px] bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 px-1.5 py-0.5 rounded-full font-medium">Sub</span>}
          </Link>
        </DropdownMenuItem>
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

const TRANSFER_MODES = ['ECOURSE_BUILDER', 'DOC_GENERATOR', 'GPT_BUILDER', 'MINI_APP_BUILDER', 'QUIZ_MAKER', 'PODCAST_GENERATOR', 'AUDIOBOOK_SCRIPT', 'VIDEO_SCRIPT', 'PROMPT_PACK', 'MARKETING_KIT', 'LANDING_PAGE'];

export default function Home() {
  const [projectData, setProjectData] = useState<ProjectData>(defaultProjectData);
  const [taskConfig, setTaskConfig] = useState<TaskConfig>(defaultTaskConfig);
  const [extendConfig, setExtendConfig] = useState<ExtendConfig>(defaultExtendConfig);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [assistantPersona, setAssistantPersona] = useState<AssistantPersona>(defaultAssistantPersona);
  const [activeMode, setActiveMode] = useState('BRAINSTORM');
  const [refreshKey, setRefreshKey] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [externalEbookContent, setExternalEbookContent] = useState('');
  const [externalFileName, setExternalFileName] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('chaesa_panel_width');
    return saved ? Math.max(25, Math.min(75, Number(saved))) : 50;
  });
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRestoredRef = useRef(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const restoredRef = useRef(false);

  const restoreTemporaryData = useCallback(() => {
    try {
      const savedFiles = localStorage.getItem('chaesa_uploaded_files');
      if (savedFiles) {
        const parsed = JSON.parse(savedFiles);
        if (Array.isArray(parsed) && parsed.length > 0) setUploadedFiles(parsed);
      }
    } catch {}
    try {
      const savedContent = localStorage.getItem('chaesa_external_content') || '';
      const savedFileName = localStorage.getItem('chaesa_external_filename') || '';
      if (savedContent && savedContent.length > 50) {
        setExternalEbookContent(savedContent);
        setExternalFileName(savedFileName);
      }
    } catch {}
    hasRestoredRef.current = true;
  }, []);

  useEffect(() => {
    if (restoredRef.current || !user) return;
    restoredRef.current = true;

    const savedId = localStorage.getItem('chaesa_last_project_id');
    const savedMode = localStorage.getItem('chaesa_last_mode');

    const hasUserChanges = JSON.stringify(projectData) !== JSON.stringify(defaultProjectData) ||
      JSON.stringify(taskConfig) !== JSON.stringify(defaultTaskConfig);
    if (hasUserChanges) {
      restoreTemporaryData();
      return;
    }

    if (!savedId) {
      restoreTemporaryData();
      return;
    }

    fetch(`/api/projects/${savedId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((project: any) => {
        if (!project) {
          localStorage.removeItem('chaesa_last_project_id');
        } else {
          setProjectData({ ...defaultProjectData, ...project.projectData });
          setTaskConfig({ ...defaultTaskConfig, ...project.taskConfig });
          setProjectName(project.name ?? '');
          setCurrentProjectId(project.id);
          if (savedMode) setActiveMode(savedMode);
        }
        restoreTemporaryData();
      })
      .catch(() => {
        localStorage.removeItem('chaesa_last_project_id');
        restoreTemporaryData();
      });
  }, [user]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('chaesa_last_mode', activeMode);
    }
  }, [activeMode, currentProjectId]);

  useEffect(() => {
    const check = () => setIsLargeScreen(window.innerWidth >= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    try {
      const capped = uploadedFiles.map(f => ({
        ...f,
        content: f.content && f.content.length > 150000 ? f.content.slice(0, 150000) : f.content,
      }));
      localStorage.setItem('chaesa_uploaded_files', JSON.stringify(capped));
    } catch {}
  }, [uploadedFiles]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    try {
      const capped = externalEbookContent.length > 500000 ? externalEbookContent.slice(0, 500000) : externalEbookContent;
      localStorage.setItem('chaesa_external_content', capped);
      localStorage.setItem('chaesa_external_filename', externalFileName);
    } catch {}
  }, [externalEbookContent, externalFileName]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const dx = ev.clientX - startX;
      const newWidth = Math.max(20, Math.min(80, startWidth + (dx / containerWidth) * 100));
      setLeftPanelWidth(newWidth);
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setLeftPanelWidth(prev => {
        localStorage.setItem('chaesa_panel_width', String(prev));
        return prev;
      });
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [leftPanelWidth]);

  const { data: planData } = useQuery<{ plan: string; allowedModes: string[] | 'all' }>({
    queryKey: ['/api/user/plan'],
    staleTime: 1000 * 60 * 5,
  });
  const allowedModes: string[] | 'all' = planData?.allowedModes ?? 'all';

  const handleProjectChange = (name: string, value: string) => {
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonaChange = (field: keyof AssistantPersona, value: string | string[]) => {
    setAssistantPersona(prev => ({ ...prev, [field]: value }));
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
    setCurrentProjectId(null);
    setExternalEbookContent('');
    setExternalFileName('');
    localStorage.removeItem('chaesa_last_project_id');
    localStorage.removeItem('chaesa_last_mode');
  };

  const handleExternalEbookLoaded = (content: string, fileName: string, meta: { judul?: string; topik?: string }) => {
    setExternalEbookContent(content);
    setExternalFileName(fileName);
    if (!TRANSFER_MODES.includes(activeMode)) setActiveMode('ECOURSE_BUILDER');
  };

  const handleDocumentFieldsExtracted = (fields: Partial<{ topik: string; judul: string; target: string; tujuan: string; painPoint: string; bigIdea: string; hasilRiset: string; produk: string }>) => {
    setProjectData(prev => ({
      ...prev,
      topik: fields.topik ?? '',
      judul: fields.judul ?? '',
      target: fields.target ?? '',
      tujuan: fields.tujuan ?? '',
      painPoint: fields.painPoint ?? '',
      bigIdea: fields.bigIdea ?? '',
      hasilRiset: fields.hasilRiset ?? '',
      produk: fields.produk ?? '',
    }));
  };

  const handleClearExternalEbook = () => {
    setExternalEbookContent('');
    setExternalFileName('');
  };

  const handleTopicUpdate = (topik: string, judul?: string) => {
    setProjectData(prev => ({
      ...prev,
      topik,
      judul: judul || topik,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (nameOverride?: string) => {
      const name = nameOverride || projectName || projectData.judul || projectData.topik || 'Proyek Tanpa Judul';
      const snapshot = { name, projectData: { ...projectData }, taskConfig: { ...taskConfig } };
      const isUpdate = !!currentProjectId;
      const res = isUpdate
        ? await apiRequest('PUT', `/api/projects/${currentProjectId}`, snapshot)
        : await apiRequest('POST', '/api/projects', snapshot);
      const json = await res.json();
      return { json, isUpdate };
    },
    onSuccess: ({ json, isUpdate }: { json: any; isUpdate: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      if (json?.id) {
        setCurrentProjectId(json.id);
        localStorage.setItem('chaesa_last_project_id', json.id);
        if (json.name) setProjectName(json.name);
      }
      toast({
        title: !isUpdate ? "Proyek tersimpan!" : "Proyek diperbarui!",
        description: !isUpdate
          ? "Konfigurasi proyek berhasil disimpan."
          : "Perubahan berhasil disimpan (menimpa data lama).",
      });
      setSaveDialogOpen(false);
    },
    onError: (error: any) => {
      const msg = error?.message ?? '';
      const is401 = msg.startsWith('401');
      const is403 = msg.startsWith('403');
      const is409 = msg.startsWith('409');

      let description = "Terjadi kesalahan saat menyimpan proyek. Coba lagi.";
      if (is401) description = "Sesi login kadaluarsa. Silakan refresh halaman dan login ulang.";
      else if (is403) description = "Batas proyek tercapai pada paket ini. Upgrade ke Pro untuk menyimpan lebih banyak proyek.";
      else if (is409) {
        try {
          const jsonStr = msg.replace(/^\d+:\s*/, '');
          const parsed = JSON.parse(jsonStr);
          description = parsed.error || "Nama proyek sudah digunakan. Pilih nama lain.";
        } catch {
          description = "Nama proyek sudah digunakan. Pilih nama yang berbeda.";
        }
      }

      toast({
        title: is409 ? "Nama sudah digunakan" : "Gagal menyimpan",
        description,
        variant: "destructive",
        duration: 8000,
      });
    },
  });

  const handleSaveClick = () => {
    if (currentProjectId) {
      saveMutation.mutate(undefined);
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleLoadProject = (project: any) => {
    setProjectData({ ...defaultProjectData, ...project.projectData });
    setTaskConfig({ ...defaultTaskConfig, ...project.taskConfig });
    setProjectName(project.name);
    setCurrentProjectId(project.id);
    localStorage.setItem('chaesa_last_project_id', project.id);
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

  const effectivePrompt = externalEbookContent && TRANSFER_MODES.includes(activeMode)
    ? externalEbookContent
    : generatedPrompt;

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
              onClick={() => {
                const hasData = currentProjectId ||
                  JSON.stringify(projectData) !== JSON.stringify(defaultProjectData);
                if (hasData) setNewProjectDialogOpen(true);
                else handleReset();
              }}
              title="Buat proyek baru"
              data-testid="button-new-project-mobile"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => {
                const hasData = currentProjectId ||
                  JSON.stringify(projectData) !== JSON.stringify(defaultProjectData);
                if (hasData) setNewProjectDialogOpen(true);
                else handleReset();
              }}
              title="Buat proyek baru"
              data-testid="button-new-project"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              <span>Baru</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={handleSaveClick}
              disabled={saveMutation.isPending}
              title={currentProjectId ? "Perbarui proyek (overwrite)" : "Simpan proyek baru"}
              data-testid="button-save-project-mobile"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={handleSaveClick}
              disabled={saveMutation.isPending}
              title={currentProjectId ? "Perbarui proyek (overwrite)" : "Simpan proyek baru"}
              data-testid="button-save-project"
            >
              <Save className="h-4 w-4 mr-2" />
              <span>{saveMutation.isPending ? 'Menyimpan...' : currentProjectId ? 'Perbarui' : 'Simpan'}</span>
            </Button>
            <ThemeToggle />
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l">
              <UserProfileDropdown user={user} />
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 mx-auto max-w-screen-2xl">
        <div className="mb-6 space-y-2">
          {externalEbookContent && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">📥 Mode Ebook Eksternal Aktif:</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate flex-1">{externalFileName}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">Gunakan mode Transfer Kompetensi atau Marketing ↓</span>
              <button onClick={handleClearExternalEbook} className="text-muted-foreground hover:text-destructive ml-1 shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} allowedModes={allowedModes} />
        </div>

        <div
          ref={containerRef}
          className="flex"
          style={{ flexDirection: isLargeScreen ? 'row' : 'column' }}
        >
          <div
            className="space-y-6 shrink-0"
            style={isLargeScreen ? { width: `${leftPanelWidth}%`, paddingRight: '12px' } : undefined}
          >
            <Tabs defaultValue={externalEbookContent ? "external" : "project"} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="project" data-testid="tab-project" className="text-xs">
                  Proyek
                </TabsTrigger>
                <TabsTrigger value="config" data-testid="tab-config" className="text-xs">
                  Konfigurasi
                </TabsTrigger>
                <TabsTrigger value="external" data-testid="tab-external-ebook" className="text-xs relative">
                  <Upload className="h-3 w-3 mr-1" />
                  Import
                  {externalEbookContent && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" data-testid="tab-files" className="text-xs">
                  File
                </TabsTrigger>
                <TabsTrigger value="persona" data-testid="tab-persona" className="text-xs relative">
                  Asisten
                  {(assistantPersona.namaAsisten || assistantPersona.knowledgeBase) && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-500" />
                  )}
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
              <TabsContent value="external" className="mt-4">
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  <ExternalEbookImport
                    externalContent={externalEbookContent}
                    externalFileName={externalFileName}
                    onContentLoaded={handleExternalEbookLoaded}
                    onFieldsExtracted={handleDocumentFieldsExtracted}
                    onClear={handleClearExternalEbook}
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
              <TabsContent value="persona" className="mt-4">
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  <PersonaConfigTab
                    persona={assistantPersona}
                    onChange={handlePersonaChange}
                    projectTopik={projectData.topik}
                    industry={projectData.industry}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <EcosystemTracker />
          </div>

          {isLargeScreen && (
            <div
              onMouseDown={handleDragStart}
              className="flex items-center justify-center shrink-0 cursor-col-resize group select-none"
              style={{ width: '14px', margin: '0 2px' }}
              title="Geser untuk ubah ukuran panel"
            >
              <div
                className="flex flex-col items-center justify-center gap-[3px] h-12 w-full rounded group-hover:bg-primary/10 group-active:bg-primary/20 transition-colors"
              >
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
                <div className="w-[3px] h-[3px] rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
              </div>
            </div>
          )}

          <div className="space-y-4 flex-1 min-w-0" style={isLargeScreen ? undefined : { marginTop: '24px' }}>
            <BookPreview 
              projectData={projectData} 
              activeMode={activeMode} 
            />
            <div className="lg:sticky lg:top-20">
              <PromptOutput
                prompt={effectivePrompt}
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
                projectData={projectData}
                assistantPersona={assistantPersona}
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

      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Proyek Baru</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            {currentProjectId
              ? 'Proyek yang sedang aktif akan ditutup. Pastikan sudah klik "Perbarui" jika ingin menyimpan perubahan terbaru. Lanjutkan membuat proyek baru?'
              : 'Data di form akan dihapus dan diganti dengan form kosong. Lanjutkan?'}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setNewProjectDialogOpen(false);
                handleReset();
              }}
              data-testid="button-confirm-new-project"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Ya, Proyek Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Proyek Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nama Proyek</Label>
              <Input
                id="projectName"
                placeholder="Contoh: Ebook Digital Marketing v1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveMutation.mutate(projectName || undefined)}
                data-testid="input-project-name"
                autoFocus
              />
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>• Nama proyek harus <strong>unik</strong> — tidak boleh sama dengan proyek yang sudah ada.</p>
              <p>• Setelah tersimpan, tombol berubah menjadi <strong>Perbarui</strong> yang langsung menimpa data tanpa dialog.</p>
              <p>• Untuk memperbarui proyek yang sudah ada, buka proyek tersebut lalu klik <strong>Perbarui</strong>.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveMutation.mutate(projectName || undefined)}
              disabled={saveMutation.isPending || !projectName.trim()}
              data-testid="button-confirm-save"
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Chat Buttons: Left = DokumenTender (prompt executor), Right = Chaesa (help desk) */}
      <DokumenterChatButton />
      <ChaesaChatbot />
    </div>
  );
}
