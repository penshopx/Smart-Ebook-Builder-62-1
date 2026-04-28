import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Upload, FileText, Type, CheckCircle2, X, Loader2, BookOpen,
  ArrowRight, FileUp, ClipboardPaste, Info, RotateCcw, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

interface ExtractedFields {
  topik: string;
  judul: string;
  target: string;
  tujuan: string;
  painPoint: string;
  bigIdea: string;
  hasilRiset: string;
  produk: string;
}

interface ExternalEbookImportProps {
  externalContent: string;
  externalFileName: string;
  onContentLoaded: (content: string, fileName: string, meta: { judul?: string; topik?: string }) => void;
  onFieldsExtracted?: (fields: Partial<ExtractedFields>) => void;
  onClear: () => void;
}

const TRANSFER_MODES = [
  { icon: '🎓', label: 'E-Course Builder' },
  { icon: '📄', label: 'Document Generator' },
  { icon: '🤖', label: 'GPT Builder' },
  { icon: '📣', label: 'Marketing Kit' },
  { icon: '🎙️', label: 'Podcast Script' },
  { icon: '🎧', label: 'Audiobook Script' },
  { icon: '🚀', label: 'Landing Page' },
  { icon: '📦', label: 'Prompt Pack' },
  { icon: '📱', label: 'Mini App Blueprint' },
  { icon: '📝', label: 'Quiz Maker' },
];

const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  topik: 'Topik / Kata Kunci',
  judul: 'Judul Ebook',
  target: 'Target Pembaca',
  tujuan: 'Tujuan',
  painPoint: 'Pain Point / Masalah',
  bigIdea: 'Big Idea / Konsep',
  hasilRiset: 'Hasil Riset / Data',
  produk: 'Produk / Layanan',
};

function extractMeta(text: string): { judul?: string; topik?: string } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const judul = lines[0]?.slice(0, 120);
  const topikLine = lines.slice(0, 10).find(l => l.length > 20 && l.length < 200);
  return {
    judul: judul || undefined,
    topik: topikLine && topikLine !== judul ? topikLine.slice(0, 80) : judul?.slice(0, 80),
  };
}

export function ExternalEbookImport({
  externalContent,
  externalFileName,
  onContentLoaded,
  onFieldsExtracted,
  onClear,
}: ExternalEbookImportProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFields, setAnalyzedFields] = useState<Partial<ExtractedFields> | null>(null);
  const [showFieldPreview, setShowFieldPreview] = useState(true);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const wordCount = externalContent ? externalContent.split(/\s+/).filter(Boolean).length : 0;

  const analyzeFields = async (text: string, fileName: string) => {
    if (!onFieldsExtracted) return;
    setIsAnalyzing(true);
    setAnalyzedFields(null);
    setApplied(false);
    try {
      const res = await fetch('/api/analyze-document-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menganalisis');
      const fields: Partial<ExtractedFields> = data.fields;
      const hasAny = Object.values(fields).some(v => v && v.trim().length > 0);
      setAnalyzedFields(hasAny ? fields : {});
      setShowFieldPreview(true);
    } catch (err: any) {
      toast({ title: 'Analisis gagal', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFields = () => {
    if (!analyzedFields || !onFieldsExtracted) return;
    onFieldsExtracted(analyzedFields);
    setApplied(true);
    toast({ title: '✅ Field form berhasil diisi', description: 'Data proyek diperbarui dari isi dokumen' });
  };

  const uploadFile = useCallback(async (file: File) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast({ title: 'Format tidak didukung', description: 'Gunakan PDF, DOCX, atau TXT', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/extract-ebook', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengekstrak');
      const meta = extractMeta(data.text);
      onContentLoaded(data.text, data.fileName, meta);
      toast({ title: '✅ Dokumen berhasil diimpor', description: `${data.wordCount?.toLocaleString()} kata diekstrak — sedang menganalisis field...` });
      analyzeFields(data.text, data.fileName);
    } catch (err: any) {
      toast({ title: 'Gagal mengekstrak', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  }, [onContentLoaded, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handlePasteSubmit = () => {
    const text = pasteText.trim();
    if (text.length < 100) {
      toast({ title: 'Teks terlalu pendek', description: 'Minimal 100 karakter', variant: 'destructive' });
      return;
    }
    const meta = extractMeta(text);
    onContentLoaded(text, 'Paste Teks Manual', meta);
    setPasteText('');
    toast({ title: '✅ Konten dimuat', description: `${text.split(/\s+/).filter(Boolean).length.toLocaleString()} kata — sedang menganalisis field...` });
    analyzeFields(text, 'Paste Teks Manual');
  };

  if (externalContent) {
    const filledFields = analyzedFields
      ? (Object.entries(analyzedFields) as [keyof ExtractedFields, string][]).filter(([, v]) => v && v.trim().length > 0)
      : [];

    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm text-emerald-800 dark:text-emerald-300">Dokumen Aktif</CardTitle>
                <CardDescription className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-400">
                  {externalFileName}
                </CardDescription>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={onClear} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" data-testid="button-clear-external-ebook">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0">
              <FileText className="h-3 w-3" />
              {wordCount.toLocaleString()} kata
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0">
              <BookOpen className="h-3 w-3" />
              ~{Math.ceil(wordCount / 250)} menit baca
            </Badge>
          </div>

          <div className="rounded-md border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-background p-2.5">
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">Preview konten:</p>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              {externalContent.slice(0, 300)}...
            </p>
          </div>

          {isAnalyzing && (
            <div className="flex items-center gap-2 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3 py-2.5">
              <Loader2 className="h-4 w-4 text-violet-600 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Menganalisis dokumen...</p>
                <p className="text-[10px] text-violet-600 dark:text-violet-400">AI sedang membaca dan mengekstrak informasi ke field form</p>
              </div>
            </div>
          )}

          {!isAnalyzing && analyzedFields !== null && (
            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 overflow-hidden">
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                onClick={() => setShowFieldPreview(v => !v)}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {filledFields.length > 0
                      ? `${filledFields.length} field berhasil diekstrak dari dokumen`
                      : 'Tidak ada field yang dapat diekstrak'}
                  </p>
                </div>
                {filledFields.length > 0 && (
                  showFieldPreview ? <ChevronUp className="h-3.5 w-3.5 text-blue-500" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
                )}
              </div>

              {showFieldPreview && filledFields.length > 0 && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-blue-200 dark:border-blue-800 pt-2">
                  {filledFields.map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 w-28 mt-0.5">
                        {FIELD_LABELS[key]}:
                      </span>
                      <span className="text-[10px] text-foreground leading-relaxed line-clamp-2">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {filledFields.length > 0 && (
                <div className="px-3 pb-3">
                  {applied ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Field form sudah diterapkan!</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white mt-1"
                      onClick={applyFields}
                      data-testid="button-apply-fields"
                    >
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      Terapkan ke Form Proyek
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {!isAnalyzing && analyzedFields === null && onFieldsExtracted && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => analyzeFields(externalContent, externalFileName)}
              data-testid="button-reanalyze"
            >
              <Sparkles className="h-3 w-3 mr-1.5 text-violet-600" />
              Analisis Ulang → Isi Form Otomatis
            </Button>
          )}

          <div className="rounded-md bg-muted/50 border border-border p-2.5">
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Mode Transfer Kompetensi:</p>
                <div className="flex flex-wrap gap-1">
                  {TRANSFER_MODES.map(m => (
                    <span key={m.label} className="text-[9px] px-1.5 py-0.5 bg-background border border-border text-muted-foreground rounded-full">
                      {m.icon} {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-emerald-600" />
            Pilih mode Transfer Kompetensi atau Marketing di atas untuk mulai mengolah dokumen ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
            <Upload className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm">Import Dokumen dari Luar</CardTitle>
            <CardDescription className="text-xs mt-0.5">Upload PDF/DOCX/TXT — AI akan otomatis mengisi form dari isinya</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
          <div className="flex items-start gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Auto-Fill Form:</span> Setelah upload, AI akan membaca dokumen dan otomatis mengisi Topik, Judul, Target Pembaca, Pain Point, Big Idea, dll.
            </p>
          </div>
        </div>

        <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
          <button
            onClick={() => setMode('upload')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all', mode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            data-testid="tab-upload-file"
          >
            <FileUp className="h-3.5 w-3.5" />
            Upload File
          </button>
          <button
            onClick={() => setMode('paste')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all', mode === 'paste' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            data-testid="tab-paste-text"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Paste Teks
          </button>
        </div>

        {mode === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
              isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-border hover:border-violet-400 hover:bg-muted/30',
              isUploading && 'pointer-events-none opacity-60'
            )}
            data-testid="dropzone-ebook-upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-ebook-file"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                <p className="text-sm font-medium">Mengekstrak teks dari file...</p>
                <p className="text-xs text-muted-foreground">Proses ini mungkin memakan beberapa detik</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <FileUp className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Drag & drop atau klik untuk upload</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF · DOCX · TXT · Maks 20MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'paste' && (
          <div className="space-y-2">
            <Textarea
              placeholder="Paste konten dokumen Anda di sini... (minimal 100 karakter)"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              className="text-xs resize-none"
              data-testid="textarea-paste-ebook"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pasteText.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} kata
              </span>
              <div className="flex gap-2">
                {pasteText && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPasteText('')} data-testid="button-clear-paste">
                    <RotateCcw className="h-3 w-3 mr-1" /> Bersihkan
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handlePasteSubmit}
                  disabled={pasteText.trim().length < 100}
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                  data-testid="button-load-paste"
                >
                  <Type className="h-3 w-3 mr-1" />
                  Muat & Analisis
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
