import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, ExternalLink, Maximize2, Minimize2, Sparkles, Rocket } from 'lucide-react';
import { AI_MODELS } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PromptOutputProps {
  prompt: string;
  onRegenerate?: () => void;
}

export function PromptOutput({ prompt, onRegenerate }: PromptOutputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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
                onClick={onRegenerate}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                data-testid="button-generate"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Prompt
              </Button>
            )}
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

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              Eksekusi prompt ke AI:
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_MODELS.map((model) => (
                <Button
                  key={model.name}
                  size="lg"
                  asChild
                  className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  <a
                    href={model.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-ai-${model.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Rocket className="h-5 w-5" />
                    Eksekusi ke {model.name}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
