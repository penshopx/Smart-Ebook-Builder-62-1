import { AI_MODEL_RECOMMENDATIONS, INDUSTRIES } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bot, MessageCircle, Brain, Sparkles, Search, Globe, ExternalLink, Star, Zap, CheckCircle2 
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  MessageCircle,
  Brain,
  Sparkles,
  Search,
  Globe,
};

interface AIModelRecommenderProps {
  selectedModel: string;
  industry: string;
  topik: string;
  onSelect: (modelId: string) => void;
}

function getRecommendedModel(industry: string, topik: string): string {
  const industryData = INDUSTRIES.find(i => i.id === industry);
  if (industryData) {
    return industryData.aiModel;
  }
  
  const topikLower = topik.toLowerCase();
  if (topikLower.includes('teknik') || topikLower.includes('engineering') || topikLower.includes('migas')) {
    return 'claude';
  }
  if (topikLower.includes('marketing') || topikLower.includes('bisnis') || topikLower.includes('umkm')) {
    return 'chatgpt';
  }
  
  return 'dokumentender';
}

export function AIModelRecommender({ selectedModel, industry, topik, onSelect }: AIModelRecommenderProps) {
  const recommendedModelId = getRecommendedModel(industry, topik);
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-primary" />
          AI Model Recommender
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pilih AI model terbaik untuk mengeksekusi prompt Anda
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
            <span className="text-sm font-semibold">Rekomendasi Utama</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">DokumenTender AI</p>
                <p className="text-xs opacity-90">Whitelabel LLM untuk Industri Indonesia</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => window.open('https://chat.dokumentender.com', '_blank')}
              data-testid="button-open-dokumentender"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Buka
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {AI_MODEL_RECOMMENDATIONS.map((model) => {
            const Icon = iconMap[model.icon] || Bot;
            const isSelected = selectedModel === model.id;
            const isRecommended = model.id === recommendedModelId || model.id === 'dokumentender';
            
            return (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                data-testid={`button-ai-model-${model.id}`}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  "hover-elevate active-elevate-2",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
                
                <div className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                  model.color, model.textColor
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {model.name}
                    </p>
                    {isRecommended && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-accent">
                        Direkomendasikan
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {model.description}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {model.strengths.slice(0, 3).map((strength, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(model.url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tips:</span> Copy prompt yang dihasilkan, 
            lalu paste ke <span className="text-primary font-medium">chat.dokumentender.com</span> untuk 
            hasil terbaik dalam Bahasa Indonesia dan dokumen teknis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
