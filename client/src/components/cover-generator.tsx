import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, ImageIcon, Download, RefreshCw, Sparkles, Palette, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ProjectData } from '@shared/schema';
import { INDUSTRIES } from '@shared/schema';

const COVER_STYLES = [
  { id: 'modern', label: 'Modern', desc: 'Bold & dinamis' },
  { id: 'minimalis', label: 'Minimalis', desc: 'Bersih & elegan' },
  { id: 'profesional', label: 'Profesional', desc: 'Korporat & formal' },
  { id: 'creative', label: 'Creative', desc: 'Artistik & unik' },
  { id: 'academic', label: 'Akademis', desc: 'Formal & terstruktur' },
];

const COLOR_SCHEMES = [
  { id: 'biru', label: 'Biru', class: 'bg-blue-500' },
  { id: 'hijau', label: 'Hijau', class: 'bg-emerald-500' },
  { id: 'merah', label: 'Merah', class: 'bg-red-600' },
  { id: 'gelap', label: 'Dark Gold', class: 'bg-slate-800' },
  { id: 'ungu', label: 'Ungu', class: 'bg-violet-500' },
  { id: 'oranye', label: 'Oranye', class: 'bg-orange-500' },
];

interface CoverGeneratorProps {
  projectData: ProjectData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoverGenerator({ projectData, open, onOpenChange }: CoverGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedColor, setSelectedColor] = useState('biru');
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();

  const industry = INDUSTRIES.find(i => i.id === projectData.industry);
  const displayTitle = customTitle || projectData.judul || projectData.topik || 'Judul Ebook Anda';
  const displayAuthor = customAuthor || 'Penulis';

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    setCoverImageUrl('');

    try {
      const response = await apiRequest('POST', '/api/generate-cover', {
        title: displayTitle,
        topik: projectData.topik,
        industry: industry?.name || 'general',
        style: selectedStyle,
        colorScheme: selectedColor,
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setCoverImageUrl(data.imageUrl);
        toast({ title: 'Cover berhasil dibuat!', description: 'Anda bisa download atau generate ulang.' });
      }
    } catch (err: any) {
      setError('Gagal membuat cover. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  }, [displayTitle, projectData.topik, industry, selectedStyle, selectedColor, toast]);

  const handleDownload = useCallback(async () => {
    if (!coverImageUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 1200);

      const colorGradients: Record<string, [string, string]> = {
        biru: ['rgba(30,58,138,0.75)', 'rgba(30,58,138,0.0)'],
        hijau: ['rgba(5,46,22,0.75)', 'rgba(5,46,22,0.0)'],
        merah: ['rgba(127,29,29,0.75)', 'rgba(127,29,29,0.0)'],
        gelap: ['rgba(15,23,42,0.85)', 'rgba(15,23,42,0.0)'],
        ungu: ['rgba(60,7,83,0.75)', 'rgba(60,7,83,0.0)'],
        oranye: ['rgba(124,45,18,0.75)', 'rgba(124,45,18,0.0)'],
      };
      const [topColor, bottomColor] = colorGradients[selectedColor] || colorGradients.biru;
      const grad = ctx.createLinearGradient(0, 0, 0, 500);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 500);

      const grad2 = ctx.createLinearGradient(0, 700, 0, 1200);
      grad2.addColorStop(0, bottomColor);
      grad2.addColorStop(1, topColor);
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 700, 800, 500);

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 56px Georgia, serif';
      ctx.textAlign = 'center';
      const titleLines = wrapText(ctx, displayTitle, 700, 'bold 56px Georgia, serif');
      const lineH = 68;
      const startY = 100;
      titleLines.forEach((line, i) => {
        ctx.fillText(line, 400, startY + i * lineH);
      });

      if (industry && industry.id !== 'general') {
        ctx.font = '28px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(industry.name, 400, startY + titleLines.length * lineH + 30);
      }

      ctx.font = 'italic 24px Georgia, serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`oleh ${displayAuthor}`, 400, 1150);

      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Generated by Ebook Builder Pro', 400, 1185);

      const link = document.createElement('a');
      link.download = `cover-${(displayTitle).replace(/\s+/g, '-').toLowerCase().slice(0, 30)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({ title: 'Cover berhasil didownload!' });
    };
    img.onerror = () => {
      toast({ title: 'Gagal download cover', description: 'Klik kanan gambar untuk simpan manual.', variant: 'destructive' });
    };
    img.src = coverImageUrl;
  }, [coverImageUrl, displayTitle, displayAuthor, industry, selectedColor, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-violet-600 to-pink-500 text-white">
              <ImageIcon className="h-4 w-4" />
            </div>
            AI Cover Generator
            <Badge variant="secondary" className="ml-1 text-xs">DALL-E 3</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-64 border-r p-4 flex-shrink-0 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Judul Cover</Label>
              <Input
                placeholder={projectData.judul || projectData.topik || 'Judul ebook...'}
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="text-sm h-8"
                data-testid="input-cover-title"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Nama Penulis</Label>
              <Input
                placeholder="Nama penulis..."
                value={customAuthor}
                onChange={e => setCustomAuthor(e.target.value)}
                className="text-sm h-8"
                data-testid="input-cover-author"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Palette className="h-3 w-3" />
                Gaya Cover
              </Label>
              <div className="space-y-1.5">
                {COVER_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    data-testid={`button-cover-style-${s.id}`}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md border text-xs transition-all",
                      selectedStyle === s.id
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground ml-1">· {s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Warna Dominan</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {COLOR_SCHEMES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    data-testid={`button-cover-color-${c.id}`}
                    title={c.label}
                    className={cn(
                      "h-8 rounded-md border-2 transition-all",
                      c.class,
                      selectedColor === c.id ? "border-foreground scale-110 shadow-md" : "border-transparent opacity-70"
                    )}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {COLOR_SCHEMES.find(c => c.id === selectedColor)?.label}
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white"
              data-testid="button-generate-cover"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {coverImageUrl ? 'Generate Ulang' : 'Generate Cover'}
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6 flex items-start justify-center min-h-full">
                {error ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-center p-8 mt-12">
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <p className="text-sm text-destructive font-medium">{error}</p>
                    <Button onClick={handleGenerate} variant="outline" size="sm" disabled={isGenerating}>
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Coba Lagi
                    </Button>
                  </div>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 mt-12">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 opacity-20 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">AI sedang membuat cover...</p>
                      <p className="text-sm text-muted-foreground mt-1">Ini mungkin membutuhkan 15-30 detik</p>
                    </div>
                  </div>
                ) : coverImageUrl ? (
                  <div className="space-y-4 w-full max-w-xs">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl">
                      <img
                        src={coverImageUrl}
                        alt="Generated ebook cover"
                        className="w-full object-cover"
                        data-testid="img-generated-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 flex flex-col justify-between p-5">
                        <div>
                          <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                            {displayTitle}
                          </p>
                          {industry && industry.id !== 'general' && (
                            <p className="text-white/80 text-sm mt-1">{industry.name}</p>
                          )}
                        </div>
                        <p className="text-white/70 text-sm italic">oleh {displayAuthor}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="w-full"
                      data-testid="button-download-cover"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Cover (PNG)
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 mt-12">
                    <div className="h-40 w-28 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 bg-muted/30">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">Cover akan</p>
                      <p className="text-xs text-muted-foreground">tampil di sini</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Pilih gaya & warna</p>
                      <p className="text-xs text-muted-foreground">lalu klik Generate Cover</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}
