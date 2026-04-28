import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X, FileText, Image as ImageIcon, Film, Music, Table, Youtube, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { UploadedFile } from '@shared/schema';

interface FileUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const EXTRACTABLE_TYPES = ['.pdf', '.docx', '.txt', '.md'];

function getFileExt(name: string) {
  return '.' + (name.split('.').pop()?.toLowerCase() ?? '');
}

function isExtractable(name: string) {
  return EXTRACTABLE_TYPES.includes(getFileExt(name));
}

function getYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function FileUpload({ uploadedFiles, onFilesChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const extractDocumentContent = async (file: File): Promise<string | undefined> => {
    if (!isExtractable(file.name)) return undefined;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/extract-ebook', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mengekstrak');
    return data.text as string;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';

    let currentFiles = [...uploadedFiles];

    for (const file of files) {
      const baseEntry: UploadedFile = {
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      };

      if (isExtractable(file.name)) {
        const idx = currentFiles.length;
        currentFiles = [...currentFiles, { ...baseEntry }];
        onFilesChange(currentFiles);
        setLoadingIndex(idx);
        try {
          const content = await extractDocumentContent(file);
          const wordCount = content?.split(/\s+/).filter(Boolean).length ?? 0;
          currentFiles = currentFiles.map((f, i) => i === idx ? { ...f, content } : f);
          onFilesChange(currentFiles);
          toast({ title: '✅ Teks berhasil diekstrak', description: `${wordCount.toLocaleString()} kata dari ${file.name}` });
        } catch (err: any) {
          toast({ title: 'Gagal mengekstrak', description: err.message, variant: 'destructive' });
        } finally {
          setLoadingIndex(null);
        }
      } else {
        currentFiles = [...currentFiles, baseEntry];
        onFilesChange(currentFiles);
      }
    }
  };

  const handleYoutubeExtract = async () => {
    const trimmed = youtubeUrl.trim();
    if (!trimmed) return;
    const videoId = getYoutubeVideoId(trimmed);
    if (!videoId) {
      toast({ title: 'URL tidak valid', description: 'Masukkan URL YouTube yang benar', variant: 'destructive' });
      return;
    }
    setLoadingYoutube(true);
    try {
      const res = await fetch('/api/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil transkrip');
      const entry: UploadedFile = {
        name: data.videoTitle || `YouTube ${videoId}`,
        type: 'video/youtube',
        size: `${data.wordCount?.toLocaleString() ?? 0} kata`,
        content: data.text,
        youtubeUrl: trimmed,
      };
      onFilesChange([...uploadedFiles, entry]);
      setYoutubeUrl('');
      toast({ title: '✅ Transkrip berhasil diambil', description: `${data.wordCount?.toLocaleString()} kata dari video YouTube` });
    } catch (err: any) {
      toast({ title: 'Gagal mengambil transkrip', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingYoutube(false);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(uploadedFiles.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.youtubeUrl || file.type === 'video/youtube') return <Youtube className="h-3.5 w-3.5 text-red-500" />;
    if (file.type.includes('image')) return <ImageIcon className="h-3.5 w-3.5 text-purple-500" />;
    if (file.type.includes('video')) return <Film className="h-3.5 w-3.5 text-red-500" />;
    if (file.type.includes('audio')) return <Music className="h-3.5 w-3.5 text-pink-500" />;
    if (file.type.includes('sheet') || file.type.includes('csv')) return <Table className="h-3.5 w-3.5 text-green-500" />;
    return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <UploadCloud className="h-4 w-4 text-primary" />
          File & Konten Referensi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-md p-5 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.mp3,.mp4,.wav"
            className="hidden"
            data-testid="input-file-upload"
          />
          <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Klik atau drag untuk upload file</p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF · DOCX · TXT · Excel · Gambar · Audio · Video
          </p>
          <p className="text-[10px] text-primary mt-1 font-medium">
            ✨ PDF/DOCX/TXT akan otomatis diekstrak teksnya
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Youtube className="h-3.5 w-3.5 text-red-500" />
            URL YouTube (ekstrak transkrip otomatis)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleYoutubeExtract()}
              className="text-xs h-8"
              data-testid="input-youtube-url"
            />
            <Button
              size="sm"
              className="h-8 shrink-0"
              onClick={handleYoutubeExtract}
              disabled={loadingYoutube || !youtubeUrl.trim()}
              data-testid="button-extract-youtube"
            >
              {loadingYoutube ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ambil'}
            </Button>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">File Terlampir ({uploadedFiles.length}):</p>
            <div className="space-y-1.5">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="rounded-md border border-border bg-muted/30 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2">
                    {loadingIndex === index ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                    ) : file.content ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      getFileIcon(file)
                    )}
                    <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{file.size}</span>
                    {file.content && (
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
                        data-testid={`button-toggle-content-${index}`}
                      >
                        {expandedIndex === index ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 hover:text-destructive shrink-0"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {file.content && expandedIndex === index && (
                    <div className="border-t border-border px-3 py-2 bg-background">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1">
                        Preview konten ({file.content.split(/\s+/).filter(Boolean).length.toLocaleString()} kata):
                      </p>
                      <p className="text-[10px] text-foreground leading-relaxed line-clamp-4">
                        {file.content.slice(0, 400)}...
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ PDF/DOCX/TXT/YouTube</span> — teks akan diekstrak dan disertakan langsung dalam prompt AI.
          </p>
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold">Gambar/Audio/Video</span> — upload bersama prompt ke AI (ChatGPT/Claude) untuk dianalisis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
