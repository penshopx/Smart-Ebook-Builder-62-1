import { useState, useRef, useCallback, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Maximize2, Minimize2, Sparkles, Rocket, Bot, Star, Zap, MessageCircle, Brain, Globe, Search, FileText, Download, Loader2, AlertCircle, FileDown, ImagePlus, X, Monitor, ChevronLeft, ChevronRight, Pencil, Hash, Megaphone, Video, Mic, Mail, MessageSquare, ShoppingBag, Camera, Linkedin, ShieldCheck, Volume2, Play, Pause, Smartphone, ClipboardList, Send, GraduationCap, ChevronDown, ChevronUp, Palette, HelpCircle, Settings2, DollarSign, CalendarDays, BookOpen, BrainCircuit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AI_MODEL_RECOMMENDATIONS } from '@shared/schema';
import type { ProjectData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { markEcoUsed } from '@/components/ecosystem-tracker';
import { TopicAssistant } from '@/components/topic-assistant';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const aiIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot, MessageCircle, Brain, Sparkles, Search, Globe,
};

function addFooter(doc: jsPDF, pageW: number, pageH: number, margin: number, ownerName?: string) {
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.text(ownerName ? `© ${ownerName} · Chaesa AI Studio` : 'Chaesa AI Studio', margin, pageH - 9);
  doc.text(`Halaman ${pageNum}`, pageW - margin, pageH - 9, { align: 'right' });
}

function addWatermark(doc: jsPDF, pageW: number, pageH: number, text: string) {
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(38);
  doc.setTextColor(80, 80, 80);
  const cx = pageW / 2;
  const cy = pageH / 2;
  doc.text(text, cx, cy, { align: 'center', angle: 45 });
  doc.restoreGraphicsState();
}

interface PromptOutputProps {
  prompt: string;
  onRegenerate?: () => void;
  activeMode?: string;
  onModeChange?: (mode: string) => void;
  selectedAiModel?: string;
  onAiModelChange?: (modelId: string) => void;
  projectTitle?: string;
  projectTopik?: string;
  projectTarget?: string;
  uploadedFiles?: { name: string; type: string; size: string }[];
  onTopicUpdate?: (topik: string, judul?: string) => void;
  projectData?: ProjectData;
  assistantPersona?: import('@/components/persona-config-tab').AssistantPersona;
}

const WORKFLOW_STEPS = [
  { id: 'BRAINSTORM', label: 'Brainstorm', phase: 1 },
  { id: 'BIG_IDEA', label: 'Big Idea', phase: 1 },
  { id: 'OUTLINE', label: 'Outline', phase: 2 },
  { id: 'DRAFT_BAB', label: 'Draft Bab', phase: 2 },
  { id: 'VIDEO_SCRIPT', label: 'Script', phase: 3 },
  { id: 'MARKETING_KIT', label: 'Marketing', phase: 3 },
  { id: 'ECOURSE_BUILDER', label: 'E-Course', phase: 4 },
  { id: 'MINI_APP_BUILDER', label: 'Mini App', phase: 4 },
  { id: 'QUIZ_MAKER', label: 'Kuis', phase: 4 },
];

const NEXT_STEP_MAP: Record<string, { next: string; label: string; desc: string; color: string }> = {
  'BRAINSTORM': { next: 'BIG_IDEA', label: 'Pertajam Big Idea', desc: 'Pilih 1 ide terbaik, perkuat positioning & unique mechanism-nya', color: 'from-orange-500 to-amber-500' },
  'BIG_IDEA': { next: 'OUTLINE', label: 'Buat Daftar Isi', desc: 'Ubah big idea menjadi outline lengkap yang terstruktur', color: 'from-blue-500 to-cyan-500' },
  'OUTLINE': { next: 'DRAFT_BAB', label: 'Tulis Bab Pertama', desc: 'Mulai menulis bab dari outline yang sudah kamu buat', color: 'from-violet-500 to-purple-500' },
  'DRAFT_BAB': { next: 'VIDEO_SCRIPT', label: 'Buat Script Video', desc: 'Ubah bab ini menjadi script YouTube atau Reels', color: 'from-pink-500 to-rose-500' },
  'VIDEO_SCRIPT': { next: 'MARKETING_KIT', label: 'Buat Marketing Kit', desc: 'Siapkan copy promosi, email, & landing page untuk konten ini', color: 'from-pink-600 to-rose-500' },
  'MARKETING_KIT': { next: 'MINI_APP_BUILDER', label: 'Rancang Mini App', desc: 'Buat app pendukung ekosistem ebookmu', color: 'from-slate-700 to-gray-800' },
  'MINI_APP_BUILDER': { next: 'QUIZ_MAKER', label: 'Buat Generator Kuis', desc: 'Buat soal untuk menguji pemahaman pembaca', color: 'from-purple-600 to-fuchsia-600' },
  'DOC_GENERATOR': { next: 'MARKETING_KIT', label: 'Buat Marketing Kit', desc: 'Promosikan dokumen ini ke target pembeli kamu', color: 'from-pink-600 to-rose-500' },
  'GPT_BUILDER': { next: 'MINI_APP_BUILDER', label: 'Rancang Mini App', desc: 'Ubah system prompt chatbot ini menjadi mini app yang bisa di-deploy', color: 'from-slate-700 to-gray-800' },
  'ECOURSE_BUILDER': { next: 'QUIZ_MAKER', label: 'Buat Kuis Asesmen', desc: 'Buat soal untuk mengevaluasi peserta kursus', color: 'from-purple-600 to-fuchsia-600' },
};

function getSuggestedQuestions(topik: string): string[] {
  return [
    `Apa poin terpenting dari topik "${topik}"?`,
    `Bagaimana cara memulai ${topik} untuk pemula?`,
    `Apa kesalahan umum yang harus dihindari dalam ${topik}?`,
    `Berikan contoh praktis penerapan ${topik}`,
    `Apa strategi terbaik untuk sukses dalam ${topik}?`,
    `Apa tools atau resources yang dibutuhkan untuk ${topik}?`,
  ];
}

interface ChapterItem { id: string; number: number; title: string; subTopics: string; content: string; loading: boolean; }

function mdInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)|`([^`]+)`)/g;
  let last = 0; let m: RegExpExecArray | null; let ki = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={ki++}>{text.slice(last, m.index)}</span>);
    if (m[2]) parts.push(<strong key={ki++} className="font-bold">{m[2]}</strong>);
    else if (m[3]) parts.push(<strong key={ki++} className="font-bold">{m[3]}</strong>);
    else if (m[4]) parts.push(<strong key={ki++} className="font-bold">{m[4]}</strong>);
    else if (m[5]) parts.push(<em key={ki++} className="italic">{m[5]}</em>);
    else if (m[6]) parts.push(<em key={ki++} className="italic">{m[6]}</em>);
    else if (m[7]) parts.push(<code key={ki++} className="bg-muted font-mono text-xs px-1 py-0.5 rounded">{m[7]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={ki++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function MarkdownContent({ content, className }: { content: string; className?: string }) {
  if (!content) return null;
  const lines = content.split('\n');
  type Block =
    | { type: 'empty' }
    | { type: 'heading'; level: number; text: string }
    | { type: 'hr' }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'table'; header: string[]; rows: string[][] }
    | { type: 'paragraph'; text: string };
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();
    if (t === '') { blocks.push({ type: 'empty' }); i++; }
    else if (/^#{1,6} /.test(t)) {
      const lvl = t.match(/^(#+)/)![1].length;
      blocks.push({ type: 'heading', level: lvl, text: t.replace(/^#+\s*/, '') });
      i++;
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { blocks.push({ type: 'hr' }); i++; }
    else if (/^\|/.test(t)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i].trim())) { tableLines.push(lines[i]); i++; }
      const parseRow = (row: string) => row.split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).map(c => c.trim());
      const nonSep = tableLines.filter(l => !/^[\|\s\-:]+$/.test(l));
      if (nonSep.length >= 1) {
        const [hdr, ...dataLines] = nonSep;
        blocks.push({ type: 'table', header: parseRow(hdr), rows: dataLines.map(parseRow) });
      }
    } else if (/^(\s*[-*+] |\s*\d+\. )/.test(raw)) {
      const ordered = /^\s*\d+\. /.test(raw);
      const items: string[] = [];
      while (i < lines.length && /^(\s*[-*+] |\s*\d+\. )/.test(lines[i])) {
        items.push(lines[i].trim().replace(/^[-*+]\s*/, '').replace(/^\d+\.\s*/, ''));
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
    } else { blocks.push({ type: 'paragraph', text: t }); i++; }
  }
  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      {blocks.map((block, bi) => {
        if (block.type === 'empty') return <div key={bi} className="h-2" />;
        if (block.type === 'hr') return <hr key={bi} className="my-3 border-border" />;
        if (block.type === 'heading') {
          const cls: Record<number, string> = {
            1: 'text-lg font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border',
            2: 'text-base font-bold text-foreground mt-4 mb-1',
            3: 'text-sm font-semibold text-foreground mt-3 mb-1',
            4: 'text-sm font-semibold text-primary mt-2 mb-0.5',
            5: 'text-sm font-medium text-primary mt-2',
            6: 'text-xs font-medium text-muted-foreground mt-1',
          };
          const Tag = (['h1','h2','h3','h4','h5','h6'] as const)[block.level - 1] || 'h4';
          return <Tag key={bi} className={cls[block.level] || cls[3]}>{mdInline(block.text)}</Tag>;
        }
        if (block.type === 'table') return (
          <div key={bi} className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  {block.header.map((cell, ci) => <th key={ci} className="border border-border px-3 py-1.5 text-left font-semibold">{mdInline(cell)}</th>)}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                    {row.map((cell, ci) => <td key={ci} className="border border-border px-3 py-1.5">{mdInline(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag key={bi} className={cn('pl-5 space-y-0.5 my-2', block.ordered ? 'list-decimal' : 'list-disc')}>
              {block.items.map((item, ii) => <li key={ii} className="text-foreground">{mdInline(item)}</li>)}
            </Tag>
          );
        }
        if (block.type === 'paragraph') {
          const isHeader = block.text.length < 100 && (
            /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR)/i.test(block.text) ||
            (block.text === block.text.toUpperCase() && block.text.length > 3)
          );
          return <p key={bi} className={cn('mb-1', isHeader ? 'font-bold text-primary mt-4 text-sm' : 'text-foreground')}>{mdInline(block.text)}</p>;
        }
        return null;
      })}
    </div>
  );
}

export function PromptOutput({ prompt, onRegenerate, activeMode, onModeChange, selectedAiModel = 'dokumentender', onAiModelChange, projectTitle, projectTopik, projectTarget, uploadedFiles = [], onTopicUpdate, projectData, assistantPersona }: PromptOutputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [planLimitOpen, setPlanLimitOpen] = useState(false);
  const [planLimitInfo, setPlanLimitInfo] = useState<{ used: number; limit: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docError, setDocError] = useState('');
  // Doc Generator Config
  const [docConfigOpen, setDocConfigOpen] = useState(false);
  const [docJenis, setDocJenis] = useState('ebook');
  // Doc Generator Config — ISO / Quality Management Documents
  const [docKategori, setDocKategori] = useState('smm');
  const [docJenisISO, setDocJenisISO] = useState('manual_mutu');
  const [docStandar, setDocStandar] = useState<string[]>(['iso_9001']);
  const [docKlausul, setDocKlausul] = useState<string[]>(['4','5','6','7','8','9','10']);
  const [docNomorDok, setDocNomorDok] = useState('');
  const [docVersi, setDocVersi] = useState('01');
  const [docTanggalEfektif, setDocTanggalEfektif] = useState('');
  const [docNamaOrg, setDocNamaOrg] = useState('');
  const [docDepartemen, setDocDepartemen] = useState('');
  const [docLingkup, setDocLingkup] = useState('');
  const [docDetailLevel, setDocDetailLevel] = useState('komprehensif');
  const [docBahasa, setDocBahasa] = useState('id');
  const [docCustomInstruksi, setDocCustomInstruksi] = useState('');
  // Legacy ebook doc config (kept for backward compat in doGenerateDocument deps)
  const [docJumlahBab] = useState('8');
  const [docPanjangBab] = useState('medium');
  const [docKedalaman] = useState('menengah');
  const [docGaya] = useState('semi-formal');
  const [docElemen] = useState<string[]>(['daftar_isi','ringkasan_bab','kesimpulan','poin_kunci']);
  const [docFormat] = useState('mix');
  const [docPresisi] = useState('deep');
  const [docFokus] = useState('how-to');
  const [isDocCopied, setIsDocCopied] = useState(false);
  const [imageInserts, setImageInserts] = useState<Record<number, string>>({});
  const [imgPickerOpen, setImgPickerOpen] = useState(false);
  const [imgPickerIdx, setImgPickerIdx] = useState(-1);
  const [imgPickerLoading, setImgPickerLoading] = useState(false);
  const [pickerImages, setPickerImages] = useState<string[]>([]);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTopicAssistant, setShowTopicAssistant] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  const [imgPickerType, setImgPickerType] = useState<'illustration' | 'infographic'>('illustration');
  const [mktOpen, setMktOpen] = useState(false);
  const [mktContent, setMktContent] = useState('');
  const [mktLoading, setMktLoading] = useState(false);
  const [mktActiveSection, setMktActiveSection] = useState('sales');
  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptTab, setScriptTab] = useState<'script' | 'seo'>('script');
  const [seoContent, setSeoContent] = useState('');
  const [seoLoading, setSeoLoading] = useState(false);
  const [thumbOpen, setThumbOpen] = useState(false);
  const [thumbImages, setThumbImages] = useState<string[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState('');
  const [ttsVoice, setTtsVoice] = useState<'nova' | 'alloy' | 'shimmer' | 'onyx' | 'echo'>('nova');
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [monoOpen, setMonoOpen] = useState(false);
  const [monoContent, setMonoContent] = useState('');
  const [monoLoading, setMonoLoading] = useState(false);
  const [monoTab, setMonoTab] = useState<'harga'|'platform'|'pembeli'|'launch'|'upsell'>('harga');
  // Chatbot Demo
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:'user'|'assistant'; content:string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSystemPrompt, setChatSystemPrompt] = useState('');
  // GPTs Builder
  const [gptsOpen, setGptsOpen] = useState(false);
  const [gptsContent, setGptsContent] = useState('');
  const [gptsLoading, setGptsLoading] = useState(false);
  const [gptsTab, setGptsTab] = useState<'instruksi'|'overview'|'starters'|'knowledge'|'capabilities'|'persona'|'publish'|'security'|'formfill'>('instruksi');
  const [gptsConfigOpen, setGptsConfigOpen] = useState(false);
  const [gptsNama, setGptsNama] = useState('');
  const [gptsTujuan, setGptsTujuan] = useState('sales_assistant');
  const [gptsGaya, setGptsGaya] = useState('profesional');
  const [gptsCapabilities, setGptsCapabilities] = useState<string[]>(['web_search']);
  const [gptsBatasan, setGptsBatasan] = useState('');
  const [gptsOutputFormat, setGptsOutputFormat] = useState('');
  const [gptsPersonality, setGptsPersonality] = useState('');
  const [gptsMonetize, setGptsMonetize] = useState(false);
  const [gptsLanguage, setGptsLanguage] = useState('id');
  // Silabus Kursus
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [syllabusContent, setSyllabusContent] = useState('');
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusTab, setSyllabusTab] = useState<'overview'|'modul'|'worksheet'|'sertifikat'>('overview');
  // Mini App Blueprint
  const [appOpen, setAppOpen] = useState(false);
  const [appContent, setAppContent] = useState('');
  const [appLoading, setAppLoading] = useState(false);
  const [appTab, setAppTab] = useState<'konsep'|'fitur'|'screens'|'userflow'|'techstack'|'prototype'|'integrasi_ai'|'prompt_build'|'monetisasi'|'launch'>('konsep');
  // Mini App Config
  const [appConfigOpen, setAppConfigOpen] = useState(false);
  const [appType, setAppType] = useState('auto');
  const [appPlatform, setAppPlatform] = useState('web');
  const [appNeedAI, setAppNeedAI] = useState(true);
  const [appLang, setAppLang] = useState('id');
  const [appFiturWajib, setAppFiturWajib] = useState('');
  const [appIntegrasi, setAppIntegrasi] = useState('');
  const [appComplexity, setAppComplexity] = useState<'simple'|'medium'|'advanced'>('medium');
  // Mini App History (max 10, FIFO, persisted to localStorage)
  type AppHistoryItem = { id: string; label: string; appType: string; appPlatform: string; appLang: string; appComplexity: string; content: string; createdAt: string; };
  const [appHistory, setAppHistory] = useState<AppHistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('chaesa_miniapp_history') || '[]'); } catch { return []; }
  });
  const [appViewingId, setAppViewingId] = useState<string | null>(null);
  // Generator Kuis
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizContent, setQuizContent] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTab, setQuizTab] = useState<'mcq'|'tf'|'essay'|'casestudy'>('mcq');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  // Silabus pre-config
  const [syllabusConfigOpen, setSyllabusConfigOpen] = useState(false);
  const [syllabusConfigDuration, setSyllabusConfigDuration] = useState('4 Minggu');
  const [syllabusConfigFormat, setSyllabusConfigFormat] = useState('Video + Worksheet');
  const [syllabusConfigGoal, setSyllabusConfigGoal] = useState('');
  // Quiz pre-config
  const [quizConfigOpen, setQuizConfigOpen] = useState(false);
  const [quizConfigLevel, setQuizConfigLevel] = useState('Intermediate');
  const [quizConfigFocus, setQuizConfigFocus] = useState('komprehensif');
  // Track if next step was dismissed
  const [nextStepDismissed, setNextStepDismissed] = useState(false);
  // Podcast Script Generator
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [podcastContent, setPodcastContent] = useState('');
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastTab, setPodcastTab] = useState<'script' | 'segments'>('script');
  // Audiobook Script Generator
  const [audiobookOpen, setAudiobookOpen] = useState(false);
  const [audiobookContent, setAudiobookContent] = useState('');
  const [audiobookLoading, setAudiobookLoading] = useState(false);
  const [audiobookTab, setAudiobookTab] = useState<'script' | 'chapters'>('script');
  // Landing Page Generator
  const [lpOpen, setLpOpen] = useState(false);
  const [lpContent, setLpContent] = useState('');
  const [lpLoading, setLpLoading] = useState(false);
  const [lpTab, setLpTab] = useState<'copy' | 'preview' | 'sections'>('copy');
  const [lpOutputFormat, setLpOutputFormat] = useState('copy');
  const [lpConfigOpen, setLpConfigOpen] = useState(false);
  const [lpPrice, setLpPrice] = useState('');
  const [lpBonuses, setLpBonuses] = useState('');
  const [lpCTA, setLpCTA] = useState('Beli Sekarang');
  const [lpStyle, setLpStyle] = useState('long-form');
  const [lpGoal, setLpGoal] = useState('sell');
  const [lpProblem, setLpProblem] = useState('');
  const [lpKondisi, setLpKondisi] = useState('');
  const [lpSolusi, setLpSolusi] = useState('');
  const [lpValueProp, setLpValueProp] = useState('');
  const [lpManfaat, setLpManfaat] = useState('');
  const [lpKredibilitas, setLpKredibilitas] = useState('');
  const [lpGaransi, setLpGaransi] = useState('30 hari uang kembali tanpa syarat');
  const [lpHargaCoret, setLpHargaCoret] = useState('');
  const [lpConfigTab, setLpConfigTab] = useState<'produk' | 'copy' | 'teknis'>('produk');
  // FlipBook Guide
  const [flipbookOpen, setFlipbookOpen] = useState(false);
  // Ecosystem Hub
  const [ecoHubOpen, setEcoHubOpen] = useState(false);
  // Riset Ebook (Research Center)
  const [risetOpen, setRisetOpen] = useState(false);
  const [risetContent, setRisetContent] = useState('');
  const [risetLoading, setRisetLoading] = useState(false);
  const [risetType, setRisetType] = useState<'keyword' | 'website' | 'youtube'>('keyword');
  const [risetQuery, setRisetQuery] = useState('');
  // Mockup 3D Generator
  const [mockupOpen, setMockupOpen] = useState(false);
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [mockupLoading, setMockupLoading] = useState(false);
  const [mockupStyle, setMockupStyle] = useState<'book' | 'phone' | 'tablet'>('phone');
  // Brand / Author Identity (persisted)
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('ebb_author_name') || '');
  const [exportLoading, setExportLoading] = useState(false);
  // Cover HTML Template Generator
  const [coverTplOpen, setCoverTplOpen] = useState(false);
  const [coverTplContent, setCoverTplContent] = useState('');
  const [coverTplLoading, setCoverTplLoading] = useState(false);
  const [coverTplTab, setCoverTplTab] = useState<'preview' | 'code'>('preview');
  const [coverTplAuthor, setCoverTplAuthor] = useState('');
  const [coverTplColorScheme, setCoverTplColorScheme] = useState('professional');
  const [coverTplStyle, setCoverTplStyle] = useState('Modern & Profesional');
  // ===== EBOOK BUILDER FEATURES =====
  // Ebook Outline / TOC Generator
  const [ebOutlineOpen, setEbOutlineOpen] = useState(false);
  const [ebOutlineContent, setEbOutlineContent] = useState('');
  const [ebOutlineLoading, setEbOutlineLoading] = useState(false);
  const [ebOutlineChapters, setEbOutlineChapters] = useState('10');
  // Chapter Builder
  const [chapterBuilderOpen, setChapterBuilderOpen] = useState(false);
  const [chapters, setChapters] = useState<ChapterItem[]>([
    { id: '1', number: 1, title: '', subTopics: '', content: '', loading: false },
    { id: '2', number: 2, title: '', subTopics: '', content: '', loading: false },
    { id: '3', number: 3, title: '', subTopics: '', content: '', loading: false },
  ]);
  const [activeChapterId, setActiveChapterId] = useState<string>('1');
  const [chapterTone, setChapterTone] = useState('informatif dan mudah dipahami');
  // Ebook Visual Template / Layout Preview
  const [ebTemplateOpen, setEbTemplateOpen] = useState(false);
  const [ebTemplateHtml, setEbTemplateHtml] = useState('');
  const [ebTemplateLoading, setEbTemplateLoading] = useState(false);
  const [ebTheme, setEbTheme] = useState<'professional' | 'modern' | 'warm' | 'bold' | 'minimal'>('professional');
  const [ebAccentColor, setEbAccentColor] = useState('');
  // Expand Chapter
  const [expandWordsCount, setExpandWordsCount] = useState('150');
  const [expandLoading, setExpandLoading] = useState<string | null>(null);
  // Custom Regenerate Chapter
  const [customRegenAdditions, setCustomRegenAdditions] = useState<string[]>([]);
  const [customRegenLoading, setCustomRegenLoading] = useState<string | null>(null);
  // Stok Gambar (Free image search via Openverse)
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageQuery, setImageQuery] = useState('');
  const [imageResults, setImageResults] = useState<{id:string;title:string;thumbnail:string;url:string;creator:string;source:string;license:string}[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchPage, setImageSearchPage] = useState(1);
  const [imageTotal, setImageTotal] = useState(0);
  // ===== END EBOOK BUILDER =====
  // ===== DISTRIBUSI & MONETISASI =====
  const [platformListingOpen, setPlatformListingOpen] = useState(false);
  const [platformListingContent, setPlatformListingContent] = useState('');
  const [platformListingLoading, setPlatformListingLoading] = useState(false);
  const [resellerKitOpen, setResellerKitOpen] = useState(false);
  const [resellerKitContent, setResellerKitContent] = useState('');
  const [resellerKitLoading, setResellerKitLoading] = useState(false);
  const [repurposingOpen, setRepurposingOpen] = useState(false);
  const [repurposingContent, setRepurposingContent] = useState('');
  const [repurposingLoading, setRepurposingLoading] = useState(false);
  // ===== END DISTRIBUSI =====
  // ===== EDUKAZO FEATURES =====
  // AI Text Assist (inline editor untuk Chapter Builder)
  const [aiAssistLoading, setAiAssistLoading] = useState<string | null>(null);
  const [aiAssistPreview, setAiAssistPreview] = useState<{result: string; chapterId: string} | null>(null);
  // Social Media Pilar Plan
  const [socialPilarOpen, setSocialPilarOpen] = useState(false);
  const [socialPilarContent, setSocialPilarContent] = useState('');
  const [socialPilarLoading, setSocialPilarLoading] = useState(false);
  const [socialPilarAngles, setSocialPilarAngles] = useState('4');
  const [socialPilarPerAngle, setSocialPilarPerAngle] = useState('4');
  const [socialPilarBrand, setSocialPilarBrand] = useState('');
  // Thread FB/X Content
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadContent, setThreadContent] = useState('');
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadAngles, setThreadAngles] = useState('3');
  const [threadPerAngle, setThreadPerAngle] = useState('3');
  const [threadType, setThreadType] = useState('storytelling, edukasi, promosi');
  const [threadBrand, setThreadBrand] = useState('');
  // ===== END EDUKAZO =====
  // ===== EXPORT PROTEKSI & PUBLISH =====
  // Export Proteksi
  const [ebProtectionOpen, setEbProtectionOpen] = useState(false);
  const [ebWatermarkEnabled, setEbWatermarkEnabled] = useState(true);
  const [ebWatermarkText, setEbWatermarkText] = useState('');
  const [ebOwnerName, setEbOwnerName] = useState('');
  const [ebAntiCopyEnabled, setEbAntiCopyEnabled] = useState(true);
  const [ebConfidentialEnabled, setEbConfidentialEnabled] = useState(false);
  const [ebProtectionLoading, setEbProtectionLoading] = useState(false);
  // Publish / Baca Online
  const [ebPublishOpen, setEbPublishOpen] = useState(false);
  const [ebPublishHtml, setEbPublishHtml] = useState('');
  const [ebPublishTheme, setEbPublishTheme] = useState<'light' | 'dark'>('light');
  // ===== END EXPORT PROTEKSI & PUBLISH =====
  // ===== SOSMED EXPANSION: IG Caption + Reel Hook =====
  const [igCaptionOpen, setIgCaptionOpen] = useState(false);
  const [igCaptionContent, setIgCaptionContent] = useState('');
  const [igCaptionLoading, setIgCaptionLoading] = useState(false);
  const [igCaptionTone, setIgCaptionTone] = useState('casual');
  const [igCaptionJumlah, setIgCaptionJumlah] = useState('7');
  const [igCaptionBrand, setIgCaptionBrand] = useState('');
  const [reelHookOpen, setReelHookOpen] = useState(false);
  const [reelHookContent, setReelHookContent] = useState('');
  const [reelHookLoading, setReelHookLoading] = useState(false);
  const [reelHookJumlah, setReelHookJumlah] = useState('15');
  // ===== STRATEGI+ EXPANSION: Pricing Ladder + Launch Checklist =====
  const [pricingLadderOpen, setPricingLadderOpen] = useState(false);
  const [pricingLadderContent, setPricingLadderContent] = useState('');
  const [pricingLadderLoading, setPricingLadderLoading] = useState(false);
  const [pricingCorePrice, setPricingCorePrice] = useState('');
  const [launchCheckOpen, setLaunchCheckOpen] = useState(false);
  const [launchCheckContent, setLaunchCheckContent] = useState('');
  const [launchCheckLoading, setLaunchCheckLoading] = useState(false);
  const [launchChannels, setLaunchChannels] = useState('WhatsApp, Instagram');
  const [launchHarga, setLaunchHarga] = useState('');
  const [launchTanggal, setLaunchTanggal] = useState('');
  // ===== IKLAN EXPANSION: TikTok Ads + Google Ads =====
  const [tikTokAdsOpen, setTikTokAdsOpen] = useState(false);
  const [tikTokAdsContent, setTikTokAdsContent] = useState('');
  const [tikTokAdsLoading, setTikTokAdsLoading] = useState(false);
  const [tikTokMasalah, setTikTokMasalah] = useState('');
  const [tikTokSolusi, setTikTokSolusi] = useState('');
  const [tikTokCta, setTikTokCta] = useState('');
  const [tikTokDurasi, setTikTokDurasi] = useState('30');
  const [googleAdsOpen, setGoogleAdsOpen] = useState(false);
  const [googleAdsContent, setGoogleAdsContent] = useState('');
  const [googleAdsLoading, setGoogleAdsLoading] = useState(false);
  const [googleKeywords, setGoogleKeywords] = useState('');
  const [googleBenefit, setGoogleBenefit] = useState('');
  // LP Section Kit
  const [lpSectionOpen, setLpSectionOpen] = useState(false);
  const [lpSectionContent, setLpSectionContent] = useState('');
  const [lpSectionLoading, setLpSectionLoading] = useState(false);
  const [lpSectionActive, setLpSectionActive] = useState<string>('headline');
  // Funnel Blueprint
  const [funnelBpOpen, setFunnelBpOpen] = useState(false);
  const [funnelBpContent, setFunnelBpContent] = useState('');
  const [funnelBpLoading, setFunnelBpLoading] = useState(false);
  // Headline Power Pack
  const [headlinePackOpen, setHeadlinePackOpen] = useState(false);
  const [headlinePackContent, setHeadlinePackContent] = useState('');
  const [headlinePackLoading, setHeadlinePackLoading] = useState(false);
  const [headlinePackNiche, setHeadlinePackNiche] = useState('');
  // Meta Ads Copy Generator
  const [metaAdsOpen, setMetaAdsOpen] = useState(false);
  const [metaAdsContent, setMetaAdsContent] = useState('');
  const [metaAdsLoading, setMetaAdsLoading] = useState(false);
  const [metaAdsPainPoint, setMetaAdsPainPoint] = useState('');
  // WA Closing Script
  const [waClosingOpen, setWaClosingOpen] = useState(false);
  const [waClosingContent, setWaClosingContent] = useState('');
  const [waClosingLoading, setWaClosingLoading] = useState(false);
  const [waClosingGuarantee, setWaClosingGuarantee] = useState('');
  // Scarcity & Batch Pricing Pack
  const [scarcityOpen, setScarcityOpen] = useState(false);
  const [scarcityContent, setScarcityContent] = useState('');
  const [scarcityLoading, setScarcityLoading] = useState(false);
  const [scarcityBatch, setScarcityBatch] = useState('4');
  const [scarcityNextPrice, setScarcityNextPrice] = useState('');
  // VSL Script Generator
  const [vslOpen, setVslOpen] = useState(false);
  const [vslContent, setVslContent] = useState('');
  const [vslLoading, setVslLoading] = useState(false);
  const [vslGuarantee, setVslGuarantee] = useState('');
  // Email Drip Sequence
  const [emailSeqOpen, setEmailSeqOpen] = useState(false);
  const [emailSeqContent, setEmailSeqContent] = useState('');
  const [emailSeqLoading, setEmailSeqLoading] = useState(false);
  // Content Calendar 30 Hari
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarContent, setCalendarContent] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarPlatforms, setCalendarPlatforms] = useState('Instagram, TikTok, LinkedIn, Facebook');
  // SOP Prosedur Generator
  const [sopOpen, setSopOpen] = useState(false);
  const [sopContent, setSopContent] = useState('');
  const [sopLoading, setSopLoading] = useState(false);
  const [sopType, setSopType] = useState('Prosedur Kerja');
  // LinkedIn Thought Leader
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [linkedinContent, setLinkedinContent] = useState('');
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinAngle, setLinkedinAngle] = useState('Insight Profesional');
  // Membership Site Brief
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [membershipContent, setMembershipContent] = useState('');
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipModel, setMembershipModel] = useState('Komunitas + Konten Eksklusif');

  const selectedModel = AI_MODEL_RECOMMENDATIONS.find(m => m.id === selectedAiModel) || AI_MODEL_RECOMMENDATIONS[0];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset next-step dismissal when mode changes
  useEffect(() => {
    setNextStepDismissed(false);
  }, [activeMode]);

  // Persist author name
  useEffect(() => {
    localStorage.setItem('ebb_author_name', authorName);
  }, [authorName]);

  // ── SMART INTEGRATION HELPERS ──────────────────────────────────────────────
  // Extract recommended price from monetization content
  const extractMonetizationPrice = useCallback((): string => {
    if (!monoContent) return '';
    const standarMatch = monoContent.match(/PAKET STANDAR[^R\n]*Rp\s*([0-9.,]+(?:\s*(?:rb|ribu|juta|k|K))?)/i);
    if (standarMatch) return `Rp ${standarMatch[1].trim()}`;
    const anyPrice = monoContent.match(/Rp\s*([0-9.,]+(?:\s*(?:rb|ribu|juta|k|K))?)/);
    if (anyPrice) return `Rp ${anyPrice[1].trim()}`;
    return '';
  }, [monoContent]);

  // Smart bonus suggestions based on what's already generated
  const getSmartBonuses = useCallback((): string => {
    const bonuses: string[] = [];
    if (syllabusContent) {
      const courseName = syllabusContent.match(/NAMA KURSUS:\s*([^\n]+)/)?.[1]?.trim() || 'E-Course Lengkap';
      bonuses.push(`Akses E-Course: ${courseName}`);
    }
    if (quizContent) bonuses.push('19 Soal Kuis Interaktif (PDF)');
    if (podcastContent) bonuses.push('Podcast Script Siap Rekam');
    if (audiobookContent) bonuses.push('Script Audiobook Profesional');
    if (mockupImages.length > 0) bonuses.push('3D Mockup untuk Promosi (PNG)');
    if (mktContent) bonuses.push('Marketing Kit Lengkap (7 Platform)');
    if (coverTplContent) bonuses.push('Cover HTML Template Siap Pakai');
    return bonuses.join('\n');
  }, [syllabusContent, quizContent, podcastContent, audiobookContent, mockupImages, mktContent, coverTplContent]);

  // Extract a short price + CTA summary from LP for chatbot
  const getLpSummary = useCallback((): string => {
    const parts: string[] = [];
    if (lpPrice) parts.push(`Harga: ${lpPrice}`);
    if (lpCTA) parts.push(`Tombol beli: "${lpCTA}"`);
    if (lpBonuses) parts.push(`Bonus: ${lpBonuses.split('\n').slice(0, 3).join(', ')}`);
    return parts.join(' | ');
  }, [lpPrice, lpCTA, lpBonuses]);

  // Compute integration score (0-100) based on key pipeline connections
  const integrationScore = (() => {
    let score = 0;
    if (docContent) score += 15;
    if (syllabusContent) score += 10;
    if (monoContent) score += 15;
    if (lpContent) score += 20;
    if (mktContent) score += 15;
    if (chatMessages.length > 0) score += 10;
    if (lpPrice && monoContent) score += 5;
    if (mockupImages.length > 0 && lpContent) score += 5;
    if (quizContent && syllabusContent) score += 5;
    return Math.min(score, 100);
  })();

  // Computed: pipeline completion
  const pipelineItems = [
    { key: 'chat', label: 'Chatbot Demo', done: chatMessages.length > 0 },
    { key: 'syllabus', label: 'Silabus Kursus', done: !!syllabusContent },
    { key: 'app', label: 'Blueprint App', done: !!appContent },
    { key: 'quiz', label: 'Generator Kuis', done: !!quizContent },
    { key: 'marketing', label: 'Marketing Kit', done: !!mktContent },
    { key: 'script', label: 'Script+TTS', done: !!scriptContent },
    { key: 'thumbnail', label: 'Thumbnail', done: thumbImages.length > 0 },
    { key: 'monetization', label: 'Monetisasi', done: !!monoContent },
    { key: 'review', label: 'AI Review', done: !!reviewContent },
    { key: 'podcast', label: 'Podcast Script', done: !!podcastContent },
    { key: 'audiobook', label: 'Audiobook', done: !!audiobookContent },
    { key: 'landing', label: 'Landing Page', done: !!lpContent },
    { key: 'cover', label: 'Cover Template', done: !!coverTplContent },
    { key: 'mockup', label: 'Mockup 3D', done: mockupImages.length > 0 },
  ];
  const completedCount = pipelineItems.filter(i => i.done).length;

  // Export Bundle: download all outputs as one TXT file
  const handleExportBundle = useCallback(async () => {
    setExportLoading(true);
    const sections: string[] = [];
    const sep = '\n\n' + '='.repeat(60) + '\n\n';
    const title = projectTitle || projectTopik || 'Chaesa AI Studio';
    sections.push(`📦 EXPORT BUNDLE — ${title}\nDibuat dengan Chaesa AI Studio\nTanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n${authorName ? `Penulis: ${authorName}` : ''}`);
    if (docContent) sections.push(`📄 KONTEN EBOOK\n${sep.trim()}\n${docContent}`);
    if (mktContent) sections.push(`📣 MARKETING KIT\n${sep.trim()}\n${mktContent}`);
    if (scriptContent) sections.push(`🎬 SCRIPT VIDEO\n${sep.trim()}\n${scriptContent}`);
    if (monoContent) sections.push(`💰 STRATEGI MONETISASI\n${sep.trim()}\n${monoContent}`);
    if (reviewContent) sections.push(`🔍 AI QUALITY REVIEW\n${sep.trim()}\n${reviewContent}`);
    if (podcastContent) sections.push(`🎙️ PODCAST SCRIPT\n${sep.trim()}\n${podcastContent}`);
    if (audiobookContent) sections.push(`🎧 AUDIOBOOK SCRIPT\n${sep.trim()}\n${audiobookContent}`);
    if (lpContent) sections.push(`🌐 LANDING PAGE\n${sep.trim()}\n${lpContent}`);
    if (syllabusContent) sections.push(`🎓 SILABUS KURSUS\n${sep.trim()}\n${syllabusContent}`);
    if (appContent) sections.push(`📱 BLUEPRINT APP\n${sep.trim()}\n${appContent}`);
    if (quizContent) sections.push(`📝 GENERATOR KUIS\n${sep.trim()}\n${quizContent}`);
    if (risetContent) sections.push(`🔍 RISET TOPIK\n${sep.trim()}\n${risetContent}`);
    const bundle = sections.join(sep);
    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-bundle.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
    toast({ description: `Bundle ${sections.length - 1} output berhasil diunduh!` });
  }, [projectTitle, projectTopik, authorName, docContent, mktContent, scriptContent, monoContent, reviewContent, podcastContent, audiobookContent, lpContent, syllabusContent, appContent, quizContent, risetContent, toast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast({
        title: "Prompt berhasil disalin!",
        description: "Paste ke DokumenTender AI atau AI lainnya.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Gagal menyalin",
        description: "Silakan pilih teks secara manual dan copy.",
        variant: "destructive",
      });
    }
  };

  const handleCopyDoc = async () => {
    try {
      await navigator.clipboard.writeText(docContent);
      setIsDocCopied(true);
      toast({ title: "Dokumen berhasil disalin!" });
      setTimeout(() => setIsDocCopied(false), 2000);
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  const handleDownloadDoc = () => {
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokumen-ebook.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = useCallback(() => {
    if (!docContent) return;
    const title = projectTitle || projectTopik || 'Dokumen Ebook';
    const filename = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
    const lines = docContent.split('\n');
    const mdLines = lines.map(line => {
      const t = line.trim();
      if (!t) return '';
      const isH1 = t.length < 100 && (
        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR)\s/i.test(t) ||
        (t === t.toUpperCase() && t.length > 3 && t.length < 60)
      );
      const isH2 = /^[0-9]+\.\s|^[IVX]+\.\s/i.test(t) && t.length < 80;
      if (isH1) return `\n# ${t}\n`;
      if (isH2) return `\n## ${t}\n`;
      if (t.startsWith('-') || t.startsWith('•')) return t.replace(/^[•-]\s*/, '- ');
      return t;
    });
    const md = `# ${title}\n\n*Generated by Chaesa AI Studio*\n\n---\n\n${mdLines.join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.md`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Markdown berhasil didownload!' });
  }, [docContent, projectTitle, projectTopik, toast]);

  const handleDownloadHTML = useCallback(() => {
    if (!docContent) return;
    const title = projectTitle || projectTopik || 'Dokumen Ebook';
    const filename = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
    const lines = docContent.split('\n');

    const headers: { text: string; id: string }[] = [];
    const bodyHtml = lines.map((rawLine, i) => {
      const t = rawLine.trim();
      if (!t) return '<br>';
      const isH1 = t.length < 100 && (
        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR)\s/i.test(t) ||
        (t === t.toUpperCase() && t.length > 3 && t.length < 60)
      );
      const isH2 = /^[0-9]+\.\s|^[IVX]+\.\s/.test(t) && t.length < 80;
      if (isH1) {
        const id = `section-${i}`;
        headers.push({ text: t, id });
        return `<h2 id="${id}">${t}</h2>`;
      }
      if (isH2) return `<h3>${t}</h3>`;
      if (t.startsWith('-') || t.startsWith('•')) return `<li>${t.replace(/^[•-]\s*/, '')}</li>`;
      return `<p>${t}</p>`;
    }).join('\n');

    const toc = headers.length > 0 ? `
      <nav class="toc">
        <h3>Daftar Isi</h3>
        <ol>${headers.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ol>
      </nav>` : '';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.8; color: #1a1a1a; }
  h1 { font-size: 2.2em; border-bottom: 3px solid #2563eb; padding-bottom: 12px; color: #1e40af; }
  h2 { font-size: 1.5em; color: #1e40af; margin-top: 2em; border-left: 4px solid #2563eb; padding-left: 12px; }
  h3 { font-size: 1.2em; color: #374151; margin-top: 1.5em; }
  p { margin: 1em 0; text-align: justify; }
  li { margin: 0.4em 0; }
  .toc { background: #f0f4ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px 28px; margin: 2em 0; }
  .toc h3 { color: #1e40af; margin-top: 0; }
  .toc a { color: #2563eb; text-decoration: none; } .toc a:hover { text-decoration: underline; }
  .toc ol { margin: 0.5em 0 0; padding-left: 20px; }
  .footer { margin-top: 4em; border-top: 1px solid #e5e7eb; padding-top: 1em; text-align: center; color: #9ca3af; font-size: 0.85em; font-family: sans-serif; }
</style>
</head>
<body>
<h1>${title}</h1>
${toc}
<div class="content">
${bodyHtml}
</div>
<div class="footer">Generated by Chaesa AI Studio</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.html`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'HTML berhasil didownload!', description: 'Buka file .html di browser untuk preview.' });
  }, [docContent, projectTitle, projectTopik, toast]);

  const handleDownloadPDF = useCallback(() => {
    if (!docContent) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const textW = pageW - margin * 2;

    const title = projectTitle || projectTopik || 'Dokumen Ebook';
    const filename = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40);

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 55, 'F');
    doc.setFillColor(29, 78, 216);
    doc.rect(0, 45, pageW, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(title, textW);
    doc.text(titleLines.slice(0, 2), margin, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text('Generated by Chaesa AI Studio', margin, 43);

    doc.setTextColor(30, 30, 30);
    let y = 68;
    const rawLines = docContent.split('\n');

    for (const rawLine of rawLines) {
      const line = rawLine.trim();

      const isHeader = line.length > 0 && line.length < 80 && (
        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR|[IVX]+\.|[0-9]+\.)/i.test(line) ||
        line === line.toUpperCase()
      );

      if (isHeader && line) {
        if (y > pageH - 40) { addFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        const wrapped = doc.splitTextToSize(line, textW);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 6 + 3;
        doc.setTextColor(30, 30, 30);
      } else if (line === '') {
        y += 3;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        const wrapped = doc.splitTextToSize(line, textW);
        for (const wl of wrapped) {
          if (y > pageH - 25) { addFooter(doc, pageW, pageH, margin); doc.addPage(); y = 20; }
          doc.text(wl, margin, y);
          y += 5.5;
        }
      }
    }

    addFooter(doc, pageW, pageH, margin);
    doc.save(`${filename}.pdf`);
    toast({ title: 'PDF berhasil didownload!' });
  }, [docContent, projectTitle, projectTopik, toast]);

  const streamSSE = async (
    url: string,
    body: object,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (msg: string) => void
  ) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 429) {
        try { const d = await response.json(); setPlanLimitInfo({ used: d.used, limit: d.limit }); setPlanLimitOpen(true); } catch {}
      } else {
        onError('Gagal menghubungi server');
      }
      return;
    }
    const reader = response.body?.getReader();
    if (!reader) { onError('Tidak ada response'); return; }
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const data = JSON.parse(line.slice(5).trim());
          if (data.error) { onError(data.error); return; }
          if (data.done) { onDone(); return; }
          if (data.content) onChunk(data.content);
        } catch { /* ignore */ }
      }
    }
    onDone();
  };

  const handleGenerateMarketingKit = useCallback(async () => {
    setMktOpen(true);
    setMktContent('');
    setMktLoading(true);
    // Auto-detect price from monetization content or LP config
    const detectedPrice = lpPrice || (monoContent ? monoContent.match(/PAKET STANDAR[^R\n]*Rp\s*([0-9.,]+(?:\s*(?:rb|ribu|juta|k|K))?)/i)?.[0]?.match(/Rp\s*[0-9.,]+/)?.[0] || '' : '');
    try {
      await streamSSE(
        '/api/generate-marketing-kit',
        {
          title: projectTitle || projectTopik,
          topik: projectTopik,
          docSummary: docContent.slice(0, 600),
          price: detectedPrice || 'Hubungi penjual',
          authorName: authorName || '',
          bonuses: lpBonuses ? lpBonuses.split('\n').filter(Boolean).slice(0, 5).join(', ') : '',
        },
        (chunk) => setMktContent(prev => prev + chunk),
        () => setMktLoading(false),
        (err) => { setMktLoading(false); toast({ title: err, variant: 'destructive' }); }
      );
    } catch {
      setMktLoading(false);
      toast({ title: 'Gagal membuat Marketing Kit', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, docContent, lpPrice, monoContent, authorName, lpBonuses, toast]);

  const handleGenerateScript = useCallback(async () => {
    if (!docContent) return;
    setScriptOpen(true);
    setScriptContent('');
    setScriptLoading(true);
    setScriptTab('script');
    try {
      await streamSSE(
        '/api/generate-script',
        { title: projectTitle || projectTopik, docContent },
        (chunk) => setScriptContent(prev => prev + chunk),
        () => setScriptLoading(false),
        (err) => { setScriptLoading(false); toast({ title: err, variant: 'destructive' }); }
      );
    } catch {
      setScriptLoading(false);
      toast({ title: 'Gagal membuat Script', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, docContent, toast]);

  const handleGenerateYoutubeSEO = useCallback(async () => {
    setSeoContent('');
    setSeoLoading(true);
    setScriptTab('seo');
    try {
      await streamSSE(
        '/api/generate-youtube-seo',
        { title: projectTitle || projectTopik, topik: projectTopik, docSummary: docContent.slice(0, 300) },
        (chunk) => setSeoContent(prev => prev + chunk),
        () => setSeoLoading(false),
        (err) => { setSeoLoading(false); toast({ title: err, variant: 'destructive' }); }
      );
    } catch {
      setSeoLoading(false);
    }
  }, [projectTitle, projectTopik, docContent, toast]);

  const handleGenerateThumbnail = useCallback(async () => {
    setThumbOpen(true);
    setThumbImages([]);
    setThumbLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-thumbnail', {
        title: projectTitle || projectTopik,
        topik: projectTopik,
      });
      const data = await res.json();
      setThumbImages(data.imageUrls || []);
    } catch {
      toast({ title: 'Gagal membuat thumbnail', variant: 'destructive' });
    } finally {
      setThumbLoading(false);
    }
  }, [projectTitle, projectTopik, toast]);

  const handleRisetEbook = useCallback(async () => {
    if (!risetQuery.trim()) { toast({ title: 'Masukkan kata kunci atau URL terlebih dulu', variant: 'destructive' }); return; }
    setRisetContent('');
    setRisetLoading(true);
    try {
      const response = await fetch('/api/research-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: risetType, query: risetQuery, industry: projectTopik }),
      });
      if (!response.ok) throw new Error('Server error');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            if (parsed.content) setRisetContent(p => p + parsed.content);
            if (parsed.done) break;
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Gagal melakukan riset', variant: 'destructive' });
    } finally {
      setRisetLoading(false);
    }
  }, [risetQuery, risetType, projectTopik, toast]);

  const handleGenerateMockup = useCallback(async () => {
    setMockupImages([]);
    setMockupLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-mockup', {
        title: projectTitle || projectTopik,
        author: authorName,
        style: mockupStyle,
      });
      const data = await res.json();
      setMockupImages(data.imageUrls || []);
    } catch {
      toast({ title: 'Gagal membuat mockup 3D', variant: 'destructive' });
    } finally {
      setMockupLoading(false);
    }
  }, [projectTitle, projectTopik, authorName, mockupStyle, toast]);

  // ===== EBOOK BUILDER HANDLERS =====
  const handleGenerateEbOutline = useCallback(async () => {
    setEbOutlineOpen(true);
    setEbOutlineContent('');
    setEbOutlineLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-ebook-outline', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        authorName,
        totalChapters: ebOutlineChapters,
      });
      const data = await res.json();
      setEbOutlineContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat outline ebook', variant: 'destructive' });
    } finally {
      setEbOutlineLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, authorName, ebOutlineChapters, toast]);

  const handleGenerateChapter = useCallback(async (chapterId: string) => {
    markEcoUsed('ebook');
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return;
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, loading: true, content: '' } : c));
    try {
      const res = await apiRequest('POST', '/api/generate-chapter', {
        topik: projectTopik,
        judul: projectTitle,
        chapterTitle: ch.title || `Bab ${ch.number}`,
        chapterNumber: ch.number,
        subTopics: ch.subTopics,
        target: '',
        authorName,
        tone: chapterTone,
        wordCount: 800,
      });
      const data = await res.json();
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, content: data.content || '', loading: false } : c));
    } catch {
      toast({ title: `Gagal generate bab ${ch.number}`, variant: 'destructive' });
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, loading: false } : c));
    }
  }, [chapters, projectTopik, projectTitle, authorName, chapterTone, toast]);

  const handleAddChapter = useCallback(() => {
    const newId = String(Date.now());
    const newNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) + 1 : 1;
    setChapters(prev => [...prev, { id: newId, number: newNum, title: '', subTopics: '', content: '', loading: false }]);
    setActiveChapterId(newId);
  }, [chapters]);

  const handleRemoveChapter = useCallback((id: string) => {
    setChapters(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return filtered.map((c, i) => ({ ...c, number: i + 1 }));
    });
  }, []);

  const handleExpandChapter = useCallback(async (chapterId: string) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch || !ch.content) { toast({ title: 'Generate bab dulu sebelum memperpanjang', variant: 'destructive' }); return; }
    setExpandLoading(chapterId);
    try {
      const res = await apiRequest('POST', '/api/expand-chapter', {
        existingContent: ch.content,
        chapterTitle: ch.title,
        chapterNumber: ch.number,
        wordCount: expandWordsCount,
        tone: chapterTone,
        topik: projectTopik,
      });
      const data = await res.json();
      if (data.content) {
        setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, content: c.content + '\n\n' + data.content } : c));
        toast({ title: `Bab ${ch.number} berhasil diperpanjang!` });
      }
    } catch {
      toast({ title: 'Gagal memperpanjang bab', variant: 'destructive' });
    } finally {
      setExpandLoading(null);
    }
  }, [chapters, expandWordsCount, chapterTone, projectTopik, toast]);

  const handleCustomRegenChapter = useCallback(async (chapterId: string) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return;
    if (customRegenAdditions.length === 0) { toast({ title: 'Pilih minimal 1 elemen yang ingin ditambahkan', variant: 'destructive' }); return; }
    setCustomRegenLoading(chapterId);
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, loading: true } : c));
    try {
      const res = await apiRequest('POST', '/api/regenerate-chapter-custom', {
        existingContent: ch.content,
        chapterTitle: ch.title || `Bab ${ch.number}`,
        chapterNumber: ch.number,
        additions: customRegenAdditions,
        topik: projectTopik,
        tone: chapterTone,
        wordCount: 900,
      });
      const data = await res.json();
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, content: data.content || c.content, loading: false } : c));
      toast({ title: `Bab ${ch.number} berhasil di-upgrade!` });
    } catch {
      toast({ title: 'Gagal regenerate bab', variant: 'destructive' });
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, loading: false } : c));
    } finally {
      setCustomRegenLoading(null);
    }
  }, [chapters, customRegenAdditions, chapterTone, projectTopik, toast]);

  const toggleCustomAddition = useCallback((key: string) => {
    setCustomRegenAdditions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const handleImageSearch = useCallback(async (query?: string, page = 1) => {
    const q = query ?? imageQuery;
    if (!q.trim()) return;
    setImageQuery(q);
    setImageSearchLoading(true);
    setImageSearchPage(page);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(q)}&page=${page}`);
      const data = await res.json();
      setImageResults(data.results || []);
      setImageTotal(data.total || 0);
    } catch {
      toast({ title: 'Gagal mencari gambar', variant: 'destructive' });
    } finally {
      setImageSearchLoading(false);
    }
  }, [imageQuery, toast]);

  // ===== DISTRIBUSI HANDLERS =====
  const handlePlatformListing = useCallback(async () => {
    markEcoUsed('distribusi');
    setPlatformListingLoading(true);
    setPlatformListingOpen(true);
    try {
      const res = await apiRequest('POST', '/api/generate-platform-listing', {
        title: projectTitle,
        topik: projectTopik,
        authorName: localStorage.getItem('ebb_author_name') || '',
        monoContent: monoContent,
      });
      const data = await res.json();
      setPlatformListingContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate Platform Listing', variant: 'destructive' });
    } finally {
      setPlatformListingLoading(false);
    }
  }, [projectTitle, projectTopik, monoContent, toast]);

  const handleResellerKit = useCallback(async () => {
    setResellerKitLoading(true);
    setResellerKitOpen(true);
    try {
      const res = await apiRequest('POST', '/api/generate-reseller-kit', {
        title: projectTitle,
        topik: projectTopik,
        authorName: localStorage.getItem('ebb_author_name') || '',
        monoContent: monoContent,
      });
      const data = await res.json();
      setResellerKitContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate Reseller Kit', variant: 'destructive' });
    } finally {
      setResellerKitLoading(false);
    }
  }, [projectTitle, projectTopik, monoContent, toast]);

  const handleContentRepurposing = useCallback(async () => {
    setRepurposingLoading(true);
    setRepurposingOpen(true);
    try {
      const outlineCtx = ebOutlineContent?.slice(0, 1200) || '';
      const chapCtx = chapters.filter(c => c.content).map(c => `BAB ${c.number}: ${c.title}\n${c.content?.slice(0, 300)}`).join('\n\n').slice(0, 1200);
      const res = await apiRequest('POST', '/api/generate-content-repurposing', {
        title: projectTitle,
        topik: projectTopik,
        outlineContent: outlineCtx || chapCtx,
        authorName: localStorage.getItem('ebb_author_name') || '',
      });
      const data = await res.json();
      setRepurposingContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate Content Repurposing', variant: 'destructive' });
    } finally {
      setRepurposingLoading(false);
    }
  }, [projectTitle, projectTopik, ebOutlineContent, chapters, toast]);
  // ===== END DISTRIBUSI HANDLERS =====

  // ===== EDUKAZO HANDLERS =====
  const handleAiTextAssist = useCallback(async (chapterId: string, text: string, operation: string) => {
    if (!text.trim()) {
      toast({ title: 'Pilih atau ketik teks terlebih dahulu', variant: 'destructive' });
      return;
    }
    setAiAssistLoading(operation + '_' + chapterId);
    try {
      const res = await apiRequest('POST', '/api/ai-text-assist', {
        text,
        operation,
        topik: projectTopik,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiAssistPreview({ result: data.result || '', chapterId });
    } catch (err: any) {
      toast({ title: 'Gagal: ' + (err?.message || 'Error AI Assist'), variant: 'destructive' });
    } finally {
      setAiAssistLoading(null);
    }
  }, [projectTopik, toast]);

  const handleApplyAiAssist = useCallback((chapterId: string) => {
    if (!aiAssistPreview) return;
    setChapters(prev => prev.map(c =>
      c.id === chapterId ? { ...c, content: aiAssistPreview.result } : c
    ));
    setAiAssistPreview(null);
    toast({ title: 'Konten berhasil diperbarui!' });
  }, [aiAssistPreview]);

  const handleSocialPilar = useCallback(async () => {
    setSocialPilarLoading(true);
    setSocialPilarOpen(true);
    setSocialPilarContent('');
    try {
      const res = await apiRequest('POST', '/api/generate-social-pilar', {
        topik: projectTopik,
        title: projectTitle,
        brandInfo: socialPilarBrand,
        numAngles: socialPilarAngles,
        contentPerAngle: socialPilarPerAngle,
        authorName: localStorage.getItem('ebb_author_name') || '',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSocialPilarContent(data.content || '');
    } catch (err: any) {
      toast({ title: 'Gagal: ' + (err?.message || 'Error Social Pilar'), variant: 'destructive' });
    } finally {
      setSocialPilarLoading(false);
    }
  }, [projectTopik, projectTitle, socialPilarBrand, socialPilarAngles, socialPilarPerAngle, toast]);

  const handleThreadContent = useCallback(async () => {
    setThreadLoading(true);
    setThreadOpen(true);
    setThreadContent('');
    try {
      const res = await apiRequest('POST', '/api/generate-thread-content', {
        topik: projectTopik,
        title: projectTitle,
        brandInfo: threadBrand,
        contentType: threadType,
        numAngles: threadAngles,
        contentPerAngle: threadPerAngle,
        authorName: localStorage.getItem('ebb_author_name') || '',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setThreadContent(data.content || '');
    } catch (err: any) {
      toast({ title: 'Gagal: ' + (err?.message || 'Error Thread Content'), variant: 'destructive' });
    } finally {
      setThreadLoading(false);
    }
  }, [projectTopik, projectTitle, threadBrand, threadType, threadAngles, threadPerAngle, toast]);
  // ===== END EDUKAZO HANDLERS =====

  // ===== EXPORT PROTEKSI HANDLER =====
  const handleExportProtected = useCallback(() => {
    const chaptersWithContent = chapters.filter(c => c.content);
    const allContent = chaptersWithContent.map(c => `BAB ${c.number}: ${c.title}\n\n${c.content}`).join('\n\n---\n\n');
    const content = allContent || docContent || '';
    if (!content.trim()) {
      toast({ title: 'Belum ada konten untuk di-export', variant: 'destructive' });
      return;
    }
    setEbProtectionLoading(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const textW = pageW - margin * 2;
      const title = projectTitle || projectTopik || 'Ebook Digital';
      const owner = ebOwnerName.trim() || 'Pemilik Ebook';
      const wmText = ebWatermarkText.trim() || owner;
      const filename = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40);

      // Cover page
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageW, pageH, 'F');
      // accent bar
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 6, pageH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      const titleLines = doc.splitTextToSize(title, textW - 10);
      doc.text(titleLines.slice(0, 3), margin + 10, 60);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(167, 139, 250);
      doc.text(`by ${owner}`, margin + 10, 60 + titleLines.slice(0, 3).length * 10 + 8);

      if (ebAntiCopyEnabled) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        const notice = `Dokumen ini dilindungi hak cipta dan bersifat RAHASIA. Dilarang keras menyalin, mendistribusikan, atau menjual ulang tanpa izin tertulis dari ${owner}. Pelanggaran dapat dikenakan sanksi hukum berdasarkan UU No. 28 Tahun 2014 tentang Hak Cipta.`;
        const noticeLines = doc.splitTextToSize(notice, textW - 10);
        doc.text(noticeLines, margin + 10, pageH - 35);
      }

      if (ebConfidentialEnabled) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38);
        doc.text('RAHASIA — HANYA UNTUK PEMILIK', margin + 10, pageH - 50);
      }

      if (ebWatermarkEnabled) addWatermark(doc, pageW, pageH, wmText);

      // Content pages
      doc.addPage();
      let y = 20;
      const rawLines = content.split('\n');
      for (const rawLine of rawLines) {
        const line = rawLine.trim();
        const isHeader = line.length > 0 && line.length < 80 && (
          /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|[IVX]+\.|[0-9]+\.)/i.test(line) || line === line.toUpperCase()
        );
        if (isHeader && line) {
          if (y > pageH - 40) {
            addFooter(doc, pageW, pageH, margin, owner);
            if (ebWatermarkEnabled) addWatermark(doc, pageW, pageH, wmText);
            doc.addPage(); y = 20;
          }
          y += 4;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(79, 70, 229);
          const wrapped = doc.splitTextToSize(line, textW);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 7 + 3;
          doc.setTextColor(30, 30, 30);
        } else if (line === '') {
          y += 3;
        } else {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
          const wrapped = doc.splitTextToSize(line, textW);
          for (const wl of wrapped) {
            if (y > pageH - 25) {
              addFooter(doc, pageW, pageH, margin, owner);
              if (ebWatermarkEnabled) addWatermark(doc, pageW, pageH, wmText);
              doc.addPage(); y = 20;
            }
            doc.text(wl, margin, y); y += 5.5;
          }
        }
      }
      addFooter(doc, pageW, pageH, margin, owner);
      if (ebWatermarkEnabled) addWatermark(doc, pageW, pageH, wmText);

      doc.save(`${filename}-protected.pdf`);
      toast({ title: '✅ Ebook Terproteksi berhasil di-download!', description: `Watermark: "${wmText}" | Pemilik: ${owner}` });
      setEbProtectionOpen(false);
    } catch (err: any) {
      toast({ title: 'Gagal export: ' + (err?.message || 'Error'), variant: 'destructive' });
    } finally {
      setEbProtectionLoading(false);
    }
  }, [chapters, docContent, projectTitle, projectTopik, ebOwnerName, ebWatermarkText, ebWatermarkEnabled, ebAntiCopyEnabled, ebConfidentialEnabled, toast]);

  // ===== PUBLISH / BACA ONLINE HANDLER =====
  const handleGeneratePublishView = useCallback(() => {
    const chaptersWithContent = chapters.filter(c => c.content);
    const title = projectTitle || projectTopik || 'Ebook Digital';
    const author = ebOwnerName.trim() || localStorage.getItem('ebb_author_name') || 'Chaesa AI Studio';
    const isDark = ebPublishTheme === 'dark';
    const bg = isDark ? '#0f172a' : '#f8fafc';
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const text = isDark ? '#e2e8f0' : '#1e293b';
    const muted = isDark ? '#94a3b8' : '#64748b';
    const accent = '#6366f1';
    const border = isDark ? '#334155' : '#e2e8f0';

    const tocItems = chaptersWithContent.map(c =>
      `<li><a href="#bab-${c.id}" style="color:${accent};text-decoration:none;display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid ${border};font-size:14px;">
        <span style="color:${muted};font-family:monospace;font-size:12px;min-width:32px">BAB ${c.number}</span>
        <span>${c.title || `Bab ${c.number}`}</span>
      </a></li>`
    ).join('');

    const chapterHtml = chaptersWithContent.map(c => {
      const words = c.content ? c.content.trim().split(/\s+/).length : 0;
      const mins = Math.ceil(words / 200);
      const content = (c.content || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,'<em>$1</em>')
        .replace(/\n/g,'<br>');
      return `<article id="bab-${c.id}" style="margin-bottom:48px;scroll-margin-top:80px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="background:${accent};color:#fff;font-family:monospace;font-size:11px;padding:4px 10px;border-radius:20px;white-space:nowrap">BAB ${c.number}</div>
          <h2 style="margin:0;font-size:22px;font-weight:700;color:${text}">${c.title || `Bab ${c.number}`}</h2>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px;color:${muted};font-size:12px;">
          <span>📖 ${words.toLocaleString('id')} kata</span>
          <span>⏱️ ~${mins} menit baca</span>
        </div>
        <div style="line-height:1.9;font-size:15px;color:${text}">${content}</div>
      </article>`;
    }).join(`<hr style="border:0;border-top:1px solid ${border};margin:32px 0;">`);

    const totalWords = chaptersWithContent.reduce((sum, c) => sum + (c.content ? c.content.trim().split(/\s+/).length : 0), 0);
    const totalMins = Math.ceil(totalWords / 200);

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${bg};color:${text};font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
  #progress-bar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,${accent},#ec4899);width:0%;z-index:9999;transition:width 0.1s}
  #navbar{position:fixed;top:3px;left:0;right:0;background:${cardBg};border-bottom:1px solid ${border};z-index:999;padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between}
  #toc-sidebar{position:fixed;left:0;top:55px;width:280px;height:calc(100vh - 55px);overflow-y:auto;background:${cardBg};border-right:1px solid ${border};padding:20px;transform:translateX(-100%);transition:transform 0.25s;z-index:998}
  #toc-sidebar.open{transform:translateX(0)}
  #main-content{max-width:720px;margin:0 auto;padding:80px 24px 60px;transition:margin-left 0.25s}
  #main-content.shifted{margin-left:280px}
  .toc-btn{background:${accent};color:#fff;border:0;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}
  .cover{text-align:center;padding:60px 20px 48px;margin-bottom:40px;background:linear-gradient(135deg,${isDark?'#1e1b4b':'#eef2ff'} 0%,${isDark?'#0f172a':'#f0fdf4'} 100%);border-radius:16px;border:1px solid ${border}}
  .cover h1{font-size:clamp(24px,4vw,40px);font-weight:800;margin-bottom:12px;background:linear-gradient(135deg,${accent},#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .cover .author{color:${muted};font-size:14px;margin-bottom:16px}
  .cover .stats{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
  .cover .stat{background:${isDark?'#334155':'#f1f5f9'};border:1px solid ${border};border-radius:8px;padding:10px 18px;font-size:13px}
  @media(max-width:600px){#toc-sidebar{width:240px}#main-content.shifted{margin-left:0}}
</style>
</head>
<body>
<div id="progress-bar"></div>
<div id="navbar">
  <div style="display:flex;align-items:center;gap:12px">
    <button class="toc-btn" onclick="toggleToc()">☰ Daftar Isi</button>
    <span style="font-weight:700;font-size:14px;color:${text};max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</span>
  </div>
  <div style="color:${muted};font-size:12px">by ${author}</div>
</div>
<div id="toc-sidebar">
  <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:${text}">📚 Daftar Isi</div>
  <ul style="list-style:none">${tocItems}</ul>
</div>
<div id="main-content">
  <div class="cover">
    <h1>${title}</h1>
    <div class="author">✍️ by ${author}</div>
    <div class="stats">
      <div class="stat">📖 ${chaptersWithContent.length} Bab</div>
      <div class="stat">📝 ${totalWords.toLocaleString('id')} Kata</div>
      <div class="stat">⏱️ ~${totalMins} Menit Baca</div>
    </div>
  </div>
  ${chapterHtml || `<div style="text-align:center;padding:60px 20px;color:${muted}"><div style="font-size:48px;margin-bottom:16px">📝</div><p>Belum ada konten bab. Generate bab di Chapter Builder terlebih dahulu.</p></div>`}
  <div style="text-align:center;padding:40px 0;color:${muted};font-size:12px;border-top:1px solid ${border}">
    Dibuat dengan <strong style="color:${accent}">Chaesa AI Studio</strong> · © ${author}
  </div>
</div>
<script>
  window.addEventListener('scroll',function(){
    var el=document.getElementById('progress-bar');
    var h=document.documentElement.scrollHeight-window.innerHeight;
    el.style.width=(h>0?(window.scrollY/h*100):0)+'%';
  });
  var tocOpen=false;
  function toggleToc(){
    tocOpen=!tocOpen;
    var s=document.getElementById('toc-sidebar');
    var m=document.getElementById('main-content');
    if(tocOpen){s.classList.add('open');m.classList.add('shifted');}
    else{s.classList.remove('open');m.classList.remove('shifted');}
  }
</script>
</body>
</html>`;
    setEbPublishHtml(html);
  }, [chapters, projectTitle, projectTopik, ebOwnerName, ebPublishTheme]);
  // ===== END PUBLISH HANDLER =====

  // ===== SOSMED HANDLERS =====
  const handleIgCaption = useCallback(async () => {
    markEcoUsed('sosmed');
    setIgCaptionOpen(true);
    setIgCaptionContent('');
    setIgCaptionLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-ig-caption', {
        topik: projectTopik, judul: projectTitle,
        tone: igCaptionTone, jumlah: igCaptionJumlah, brand: igCaptionBrand,
      });
      const data = await res.json();
      setIgCaptionContent(data.content || '');
    } catch { toast({ title: 'Gagal generate IG Caption Pack', variant: 'destructive' }); }
    finally { setIgCaptionLoading(false); }
  }, [projectTopik, projectTitle, igCaptionTone, igCaptionJumlah, igCaptionBrand, toast]);

  const handleReelHook = useCallback(async () => {
    setReelHookOpen(true);
    setReelHookContent('');
    setReelHookLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-reel-hook', {
        topik: projectTopik, judul: projectTitle, jumlahHook: reelHookJumlah,
      });
      const data = await res.json();
      setReelHookContent(data.content || '');
    } catch { toast({ title: 'Gagal generate Reels/TikTok Hook', variant: 'destructive' }); }
    finally { setReelHookLoading(false); }
  }, [projectTopik, projectTitle, reelHookJumlah, toast]);

  // ===== STRATEGI+ HANDLERS =====
  const handlePricingLadder = useCallback(async () => {
    setPricingLadderOpen(true);
    setPricingLadderContent('');
    setPricingLadderLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-pricing-ladder', {
        topik: projectTopik, judul: projectTitle, corePrice: pricingCorePrice,
      });
      const data = await res.json();
      setPricingLadderContent(data.content || '');
    } catch { toast({ title: 'Gagal generate Pricing Ladder', variant: 'destructive' }); }
    finally { setPricingLadderLoading(false); }
  }, [projectTopik, projectTitle, pricingCorePrice, toast]);

  const handleLaunchChecklist = useCallback(async () => {
    setLaunchCheckOpen(true);
    setLaunchCheckContent('');
    setLaunchCheckLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-launch-checklist', {
        topik: projectTopik, judul: projectTitle,
        channels: launchChannels, hargaLaunch: launchHarga, tanggalLaunch: launchTanggal,
      });
      const data = await res.json();
      setLaunchCheckContent(data.content || '');
    } catch { toast({ title: 'Gagal generate Launch Checklist', variant: 'destructive' }); }
    finally { setLaunchCheckLoading(false); }
  }, [projectTopik, projectTitle, launchChannels, launchHarga, launchTanggal, toast]);

  // ===== IKLAN HANDLERS =====
  const handleTikTokAds = useCallback(async () => {
    markEcoUsed('iklan');
    setTikTokAdsOpen(true);
    setTikTokAdsContent('');
    setTikTokAdsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-tiktok-ads', {
        topik: projectTopik, judul: projectTitle,
        masalah: tikTokMasalah, solusi: tikTokSolusi, cta: tikTokCta, durasi: tikTokDurasi,
      });
      const data = await res.json();
      setTikTokAdsContent(data.content || '');
    } catch { toast({ title: 'Gagal generate TikTok Ads Script', variant: 'destructive' }); }
    finally { setTikTokAdsLoading(false); }
  }, [projectTopik, projectTitle, tikTokMasalah, tikTokSolusi, tikTokCta, tikTokDurasi, toast]);

  const handleGoogleAds = useCallback(async () => {
    markEcoUsed('iklan');
    setGoogleAdsOpen(true);
    setGoogleAdsContent('');
    setGoogleAdsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-google-ads', {
        topik: projectTopik, judul: projectTitle,
        keywords: googleKeywords, benefit: googleBenefit,
      });
      const data = await res.json();
      setGoogleAdsContent(data.content || '');
    } catch { toast({ title: 'Gagal generate Google Search Ads', variant: 'destructive' }); }
    finally { setGoogleAdsLoading(false); }
  }, [projectTopik, projectTitle, googleKeywords, googleBenefit, toast]);

  const handleGenerateEbTemplate = useCallback(async () => {
    setEbTemplateOpen(true);
    setEbTemplateHtml('');
    setEbTemplateLoading(true);
    try {
      const chaptersForTemplate = chapters
        .filter(c => c.title.trim())
        .map(c => ({ number: c.number, title: c.title, preview: c.content }));
      const res = await apiRequest('POST', '/api/generate-ebook-template', {
        judul: projectTitle,
        subJudul: projectTopik,
        authorName,
        chapters: chaptersForTemplate.length > 0 ? chaptersForTemplate : undefined,
        theme: ebTheme,
        accentColor: ebAccentColor || undefined,
      });
      const data = await res.json();
      setEbTemplateHtml(data.html || '');
    } catch {
      toast({ title: 'Gagal generate template ebook', variant: 'destructive' });
    } finally {
      setEbTemplateLoading(false);
    }
  }, [projectTitle, projectTopik, authorName, chapters, ebTheme, ebAccentColor, toast]);
  // ===== END EBOOK BUILDER HANDLERS =====

  const handleGenerateLpSection = useCallback(async (section: string) => {
    markEcoUsed('landing');
    setLpSectionActive(section);
    setLpSectionOpen(true);
    setLpSectionContent('');
    setLpSectionLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-lp-section-kit', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        section,
      });
      const data = await res.json();
      setLpSectionContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat LP section', variant: 'destructive' });
    } finally {
      setLpSectionLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, toast]);

  const handleGenerateFunnelBlueprint = useCallback(async () => {
    setFunnelBpOpen(true);
    setFunnelBpContent('');
    setFunnelBpLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-funnel-blueprint', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        funnelType: 'Meta Ads → LP → WA Closing → Upsell',
      });
      const data = await res.json();
      setFunnelBpContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat funnel blueprint', variant: 'destructive' });
    } finally {
      setFunnelBpLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, toast]);

  const handleGenerateHeadlinePack = useCallback(async () => {
    setHeadlinePackOpen(true);
    setHeadlinePackContent('');
    setHeadlinePackLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-headline-pack', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        niche: headlinePackNiche,
      });
      const data = await res.json();
      setHeadlinePackContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat headline pack', variant: 'destructive' });
    } finally {
      setHeadlinePackLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, headlinePackNiche, toast]);

  const handleGenerateMetaAds = useCallback(async () => {
    setMetaAdsOpen(true);
    setMetaAdsContent('');
    setMetaAdsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-meta-ads', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        painPoint: metaAdsPainPoint,
        objective: 'Konversi — mendorong klik ke landing page',
      });
      const data = await res.json();
      setMetaAdsContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat Meta Ads copy', variant: 'destructive' });
    } finally {
      setMetaAdsLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, metaAdsPainPoint, toast]);

  const handleGenerateWaClosing = useCallback(async () => {
    setWaClosingOpen(true);
    setWaClosingContent('');
    setWaClosingLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-wa-closing', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        guarantee: waClosingGuarantee,
      });
      const data = await res.json();
      setWaClosingContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat WA closing script', variant: 'destructive' });
    } finally {
      setWaClosingLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, waClosingGuarantee, toast]);

  const handleGenerateScarcity = useCallback(async () => {
    setScarcityOpen(true);
    setScarcityContent('');
    setScarcityLoading(true);
    try {
      const price = extractMonetizationPrice(monoContent);
      const res = await apiRequest('POST', '/api/generate-scarcity-pack', {
        prompt,
        topik: projectTopik,
        judul: projectTitle,
        price,
        batchNumber: scarcityBatch,
        nextBatchPrice: scarcityNextPrice,
        deadline: '48 jam lagi',
      });
      const data = await res.json();
      setScarcityContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat scarcity pack', variant: 'destructive' });
    } finally {
      setScarcityLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, scarcityBatch, scarcityNextPrice, toast]);

  const handleGenerateVsl = useCallback(async () => {
    setVslOpen(true);
    setVslContent('');
    setVslLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-vsl', {
        prompt: prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        guarantee: vslGuarantee,
        painPoint: '',
      });
      const data = await res.json();
      setVslContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat VSL script', variant: 'destructive' });
    } finally {
      setVslLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, vslGuarantee, toast]);

  const handleGenerateEmailSeq = useCallback(async () => {
    setEmailSeqOpen(true);
    setEmailSeqContent('');
    setEmailSeqLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-email-sequence', {
        prompt: prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        price: extractMonetizationPrice(monoContent),
        authorName,
        painPoint: '',
      });
      const data = await res.json();
      setEmailSeqContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat email sequence', variant: 'destructive' });
    } finally {
      setEmailSeqLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, monoContent, authorName, toast]);

  const handleGenerateCalendar = useCallback(async () => {
    setCalendarOpen(true);
    setCalendarContent('');
    setCalendarLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-content-calendar', {
        prompt: prompt,
        topik: projectTopik,
        judul: projectTitle,
        target: '',
        platforms: calendarPlatforms,
      });
      const data = await res.json();
      setCalendarContent(data.content || '');
    } catch {
      toast({ title: 'Gagal membuat content calendar', variant: 'destructive' });
    } finally {
      setCalendarLoading(false);
    }
  }, [prompt, projectTopik, projectTitle, calendarPlatforms, toast]);

  const handleGenerateSop = useCallback(async () => {
    markEcoUsed('sop');
    setSopOpen(true);
    setSopContent('');
    setSopLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-sop', {
        projectData: { topik: projectTopik, judul: projectTitle, target: '', industry: '' },
        sopType,
      });
      const data = await res.json();
      setSopContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate SOP', variant: 'destructive' });
    } finally {
      setSopLoading(false);
    }
  }, [projectTopik, projectTitle, sopType, toast]);

  const handleGenerateLinkedin = useCallback(async () => {
    markEcoUsed('sosmed');
    setLinkedinOpen(true);
    setLinkedinContent('');
    setLinkedinLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-linkedin', {
        projectData: { topik: projectTopik, judul: projectTitle, target: '', bigIdea: '', tujuan: '' },
        articleAngle: linkedinAngle,
      });
      const data = await res.json();
      setLinkedinContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate LinkedIn Article', variant: 'destructive' });
    } finally {
      setLinkedinLoading(false);
    }
  }, [projectTopik, projectTitle, linkedinAngle, toast]);

  const handleGenerateMembership = useCallback(async () => {
    markEcoUsed('membership');
    setMembershipOpen(true);
    setMembershipContent('');
    setMembershipLoading(true);
    try {
      const res = await apiRequest('POST', '/api/generate-membership', {
        projectData: { topik: projectTopik, judul: projectTitle, target: '', bigIdea: '', produk: '' },
        membershipModel,
      });
      const data = await res.json();
      setMembershipContent(data.content || '');
    } catch {
      toast({ title: 'Gagal generate Membership Brief', variant: 'destructive' });
    } finally {
      setMembershipLoading(false);
    }
  }, [projectTopik, projectTitle, membershipModel, toast]);

  const handleReviewDocument = useCallback(async () => {
    if (!docContent) { toast({ title: 'Generate dokumen dulu sebelum review', variant: 'destructive' }); return; }
    setReviewOpen(true);
    setReviewContent('');
    setReviewLoading(true);
    try {
      const response = await fetch('/api/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: projectTitle || projectTopik, docContent }),
      });
      if (!response.ok) throw new Error('Server error');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.content) setReviewContent(prev => prev + d.content);
            if (d.done) setReviewLoading(false);
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Gagal melakukan review dokumen', variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  }, [docContent, projectTitle, projectTopik, toast]);

  const handleTextToSpeech = useCallback(async () => {
    if (!scriptContent) { toast({ title: 'Buat script narasi dulu', variant: 'destructive' }); return; }
    setTtsLoading(true);
    if (ttsAudioUrl) { URL.revokeObjectURL(ttsAudioUrl); setTtsAudioUrl(''); }
    try {
      // Strip [JEDA] and [PENEKANAN] tags for clean TTS
      const cleanText = scriptContent.replace(/\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: ttsVoice }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setTtsAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setTtsPlaying(true);
      }
    } catch {
      toast({ title: 'Gagal membuat audio narasi', variant: 'destructive' });
    } finally {
      setTtsLoading(false);
    }
  }, [scriptContent, ttsVoice, ttsAudioUrl, toast]);

  // Generic SSE helper
  const fetchSSE = useCallback(async (url: string, body: object, onChunk: (text: string) => void, onDone: () => void) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
      if (response.status === 429) {
        try { const d = await response.json(); setPlanLimitInfo({ used: d.used, limit: d.limit }); } catch {}
        setPlanLimitOpen(true);
      }
      throw new Error('Server error');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const d = JSON.parse(line.slice(5).trim());
          if (d.content) onChunk(d.content);
          if (d.done) onDone();
        } catch {}
      }
    }
  }, []);

  const handleChatDemo = useCallback(async () => {
    markEcoUsed('chatbot');
    const parts: string[] = [];
    parts.push(`Kamu adalah AI Assistant ahli tentang topik "${projectTitle || projectTopik}". Bantu calon pembeli, peserta kursus, atau siapa pun yang penasaran dengan produk digital ini.`);
    if (authorName) parts.push(`Ebook ini ditulis oleh ${authorName}.`);
    if (docContent) parts.push(`\n📖 KONTEN EBOOK:\n${docContent.slice(0, 2500)}`);
    if (syllabusContent) parts.push(`\n🎓 STRUKTUR E-COURSE:\n${syllabusContent.slice(0, 800)}`);
    if (quizContent) parts.push(`\n❓ KUIS & SOAL:\n${quizContent.slice(0, 400)}`);
    if (monoContent) parts.push(`\n💰 STRATEGI MONETISASI & HARGA:\n${monoContent.slice(0, 700)}`);
    if (mktContent) parts.push(`\n📣 MARKETING & PROMOSI:\n${mktContent.slice(0, 400)}`);
    // Landing Page integration: provide price, bonuses, CTA info
    if (lpContent || lpPrice) {
      const lpSummary: string[] = [];
      if (lpPrice) lpSummary.push(`Harga produk: ${lpPrice}`);
      if (lpCTA) lpSummary.push(`Tombol pembelian: "${lpCTA}"`);
      if (lpBonuses) lpSummary.push(`Bonus yang ditawarkan: ${lpBonuses.split('\n').slice(0, 5).join(', ')}`);
      if (lpContent) lpSummary.push(`\nKonten landing page:\n${lpContent.slice(0, 600)}`);
      parts.push(`\n🌐 INFO LANDING PAGE & PEMBELIAN:\n${lpSummary.join('\n')}`);
    }
    parts.push(`\n---\nInstruksi: Jawab pertanyaan dengan ramah, informatif, dan berbasis data di atas. Jika ditanya soal harga → info dari monetisasi/landing page. Jika ditanya soal kursus → info dari silabus. Jika ditanya cara beli → berikan info CTA dan harga. Selalu fokus pada topik "${projectTitle || projectTopik}".`);
    if (!docContent && !syllabusContent && !monoContent && !lpContent) {
      parts.length = 0;
      parts.push(`Kamu adalah AI Assistant ahli tentang "${projectTitle || projectTopik}". ${prompt.slice(0, 1000)}`);
    }
    const sysPrompt = parts.join(' ');
    setChatSystemPrompt(sysPrompt);
    const dataSources = [
      docContent && 'konten ebook',
      syllabusContent && 'silabus e-course',
      quizContent && 'kuis',
      monoContent && 'harga & monetisasi',
      mktContent && 'marketing kit',
      (lpContent || lpPrice) && 'landing page & info beli',
    ].filter(Boolean);
    const detectedPrice = extractMonetizationPrice() || lpPrice;
    const greeting = dataSources.length > 0
      ? `Halo! Saya AI Assistant untuk ebook **"${projectTitle || projectTopik}"**${authorName ? ` oleh ${authorName}` : ''}.\n\nSaya sudah terhubung dengan: **${dataSources.join(', ')}**.\n\n${detectedPrice ? `💰 Harga: **${detectedPrice}**` : ''}\n\nTanyakan apa saja tentang materi, harga, cara beli, kursus, atau pemasarannya! 😊`
      : `Halo! Saya AI Assistant untuk ebook **"${projectTitle || projectTopik}"**. Saya siap menjawab pertanyaan kamu. Ada yang ingin ditanyakan? 😊`;
    setChatMessages([{ role: 'assistant', content: greeting }]);
    setChatOpen(true);
  }, [docContent, syllabusContent, quizContent, monoContent, mktContent, lpContent, lpPrice, lpCTA, lpBonuses, projectTitle, projectTopik, prompt, authorName, extractMonetizationPrice]);

  const handleGenerateGPTs = useCallback(() => {
    const topikFinal = projectTopik || projectTitle;
    if (!topikFinal) {
      toast({ title: 'Isi topik / judul proyek terlebih dahulu', variant: 'destructive' });
      return;
    }
    setGptsConfigOpen(true);
  }, [projectTopik, projectTitle, toast]);

  const doGenerateGPTs = useCallback(async () => {
    const topikFinal = projectTopik || projectTitle;
    markEcoUsed('chatbot');
    setGptsConfigOpen(false);
    setGptsOpen(true);
    setGptsContent('');
    setGptsLoading(true);
    setGptsTab('instruksi');
    try {
      await fetchSSE('/api/generate-gpts', {
        title: projectTitle || topikFinal,
        topik: topikFinal,
        target: projectTarget,
        authorName,
        docContent: docContent?.slice(0, 3000),
        syllabusContent: syllabusContent?.slice(0, 1000),
        monoContent: monoContent?.slice(0, 800),
        lpContent: lpContent?.slice(0, 600),
        lpPrice,
        gptsNama: gptsNama || undefined,
        gptsTujuan,
        gptsGaya,
        gptsCapabilities,
        gptsBatasan: gptsBatasan || undefined,
        gptsOutputFormat: gptsOutputFormat || undefined,
        gptsPersonality: gptsPersonality || undefined,
        gptsMonetize,
        gptsLanguage,
      },
        (chunk) => setGptsContent(prev => prev + chunk),
        () => setGptsLoading(false)
      );
    } catch {
      toast({ title: 'Gagal generate konfigurasi GPTs', variant: 'destructive' });
    } finally { setGptsLoading(false); }
  }, [projectTitle, projectTopik, projectTarget, authorName, docContent, syllabusContent, monoContent, lpContent, lpPrice, gptsNama, gptsTujuan, gptsGaya, gptsCapabilities, gptsBatasan, gptsOutputFormat, gptsPersonality, gptsMonetize, gptsLanguage, fetchSSE, toast]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user' as const, content: chatInput.trim() };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);
    let reply = '';
    const assistantMsg = { role: 'assistant' as const, content: '' };
    setChatMessages(prev => [...prev, assistantMsg]);
    try {
      await fetchSSE('/api/chat-demo', { systemPrompt: chatSystemPrompt, messages: newMsgs }, (chunk) => {
        reply += chunk;
        setChatMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: reply } : m));
      }, () => { setChatLoading(false); });
    } catch {
      toast({ title: 'Gagal mengirim pesan', variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, chatSystemPrompt, fetchSSE, toast]);

  const handleGenerateSyllabus = useCallback(async (duration?: string, format?: string, goal?: string) => {
    const topikFinal = projectTopik || projectTitle;
    if (!topikFinal) {
      toast({ title: 'Isi topik / judul proyek terlebih dahulu', description: 'Silabus Kursus membutuhkan topik proyek sebagai konteks.', variant: 'destructive' });
      return;
    }
    markEcoUsed('ecourse');
    setSyllabusConfigOpen(false);
    setSyllabusOpen(true);
    setSyllabusContent('');
    setSyllabusLoading(true);
    setSyllabusTab('overview');
    try {
      await fetchSSE('/api/generate-course-syllabus',
        {
          title: projectTitle || topikFinal,
          topik: topikFinal,
          target: projectTarget,
          courseDuration: duration || syllabusConfigDuration,
          courseFormat: format || syllabusConfigFormat,
          courseGoal: goal || syllabusConfigGoal,
        },
        (chunk) => setSyllabusContent(prev => prev + chunk),
        () => setSyllabusLoading(false)
      );
    } catch {
      toast({ title: 'Gagal generate silabus kursus', variant: 'destructive' });
    } finally { setSyllabusLoading(false); }
  }, [projectTitle, projectTopik, projectTarget, syllabusConfigDuration, syllabusConfigFormat, syllabusConfigGoal, fetchSSE, toast]);

  const handleGenerateMiniApp = useCallback(() => {
    const topikFinal = projectTopik || projectTitle;
    if (!topikFinal) {
      toast({ title: 'Isi topik / judul proyek terlebih dahulu', description: 'Blueprint Mini App membutuhkan topik proyek sebagai konteks.', variant: 'destructive' });
      return;
    }
    setAppConfigOpen(true);
  }, [projectTitle, projectTopik, toast]);

  const saveAppToHistory = useCallback((content: string, config: { appType: string; appPlatform: string; appLang: string; appComplexity: string }) => {
    if (!content || content.length < 100) return;
    const typeLabel = config.appType === 'auto' ? 'Auto' : config.appType;
    const platLabel = config.appPlatform === 'web' ? 'Web' : config.appPlatform === 'pwa' ? 'PWA' : config.appPlatform === 'static' ? 'HTML' : 'WA Bot';
    const complexLabel = config.appComplexity === 'simple' ? '🟢' : config.appComplexity === 'advanced' ? '🔴' : '🟡';
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const item: { id: string; label: string; appType: string; appPlatform: string; appLang: string; appComplexity: string; content: string; createdAt: string } = {
      id: Date.now().toString(),
      label: `${complexLabel} ${typeLabel} · ${platLabel} · ${dateStr} ${timeStr}`,
      appType: config.appType,
      appPlatform: config.appPlatform,
      appLang: config.appLang,
      appComplexity: config.appComplexity,
      content,
      createdAt: new Date().toISOString(),
    };
    setAppHistory(prev => {
      const newHistory = [...prev, item].slice(-10);
      try { localStorage.setItem('chaesa_miniapp_history', JSON.stringify(newHistory)); } catch {}
      return newHistory;
    });
    setAppViewingId(item.id);
    const totalAfter = Math.min((appHistory.length) + 1, 10);
    if (appHistory.length >= 9) {
      toast({ title: `📦 Blueprint ke-${totalAfter} disimpan (slot terlama ditimpa)`, description: 'Riwayat penuh — ekspor blueprint lama agar tidak hilang.' });
    } else {
      toast({ title: `✅ Blueprint disimpan ke riwayat (${totalAfter}/10)`, description: 'Bisa dilihat kembali kapan saja dari panel riwayat.' });
    }
  }, [appHistory.length, toast]);

  const doGenerateMiniApp = useCallback(async () => {
    const topikFinal = projectTopik || projectTitle;
    const currentConfig = { appType, appPlatform, appLang, appComplexity };
    markEcoUsed('miniapp');
    setAppConfigOpen(false);
    setAppOpen(true);
    setAppContent('');
    setAppViewingId(null);
    setAppLoading(true);
    setAppTab('konsep');
    let collectedContent = '';
    try {
      await fetchSSE('/api/generate-mini-app',
        {
          title: projectTitle || topikFinal,
          topik: topikFinal,
          target: projectTarget,
          docContent: docContent?.slice(0, 3000),
          syllabusContent: syllabusContent?.slice(0, 1000),
          appType,
          appPlatform,
          appNeedAI,
          appLang,
          appFiturWajib: appFiturWajib || undefined,
          appIntegrasi: appIntegrasi || undefined,
          appComplexity,
        },
        (chunk) => { collectedContent += chunk; setAppContent(prev => prev + chunk); },
        () => {
          setAppLoading(false);
          saveAppToHistory(collectedContent, currentConfig);
        }
      );
    } catch {
      toast({ title: 'Gagal generate blueprint mini app', variant: 'destructive' });
    } finally { setAppLoading(false); }
  }, [projectTitle, projectTopik, projectTarget, docContent, syllabusContent, appType, appPlatform, appNeedAI, appLang, appFiturWajib, appIntegrasi, appComplexity, fetchSSE, toast, saveAppToHistory]);

  const handleGenerateQuiz = useCallback(async (level?: string, focus?: string) => {
    setQuizConfigOpen(false);
    setQuizOpen(true);
    setQuizContent('');
    setQuizLoading(true);
    setQuizTab('mcq');
    try {
      await fetchSSE('/api/generate-quiz',
        {
          title: projectTitle || projectTopik,
          topik: projectTopik,
          target: projectTarget,
          docContent: docContent?.slice(0, 2000),
          level: level || quizConfigLevel,
          focus: focus || quizConfigFocus,
        },
        (chunk) => setQuizContent(prev => prev + chunk),
        () => setQuizLoading(false)
      );
    } catch {
      toast({ title: 'Gagal generate kuis', variant: 'destructive' });
    } finally { setQuizLoading(false); }
  }, [projectTitle, projectTopik, projectTarget, docContent, quizConfigLevel, quizConfigFocus, fetchSSE, toast]);

  const handleGeneratePodcastScript = useCallback(async (config?: {host?: string; guest?: string; style?: string; length?: string; segments?: string}) => {
    const topikFallback = projectTopik || projectTitle || prompt.split(/[,.:!?]/)[0].slice(0, 80) || 'Ebook Digital Indonesia';
    setPodcastOpen(true);
    setPodcastContent('');
    setPodcastLoading(true);
    setPodcastTab('script');
    try {
      await fetchSSE(
        '/api/generate-podcast-script',
        {
          title: projectTitle || topikFallback,
          topik: topikFallback,
          target: projectTarget,
          docContent: docContent.slice(0, 1500),
          podcastHost: config?.host,
          podcastGuest: config?.guest,
          podcastStyle: config?.style,
          podcastEpisodeLength: config?.length,
          podcastSegments: config?.segments,
        },
        (chunk) => setPodcastContent(prev => prev + chunk),
        () => setPodcastLoading(false),
      );
    } catch {
      setPodcastLoading(false);
      toast({ title: 'Gagal membuat podcast script', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, projectTarget, docContent, prompt, fetchSSE, toast]);

  const handleGenerateAudiobookScript = useCallback(async (config?: {narrator?: string; tone?: string; pace?: string; chapterFocus?: string; emphasis?: string}) => {
    // Fallback: extract topic from prompt if projectTopik empty
    const topikFallback = projectTopik || projectTitle || prompt.split(/[,.:!?]/)[0].slice(0, 80) || 'Ebook Digital Indonesia';
    setAudiobookOpen(true);
    setAudiobookContent('');
    setAudiobookLoading(true);
    setAudiobookTab('script');
    try {
      await fetchSSE(
        '/api/generate-audiobook-script',
        {
          title: projectTitle || topikFallback,
          topik: topikFallback,
          target: projectTarget,
          docContent: docContent.slice(0, 2000),
          audiobookNarrator: config?.narrator,
          audiobookTone: config?.tone,
          audiobookPace: config?.pace,
          audiobookChapterFocus: config?.chapterFocus,
          audiobookEmphasis: config?.emphasis,
        },
        (chunk) => setAudiobookContent(prev => prev + chunk),
        () => setAudiobookLoading(false),
      );
    } catch {
      setAudiobookLoading(false);
      toast({ title: 'Gagal membuat audiobook script', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, projectTarget, docContent, prompt, fetchSSE, toast]);

  const handleGenerateLandingPage = useCallback(async (config?: {style?: string; goal?: string; price?: string; bonuses?: string; cta?: string; outputFormat?: string}) => {
    setLpOpen(true);
    setLpContent('');
    setLpLoading(true);
    setLpTab('copy');
    setLpOutputFormat(config?.outputFormat || 'copy');
    try {
      await fetchSSE(
        '/api/generate-landing-page',
        {
          title: projectTitle || projectTopik,
          topik: projectTopik,
          target: projectTarget,
          author: authorName || undefined,
          mockupUrl: mockupImages[0] || undefined,
          syllabusSnippet: syllabusContent ? syllabusContent.slice(0, 500) : undefined,
          docContent: docContent.slice(0, 1500),
          landingPageStyle: config?.style ?? lpStyle,
          landingPageGoal: config?.goal ?? lpGoal,
          landingPagePrice: config?.price ?? lpPrice,
          landingPageHargaCoret: lpHargaCoret || undefined,
          landingPageBonuses: config?.bonuses ?? lpBonuses,
          landingPageCTA: config?.cta ?? lpCTA,
          landingPageOutputFormat: config?.outputFormat ?? lpOutputFormat,
          landingPageProblem: lpProblem || undefined,
          landingPageKondisi: lpKondisi || undefined,
          landingPageSolusi: lpSolusi || undefined,
          landingPageValueProp: lpValueProp || undefined,
          landingPageManfaat: lpManfaat || undefined,
          landingPageKredibilitas: lpKredibilitas || undefined,
          landingPageGaransi: lpGaransi || undefined,
        },
        (chunk) => setLpContent(prev => prev + chunk),
        () => setLpLoading(false),
      );
    } catch {
      setLpLoading(false);
      toast({ title: 'Gagal membuat landing page', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, projectTarget, authorName, mockupImages, syllabusContent, docContent, lpStyle, lpGoal, lpPrice, lpHargaCoret, lpBonuses, lpCTA, lpOutputFormat, lpProblem, lpKondisi, lpSolusi, lpValueProp, lpManfaat, lpKredibilitas, lpGaransi, fetchSSE, toast]);

  const handleGenerateCoverTemplate = useCallback(async (opts?: {author?: string; colorScheme?: string; style?: string}) => {
    setCoverTplOpen(true);
    setCoverTplContent('');
    setCoverTplLoading(true);
    setCoverTplTab('preview');
    const author = opts?.author ?? coverTplAuthor ?? authorName;
    const colorScheme = opts?.colorScheme ?? coverTplColorScheme;
    const style = opts?.style ?? coverTplStyle;
    try {
      await fetchSSE(
        '/api/generate-cover-template',
        {
          title: projectTitle || projectTopik,
          topik: projectTopik,
          target: projectTarget,
          author: author || authorName || 'Chaesa AI Studio',
          industry: projectTopik,
          colorScheme,
          style,
        },
        (chunk) => setCoverTplContent(prev => prev + chunk),
        () => setCoverTplLoading(false),
      );
    } catch {
      setCoverTplLoading(false);
      toast({ title: 'Gagal generate cover template', variant: 'destructive' });
    }
  }, [projectTitle, projectTopik, projectTarget, coverTplAuthor, coverTplColorScheme, coverTplStyle, fetchSSE, toast]);

  const handleGenerateMonetization = useCallback(async () => {
    setMonoOpen(true);
    setMonoContent('');
    setMonoLoading(true);
    setMonoTab('harga');
    try {
      const response = await fetch('/api/generate-monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: projectTitle || projectTopik, topik: projectTopik, target: projectTarget }),
      });
      if (!response.ok) throw new Error('Server error');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.content) setMonoContent(prev => prev + d.content);
            if (d.done) setMonoLoading(false);
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Gagal generate strategi monetisasi', variant: 'destructive' });
    } finally {
      setMonoLoading(false);
    }
  }, [projectTitle, projectTopik, projectTarget, toast]);

  const handleGenerateDocument = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt kosong",
        description: "Isi form terlebih dahulu sebelum generate dokumen.",
        variant: "destructive",
      });
      return;
    }
    setDocConfigOpen(true);
  }, [prompt, toast]);

  const doGenerateDocument = useCallback(async () => {
    setDocConfigOpen(false);
    setDocContent('');
    setDocError('');
    setImageInserts({});
    setIsGenerating(true);
    setIsDocDialogOpen(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: projectTitle || projectTopik,
          topik: projectTopik,
          target: projectTarget,
          authorName,
          docKategori,
          docJenisISO,
          docStandar,
          docKlausul,
          docNomorDok,
          docVersi,
          docTanggalEfektif,
          docNamaOrg,
          docDepartemen,
          docLingkup,
          docDetailLevel,
          docBahasa,
          docCustomInstruksi,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          try { const d = await response.json(); setPlanLimitInfo({ used: d.used, limit: d.limit }); } catch {}
          setPlanLimitOpen(true);
          setIsDocDialogOpen(false);
          return;
        }
        throw new Error('Gagal menghubungi server');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Tidak ada response');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.content) {
              setDocContent(prev => prev + event.content);
            }
            if (event.error) {
              setDocError(event.error);
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setDocError('Terjadi kesalahan saat membuat dokumen. Silakan coba lagi.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, projectTitle, projectTopik, projectTarget, authorName, docKategori, docJenisISO, docStandar, docKlausul, docNomorDok, docVersi, docTanggalEfektif, docNamaOrg, docDepartemen, docLingkup, docDetailLevel, docBahasa, docCustomInstruksi, toast]);

  const handleRegenerate = useCallback(async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    onRegenerate();
    await new Promise(r => setTimeout(r, 600));
    setIsRegenerating(false);
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = 0;
    }
    toast({
      title: "Prompt diperbarui!",
      description: "Prompt telah di-generate ulang berdasarkan data form terkini.",
    });
  }, [onRegenerate, toast]);

  const handleCloseDocDialog = () => {
    abortRef.current?.abort();
    setIsDocDialogOpen(false);
  };

  const handleDownloadDocx = useCallback(async () => {
    if (!docContent) return;

    const title = projectTitle || projectTopik || 'Dokumen Ebook';
    const rawLines = docContent.split('\n');
    const docParagraphs: Paragraph[] = [];

    docParagraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
    docParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Generated by Chaesa AI Studio', color: '888888', size: 18, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      })
    );

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) {
        docParagraphs.push(new Paragraph({ text: '' }));
        continue;
      }

      const isHeader = line.length < 100 && (
        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR|[IVX]+\.|[0-9]+\.)/i.test(line) ||
        line === line.toUpperCase()
      );

      if (isHeader) {
        docParagraphs.push(
          new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
      } else {
        docParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docParagraphs }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'DOCX berhasil didownload!' });
  }, [docContent, projectTitle, projectTopik, toast]);

  const handleOpenImagePicker = useCallback(async (paragraphIdx: number, context: string, type: 'illustration' | 'infographic' = 'illustration') => {
    setImgPickerIdx(paragraphIdx);
    setImgPickerType(type);
    setImgPickerOpen(true);
    setPickerImages([]);
    setImgPickerLoading(true);
    try {
      const response = await apiRequest('POST', '/api/generate-images', { context: context.slice(0, 300), type });
      const data = await response.json();
      setPickerImages(data.imageUrls || []);
    } catch {
      toast({ title: 'Gagal generate gambar', variant: 'destructive' });
    } finally {
      setImgPickerLoading(false);
    }
  }, [toast]);

  const handlePickImage = useCallback((url: string) => {
    setImageInserts(prev => ({ ...prev, [imgPickerIdx]: url }));
    setImgPickerOpen(false);
    toast({ title: 'Gambar berhasil disisipkan!', description: 'Gambar ditambahkan ke dokumen.' });
  }, [imgPickerIdx, toast]);

  const handleRemoveImage = useCallback((idx: number) => {
    setImageInserts(prev => { const n = { ...prev }; delete n[idx]; return n; });
  }, []);

  const parseSlides = useCallback((content: string) => {
    const lines = content.split('\n');
    const slides: { title: string; bullets: string[]; imageUrl?: string }[] = [];
    let current: { title: string; bullets: string[] } | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const isHeader = line.length < 100 && (
        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR|[IVX]+\.|[0-9]+\.|#{1,3}\s)/i.test(line) ||
        (line === line.toUpperCase() && line.length > 3)
      );

      if (isHeader) {
        if (current) slides.push(current);
        current = { title: line.replace(/^#{1,3}\s/, ''), bullets: [] };
      } else if (current) {
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          current.bullets.push(line.replace(/^[-•*]\s*/, ''));
        } else {
          current.bullets.push(line);
        }
      } else {
        current = { title: 'Pendahuluan', bullets: [line] };
      }
    }
    if (current) slides.push(current);
    return slides.length > 0 ? slides : [{ title: 'Dokumen', bullets: content.split('\n').filter(Boolean).slice(0, 10) }];
  }, []);

  const slides = parseSlides(docContent);
  const currentSlide = slides[slideIndex] || slides[0];

  const wordCount = prompt.split(/\s+/).filter(Boolean).length;
  const charCount = prompt.length;

  function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let ki = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(<span key={ki++}>{text.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={ki++} className="font-bold">{m[2]}</strong>);
      else if (m[3]) parts.push(<strong key={ki++} className="font-bold">{m[3]}</strong>);
      else if (m[4]) parts.push(<strong key={ki++} className="font-bold">{m[4]}</strong>);
      else if (m[5]) parts.push(<em key={ki++} className="italic">{m[5]}</em>);
      else if (m[6]) parts.push(<em key={ki++} className="italic">{m[6]}</em>);
      else if (m[7]) parts.push(<code key={ki++} className="bg-muted text-foreground font-mono text-xs px-1 py-0.5 rounded">{m[7]}</code>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(<span key={ki++}>{text.slice(last)}</span>);
    return parts.length === 1 && typeof parts[0] !== 'string' ? parts[0] : <>{parts}</>;
  }

  function parseDocBlocks(content: string) {
    const lines = content.split('\n');
    type Block =
      | { type: 'empty'; lineIdx: number }
      | { type: 'heading'; level: number; text: string; lineIdx: number }
      | { type: 'hr'; lineIdx: number }
      | { type: 'list'; ordered: boolean; items: { text: string; lineIdx: number }[] }
      | { type: 'table'; header: string[]; rows: string[][]; lineIdx: number }
      | { type: 'paragraph'; text: string; lineIdx: number };
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i];
      const t = raw.trim();
      if (t === '') {
        blocks.push({ type: 'empty', lineIdx: i });
        i++;
      } else if (/^#{1,6} /.test(t)) {
        const lvl = t.match(/^(#+)/)![1].length;
        blocks.push({ type: 'heading', level: lvl, text: t.replace(/^#+\s*/, ''), lineIdx: i });
        i++;
      } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
        blocks.push({ type: 'hr', lineIdx: i });
        i++;
      } else if (/^\|/.test(t)) {
        const tableLineIdx = i;
        const tableLines: string[] = [];
        while (i < lines.length && /^\|/.test(lines[i].trim())) {
          tableLines.push(lines[i]);
          i++;
        }
        const parseRow = (row: string) =>
          row.split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).map(c => c.trim());
        const nonSep = tableLines.filter(l => !/^[\|\s\-:]+$/.test(l));
        if (nonSep.length >= 1) {
          const [headerLine, ...dataLines] = nonSep;
          blocks.push({ type: 'table', header: parseRow(headerLine), rows: dataLines.map(parseRow), lineIdx: tableLineIdx });
        }
      } else if (/^(\s*[-*+] |\s*\d+\. )/.test(raw)) {
        const ordered = /^\s*\d+\. /.test(raw);
        const items: { text: string; lineIdx: number }[] = [];
        while (i < lines.length && /^(\s*[-*+] |\s*\d+\. )/.test(lines[i])) {
          const lineText = lines[i].trim().replace(/^[-*+]\s*/, '').replace(/^\d+\.\s*/, '');
          items.push({ text: lineText, lineIdx: i });
          i++;
        }
        blocks.push({ type: 'list', ordered, items });
      } else {
        blocks.push({ type: 'paragraph', text: t, lineIdx: i });
        i++;
      }
    }
    return blocks;
  }

  const promptContent = (
    <Textarea
      ref={textAreaRef}
      value={prompt}
      readOnly
      className="min-h-[400px] font-mono text-sm resize-none bg-muted/30"
      data-testid="textarea-prompt-output"
    />
  );

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">Generated Prompt</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {wordCount} kata | {charCount} karakter
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(true)}
                data-testid="button-fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex-1 min-h-0">
            {promptContent}
          </div>

          <div className="flex flex-col gap-3">
            {onRegenerate && (
              <Button
                size="lg"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                data-testid="button-generate"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Prompt
                  </>
                )}
              </Button>
            )}

            <Button
              size="lg"
              onClick={handleGenerateDocument}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              data-testid="button-generate-document"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Membuat Dokumen...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Dokumen
                  <span className="ml-1 flex items-center gap-1 text-xs bg-white/20 rounded px-1.5 py-0.5">
                    <Monitor className="h-3 w-3" />
                    + Presentasi
                  </span>
                </span>
              )}
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1"
                data-testid="button-copy-prompt"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Salin Prompt
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Workflow pipeline + Next Step */}
          {activeMode && (() => {
            const currentStep = WORKFLOW_STEPS.find(s => s.id === activeMode);
            const nextStep = activeMode ? NEXT_STEP_MAP[activeMode] : null;
            return (
              <div className="pt-4 border-t space-y-3">
                {/* Mini pipeline */}
                <div className="flex items-center gap-1 flex-wrap">
                  {WORKFLOW_STEPS.map((step, i) => {
                    const isActive = step.id === activeMode;
                    const isDone = currentStep && step.phase < currentStep.phase;
                    return (
                      <button
                        key={step.id}
                        onClick={() => onModeChange?.(step.id)}
                        title={step.id}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border",
                          isActive ? "bg-primary text-primary-foreground border-primary scale-105 shadow-sm" :
                          isDone ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700" :
                          "bg-muted text-muted-foreground border-border hover:border-primary/40"
                        )}
                      >
                        {isDone ? '✓ ' : ''}{step.label}
                      </button>
                    );
                  })}
                </div>
                {/* Next step card */}
                {nextStep && onModeChange && !nextStepDismissed && (
                  <div className={`relative rounded-xl overflow-hidden border border-primary/20`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${nextStep.color} opacity-[0.07]`} />
                    <div className="relative flex items-center gap-3 px-3 py-2.5">
                      <Rocket className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">Langkah Berikutnya: {nextStep.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{nextStep.desc}</p>
                      </div>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${nextStep.color} text-white text-xs h-7 px-3 shrink-0`}
                        onClick={() => onModeChange(nextStep.next)}
                        data-testid={`button-next-step-${nextStep.next.toLowerCase()}`}
                      >
                        Lanjut →
                      </Button>
                      <button onClick={() => setNextStepDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Ekosistem Section */}
          <div className="pt-4 border-t space-y-3">
            {/* Header + Progress Tracker */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-300/50 via-cyan-300/50 to-purple-300/50" />
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-1">Ekosistem Ebook</span>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-300/50 via-cyan-300/50 to-indigo-300/50" />
              </div>
              {/* Pipeline Progress Bar */}
              <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    Pipeline: {completedCount}/{pipelineItems.length} output
                    {integrationScore >= 60 && <span className="ml-1 text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded">⚡ Skor Integrasi {integrationScore}%</span>}
                  </span>
                  <div className="flex gap-1">
                    {completedCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                        onClick={() => setEcoHubOpen(true)}
                        data-testid="button-eco-hub"
                      >
                        🔗 Ecosystem Hub
                      </Button>
                    )}
                    {completedCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                        onClick={handleExportBundle}
                        disabled={exportLoading}
                        data-testid="button-export-bundle"
                      >
                        {exportLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                        Unduh
                      </Button>
                    )}
                  </div>
                </div>
                <div className="w-full bg-indigo-200/50 dark:bg-indigo-800/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / pipelineItems.length) * 100}%` }}
                  />
                </div>
                {/* Integration connections display */}
                {integrationScore > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {pipelineItems.filter(i => i.done).map(i => (
                        <span key={i.key} className="text-[9px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">✓ {i.label}</span>
                      ))}
                    </div>
                    {/* Show active data connections */}
                    {(monoContent && lpContent) && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400">🔗 Monetisasi → Landing Page tersinkronisasi</p>
                    )}
                    {(lpContent && chatMessages.length > 0) && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400">🔗 Landing Page → Chatbot Demo terhubung</p>
                    )}
                    {(syllabusContent && lpBonuses) && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400">🔗 E-Course → Bonus LP terintegrasi</p>
                    )}
                  </div>
                )}
              </div>
              {/* Author/Brand Name input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    className="w-full h-7 pl-7 pr-3 text-[11px] rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                    placeholder="Nama Penulis / Brand (dipakai di semua output)..."
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    data-testid="input-author-name"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">✍️</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowTopicAssistant(v => !v)}
                className={`col-span-2 text-white text-xs h-10 justify-start relative overflow-hidden transition-all ${
                  showTopicAssistant
                    ? 'bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-800 hover:to-purple-800 ring-2 ring-violet-400/50'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                }`}
                data-testid="button-topic-assistant-main"
              >
                <BrainCircuit className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Asisten Topik · Chaesa Prime</span>
                  <span className="text-[10px] opacity-80">{showTopicAssistant ? '▲ Tutup asisten' : `5 agen spesialis · ${projectTopik ? `Topik: ${projectTopik.slice(0, 30)}` : 'Isi topik untuk mengaktifkan'}`}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">OpenClaw</span>
                {showTopicAssistant && <div className="absolute right-0 top-0 bottom-0 w-1 bg-violet-300" />}
              </Button>
              {showTopicAssistant && projectData && (
                <div className="col-span-2 mt-0">
                  <TopicAssistant projectData={projectData} initialExpanded={true} assistantPersona={assistantPersona} />
                </div>
              )}
              {showTopicAssistant && !projectData && (
                <div className="col-span-2 flex items-center justify-center py-4 text-xs text-muted-foreground bg-muted/30 rounded-lg">
                  <BrainCircuit className="h-4 w-4 mr-2 opacity-40" /> Isi data topik di panel kiri untuk mengaktifkan asisten
                </div>
              )}
              <Button
                onClick={handleChatDemo}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-chat-demo-main"
              >
                <Bot className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Chatbot Demo</span>
                  <span className="text-[10px] opacity-80">{chatMessages.length > 0 ? '✓ Sudah dijalankan' : 'AI asisten topik'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o-mini</span>
                {chatMessages.length > 0 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={handleGenerateGPTs}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-gpts-builder-main"
              >
                <BrainCircuit className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">GPTs Builder</span>
                  <span className="text-[10px] opacity-80">{gptsContent ? '✓ Config siap' : 'Custom GPT ChatGPT'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {gptsContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => setSyllabusConfigOpen(true)}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-syllabus-main"
              >
                <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Silabus Kursus</span>
                  <span className="text-[10px] opacity-80">{syllabusContent ? '✓ Silabus selesai' : '8 modul + worksheet'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {syllabusContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={handleGenerateMiniApp}
                className="bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-mini-app-main"
              >
                <Smartphone className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Blueprint App</span>
                  <span className="text-[10px] opacity-80">{appContent ? '✓ Blueprint selesai' : 'Prompt Cursor/Lovable/Bolt'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o-mini</span>
                {appContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => setQuizConfigOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-quiz-main"
              >
                <ClipboardList className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Generator Kuis</span>
                  <span className="text-[10px] opacity-80">{quizContent ? '✓ Kuis selesai' : '19 soal MCQ/esai/kasus'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o-mini</span>
                {quizContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => handleGeneratePodcastScript()}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-podcast-main"
              >
                <Mic className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Podcast Script</span>
                  <span className="text-[10px] opacity-80">{podcastContent ? '✓ Script selesai' : 'Dialog 2 orang siap rekam'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {podcastContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => handleGenerateAudiobookScript()}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-audiobook-main"
              >
                <Volume2 className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Audiobook Script</span>
                  <span className="text-[10px] opacity-80">{audiobookContent ? '✓ Script selesai' : 'Narasi solo + production cue'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {audiobookContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => lpContent ? setLpOpen(true) : setLpConfigOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-landing-page-main"
              >
                <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Landing Page</span>
                  <span className="text-[10px] opacity-80">{lpContent ? '✓ Copy + HTML selesai' : 'Konfigurasi → Generate'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {lpContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => handleGenerateCoverTemplate()}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-cover-template-main"
              >
                <Palette className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Cover Template</span>
                  <span className="text-[10px] opacity-80">{coverTplContent ? '✓ Cover selesai' : 'HTML/CSS siap cetak'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {coverTplContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => setFlipbookOpen(true)}
                className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs h-10 justify-start relative overflow-hidden col-span-2"
                data-testid="button-flipbook-main"
              >
                <span className="text-base mr-2 shrink-0">📖</span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Convert ke FlipBook</span>
                  <span className="text-[10px] opacity-80">Heyzine (gratis) · FlipHTML5 · FlippingBook · FlipBuilder</span>
                </span>
              </Button>
              <Button
                onClick={() => setRisetOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-riset-ebook"
              >
                <Search className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Riset Topik</span>
                  <span className="text-[10px] opacity-80">{risetContent ? '✓ Riset selesai' : 'Ide ebook marketable'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">gpt-4o</span>
                {risetContent && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
              <Button
                onClick={() => setMockupOpen(true)}
                className="bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white text-xs h-10 justify-start relative overflow-hidden"
                data-testid="button-mockup-3d"
              >
                <span className="text-base mr-2 shrink-0">📸</span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Mockup 3D</span>
                  <span className="text-[10px] opacity-80">{mockupImages.length > 0 ? '✓ Mockup selesai' : 'Cover buku DALL-E 3'}</span>
                </span>
                <span className="absolute top-0.5 right-2 text-[7px] font-mono opacity-40">DALL·E 3</span>
                {mockupImages.length > 0 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-400" />}
              </Button>
            </div>
            {docContent && (
              <div className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Konten ebook sudah di-generate — semua fitur ekosistem menggunakan konten ini sebagai konteks
              </div>
            )}
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                <span className="text-sm font-semibold">Rekomendasi Utama</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/20">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">DokumenTender AI</p>
                    <p className="text-[10px] opacity-90">Whitelabel LLM untuk Industri Indonesia</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                >
                  <a
                    href="https://chat.dokumentender.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-dokumentender-ai"
                  >
                    <Rocket className="h-3 w-3 mr-1" />
                    Eksekusi
                  </a>
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Atau pilih AI lainnya:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_MODEL_RECOMMENDATIONS.filter(m => m.id !== 'dokumentender').map((model) => {
                const Icon = aiIconMap[model.icon] || Bot;
                const isSelected = selectedAiModel === model.id;

                return (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border transition-all",
                      "hover-elevate active-elevate-2 cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                    onClick={() => onAiModelChange?.(model.id)}
                    data-testid={`button-select-ai-${model.id}`}
                  >
                    <div className={cn(
                      "flex items-center justify-center h-7 w-7 rounded shrink-0",
                      model.color, model.textColor
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium truncate",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>{model.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{model.strengths[0]}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(model.url, '_blank');
                      }}
                      data-testid={`link-ai-${model.id}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen prompt dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Generated Prompt</DialogTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {wordCount} kata | {charCount} karakter
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <Textarea
              value={prompt}
              readOnly
              className="h-full font-mono text-sm resize-none bg-muted/30"
            />
          </div>
          <div className="flex items-center gap-2 pt-4 flex-shrink-0">
            <Button onClick={handleCopy} className="flex-1">
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Salin Prompt
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document generation dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={handleCloseDocDialog}>
        <DialogContent className={cn("flex flex-col", isPresentationMode ? "max-w-5xl h-[95vh] p-0 overflow-hidden" : "max-w-4xl h-[90vh]")}>
          <DialogHeader className={cn("flex-shrink-0", isPresentationMode && "px-6 pt-5 pb-3 bg-gray-950 border-b border-gray-800")}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg text-white", isPresentationMode ? "bg-indigo-600" : "bg-emerald-600")}>
                  {isPresentationMode ? <Monitor className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div>
                  <DialogTitle className={isPresentationMode ? "text-white" : ""}>
                    {isPresentationMode ? `Mode Presentasi — Slide ${slideIndex + 1} / ${slides.length}` : 'Dokumen yang Dihasilkan'}
                  </DialogTitle>
                  {isGenerating && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      AI sedang menulis dokumen...
                    </p>
                  )}
                  {!isGenerating && docContent && !isPresentationMode && (
                    <p className="text-xs text-emerald-600 mt-0.5">Dokumen selesai dibuat</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isGenerating && docContent && (
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      onClick={() => { setIsPresentationMode(false); setIsEditMode(false); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                        !isPresentationMode && !isEditMode ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                      data-testid="button-mode-dokumen"
                    >
                      <FileText className="h-3 w-3" />
                      Dokumen
                    </button>
                    <button
                      onClick={() => { setIsPresentationMode(false); setIsEditMode(true); setEditedContent(docContent); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                        isEditMode ? "bg-amber-500 text-white" : "hover:bg-muted text-muted-foreground"
                      )}
                      data-testid="button-mode-edit"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => { setIsPresentationMode(true); setIsEditMode(false); setSlideIndex(0); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                        isPresentationMode ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground"
                      )}
                      data-testid="button-mode-presentasi"
                    >
                      <Monitor className="h-3 w-3" />
                      Presentasi
                    </button>
                  </div>
                )}
                {!isGenerating && docContent && !isPresentationMode && (
                  <Badge variant="secondary" className="shrink-0">
                    {docContent.split(/\s+/).filter(Boolean).length} kata
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className={cn("flex-1 min-h-0 overflow-hidden", isPresentationMode && "bg-gray-950")}>
            {isPresentationMode && docContent && !isGenerating ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center p-8 relative">
                  <div className="w-full max-w-3xl">
                    <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 border border-indigo-500/20 min-h-[380px] flex flex-col p-10 relative">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      <div className="absolute top-4 right-6 text-indigo-400/50 text-xs font-mono">
                        {slideIndex + 1} / {slides.length}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
                          {currentSlide?.title}
                        </h2>
                        <ul className="space-y-3">
                          {currentSlide?.bullets.slice(0, 8).map((bullet, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-200 text-sm leading-relaxed">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-indigo-400/60 text-xs">{projectTitle || 'Chaesa AI Studio'}</span>
                        <div className="flex gap-1">
                          {slides.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSlideIndex(i)}
                              className={cn(
                                "h-1 rounded-full transition-all",
                                i === slideIndex ? "w-6 bg-indigo-400" : "w-1.5 bg-white/20 hover:bg-white/40"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
                    disabled={slideIndex === 0}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    data-testid="button-slide-prev"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  <div className="flex gap-1 max-w-xs overflow-hidden">
                    {slides.slice(Math.max(0, slideIndex - 3), slideIndex + 4).map((s, i) => {
                      const realIdx = Math.max(0, slideIndex - 3) + i;
                      return (
                        <button
                          key={realIdx}
                          onClick={() => setSlideIndex(realIdx)}
                          className={cn(
                            "shrink-0 w-8 h-8 text-xs rounded-md transition-colors",
                            realIdx === slideIndex ? "bg-indigo-600 text-white font-bold" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          )}
                        >
                          {realIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSlideIndex(i => Math.min(slides.length - 1, i + 1))}
                    disabled={slideIndex === slides.length - 1}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    data-testid="button-slide-next"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : isEditMode ? (
              <div className="h-full flex flex-col gap-3 p-1">
                <div className="flex items-center gap-2 px-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 flex-shrink-0">
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span>Mode Edit aktif — ubah teks langsung di bawah, lalu klik <strong>Simpan</strong> untuk memperbarui dokumen.</span>
                </div>
                <textarea
                  className="flex-1 w-full resize-none rounded-lg border bg-background p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  spellCheck={false}
                  data-testid="textarea-chapter-editor"
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => {
                      setDocContent(editedContent);
                      setIsEditMode(false);
                      setImageInserts({});
                      toast({ title: 'Dokumen berhasil diperbarui!' });
                    }}
                    data-testid="button-save-edit"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    data-testid="button-cancel-edit"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : docError ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">{docError}</p>
                <Button
                  onClick={handleGenerateDocument}
                  variant="outline"
                  size="sm"
                >
                  Coba Lagi
                </Button>
              </div>
            ) : !docContent && isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                </div>
                <div>
                  <p className="font-medium">Membuat dokumen...</p>
                  <p className="text-sm text-muted-foreground mt-1">AI sedang memproses prompt dan menulis konten</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 max-w-3xl mx-auto" data-testid="text-document-output">
                  {parseDocBlocks(docContent).map((block, bi) => {
                    if (block.type === 'empty') {
                      return <div key={bi} className="h-3" />;
                    }
                    if (block.type === 'hr') {
                      return <hr key={bi} className="my-4 border-border" />;
                    }
                    if (block.type === 'heading') {
                      const headingClasses: Record<number, string> = {
                        1: 'text-2xl font-bold text-foreground mt-8 mb-3 pb-1 border-b border-border',
                        2: 'text-xl font-bold text-foreground mt-6 mb-2',
                        3: 'text-lg font-semibold text-foreground mt-5 mb-2',
                        4: 'text-base font-semibold text-primary mt-4 mb-1',
                        5: 'text-sm font-semibold text-primary mt-3 mb-1',
                        6: 'text-sm font-medium text-muted-foreground mt-2 mb-1',
                      };
                      const cls = headingClasses[block.level] || headingClasses[3];
                      return (
                        <div key={bi} className="group/line">
                          {imageInserts[block.lineIdx] && (
                            <div className="relative my-3">
                              <img src={imageInserts[block.lineIdx]} alt="" className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover" data-testid={`img-doc-insert-${block.lineIdx}`} />
                              <button onClick={() => handleRemoveImage(block.lineIdx)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><X className="h-3 w-3" /></button>
                            </div>
                          )}
                          <div className={cls}>{renderInline(block.text)}</div>
                          {!isGenerating && (
                            <div className="flex items-center gap-1 my-1 opacity-0 group-hover/line:opacity-100 transition-opacity">
                              <div className="flex-1 h-px bg-border/50" />
                              <button onClick={() => handleOpenImagePicker(block.lineIdx, block.text, 'illustration')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-dashed border-border hover:border-primary transition-all" data-testid={`button-add-image-${block.lineIdx}`}><ImagePlus className="h-2.5 w-2.5" />Ilustrasi AI</button>
                              <button onClick={() => handleOpenImagePicker(block.lineIdx, block.text, 'infographic')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-teal-600 hover:bg-teal-50 border border-dashed border-border hover:border-teal-400 transition-all" data-testid={`button-add-infographic-${block.lineIdx}`}><Monitor className="h-2.5 w-2.5" />Infografik AI</button>
                              <div className="flex-1 h-px bg-border/50" />
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (block.type === 'table') {
                      return (
                        <div key={bi} className="my-4 overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-muted">
                                {block.header.map((cell, ci) => (
                                  <th key={ci} className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                                    {renderInline(cell)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="border border-border px-3 py-2 text-foreground">
                                      {renderInline(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    if (block.type === 'list') {
                      const Tag = block.ordered ? 'ol' : 'ul';
                      return (
                        <Tag key={bi} className={cn('my-2 pl-6 space-y-1', block.ordered ? 'list-decimal' : 'list-disc')}>
                          {block.items.map((item, ii) => (
                            <li key={ii} className="text-sm leading-relaxed text-foreground group/line">
                              {imageInserts[item.lineIdx] && (
                                <div className="relative my-2">
                                  <img src={imageInserts[item.lineIdx]} alt="" className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover" data-testid={`img-doc-insert-${item.lineIdx}`} />
                                  <button onClick={() => handleRemoveImage(item.lineIdx)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><X className="h-3 w-3" /></button>
                                </div>
                              )}
                              {renderInline(item.text)}
                              {!isGenerating && (
                                <div className="flex items-center gap-1 my-0.5 opacity-0 group-hover/line:opacity-100 transition-opacity">
                                  <div className="flex-1 h-px bg-border/50" />
                                  <button onClick={() => handleOpenImagePicker(item.lineIdx, item.text, 'illustration')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-dashed border-border hover:border-primary transition-all" data-testid={`button-add-image-${item.lineIdx}`}><ImagePlus className="h-2.5 w-2.5" />Ilustrasi AI</button>
                                  <button onClick={() => handleOpenImagePicker(item.lineIdx, item.text, 'infographic')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-teal-600 hover:bg-teal-50 border border-dashed border-border hover:border-teal-400 transition-all" data-testid={`button-add-infographic-${item.lineIdx}`}><Monitor className="h-2.5 w-2.5" />Infografik AI</button>
                                  <div className="flex-1 h-px bg-border/50" />
                                </div>
                              )}
                            </li>
                          ))}
                        </Tag>
                      );
                    }
                    if (block.type === 'paragraph') {
                      const isParagraphHeader = block.text.length < 100 && (
                        /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR)/i.test(block.text) ||
                        block.text === block.text.toUpperCase()
                      );
                      return (
                        <div key={bi} className="group/line">
                          {imageInserts[block.lineIdx] && (
                            <div className="relative my-3">
                              <img src={imageInserts[block.lineIdx]} alt="" className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover" data-testid={`img-doc-insert-${block.lineIdx}`} />
                              <button onClick={() => handleRemoveImage(block.lineIdx)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><X className="h-3 w-3" /></button>
                            </div>
                          )}
                          <p className={cn(
                            'text-sm leading-relaxed',
                            isParagraphHeader ? 'font-bold text-primary mt-5 mb-1 text-base' : 'text-foreground mb-1'
                          )}>
                            {renderInline(block.text)}
                          </p>
                          {!isGenerating && (
                            <div className="flex items-center gap-1 my-1 opacity-0 group-hover/line:opacity-100 transition-opacity">
                              <div className="flex-1 h-px bg-border/50" />
                              <button onClick={() => handleOpenImagePicker(block.lineIdx, block.text, 'illustration')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-dashed border-border hover:border-primary transition-all" data-testid={`button-add-image-${block.lineIdx}`}><ImagePlus className="h-2.5 w-2.5" />Ilustrasi AI</button>
                              <button onClick={() => handleOpenImagePicker(block.lineIdx, block.text, 'infographic')} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-teal-600 hover:bg-teal-50 border border-dashed border-border hover:border-teal-400 transition-all" data-testid={`button-add-infographic-${block.lineIdx}`}><Monitor className="h-2.5 w-2.5" />Infografik AI</button>
                              <div className="flex-1 h-px bg-border/50" />
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-emerald-600 ml-0.5 animate-pulse rounded-sm" />
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {!isGenerating && docContent && !isPresentationMode && !isEditMode && (
            <div className="space-y-2 pt-4 border-t flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyDoc}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-copy-document"
                >
                  {isDocCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Salin
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadDoc}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-download-document"
                >
                  <Download className="h-4 w-4 mr-2" />
                  .txt
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white"
                  data-testid="button-download-pdf"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={handleDownloadDocx}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                  data-testid="button-download-docx"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button
                  onClick={handleDownloadMarkdown}
                  variant="outline"
                  className="flex-1 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
                  data-testid="button-download-markdown"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  MD
                </Button>
                <Button
                  onClick={handleDownloadHTML}
                  variant="outline"
                  className="flex-1 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
                  data-testid="button-download-html"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  HTML
                </Button>
                <Button
                  onClick={handleGenerateDocument}
                  variant="outline"
                  className="shrink-0"
                  data-testid="button-regenerate-document"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ulang
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">AI Kit:</div>
                <Button
                  onClick={handleGenerateMarketingKit}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white text-xs h-8"
                  data-testid="button-marketing-kit"
                >
                  <Megaphone className="h-3.5 w-3.5 mr-1.5" />
                  Marketing Kit<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateScript}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs h-8"
                  data-testid="button-script-video"
                >
                  <Mic className="h-3.5 w-3.5 mr-1.5" />
                  Script Video<span className="ml-1 text-[7px] opacity-40 font-mono">·mini</span>
                </Button>
                <Button
                  onClick={handleGenerateThumbnail}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8"
                  data-testid="button-thumbnail"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  Thumbnail YT<span className="ml-1 text-[7px] opacity-40 font-mono">·D3</span>
                </Button>
                <Button
                  onClick={handleReviewDocument}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8"
                  data-testid="button-review-ai"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  Review AI<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">Bisnis:</div>
                <Button
                  onClick={handleGenerateMonetization}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-xs h-8"
                  data-testid="button-monetization"
                >
                  <span className="mr-1.5 text-sm leading-none">💰</span>
                  Strategi Jual Ebook<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-[10px] text-blue-700 dark:text-blue-400 font-medium shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    Mode Akurat · {uploadedFiles.length} sumber
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide w-14 shrink-0">Ebook+:</div>
                <Button
                  onClick={handleGenerateEbOutline}
                  className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white text-xs h-8"
                  data-testid="button-ebook-outline"
                >
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  Outline & TOC<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setChapterBuilderOpen(true)}
                  className="flex-1 bg-gradient-to-r from-indigo-800 to-blue-800 hover:from-indigo-900 hover:to-blue-900 text-white text-xs h-8"
                  data-testid="button-chapter-builder"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Chapter Builder<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateEbTemplate}
                  className="flex-1 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-800 hover:to-rose-800 text-white text-xs h-8"
                  data-testid="button-ebook-template"
                >
                  <Palette className="h-3.5 w-3.5 mr-1.5" />
                  Layout Preview<span className="ml-1 text-[7px] opacity-40 font-mono">·HTML</span>
                </Button>
                <Button
                  onClick={() => { setImageSearchOpen(true); if (!imageQuery) { setImageQuery(projectTopik || projectTitle || ''); } }}
                  className="flex-1 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs h-8"
                  data-testid="button-stok-gambar"
                >
                  <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                  Stok Gambar<span className="ml-1 text-[7px] opacity-40 font-mono">·CC</span>
                </Button>
              </div>
              {/* ===== PROTEKSI & PUBLISH ROW ===== */}
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide w-14 shrink-0">Publish:</div>
                <Button
                  onClick={() => { markEcoUsed('publish'); handleGeneratePublishView(); setEbPublishOpen(true); }}
                  className="flex-1 bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-800 hover:to-purple-800 text-white text-xs h-8"
                  data-testid="button-publish-baca-online"
                >
                  <span className="mr-1.5 text-sm leading-none">📖</span>
                  Baca Online<span className="ml-1 text-[7px] opacity-40 font-mono">·Reader</span>
                </Button>
                <Button
                  onClick={() => setEbProtectionOpen(true)}
                  className="flex-1 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white text-xs h-8"
                  data-testid="button-export-protected"
                >
                  <span className="mr-1.5 text-sm leading-none">🔒</span>
                  Export Terproteksi<span className="ml-1 text-[7px] opacity-40 font-mono">·PDF+Lock</span>
                </Button>
              </div>
              {/* ===== END PROTEKSI & PUBLISH ROW ===== */}

              {/* ===== DISTRIBUSI ROW ===== */}
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide w-16">Distribusi:</div>
                <Button
                  onClick={handlePlatformListing}
                  disabled={platformListingLoading}
                  className="flex-1 bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-800 hover:to-amber-800 text-white text-xs h-8"
                  data-testid="button-platform-listing"
                >
                  {platformListingLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />}
                  Platform Listing<span className="ml-1 text-[7px] opacity-40 font-mono">·Toped/Shopee</span>
                </Button>
                <Button
                  onClick={handleResellerKit}
                  disabled={resellerKitLoading}
                  className="flex-1 bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-800 hover:to-amber-700 text-white text-xs h-8"
                  data-testid="button-reseller-kit"
                >
                  {resellerKitLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <DollarSign className="h-3.5 w-3.5 mr-1.5" />}
                  Reseller Kit<span className="ml-1 text-[7px] opacity-40 font-mono">·Komisi</span>
                </Button>
                <Button
                  onClick={handleContentRepurposing}
                  disabled={repurposingLoading}
                  className="flex-1 bg-gradient-to-r from-cyan-700 to-sky-700 hover:from-cyan-800 hover:to-sky-800 text-white text-xs h-8"
                  data-testid="button-repurposing"
                >
                  {repurposingLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <Smartphone className="h-3.5 w-3.5 mr-1.5" />}
                  Repurposing Pack<span className="ml-1 text-[7px] opacity-40 font-mono">·6 Format</span>
                </Button>
              </div>
              {/* ===== END DISTRIBUSI ROW ===== */}

              {/* ===== SOSMED ROW (Edukazo-inspired) ===== */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide w-16">Sosmed:</div>
                <Button
                  onClick={() => setSocialPilarOpen(true)}
                  disabled={socialPilarLoading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs h-8"
                  data-testid="button-social-pilar"
                >
                  {socialPilarLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">📱</span>}
                  Social Pilar Plan<span className="ml-1 text-[7px] opacity-40 font-mono">·Angle×Post</span>
                </Button>
                <Button
                  onClick={() => setThreadOpen(true)}
                  disabled={threadLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs h-8"
                  data-testid="button-thread-content"
                >
                  {threadLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🧵</span>}
                  Thread FB/X<span className="ml-1 text-[7px] opacity-40 font-mono">·Storytelling</span>
                </Button>
                <Button
                  onClick={() => setIgCaptionOpen(true)}
                  disabled={igCaptionLoading}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-xs h-8"
                  data-testid="button-ig-caption"
                >
                  {igCaptionLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">📸</span>}
                  IG Caption Pack<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setReelHookOpen(true)}
                  disabled={reelHookLoading}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs h-8"
                  data-testid="button-reel-hook"
                >
                  {reelHookLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🎬</span>}
                  Reels/TikTok Hook<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setLinkedinOpen(true)}
                  disabled={linkedinLoading}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-sky-700 hover:from-blue-800 hover:to-sky-800 text-white text-xs h-8"
                  data-testid="button-linkedin-article"
                >
                  {linkedinLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🔵</span>}
                  LinkedIn Article<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
              </div>
              {/* ===== END SOSMED ROW ===== */}

              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">Konversi:</div>
                {/* LP Section Kit — dropdown-style with tabs */}
                <div className="flex-1 flex gap-1 flex-wrap">
                  {[
                    { key: 'headline', label: '🎯 Headline', title: 'Headline Pack' },
                    { key: 'problem', label: '😣 Problem', title: 'Problems Section' },
                    { key: 'social_proof', label: '⭐ Proof', title: 'Social Proof' },
                    { key: 'bonus_stack', label: '🎁 Bonus', title: 'Bonus Stack' },
                    { key: 'cta', label: '🔔 CTA', title: 'CTA Pack' },
                    { key: 'faq', label: '❓ FAQ', title: 'FAQ Section' },
                  ].map(sec => (
                    <Button
                      key={sec.key}
                      onClick={() => handleGenerateLpSection(sec.key)}
                      className="bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-800 hover:to-purple-800 text-white text-[10px] h-7 px-2"
                      data-testid={`button-lp-section-${sec.key}`}
                      title={`Generate ${sec.title} untuk LP`}
                    >
                      {sec.label}
                    </Button>
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground opacity-50 font-mono ml-1">·4o</span>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide w-14 shrink-0">Strategi+:</div>
                <Button
                  onClick={handleGenerateFunnelBlueprint}
                  className="flex-1 bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-800 hover:to-teal-800 text-white text-xs h-8"
                  data-testid="button-funnel-blueprint"
                >
                  <span className="mr-1.5 text-sm leading-none">🗺️</span>
                  Funnel Blueprint<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateHeadlinePack}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white text-xs h-8"
                  data-testid="button-headline-pack"
                >
                  <span className="mr-1.5 text-sm leading-none">⚡</span>
                  Headline Power Pack<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setPricingLadderOpen(true)}
                  disabled={pricingLadderLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white text-xs h-8"
                  data-testid="button-pricing-ladder"
                >
                  {pricingLadderLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">💲</span>}
                  Pricing Ladder<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setLaunchCheckOpen(true)}
                  disabled={launchCheckLoading}
                  className="flex-1 bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-800 hover:to-amber-800 text-white text-xs h-8"
                  data-testid="button-launch-checklist"
                >
                  {launchCheckLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🚀</span>}
                  Launch Checklist<span className="ml-1 text-[7px] opacity-40 font-mono">·D-30</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">Iklan:</div>
                <Button
                  onClick={handleGenerateMetaAds}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs h-8"
                  data-testid="button-meta-ads"
                >
                  <span className="mr-1.5 text-sm leading-none">📣</span>
                  Meta Ads Copy<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateWaClosing}
                  className="flex-1 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white text-xs h-8"
                  data-testid="button-wa-closing"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  WA Closing<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateScarcity}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-xs h-8"
                  data-testid="button-scarcity-pack"
                >
                  <span className="mr-1.5 text-sm leading-none">⏳</span>
                  Scarcity Pack<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setTikTokAdsOpen(true)}
                  disabled={tikTokAdsLoading}
                  className="flex-1 bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white text-xs h-8"
                  data-testid="button-tiktok-ads"
                >
                  {tikTokAdsLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🎵</span>}
                  TikTok Ads Script<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setGoogleAdsOpen(true)}
                  disabled={googleAdsLoading}
                  className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs h-8"
                  data-testid="button-google-ads"
                >
                  {googleAdsLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🔍</span>}
                  Google Search Ads<span className="ml-1 text-[7px] opacity-40 font-mono">·RSA</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">Funnel:</div>
                <Button
                  onClick={handleGenerateVsl}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs h-8"
                  data-testid="button-vsl-script"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  VSL Script<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateEmailSeq}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-xs h-8"
                  data-testid="button-email-sequence"
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Email Sequence<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={handleGenerateCalendar}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs h-8"
                  data-testid="button-content-calendar"
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  Kalender Konten<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
                <Button
                  onClick={() => setMembershipOpen(true)}
                  disabled={membershipLoading}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white text-xs h-8"
                  data-testid="button-membership-brief"
                >
                  {membershipLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">🏆</span>}
                  Membership Brief<span className="ml-1 text-[7px] opacity-40 font-mono">·4o</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="text-[10px] text-muted-foreground font-medium shrink-0 uppercase tracking-wide">Ekosistem:</div>
                <Button
                  onClick={handleChatDemo}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs h-8"
                  data-testid="button-chat-demo"
                >
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                  Chatbot Demo
                </Button>
                <Button
                  onClick={handleGenerateGPTs}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs h-8"
                  data-testid="button-gpts-builder"
                >
                  <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
                  GPTs Builder
                </Button>
                <Button
                  onClick={handleGenerateSyllabus}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs h-8"
                  data-testid="button-syllabus"
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  Silabus Kursus
                </Button>
                <Button
                  onClick={handleGenerateMiniApp}
                  className="flex-1 bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white text-xs h-8"
                  data-testid="button-mini-app"
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Blueprint App
                </Button>
                <Button
                  onClick={handleGenerateQuiz}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs h-8"
                  data-testid="button-quiz"
                >
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  Generator Kuis
                </Button>
                <Button
                  onClick={() => setSopOpen(true)}
                  disabled={sopLoading}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-xs h-8"
                  data-testid="button-sop-generator"
                >
                  {sopLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" /> : <span className="mr-1.5 text-sm leading-none">📋</span>}
                  SOP Generator<span className="ml-1 text-[7px] opacity-40 font-mono">·Dokumen</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Marketing Kit Dialog */}
      <Dialog open={mktOpen} onOpenChange={setMktOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-pink-600 to-rose-500 text-white">
                <Megaphone className="h-3.5 w-3.5" />
              </div>
              Marketing Kit AI — Indonesia Edition
              <Badge variant="secondary" className="ml-1 text-xs">Sales · IG · Email · WA · TikTok 🇮🇩 · Tokped 🇮🇩</Badge>
            </DialogTitle>
          </DialogHeader>
          {mktLoading && !mktContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
              <p className="text-sm text-muted-foreground">AI sedang membuat marketing kit...</p>
            </div>
          )}
          {(mktContent || mktLoading) && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {[
                  { key: 'sales', label: 'Sales Page', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
                  { key: 'instagram', label: 'Instagram', icon: <Camera className="h-3.5 w-3.5" /> },
                  { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="h-3.5 w-3.5" /> },
                  { key: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
                  { key: 'whatsapp', label: 'WhatsApp 🇮🇩', icon: <MessageSquare className="h-3.5 w-3.5" /> },
                  { key: 'tiktok', label: 'TikTok 🇮🇩', icon: <span className="text-xs">🎵</span> },
                  { key: 'tokopedia', label: 'Tokped/Shopee 🇮🇩', icon: <span className="text-xs">🛒</span> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMktActiveSection(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      mktActiveSection === tab.key
                        ? "bg-pink-600 text-white border-pink-600"
                        : "border-border hover:border-pink-300 hover:text-pink-700"
                    )}
                  >{tab.icon}{tab.label}</button>
                ))}
              </div>
              <ScrollArea className="flex-1">
                <div className="text-sm whitespace-pre-wrap leading-relaxed font-mono p-2">
                  {(() => {
                    const sections: Record<string, string> = {
                      sales: 'SALES PAGE COPY',
                      instagram: 'POSTINGAN INSTAGRAM',
                      linkedin: 'POSTINGAN LINKEDIN',
                      email: 'EMAIL MARKETING',
                      whatsapp: 'BROADCAST WHATSAPP',
                      tiktok: 'TIKTOK SCRIPT',
                      tokopedia: 'TOKOPEDIA SHOPEE LISTING',
                    };
                    const sectionKeys = Object.keys(sections);
                    const sectionStart = `===== ${sections[mktActiveSection]} =====`;
                    const nextIdx = sectionKeys.indexOf(mktActiveSection) + 1;
                    const nextSection = nextIdx < sectionKeys.length ? `===== ${sections[sectionKeys[nextIdx]]} =====` : null;
                    const startIdx = mktContent.indexOf(sectionStart);
                    if (startIdx === -1) return mktContent;
                    const endIdx = nextSection ? mktContent.indexOf(nextSection) : mktContent.length;
                    return mktContent.slice(startIdx, endIdx === -1 ? mktContent.length : endIdx);
                  })()}
                  {mktLoading && <span className="inline-block w-2 h-4 bg-pink-500 animate-pulse ml-1" />}
                </div>
              </ScrollArea>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(mktContent);
                    toast({ title: 'Marketing Kit disalin!' });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Salin Semua
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([mktContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url;
                    a.download = `marketing-kit-${(projectTitle || projectTopik || 'ebook').slice(0, 30).replace(/\s+/g, '-')}.txt`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .txt
                </Button>
                <Button
                  disabled={mktLoading}
                  onClick={handleGenerateMarketingKit}
                  className="bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:from-pink-700 hover:to-rose-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Buat Ulang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Script Video Dialog */}
      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent className="max-w-3xl h-[88vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Mic className="h-3.5 w-3.5" />
              </div>
              Script Video & YouTube SEO
              <Badge variant="secondary" className="ml-1 text-xs">CineMind · Autonix</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setScriptTab('script')}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all", scriptTab === 'script' ? "bg-violet-600 text-white border-violet-600" : "border-border hover:border-violet-300")}
            ><Mic className="h-3.5 w-3.5" />Script Narasi</button>
            <button
              onClick={() => { if (!seoContent) handleGenerateYoutubeSEO(); else setScriptTab('seo'); }}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all", scriptTab === 'seo' ? "bg-red-600 text-white border-red-600" : "border-border hover:border-red-300")}
            >
              {seoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              YouTube SEO Pack
            </button>
          </div>
          {scriptTab === 'script' && (
            <>
              {scriptLoading && !scriptContent ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
                  <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                  <p className="text-sm text-muted-foreground">AI sedang mengubah ebook menjadi script video...</p>
                </div>
              ) : (scriptContent || scriptLoading) ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg p-3 flex-shrink-0 text-xs text-violet-700 dark:text-violet-300">
                    <strong>Tips:</strong> Gunakan script sebagai narasi rekam video / podcast. <code>[JEDA]</code> = pause, <code>[PENEKANAN]</code> = tekan lebih keras.
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed p-2">
                      {scriptContent.split(/(\[.*?\])/g).map((part, i) =>
                        /^\[.*\]$/.test(part)
                          ? <span key={i} className="text-violet-600 font-bold text-xs bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded mx-0.5">{part}</span>
                          : <span key={i}>{part}</span>
                      )}
                      {scriptLoading && <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-1" />}
                    </div>
                  </ScrollArea>
                  {ttsAudioUrl && (
                    <div className="flex-shrink-0 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-2 flex items-center gap-3">
                      <audio
                        ref={audioRef}
                        src={ttsAudioUrl}
                        onEnded={() => setTtsPlaying(false)}
                        onPlay={() => setTtsPlaying(true)}
                        onPause={() => setTtsPlaying(false)}
                      />
                      <Volume2 className="h-4 w-4 text-violet-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Audio Narasi Siap</p>
                        <p className="text-[10px] text-muted-foreground">Suara: {ttsVoice} · klik ▶ untuk putar</p>
                      </div>
                      <button
                        onClick={() => {
                          if (!audioRef.current) return;
                          if (ttsPlaying) { audioRef.current.pause(); setTtsPlaying(false); }
                          else { audioRef.current.play(); setTtsPlaying(true); }
                        }}
                        className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors"
                      >
                        {ttsPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                      </button>
                      <a href={ttsAudioUrl} download="narasi.mp3" className="h-8 w-8 rounded-full border border-violet-300 text-violet-700 flex items-center justify-center hover:bg-violet-100 transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigator.clipboard.writeText(scriptContent); toast({ title: 'Script disalin!' }); }}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />Salin
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { const b = new Blob([scriptContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=`script-${(projectTitle||'ebook').slice(0,25).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />Download
                    </Button>
                    <div className="flex items-center gap-1 border border-border rounded-md px-2">
                      <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <select
                        value={ttsVoice}
                        onChange={e => setTtsVoice(e.target.value as typeof ttsVoice)}
                        className="text-xs bg-transparent outline-none py-1 pr-1"
                        title="Pilih suara TTS"
                      >
                        <option value="nova">Nova (Wanita)</option>
                        <option value="shimmer">Shimmer (Wanita)</option>
                        <option value="alloy">Alloy (Netral)</option>
                        <option value="echo">Echo (Pria)</option>
                        <option value="onyx">Onyx (Pria)</option>
                      </select>
                    </div>
                    <Button
                      size="sm"
                      disabled={ttsLoading || scriptLoading}
                      onClick={handleTextToSpeech}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                      data-testid="button-tts"
                    >
                      {ttsLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5 mr-1.5" />}
                      Dengarkan
                    </Button>
                    <Button size="sm" disabled={scriptLoading} onClick={handleGenerateScript} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />Buat Ulang
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
          {scriptTab === 'seo' && (
            <>
              {seoLoading && !seoContent ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
                  <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                  <p className="text-sm text-muted-foreground">AI sedang membuat YouTube SEO Pack...</p>
                </div>
              ) : (seoContent || seoLoading) ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex-shrink-0 text-xs text-red-700 dark:text-red-300">
                    <strong>YouTube SEO Pack</strong> — Judul, Deskripsi, Tags, Hashtag, Hook 30 detik, dan konsep Thumbnail untuk video promosi ebook kamu.
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed p-2 font-mono">
                      {seoContent}
                      {seoLoading && <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-1" />}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(seoContent); toast({ title: 'SEO Pack disalin!' }); }}>
                      <Copy className="h-4 w-4 mr-2" />Salin
                    </Button>
                    <Button variant="outline" onClick={() => { const b = new Blob([seoContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=`youtube-seo-${(projectTitle||'ebook').slice(0,25).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}>
                      <Download className="h-4 w-4 mr-2" />Download
                    </Button>
                    <Button disabled={seoLoading} onClick={handleGenerateYoutubeSEO} className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
                      <Sparkles className="h-4 w-4 mr-2" />Buat Ulang
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Thumbnail Generator Dialog */}
      <Dialog open={thumbOpen} onOpenChange={setThumbOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Video className="h-3.5 w-3.5" />
              </div>
              Thumbnail YouTube/Social Media
              <Badge variant="secondary" className="ml-1 text-xs">4 Varian · DALL-E 3 · 16:9</Badge>
            </DialogTitle>
          </DialogHeader>
          {thumbLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                <Video className="absolute inset-0 m-auto h-6 w-6 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">Membuat 4 varian thumbnail dengan DALL-E 3...</p>
              <p className="text-xs text-muted-foreground/60">Proses ~30-60 detik</p>
            </div>
          ) : thumbImages.length > 0 ? (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1">
                {thumbImages.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border bg-muted aspect-video">
                    <img src={url} alt={`Thumbnail ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-xs font-medium">Varian {i+1}</span>
                      <a
                        href={url}
                        download={`thumbnail-${i+1}-${(projectTitle||'ebook').slice(0,20).replace(/\s+/g,'-')}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-amber-50"
                        data-testid={`button-download-thumb-${i}`}
                      >
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">16:9</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" className="flex-1" onClick={handleGenerateThumbnail}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ulang (4 Varian Baru)
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Video className="h-12 w-12 opacity-20" />
              <p className="text-sm">Klik Generate untuk membuat thumbnail</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monetization Strategy Dialog */}
      <Dialog open={monoOpen} onOpenChange={setMonoOpen}>
        <DialogContent className="max-w-3xl h-[88vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 text-white text-sm">
                💰
              </div>
              Strategi Monetisasi Ebook
              <Badge variant="secondary" className="ml-1 text-xs">Harga · Platform · Buyer · Launch · Upsell</Badge>
            </DialogTitle>
          </DialogHeader>
          {monoLoading && !monoContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
                <span className="absolute inset-0 m-auto text-lg flex items-center justify-center">💰</span>
              </div>
              <p className="text-sm text-muted-foreground">AI sedang menyusun strategi monetisasi...</p>
              <p className="text-xs text-muted-foreground/60">~15-20 detik</p>
            </div>
          )}
          {(monoContent || monoLoading) && (() => {
            const getSection = (tag: string) => {
              const m = monoContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : '';
            };
            const tabs = [
              { key: 'harga', label: '💰 Harga', tag: 'HARGA', color: 'from-green-600 to-emerald-500', active: 'bg-green-600' },
              { key: 'platform', label: '🛒 Platform', tag: 'PLATFORM', color: 'from-blue-600 to-cyan-500', active: 'bg-blue-600' },
              { key: 'pembeli', label: '👤 Pembeli', tag: 'PEMBELI', color: 'from-purple-600 to-violet-500', active: 'bg-purple-600' },
              { key: 'launch', label: '🚀 Launch', tag: 'LAUNCH', color: 'from-orange-500 to-amber-500', active: 'bg-orange-500' },
              { key: 'upsell', label: '📦 Upsell', tag: 'UPSELL', color: 'from-pink-600 to-rose-500', active: 'bg-pink-600' },
            ] as const;
            const currentTab = tabs.find(t => t.key === monoTab)!;
            const sectionContent = getSection(currentTab.tag);
            return (
              <>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setMonoTab(tab.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        monoTab === tab.key
                          ? `bg-gradient-to-r ${tab.color} text-white border-transparent`
                          : "border-border hover:border-green-300"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {sectionContent ? (
                        <>
                          <MarkdownContent content={sectionContent} />
                          {monoLoading && monoContent.includes(`===${currentTab.tag}===`) && !monoContent.includes(`===AKHIR_${currentTab.tag}===`) && (
                            <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
                          )}
                        </>
                      ) : (
                        monoLoading
                          ? <span className="text-muted-foreground text-xs">Sedang di-generate... <span className="inline-block w-2 h-3 bg-green-500 animate-pulse ml-1" /></span>
                          : <span className="text-muted-foreground text-xs">Klik tab lain untuk melihat bagian ini setelah selesai di-generate.</span>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(monoContent); toast({ title: 'Strategi monetisasi disalin!' }); }}>
                      <Copy className="h-4 w-4 mr-2" />Salin Semua
                    </Button>
                    <Button variant="outline" onClick={() => { const b = new Blob([monoContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=`monetisasi-${(projectTitle||'ebook').slice(0,25).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}>
                      <Download className="h-4 w-4 mr-2" />Download
                    </Button>
                    <Button disabled={monoLoading} onClick={handleGenerateMonetization} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white">
                      <Sparkles className="h-4 w-4 mr-2" />Buat Ulang
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Review AI Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl h-[88vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              AI Quality Review
              <Badge variant="secondary" className="ml-1 text-xs">5 Dimensi · ARQS™</Badge>
            </DialogTitle>
          </DialogHeader>
          {reviewLoading && !reviewContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
                <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">AI sedang menganalisis kualitas dokumen...</p>
              <p className="text-xs text-muted-foreground/60">~10-20 detik</p>
            </div>
          )}
          {reviewContent && (() => {
            const getSection = (tag: string) => {
              const m = reviewContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : '';
            };
            const scorePart = getSection('SKOR');
            const scores: Record<string, number> = {};
            if (scorePart) {
              const lines = scorePart.split('\n');
              lines.forEach(l => {
                const m = l.match(/^(\w+):\s*(\d+)/);
                if (m) scores[m[1]] = parseInt(m[2]);
              });
            }
            const total = scores['TOTAL'] || Math.round(Object.entries(scores).filter(([k]) => k !== 'TOTAL').reduce((s, [,v]) => s + v, 0) / 5);
            const getColor = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-yellow-400' : 'bg-red-400';
            const getTextColor = (v: number) => v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-yellow-600' : 'text-red-500';
            const dimensionLabels: Record<string, string> = {
              STRUKTUR: 'Struktur', KEDALAMAN: 'Kedalaman Konten', KETERBACAAN: 'Keterbacaan', KELENGKAPAN: 'Kelengkapan', NILAI_JUAL: 'Nilai Jual'
            };
            return (
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-1 pb-4">
                  {/* Score Ring */}
                  <div className="flex items-center gap-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
                    <div className="flex-shrink-0 text-center">
                      <div className={`text-4xl font-black ${getTextColor(total)}`}>{total}</div>
                      <div className="text-xs text-muted-foreground font-medium">/ 100</div>
                      <div className={`text-xs font-bold mt-0.5 ${getTextColor(total)}`}>
                        {total >= 85 ? 'SANGAT BAIK' : total >= 70 ? 'BAIK' : total >= 55 ? 'CUKUP' : 'PERLU PERBAIKAN'}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {['STRUKTUR','KEDALAMAN','KETERBACAAN','KELENGKAPAN','NILAI_JUAL'].map(key => {
                        const val = scores[key] ?? 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-28 shrink-0">{dimensionLabels[key]}</span>
                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${getColor(val)} transition-all`} style={{ width: `${val}%` }} />
                            </div>
                            <span className={`text-xs font-bold w-7 text-right ${getTextColor(val)}`}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  {getSection('RINGKASAN') && (
                    <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed text-muted-foreground italic">
                      "{getSection('RINGKASAN')}"
                    </div>
                  )}

                  {/* Strengths */}
                  {getSection('KELEBIHAN') && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wide">✅ Kelebihan Dokumen</p>
                      <div className="space-y-1">
                        {getSection('KELEBIHAN').split('\n').filter(l => l.trim()).map((l, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                            <span>{l.replace(/^✅\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {getSection('PERBAIKAN') && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide">🔧 Area Perbaikan</p>
                      <div className="space-y-2">
                        {getSection('PERBAIKAN').split('\n').filter(l => l.trim()).map((l, i) => {
                          const parts = l.replace(/^🔧\s*/, '').split('→');
                          return (
                            <div key={i} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-xs">
                              {parts[0] && <p className="font-medium text-amber-800 dark:text-amber-300">{parts[0].trim()}</p>}
                              {parts[1] && <p className="text-amber-700 dark:text-amber-400 mt-0.5">→ {parts[1].trim()}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {getSection('REKOMENDASI') && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">💡 Rekomendasi Langkah Selanjutnya</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{getSection('REKOMENDASI')}</p>
                    </div>
                  )}

                  {/* Raw if no structure parsed */}
                  {!scorePart && reviewContent && (
                    <MarkdownContent content={reviewContent} />
                  )}

                  {reviewLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Menganalisis...</div>}
                </div>
              </ScrollArea>
            );
          })()}
          <div className="flex gap-2 flex-shrink-0 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(reviewContent); toast({ title: 'Hasil review disalin!' }); }}>
              <Copy className="h-4 w-4 mr-2" />Salin Hasil
            </Button>
            <Button disabled={reviewLoading} onClick={handleReviewDocument} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <ShieldCheck className="h-4 w-4 mr-2" />Review Ulang
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Silabus Pre-Config Dialog */}
      <Dialog open={syllabusConfigOpen} onOpenChange={setSyllabusConfigOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-cyan-600" />
              Konfigurasi Silabus Kursus
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Durasi Kursus</label>
              <div className="grid grid-cols-2 gap-2">
                {['2 Minggu','4 Minggu','6 Minggu','3 Bulan'].map(d => (
                  <button key={d} onClick={() => setSyllabusConfigDuration(d)}
                    className={cn("py-1.5 rounded-lg border text-xs font-medium transition-all", syllabusConfigDuration === d ? "bg-cyan-600 text-white border-cyan-600" : "border-border hover:border-cyan-300")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format Delivery</label>
              <div className="grid grid-cols-2 gap-2">
                {['Video + Worksheet','PDF + Quiz','Live Webinar','Self-Paced Text'].map(f => (
                  <button key={f} onClick={() => setSyllabusConfigFormat(f)}
                    className={cn("py-1.5 rounded-lg border text-xs font-medium transition-all", syllabusConfigFormat === f ? "bg-cyan-600 text-white border-cyan-600" : "border-border hover:border-cyan-300")}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tujuan Utama Peserta</label>
              <Input
                value={syllabusConfigGoal}
                onChange={e => setSyllabusConfigGoal(e.target.value)}
                placeholder="contoh: bisa langsung implementasi di bisnis sendiri"
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSyllabusConfigOpen(false)}>Batal</Button>
            <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white" onClick={() => handleGenerateSyllabus()}>
              <GraduationCap className="h-4 w-4 mr-2" />Generate Silabus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Pre-Config Dialog */}
      <Dialog open={quizConfigOpen} onOpenChange={setQuizConfigOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              Konfigurasi Generator Kuis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level Kesulitan</label>
              <div className="grid grid-cols-2 gap-2">
                {['Beginner','Intermediate','Advanced','Expert'].map(l => (
                  <button key={l} onClick={() => setQuizConfigLevel(l)}
                    className={cn("py-1.5 rounded-lg border text-xs font-medium transition-all", quizConfigLevel === l ? "bg-purple-600 text-white border-purple-600" : "border-border hover:border-purple-300")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fokus Penilaian</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'komprehensif', label: 'Komprehensif' },
                  { val: 'teori', label: 'Teori & Konsep' },
                  { val: 'praktik', label: 'Praktik Nyata' },
                  { val: 'analisis', label: 'Analisis Kritis' },
                ].map(f => (
                  <button key={f.val} onClick={() => setQuizConfigFocus(f.val)}
                    className={cn("py-1.5 rounded-lg border text-xs font-medium transition-all", quizConfigFocus === f.val ? "bg-purple-600 text-white border-purple-600" : "border-border hover:border-purple-300")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {docContent && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 dark:text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                Soal akan dibuat berdasarkan konten ebook yang sudah di-generate
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setQuizConfigOpen(false)}>Batal</Button>
            <Button className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" onClick={() => handleGenerateQuiz()}>
              <ClipboardList className="h-4 w-4 mr-2" />Generate Kuis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DOCUMENT GENERATOR CONFIG DIALOG — ISO/QMS EDITION ── */}
      <Dialog open={docConfigOpen} onOpenChange={setDocConfigOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                <FileText className="h-3.5 w-3.5" />
              </div>
              Generator Dokumen Sistem Manajemen
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">ISO · QMS · SMK3</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-5 py-3 px-1">

              {/* Context pipeline */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">📋 Konteks yang digunakan AI untuk membuat dokumen:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Topik/Standar', active: !!projectTopik, note: projectTopik?.slice(0,25) },
                    { label: 'Judul Dokumen', active: !!projectTitle, note: projectTitle?.slice(0,25) },
                    { label: 'Organisasi', active: !!docNamaOrg, note: docNamaOrg?.slice(0,20) },
                    { label: 'Konten Ebook/Riset', active: !!prompt, note: `${Math.round(prompt.length/100)*100} char` },
                  ].map(d => (
                    <span key={d.label} className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', d.active ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300' : 'bg-muted border-border text-muted-foreground opacity-40')}>
                      {d.active ? '✓' : '○'} {d.label}{d.note ? ` (${d.note})` : ''}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">💡 Konten dari ebook akan menjadi basis knowledge untuk menyusun dokumen yang spesifik dan kontekstual</p>
              </div>

              {/* Kategori & Jenis Dokumen */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground">📂 Kategori Sistem Manajemen</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'smm', label: '🏅 Mutu (QMS)', desc: 'ISO 9001, Sistem Manajemen Mutu' },
                    { v: 'k3', label: '⛑️ K3/HSE', desc: 'ISO 45001, SMK3, OHSAS 18001' },
                    { v: 'lingkungan', label: '🌿 Lingkungan', desc: 'ISO 14001, EMS, AMDAL' },
                    { v: 'infosec', label: '🔐 Keamanan Info', desc: 'ISO 27001, ISMS, Siber' },
                    { v: 'pangan', label: '🍎 Keamanan Pangan', desc: 'ISO 22000, HACCP, BPOM' },
                    { v: 'terintegrasi', label: '🔗 Terintegrasi (IMS)', desc: 'Multi-standar gabungan' },
                  ] as const).map(opt => (
                    <button key={opt.v} onClick={() => setDocKategori(opt.v)}
                      className={cn('text-left p-2 rounded-lg border text-xs transition-colors', docKategori === opt.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:border-blue-400 hover:bg-muted')}>
                      <div className="font-semibold mb-0.5 text-[11px]">{opt.label}</div>
                      <div className="text-muted-foreground text-[9px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jenis Dokumen ISO */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">📄 Jenis Dokumen</label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { v: 'manual_mutu', label: '📘 Manual Mutu', desc: 'Quality Manual — Level 1' },
                    { v: 'prosedur', label: '📋 Prosedur (SOP)', desc: 'Cara melakukan proses — Level 2' },
                    { v: 'instruksi_kerja', label: '⚙️ Instruksi Kerja', desc: 'Langkah teknis detail — Level 3' },
                    { v: 'kebijakan', label: '📜 Kebijakan', desc: 'Policy statement resmi' },
                    { v: 'formulir', label: '📝 Formulir/Form', desc: 'Rekaman & checklist — Level 4' },
                    { v: 'rencana_mutu', label: '🗓️ Rencana Mutu', desc: 'Quality/Safety Plan proyek' },
                    { v: 'analisis_risiko', label: '⚠️ Analisis Risiko', desc: 'Risk register, FMEA, HIRARC' },
                    { v: 'laporan_audit', label: '🔍 Laporan Audit', desc: 'Laporan audit internal/eksternal' },
                    { v: 'tinjauan_manajemen', label: '👔 Tinjauan Manajemen', desc: 'Management Review Report' },
                    { v: 'sasaran_mutu', label: '🎯 Sasaran & KPI', desc: 'Quality/K3/Env Objectives' },
                    { v: 'program_kerja', label: '📅 Program Kerja', desc: 'Annual program/work plan' },
                    { v: 'manual_k3', label: '⛑️ Manual K3', desc: 'HSE/SMK3 Manual' },
                  ] as const).map(opt => (
                    <button key={opt.v} onClick={() => setDocJenisISO(opt.v)}
                      className={cn('text-left p-2 rounded-lg border text-xs transition-colors', docJenisISO === opt.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:border-blue-400 hover:bg-muted')}>
                      <div className="font-semibold mb-0.5 text-[11px]">{opt.label}</div>
                      <div className="text-muted-foreground text-[9px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── STANDAR REFERENSI ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">📌 Standar Referensi <span className="font-normal text-muted-foreground">(multi-pilih)</span></label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { v: 'iso_9001', label: 'ISO 9001:2015', desc: 'Sistem Manajemen Mutu' },
                    { v: 'iso_14001', label: 'ISO 14001:2015', desc: 'Sistem Manajemen Lingkungan' },
                    { v: 'iso_45001', label: 'ISO 45001:2018', desc: 'Sistem Manajemen K3' },
                    { v: 'iso_27001', label: 'ISO 27001:2022', desc: 'Keamanan Informasi' },
                    { v: 'iso_22000', label: 'ISO 22000:2018', desc: 'Keamanan Pangan' },
                    { v: 'smk3', label: 'PP 50/2012 SMK3', desc: 'SMK3 (Permenaker)' },
                    { v: 'ohsas_18001', label: 'OHSAS 18001', desc: 'K3 (legacy standard)' },
                    { v: 'iso_37001', label: 'ISO 37001:2016', desc: 'Anti-suap & GCG' },
                    { v: 'iso_31000', label: 'ISO 31000:2018', desc: 'Manajemen Risiko' },
                  ] as const).map(opt => (
                    <button key={opt.v}
                      onClick={() => setDocStandar(prev => prev.includes(opt.v) ? prev.filter(s => s !== opt.v) : [...prev, opt.v])}
                      className={cn('text-left p-2 rounded-lg border text-xs flex items-start gap-1.5 transition-colors', docStandar.includes(opt.v) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:bg-muted')}>
                      <div className={cn('mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px]', docStandar.includes(opt.v) ? 'bg-blue-600 border-blue-600 text-white' : 'border-border')}>
                        {docStandar.includes(opt.v) && '✓'}
                      </div>
                      <div>
                        <div className="font-semibold text-[10px]">{opt.label}</div>
                        <div className="text-muted-foreground text-[9px] leading-snug">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── KLAUSUL YANG DICAKUP (ISO 9001 HLS) ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">📑 Klausul yang Dicakup <span className="font-normal text-muted-foreground">(High Level Structure — ISO HLS)</span></label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { v: '4', label: 'Klausul 4', desc: 'Konteks Organisasi' },
                    { v: '5', label: 'Klausul 5', desc: 'Kepemimpinan' },
                    { v: '6', label: 'Klausul 6', desc: 'Perencanaan' },
                    { v: '7', label: 'Klausul 7', desc: 'Dukungan (Support)' },
                    { v: '8', label: 'Klausul 8', desc: 'Operasional' },
                    { v: '9', label: 'Klausul 9', desc: 'Evaluasi Kinerja' },
                    { v: '10', label: 'Klausul 10', desc: 'Peningkatan (CI)' },
                    { v: '4.1', label: '4.1 Konteks', desc: 'Internal & eksternal' },
                    { v: '4.2', label: '4.2 Pihak Berkep.', desc: 'Kebutuhan stakeholder' },
                    { v: '4.3', label: '4.3 Lingkup', desc: 'Lingkup penerapan' },
                    { v: '5.1', label: '5.1 Kepemimpinan', desc: 'Komitmen manajemen' },
                    { v: '5.2', label: '5.2 Kebijakan', desc: 'Kebijakan mutu/K3/LH' },
                    { v: '6.1', label: '6.1 Risiko', desc: 'Risiko & peluang' },
                    { v: '6.2', label: '6.2 Sasaran', desc: 'Sasaran & program' },
                    { v: '7.1', label: '7.1 Sumber Daya', desc: 'SDM, infrastruktur' },
                    { v: '8.1', label: '8.1 Operasi', desc: 'Perencanaan operasi' },
                  ] as const).map(opt => (
                    <button key={opt.v}
                      onClick={() => setDocKlausul(prev => prev.includes(opt.v) ? prev.filter(k => k !== opt.v) : [...prev, opt.v])}
                      className={cn('text-left p-1.5 rounded-lg border text-xs flex items-start gap-1.5 transition-colors', docKlausul.includes(opt.v) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:bg-muted')}>
                      <div className={cn('mt-0.5 w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center text-[8px]', docKlausul.includes(opt.v) ? 'bg-blue-600 border-blue-600 text-white' : 'border-border')}>
                        {docKlausul.includes(opt.v) && '✓'}
                      </div>
                      <div>
                        <div className="font-semibold text-[9px]">{opt.label}</div>
                        <div className="text-muted-foreground text-[8px] leading-snug">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDocKlausul(['4','5','6','7','8','9','10'])} className="text-[10px] text-blue-600 hover:underline">Pilih Semua Klausul Utama</button>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  <button onClick={() => setDocKlausul([])} className="text-[10px] text-muted-foreground hover:underline">Reset</button>
                </div>
              </div>

              {/* ── IDENTITAS DOKUMEN ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">🏷️ Identitas Dokumen <span className="font-normal text-muted-foreground">(header dokumen formal)</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Nomor Dokumen</label>
                    <input type="text" placeholder="Mis: MM-QMS-001" value={docNomorDok} onChange={e => setDocNomorDok(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Nomor Revisi/Versi</label>
                    <input type="text" placeholder="Mis: 01 / Rev. 02" value={docVersi} onChange={e => setDocVersi(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Tanggal Berlaku</label>
                    <input type="text" placeholder="Mis: 20 April 2025" value={docTanggalEfektif} onChange={e => setDocTanggalEfektif(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
              </div>

              {/* ── IDENTITAS ORGANISASI ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">🏢 Identitas Organisasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Nama Perusahaan / Organisasi</label>
                    <input type="text" placeholder={docNamaOrg || 'Mis: PT Konstruksi Sejahtera Indonesia'} value={docNamaOrg} onChange={e => setDocNamaOrg(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Departemen / Fungsi Pemilik Dokumen</label>
                    <input type="text" placeholder="Mis: Departemen QA/QC, Divisi K3LH" value={docDepartemen} onChange={e => setDocDepartemen(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-medium">Lingkup Penerapan</label>
                  <input type="text" placeholder="Mis: Seluruh kegiatan konstruksi di wilayah Jabodetabek — proyek senilai > Rp 5M"
                    value={docLingkup} onChange={e => setDocLingkup(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>

              {/* ── LEVEL DETAIL & BAHASA ── */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">📏 Level Kelengkapan Dokumen</label>
                  <div className="space-y-1.5">
                    {([
                      { v: 'ringkas', label: '⚡ Ringkas', desc: 'Struktur & poin utama — untuk draft awal atau presentasi' },
                      { v: 'standar', label: '📋 Standar', desc: 'Dokumen kerja lengkap — siap diterapkan dengan minor edit' },
                      { v: 'komprehensif', label: '🏆 Komprehensif', desc: 'Dokumen full detail — prosedur, contoh, form, cross-reference klausul' },
                    ] as const).map(opt => (
                      <button key={opt.v} onClick={() => setDocDetailLevel(opt.v)}
                        className={cn('w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors', docDetailLevel === opt.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:bg-muted')}>
                        <div className="font-semibold mb-0.5">{opt.label}</div>
                        <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">🌍 Bahasa Dokumen</label>
                  <div className="space-y-1.5">
                    {([
                      { v: 'id', label: '🇮🇩 Bahasa Indonesia', desc: 'Standar dokumen resmi nasional' },
                      { v: 'en', label: '🇺🇸 English', desc: 'Untuk perusahaan multinasional / audit internasional' },
                      { v: 'bilingual', label: '🌐 Bilingual (ID+EN)', desc: 'Teks Indonesia + istilah ISO dalam bahasa Inggris' },
                    ] as const).map(opt => (
                      <button key={opt.v} onClick={() => setDocBahasa(opt.v)}
                        className={cn('w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors', docBahasa === opt.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-border hover:bg-muted')}>
                        <div className="font-semibold mb-0.5">{opt.label}</div>
                        <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── INSTRUKSI KHUSUS ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">🛠️ Instruksi Khusus <span className="font-normal text-muted-foreground">(opsional — arahan spesifik ke AI)</span></label>
                <Textarea
                  placeholder={'Contoh:\n• Sesuaikan dengan industri konstruksi / pertambangan / manufaktur\n• Tambahkan kolom "Penanggungjawab" di setiap prosedur\n• Sertakan cross-reference ke dokumen terkait (MM-SOP-003, dll.)\n• Format tabel untuk semua prosedur operasional\n• Sertakan contoh formulir yang sudah terisi (filled example)'}
                  value={docCustomInstruksi}
                  onChange={e => setDocCustomInstruksi(e.target.value)}
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>

              {/* ── SUMMARY ── */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">📊 Ringkasan Konfigurasi Dokumen:</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-blue-700 dark:text-blue-300">
                  <span className="bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-full font-medium">{docKategori.toUpperCase()}</span>
                  <span className="bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-full font-medium">{docJenisISO.replace(/_/g,' ').toUpperCase()}</span>
                  {docStandar.map(s => <span key={s} className="bg-indigo-100 dark:bg-indigo-800/50 px-2 py-0.5 rounded-full font-medium">{s.replace(/_/g,' ').toUpperCase()}</span>)}
                  <span className="bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-full font-medium">{docKlausul.length} klausul</span>
                  <span className="bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-full font-medium">{docDetailLevel}</span>
                </div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                  ⏱️ Estimasi waktu: {docDetailLevel === 'ringkas' ? '~30 detik' : docDetailLevel === 'standar' ? '~50 detik' : '~75-90 detik'} · Model: GPT-4o · {docDetailLevel === 'komprehensif' ? '~8000' : docDetailLevel === 'standar' ? '~6000' : '~4000'} tokens
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-3 border-t shrink-0">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground"
              onClick={() => { setDocStandar(['iso_9001']); setDocKlausul(['4','5','6','7','8','9','10']); setDocNomorDok(''); setDocVersi('01'); setDocTanggalEfektif(''); setDocNamaOrg(''); setDocDepartemen(''); setDocLingkup(''); setDocDetailLevel('standar'); setDocBahasa('id'); setDocCustomInstruksi(''); }}>
              Reset ke Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDocConfigOpen(false)}>Batal</Button>
              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white" onClick={doGenerateDocument}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Dokumen Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── GPTs BUILDER CONFIG DIALOG ── */}
      <Dialog open={gptsConfigOpen} onOpenChange={setGptsConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 text-white">
                <BrainCircuit className="h-3.5 w-3.5" />
              </div>
              Konfigurasi Custom GPTs
              <Badge variant="secondary" className="text-xs">ChatGPT Custom GPT</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-5 py-3 px-1">

              {/* Konteks pipeline */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">📡 Data Pipeline yang akan digunakan GPTs:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Konten Ebook', active: !!docContent, note: docContent ? `${(docContent.length/1000).toFixed(1)}k char` : '' },
                    { label: 'Silabus', active: !!syllabusContent },
                    { label: 'Monetisasi', active: !!monoContent },
                    { label: 'Landing Page', active: !!lpContent },
                    { label: 'Harga', active: !!lpPrice },
                  ].map(d => (
                    <span key={d.label} className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', d.active ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300' : 'bg-muted border-border text-muted-foreground opacity-40')}>
                      {d.active ? '✓' : '○'} {d.label}{d.note ? ` (${d.note})` : ''}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Semakin lengkap pipeline → semakin cerdas dan spesifik GPTs yang dihasilkan</p>
              </div>

              {/* Nama GPT */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">🏷️ Nama GPTs <span className="font-normal text-muted-foreground">(opsional — auto jika kosong)</span></label>
                <input
                  type="text"
                  placeholder={`Contoh: ${projectTitle ? projectTitle + ' Expert' : 'Ebook Expert AI'}`}
                  value={gptsNama}
                  onChange={e => setGptsNama(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Tujuan Utama */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">🎯 Tujuan Utama GPTs</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'sales_assistant', label: '💰 Sales Assistant', desc: 'Meyakinkan calon pembeli, handle objeksi, tutup penjualan' },
                    { value: 'tutor', label: '📚 Tutor & Coach', desc: 'Mengajarkan materi ebook, latihan soal, quiz interaktif' },
                    { value: 'consultant', label: '🧠 Konsultan Ahli', desc: 'Memberikan saran & solusi berbasis isi ebook' },
                    { value: 'content_creator', label: '✍️ Content Creator', desc: 'Generate konten, caption, artikel dari topik ebook' },
                    { value: 'support', label: '🎧 Customer Support', desc: 'Jawab pertanyaan pelanggan, FAQ, after-sales' },
                    { value: 'research', label: '🔬 Research Assistant', desc: 'Riset mendalam, analisis data, summarize topik' },
                  ] as const).map(opt => (
                    <button key={opt.value} onClick={() => setGptsTujuan(opt.value)}
                      className={cn('text-left p-2.5 rounded-lg border text-xs transition-colors', gptsTujuan === opt.value ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' : 'border-border hover:border-emerald-400 hover:bg-muted')}>
                      <div className="font-semibold mb-0.5">{opt.label}</div>
                      <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gaya Komunikasi */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">🎨 Gaya Komunikasi & Persona</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: 'profesional', label: '👔 Profesional', desc: 'Formal, kredibel, berbasis data' },
                    { value: 'santai', label: '😊 Santai & Ramah', desc: 'Casual, akrab, mudah dipahami' },
                    { value: 'motivatif', label: '🔥 Motivatif', desc: 'Energik, inspiring, action-oriented' },
                    { value: 'coaching', label: '🎯 Coaching', desc: 'Bertanya balik, reflektif, guided' },
                    { value: 'expert', label: '🔬 Pakar/Expert', desc: 'Teknis mendalam, berbasis riset' },
                    { value: 'storytelling', label: '📖 Storytelling', desc: 'Naratif, contoh kasus, cerita' },
                  ] as const).map(opt => (
                    <button key={opt.value} onClick={() => setGptsGaya(opt.value)}
                      className={cn('text-left p-2 rounded-lg border text-xs transition-colors', gptsGaya === opt.value ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'border-border hover:bg-muted')}>
                      <div className="font-semibold mb-0.5">{opt.label}</div>
                      <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">⚡ Capabilities yang Diaktifkan</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'web_search', label: '🌐 Web Search', desc: 'GPTs bisa browsing internet real-time' },
                    { value: 'code_interpreter', label: '💻 Code Interpreter', desc: 'Analisis data, buat grafik, jalankan kode Python' },
                    { value: 'dalle', label: '🎨 DALL-E Image Gen', desc: 'Generate gambar, ilustrasi, diagram visual' },
                    { value: 'actions', label: '🔌 Actions/Plugins', desc: 'Koneksi ke API eksternal (webhook, Zapier, dll)' },
                  ] as const).map(opt => (
                    <button key={opt.value}
                      onClick={() => setGptsCapabilities(prev => prev.includes(opt.value) ? prev.filter(c => c !== opt.value) : [...prev, opt.value])}
                      className={cn('text-left p-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2', gptsCapabilities.includes(opt.value) ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'border-border hover:bg-muted')}>
                      <div className={cn('mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px]', gptsCapabilities.includes(opt.value) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border')}>
                        {gptsCapabilities.includes(opt.value) && '✓'}
                      </div>
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bahasa + Monetisasi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">🌍 Bahasa GPTs</label>
                  {(['id', 'en', 'bilingual'] as const).map(lang => (
                    <button key={lang} onClick={() => setGptsLanguage(lang)}
                      className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors block', gptsLanguage === lang ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 font-medium' : 'border-border hover:bg-muted')}>
                      {lang === 'id' ? '🇮🇩 Bahasa Indonesia' : lang === 'en' ? '🇺🇸 English' : '🌐 Bilingual (ID+EN)'}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">💰 Tujuan Monetisasi</label>
                  {([
                    { v: true, label: '✅ Ya — GPTs ini untuk menjual produk' },
                    { v: false, label: '📚 Tidak — untuk edukasi/komunitas' },
                  ] as const).map(opt => (
                    <button key={String(opt.v)} onClick={() => setGptsMonetize(opt.v)}
                      className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors block', gptsMonetize === opt.v ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 font-medium' : 'border-border hover:bg-muted')}>
                      {opt.label}
                    </button>
                  ))}
                  <label className="text-xs font-semibold text-foreground block mt-3">🔒 Persona Khusus <span className="font-normal text-muted-foreground">(opsional)</span></label>
                  <Textarea placeholder={'Contoh: Kamu adalah mentor bernama "Rani" — seorang pakar keuangan yang pernah bangkrut dan bangkit kembali...'} value={gptsPersonality} onChange={e => setGptsPersonality(e.target.value)} rows={3} className="text-xs resize-none" />
                </div>
              </div>

              {/* Batasan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">🚫 Batasan & Topik yang Dilarang <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <Textarea placeholder={'Contoh:\nJangan bahas produk kompetitor\nJangan berikan saran medis/hukum\nJangan membahas topik di luar ebook ini\nSelalu arahkan ke pembelian jika ditanya harga'} value={gptsBatasan} onChange={e => setGptsBatasan(e.target.value)} rows={3} className="text-xs resize-none" />
              </div>

              {/* Format Output */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">📋 Format Output Default <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <Textarea placeholder={'Contoh:\nGunakan bullet points untuk daftar\nSertakan contoh konkret di setiap penjelasan\nAkhiri setiap jawaban dengan 1 pertanyaan lanjutan\nMaksimal 300 kata per respons kecuali diminta lebih'} value={gptsOutputFormat} onChange={e => setGptsOutputFormat(e.target.value)} rows={3} className="text-xs resize-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
            <Button variant="outline" size="sm" onClick={() => setGptsConfigOpen(false)}>Batal</Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white" onClick={doGenerateGPTs}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Konfigurasi GPTs
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── GPTs BUILDER RESULT DIALOG ── */}
      <Dialog open={gptsOpen} onOpenChange={setGptsOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 text-white">
                <BrainCircuit className="h-3.5 w-3.5" />
              </div>
              Custom GPTs Configuration
              <Badge variant="secondary" className="ml-1 text-xs">Siap paste ke ChatGPT</Badge>
            </DialogTitle>
          </DialogHeader>
          {gptsLoading && !gptsContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <BrainCircuit className="absolute inset-0 m-auto h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">AI sedang merancang Custom GPTs dari ebook kamu...</p>
              <p className="text-xs text-muted-foreground/60">~30-40 detik</p>
            </div>
          )}
          {(gptsContent || gptsLoading) && (() => {
            const getSection = (tag: string) => {
              const m = gptsContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : '';
            };
            const tabs = [
              { key: 'formfill', label: '📋 Form Filler', tag: '' as const, color: 'from-emerald-600 to-teal-600', desc: 'Auto-fill siap pakai untuk ChatGPT GPT Editor & Poe.com Create Agent' },
              { key: 'instruksi', label: '🧠 Instruksi', tag: 'INSTRUKSI', color: 'from-emerald-700 to-green-700', desc: 'Paste ke field "Instructions" di ChatGPT' },
              { key: 'overview', label: '🏷️ Overview', tag: 'OVERVIEW', color: 'from-slate-700 to-gray-700', desc: 'Nama, deskripsi, dan tagline untuk GPT Store' },
              { key: 'starters', label: '💬 Starters', tag: 'STARTERS', color: 'from-blue-700 to-indigo-700', desc: 'Conversation starters — pertanyaan pembuka' },
              { key: 'knowledge', label: '📁 Knowledge', tag: 'KNOWLEDGE', color: 'from-purple-700 to-violet-700', desc: 'File yang perlu diupload ke knowledge base' },
              { key: 'capabilities', label: '⚡ Capabilities', tag: 'CAPABILITIES', color: 'from-orange-600 to-amber-600', desc: 'Pengaturan capabilities & actions' },
              { key: 'persona', label: '🎨 Persona', tag: 'PERSONA', color: 'from-pink-600 to-rose-600', desc: 'Karakter, gaya, dan contoh percakapan' },
              { key: 'publish', label: '🚀 Publish', tag: 'PUBLISH', color: 'from-teal-600 to-cyan-600', desc: 'Langkah demi langkah publish ke GPT Store' },
              { key: 'security', label: '🔒 Keamanan', tag: 'SECURITY', color: 'from-red-600 to-rose-700', desc: 'Proteksi prompt, batasan, dan anti-jailbreak' },
            ];
            const currentTab = tabs.find(t => t.key === gptsTab);
            const instruksiContent = getSection('INSTRUKSI');

            // Helper: extract fields for form filling
            const overviewRaw = getSection('OVERVIEW');
            const startersRaw = getSection('STARTERS');
            const extractLine = (raw: string, label: string) => {
              const m = raw.match(new RegExp(`## ${label}[^\\n]*\\n([^\\n#]+)`));
              return m ? m[1].trim() : '';
            };
            const formNama = extractLine(overviewRaw, 'Nama GPTs?') || gptsNama || (projectTitle ? `${projectTitle} AI Expert` : 'AI Expert');
            const formDesc = extractLine(overviewRaw, 'Deskripsi Singkat') || extractLine(overviewRaw, 'Tagline');
            const formDescPanjang = extractLine(overviewRaw, 'Deskripsi Panjang');
            const formStarters = startersRaw.split('\n').filter(l => /^[1-9]\./.test(l.trim())).slice(0, 6).map(l => l.replace(/^\d\.\s*/, '').trim());
            const formWelcome = (() => { const m = startersRaw.match(/## Welcome Message\n([\s\S]*?)(?=\n##|$)/); return m ? m[1].trim() : ''; })();

            return (
              <>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setGptsTab(tab.key as typeof gptsTab)}
                      className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        gptsTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white border-transparent` : "border-border hover:border-emerald-400"
                      )}>{tab.label}</button>
                  ))}
                </div>
                {currentTab && (
                  <div className="text-[10px] text-muted-foreground flex-shrink-0 px-1">💡 {currentTab.desc}</div>
                )}
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {gptsTab === 'formfill' ? (
                    // ── FORM FILLER TAB ──
                    <ScrollArea className="flex-1">
                      <div className="space-y-4 p-1">

                        {/* === CHATGPT GPT EDITOR === */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="bg-gradient-to-r from-slate-800 to-gray-800 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              🤖 ChatGPT GPT Editor
                            </span>
                            <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 underline">
                              <ExternalLink className="h-2.5 w-2.5" /> chatgpt.com/gpts/editor
                            </a>
                          </div>
                          <div className="p-3 space-y-3 bg-white dark:bg-slate-900">
                            {/* Name */}
                            {(() => {
                              const copyBtn = (val: string, label: string) => (
                                <button onClick={() => { navigator.clipboard.writeText(val); toast({ title: `✅ ${label} disalin!` }); }}
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors">
                                  <Copy className="h-2.5 w-2.5" /> Salin
                                </button>
                              );
                              return (
                                <>
                                  {/* Name */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</label>
                                      {copyBtn(formNama, 'Nama')}
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-foreground font-medium">
                                      {formNama || <span className="text-muted-foreground italic">Belum tersedia — generate terlebih dahulu</span>}
                                    </div>
                                  </div>
                                  {/* Description */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description <span className="font-normal normal-case">(maks 300 karakter)</span></label>
                                      {copyBtn(formDesc || formDescPanjang, 'Description')}
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-foreground leading-relaxed">
                                      {formDesc || formDescPanjang || <span className="text-muted-foreground italic">Belum tersedia</span>}
                                    </div>
                                    {(formDesc || formDescPanjang) && (
                                      <p className="text-[10px] text-muted-foreground">{(formDesc || formDescPanjang).length}/300 karakter</p>
                                    )}
                                  </div>
                                  {/* Instructions */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Instructions <span className="font-normal normal-case text-emerald-600 dark:text-emerald-400">← field terpenting</span></label>
                                      <button onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '🧠 Instructions disalin! Paste di field Instructions ChatGPT' }); }}
                                        className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors">
                                        <Copy className="h-2.5 w-2.5" /> Salin Instructions
                                      </button>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 text-[10px] font-mono text-foreground leading-relaxed max-h-28 overflow-hidden relative">
                                      {instruksiContent ? instruksiContent.slice(0, 300) + '...' : <span className="text-muted-foreground italic">Belum tersedia</span>}
                                      {instruksiContent && <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-emerald-50/80 dark:from-emerald-900/40 to-transparent" />}
                                    </div>
                                    {instruksiContent && <p className="text-[10px] text-muted-foreground">{instruksiContent.length} karakter total — klik "Salin Instructions" untuk copy semua</p>}
                                  </div>
                                  {/* Conversation Starters */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Conversation Starters <span className="font-normal normal-case">(maks 4, copy satu-satu)</span></label>
                                    {formStarters.length > 0 ? formStarters.slice(0, 4).map((s, i) => (
                                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                                        <span className="text-[10px] text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
                                        <span className="text-xs flex-1 leading-snug">{s}</span>
                                        {copyBtn(s, `Starter ${i + 1}`)}
                                      </div>
                                    )) : <span className="text-[10px] text-muted-foreground italic">Belum tersedia</span>}
                                  </div>
                                  {/* Step guide */}
                                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2.5 space-y-1">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300">📋 Cara Isi Form ChatGPT GPT Editor:</p>
                                    <ol className="text-[10px] text-blue-700 dark:text-blue-300 space-y-0.5 list-decimal list-inside">
                                      <li>Buka <a href="https://chatgpt.com/gpts/editor" target="_blank" className="underline font-semibold">chatgpt.com/gpts/editor</a></li>
                                      <li>Klik tab <strong>"Configure"</strong> (bukan "Create")</li>
                                      <li>Isi field <strong>Name</strong> → salin dari atas</li>
                                      <li>Isi field <strong>Description</strong> → salin dari atas</li>
                                      <li>Isi field <strong>Instructions</strong> → klik "Salin Instructions" → paste</li>
                                      <li>Isi <strong>Conversation Starters</strong> → salin 1 per 1, max 4</li>
                                      <li>Klik <strong>Save</strong> → pilih siapa yang bisa akses</li>
                                    </ol>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* === POE.COM CREATE AGENT === */}
                        <div className="rounded-xl border border-violet-200 dark:border-violet-700 overflow-hidden">
                          <div className="bg-gradient-to-r from-violet-700 to-purple-700 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              🟣 Poe.com — Create a Bot/Agent
                            </span>
                            <a href="https://poe.com/create_bot" target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-violet-200 hover:text-white flex items-center gap-1 underline">
                              <ExternalLink className="h-2.5 w-2.5" /> poe.com/create_bot
                            </a>
                          </div>
                          <div className="p-3 space-y-3 bg-white dark:bg-slate-900">
                            {(() => {
                              const copyBtn = (val: string, label: string) => (
                                <button onClick={() => { navigator.clipboard.writeText(val); toast({ title: `✅ ${label} disalin!` }); }}
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 text-[10px] font-semibold text-violet-700 dark:text-violet-300 transition-colors">
                                  <Copy className="h-2.5 w-2.5" /> Salin
                                </button>
                              );
                              return (
                                <>
                                  {/* Name */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</label>
                                      {copyBtn(formNama, 'Nama')}
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-medium">
                                      {formNama || <span className="text-muted-foreground italic">Belum tersedia</span>}
                                    </div>
                                  </div>
                                  {/* Description */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</label>
                                      {copyBtn(formDesc || formDescPanjang, 'Description')}
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed">
                                      {formDesc || formDescPanjang || <span className="text-muted-foreground italic">Belum tersedia</span>}
                                    </div>
                                  </div>
                                  {/* Content / System Prompt */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Content <span className="font-normal normal-case text-violet-600 dark:text-violet-400">(System Prompt / Instructions)</span></label>
                                      <button onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '🟣 Content/Instructions disalin! Paste di field Content Poe.com' }); }}
                                        className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 text-[10px] font-semibold text-violet-700 dark:text-violet-300 transition-colors">
                                        <Copy className="h-2.5 w-2.5" /> Salin Content
                                      </button>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10 text-[10px] font-mono leading-relaxed max-h-24 overflow-hidden relative">
                                      {instruksiContent ? instruksiContent.slice(0, 200) + '...' : <span className="text-muted-foreground italic">Belum tersedia</span>}
                                      {instruksiContent && <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-violet-50/80 dark:from-violet-900/40 to-transparent" />}
                                    </div>
                                  </div>
                                  {/* Start Messages */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Add Start Messages <span className="font-normal normal-case">(tambahkan satu per satu)</span></label>
                                    {formStarters.length > 0 ? formStarters.map((s, i) => (
                                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10">
                                        <span className="text-[10px] text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
                                        <span className="text-xs flex-1 leading-snug">{s}</span>
                                        {copyBtn(s, `Start Message ${i + 1}`)}
                                      </div>
                                    )) : <span className="text-[10px] text-muted-foreground italic">Belum tersedia</span>}
                                  </div>
                                  {/* Welcome Message */}
                                  {formWelcome && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Welcome Message <span className="font-normal normal-case">(opsional)</span></label>
                                        {copyBtn(formWelcome, 'Welcome Message')}
                                      </div>
                                      <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed">
                                        {formWelcome}
                                      </div>
                                    </div>
                                  )}
                                  {/* Capabilities recommendation */}
                                  <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 p-2.5 space-y-1">
                                    <p className="text-[10px] font-bold text-violet-700 dark:text-violet-300">⚡ Capabilities yang Direkomendasikan di Poe:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {gptsCapabilities?.includes('web_search') && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-200 border border-violet-300 dark:border-violet-600 font-medium">✓ Web Search</span>}
                                      {gptsCapabilities?.includes('dalle') && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-200 border border-violet-300 dark:border-violet-600 font-medium">✓ Image Generation</span>}
                                      {gptsCapabilities?.includes('code_interpreter') && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-200 border border-violet-300 dark:border-violet-600 font-medium">✓ Code Interpreter</span>}
                                      <span className="text-[10px] text-violet-600 dark:text-violet-400">Aktifkan sesuai kebutuhan di tab Capabilities</span>
                                    </div>
                                    <ol className="text-[10px] text-violet-700 dark:text-violet-300 space-y-0.5 list-decimal list-inside mt-1">
                                      <li>Buka <a href="https://poe.com/create_bot" target="_blank" className="underline font-semibold">poe.com/create_bot</a></li>
                                      <li>Pilih <strong>"Custom bot"</strong> atau <strong>"Server bot"</strong></li>
                                      <li>Isi <strong>Name</strong> + <strong>Description</strong> → salin dari atas</li>
                                      <li>Isi <strong>Content</strong> (system prompt) → klik "Salin Content" → paste</li>
                                      <li>Tambahkan <strong>Start Messages</strong> satu per satu → salin dari atas</li>
                                      <li>Pilih model (GPT-4o atau Claude recommended)</li>
                                      <li>Klik <strong>Create bot</strong></li>
                                    </ol>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    </ScrollArea>
                  ) : gptsTab === 'instruksi' ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        <strong>🧠 System Prompt Siap Pakai</strong> — Pergi ke <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer" className="underline font-semibold">chatgpt.com/gpts/editor</a> → Tab "Configure" → Field "Instructions" → Paste kode di bawah ini.
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="text-xs font-mono bg-slate-900 text-emerald-300 dark:bg-slate-950 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {instruksiContent || (gptsLoading ? '// Generating instructions...' : '—')}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '🧠 Instruksi disalin! Buka chatgpt.com/gpts/editor → Instructions → Paste' }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                          <Copy className="h-4 w-4 mr-2" />Salin Instruksi
                        </Button>
                        <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer"
                          onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '✅ Instruksi disalin! Paste di field Instructions' }); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-800 to-gray-800 text-white text-xs font-semibold hover:from-slate-900 transition-all">
                          <ExternalLink className="h-3.5 w-3.5" /> Buka GPT Editor
                        </a>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="p-2">
                        {currentTab?.tag && getSection(currentTab.tag) ? (
                          <>
                            <MarkdownContent content={getSection(currentTab.tag)!} />
                            {gptsLoading && gptsContent.includes(`===${currentTab.tag}===`) && !gptsContent.includes(`===AKHIR_${currentTab.tag}===`) && <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />}
                          </>
                        ) : gptsLoading ? <span className="text-muted-foreground text-xs">Generating... <span className="inline-block w-2 h-3 bg-emerald-500 animate-pulse ml-1" /></span> : <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </ScrollArea>
                  )}
                  {/* Quick Launch — 2 kategori */}
                  {gptsContent && !gptsLoading && (() => {
                    const overviewContent = getSection('OVERVIEW');
                    const namaGPT = overviewContent.match(/Nama GPTs?\n([^\n]+)/)?.[1]?.trim() || gptsNama || projectTitle || 'AI Expert';
                    const taglineGPT = overviewContent.match(/Tagline[^\n]*\n([^\n]+)/)?.[1]?.trim() || '';

                    // Prompt untuk build web chatbot app via Bolt/Lovable/Replit
                    const webChatbotPrompt = `Build a professional web chatbot application called "${namaGPT}"${taglineGPT ? ` — ${taglineGPT}` : ''}.

TOPIC: ${projectTitle || projectTopik}
TARGET USERS: ${projectTarget || 'ebook readers and interested users'}

SYSTEM INSTRUCTIONS FOR THE CHATBOT (paste exactly as the AI system prompt):
---
${instruksiContent.slice(0, 2000)}
---

TECHNICAL REQUIREMENTS:
- Framework: React + TypeScript + Tailwind CSS
- Chat UI: Clean, modern chat interface (similar to ChatGPT UI)
- Message bubbles: user on right (blue), AI on left (gray/white)
- Show typing indicator while AI is responding
- Support markdown rendering in AI responses
- Mobile responsive design
- OpenAI API integration (GPT-4o-mini for cost efficiency)
- Store chat history in component state
- Clear chat button
- Welcome message on load

UI FEATURES:
- Header with bot name "${namaGPT}" and avatar
- Input field with send button (also send on Enter)
- Smooth scroll to bottom on new messages
- Copy button on each AI message
- Suggested starter questions shown before first message

STARTER QUESTIONS TO SHOW:
${getSection('STARTERS').split('\n').filter(l => /^\d\./.test(l.trim())).slice(0, 4).map(l => `- ${l.replace(/^\d\.\s*/,'')}`).join('\n') || '- Apa yang bisa kamu bantu?\n- Jelaskan tentang topik ini\n- Berikan rekomendasi untuk saya'}

START by creating the main App component with the chat interface.`;

                    const encodedWebPrompt = encodeURIComponent(webChatbotPrompt);

                    return (
                      <div className="flex-shrink-0 border border-border rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-gray-800 px-3 py-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Rocket className="h-3.5 w-3.5" /> Deploy GPTs — Pilih Platform:
                          </p>
                          <span className="text-[10px] text-slate-400">2 jalur tersedia</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 space-y-2.5">

                          {/* JALUR 1: Custom GPT di ChatGPT */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              🤖 Jalur 1 — Custom GPT di Platform AI (paste instruksi):
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              <a href="https://chatgpt.com/gpts/editor" target="_blank" rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '✅ Instruksi disalin! Buka ChatGPT → Paste di field Instructions' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-800 to-gray-700 text-white text-xs font-semibold hover:from-slate-900 transition-all shadow-sm">
                                <Copy className="h-3 w-3" /> ChatGPT GPT Editor
                                <span className="bg-white/20 rounded px-1 text-[9px] font-bold">UTAMA</span>
                              </a>
                              <a href="https://poe.com/create_bot" target="_blank" rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '📋 Instruksi disalin! Paste di Poe.com → Create Bot' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold hover:from-violet-700 transition-all shadow-sm">
                                <Copy className="h-3 w-3" /> Poe.com
                              </a>
                              <a href="https://character.ai/character/create" target="_blank" rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '📋 Instruksi disalin! Paste di Character.AI' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 transition-all shadow-sm">
                                <Copy className="h-3 w-3" /> Character.AI
                              </a>
                              <a href="https://flowiseai.com" target="_blank" rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(instruksiContent); toast({ title: '📋 Instruksi disalin untuk Flowise!' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold hover:from-teal-700 transition-all shadow-sm">
                                <Copy className="h-3 w-3" /> Flowise
                              </a>
                            </div>
                          </div>

                          <div className="border-t border-border" />

                          {/* JALUR 2: Build web chatbot app */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              🌐 Jalur 2 — Build Web Chatbot App sendiri (full control):
                            </p>
                            <div className="space-y-1">
                              <p className="text-[10px] text-green-700 dark:text-green-400 flex items-center gap-1 font-medium">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                                Otomatis — klik langsung, prompt sudah terisi:
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                <a
                                  href={`https://bolt.new/?prompt=${encodedWebPrompt}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => toast({ title: '⚡ Membuka Bolt.new — prompt chatbot sudah otomatis terisi!' })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all shadow-sm">
                                  <Zap className="h-3 w-3" /> Bolt.new
                                  <span className="bg-white/20 rounded px-1 text-[9px] font-bold">AUTO</span>
                                </a>
                                <a
                                  href={`https://replit.com/new?${new URLSearchParams({ description: webChatbotPrompt.slice(0, 500) }).toString()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => { navigator.clipboard.writeText(webChatbotPrompt); toast({ title: '⚡ Membuka Replit — prompt juga disalin sebagai backup!' }); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                                  <Zap className="h-3 w-3" /> Replit
                                  <span className="bg-white/20 rounded px-1 text-[9px] font-bold">AUTO</span>
                                </a>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Copy + Paste — prompt disalin otomatis:
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                <a href="https://lovable.dev/projects/new" target="_blank" rel="noopener noreferrer"
                                  onClick={() => { navigator.clipboard.writeText(webChatbotPrompt); toast({ title: '📋 Prompt chatbot disalin! Paste ke Lovable.dev' }); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:from-purple-700 transition-all shadow-sm">
                                  <Copy className="h-3 w-3" /> Lovable.dev
                                </a>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(webChatbotPrompt); toast({ title: '📋 Prompt disalin! Buka Cursor → New Chat → Paste', description: 'Cursor adalah IDE desktop — buka aplikasinya lalu paste prompt di AI chat.' }); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-gray-600 text-white text-xs font-semibold hover:from-slate-700 transition-all shadow-sm">
                                  <Copy className="h-3 w-3" /> Cursor IDE
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 text-[10px] text-blue-700 dark:text-blue-300">
                            <strong>💡 Mana yang dipilih?</strong> Jalur 1 (ChatGPT) = paling cepat, gratis, tapi pengguna butuh akun ChatGPT. Jalur 2 (Web App) = full kontrol, bisa branding sendiri, bisa di-embed di website, tidak tergantung ChatGPT.
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(gptsContent); toast({ title: 'Semua konfigurasi GPTs disalin!' }); }}><Copy className="h-4 w-4 mr-2" />Salin Semua</Button>
                    <Button variant="outline" onClick={() => { const b=new Blob([gptsContent],{type:'text/plain'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`config-gpts-${(projectTitle||'gpts').slice(0,20).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button disabled={gptsLoading} onClick={handleGenerateGPTs} className="bg-gradient-to-r from-emerald-600 to-green-700 text-white"><Sparkles className="h-4 w-4 mr-2" />Buat Ulang</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Chatbot Demo Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl h-[88vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              Chatbot Demo — AI dari Ebook Kamu
              <Badge variant="secondary" className="ml-1 text-xs">Live · GPT-4o-mini</Badge>
            </DialogTitle>
          </DialogHeader>
          {/* Data sources status */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2 flex-shrink-0 space-y-2">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">🧠 Data yang memberdayakan chatbot ini:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Konten Ebook', active: !!docContent, icon: '📖' },
                { label: 'Silabus', active: !!syllabusContent, icon: '🎓' },
                { label: 'Kuis', active: !!quizContent, icon: '❓' },
                { label: 'Harga & Monetisasi', active: !!monoContent, icon: '💰' },
                { label: 'Marketing Kit', active: !!mktContent, icon: '📣' },
              ].map(src => (
                <span key={src.label} className={cn(
                  'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium',
                  src.active
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                    : 'bg-muted border-border text-muted-foreground line-through opacity-50'
                )}>
                  {src.icon} {src.label}
                </span>
              ))}
            </div>
            {!docContent && !syllabusContent && !monoContent && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">💡 Generate beberapa output pipeline dulu untuk chatbot yang lebih cerdas dan spesifik!</p>
            )}
          </div>
          {/* Suggested questions chips */}
          {chatMessages.length <= 1 && projectTopik && (
            <div className="flex-shrink-0 space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium px-1">Pertanyaan yang bisa kamu tanya:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...getSuggestedQuestions(projectTopik),
                  ...(monoContent ? ['Berapa harga ebook ini?', 'Bagaimana cara beli?'] : []),
                  ...(syllabusContent ? ['Apa saja modul di kursus ini?'] : []),
                  ...(quizContent ? ['Berikan saya soal latihan'] : []),
                ].slice(0, 8).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(q); }}
                    className="px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-2 pb-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === 'user'
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        <Bot className="h-3 w-3" />AI Assistant
                        {i === chatMessages.length - 1 && chatLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content || (chatLoading && i === chatMessages.length - 1 ? <span className="inline-block w-2 h-3 bg-muted-foreground/50 animate-pulse" /> : '')}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-1 flex-shrink-0 pt-1.5 border-t border-border flex-wrap">
            <Button
              size="sm" variant="ghost"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => {
                const txt = chatMessages.map(m => `${m.role === 'user' ? 'Kamu' : 'AI'}: ${m.content}`).join('\n\n');
                navigator.clipboard.writeText(txt);
                toast({ description: 'Percakapan disalin!' });
              }}
            >
              <Copy className="h-3 w-3" /> Salin Percakapan
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => { setChatOpen(false); setTimeout(() => handleGenerateLandingPage(), 300); }}
            >
              <ExternalLink className="h-3 w-3" /> → Landing Page
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => { setChatOpen(false); setTimeout(() => { setQuizConfigOpen(true); }, 300); }}
            >
              <HelpCircle className="h-3 w-3" /> → Buat Kuis
            </Button>
          </div>
          <div className="flex gap-2 flex-shrink-0 pt-1 border-t border-border">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }}}
              placeholder="Tanya sesuatu tentang ebook ini..."
              disabled={chatLoading}
              data-testid="input-chat"
              className="flex-1"
            />
            <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="button-send-chat">
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => { setChatMessages([{ role: 'assistant', content: `Halo! Saya siap menjawab pertanyaan tentang **"${projectTitle || projectTopik}"**. Ada yang ingin kamu tanyakan? 😊` }]); }} title="Reset chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Silabus Kursus Dialog */}
      <Dialog open={syllabusOpen} onOpenChange={setSyllabusOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-white">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              Silabus E-Course Lengkap
              <Badge variant="secondary" className="ml-1 text-xs">8 Modul · Worksheet · Sertifikat</Badge>
            </DialogTitle>
          </DialogHeader>
          {syllabusLoading && !syllabusContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin" />
                <GraduationCap className="absolute inset-0 m-auto h-6 w-6 text-cyan-500" />
              </div>
              <p className="text-sm text-muted-foreground">AI sedang merancang silabus e-course 8 modul...</p>
              <p className="text-xs text-muted-foreground/60">~20-30 detik</p>
            </div>
          )}
          {(syllabusContent || syllabusLoading) && (() => {
            const getSection = (tag: string) => {
              const m = syllabusContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : syllabusContent;
            };
            const tabs = [
              { key: 'overview', label: '📋 Overview', tag: 'OVERVIEW', color: 'from-cyan-600 to-teal-500' },
              { key: 'modul', label: '📚 8 Modul', tag: 'MODUL', color: 'from-blue-600 to-indigo-500' },
              { key: 'worksheet', label: '📝 Worksheet', tag: 'WORKSHEET', color: 'from-orange-500 to-amber-500' },
              { key: 'sertifikat', label: '🎓 Sertifikat', tag: 'SERTIFIKAT', color: 'from-yellow-500 to-orange-500' },
            ] as const;
            const currentTab = tabs.find(t => t.key === syllabusTab)!;
            return (
              <>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setSyllabusTab(tab.key)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        syllabusTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white border-transparent` : "border-border hover:border-cyan-300"
                      )}>{tab.label}</button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {getSection(currentTab.tag) ? (
                        <>
                          <MarkdownContent content={getSection(currentTab.tag)!} />
                          {syllabusLoading && syllabusContent.includes(`===${currentTab.tag}===`) && !syllabusContent.includes(`===AKHIR_${currentTab.tag}===`) && <span className="inline-block w-2 h-4 bg-cyan-500 animate-pulse ml-1" />}
                        </>
                      ) : syllabusLoading ? <span className="text-muted-foreground text-xs">Generating... <span className="inline-block w-2 h-3 bg-cyan-500 animate-pulse ml-1" /></span> : <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(syllabusContent); toast({ title: 'Silabus disalin!' }); }}><Copy className="h-4 w-4 mr-2" />Salin Semua</Button>
                    <Button variant="outline" onClick={() => { const b = new Blob([syllabusContent],{type:'text/plain'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`silabus-${(projectTitle||'kursus').slice(0,25).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button disabled={syllabusLoading} onClick={handleGenerateSyllabus} className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white"><Sparkles className="h-4 w-4 mr-2" />Buat Ulang</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── MINI APP CONFIG DIALOG ── */}
      <Dialog open={appConfigOpen} onOpenChange={setAppConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-slate-700 to-gray-800 text-white">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
              Konfigurasi Blueprint Mini App
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-5 py-3 px-1">

              {/* Data Pipeline */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">📡 Konteks dari Pipeline Ebook:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Konten Ebook', active: !!docContent, chars: docContent?.length },
                    { label: 'Silabus', active: !!syllabusContent },
                    { label: 'Topik', active: !!(projectTopik || projectTitle) },
                    { label: 'Target Pembaca', active: !!projectTarget },
                  ].map(d => (
                    <span key={d.label} className={cn('text-[10px] px-1.5 py-0.5 rounded border', d.active ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400' : 'bg-muted border-border text-muted-foreground opacity-40')}>
                      {d.active ? '✓' : '○'} {d.label}
                      {d.chars && d.chars > 0 ? ` (${(d.chars/1000).toFixed(1)}k)` : ''}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Semakin banyak konten ebook yang tersedia, semakin spesifik Mini App yang dihasilkan.</p>
              </div>

              {/* Tipe Mini App */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">🎯 Tipe Mini App</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'auto', label: '🤖 Auto Detect', desc: 'AI tentukan sendiri berdasarkan materi' },
                    { value: 'kalkulator', label: '🧮 Kalkulator', desc: 'Hitung & kalkulasi dari formula ebook' },
                    { value: 'checklist', label: '✅ Checklist', desc: 'Daftar tindakan & progress tracking' },
                    { value: 'assessment', label: '📊 Assessment', desc: 'Kuis/tes kompetensi dari materi' },
                    { value: 'generator', label: '✨ Generator', desc: 'Generate template/draft otomatis' },
                    { value: 'tracker', label: '📈 Tracker', desc: 'Lacak progres & habit implementasi' },
                    { value: 'simulator', label: '🎮 Simulator', desc: 'Simulasi skenario dari materi' },
                    { value: 'dashboard', label: '📋 Dashboard', desc: 'Ringkasan data & metrik personal' },
                    { value: 'tool', label: '🔧 Multi-Tool', desc: 'Kumpulan alat bantu dari materi' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAppType(opt.value)}
                      className={cn('text-left p-2 rounded-lg border text-xs transition-colors', appType === opt.value ? 'border-slate-600 bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200' : 'border-border hover:border-slate-400 hover:bg-muted')}
                    >
                      <div className="font-semibold mb-0.5">{opt.label}</div>
                      <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kompleksitas */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">⚡ Tingkat Kompleksitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'simple', label: '🟢 Simple', desc: '1-2 fitur utama, selesai dalam 1 hari, cocok untuk pemula' },
                    { value: 'medium', label: '🟡 Medium', desc: '3-5 fitur, beberapa halaman, cocok untuk 2-3 hari build' },
                    { value: 'advanced', label: '🔴 Advanced', desc: '5+ fitur, backend, database, full product' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAppComplexity(opt.value)}
                      className={cn('text-left p-2 rounded-lg border text-xs transition-colors', appComplexity === opt.value ? 'border-slate-600 bg-slate-100 dark:bg-slate-800/60' : 'border-border hover:border-slate-400 hover:bg-muted')}
                    >
                      <div className="font-semibold mb-0.5">{opt.label}</div>
                      <div className="text-muted-foreground text-[10px] leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform & AI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">🖥️ Platform Target</label>
                  <div className="space-y-1.5">
                    {([
                      { value: 'web', label: '🌐 Web App (React/Next.js)' },
                      { value: 'pwa', label: '📱 PWA (Mobile-first)' },
                      { value: 'static', label: '📄 HTML Static (1 file)' },
                      { value: 'whatsapp', label: '💬 WhatsApp Bot' },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setAppPlatform(opt.value)} className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors', appPlatform === opt.value ? 'border-slate-600 bg-slate-100 dark:bg-slate-800/60 font-medium' : 'border-border hover:bg-muted')}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">🌍 Bahasa App</label>
                    <div className="space-y-1.5">
                      {([
                        { value: 'id', label: '🇮🇩 Bahasa Indonesia' },
                        { value: 'en', label: '🇺🇸 English' },
                        { value: 'bilingual', label: '🌐 Bilingual (ID+EN)' },
                      ] as const).map(opt => (
                        <button key={opt.value} onClick={() => setAppLang(opt.value)} className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors', appLang === opt.value ? 'border-slate-600 bg-slate-100 dark:bg-slate-800/60 font-medium' : 'border-border hover:bg-muted')}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">🤖 Integrasi AI</label>
                    <div className="space-y-1.5">
                      {([
                        { value: true, label: '✅ Ya — tambahkan AI/chatbot' },
                        { value: false, label: '❌ Tidak — tanpa AI' },
                      ] as const).map(opt => (
                        <button key={String(opt.value)} onClick={() => setAppNeedAI(opt.value)} className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors', appNeedAI === opt.value ? 'border-slate-600 bg-slate-100 dark:bg-slate-800/60 font-medium' : 'border-border hover:bg-muted')}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fitur Wajib */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">🔧 Fitur Wajib Ada <span className="font-normal text-muted-foreground">(opsional — satu per baris)</span></label>
                <Textarea
                  placeholder={"Contoh:\nForm input data pengguna\nGrafik progress mingguan\nExport ke PDF/Excel\nSharing ke WhatsApp\nLogin dengan Google"}
                  value={appFiturWajib}
                  onChange={e => setAppFiturWajib(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>

              {/* Integrasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">🔗 Integrasi Eksternal <span className="font-normal text-muted-foreground">(opsional)</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Google Sheets', 'Airtable', 'WhatsApp API', 'Midtrans', 'Google Analytics', 'Firebase', 'Notion API', 'Supabase'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAppIntegrasi(prev => prev.includes(opt) ? prev.replace(opt, '').replace(/\n\n/, '\n').trim() : (prev ? prev + '\n' + opt : opt))}
                      className={cn('text-[10px] px-2 py-1 rounded border transition-colors', appIntegrasi.includes(opt) ? 'bg-slate-800 text-white border-slate-700' : 'border-border hover:bg-muted')}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder={"Atau ketik sendiri integrasi yang diinginkan..."}
                  value={appIntegrasi}
                  onChange={e => setAppIntegrasi(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
            <Button variant="outline" size="sm" onClick={() => setAppConfigOpen(false)}>Batal</Button>
            <Button size="sm" className="bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900 text-white" onClick={doGenerateMiniApp}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Blueprint Mini App
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini App Blueprint Dialog */}
      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-slate-700 to-gray-800 text-white">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
              Blueprint Mini App
              <Badge variant="secondary" className="ml-1 text-xs">{appHistory.length}/10 tersimpan</Badge>
              {appHistory.length >= 8 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">⚠️ Hampir penuh</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* ── HISTORY BAR ── */}
          {appHistory.length > 0 && (
            <div className="flex-shrink-0 border border-border rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  <ClipboardList className="h-3 w-3" />
                  Riwayat Blueprint ({appHistory.length}/10 slot)
                  {appHistory.length >= 8 && (
                    <span className="text-amber-600 dark:text-amber-400">— Ekspor lama sebelum slot habis!</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const allContent = appHistory.map((h, i) => `\n${'='.repeat(60)}\nBLUEPRINT #${i+1}: ${h.label}\n${'='.repeat(60)}\n${h.content}`).join('\n');
                      const b = new Blob([allContent], { type: 'text/plain' });
                      const u = URL.createObjectURL(b);
                      const a = document.createElement('a');
                      a.href = u;
                      a.download = `semua-blueprint-miniapp-${new Date().toISOString().slice(0,10)}.txt`;
                      a.click();
                      URL.revokeObjectURL(u);
                      toast({ title: `📥 ${appHistory.length} blueprint didownload sekaligus!` });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400 flex items-center gap-1"
                  >
                    <Download className="h-2.5 w-2.5" />Ekspor Semua
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Hapus semua ${appHistory.length} blueprint dari riwayat?`)) return;
                      setAppHistory([]);
                      setAppViewingId(null);
                      try { localStorage.removeItem('chaesa_miniapp_history'); } catch {}
                      toast({ title: 'Riwayat blueprint dihapus.' });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                  >Hapus Semua</button>
                </div>
              </div>
              <div className="flex gap-1.5 px-2.5 py-2 overflow-x-auto scrollbar-thin">
                {/* Chip: Live / Terbaru */}
                {!appLoading && appContent && (
                  <button
                    onClick={() => { setAppViewingId(null); }}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap',
                      appViewingId === null ? 'bg-slate-800 text-white border-transparent' : 'border-border hover:border-slate-400 hover:bg-muted'
                    )}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                    Terbaru (live)
                  </button>
                )}
                {/* History chips — terbaru di kanan */}
                {[...appHistory].reverse().map((item, ridx) => {
                  const realIdx = appHistory.length - 1 - ridx;
                  return (
                    <div key={item.id} className="shrink-0 flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setAppViewingId(item.id);
                          setAppContent(item.content);
                          setAppTab('konsep');
                        }}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-l-full text-[10px] font-medium border border-r-0 transition-all whitespace-nowrap',
                          appViewingId === item.id ? 'bg-slate-700 text-white border-transparent' : 'border-border hover:border-slate-400 hover:bg-muted'
                        )}
                      >
                        #{realIdx + 1} {item.label}
                      </button>
                      <button
                        onClick={() => {
                          const b = new Blob([item.content], { type: 'text/plain' });
                          const u = URL.createObjectURL(b);
                          const a = document.createElement('a');
                          a.href = u;
                          a.download = `blueprint-${item.label.replace(/[^a-z0-9]/gi, '-').slice(0, 30)}.txt`;
                          a.click();
                          URL.revokeObjectURL(u);
                          toast({ title: `Blueprint #${realIdx+1} didownload.` });
                        }}
                        title="Download blueprint ini"
                        className={cn(
                          'flex items-center px-1.5 py-1 rounded-none text-[10px] border border-r-0 transition-all',
                          appViewingId === item.id ? 'bg-slate-700 text-slate-300 border-transparent' : 'border-border hover:bg-muted'
                        )}
                      >
                        <Download className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={() => {
                          setAppHistory(prev => {
                            const updated = prev.filter(h => h.id !== item.id);
                            try { localStorage.setItem('chaesa_miniapp_history', JSON.stringify(updated)); } catch {}
                            return updated;
                          });
                          if (appViewingId === item.id) {
                            setAppViewingId(null);
                          }
                          toast({ title: `Blueprint #${realIdx+1} dihapus dari riwayat.` });
                        }}
                        title="Hapus dari riwayat"
                        className={cn(
                          'flex items-center px-1.5 py-1 rounded-r-full text-[10px] border transition-all',
                          appViewingId === item.id ? 'bg-slate-700 text-red-300 border-transparent hover:text-red-200' : 'border-border hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                        )}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  );
                })}
                {appHistory.length === 10 && (
                  <div className="shrink-0 flex items-center px-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Penuh — generate berikutnya timpa #1
                  </div>
                )}
              </div>
            </div>
          )}

          {appLoading && !appContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
                <Smartphone className="absolute inset-0 m-auto h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm text-muted-foreground">AI sedang merancang blueprint mini app dari ebook kamu...</p>
              <p className="text-xs text-muted-foreground/60">~20-30 detik</p>
            </div>
          )}
          {(appContent || appLoading) && (() => {
            const getSection = (tag: string) => {
              const m = appContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : '';
            };
            const tabs = [
              { key: 'konsep', label: '💡 Konsep', tag: 'KONSEP', color: 'from-slate-700 to-gray-700' },
              { key: 'fitur', label: '🔧 Fitur', tag: 'FITUR', color: 'from-blue-700 to-indigo-700' },
              { key: 'screens', label: '📱 Screens', tag: 'SCREENS', color: 'from-purple-700 to-violet-700' },
              { key: 'userflow', label: '🗺️ User Flow', tag: 'USERFLOW', color: 'from-teal-700 to-cyan-700' },
              { key: 'techstack', label: '⚙️ Tech Stack', tag: 'TECHSTACK', color: 'from-orange-600 to-amber-600' },
              { key: 'prototype', label: '🧪 Prototype HTML', tag: 'PROTOTYPE', color: 'from-violet-700 to-purple-700' },
              { key: 'integrasi_ai', label: '🤖 Integrasi AI', tag: 'INTEGRASI_AI', color: 'from-sky-700 to-blue-700' },
              { key: 'prompt_build', label: '🚀 Prompt Build', tag: 'PROMPT_BUILD', color: 'from-green-700 to-emerald-700' },
              { key: 'monetisasi', label: '💰 Monetisasi', tag: 'MONETISASI', color: 'from-yellow-600 to-orange-600' },
              { key: 'launch', label: '📋 Launch Plan', tag: 'LAUNCH', color: 'from-red-600 to-rose-600' },
            ] as const;
            const currentTab = tabs.find(t => t.key === appTab)!;
            return (
              <>
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setAppTab(tab.key)}
                      className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        appTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white border-transparent` : "border-border hover:border-slate-400"
                      )}>{tab.label}</button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {appTab === 'prototype' ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg p-3 text-xs text-violet-700 dark:text-violet-400 flex-shrink-0">
                        <strong>🧪 Prototype HTML Siap Pakai</strong> — Kode HTML/CSS/JS yang bisa langsung dibuka di browser. Simpan sebagai <code>.html</code> dan buka di browser untuk preview instan!
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="text-xs font-mono bg-slate-900 text-slate-100 dark:bg-slate-950 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {getSection('PROTOTYPE') || (appLoading ? '// Generating prototype...' : '// —')}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button onClick={() => { navigator.clipboard.writeText(getSection('PROTOTYPE')); toast({ title: '🧪 Kode prototype disalin! Simpan sebagai index.html dan buka di browser' }); }} className="bg-violet-600 hover:bg-violet-700 text-white flex-1">
                          <Copy className="h-4 w-4 mr-2" />Salin Kode Prototype
                        </Button>
                        <Button variant="outline" onClick={() => {
                          const code = getSection('PROTOTYPE');
                          if (!code) return;
                          const b = new Blob([code], { type: 'text/html' });
                          const u = URL.createObjectURL(b);
                          const a = document.createElement('a');
                          a.href = u;
                          a.download = `prototype-${(projectTitle||'app').slice(0,20).replace(/\s+/g,'-')}.html`;
                          a.click();
                          URL.revokeObjectURL(u);
                          toast({ title: 'File prototype didownload!' });
                        }}>
                          <Download className="h-4 w-4 mr-2" />Download .html
                        </Button>
                      </div>
                    </div>
                  ) : appTab === 'integrasi_ai' ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-lg p-3 text-xs text-sky-700 dark:text-sky-400 flex-shrink-0">
                        <strong>🤖 Panduan Integrasi AI</strong> — Cara menambahkan kecerdasan buatan ke mini app kamu: chatbot, auto-generate, analisis, dan lebih.
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-2">
                          {getSection('INTEGRASI_AI') ? (
                            <>
                              <MarkdownContent content={getSection('INTEGRASI_AI')!} />
                              {appLoading && appContent.includes('===INTEGRASI_AI===') && !appContent.includes('===AKHIR_INTEGRASI_AI===') && <span className="inline-block w-2 h-4 bg-sky-500 animate-pulse ml-1" />}
                            </>
                          ) : appLoading ? <span className="text-muted-foreground text-xs">Generating... <span className="inline-block w-2 h-3 bg-sky-500 animate-pulse ml-1" /></span> : <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : appTab === 'prompt_build' ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-3 text-xs text-green-700 dark:text-green-400 flex-shrink-0">
                        <strong>🚀 Prompt Build Siap Pakai untuk Cursor, Lovable, atau Bolt.new</strong> — Copy dan paste langsung ke AI coding tool untuk mulai build full app!
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="text-sm font-mono bg-muted rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {getSection('PROMPT_BUILD') || (appLoading ? '...' : '—')}
                        </div>
                      </ScrollArea>
                      <Button onClick={() => { navigator.clipboard.writeText(getSection('PROMPT_BUILD')); toast({ title: 'Prompt build disalin! Paste ke Cursor/Lovable/Bolt' }); }} className="bg-green-600 hover:bg-green-700 text-white w-full">
                        <Copy className="h-4 w-4 mr-2" />Salin Prompt Build
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="p-2">
                        {getSection(currentTab.tag) ? (
                          <>
                            <MarkdownContent content={getSection(currentTab.tag)!} />
                            {appLoading && appContent.includes(`===${currentTab.tag}===`) && !appContent.includes(`===AKHIR_${currentTab.tag}===`) && <span className="inline-block w-2 h-4 bg-slate-500 animate-pulse ml-1" />}
                          </>
                        ) : appLoading ? <span className="text-muted-foreground text-xs">Generating... <span className="inline-block w-2 h-3 bg-slate-500 animate-pulse ml-1" /></span> : <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </ScrollArea>
                  )}
                  {/* AI Coding Tool — Build Launcher */}
                  {appContent && !appLoading && (() => {
                    const buildPrompt = appContent.match(/===PROMPT_BUILD===[\s\S]*?===AKHIR_PROMPT_BUILD===/)?.[0]?.replace('===PROMPT_BUILD===','').replace('===AKHIR_PROMPT_BUILD===','').trim() || '';
                    const encodedPrompt = encodeURIComponent(buildPrompt);
                    return (
                      <div className="flex-shrink-0 border border-border rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-gray-800 px-3 py-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Rocket className="h-3.5 w-3.5" />
                            Build App Sekarang — Pilih AI Coding Tool:
                          </p>
                          <span className="text-[10px] text-slate-400">Prompt Build siap dikirim</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                          {/* Row 1: Tools dengan direct URL injection */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                              Otomatis — klik langsung, prompt sudah terisi tanpa perlu paste:
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {/* Bolt.new — mendukung ?prompt= di URL */}
                              <a
                                href={`https://bolt.new/?prompt=${encodedPrompt}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => toast({ title: '⚡ Membuka Bolt.new — prompt sudah otomatis terisi!' })}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all shadow-sm"
                              >
                                <Zap className="h-3 w-3" />
                                Bolt.new
                                <span className="bg-white/20 rounded px-1 text-[9px] font-bold">AUTO</span>
                              </a>
                              {/* Replit — pakai /new dengan AI prompt di URL */}
                              <a
                                href={`https://replit.com/new?${new URLSearchParams({ description: buildPrompt.slice(0, 500) }).toString()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(buildPrompt); toast({ title: '⚡ Membuka Replit — prompt juga disalin sebagai backup!' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                              >
                                <Zap className="h-3 w-3" />
                                Replit
                                <span className="bg-white/20 rounded px-1 text-[9px] font-bold">AUTO</span>
                              </a>
                            </div>
                          </div>
                          {/* Row 2: Tools dengan manual paste */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Copy + Paste — prompt otomatis disalin, tinggal paste di app:
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              <a
                                href="https://lovable.dev/projects/new"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => { navigator.clipboard.writeText(buildPrompt); toast({ title: '📋 Prompt disalin! Paste ke kolom di Lovable.dev' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm"
                              >
                                <Copy className="h-3 w-3" />
                                Lovable.dev
                              </a>
                              <button
                                onClick={() => { navigator.clipboard.writeText(buildPrompt); toast({ title: '📋 Prompt disalin! Buka Cursor → New Chat → Paste', description: 'Cursor adalah IDE desktop — buka aplikasinya lalu paste prompt di AI chat.' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-gray-700 text-white text-xs font-semibold hover:from-slate-800 hover:to-gray-800 transition-all shadow-sm"
                              >
                                <Copy className="h-3 w-3" />
                                Cursor IDE
                              </button>
                              <button
                                onClick={() => { navigator.clipboard.writeText(buildPrompt); toast({ title: '📋 Prompt disalin! Buka Claude.ai → Paste di chat', description: 'Claude sangat baik untuk generate kode lengkap dari prompt ini.' }); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-sm"
                              >
                                <Copy className="h-3 w-3" />
                                Claude.ai
                              </button>
                            </div>
                          </div>
                          {/* Info Replit */}
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 text-[10px] text-blue-700 dark:text-blue-300">
                            <strong>💡 Rekomendasi untuk pemula:</strong> Gunakan <strong>Bolt.new</strong> (paling mudah, langsung bisa dipakai) atau <strong>Replit</strong> (ada AI Agent yang bisa bantu debug dan deploy sekaligus). Keduanya gratis untuk memulai.
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(appContent); toast({ title: 'Blueprint disalin!' }); }}><Copy className="h-4 w-4 mr-2" />Salin Semua</Button>
                    <Button variant="outline" onClick={() => { const b=new Blob([appContent],{type:'text/plain'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`blueprint-app-${(projectTitle||'app').slice(0,20).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button disabled={appLoading} onClick={handleGenerateMiniApp} className="bg-gradient-to-r from-slate-700 to-gray-800 text-white"><Sparkles className="h-4 w-4 mr-2" />Buat Ulang</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Generator Kuis Dialog */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white">
                <ClipboardList className="h-3.5 w-3.5" />
              </div>
              Generator Kuis & Asesmen
              <Badge variant="secondary" className="ml-1 text-xs">10 MCQ · 5 B/S · 3 Esai · Studi Kasus</Badge>
            </DialogTitle>
          </DialogHeader>
          {quizLoading && !quizContent && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 flex-1">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
                <ClipboardList className="absolute inset-0 m-auto h-6 w-6 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">AI sedang membuat 19 soal dari konten ebook...</p>
              <p className="text-xs text-muted-foreground/60">~20-30 detik</p>
            </div>
          )}
          {(quizContent || quizLoading) && (() => {
            const getSection = (tag: string) => {
              const m = quizContent.match(new RegExp(`===${tag}===([\\s\\S]*?)===AKHIR_${tag}===`));
              return m ? m[1].trim() : '';
            };
            const tabs = [
              { key: 'mcq', label: '🔵 Pilihan Ganda (10)', tag: 'MCQ', color: 'from-purple-600 to-violet-600' },
              { key: 'tf', label: '✅ Benar/Salah (5)', tag: 'TF', color: 'from-blue-600 to-cyan-600' },
              { key: 'essay', label: '✍️ Esai (3)', tag: 'ESSAY', color: 'from-orange-500 to-amber-500' },
              { key: 'casestudy', label: '📊 Studi Kasus', tag: 'CASESTUDY', color: 'from-teal-600 to-green-600' },
            ] as const;
            const currentTab = tabs.find(t => t.key === quizTab)!;
            const content = getSection(currentTab.tag);
            return (
              <>
                <div className="flex gap-1.5 flex-shrink-0">
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setQuizTab(tab.key)}
                      className={cn("flex-1 px-2 py-1.5 rounded-full text-xs font-medium border transition-all text-center",
                        quizTab === tab.key ? `bg-gradient-to-r ${tab.color} text-white border-transparent` : "border-border hover:border-purple-300"
                      )}>{tab.label}</button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  <ScrollArea className="flex-1">
                    <div className="space-y-0 p-2">
                      {content ? (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{__html: content
                            .replace(/✅ Jawaban:([^\n]+)/g, '<span class="text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-xs">✅ Jawaban:$1</span>')
                            .replace(/→ (BENAR|SALAH)/g, (_, v) => `→ <span class="${v==='BENAR'?'text-emerald-700 bg-emerald-50':'text-red-600 bg-red-50'} dark:bg-transparent font-bold px-1.5 py-0.5 rounded text-xs">${v}</span>`)
                            .replace(/💡 Kunci Jawaban:/g, '<span class="text-amber-700 font-medium">💡 Kunci Jawaban:</span>')
                          }}
                        />
                      ) : (
                        quizLoading ? <p className="text-muted-foreground text-xs text-center py-8">Generating... <span className="inline-block w-2 h-3 bg-purple-500 animate-pulse ml-1" /></p> : <p className="text-center text-muted-foreground text-sm py-8">—</p>
                      )}
                      {quizLoading && quizContent.includes(`===${currentTab.tag}===`) && !quizContent.includes(`===AKHIR_${currentTab.tag}===`) && <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(quizContent); toast({ title: 'Semua soal disalin!' }); }}><Copy className="h-4 w-4 mr-2" />Salin Semua</Button>
                    <Button variant="outline" onClick={() => { const b=new Blob([quizContent],{type:'text/plain'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`kuis-${(projectTitle||'ebook').slice(0,25).replace(/\s+/g,'-')}.txt`; a.click(); URL.revokeObjectURL(u); }}><Download className="h-4 w-4 mr-2" />Download</Button>
                    <Button disabled={quizLoading} onClick={handleGenerateQuiz} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"><Sparkles className="h-4 w-4 mr-2" />Buat Ulang</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Image picker dialog */}
      <Dialog open={imgPickerOpen} onOpenChange={setImgPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {imgPickerType === 'infographic' ? (
                <Monitor className="h-4 w-4 text-teal-600" />
              ) : (
                <ImagePlus className="h-4 w-4 text-primary" />
              )}
              {imgPickerType === 'infographic' ? 'Pilih Infografik AI' : 'Pilih Ilustrasi AI'}
              <Badge variant="secondary" className="ml-1 text-xs">4 Varian · DALL-E 3</Badge>
            </DialogTitle>
          </DialogHeader>
          {imgPickerLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="relative">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/30 to-purple-400/30 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">AI sedang membuat 4 gambar...</p>
                <p className="text-xs text-muted-foreground mt-1">Ini mungkin membutuhkan 30-60 detik</p>
              </div>
              <div className="flex gap-1.5">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : pickerImages.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Klik gambar untuk menyisipkannya ke dalam dokumen</p>
              <div className="grid grid-cols-2 gap-3">
                {pickerImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handlePickImage(url)}
                    className="relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-lg group"
                    data-testid={`picker-image-${i}`}
                  >
                    <img
                      src={url}
                      alt={`Varian gambar ${i + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-medium transition-opacity">
                        Pilih Varian {i + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Tidak ada gambar yang dihasilkan. Silakan coba lagi.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── PODCAST SCRIPT DIALOG ── */}
      <Dialog open={podcastOpen} onOpenChange={setPodcastOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-rose-500" />
              Podcast Script Generator
              <Badge className="ml-auto bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 border-0">Dialog 2 Orang</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex border-b px-6 shrink-0">
            {(['script', 'segments'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPodcastTab(t)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  podcastTab === t ? 'border-rose-500 text-rose-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'script' ? '🎙️ Full Script' : '📋 Per Segmen'}
              </button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6">
              {podcastLoading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  <p className="text-sm text-muted-foreground">Sedang membuat script podcast...</p>
                </div>
              ) : podcastContent ? (
                <div>
                  {podcastTab === 'script' ? (
                    <div className="space-y-2">
                      {podcastContent.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-2" />;
                        if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
                          return (
                            <div key={i} className="mt-4 mb-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800">
                              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">{trimmed.replace(/===/g, '').trim()}</p>
                            </div>
                          );
                        }
                        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                          return (
                            <div key={i} className="flex items-center gap-2 my-1">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-mono">{trimmed}</span>
                            </div>
                          );
                        }
                        const dialogMatch = trimmed.match(/^\*\*\[([^\]]+)\]:\*\*\s*(.+)/);
                        if (dialogMatch) {
                          const [, speaker, text] = dialogMatch;
                          const isHost = !text.startsWith('Sari') && speaker.toLowerCase().includes('host') || !speaker.toLowerCase().includes('guest');
                          return (
                            <div key={i} className={cn('flex gap-3 my-2', isHost ? 'flex-row' : 'flex-row-reverse')}>
                              <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', isHost ? 'bg-rose-500' : 'bg-blue-500')}>
                                {speaker.charAt(0)}
                              </div>
                              <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', isHost ? 'bg-rose-50 dark:bg-rose-950 rounded-tl-sm' : 'bg-blue-50 dark:bg-blue-950 rounded-tr-sm')}>
                                <p className={cn('text-[10px] font-semibold mb-0.5', isHost ? 'text-rose-600' : 'text-blue-600')}>{speaker}</p>
                                <p className="leading-relaxed">{text}</p>
                              </div>
                            </div>
                          );
                        }
                        return <p key={i} className="text-sm leading-relaxed text-muted-foreground">{trimmed}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {podcastContent.split(/===\s*SEGMEN/i).slice(1).map((seg, i) => {
                        const lines = seg.split('\n');
                        const title = lines[0]?.trim() || `Segmen ${i + 1}`;
                        const content = lines.slice(1).join('\n').trim();
                        return (
                          <div key={i} className="border rounded-lg overflow-hidden">
                            <div className="bg-rose-50 dark:bg-rose-950 px-4 py-2 border-b">
                              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">SEGMEN {title}</p>
                            </div>
                            <div className="p-4 text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{content}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Script belum dibuat</div>
              )}
            </div>
          </ScrollArea>
          <div className="px-6 py-3 border-t flex items-center gap-2 shrink-0 bg-muted/30">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(podcastContent); toast({ description: 'Script disalin!' }); }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Script
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const b = new Blob([podcastContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='podcast-script.txt'; a.click(); }}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Unduh TXT
            </Button>
            <Button size="sm" className="ml-auto bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleGeneratePodcastScript()} disabled={podcastLoading}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Ulang
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AUDIOBOOK SCRIPT DIALOG ── */}
      <Dialog open={audiobookOpen} onOpenChange={setAudiobookOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-amber-500" />
              Audiobook Script Generator
              <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">Narasi Solo</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex border-b px-6 shrink-0">
            {(['script', 'chapters'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAudiobookTab(t)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  audiobookTab === t ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'script' ? '🎧 Full Script' : '📖 Per Bab'}
              </button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6">
              {audiobookLoading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="text-sm text-muted-foreground">Sedang membuat script audiobook...</p>
                </div>
              ) : audiobookContent ? (
                <div>
                  {audiobookTab === 'script' ? (
                    <div className="space-y-1 font-mono text-sm leading-relaxed">
                      {audiobookContent.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-1.5" />;
                        if (/^\[MUSIK|^\[INTRO|^\[OUTRO/i.test(trimmed)) {
                          return <p key={i} className="text-purple-600 dark:text-purple-400 font-bold italic text-xs py-0.5">{trimmed}</p>;
                        }
                        if (/^\[JEDA|^\[PENEKANAN|^\[NADA|^\[NAPAS/i.test(trimmed)) {
                          return <span key={i} className="inline-block text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-sans my-0.5 mr-1">{trimmed}</span>;
                        }
                        if (/^(BAB\s+[0-9IVXLC]+:|===)/i.test(trimmed)) {
                          return <p key={i} className="text-amber-700 dark:text-amber-400 font-bold text-base mt-4 mb-1 border-b border-amber-200 dark:border-amber-800 pb-1">{trimmed.replace(/===/g,'').trim()}</p>;
                        }
                        return <p key={i} className="leading-loose text-foreground">{trimmed}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {audiobookContent.split(/\n(?=BAB\s+[0-9]+:)/i).map((chapter, i) => {
                        const firstLine = chapter.split('\n')[0]?.trim() || `Bab ${i+1}`;
                        const body = chapter.split('\n').slice(1).join('\n').trim();
                        return (
                          <div key={i} className="border rounded-lg overflow-hidden">
                            <div className="bg-amber-50 dark:bg-amber-950 px-4 py-2.5 border-b">
                              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{firstLine}</p>
                            </div>
                            <div className="p-4 text-sm leading-loose font-mono whitespace-pre-wrap text-muted-foreground max-h-64 overflow-y-auto">{body}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Script belum dibuat</div>
              )}
            </div>
          </ScrollArea>
          <div className="px-6 py-3 border-t flex items-center gap-2 shrink-0 bg-muted/30">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(audiobookContent); toast({ description: 'Script disalin!' }); }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Script
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const b = new Blob([audiobookContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='audiobook-script.txt'; a.click(); }}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Unduh TXT
            </Button>
            <Button size="sm" className="ml-auto bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleGenerateAudiobookScript()} disabled={audiobookLoading}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Ulang
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── LANDING PAGE PRE-CONFIG DIALOG ── */}
      <Dialog open={lpConfigOpen} onOpenChange={setLpConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5 text-emerald-500" />
              Konfigurasi Landing Page
            </DialogTitle>
          </DialogHeader>

          {/* Tab navigation */}
          <div className="flex gap-1 border-b shrink-0">
            {([
              { key: 'produk', label: '🎯 Produk & Value' },
              { key: 'copy', label: '✍️ Copy & Konversi' },
              { key: 'teknis', label: '⚙️ Format & Teknis' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setLpConfigTab(t.key)}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
                  lpConfigTab === t.key
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4 py-3 px-1">

              {/* ===== TAB: PRODUK & VALUE ===== */}
              {lpConfigTab === 'produk' && (
                <div className="space-y-4">
                  {/* Data pipeline sync */}
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">📡 Data Pipeline Tersinkronisasi:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Konten Ebook', active: !!docContent },
                        { label: 'Silabus', active: !!syllabusContent },
                        { label: 'Monetisasi', active: !!monoContent },
                        { label: 'Mockup 3D', active: mockupImages.length > 0 },
                        { label: 'Penulis', active: !!authorName },
                      ].map(d => (
                        <span key={d.label} className={cn('text-[10px] px-1.5 py-0.5 rounded border', d.active ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-400' : 'bg-muted border-border text-muted-foreground opacity-40')}>
                          {d.active ? '✓' : '○'} {d.label}
                        </span>
                      ))}
                    </div>
                    {monoContent && extractMonetizationPrice() && (
                      <div className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 flex items-center gap-2">
                        <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">💡 Harga dari Monetisasi: <strong>{extractMonetizationPrice()}</strong></span>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLpPrice(extractMonetizationPrice())}>Terapkan</Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">❌ Masalah Target Pasar <span className="text-muted-foreground font-normal">(Problem Agitation)</span></label>
                    <Textarea
                      placeholder={"Contoh:\n- Sulit mengelola keuangan bisnis karena tidak punya sistem\n- Sering kehilangan uang karena tidak ada pencatatan\n- Tidak tahu cara membuat laporan keuangan sederhana"}
                      value={lpProblem}
                      onChange={e => setLpProblem(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">😔 Kondisi Eksisting (Before) <span className="text-muted-foreground font-normal">— situasi saat ini sebelum beli produk</span></label>
                    <Textarea
                      placeholder={"Contoh:\nBanyak pengusaha UMKM yang masih kelola keuangan manual di buku catatan, atau pakai Excel seadanya tanpa tahu apakah bisnis mereka untung atau rugi."}
                      value={lpKondisi}
                      onChange={e => setLpKondisi(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">✅ Solusi yang Ditawarkan <span className="text-muted-foreground font-normal">— apa yang produk ini lakukan</span></label>
                    <Textarea
                      placeholder={"Contoh:\nSistem keuangan 3 kolom yang bisa langsung diterapkan hari ini tanpa background akuntansi, dirancang khusus untuk UMKM dengan omzet 10-500 juta/bulan."}
                      value={lpSolusi}
                      onChange={e => setLpSolusi(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">💎 Value Proposition <span className="text-muted-foreground font-normal">— janji utama / USP produk</span></label>
                    <Textarea
                      placeholder={"Contoh:\nSatu-satunya ebook keuangan UMKM yang dilengkapi template Excel siap pakai + 30 studi kasus nyata — bukan teori, tapi langsung praktek."}
                      value={lpValueProp}
                      onChange={e => setLpValueProp(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">🚀 Manfaat Utama <span className="text-muted-foreground font-normal">(satu per baris)</span></label>
                    <Textarea
                      placeholder={"Contoh:\nBisa baca laporan keuangan bisnis dalam 5 menit\nTahu persis kapan bisnis untung atau rugi setiap hari\nHemat 3 jam/minggu dari proses rekap manual"}
                      value={lpManfaat}
                      onChange={e => setLpManfaat(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">🏅 Kredibilitas Penulis <span className="text-muted-foreground font-normal">— pengalaman, pencapaian, klien</span></label>
                    <Textarea
                      placeholder={"Contoh:\nKonsultan keuangan 10 tahun, sudah bantu 500+ UMKM, mantan CFO di perusahaan Tbk, pernah tampil di Kompas TV"}
                      value={lpKredibilitas}
                      onChange={e => setLpKredibilitas(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ===== TAB: COPY & KONVERSI ===== */}
              {lpConfigTab === 'copy' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold flex items-center gap-1"><DollarSign className="h-3 w-3" /> Harga Jual (Rp)</label>
                      <Input placeholder="Contoh: Rp 149.000" value={lpPrice} onChange={e => setLpPrice(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold flex items-center gap-1"><DollarSign className="h-3 w-3 opacity-40" /> Harga Coret (Normal)</label>
                      <Input placeholder="Contoh: Rp 299.000" value={lpHargaCoret} onChange={e => setLpHargaCoret(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Teks Tombol CTA</label>
                    <div className="flex gap-2">
                      <Input placeholder="Beli Sekarang" value={lpCTA} onChange={e => setLpCTA(e.target.value)} className="h-8 text-sm" />
                      <div className="flex gap-1 shrink-0">
                        {['Beli Sekarang', 'Dapatkan Sekarang', 'Ya, Saya Mau!', 'Order Sekarang'].map(opt => (
                          <button key={opt} onClick={() => setLpCTA(opt)} className={cn('text-[10px] px-2 py-1 rounded border transition-colors', lpCTA === opt ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'border-border hover:bg-muted')}>
                            {opt.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center gap-2">
                      🎁 Bonus Produk (satu per baris)
                      {getSmartBonuses() && (
                        <button onClick={() => setLpBonuses(prev => prev || getSmartBonuses())} className="text-[10px] text-blue-600 hover:underline">+ auto-isi dari pipeline</button>
                      )}
                    </label>
                    <Textarea
                      placeholder={"Contoh:\nBonus 1: Template Canva Siap Pakai (Nilai Rp 150.000)\nBonus 2: Video Tutorial 2 Jam (Nilai Rp 200.000)\nBonus 3: Konsultasi via WA 30 menit (Nilai Rp 300.000)"}
                      value={lpBonuses}
                      onChange={e => setLpBonuses(e.target.value)}
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">🛡️ Garansi</label>
                    <div className="flex gap-2">
                      <Input placeholder="Contoh: 30 hari uang kembali tanpa syarat" value={lpGaransi} onChange={e => setLpGaransi(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {['30 hari uang kembali tanpa syarat', '7 hari full refund', 'Kepuasan 100% terjamin', 'Tidak ada garansi'].map(opt => (
                        <button key={opt} onClick={() => setLpGaransi(opt)} className={cn('text-[10px] px-2 py-1 rounded border transition-colors', lpGaransi === opt ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600' : 'border-border hover:bg-muted')}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB: FORMAT & TEKNIS ===== */}
              {lpConfigTab === 'teknis' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Gaya / Format Landing Page</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'long-form', label: 'Long-Form Sales Letter', desc: 'Detail, lengkap, persuasif — cocok untuk harga premium' },
                        { value: 'short', label: 'Short Copy Ringkas', desc: 'Padat, cepat dibaca — cocok untuk low-ticket / impulse buy' },
                        { value: 'vsl', label: 'VSL / Video Sales', desc: 'Fokus video, script + page pendukung' },
                        { value: 'webinar', label: 'Webinar Registration', desc: 'Untuk live atau recorded webinar / masterclass' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setLpStyle(opt.value)}
                          className={cn(
                            'text-left p-3 rounded-lg border text-xs transition-colors',
                            lpStyle === opt.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                              : 'border-border hover:border-emerald-300 hover:bg-muted'
                          )}
                        >
                          <div className="font-semibold mb-0.5">{opt.label}</div>
                          <div className="text-muted-foreground text-[10px]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Tujuan Halaman</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'sell', label: '💳 Jual Langsung', desc: 'Direct purchase / order' },
                        { value: 'lead', label: '📧 Kumpulkan Lead', desc: 'Email / WhatsApp optin' },
                        { value: 'webinar', label: '🎙️ Daftar Webinar', desc: 'Registrasi event' },
                        { value: 'waitlist', label: '⏳ Pre-Launch Waitlist', desc: 'Build anticipation' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setLpGoal(opt.value)}
                          className={cn(
                            'text-left p-2.5 rounded-lg border text-xs transition-colors',
                            lpGoal === opt.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                              : 'border-border hover:border-emerald-300 hover:bg-muted'
                          )}
                        >
                          <div className="font-semibold mb-0.5">{opt.label}</div>
                          <div className="text-muted-foreground text-[10px]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'copy', label: '📝 Copy Bersih', desc: 'Teks siap paste ke page builder' },
                        { value: 'sections', label: '📑 Sections', desc: 'Pisah per seksi dengan header' },
                        { value: 'html', label: '💻 HTML Lengkap', desc: 'Siap upload, ada CSS inline' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setLpOutputFormat(opt.value)}
                          className={cn(
                            'text-left p-2.5 rounded-lg border text-xs transition-colors',
                            lpOutputFormat === opt.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                              : 'border-border hover:border-emerald-300 hover:bg-muted'
                          )}
                        >
                          <div className="font-semibold mb-0.5">{opt.label}</div>
                          <div className="text-muted-foreground text-[10px]">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t shrink-0">
            <div className="flex gap-1">
              {lpConfigTab !== 'produk' && (
                <Button variant="outline" size="sm" onClick={() => setLpConfigTab(lpConfigTab === 'teknis' ? 'copy' : 'produk')}>← Kembali</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLpConfigOpen(false)}>Batal</Button>
              {lpConfigTab !== 'teknis' ? (
                <Button size="sm" variant="outline" className="border-emerald-400 text-emerald-700" onClick={() => setLpConfigTab(lpConfigTab === 'produk' ? 'copy' : 'teknis')}>
                  Lanjut →
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setLpConfigOpen(false); handleGenerateLandingPage(); }}>
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Landing Page
                </Button>
              )}
              {lpConfigTab === 'produk' && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setLpConfigOpen(false); handleGenerateLandingPage(); }}>
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Sekarang
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lpOpen} onOpenChange={setLpOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-emerald-500" />
              Landing Page Generator
              {authorName && <span className="text-xs font-normal text-muted-foreground">· {authorName}</span>}
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">Copy & HTML</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex border-b px-6 shrink-0">
            {(['copy', 'preview', 'sections'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLpTab(t)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  lpTab === t ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'copy' ? '📝 Copy Lengkap' : t === 'preview' ? '🌐 HTML Preview' : '📋 Per Seksi'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0">
            {lpLoading ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm text-muted-foreground">Sedang membuat landing page copy...</p>
              </div>
            ) : lpContent ? (
              <div className="h-full">
                {lpTab === 'copy' && (
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-2">
                      {lpContent.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={i} className="h-2" />;
                        if (/^===.*===$/.test(trimmed) || /^\d+\.\s+(HERO|PROBLEM|SOLUSI|FITUR|TESTIMONI|HARGA|FAQ|CLOSING|GARANSI|BONUS|PENULIS)/i.test(trimmed)) {
                          return (
                            <div key={i} className="mt-5 mb-2 flex items-center gap-2">
                              <div className="h-px flex-1 bg-emerald-200 dark:bg-emerald-800" />
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest px-2">{trimmed.replace(/===|^\d+\.\s*/g, '').trim()}</span>
                              <div className="h-px flex-1 bg-emerald-200 dark:bg-emerald-800" />
                            </div>
                          );
                        }
                        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('✅') || trimmed.startsWith('❌')) {
                          return <p key={i} className="text-sm pl-4 text-foreground leading-relaxed">{trimmed}</p>;
                        }
                        if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
                          return <p key={i} className="text-sm font-bold text-foreground leading-relaxed">{trimmed.replace(/^#+\s*|\*\*/g, '')}</p>;
                        }
                        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{trimmed}</p>;
                      })}
                    </div>
                  </ScrollArea>
                )}
                {lpTab === 'preview' && (
                  <div className="h-full flex flex-col">
                    {lpOutputFormat === 'html' ? (
                      <iframe
                        srcDoc={lpContent}
                        className="flex-1 w-full border-0"
                        title="Landing Page Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-3 p-8">
                          <p className="text-sm text-muted-foreground">Preview HTML hanya tersedia jika Format Output diatur ke <strong>HTML</strong></p>
                          <Button size="sm" variant="outline" onClick={() => handleGenerateLandingPage({ outputFormat: 'html' })}>
                            <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate ulang sebagai HTML
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {lpTab === 'sections' && (
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-3">
                      {lpContent.split(/===([A-Z_\s]+)===/g).reduce((acc: {title: string; content: string}[], part, i) => {
                        if (i % 2 === 0) {
                          if (part.trim()) acc.push({ title: 'Konten', content: part.trim() });
                        } else {
                          acc.push({ title: part.trim(), content: '' });
                        }
                        return acc;
                      }, []).filter(s => s.content || s.title !== 'Konten').map((section, i) => (
                        <div key={i} className="border rounded-lg overflow-hidden">
                          {section.title !== 'Konten' && (
                            <div className="bg-emerald-50 dark:bg-emerald-950 px-4 py-2 border-b">
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">{section.title}</p>
                            </div>
                          )}
                          <div className="p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Landing page belum dibuat</div>
            )}
          </div>
          <div className="px-6 py-3 border-t flex flex-wrap items-center gap-2 shrink-0 bg-muted/30">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(lpContent); toast({ description: 'Landing page copy disalin!' }); }} disabled={!lpContent}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const b = new Blob([lpContent], {type:'text/plain'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='landing-page-copy.txt'; a.click(); }} disabled={!lpContent}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> TXT
            </Button>
            {lpOutputFormat === 'html' && lpContent && (
              <Button size="sm" variant="outline" onClick={() => { const b = new Blob([lpContent], {type:'text/html'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='landing-page.html'; a.click(); }}>
                <FileDown className="h-3.5 w-3.5 mr-1.5" /> HTML
              </Button>
            )}
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-muted-foreground">Format:</span>
              {(['copy', 'html', 'sections'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => handleGenerateLandingPage({ outputFormat: f })}
                  className={cn('text-[10px] px-2 py-0.5 rounded border transition-colors', lpOutputFormat === f ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border hover:border-emerald-400')}
                >
                  {f === 'copy' ? 'Copy' : f === 'html' ? 'HTML' : 'Seksi'}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setLpConfigOpen(true)}>
              <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Konfigurasi
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleGenerateLandingPage()} disabled={lpLoading}>
              <Zap className="h-3.5 w-3.5 mr-1.5" /> Generate Ulang
            </Button>
          </div>
          {/* Integration hints */}
          {lpContent && !lpLoading && (
            <div className="px-6 pb-4 shrink-0">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">🔗 Lengkapi ekosistem landing page kamu:</p>
                <div className="flex flex-wrap gap-2">
                  {mockupImages.length === 0 && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => { setLpOpen(false); setTimeout(() => setMockupOpen(true), 300); }}>
                      <ImagePlus className="h-3 w-3 mr-1" /> + Buat Mockup 3D
                    </Button>
                  )}
                  {!mktContent && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => { setLpOpen(false); setTimeout(() => { setMktOpen(true); handleGenerateMarketingKit(); }, 300); }}>
                      <Megaphone className="h-3 w-3 mr-1" /> + Marketing Kit
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => { setLpOpen(false); setTimeout(() => handleChatDemo(), 300); }}>
                    <Bot className="h-3 w-3 mr-1" /> + Chatbot Demo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── COVER HTML TEMPLATE DIALOG ── */}
      <Dialog open={coverTplOpen} onOpenChange={setCoverTplOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-teal-500" />
              Cover Ebook HTML Generator
              <Badge className="ml-auto bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-0">HTML Siap Cetak</Badge>
            </DialogTitle>
          </DialogHeader>
          {/* Config bar */}
          {!coverTplLoading && (
            <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap gap-2 items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Penulis:</span>
                <input
                  type="text"
                  value={coverTplAuthor}
                  onChange={e => setCoverTplAuthor(e.target.value)}
                  placeholder="Nama penulis / brand"
                  className="text-xs border rounded px-2 py-1 bg-background w-36 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Warna:</span>
                {(['professional','warm','corporate','energetic','nature','luxury'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setCoverTplColorScheme(s)}
                    className={cn('text-[10px] px-2 py-0.5 rounded border transition-colors capitalize', coverTplColorScheme === s ? 'bg-teal-600 text-white border-teal-600' : 'border-border hover:border-teal-400')}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Style:</span>
                {(['Modern & Profesional','Elegan & Mewah','Bold & Energetik','Minimalis Clean'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setCoverTplStyle(s)}
                    className={cn('text-[10px] px-2 py-0.5 rounded border transition-colors', coverTplStyle === s ? 'bg-teal-600 text-white border-teal-600' : 'border-border hover:border-teal-400')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Tabs */}
          <div className="flex border-b px-6 shrink-0">
            {(['preview', 'code'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCoverTplTab(t)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  coverTplTab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'preview' ? '🖼️ Preview Cover' : '💻 Kode HTML'}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {coverTplLoading ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative">
                  <div className="h-20 w-14 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 animate-pulse shadow-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">AI sedang mendesain cover ebook...</p>
                  <p className="text-xs text-muted-foreground mt-1">Membuat HTML + CSS yang indah dan profesional</p>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : coverTplContent ? (
              <div className="h-full">
                {coverTplTab === 'preview' ? (
                  <iframe
                    srcDoc={coverTplContent.replace(/```html\n?/g, '').replace(/```\n?/g, '')}
                    className="w-full h-full border-0"
                    title="Ebook Cover Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <ScrollArea className="h-full">
                    <pre className="p-6 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                      {coverTplContent}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Palette className="h-10 w-10 opacity-20" />
                <p className="text-sm">Cover belum dibuat — klik Generate</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t flex flex-wrap items-center gap-2 shrink-0 bg-muted/30">
            <Button
              size="sm" variant="outline"
              onClick={() => {
                const clean = coverTplContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');
                const b = new Blob([clean], { type: 'text/html' });
                const u = URL.createObjectURL(b);
                const a = document.createElement('a');
                a.href = u; a.download = 'ebook-cover.html'; a.click();
              }}
              disabled={!coverTplContent}
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Unduh HTML
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => { navigator.clipboard.writeText(coverTplContent); toast({ description: 'Kode HTML disalin!' }); }}
              disabled={!coverTplContent}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Kode
            </Button>
            <Button
              size="sm"
              className="ml-auto bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => handleGenerateCoverTemplate()}
              disabled={coverTplLoading}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" /> {coverTplContent ? 'Generate Ulang' : 'Generate Cover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Riset Ebook Dialog */}
      <Dialog open={risetOpen} onOpenChange={setRisetOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" />
              Riset Topik Ebook
              <Badge variant="secondary" className="text-xs">AI Research</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Temukan ide ebook yang marketable dan siap dijual. Masukkan kata kunci, URL, atau topik — AI akan analisis potensinya.
            </p>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {([['keyword', '🔑 Kata Kunci'], ['website', '🌐 Website URL'], ['youtube', '▶️ YouTube Topik']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setRisetType(key); setRisetQuery(''); }}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${risetType === key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={
                  risetType === 'keyword' ? 'Contoh: kesehatan mental, investasi saham, UMKM digital...' :
                  risetType === 'website' ? 'https://contoh.com/artikel-topik' :
                  'Contoh: cara sukses jualan TikTok Shop, bisnis online 2025...'
                }
                value={risetQuery}
                onChange={e => setRisetQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRisetEbook()}
                data-testid="input-riset-query"
              />
              <Button
                onClick={handleRisetEbook}
                disabled={risetLoading || !risetQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                data-testid="button-riset-submit"
              >
                {risetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1">Riset</span>
              </Button>
            </div>
            {risetLoading && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI sedang menganalisis potensi pasar...
              </div>
            )}
            {risetContent && (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hasil Riset</span>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => { navigator.clipboard.writeText(risetContent); toast({ description: 'Hasil riset disalin!' }); }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Salin
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{risetContent}</pre>
                </div>
              </div>
            )}
            {risetContent && !risetLoading && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  💡 Pilih ide terbaik dari hasil riset → gunakan sebagai topik ebook utama
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-8 px-3 text-xs rounded-md border border-emerald-300 bg-white dark:bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Ketik ide yang dipilih / topik baru dari riset..."
                    id="riset-topic-input"
                    data-testid="input-riset-topic-pick"
                  />
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs"
                    onClick={() => {
                      const input = document.getElementById('riset-topic-input') as HTMLInputElement;
                      const val = input?.value?.trim();
                      if (val && onTopicUpdate) {
                        onTopicUpdate(val);
                        toast({ description: `✅ Topik "${val}" berhasil diaplikasikan ke form utama!` });
                        setRisetOpen(false);
                      } else if (!val) {
                        toast({ title: 'Masukkan topik yang dipilih', variant: 'destructive' });
                      } else {
                        toast({ description: '💡 Salin topik ini ke form utama secara manual' });
                      }
                    }}
                    data-testid="button-use-riset-topic"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Pakai Topik Ini
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mockup 3D Dialog */}
      <Dialog open={mockupOpen} onOpenChange={setMockupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              Mockup 3D Ebook
              <Badge variant="secondary" className="text-xs">DALL-E 3</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Buat gambar mockup 3D profesional untuk marketing ebook <strong>{projectTitle || projectTopik}</strong>. Gambar langsung siap pakai untuk Tokopedia, Shopee, Instagram.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">✍️ Nama Penulis:</span>
              <input
                className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="Nama penulis / brand (opsional)"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                data-testid="input-mockup-author"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['book', '📗', 'Book Only', 'Tampilan buku saja'],
                ['phone', '📱', 'Book & Phone', 'Buku + HP mockup'],
                ['tablet', '📲', 'Tablet View', 'Tampilan tablet'],
              ] as const).map(([key, icon, label, desc]) => (
                <button
                  key={key}
                  onClick={() => setMockupStyle(key)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${mockupStyle === key ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'border-border hover:border-rose-300'}`}
                  data-testid={`button-mockup-style-${key}`}
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleGenerateMockup}
              disabled={mockupLoading}
              data-testid="button-mockup-generate"
            >
              {mockupLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Membuat mockup 3D dengan DALL-E 3...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> {mockupImages.length > 0 ? 'Generate Ulang' : 'Generate Mockup 3D'}</>
              )}
            </Button>
            {mockupLoading && (
              <div className="text-center text-xs text-muted-foreground animate-pulse">
                DALL-E 3 sedang merender mockup 3D profesional... (15-30 detik)
              </div>
            )}
            {mockupImages.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {mockupImages.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border">
                      <img src={url} alt={`Mockup ${i + 1}`} className="w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                        <a href={url} download={`mockup-${i + 1}.png`} className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                          <Download className="h-3 w-3" /> Unduh
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Hover gambar untuk unduh. Gunakan untuk Tokopedia/Shopee, Instagram, dan marketing material.
                </p>
                {/* Smart Integration Hints */}
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-3 space-y-2">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">🔗 Integrasikan mockup ini ke pipeline lain:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => { setMockupOpen(false); setTimeout(() => { setMktOpen(true); handleGenerateMarketingKit(); }, 300); }}>
                      <Megaphone className="h-3 w-3 mr-1" /> → Marketing Kit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => { setMockupOpen(false); setTimeout(() => handleGenerateLandingPage(), 300); }}>
                      <ExternalLink className="h-3 w-3 mr-1" /> → Landing Page
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => { setMockupOpen(false); setTimeout(() => handleGenerateCoverTemplate(), 300); }}>
                      <Palette className="h-3 w-3 mr-1" /> → Cover Template
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FlipBook Guide Dialog */}
      <Dialog open={flipbookOpen} onOpenChange={setFlipbookOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              Convert Ebook ke FlipBook
              <Badge variant="secondary" className="text-xs">Panduan Indonesia</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              FlipBook adalah tampilan ebook interaktif dengan efek balik halaman. Berikut tools terbaik yang bisa digunakan — semua tersedia untuk pengguna Indonesia:
            </p>

            {/* Tool 1 - Heyzine */}
            <div className="rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-600 text-white text-xs">🥇 GRATIS — Rekomendasi</Badge>
                  </div>
                  <h3 className="font-bold text-sm">Heyzine</h3>
                  <p className="text-xs text-muted-foreground mt-1">heyzine.com — Gratis tanpa watermark, download HTML offline, embed video/audio, link sharable langsung</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['✓ Gratis', '✓ Tanpa watermark', '✓ Download HTML', '✓ Embed video', '✓ Share link'].map(f => (
                      <span key={f} className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0" onClick={() => window.open('https://heyzine.com', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka
                </Button>
              </div>
            </div>

            {/* Tool 2 - FlipBuilder */}
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">🥈 Gratis (Desktop Win/Mac)</Badge>
                  </div>
                  <h3 className="font-bold text-sm">FlipBuilder (Flip PDF Plus)</h3>
                  <p className="text-xs text-muted-foreground mt-1">flipbuilder.com — Software desktop gratis, konversi PDF ke flipbook, export HTML5, tidak butuh coding</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['✓ Gratis desktop', '✓ PDF → FlipBook', '✓ Export HTML5', '✓ Win & Mac'].map(f => (
                      <span key={f} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => window.open('https://www.flipbuilder.com/download-ebook-software-free.html', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka
                </Button>
              </div>
            </div>

            {/* Tool 3 - FlipHTML5 */}
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">🥉 Berbayar $14/bln — Fitur Lengkap</Badge>
                  </div>
                  <h3 className="font-bold text-sm">FlipHTML5</h3>
                  <p className="text-xs text-muted-foreground mt-1">fliphtml5.com — 28+ jenis interaktif, 1000+ template, embed audio/video per halaman, analytics pembaca</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['✓ 1000+ template', '✓ 28 jenis interaktif', '✓ Analytics', '✓ Embed media'].map(f => (
                      <span key={f} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => window.open('https://fliphtml5.com', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka
                </Button>
              </div>
            </div>

            {/* Cara pakai */}
            <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 p-4">
              <h4 className="text-sm font-semibold mb-2">📋 Cara Membuat FlipBook dari Chaesa AI Studio</h4>
              <ol className="text-xs space-y-1.5 text-muted-foreground">
                <li><span className="font-medium text-foreground">1.</span> Generate konten ebook di mode OUTLINE atau FULL DRAFT</li>
                <li><span className="font-medium text-foreground">2.</span> Download hasilnya sebagai TXT atau DOCX</li>
                <li><span className="font-medium text-foreground">3.</span> Format di Word/Google Docs → Export ke PDF</li>
                <li><span className="font-medium text-foreground">4.</span> Upload PDF ke <strong>Heyzine.com</strong> (gratis, tanpa watermark)</li>
                <li><span className="font-medium text-foreground">5.</span> Kustomisasi desain → Share link atau embed di website</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ECOSYSTEM HUB DIALOG ── */}
      <Dialog open={ecoHubOpen} onOpenChange={setEcoHubOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-4 shrink-0 border-b bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">🔗</span>
              Ecosystem Hub — Pusat Integrasi
              <Badge className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 text-xs">
                Skor Integrasi: {integrationScore}%
              </Badge>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Semua output saling terhubung dan bertukar data secara otomatis</p>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Integration Score Visual */}
              <div className="rounded-xl border bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Tingkat Integrasi Ekosistem</h3>
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    integrationScore >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                    integrationScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  )}>
                    {integrationScore >= 80 ? '🚀 Ekosistem Penuh' : integrationScore >= 50 ? '⚡ Setengah Jalan' : '🔧 Mulai Bangun'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${integrationScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{integrationScore}% dari potensi integrasi maksimal tercapai</p>
              </div>

              {/* 4 Quadrant Connections */}
              <div className="grid grid-cols-2 gap-4">
                {/* CONTENT CORE */}
                <div className={cn("rounded-xl border p-4 space-y-2", docContent ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20" : "border-border")}>
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">📖 Content Core</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Konten Ebook', done: !!docContent, desc: docContent ? `${Math.round(docContent.length/5)} kata` : 'Belum di-generate' },
                      { label: 'Silabus E-Course', done: !!syllabusContent, desc: syllabusContent ? '8 modul' : 'Generate dari ebook' },
                      { label: 'Kuis & Asesmen', done: !!quizContent, desc: quizContent ? '19 soal' : 'Generate dari ebook' },
                      { label: 'Script Narasi', done: !!scriptContent, desc: scriptContent ? 'Siap TTS' : 'Butuh konten ebook' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", item.done ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                          {item.done ? '✓' : '○'}
                        </span>
                        <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  {docContent && <p className="text-[10px] text-blue-600 dark:text-blue-400 pt-1 border-t border-blue-200 dark:border-blue-800">→ Mengalir ke: Monetisasi, Landing Page, Chatbot</p>}
                </div>

                {/* MONETIZATION ENGINE */}
                <div className={cn("rounded-xl border p-4 space-y-2", monoContent ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border")}>
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">💰 Monetization Engine</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Strategi Harga', done: !!monoContent, desc: monoContent ? (extractMonetizationPrice() || 'Harga terdeteksi') : 'Generate strategi' },
                      { label: 'Paket Produk', done: !!monoContent, desc: monoContent ? '3 paket (Basic/Standar/Premium)' : 'Butuh strategi monetisasi' },
                      { label: 'Platform Jualan', done: !!monoContent, desc: monoContent ? 'Tokopedia/Shopee/dll' : 'Butuh strategi monetisasi' },
                      { label: 'Harga di LP', done: !!(lpPrice || (monoContent && extractMonetizationPrice())), desc: lpPrice || extractMonetizationPrice() || 'Sync dari Monetisasi' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", item.done ? "bg-amber-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                          {item.done ? '✓' : '○'}
                        </span>
                        <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-24">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  {monoContent && !lpPrice && extractMonetizationPrice() && (
                    <div className="pt-1 border-t border-amber-200 dark:border-amber-800">
                      <Button size="sm" className="h-6 text-[10px] w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setLpPrice(extractMonetizationPrice()); setEcoHubOpen(false); setLpConfigOpen(true); }}>
                        ⚡ Sync Harga ke Landing Page ({extractMonetizationPrice()})
                      </Button>
                    </div>
                  )}
                  {monoContent && <p className="text-[10px] text-amber-600 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-800">→ Mengalir ke: Landing Page, Chatbot, Marketing Kit</p>}
                </div>

                {/* SALES FUNNEL */}
                <div className={cn("rounded-xl border p-4 space-y-2", lpContent ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" : "border-border")}>
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">🌐 Sales Funnel</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Landing Page', done: !!lpContent, desc: lpContent ? (lpPrice ? `Harga: ${lpPrice}` : 'Copy selesai') : 'Config + Generate' },
                      { label: 'Marketing Kit', done: !!mktContent, desc: mktContent ? '7 platform (TikTok, Tokped...)' : 'Generate dari ebook' },
                      { label: 'Mockup 3D', done: mockupImages.length > 0, desc: mockupImages.length > 0 ? `${mockupImages.length} gambar` : 'Untuk visual produk' },
                      { label: 'Thumbnail YouTube', done: thumbImages.length > 0, desc: thumbImages.length > 0 ? `${thumbImages.length} variasi` : 'Opsional' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", item.done ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                          {item.done ? '✓' : '○'}
                        </span>
                        <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-28">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  {!lpContent && monoContent && (
                    <div className="pt-1 border-t border-emerald-200 dark:border-emerald-800">
                      <Button size="sm" className="h-6 text-[10px] w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEcoHubOpen(false); setTimeout(() => setLpConfigOpen(true), 300); }}>
                        ⚡ Buat Landing Page (Harga dari Monetisasi)
                      </Button>
                    </div>
                  )}
                  {lpContent && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-200 dark:border-emerald-800">→ Mengalir ke: Chatbot Demo, Marketing Kit</p>}
                </div>

                {/* ENGAGEMENT LAYER */}
                <div className={cn("rounded-xl border p-4 space-y-2", chatMessages.length > 0 ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-950/20" : "border-border")}>
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">🤖 Engagement Layer</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Chatbot Demo', done: chatMessages.length > 0, desc: chatMessages.length > 0 ? `${chatMessages.length} pesan, LP-aware` : 'Buka + jalankan' },
                      { label: 'Podcast Script', done: !!podcastContent, desc: podcastContent ? 'Siap rekam' : 'Generate dari ebook' },
                      { label: 'Audiobook Script', done: !!audiobookContent, desc: audiobookContent ? 'Siap narasi' : 'Generate dari ebook' },
                      { label: 'Riset Topik', done: !!risetContent, desc: risetContent ? 'Analisis selesai' : 'Research center' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", item.done ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                          {item.done ? '✓' : '○'}
                        </span>
                        <span className={cn("text-xs", item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-28">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                  {chatMessages.length > 0 && (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 pt-1 border-t border-indigo-200 dark:border-indigo-800">✓ Terhubung ke: konten ebook, silabus, harga, landing page</p>
                  )}
                </div>
              </div>

              {/* Active Data Connections */}
              <div className="rounded-xl border p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">🔗 Koneksi Data Aktif</h3>
                <div className="space-y-1.5">
                  {[
                    { active: !!(docContent && syllabusContent), label: 'Konten Ebook → Silabus E-Course', desc: 'Materi ebook dipakai sebagai fondasi kurikulum' },
                    { active: !!(docContent && quizContent), label: 'Konten Ebook → Kuis', desc: 'Soal kuis dibuat berdasarkan materi ebook' },
                    { active: !!(monoContent && lpContent), label: 'Monetisasi → Landing Page', desc: 'Strategi harga otomatis masuk ke sales page' },
                    { active: !!(monoContent && mktContent), label: 'Monetisasi → Marketing Kit', desc: 'Harga dan CTA konsisten di semua channel' },
                    { active: !!((lpContent || lpPrice) && chatMessages.length > 0), label: 'Landing Page → Chatbot', desc: 'Chatbot tahu harga, bonus, dan cara beli' },
                    { active: !!(syllabusContent && lpBonuses), label: 'E-Course → Bonus LP', desc: 'Silabus kursus jadi bonus di landing page' },
                    { active: !!(mockupImages.length > 0 && lpContent), label: 'Mockup 3D → Landing Page', desc: 'Gambar mockup disertakan dalam sales copy' },
                    { active: !!(authorName && lpContent && coverTplContent), label: 'Brand Identity → Semua Output', desc: `"${authorName || 'Penulis'}" konsisten di semua konten` },
                  ].map(conn => (
                    <div key={conn.label} className="flex items-start gap-2">
                      <span className={cn("mt-0.5 shrink-0 text-sm", conn.active ? "text-emerald-500" : "text-slate-300 dark:text-slate-600")}>
                        {conn.active ? '🟢' : '⚪'}
                      </span>
                      <div>
                        <p className={cn("text-xs font-medium", conn.active ? "text-foreground" : "text-muted-foreground")}>{conn.label}</p>
                        <p className="text-[10px] text-muted-foreground">{conn.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next recommended actions */}
              {integrationScore < 100 && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">🚀 Langkah Berikutnya yang Direkomendasikan</h3>
                  <div className="space-y-1.5">
                    {!docContent && <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><span>1.</span><span>Generate konten ebook terlebih dahulu — ini fondasi semua output</span></div>}
                    {docContent && !monoContent && <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><Button size="sm" className="h-6 text-[10px] bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setEcoHubOpen(false); setTimeout(() => setMonoOpen(true), 300); }}>Buat Monetisasi</Button><span>Tentukan harga dan strategi penjualan</span></div>}
                    {monoContent && !lpContent && <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEcoHubOpen(false); setTimeout(() => setLpConfigOpen(true), 300); }}>Buat Landing Page</Button><span>Sudah ada harga dari monetisasi yang bisa di-sync</span></div>}
                    {lpContent && chatMessages.length === 0 && <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><Button size="sm" className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEcoHubOpen(false); setTimeout(() => handleChatDemo(), 300); }}>Aktifkan Chatbot</Button><span>Chatbot akan tahu harga, konten, dan cara beli</span></div>}
                    {lpContent && !mktContent && <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><Button size="sm" className="h-6 text-[10px] bg-pink-600 hover:bg-pink-700 text-white" onClick={() => { setEcoHubOpen(false); setTimeout(() => handleGenerateMarketingKit(), 300); }}>Buat Marketing Kit</Button><span>7 channel promosi siap pakai (TikTok, Tokped, WA...)</span></div>}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="px-6 py-4 border-t flex gap-2 justify-between shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportBundle} disabled={exportLoading || completedCount === 0}>
              {exportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              Unduh Bundle
            </Button>
            <Button size="sm" onClick={() => setEcoHubOpen(false)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              Tutup Hub
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Ebook Outline & TOC Dialog */}
      <Dialog open={ebOutlineOpen} onOpenChange={setEbOutlineOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              Ebook Outline & Daftar Isi Lengkap
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs text-muted-foreground shrink-0">Jumlah bab:</div>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={ebOutlineChapters}
              onChange={e => setEbOutlineChapters(e.target.value)}
              data-testid="select-outline-chapters"
            >
              {['5','7','8','10','12','15'].map(n => <option key={n} value={n}>{n} Bab</option>)}
            </select>
            <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white" onClick={handleGenerateEbOutline} disabled={ebOutlineLoading} data-testid="button-regen-outline">
              {ebOutlineLoading ? 'Generating...' : '🔄 Regenerate'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ebOutlineLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menyusun struktur ebook yang komprehensif...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {ebOutlineContent}
              </div>
            )}
          </div>
          {!ebOutlineLoading && ebOutlineContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(ebOutlineContent); toast({ title: 'Outline tersalin!' }); }} data-testid="button-copy-outline">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chapter Builder Dialog */}
      <Dialog open={chapterBuilderOpen} onOpenChange={setChapterBuilderOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Chapter Builder — Tulis Ebook Bab per Bab
            </DialogTitle>
          </DialogHeader>
          {/* Tone selector + add button */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className="text-xs text-muted-foreground">Gaya tulisan:</div>
            <select className="border rounded px-2 py-1 text-xs" value={chapterTone} onChange={e => setChapterTone(e.target.value)} data-testid="select-chapter-tone">
              <option value="informatif dan mudah dipahami">Informatif & Mudah</option>
              <option value="conversational seperti ngobrol teman">Conversational</option>
              <option value="akademis dan profesional">Akademis & Profesional</option>
              <option value="motivatif dan inspiring">Motivatif & Inspiring</option>
              <option value="praktis dengan banyak contoh nyata">Praktis & Contoh Nyata</option>
            </select>
            <Button size="sm" variant="outline" onClick={handleAddChapter} data-testid="button-add-chapter">
              + Tambah Bab
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const allContent = chapters.filter(c => c.content).map(c => c.content).join('\n\n---\n\n');
                if (allContent) { navigator.clipboard.writeText(allContent); toast({ title: 'Semua bab tersalin!' }); }
              }}
              data-testid="button-copy-all-chapters"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Salin Semua Bab
            </Button>
          </div>
          <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
            {/* Chapter list sidebar */}
            <div className="w-52 shrink-0 overflow-y-auto border-r pr-3 flex flex-col gap-2">
              {chapters.map((ch) => (
                <div
                  key={ch.id}
                  className={`rounded-lg p-2 cursor-pointer border transition-all ${activeChapterId === ch.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-border hover:border-indigo-300'}`}
                  onClick={() => setActiveChapterId(ch.id)}
                  data-testid={`chapter-item-${ch.id}`}
                >
                  <div className="text-[10px] text-muted-foreground font-mono">BAB {ch.number}</div>
                  <div className="text-xs font-medium truncate mt-0.5">{ch.title || <span className="opacity-40">Belum diisi...</span>}</div>
                  {ch.content && <div className="text-[10px] text-green-600 mt-1">✓ Generated</div>}
                  {ch.loading && <div className="text-[10px] text-blue-500 mt-1">⏳ Generating...</div>}
                </div>
              ))}
            </div>
            {/* Chapter editor */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {chapters.filter(c => c.id === activeChapterId).map(ch => (
                <div key={ch.id} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Judul Bab {ch.number}:</div>
                      <input
                        className="border rounded px-3 py-1.5 text-sm w-full"
                        placeholder={`Contoh: Strategi Pemasaran Digital`}
                        value={ch.title}
                        onChange={e => setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, title: e.target.value } : c))}
                        data-testid={`input-chapter-title-${ch.id}`}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sub-topik (opsional, pisah koma):</div>
                      <input
                        className="border rounded px-3 py-1.5 text-sm w-full"
                        placeholder="Contoh: definisi, cara kerja, contoh, tips"
                        value={ch.subTopics}
                        onChange={e => setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, subTopics: e.target.value } : c))}
                        data-testid={`input-chapter-subtopics-${ch.id}`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-indigo-700 hover:bg-indigo-800 text-white"
                      onClick={() => handleGenerateChapter(ch.id)}
                      disabled={ch.loading}
                      data-testid={`button-gen-chapter-${ch.id}`}
                    >
                      {ch.loading ? <><Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />Generating...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate Bab {ch.number}</>}
                    </Button>
                    {chapters.length > 1 && (
                      <Button size="sm" variant="outline" onClick={() => handleRemoveChapter(ch.id)} className="text-red-500 hover:text-red-600" data-testid={`button-remove-chapter-${ch.id}`}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {ch.content ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        className="w-full border rounded-lg p-3 text-sm font-mono leading-relaxed min-h-[280px] resize-y"
                        value={ch.content}
                        onChange={e => setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, content: e.target.value } : c))}
                        data-testid={`textarea-chapter-content-${ch.id}`}
                      />
                      {/* Perpanjang Isi Bab toolbar */}
                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                        <span className="text-xs text-blue-700 dark:text-blue-400 font-medium shrink-0">📝 Perpanjang:</span>
                        <select className="border rounded px-2 py-1 text-xs" value={expandWordsCount} onChange={e => setExpandWordsCount(e.target.value)} data-testid="select-expand-words">
                          {['100','150','200','300','500'].map(n => <option key={n} value={n}>+{n} kata</option>)}
                        </select>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3" onClick={() => handleExpandChapter(ch.id)} disabled={expandLoading === ch.id} data-testid={`button-expand-chapter-${ch.id}`}>
                          {expandLoading === ch.id ? <><Loader2 className="animate-spin h-3 w-3 mr-1" />Expanding...</> : '+ Perpanjang Bab'}
                        </Button>
                      </div>
                      {/* Custom Regenerate toolbar */}
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900">
                        <div className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-2">⚙️ Custom Upgrade Bab — pilih elemen yang ingin ditambahkan:</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {[
                            { key: 'poin_bullet', label: '☑ Poin Bullet' },
                            { key: 'tabel', label: '📊 Tabel' },
                            { key: 'data_riset', label: '📈 Data/Statistik' },
                            { key: 'contoh_kasus', label: '💼 Contoh Kasus' },
                            { key: 'tips_praktis', label: '💡 Tips Praktis' },
                            { key: 'faq_mini', label: '❓ FAQ Mini' },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => toggleCustomAddition(opt.key)}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${customRegenAdditions.includes(opt.key) ? 'bg-purple-600 text-white border-purple-600' : 'border-border hover:border-purple-400'}`}
                              data-testid={`toggle-addition-${opt.key}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3" onClick={() => handleCustomRegenChapter(ch.id)} disabled={customRegenLoading === ch.id || ch.loading} data-testid={`button-custom-regen-${ch.id}`}>
                          {(customRegenLoading === ch.id || ch.loading) ? <><Loader2 className="animate-spin h-3 w-3 mr-1" />Upgrading...</> : <><Sparkles className="h-3 w-3 mr-1" />Upgrade Bab</>}
                        </Button>
                      </div>
                      {/* AI Text Assist toolbar — Edukazo-style */}
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> AI Text Assist — Edit & Transform Konten Bab
                          <span className="text-[10px] font-normal opacity-70 ml-1">(biarkan kosong = apply ke seluruh bab)</span>
                        </div>
                        {/* Row 1: Expand group */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-[10px] text-muted-foreground self-center mr-1 shrink-0">Expand:</span>
                          {[
                            { op: 'expand_detail', label: '📄 More Detail' },
                            { op: 'expand_extended', label: '📋 Extended' },
                            { op: 'expand_with_table', label: '📊 +Tabel' },
                          ].map(({ op, label }) => (
                            <button
                              key={op}
                              className={`px-2.5 py-1 rounded text-xs border transition-all ${aiAssistLoading?.startsWith(op) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'}`}
                              disabled={!!aiAssistLoading}
                              onClick={() => {
                                const ta = document.querySelector(`[data-testid="textarea-chapter-content-${ch.id}"]`) as HTMLTextAreaElement;
                                const sel = ta && ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : ch.content;
                                handleAiTextAssist(ch.id, sel, op);
                              }}
                              data-testid={`button-assist-${op}-${ch.id}`}
                            >
                              {aiAssistLoading === op + '_' + ch.id ? <span className="flex items-center gap-1"><Loader2 className="animate-spin h-3 w-3" />{label}</span> : label}
                            </button>
                          ))}
                          <span className="text-[10px] text-muted-foreground self-center ml-2 shrink-0">Edit:</span>
                          {[
                            { op: 'shorten', label: '✂️ Shorten' },
                            { op: 'humanize', label: '🤝 Humanize' },
                          ].map(({ op, label }) => (
                            <button
                              key={op}
                              className={`px-2.5 py-1 rounded text-xs border transition-all ${aiAssistLoading?.startsWith(op) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'}`}
                              disabled={!!aiAssistLoading}
                              onClick={() => {
                                const ta = document.querySelector(`[data-testid="textarea-chapter-content-${ch.id}"]`) as HTMLTextAreaElement;
                                const sel = ta && ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : ch.content;
                                handleAiTextAssist(ch.id, sel, op);
                              }}
                              data-testid={`button-assist-${op}-${ch.id}`}
                            >
                              {aiAssistLoading === op + '_' + ch.id ? <span className="flex items-center gap-1"><Loader2 className="animate-spin h-3 w-3" />{label}</span> : label}
                            </button>
                          ))}
                        </div>
                        {/* Row 2: Tone + Translate */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-muted-foreground self-center mr-1 shrink-0">Tone:</span>
                          {[
                            { op: 'tone_professional', label: '💼 Profesional' },
                            { op: 'tone_casual', label: '😊 Casual' },
                            { op: 'tone_friendly', label: '🤗 Friendly' },
                          ].map(({ op, label }) => (
                            <button
                              key={op}
                              className={`px-2.5 py-1 rounded text-xs border transition-all ${aiAssistLoading?.startsWith(op) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'}`}
                              disabled={!!aiAssistLoading}
                              onClick={() => {
                                const ta = document.querySelector(`[data-testid="textarea-chapter-content-${ch.id}"]`) as HTMLTextAreaElement;
                                const sel = ta && ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : ch.content;
                                handleAiTextAssist(ch.id, sel, op);
                              }}
                              data-testid={`button-assist-${op}-${ch.id}`}
                            >
                              {aiAssistLoading === op + '_' + ch.id ? <span className="flex items-center gap-1"><Loader2 className="animate-spin h-3 w-3" />{label}</span> : label}
                            </button>
                          ))}
                          <span className="text-[10px] text-muted-foreground self-center ml-2 shrink-0">Terjemah:</span>
                          {[
                            { op: 'translate_en', label: '🇬🇧 → English' },
                            { op: 'translate_id', label: '🇮🇩 → Indonesia' },
                          ].map(({ op, label }) => (
                            <button
                              key={op}
                              className={`px-2.5 py-1 rounded text-xs border transition-all ${aiAssistLoading?.startsWith(op) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'}`}
                              disabled={!!aiAssistLoading}
                              onClick={() => {
                                const ta = document.querySelector(`[data-testid="textarea-chapter-content-${ch.id}"]`) as HTMLTextAreaElement;
                                const sel = ta && ta.selectionStart !== ta.selectionEnd ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : ch.content;
                                handleAiTextAssist(ch.id, sel, op);
                              }}
                              data-testid={`button-assist-${op}-${ch.id}`}
                            >
                              {aiAssistLoading === op + '_' + ch.id ? <span className="flex items-center gap-1"><Loader2 className="animate-spin h-3 w-3" />{label}</span> : label}
                            </button>
                          ))}
                        </div>
                        {/* AI Assist Preview */}
                        {aiAssistPreview && aiAssistPreview.chapterId === ch.id && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-emerald-400">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✨ Preview Hasil AI Assist</span>
                              <div className="flex gap-2">
                                <Button size="sm" className="h-6 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3" onClick={() => handleApplyAiAssist(ch.id)} data-testid={`button-apply-assist-${ch.id}`}>
                                  ✓ Terapkan ke Bab
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setAiAssistPreview(null)}>
                                  ✕ Batal
                                </Button>
                              </div>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{aiAssistPreview.result}</pre>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(ch.content); toast({ title: `Bab ${ch.number} tersalin!` }); }} data-testid={`button-copy-chapter-${ch.id}`}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Salin Bab
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-border flex items-center justify-center h-48 text-sm text-muted-foreground">
                      {ch.loading ? 'Sedang menulis bab...' : 'Isi judul bab lalu klik Generate'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ebook Layout Preview Dialog */}
      <Dialog open={ebTemplateOpen} onOpenChange={setEbTemplateOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-pink-600" />
              Ebook Layout Preview — Visual Template
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className="text-xs text-muted-foreground">Tema:</div>
            {(['professional','modern','warm','bold','minimal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setEbTheme(t)}
                className={`px-3 py-1 rounded-full text-xs border transition-all capitalize ${ebTheme === t ? 'bg-pink-700 text-white border-pink-700' : 'border-border hover:border-pink-400'}`}
                data-testid={`button-theme-${t}`}
              >
                {t === 'professional' ? '🔵 Professional' : t === 'modern' ? '🟣 Modern' : t === 'warm' ? '🟠 Warm' : t === 'bold' ? '⚫ Bold Dark' : '🟢 Minimal'}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Warna aksen:</div>
              <input type="color" className="w-8 h-7 rounded cursor-pointer border" value={ebAccentColor || '#1e3a8a'} onChange={e => setEbAccentColor(e.target.value)} data-testid="input-accent-color" />
            </div>
            <Button size="sm" className="bg-pink-700 hover:bg-pink-800 text-white" onClick={handleGenerateEbTemplate} disabled={ebTemplateLoading} data-testid="button-regen-template">
              {ebTemplateLoading ? 'Rendering...' : '🔄 Apply & Preview'}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg border">
            {ebTemplateLoading ? (
              <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Rendering layout ebook...</span>
              </div>
            ) : ebTemplateHtml ? (
              <iframe
                srcDoc={ebTemplateHtml}
                className="w-full h-full border-0"
                title="Ebook Preview"
                sandbox="allow-same-origin"
                data-testid="iframe-ebook-preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Pilih tema dan klik Apply & Preview untuk melihat tampilan ebook
              </div>
            )}
          </div>
          {!ebTemplateLoading && ebTemplateHtml && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(ebTemplateHtml); toast({ title: 'HTML template tersalin!' }); }} data-testid="button-copy-template-html">
                <Copy className="h-4 w-4 mr-1.5" /> Salin HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const blob = new Blob([ebTemplateHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `ebook-preview-${ebTheme}.html`; a.click();
                URL.revokeObjectURL(url);
              }} data-testid="button-download-template">
                <Download className="h-4 w-4 mr-1.5" /> Download HTML
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stok Gambar — Free Image Search (Openverse Creative Commons) */}
      <Dialog open={imageSearchOpen} onOpenChange={setImageSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-5 w-5 text-teal-600" />
              Stok Gambar Gratis — Creative Commons (Openverse)
            </DialogTitle>
          </DialogHeader>
          {/* Search bar */}
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Cari gambar... (contoh: bisnis, teknologi, pertanian, kesehatan)"
              value={imageQuery}
              onChange={e => setImageQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImageSearch(undefined, 1)}
              data-testid="input-image-search"
            />
            <Button className="bg-teal-700 hover:bg-teal-800 text-white" onClick={() => handleImageSearch(undefined, 1)} disabled={imageSearchLoading} data-testid="button-search-images">
              {imageSearchLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {/* Quick keyword suggestions from ebook topic */}
          {(projectTopik || projectTitle) && (
            <div className="flex gap-1 flex-wrap mb-3">
              <span className="text-xs text-muted-foreground">Saran:</span>
              {[
                projectTitle?.split(' ').slice(0,2).join(' '),
                projectTopik?.split(' ').slice(0,2).join(' '),
                'Indonesia business',
                'people working',
                'technology office',
                'success achievement',
              ].filter(Boolean).slice(0,6).map((kw, i) => (
                <button key={i} className="text-xs px-2 py-0.5 rounded-full border hover:bg-teal-50 dark:hover:bg-teal-950 hover:border-teal-400 transition-all" onClick={() => handleImageSearch(kw!, 1)} data-testid={`button-keyword-${i}`}>
                  {kw}
                </button>
              ))}
            </div>
          )}
          {/* Results grid */}
          <div className="flex-1 overflow-y-auto">
            {imageSearchLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Mencari gambar Creative Commons...</span>
              </div>
            ) : imageResults.length > 0 ? (
              <>
                <div className="text-xs text-muted-foreground mb-3">{imageTotal.toLocaleString()} gambar ditemukan · Lisensi Creative Commons · Gratis untuk digunakan</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imageResults.map(img => (
                    <div key={img.id} className="group relative rounded-lg overflow-hidden border bg-muted aspect-[4/3] flex flex-col" data-testid={`image-result-${img.id}`}>
                      <img
                        src={img.thumbnail || img.url}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23e5e7eb" width="200" height="150"/><text fill="%236b7280" font-size="12" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Preview</text></svg>'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end opacity-0 group-hover:opacity-100">
                        <div className="p-2 w-full flex gap-1">
                          <button
                            className="flex-1 bg-white/90 hover:bg-white text-gray-800 text-xs rounded px-2 py-1 transition-all"
                            onClick={() => { navigator.clipboard.writeText(img.url); toast({ title: 'URL gambar tersalin!' }); }}
                            data-testid={`button-copy-img-url-${img.id}`}
                          >
                            📋 Salin URL
                          </button>
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs rounded px-2 py-1 transition-all"
                            data-testid={`button-open-img-${img.id}`}
                          >
                            ↗
                          </a>
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-[9px] rounded px-1 py-0.5 uppercase">{img.license}</div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-4">
                  {imageSearchPage > 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleImageSearch(undefined, imageSearchPage - 1)} data-testid="button-prev-page">
                      ← Sebelumnya
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground self-center">Halaman {imageSearchPage}</span>
                  {imageResults.length === 12 && (
                    <Button variant="outline" size="sm" onClick={() => handleImageSearch(undefined, imageSearchPage + 1)} data-testid="button-next-page">
                      Berikutnya →
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <ImagePlus className="h-10 w-10 opacity-20" />
                <div className="text-sm">Ketik kata kunci dan tekan Enter untuk mencari gambar</div>
                <div className="text-xs opacity-60">Semua gambar berlisensi Creative Commons — bebas digunakan</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DISTRIBUSI DIALOGS ===== */}

      {/* Platform Listing Dialog */}
      <Dialog open={platformListingOpen} onOpenChange={setPlatformListingOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Platform Listing Pack — Tokopedia · Shopee · Gumroad · WA · Telegram
            </DialogTitle>
          </DialogHeader>
          {platformListingLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="animate-spin h-6 w-6" />
              <span>Membuat listing untuk semua platform...</span>
            </div>
          ) : platformListingContent ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(platformListingContent); toast({ title: 'Semua listing tersalin!' }); }} data-testid="button-copy-platform-listing">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                </Button>
                <Button variant="outline" size="sm" onClick={handlePlatformListing} data-testid="button-regen-platform-listing">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
              <MarkdownContent content={platformListingContent} className="border rounded-lg p-4 bg-muted/30" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reseller Kit Dialog */}
      <Dialog open={resellerKitOpen} onOpenChange={setResellerKitOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              Reseller & Afiliasi Kit — Sistem Komisi · Pitch · Script Closing
            </DialogTitle>
          </DialogHeader>
          {resellerKitLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="animate-spin h-6 w-6" />
              <span>Membangun sistem reseller & afiliasi...</span>
            </div>
          ) : resellerKitContent ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(resellerKitContent); toast({ title: 'Reseller Kit tersalin!' }); }} data-testid="button-copy-reseller-kit">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                </Button>
                <Button variant="outline" size="sm" onClick={handleResellerKit} data-testid="button-regen-reseller-kit">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
              <MarkdownContent content={resellerKitContent} className="border rounded-lg p-4 bg-muted/30" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Content Repurposing Dialog */}
      <Dialog open={repurposingOpen} onOpenChange={setRepurposingOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-cyan-600" />
              Content Repurposing Pack — 1 Ebook → 6 Format Multi-Platform
            </DialogTitle>
          </DialogHeader>
          {repurposingLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="animate-spin h-6 w-6" />
              <span>Mengubah ebook menjadi 6 format konten...</span>
            </div>
          ) : repurposingContent ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(repurposingContent); toast({ title: 'Semua konten tersalin!' }); }} data-testid="button-copy-repurposing">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                </Button>
                <Button variant="outline" size="sm" onClick={handleContentRepurposing} data-testid="button-regen-repurposing">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
              <MarkdownContent content={repurposingContent} className="border rounded-lg p-4 bg-muted/30" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== END DISTRIBUSI DIALOGS ===== */}

      {/* ===== SOSMED DIALOGS ===== */}

      {/* Social Media Pilar Plan Dialog */}
      <Dialog open={socialPilarOpen} onOpenChange={(o) => { setSocialPilarOpen(o); if (!o) setSocialPilarContent(''); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">📱</span>
              Social Media Pilar Plan — Konten Terstruktur per Angle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate rencana konten sosial media berbasis pilar: ide visual + caption lengkap + hashtag + CTA untuk setiap post.
            </DialogDescription>
          </DialogHeader>
          {!socialPilarContent && !socialPilarLoading && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Jumlah Angle/Pilar (maks 8)</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full" value={socialPilarAngles} onChange={e => setSocialPilarAngles(e.target.value)} data-testid="select-pilar-angles">
                  {['2','3','4','5','6','7','8'].map(n => <option key={n} value={n}>{n} Pilar</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Konten per Pilar (maks 7)</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full" value={socialPilarPerAngle} onChange={e => setSocialPilarPerAngle(e.target.value)} data-testid="select-pilar-per-angle">
                  {['2','3','4','5','6','7'].map(n => <option key={n} value={n}>{n} Konten/Pilar</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Info Brand/Produk (opsional — deskripsi brand untuk personalisasi konten)</label>
                <textarea
                  className="border rounded px-3 py-2 text-sm w-full min-h-[70px] resize-y"
                  placeholder="Contoh: Brand kita adalah [nama brand], bergerak di bidang [bidang], target market [target], keunikan/USP [USP brand]..."
                  value={socialPilarBrand}
                  onChange={e => setSocialPilarBrand(e.target.value)}
                  data-testid="textarea-pilar-brand"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={handleSocialPilar} data-testid="button-gen-social-pilar">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Generate {socialPilarAngles} Pilar × {socialPilarPerAngle} Konten
                </Button>
              </div>
            </div>
          )}
          {socialPilarLoading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="animate-spin h-6 w-6" />
              <span>Membuat {socialPilarAngles} pilar konten × {socialPilarPerAngle} post per pilar...</span>
            </div>
          )}
          {socialPilarContent && !socialPilarLoading && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => { setSocialPilarContent(''); }} data-testid="button-reset-pilar">
                  ↩ Setting Ulang
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(socialPilarContent); toast({ title: 'Social Pilar Plan tersalin!' }); }} data-testid="button-copy-social-pilar">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                </Button>
                <Button variant="outline" size="sm" onClick={handleSocialPilar} data-testid="button-regen-social-pilar">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
              <MarkdownContent content={socialPilarContent} className="border rounded-lg p-4 bg-muted/30" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Thread FB/X Content Dialog */}
      <Dialog open={threadOpen} onOpenChange={(o) => { setThreadOpen(o); if (!o) setThreadContent(''); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🧵</span>
              Thread FB/X Content — Storytelling untuk Facebook & Twitter/X
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate thread storytelling berbasis angle: hook viral + body thread + CTA + engagement trigger per thread.
            </DialogDescription>
          </DialogHeader>
          {!threadContent && !threadLoading && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Jumlah Angle (maks 6)</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full" value={threadAngles} onChange={e => setThreadAngles(e.target.value)} data-testid="select-thread-angles">
                  {['2','3','4','5','6'].map(n => <option key={n} value={n}>{n} Angle</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Thread per Angle (maks 5)</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full" value={threadPerAngle} onChange={e => setThreadPerAngle(e.target.value)} data-testid="select-thread-per-angle">
                  {['1','2','3','4','5'].map(n => <option key={n} value={n}>{n} Thread/Angle</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipe Konten Thread</label>
                <select className="border rounded px-3 py-1.5 text-sm w-full" value={threadType} onChange={e => setThreadType(e.target.value)} data-testid="select-thread-type">
                  <option value="storytelling, edukasi, promosi">Mix: Story + Edukasi + Promo</option>
                  <option value="storytelling personal branding">Storytelling Personal</option>
                  <option value="edukasi dan tips praktis">Edukasi & Tips</option>
                  <option value="flash sale dan promosi">Promosi & Flash Sale</option>
                  <option value="behind the scenes dan cerita brand">Behind-The-Scenes</option>
                  <option value="engagement dan komunitas">Engagement & Komunitas</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Info Brand (opsional)</label>
                <input
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Nama brand + deskripsi singkat"
                  value={threadBrand}
                  onChange={e => setThreadBrand(e.target.value)}
                  data-testid="input-thread-brand"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleThreadContent} data-testid="button-gen-thread">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Generate {threadAngles} Angle × {threadPerAngle} Thread
                </Button>
              </div>
            </div>
          )}
          {threadLoading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="animate-spin h-6 w-6" />
              <span>Membuat {threadAngles} angle × {threadPerAngle} thread storytelling...</span>
            </div>
          )}
          {threadContent && !threadLoading && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => setThreadContent('')} data-testid="button-reset-thread">
                  ↩ Setting Ulang
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(threadContent); toast({ title: 'Thread content tersalin!' }); }} data-testid="button-copy-thread">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                </Button>
                <Button variant="outline" size="sm" onClick={handleThreadContent} data-testid="button-regen-thread">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
              <MarkdownContent content={threadContent} className="border rounded-lg p-4 bg-muted/30" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== END SOSMED DIALOGS ===== */}

      {/* ===== PROTEKSI & PUBLISH DIALOGS ===== */}

      {/* Export Terproteksi Dialog */}
      <Dialog open={ebProtectionOpen} onOpenChange={setEbProtectionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🔒</span>
              Export Ebook Terproteksi — Lock & DRM
            </DialogTitle>
            <DialogDescription className="text-xs">
              Export PDF dengan watermark, hak cipta, dan proteksi anti-duplikasi. Cocok untuk ebook yang dijual/dimonetisasi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nama Pemilik / Brand</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                placeholder="Contoh: Chaesa Digital, @username, PT. Nama Brand"
                value={ebOwnerName}
                onChange={e => setEbOwnerName(e.target.value)}
                data-testid="input-protection-owner"
              />
              <div className="text-xs text-muted-foreground mt-1">Nama ini akan muncul di footer setiap halaman dan cover</div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Teks Watermark</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                placeholder="Biarkan kosong = gunakan nama pemilik"
                value={ebWatermarkText}
                onChange={e => setEbWatermarkText(e.target.value)}
                data-testid="input-protection-watermark"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-medium block">Opsi Proteksi</label>
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                <input type="checkbox" checked={ebWatermarkEnabled} onChange={e => setEbWatermarkEnabled(e.target.checked)} className="w-4 h-4 accent-red-600" data-testid="check-watermark" />
                <div>
                  <div className="text-sm font-medium">Watermark diagonal</div>
                  <div className="text-xs text-muted-foreground">Teks samar diagonal di tengah tiap halaman</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                <input type="checkbox" checked={ebAntiCopyEnabled} onChange={e => setEbAntiCopyEnabled(e.target.checked)} className="w-4 h-4 accent-red-600" data-testid="check-anti-copy" />
                <div>
                  <div className="text-sm font-medium">Notice Hak Cipta (UU No.28/2014)</div>
                  <div className="text-xs text-muted-foreground">Klausa hak cipta legal di halaman cover</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                <input type="checkbox" checked={ebConfidentialEnabled} onChange={e => setEbConfidentialEnabled(e.target.checked)} className="w-4 h-4 accent-red-600" data-testid="check-confidential" />
                <div>
                  <div className="text-sm font-medium">Label RAHASIA</div>
                  <div className="text-xs text-muted-foreground">Stempel "RAHASIA — HANYA UNTUK PEMILIK" di cover</div>
                </div>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-red-700 hover:bg-red-800 text-white"
                onClick={handleExportProtected}
                disabled={ebProtectionLoading}
                data-testid="button-do-export-protected"
              >
                {ebProtectionLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Generating...</> : <><span className="mr-1.5">🔒</span> Export PDF Terproteksi</>}
              </Button>
              <Button variant="outline" onClick={() => setEbProtectionOpen(false)}>Batal</Button>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <span className="font-semibold">💡 Tips Proteksi Maksimal:</span> Kombinasikan watermark + hak cipta + nama pemilik spesifik untuk menciptakan jejak digital yang sulit dihapus. Gunakan nama brand + website untuk identifikasi kepemilikan.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Baca Online / Publish Reader Dialog */}
      <Dialog open={ebPublishOpen} onOpenChange={setEbPublishOpen}>
        <DialogContent className="max-w-5xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <div>
                <div className="font-semibold text-sm">Baca Online — Ebook Reader</div>
                <div className="text-xs text-muted-foreground">Preview ebook langsung dalam aplikasi</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground mr-1">Tema:</div>
              <button
                className={`px-3 py-1 rounded text-xs border transition-all ${ebPublishTheme === 'light' ? 'bg-slate-100 text-slate-800 border-slate-300' : 'border-border hover:bg-muted/40'}`}
                onClick={() => { setEbPublishTheme('light'); }}
                data-testid="button-publish-light"
              >☀️ Light</button>
              <button
                className={`px-3 py-1 rounded text-xs border transition-all ${ebPublishTheme === 'dark' ? 'bg-slate-800 text-white border-slate-600' : 'border-border hover:bg-muted/40'}`}
                onClick={() => { setEbPublishTheme('dark'); }}
                data-testid="button-publish-dark"
              >🌙 Dark</button>
              <Button size="sm" variant="outline" onClick={() => { handleGeneratePublishView(); }} className="text-xs h-7" data-testid="button-refresh-publish">
                🔄 Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => {
                  const blob = new Blob([ebPublishHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'ebook-reader.html'; a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'File HTML reader ter-download!' });
                }}
                data-testid="button-download-html-reader"
              >
                ⬇️ Download HTML
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {ebPublishHtml ? (
              <iframe
                srcDoc={ebPublishHtml}
                className="w-full h-full border-0"
                title="Ebook Reader"
                sandbox="allow-same-origin allow-scripts"
                data-testid="iframe-publish-reader"
              />
            ) : (
              <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                <span className="text-4xl">📚</span>
                <div>
                  <div className="font-medium">Belum ada konten</div>
                  <div className="text-sm">Generate bab di Chapter Builder terlebih dahulu, lalu buka Baca Online</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== END PROTEKSI & PUBLISH DIALOGS ===== */}

      {/* ===== 6 NEW FEATURE DIALOGS ===== */}

      {/* IG Caption Pack Dialog */}
      <Dialog open={igCaptionOpen} onOpenChange={setIgCaptionOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">📸</span>
              IG Caption Pack — Instagram Content Generator
            </DialogTitle>
            <DialogDescription className="text-xs">Generate {igCaptionJumlah} caption Instagram siap posting lengkap dengan hook, body, CTA, dan hashtag set.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">Tone:</label>
              {['casual', 'profesional', 'motivational', 'edukasi', 'humor'].map(t => (
                <button key={t} onClick={() => setIgCaptionTone(t)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${igCaptionTone === t ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'border-border hover:bg-muted/40'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <label className="text-xs text-muted-foreground">Jumlah:</label>
              {['5','7','10'].map(n => (
                <button key={n} onClick={() => setIgCaptionJumlah(n)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${igCaptionJumlah === n ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'border-border hover:bg-muted/40'}`}>
                  {n} caption
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <input className="border rounded px-2 py-1 text-xs flex-1" placeholder="Nama brand/akun IG (opsional)"
              value={igCaptionBrand} onChange={e => setIgCaptionBrand(e.target.value)} />
            <Button onClick={handleIgCaption} disabled={igCaptionLoading} size="sm"
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs">
              {igCaptionLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">📸</span>}
              Generate {igCaptionJumlah} Caption
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {igCaptionLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Generating {igCaptionJumlah} caption Instagram...</span></div>
            ) : igCaptionContent ? (
              <div className="relative">
                <MarkdownContent content={igCaptionContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(igCaptionContent); toast({ title: '✅ Semua caption disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat caption pack Instagram</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reels/TikTok Hook Generator Dialog */}
      <Dialog open={reelHookOpen} onOpenChange={setReelHookOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🎬</span>
              Reels / TikTok Hook Generator — Stop Scroll Formula
            </DialogTitle>
            <DialogDescription className="text-xs">Generate {reelHookJumlah} hook video dengan 5 pola viral. Setiap hook lengkap dengan visual opening, dialog, text overlay, dan audio vibe.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <label className="text-xs text-muted-foreground">Jumlah Hook:</label>
            {['10','15','20'].map(n => (
              <button key={n} onClick={() => setReelHookJumlah(n)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${reelHookJumlah === n ? 'bg-violet-600 text-white border-violet-600' : 'border-border hover:bg-muted/40'}`}>
                {n} hooks
              </button>
            ))}
            <Button onClick={handleReelHook} disabled={reelHookLoading} size="sm" className="ml-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs">
              {reelHookLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">🎬</span>}
              Generate {reelHookJumlah} Hooks
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {reelHookLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Generating {reelHookJumlah} hook video...</span></div>
            ) : reelHookContent ? (
              <div className="relative">
                <MarkdownContent content={reelHookContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(reelHookContent); toast({ title: '✅ Semua hook disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat hook video Reels/TikTok</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Ladder Dialog */}
      <Dialog open={pricingLadderOpen} onOpenChange={setPricingLadderOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">💲</span>
              Pricing Ladder & Offer Stack — Value Ladder 5 Tier
            </DialogTitle>
            <DialogDescription className="text-xs">Rancang struktur harga dari Lead Magnet → Tripwire → Core → Upsell → Continuity lengkap dengan copywriting dan revenue projection.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-end shrink-0 flex-wrap">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Harga Core Product (opsional)</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Contoh: Rp 297.000"
                value={pricingCorePrice} onChange={e => setPricingCorePrice(e.target.value)} data-testid="input-pricing-core" />
            </div>
            <Button onClick={handlePricingLadder} disabled={pricingLadderLoading} size="sm"
              className="bg-gradient-to-r from-emerald-700 to-green-700 text-white text-xs shrink-0">
              {pricingLadderLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">💲</span>}
              Generate Pricing Ladder
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {pricingLadderLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Merancang struktur harga 5 tier...</span></div>
            ) : pricingLadderContent ? (
              <div className="relative">
                <MarkdownContent content={pricingLadderContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(pricingLadderContent); toast({ title: '✅ Pricing Ladder disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat pricing ladder 5 tier</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Launch Checklist D-30 Dialog */}
      <Dialog open={launchCheckOpen} onOpenChange={setLaunchCheckOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🚀</span>
              Launch Checklist D-30 — Timeline & Broadcast Template
            </DialogTitle>
            <DialogDescription className="text-xs">Timeline launch 30 hari dari persiapan hingga post-launch. Termasuk template WA broadcast siap kirim dan caption IG Stories launch week.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-end flex-wrap shrink-0">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Channel</label>
              <div className="flex gap-1">
                {['WhatsApp, Instagram','WhatsApp, Email','Semua Platform'].map(ch => (
                  <button key={ch} onClick={() => setLaunchChannels(ch)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${launchChannels === ch ? 'bg-orange-600 text-white border-orange-600' : 'border-border hover:bg-muted/40'}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Harga Launch</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Early bird Rp X..."
                value={launchHarga} onChange={e => setLaunchHarga(e.target.value)} data-testid="input-launch-harga" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Tanggal Launch</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Contoh: 1 Mei 2026"
                value={launchTanggal} onChange={e => setLaunchTanggal(e.target.value)} data-testid="input-launch-tanggal" />
            </div>
            <Button onClick={handleLaunchChecklist} disabled={launchCheckLoading} size="sm"
              className="bg-gradient-to-r from-orange-700 to-amber-700 text-white text-xs shrink-0">
              {launchCheckLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">🚀</span>}
              Generate Timeline
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {launchCheckLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Generating timeline launch 30 hari...</span></div>
            ) : launchCheckContent ? (
              <div className="relative">
                <MarkdownContent content={launchCheckContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(launchCheckContent); toast({ title: '✅ Launch Checklist disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat launch timeline 30 hari</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* TikTok Ads Script Dialog */}
      <Dialog open={tikTokAdsOpen} onOpenChange={setTikTokAdsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🎵</span>
              TikTok Ads Script — 3 Angle Video Ad Script
            </DialogTitle>
            <DialogDescription className="text-xs">Script video ads TikTok 3 angle berbeda (Pain / Story / Social Proof) lengkap dengan visual direction, dialog, text overlay, hashtag, dan tips targeting.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-end flex-wrap shrink-0">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Masalah Target</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Masalah yang dialami audience..."
                value={tikTokMasalah} onChange={e => setTikTokMasalah(e.target.value)} data-testid="input-tiktok-masalah" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">CTA</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Klik link di bio sekarang!"
                value={tikTokCta} onChange={e => setTikTokCta(e.target.value)} data-testid="input-tiktok-cta" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Durasi</label>
              <div className="flex gap-1">
                {['15','30','60'].map(d => (
                  <button key={d} onClick={() => setTikTokDurasi(d)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${tikTokDurasi === d ? 'bg-slate-700 text-white border-slate-700' : 'border-border hover:bg-muted/40'}`}>
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleTikTokAds} disabled={tikTokAdsLoading} size="sm"
              className="bg-gradient-to-r from-slate-700 to-gray-800 text-white text-xs shrink-0">
              {tikTokAdsLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">🎵</span>}
              Generate 3 Script
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {tikTokAdsLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Generating 3 script TikTok Ads ({tikTokDurasi} detik)...</span></div>
            ) : tikTokAdsContent ? (
              <div className="relative">
                <MarkdownContent content={tikTokAdsContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(tikTokAdsContent); toast({ title: '✅ TikTok Ads Script disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat TikTok Ads Script</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Search Ads RSA Dialog */}
      <Dialog open={googleAdsOpen} onOpenChange={setGoogleAdsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🔍</span>
              Google Search Ads RSA — Responsive Search Ads Lengkap
            </DialogTitle>
            <DialogDescription className="text-xs">15 Headline + 4 Description RSA siap pakai, keyword strategy, negative keywords, ad extensions, dan landing page optimization checklist.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-end flex-wrap shrink-0">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Target Keywords</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Kata kunci utama yang ingin ditarget..."
                value={googleKeywords} onChange={e => setGoogleKeywords(e.target.value)} data-testid="input-google-keywords" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Manfaat Utama</label>
              <input className="border rounded px-2 py-1 text-xs w-full" placeholder="Benefit terbesar produk Anda..."
                value={googleBenefit} onChange={e => setGoogleBenefit(e.target.value)} data-testid="input-google-benefit" />
            </div>
            <Button onClick={handleGoogleAds} disabled={googleAdsLoading} size="sm"
              className="bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs shrink-0">
              {googleAdsLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <span className="mr-1">🔍</span>}
              Generate Google Ads
            </Button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {googleAdsLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /><span className="text-sm">Generating RSA headlines, descriptions, dan extensions...</span></div>
            ) : googleAdsContent ? (
              <div className="relative">
                <MarkdownContent content={googleAdsContent} className="bg-muted/30 rounded-lg p-4" />
                <Button size="sm" variant="outline" className="absolute top-2 right-2 text-xs h-6"
                  onClick={() => { navigator.clipboard.writeText(googleAdsContent); toast({ title: '✅ Google Ads disalin!' }); }}>
                  Copy All
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Klik "Generate" untuk membuat Google Search Ads RSA</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== END 6 NEW FEATURE DIALOGS ===== */}

      {/* LP Section Kit Dialog */}
      <Dialog open={lpSectionOpen} onOpenChange={setLpSectionOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🏗️</span>
              LP Section Kit —{' '}
              {lpSectionActive === 'headline' && 'Headline Pack'}
              {lpSectionActive === 'problem' && 'Problems & Agitation'}
              {lpSectionActive === 'social_proof' && 'Social Proof Templates'}
              {lpSectionActive === 'bonus_stack' && 'Bonus Stack Copy'}
              {lpSectionActive === 'cta' && 'CTA Pack'}
              {lpSectionActive === 'faq' && 'FAQ Section'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 flex-wrap mb-3">
            {[
              { key: 'headline', label: '🎯 Headline' },
              { key: 'problem', label: '😣 Problem' },
              { key: 'social_proof', label: '⭐ Proof' },
              { key: 'bonus_stack', label: '🎁 Bonus Stack' },
              { key: 'cta', label: '🔔 CTA' },
              { key: 'faq', label: '❓ FAQ' },
            ].map(sec => (
              <Button
                key={sec.key}
                size="sm"
                variant={lpSectionActive === sec.key ? 'default' : 'outline'}
                onClick={() => handleGenerateLpSection(sec.key)}
                disabled={lpSectionLoading}
                className={lpSectionActive === sec.key ? 'bg-violet-700 text-white text-xs' : 'text-xs'}
                data-testid={`button-lp-tab-${sec.key}`}
              >
                {sec.label}
              </Button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {lpSectionLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menulis section LP yang high-converting...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {lpSectionContent}
              </div>
            )}
          </div>
          {!lpSectionLoading && lpSectionContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(lpSectionContent); toast({ title: 'LP Section tersalin!' }); }} data-testid="button-copy-lp-section">
                <Copy className="h-4 w-4 mr-1.5" /> Salin
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Funnel Blueprint Dialog */}
      <Dialog open={funnelBpOpen} onOpenChange={setFunnelBpOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🗺️</span>
              Sales Funnel Blueprint — Meta Ads → LP → WA → Upsell
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {funnelBpLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menyusun blueprint funnel lengkap...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {funnelBpContent}
              </div>
            )}
          </div>
          {!funnelBpLoading && funnelBpContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={handleGenerateFunnelBlueprint} disabled={funnelBpLoading} data-testid="button-regen-funnel">
                <Sparkles className="h-4 w-4 mr-1.5" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(funnelBpContent); toast({ title: 'Funnel Blueprint tersalin!' }); }} data-testid="button-copy-funnel-bp">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Headline Power Pack Dialog */}
      <Dialog open={headlinePackOpen} onOpenChange={setHeadlinePackOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">⚡</span>
              Headline Power Pack — 40+ Variations
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">Niche / industri spesifik (opsional):</div>
            <input
              className="border rounded px-3 py-1.5 text-sm w-full"
              placeholder="Contoh: bisnis online, kesehatan wanita, investasi saham..."
              value={headlinePackNiche}
              onChange={e => setHeadlinePackNiche(e.target.value)}
              data-testid="input-headline-niche"
            />
            <Button
              size="sm"
              className="w-fit bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleGenerateHeadlinePack}
              disabled={headlinePackLoading}
              data-testid="button-regen-headline"
            >
              {headlinePackLoading ? 'Generating...' : '🔄 Regenerate dengan niche ini'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {headlinePackLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menulis 40+ headline yang powerful...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {headlinePackContent}
              </div>
            )}
          </div>
          {!headlinePackLoading && headlinePackContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(headlinePackContent); toast({ title: 'Headline Pack tersalin!' }); }} data-testid="button-copy-headline-pack">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meta Ads Copy Dialog */}
      <Dialog open={metaAdsOpen} onOpenChange={setMetaAdsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">📣</span>
              Meta Ads Copy Pack — FB/IG
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">Pain point utama audiens (opsional):</div>
            <input
              className="border rounded px-3 py-1.5 text-sm w-full"
              placeholder="Contoh: susah cari kerja, gaji kurang, ingin kerja dari rumah..."
              value={metaAdsPainPoint}
              onChange={e => setMetaAdsPainPoint(e.target.value)}
              data-testid="input-meta-ads-painpoint"
            />
            <Button
              size="sm"
              className="w-fit bg-blue-700 hover:bg-blue-800 text-white"
              onClick={handleGenerateMetaAds}
              disabled={metaAdsLoading}
              data-testid="button-regenerate-meta-ads"
            >
              {metaAdsLoading ? 'Generating...' : '🔄 Regenerate dengan pain point ini'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {metaAdsLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menulis Meta Ads copy yang scroll-stopping...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {metaAdsContent}
              </div>
            )}
          </div>
          {!metaAdsLoading && metaAdsContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(metaAdsContent); toast({ title: 'Meta Ads copy tersalin!' }); }} data-testid="button-copy-meta-ads">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WA Closing Script Dialog */}
      <Dialog open={waClosingOpen} onOpenChange={setWaClosingOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
              WA Closing Script — CS WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">Garansi produk (opsional):</div>
            <input
              className="border rounded px-3 py-1.5 text-sm w-full"
              placeholder="Contoh: garansi uang kembali 7 hari jika tidak puas..."
              value={waClosingGuarantee}
              onChange={e => setWaClosingGuarantee(e.target.value)}
              data-testid="input-wa-guarantee"
            />
            <Button
              size="sm"
              className="w-fit bg-green-700 hover:bg-green-800 text-white"
              onClick={handleGenerateWaClosing}
              disabled={waClosingLoading}
              data-testid="button-regenerate-wa-closing"
            >
              {waClosingLoading ? 'Generating...' : '🔄 Regenerate dengan garansi ini'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {waClosingLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menyusun script closing WhatsApp...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {waClosingContent}
              </div>
            )}
          </div>
          {!waClosingLoading && waClosingContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(waClosingContent); toast({ title: 'WA Closing Script tersalin!' }); }} data-testid="button-copy-wa-closing">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scarcity & Batch Pricing Pack Dialog */}
      <Dialog open={scarcityOpen} onOpenChange={setScarcityOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">⏳</span>
              Scarcity & Batch Pricing Pack
            </DialogTitle>
          </DialogHeader>
          <div className="mb-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Batch saat ini (angka):</div>
                <input
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Contoh: 4"
                  value={scarcityBatch}
                  onChange={e => setScarcityBatch(e.target.value)}
                  data-testid="input-scarcity-batch"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Harga batch berikutnya:</div>
                <input
                  className="border rounded px-3 py-1.5 text-sm w-full"
                  placeholder="Contoh: Rp189.000"
                  value={scarcityNextPrice}
                  onChange={e => setScarcityNextPrice(e.target.value)}
                  data-testid="input-scarcity-next-price"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-fit bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleGenerateScarcity}
              disabled={scarcityLoading}
              data-testid="button-regenerate-scarcity"
            >
              {scarcityLoading ? 'Generating...' : '🔄 Regenerate dengan info ini'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {scarcityLoading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>AI sedang menyusun copy scarcity & batch pricing...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4 leading-relaxed">
                {scarcityContent}
              </div>
            )}
          </div>
          {!scarcityLoading && scarcityContent && (
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(scarcityContent); toast({ title: 'Scarcity Pack tersalin!' }); }} data-testid="button-copy-scarcity">
                <Copy className="h-4 w-4 mr-1.5" /> Salin Semua
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VSL Script Dialog */}
      <Dialog open={vslOpen} onOpenChange={setVslOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-red-600" />
              VSL Script — Video Sales Letter
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              Script video penjualan berstruktur untuk <strong>{projectTitle || projectTopik}</strong>. Cocok untuk TikTok Live, YouTube, Reels, atau webinar.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">🛡️ Garansi:</span>
              <input
                className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="cth: Garansi uang kembali 30 hari tanpa pertanyaan"
                value={vslGuarantee}
                onChange={e => setVslGuarantee(e.target.value)}
                data-testid="input-vsl-guarantee"
              />
              <Button onClick={handleGenerateVsl} disabled={vslLoading} className="shrink-0 bg-red-600 hover:bg-red-700 text-white h-8 text-xs" data-testid="button-vsl-generate">
                {vslLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Menulis...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />{vslContent ? 'Ulang' : 'Generate VSL'}</>}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0 mt-2">
            {vslLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                <p className="text-sm text-muted-foreground">Menulis VSL script Hook → Masalah → Agitasi → Penawaran → CTA...</p>
              </div>
            ) : vslContent ? (
              <div className="space-y-2">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(vslContent); toast({ title: 'VSL Script disalin!' }); }} data-testid="button-vsl-copy">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  {vslContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Klik "Generate VSL" untuk membuat script video sales letter lengkap</p>
                <p className="text-xs mt-1 opacity-60">Struktur: Hook → Masalah → Agitasi → Bukti → Penawaran → Garansi → CTA</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Email Drip Sequence Dialog */}
      <Dialog open={emailSeqOpen} onOpenChange={setEmailSeqOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Drip Sequence — 7 Email
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              7 email nurturing sequence untuk <strong>{projectTitle || projectTopik}</strong>. Dari welcome hingga last chance — siap pakai di Mailchimp, Brevo, ConvertKit.
            </p>
            <Button onClick={handleGenerateEmailSeq} disabled={emailSeqLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm" data-testid="button-email-seq-generate">
              {emailSeqLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menulis 7 email...</> : <><Sparkles className="h-4 w-4 mr-2" />{emailSeqContent ? 'Generate Ulang' : 'Generate Email Sequence'}</>}
            </Button>
          </div>
          <ScrollArea className="flex-1 min-h-0 mt-2">
            {emailSeqLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground">Menulis 7 email sequence (Welcome → Story → Value → Proof → Offer → Objection → Last Chance)...</p>
              </div>
            ) : emailSeqContent ? (
              <div className="space-y-2">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(emailSeqContent); toast({ title: 'Email sequence disalin!' }); }} data-testid="button-email-seq-copy">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  {emailSeqContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Klik "Generate Email Sequence" untuk membuat 7 email nurturing siap kirim</p>
                <p className="text-xs mt-1 opacity-60">Email 1: Welcome · 2: Story · 3: Value · 4: Proof · 5: Offer · 6: Objection · 7: Last Chance</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Content Calendar 30 Hari Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-600" />
              Content Calendar 30 Hari
              <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700">gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              Kalender konten 30 hari untuk <strong>{projectTitle || projectTopik}</strong> — Awareness → Education → Social Proof → Launch.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">📱 Platform:</span>
              <input
                className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="cth: Instagram, TikTok, LinkedIn, Facebook, Twitter"
                value={calendarPlatforms}
                onChange={e => setCalendarPlatforms(e.target.value)}
                data-testid="input-calendar-platforms"
              />
              <Button onClick={handleGenerateCalendar} disabled={calendarLoading} className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs" data-testid="button-calendar-generate">
                {calendarLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Membuat...</> : <><CalendarDays className="h-3.5 w-3.5 mr-1.5" />{calendarContent ? 'Ulang' : 'Generate'}</>}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0 mt-2">
            {calendarLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm text-muted-foreground">Menyusun 30 hari konten (Minggu 1-4 dengan tema dan copy siap pakai)...</p>
              </div>
            ) : calendarContent ? (
              <div className="space-y-2">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(calendarContent); toast({ title: 'Content calendar disalin!' }); }} data-testid="button-calendar-copy">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Salin Semua
                  </Button>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  {calendarContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Klik "Generate" untuk membuat kalender konten 30 hari lengkap</p>
                <p className="text-xs mt-1 opacity-60">Minggu 1: Awareness · 2: Edukasi · 3: Sosial Proof · 4: Launching</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* SOP Prosedur Generator Dialog */}
      <Dialog open={sopOpen} onOpenChange={setSopOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              SOP Prosedur Generator
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">Document Generator · gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              SOP profesional berdasarkan kompetensi dari ebook <strong>{projectTitle || projectTopik}</strong> — langsung bisa digunakan.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">📁 Tipe SOP:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['Prosedur Kerja', 'SOP Layanan Pelanggan', 'SOP Produksi', 'Panduan Onboarding', 'Kebijakan Perusahaan'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSopType(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${sopType === t ? 'bg-slate-700 text-white border-slate-700' : 'border-border hover:bg-muted'}`}
                    data-testid={`button-sop-type-${t.replace(/\s/g, '-').toLowerCase()}`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerateSop} disabled={sopLoading} className="w-full bg-slate-700 hover:bg-slate-800 text-white h-9 text-sm" data-testid="button-sop-generate">
              {sopLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Membuat SOP profesional...</> : <><span className="mr-2">📋</span>{sopContent ? 'Generate Ulang' : `Generate SOP: ${sopType}`}</>}
            </Button>
          </div>
          <ScrollArea className="flex-1 mt-2">
            {sopLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
                <p className="text-sm text-muted-foreground">AI sedang menyusun SOP profesional...</p>
                <p className="text-xs text-muted-foreground opacity-60">Prosedur · KPI · Penanganan Masalah</p>
              </div>
            ) : sopContent ? (
              <div className="space-y-2">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(sopContent); toast({ title: 'SOP disalin!' }); }} data-testid="button-sop-copy">
                    Copy SOP
                  </Button>
                </div>
                <div className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-4 leading-relaxed">
                  {sopContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-5xl mb-4 block opacity-20">📋</span>
                <p className="text-sm">Pilih tipe SOP dan klik Generate</p>
                <p className="text-xs mt-1 opacity-60">Prosedur lengkap · KPI · Penanganan masalah · Riwayat perubahan</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Thought Leader Dialog */}
      <Dialog open={linkedinOpen} onOpenChange={setLinkedinOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">🔵</span>
              LinkedIn Thought Leader Article
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Sosmed · gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              Artikel LinkedIn yang membangun personal brand dari kompetensi ebook <strong>{projectTitle || projectTopik}</strong>.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">🎯 Sudut Artikel:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['Insight Profesional', 'Kisah Sukses Klien', 'Kontroversi & Pendapat', 'Tutorial Praktis', 'Tren Industri'].map(a => (
                  <button
                    key={a}
                    onClick={() => setLinkedinAngle(a)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${linkedinAngle === a ? 'bg-blue-700 text-white border-blue-700' : 'border-border hover:bg-muted'}`}
                    data-testid={`button-linkedin-angle-${a.replace(/\s/g, '-').toLowerCase()}`}
                  >{a}</button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerateLinkedin} disabled={linkedinLoading} className="w-full bg-blue-700 hover:bg-blue-800 text-white h-9 text-sm" data-testid="button-linkedin-generate">
              {linkedinLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menulis artikel LinkedIn...</> : <><span className="mr-2">🔵</span>{linkedinContent ? 'Generate Ulang' : 'Generate LinkedIn Article'}</>}
            </Button>
          </div>
          <ScrollArea className="flex-1 mt-2">
            {linkedinLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">AI sedang menulis artikel LinkedIn...</p>
                <p className="text-xs text-muted-foreground opacity-60">Hook · Isi · CTA · Hashtag Pack · Versi Pendek</p>
              </div>
            ) : linkedinContent ? (
              <div className="space-y-2">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(linkedinContent); toast({ title: 'LinkedIn Article disalin!' }); }} data-testid="button-linkedin-copy">
                    Copy Artikel
                  </Button>
                </div>
                <div className="text-xs whitespace-pre-wrap bg-muted/40 rounded-lg p-4 leading-relaxed">
                  {linkedinContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-5xl mb-4 block opacity-20">🔵</span>
                <p className="text-sm">Pilih sudut artikel dan klik Generate</p>
                <p className="text-xs mt-1 opacity-60">Hook pembuka · Isi 700-900 kata · Hashtag pack · Versi pendek</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Membership Site Brief Dialog */}
      <Dialog open={membershipOpen} onOpenChange={setMembershipOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Membership Site Brief
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Funnel · gpt-4o</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              Rancangan lengkap membership site dari ekosistem kompetensi ebook <strong>{projectTitle || projectTopik}</strong>.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">🏛️ Model:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['Komunitas + Konten Eksklusif', 'Subscription Learning', 'Mastermind Group', 'SaaS + Coaching', 'Inner Circle Premium'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMembershipModel(m)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${membershipModel === m ? 'bg-amber-600 text-white border-amber-600' : 'border-border hover:bg-muted'}`}
                    data-testid={`button-membership-model-${m.replace(/\s/g, '-').toLowerCase()}`}
                  >{m}</button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerateMembership} disabled={membershipLoading} className="w-full bg-amber-600 hover:bg-amber-700 text-white h-9 text-sm" data-testid="button-membership-generate">
              {membershipLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Merancang membership...</> : <><span className="mr-2">🏆</span>{membershipContent ? 'Generate Ulang' : 'Generate Membership Brief'}</>}
            </Button>
          </div>
          <ScrollArea className="flex-1 mt-2">
            {membershipLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">AI sedang merancang membership site...</p>
                <p className="text-xs text-muted-foreground opacity-60">Welcome Copy · Pricing · Benefits · FAQ · Promo Copy</p>
              </div>
            ) : membershipContent ? (
              <div className="space-y-2">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(membershipContent); toast({ title: 'Membership Brief disalin!' }); }} data-testid="button-membership-copy">
                    Copy Brief
                  </Button>
                </div>
                <div className="text-xs whitespace-pre-wrap bg-muted/40 rounded-lg p-4 leading-relaxed">
                  {membershipContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-5xl mb-4 block opacity-20">🏆</span>
                <p className="text-sm">Pilih model membership dan klik Generate</p>
                <p className="text-xs mt-1 opacity-60">Welcome page · Pricing tiers · Benefits tabel · FAQ · Copy promosi</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Plan Limit Dialog */}
      <Dialog open={planLimitOpen} onOpenChange={setPlanLimitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Limit Harian Tercapai</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              {planLimitInfo
                ? `Kamu sudah menggunakan ${planLimitInfo.used} dari ${planLimitInfo.limit} prompt gratis hari ini.`
                : 'Prompt harian gratis kamu sudah habis.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
              <p className="font-semibold text-sm text-primary">🚀 Upgrade ke Pro — Rp 99K/bulan</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✅ Unlimited prompt setiap hari</li>
                <li>✅ Semua 16 mode generasi AI</li>
                <li>✅ Pipeline 9-Langkah Ekosistem penuh</li>
                <li>✅ Export PDF, DOCX, HTML, MD</li>
                <li>✅ 24 tema industri Indonesia</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/account"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold px-4 py-2.5 hover:opacity-90 transition-opacity"
                onClick={() => setPlanLimitOpen(false)}
                data-testid="button-upgrade-cta"
              >
                <span>👑</span> Upgrade Sekarang
              </a>
              <button
                onClick={() => setPlanLimitOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
              >
                Besok akan ada 5 prompt gratis lagi
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
