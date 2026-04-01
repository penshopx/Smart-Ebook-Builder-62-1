import { useState, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Maximize2, Minimize2, Sparkles, Rocket, Bot, Star, Zap, MessageCircle, Brain, Globe, Search, FileText, Download, Loader2, AlertCircle, FileDown, ImagePlus, X, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { AI_MODEL_RECOMMENDATIONS } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const aiIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot, MessageCircle, Brain, Sparkles, Search, Globe,
};

function addFooter(doc: jsPDF, pageW: number, pageH: number, margin: number) {
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.text('Ebook Builder Pro', margin, pageH - 9);
  doc.text(`Halaman ${pageNum}`, pageW - margin, pageH - 9, { align: 'right' });
}

interface PromptOutputProps {
  prompt: string;
  onRegenerate?: () => void;
  selectedAiModel?: string;
  onAiModelChange?: (modelId: string) => void;
  projectTitle?: string;
  projectTopik?: string;
}

export function PromptOutput({ prompt, onRegenerate, selectedAiModel = 'dokumentender', onAiModelChange, projectTitle, projectTopik }: PromptOutputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docError, setDocError] = useState('');
  const [isDocCopied, setIsDocCopied] = useState(false);
  const [imageInserts, setImageInserts] = useState<Record<number, string>>({});
  const [imgPickerOpen, setImgPickerOpen] = useState(false);
  const [imgPickerIdx, setImgPickerIdx] = useState(-1);
  const [imgPickerLoading, setImgPickerLoading] = useState(false);
  const [pickerImages, setPickerImages] = useState<string[]>([]);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [imgPickerType, setImgPickerType] = useState<'illustration' | 'infographic'>('illustration');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const selectedModel = AI_MODEL_RECOMMENDATIONS.find(m => m.id === selectedAiModel) || AI_MODEL_RECOMMENDATIONS[0];

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
    doc.text('Generated by Ebook Builder Pro', margin, 43);

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

  const handleGenerateDocument = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt kosong",
        description: "Isi form terlebih dahulu sebelum generate dokumen.",
        variant: "destructive",
      });
      return;
    }

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
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
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
  }, [prompt, toast]);

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
        children: [new TextRun({ text: 'Generated by Ebook Builder Pro', color: '888888', size: 18, italics: true })],
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
                      onClick={() => { setIsPresentationMode(false); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                        !isPresentationMode ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                      data-testid="button-mode-dokumen"
                    >
                      <FileText className="h-3 w-3" />
                      Dokumen
                    </button>
                    <button
                      onClick={() => { setIsPresentationMode(true); setSlideIndex(0); }}
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
                        <span className="text-indigo-400/60 text-xs">{projectTitle || 'Ebook Builder Pro'}</span>
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
                <div className="p-4 space-y-1" data-testid="text-document-output">
                  {docContent.split(/\n/).map((line, idx) => {
                    const hasImage = imageInserts[idx] !== undefined;
                    const isHeader = line.trim().length > 0 && line.trim().length < 80 && (
                      /^(BAB|BAGIAN|PENDAHULUAN|KESIMPULAN|PENUTUP|DAFTAR|[IVX]+\.|[0-9]+\.)/i.test(line.trim()) ||
                      line.trim() === line.trim().toUpperCase()
                    );
                    return (
                      <div key={idx} className="group/line">
                        {hasImage && (
                          <div className="relative my-3">
                            <img
                              src={imageInserts[idx]}
                              alt={`Ilustrasi paragraf ${idx + 1}`}
                              className="w-full max-w-md mx-auto rounded-lg shadow-md object-cover"
                              data-testid={`img-doc-insert-${idx}`}
                            />
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                              title="Hapus gambar"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {line.trim() === '' ? (
                          <div className="h-2" />
                        ) : (
                          <p className={cn(
                            "text-sm leading-relaxed",
                            isHeader ? "font-bold text-primary mt-4 mb-1 text-base" : "text-foreground"
                          )}>
                            {line}
                          </p>
                        )}
                        {!isGenerating && line.trim() !== '' && (
                          <div className="flex items-center gap-1 my-1 opacity-0 group-hover/line:opacity-100 transition-opacity">
                            <div className="flex-1 h-px bg-border/50" />
                            <button
                              onClick={() => handleOpenImagePicker(idx, line, 'illustration')}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-dashed border-border hover:border-primary transition-all"
                              data-testid={`button-add-image-${idx}`}
                            >
                              <ImagePlus className="h-2.5 w-2.5" />
                              Ilustrasi AI
                            </button>
                            <button
                              onClick={() => handleOpenImagePicker(idx, line, 'infographic')}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground hover:text-teal-600 hover:bg-teal-50 border border-dashed border-border hover:border-teal-400 transition-all"
                              data-testid={`button-add-infographic-${idx}`}
                            >
                              <Monitor className="h-2.5 w-2.5" />
                              Infografik AI
                            </button>
                            <div className="flex-1 h-px bg-border/50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-emerald-600 ml-0.5 animate-pulse rounded-sm" />
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {!isGenerating && docContent && !isPresentationMode && (
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
                  onClick={handleGenerateDocument}
                  variant="outline"
                  className="shrink-0"
                  data-testid="button-regenerate-document"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ulang
                </Button>
              </div>
            </div>
          )}
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
    </>
  );
}
