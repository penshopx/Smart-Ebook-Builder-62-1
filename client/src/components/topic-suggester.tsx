import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lightbulb, Loader2, Sparkles, ChevronRight, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TopicSuggesterProps {
  onSelectTopic?: (topic: string) => void;
  currentNiche?: string;
}

export function TopicSuggester({ onSelectTopic, currentNiche }: TopicSuggesterProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parsedIdeas = content
    ? content.split(/(?=🔥 IDE #\d+:)/g).filter(s => s.trim() && s.includes('IDE #'))
    : [];

  const extractTitle = (idea: string) => {
    const match = idea.match(/🔥 IDE #\d+:\s*(.+?)(?:\n|$)/);
    return match ? match[1].trim() : '';
  };

  const handleGenerate = async (niche?: string) => {
    setContent('');
    setLoading(true);
    try {
      const response = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche || currentNiche || 'bisnis digital' }),
      });
      if (!response.ok) throw new Error('Gagal menghubungi server');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Tidak ada response');
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
            if (data.done) { setLoading(false); return; }
            if (data.content) setContent(prev => prev + data.content);
          } catch { /* ignore */ }
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
      toast({ title: 'Gagal generate ide topik', variant: 'destructive' });
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!content) handleGenerate();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/20"
        data-testid="button-topic-suggester"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Butuh Ide Topik?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              AI Idea Generator — 10 Topik Ebook "Luka Berdarah"
              <Badge variant="secondary" className="text-xs">Mulaforge Style</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {['Bisnis Digital', 'Kesehatan', 'Parenting', 'Karir & Kerja', 'Investasi', 'Produktivitas', 'Hubungan'].map(niche => (
              <button
                key={niche}
                onClick={() => handleGenerate(niche)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full text-xs border border-border hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 transition-all disabled:opacity-50"
              >
                {niche}
              </button>
            ))}
            <button
              onClick={() => handleGenerate(currentNiche || 'bisnis digital')}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" /> Generate Ulang
            </button>
          </div>

          {loading && parsedIdeas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="text-sm text-muted-foreground">AI sedang mencari ide topik yang laku...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {parsedIdeas.length > 0 ? parsedIdeas.map((idea, i) => {
                  const title = extractTitle(idea);
                  const lines = idea.split('\n').filter(l => l.trim() && !l.includes('IDE #'));
                  return (
                    <div
                      key={i}
                      className="border rounded-xl p-4 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group cursor-pointer"
                      onClick={() => {
                        if (title && onSelectTopic) {
                          onSelectTopic(title);
                          setOpen(false);
                          toast({ title: 'Topik dipilih!', description: title.slice(0, 60) });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug text-foreground group-hover:text-amber-800 dark:group-hover:text-amber-300">
                            🔥 {title}
                          </p>
                          <div className="mt-2 space-y-1">
                            {lines.map((line, j) => (
                              <p key={j} className="text-xs text-muted-foreground leading-snug">{line.trim()}</p>
                            ))}
                          </div>
                        </div>
                        {onSelectTopic && (
                          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium">
                              <Target className="h-3 w-3" />
                              Pilih
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : content ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed p-2">
                    {content}
                    {loading && <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1" />}
                  </div>
                ) : null}
                {loading && parsedIdeas.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                    Menggenerate lebih banyak ide...
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="text-xs text-muted-foreground text-center flex-shrink-0 pt-1 border-t">
            Klik ide untuk langsung menggunakannya sebagai topik ebook · Terinspirasi dari model "Luka Berdarah" Mulaforge
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
