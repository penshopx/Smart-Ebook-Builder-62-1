import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  BrainCircuit, Send, X, Minimize2, Maximize2,
  Lightbulb, FileText, TrendingUp, Search, HelpCircle, Sparkles,
} from 'lucide-react';
import type { ProjectData } from '@shared/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface TopicAssistantProps {
  projectData: ProjectData;
}

const AGENT_COLORS: Record<string, string> = {
  'ORCHESTRATOR': 'text-violet-600 dark:text-violet-400',
  'Content Architect': 'text-blue-600 dark:text-blue-400',
  'Industry Expert': 'text-amber-600 dark:text-amber-400',
  'Marketing Strategist': 'text-rose-600 dark:text-rose-400',
  'Research Guide': 'text-teal-600 dark:text-teal-400',
  'Interactive Coach': 'text-green-600 dark:text-green-400',
};

const AGENT_ICONS: Record<string, string> = {
  'ORCHESTRATOR': '🎯',
  'Content Architect': '📚',
  'Industry Expert': '🏭',
  'Marketing Strategist': '📣',
  'Research Guide': '🔍',
  'Interactive Coach': '❓',
};

const INDUSTRY_LABELS: Record<string, string> = {
  engineering: 'Keteknikan', construction: 'Konstruksi', mining: 'Pertambangan',
  oil_gas: 'Migas', electricity: 'Kelistrikan', manufacturing: 'Manufaktur',
  umkm: 'UMKM', wealth: 'Keuangan', family: 'Keluarga', spirituality: 'Spiritualitas',
  health: 'Kesehatan', hobby: 'Hobi', perijinan_usaha: 'Perijinan',
  tender: 'Tender', sbu: 'SBU', skk: 'SKK', manajemen_proyek: 'Manpro',
  erp: 'ERP', bim: 'BIM', pub: 'ESG/CSR', pkb: 'CPD', iso: 'ISO', kpk: 'Integritas', general: 'Umum',
};

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.match(/^\*\*\[[\w\s]+\]\*\*/)) {
      const agentMatch = line.match(/^\*\*\[([\w\s]+)\]\*\*(.*)/);
      if (agentMatch) {
        const agentName = agentMatch[1];
        const rest = agentMatch[2];
        const colorClass = AGENT_COLORS[agentName] || 'text-violet-600 dark:text-violet-400';
        const icon = AGENT_ICONS[agentName] || '🤖';
        result.push(
          <div key={i} className="mb-2">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-muted ${colorClass}`}>
              <span>{icon}</span> {agentName}
            </span>
            {rest && <span>{inlineFormat(rest)}</span>}
          </div>
        );
        i++;
        continue;
      }
    }

    if (line.startsWith('### ')) {
      result.push(<h3 key={i} className="font-bold text-sm mt-3 mb-1">{inlineFormat(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={i} className="font-bold text-sm mt-3 mb-1">{inlineFormat(line.slice(3))}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} className="flex gap-1.5 my-0.5 text-xs">
          <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        result.push(
          <div key={i} className="flex gap-1.5 my-0.5 text-xs">
            <span className="text-muted-foreground shrink-0 font-medium">{match[1]}.</span>
            <span>{inlineFormat(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('✅') || line.startsWith('📌')) {
      result.push(
        <div key={i} className="mt-2 text-xs bg-muted/60 rounded-md px-2.5 py-1.5 border-l-2 border-primary/40 italic text-muted-foreground">
          {inlineFormat(line)}
        </div>
      );
    } else if (line === '') {
      result.push(<div key={i} className="h-1.5" />);
    } else {
      result.push(<p key={i} className="text-xs leading-relaxed">{inlineFormat(line)}</p>);
    }
    i++;
  }
  return <>{result}</>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-muted px-1 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

const QUICK_CHIPS = [
  { icon: HelpCircle, label: 'Jelaskan topik ini', q: 'Jelaskan secara mendalam topik ebook yang sedang saya kerjakan ini. Apa yang paling penting untuk dipahami?' },
  { icon: FileText, label: 'Saran outline', q: 'Berikan saran struktur outline atau bab-bab utama yang ideal untuk ebook tentang topik ini.' },
  { icon: TrendingUp, label: 'Angle unik', q: 'Apa angle atau pendekatan unik yang bisa membedakan ebook saya dari kompetitor di topik ini?' },
  { icon: Search, label: 'Riset topik', q: 'Bantu saya menggali lebih dalam tentang topik ini — tren terkini, fakta penting, dan hal yang sering diabaikan.' },
  { icon: Lightbulb, label: 'Big idea', q: 'Apa big idea atau konsep kunci yang bisa menjadi benang merah ebook saya tentang topik ini?' },
  { icon: Sparkles, label: 'Target audiens', q: 'Siapa target audiens paling tepat untuk topik ini dan apa yang paling mereka butuhkan?' },
];

export function TopicAssistant({ projectData }: TopicAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasTopic = !!projectData.topik?.trim();
  const industryShort = INDUSTRY_LABELS[projectData.industry] || 'Umum';
  const topicLabel = projectData.topik || 'Topik Ebook';

  useEffect(() => {
    if (isOpen && messages.length === 0 && hasTopic) {
      const greeting: Message = {
        role: 'assistant',
        content: `**[ORCHESTRATOR]**

Selamat datang! Saya **CHAESA PRIME** — Agentic AI Orchestrator untuk proyek Anda.

🎯 **Topik aktif**: *${projectData.topik}*
${projectData.industry && projectData.industry !== 'general' ? `🏭 **Industri**: ${INDUSTRY_LABELS[projectData.industry] || projectData.industry}` : ''}

Saya mengoordinasi tim agen spesialis yang siap membantu:
- 📚 **Content Architect** — Struktur & konten ebook
- 🏭 **Industry Expert** — Pengetahuan industri mendalam  
- 📣 **Marketing Strategist** — Positioning & angle unik
- 🔍 **Research Guide** — Eksplorasi & validasi ide
- ❓ **Interactive Coach** — Klarifikasi & pengarahan

${projectData.painPoint ? `Saya sudah memahami pain point yang Anda identifikasi: *"${projectData.painPoint}"*. ` : ''}Mulai dari mana kita?

💡 *Pertanyaan lanjutan: Aspek mana dari topik "${projectData.topik}" yang paling ingin kamu eksplorasi lebih dalam?*`
      };
      setMessages([greeting]);
    }
  }, [isOpen, hasTopic]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isStreaming || !hasTopic) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, { role: 'assistant', content: '', streaming: true }]);
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch('/api/topic-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          projectContext: {
            topik: projectData.topik,
            judul: projectData.judul,
            target: projectData.target,
            industry: projectData.industry,
            painPoint: projectData.painPoint,
            bigIdea: projectData.bigIdea,
            tujuan: projectData.tujuan,
            tone: projectData.tone,
            writingStyle: projectData.writingStyle,
            aiCharacter: projectData.aiCharacter,
          },
        }),
        signal: abort.signal,
      });

      if (!response.ok) throw new Error('Request failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.content) {
                accumulated += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: false };
        return updated;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
            streaming: false,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => {
      const updated = [...prev];
      if (updated[updated.length - 1]?.streaming) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
      }
      return updated;
    });
  };

  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => hasTopic ? setIsOpen(true) : undefined}
            data-testid="button-topic-assistant"
            className={`fixed bottom-24 right-4 z-50 flex flex-col items-center justify-center gap-0.5 h-14 w-14 rounded-2xl shadow-lg border transition-all duration-200 ${
              hasTopic
                ? 'bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 border-violet-400/30 text-white cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            <BrainCircuit className="h-5 w-5" />
            <span className="text-[8px] font-semibold leading-none tracking-tight">PRIME</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[180px]">
          {hasTopic
            ? <p className="text-xs">Chaesa Prime — Agentic AI untuk topik <strong>"{topicLabel}"</strong></p>
            : <p className="text-xs">Isi topik ebook dulu untuk mengaktifkan Asisten Topik</p>
          }
        </TooltipContent>
      </Tooltip>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className={`flex flex-col p-0 gap-0 transition-all duration-300 ${isExpanded ? 'w-[680px] max-w-[95vw]' : 'w-[420px] max-w-[95vw]'}`}
        >
          <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-violet-600 to-purple-700 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-white text-sm font-bold leading-tight">
                    Chaesa Prime
                  </SheetTitle>
                  <p className="text-[10px] text-white/70 truncate max-w-[200px]">
                    🎯 {topicLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[9px] bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {industryShort}
                </Badge>
                <button
                  onClick={() => setIsExpanded(e => !e)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  title={isExpanded ? "Perkecil" : "Perluas"}
                >
                  {isExpanded ? <Minimize2 className="h-3.5 w-3.5 text-white" /> : <Maximize2 className="h-3.5 w-3.5 text-white" />}
                </button>
                <button
                  onClick={clearChat}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  title="Reset chat"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {['Content Architect', 'Industry Expert', 'Marketing Strategist', 'Research Guide', 'Interactive Coach'].map(agent => (
                <span key={agent} className="text-[8px] bg-white/15 px-1.5 py-0.5 rounded-full text-white/80">
                  {AGENT_ICONS[agent]} {agent.split(' ')[0]}
                </span>
              ))}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-xs">Memuat asisten topik...</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-[9px] text-white font-bold">CP</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto rounded-tr-sm'
                      : 'bg-muted border border-border/40 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      : (
                        <div className="prose-chaesa">
                          {msg.content
                            ? renderMarkdown(msg.content)
                            : (
                              <div className="flex items-center gap-1.5 py-1">
                                <div className="flex gap-0.5">
                                  {[0, 150, 300].map(d => (
                                    <div
                                      key={d}
                                      className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                                      style={{ animationDelay: `${d}ms` }}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">Agen bekerja...</span>
                              </div>
                            )
                          }
                          {msg.streaming && msg.content && (
                            <span className="inline-block h-3 w-0.5 bg-violet-500 ml-0.5 animate-pulse" />
                          )}
                        </div>
                      )
                    }
                  </div>
                </div>
              ))}
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          {messages.length <= 1 && !isStreaming && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Mulai dengan:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.q)}
                    className="flex items-center gap-1.5 text-[10px] text-left px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted hover:border-violet-400/50 transition-all text-muted-foreground hover:text-foreground"
                    data-testid={`chip-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <chip.icon className="h-3 w-3 shrink-0 text-violet-500" />
                    <span className="leading-tight">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t bg-background shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasTopic ? `Tanya tentang "${topicLabel}"... (Enter kirim, Shift+Enter baris baru)` : 'Isi topik dulu...'}
                disabled={!hasTopic || isStreaming}
                rows={2}
                className="resize-none text-xs min-h-[52px] max-h-[120px] flex-1"
                data-testid="input-topic-assistant"
              />
              {isStreaming ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopStreaming}
                  className="h-[52px] px-3 shrink-0 border-destructive text-destructive hover:bg-destructive/10"
                  data-testid="button-stop-stream"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || !hasTopic}
                  className="h-[52px] px-3 shrink-0 bg-violet-600 hover:bg-violet-700"
                  data-testid="button-send-topic"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              Chaesa Prime · 5 agen spesialis · Konteks: <span className="font-medium">{topicLabel}</span>
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
