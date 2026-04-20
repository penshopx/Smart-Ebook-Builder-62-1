import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Upload, FileText, Type, CheckCircle2, X, Loader2, BookOpen,
  ArrowRight, FileUp, ClipboardPaste, Info, RotateCcw
} from 'lucide-react';

interface ExternalEbookImportProps {
  externalContent: string;
  externalFileName: string;
  onContentLoaded: (content: string, fileName: string, meta: { judul?: string; topik?: string }) => void;
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
  onClear,
}: ExternalEbookImportProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const wordCount = externalContent ? externalContent.split(/\s+/).filter(Boolean).length : 0;

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
      const res = await fetch('/api/extract-ebook', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengekstrak');
      const meta = extractMeta(data.text);
      onContentLoaded(data.text, data.fileName, meta);
      toast({ title: '✅ Ebook berhasil diimpor', description: `${data.wordCount?.toLocaleString()} kata diekstrak dari ${data.fileName}` });
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
    toast({ title: '✅ Konten ebook dimuat', description: `${text.split(/\s+/).filter(Boolean).length.toLocaleString()} kata siap digunakan` });
  };

  if (externalContent) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm text-emerald-800 dark:text-emerald-300">Ebook Eksternal Aktif</CardTitle>
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

          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5">
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">Fitur yang tersedia:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {TRANSFER_MODES.map(m => (
                    <span key={m.label} className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                      {m.icon} {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-emerald-600" />
            Pilih mode Transfer Kompetensi atau Marketing di atas untuk mulai mengolah ebook ini.
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
            <CardTitle className="text-sm">Import Ebook dari Luar</CardTitle>
            <CardDescription className="text-xs mt-0.5">Upload PDF/DOCX/TXT atau paste konten ebook Anda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
          <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 mb-1">Gunakan untuk fitur:</p>
          <div className="flex flex-wrap gap-1">
            {TRANSFER_MODES.map(m => (
              <span key={m.label} className="text-[9px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
                {m.icon} {m.label}
              </span>
            ))}
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
              placeholder="Paste konten ebook Anda di sini... (minimal 100 karakter)"
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
                  Muat Konten
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
