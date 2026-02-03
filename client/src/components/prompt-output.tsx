import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Maximize2, Minimize2, Sparkles, Rocket, Bot, Star, Zap, MessageCircle, Brain, Globe, Search } from 'lucide-react';
import { AI_MODEL_RECOMMENDATIONS } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const aiIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot, MessageCircle, Brain, Sparkles, Search, Globe,
};

interface PromptOutputProps {
  prompt: string;
  onRegenerate?: () => void;
  selectedAiModel?: string;
  onAiModelChange?: (modelId: string) => void;
}

export function PromptOutput({ prompt, onRegenerate, selectedAiModel = 'dokumentender', onAiModelChange }: PromptOutputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
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
