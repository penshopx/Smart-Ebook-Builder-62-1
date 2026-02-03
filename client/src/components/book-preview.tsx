import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { INDUSTRIES, EBOOK_SERIES_DATA } from '@shared/schema';
import type { ProjectData } from '@shared/schema';
import { Book, FileText, Target, Users, Sparkles, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookPreviewProps {
  projectData: ProjectData;
  activeMode: string;
}

function getCompletionPercentage(projectData: ProjectData): number {
  const fields = [
    projectData.topik,
    projectData.judul,
    projectData.target,
    projectData.painPoint,
    projectData.bigIdea,
  ];
  const filled = fields.filter(f => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

function getIndustryInfo(industryId: string) {
  return INDUSTRIES.find(i => i.id === industryId);
}

export function BookPreview({ projectData, activeMode }: BookPreviewProps) {
  const completion = getCompletionPercentage(projectData);
  const industry = getIndustryInfo(projectData.industry);
  const seriesBooks = EBOOK_SERIES_DATA[projectData.level] || [];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Preview Ebook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <div className={cn(
              "w-24 h-32 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 text-center",
              "bg-gradient-to-br from-primary via-primary/90 to-purple-600",
              "transform perspective-1000 rotate-y-[-5deg] hover:rotate-y-0 transition-transform"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg" />
              <Book className="h-6 w-6 text-white/80 mb-1" />
              <p className="text-[9px] font-bold text-white leading-tight line-clamp-3">
                {projectData.judul || projectData.topik || 'Judul Ebook Anda'}
              </p>
              {industry && industry.id !== 'general' && (
                <Badge 
                  variant="secondary" 
                  className="mt-1 text-[7px] px-1 py-0 h-3 bg-white/20 text-white border-0"
                >
                  {industry.name.split(' ')[0]}
                </Badge>
              )}
            </div>
            <div className="absolute -right-1 -bottom-1 w-24 h-32 bg-primary/20 rounded-lg -z-10 transform rotate-3" />
            <div className="absolute -right-2 -bottom-2 w-24 h-32 bg-primary/10 rounded-lg -z-20 transform rotate-6" />
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {projectData.judul || 'Judul belum ditentukan'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Topik: {projectData.topik || '-'}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Kelengkapan Data</span>
                <span className="font-medium text-primary">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] h-5">
                {projectData.language}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                {projectData.tone}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                {projectData.writingStyle}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Struktur: {projectData.level}
          </p>
          
          {seriesBooks.length > 1 && (
            <div className="grid grid-cols-3 gap-1.5">
              {seriesBooks.map((book, idx) => (
                <div 
                  key={book.id}
                  className={cn(
                    "p-2 rounded-md border text-center",
                    idx === 0 ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border"
                  )}
                >
                  <div className={cn(
                    "w-6 h-8 mx-auto mb-1 rounded-sm",
                    idx === 0 ? "bg-primary" : "bg-muted-foreground/20"
                  )}>
                    <Book className={cn(
                      "h-3 w-3 mx-auto mt-1.5",
                      idx === 0 ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <p className="text-[8px] text-muted-foreground line-clamp-2 leading-tight">
                    {book.label.split(':')[0]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-muted/50 border space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Target Pembaca</p>
              <p className="text-xs font-medium text-foreground line-clamp-1">
                {projectData.target || 'Belum ditentukan'}
              </p>
            </div>
          </div>
          
          {projectData.painPoint && (
            <div className="flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Pain Point</p>
                <p className="text-xs text-foreground line-clamp-2">
                  {projectData.painPoint}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Mode Aktif:</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {activeMode.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
