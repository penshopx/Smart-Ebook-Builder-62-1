import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BrainCircuit, Send, X, ChevronDown, ChevronUp,
  Lightbulb, FileText, TrendingUp, Search, HelpCircle, Sparkles,
  MessageSquareText, RotateCcw,
} from 'lucide-react';
import type { ProjectData } from '@shared/schema';
import type { AssistantPersona } from '@/components/persona-config-tab';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface TopicAssistantProps {
  projectData: ProjectData;
  initialExpanded?: boolean;
  assistantPersona?: AssistantPersona;
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
    const agentMatch = line.match(/^\*\*\[([\w\s]+)\]\*\*(.*)/);
    if (agentMatch) {
      const agentName = agentMatch[1];
      const rest = agentMatch[2];
      const colorClass = AGENT_COLORS[agentName] || 'text-violet-600 dark:text-violet-400';
      const icon = AGENT_ICONS[agentName] || '🤖';
      result.push(
        <div key={i} className="mb-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted ${colorClass}`}>
            <span>{icon}</span> {agentName}
          </span>
          {rest && <span className="text-xs">{inlineFormat(rest)}</span>}
        </div>
      );
    } else if (line.startsWith('### ') || line.startsWith('## ')) {
      result.push(<p key={i} className="font-bold text-xs mt-2 mb-0.5">{inlineFormat(line.replace(/^#+\s/, ''))}</p>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} className="flex gap-1 my-0.5 text-xs">
          <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const m = line.match(/^(\d+)\.\s(.*)/);
      if (m) result.push(
        <div key={i} className="flex gap-1 my-0.5 text-xs">
          <span className="text-muted-foreground shrink-0 font-medium">{m[1]}.</span>
          <span>{inlineFormat(m[2])}</span>
        </div>
      );
    } else if (line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('✅')) {
      result.push(
        <div key={i} className="mt-1.5 text-[10px] bg-violet-50 dark:bg-violet-950/30 rounded-md px-2 py-1 border-l-2 border-violet-400/50 italic text-muted-foreground">
          {inlineFormat(line)}
        </div>
      );
    } else if (line === '') {
      result.push(<div key={i} className="h-1" />);
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
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-muted px-1 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
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

export function TopicAssistant({ projectData, initialExpanded = false, assistantPersona }: TopicAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasTopic = !!projectData.topik?.trim();
  const industryShort = INDUSTRY_LABELS[projectData.industry] || 'Umum';
  const topicLabel = projectData.topik || 'Topik Ebook';

  const hasPersona = !!(assistantPersona?.namaAsisten || assistantPersona?.knowledgeBase);
  const personaName = assistantPersona?.namaAsisten || 'CHAESA PRIME';
  const personaJob = assistantPersona?.jabatan ? ` — ${assistantPersona.jabatan}` : '';

  useEffect(() => {
    if (isExpanded && messages.length === 0 && hasTopic) {
      const welcomePersona = hasPersona && assistantPersona?.sapaanKhas
        ? assistantPersona.sapaanKhas
        : null;
      setMessages([{
        role: 'assistant',
        content: `**[ORCHESTRATOR]**

${welcomePersona ? welcomePersona + '\n\n---\n\n' : ''}Halo! Saya **${personaName}**${personaJob} — Agentic AI khusus untuk topik proyek Anda.

🎯 **Topik aktif**: *${projectData.topik}*
${projectData.industry && projectData.industry !== 'general' ? `🏭 **Industri**: ${INDUSTRY_LABELS[projectData.industry] || projectData.industry}` : ''}
${hasPersona && assistantPersona?.kepribadian?.length ? `✨ **Karakter**: ${assistantPersona.kepribadian.slice(0, 4).join(', ')}` : ''}

Saya mengorkestrasi 5 agen spesialis:
- 📚 **Content Architect** — Struktur & narasi ebook
- 🏭 **Industry Expert** — Pengetahuan industri mendalam
- 📣 **Marketing Strategist** — Positioning & angle unik
- 🔍 **Research Guide** — Eksplorasi & validasi ide
- ❓ **Interactive Coach** — Klarifikasi & pengarahan

${projectData.painPoint ? `Saya sudah menangkap pain point: *"${projectData.painPoint}"*. ` : ''}Mulai percakapan dari bawah!

💡 *Coba tanya: Apa angle unik yang bisa membedakan ebook saya tentang "${projectData.topik}"?*`
      }]);
    }
  }, [isExpanded, hasTopic]);

  useEffect(() => {
    if (isExpanded) scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExpanded]);

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
            topik: projectData.topik, judul: projectData.judul, target: projectData.target,
            industry: projectData.industry, painPoint: projectData.painPoint,
            bigIdea: projectData.bigIdea, tujuan: projectData.tujuan,
            tone: projectData.tone, writingStyle: projectData.writingStyle, aiCharacter: projectData.aiCharacter,
          },
          assistantPersona: assistantPersona ? {
            namaAsisten: assistantPersona.namaAsisten,
            jabatan: assistantPersona.jabatan,
            tagline: assistantPersona.tagline,
            kepribadian: assistantPersona.kepribadian,
            knowledgeBase: assistantPersona.knowledgeBase,
            metodeFavorit: assistantPersona.metodeFavorit,
            caseStudy: assistantPersona.caseStudy,
            topikFokus: assistantPersona.topikFokus,
            topikHindari: assistantPersona.topikHindari,
            instruksiKhusus: assistantPersona.instruksiKhusus,
          } : null,
        }),
        signal: abort.signal,
      });
      if (!response.ok) throw new Error('Failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.content) {
                accumulated += data.content;
                setMessages(prev => {
                  const u = [...prev];
                  u[u.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
                  return u;
                });
              }
            } catch {}
          }
        }
      }
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: 'assistant', content: accumulated, streaming: false };
        return u;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.', streaming: false };
          return u;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => {
      const u = [...prev];
      if (u[u.length - 1]?.streaming) u[u.length - 1] = { ...u[u.length - 1], streaming: false };
      return u;
    });
  };

  const resetChat = () => {
    setMessages([]);
    setTimeout(() => {
      if (isExpanded && hasTopic) {
        setMessages([{
          role: 'assistant',
          content: `**[ORCHESTRATOR]**\n\nSesi baru dimulai! Saya siap membantu dengan topik *"${projectData.topik}"*. Apa yang ingin kamu eksplorasi?\n\n💡 *Mulai dengan salah satu chip cepat di bawah, atau ketik pertanyaanmu.*`
        }]);
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messageCount = messages.filter(m => m.role === 'user').length;

  return (
    <Card className={`border-violet-200/60 dark:border-violet-800/40 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'shadow-md ring-1 ring-violet-300/30 dark:ring-violet-700/30' : 'hover:border-violet-300/80 dark:hover:border-violet-700/60'
    }`}>
      <CardHeader className="p-0">
        <button
          onClick={() => hasTopic ? setIsExpanded(e => !e) : undefined}
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
            hasTopic
              ? 'cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
              : 'cursor-not-allowed opacity-60'
          }`}
          data-testid="button-toggle-topic-assistant"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">Asisten Topik</span>
                <Badge variant="outline" className="text-[9px] py-0 h-4 border-violet-300/60 dark:border-violet-700/60 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20">
                  Chaesa Prime
                </Badge>
                {messageCount > 0 && (
                  <Badge variant="secondary" className="text-[9px] py-0 h-4">
                    {messageCount} pesan
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {hasTopic
                  ? <span>5 agen spesialis · Topik: <span className="text-violet-600 dark:text-violet-400 font-medium truncate">{topicLabel}</span></span>
                  : 'Isi topik ebook untuk mengaktifkan asisten ini'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasTopic && (
              <Badge className="text-[9px] py-0 h-5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 hover:bg-violet-100">
                {industryShort}
              </Badge>
            )}
            {isExpanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap border-t border-violet-100 dark:border-violet-900/30 pt-2 bg-violet-50/30 dark:bg-violet-950/10">
            <span className="text-[9px] text-muted-foreground font-medium mr-1">AGEN:</span>
            {[
              { name: 'Content Architect', icon: '📚', color: 'text-blue-600 dark:text-blue-400' },
              { name: 'Industry Expert', icon: '🏭', color: 'text-amber-600 dark:text-amber-400' },
              { name: 'Marketing Strategist', icon: '📣', color: 'text-rose-600 dark:text-rose-400' },
              { name: 'Research Guide', icon: '🔍', color: 'text-teal-600 dark:text-teal-400' },
              { name: 'Interactive Coach', icon: '❓', color: 'text-green-600 dark:text-green-400' },
            ].map(a => (
              <span key={a.name} className={`text-[9px] bg-white dark:bg-muted px-1.5 py-0.5 rounded-full border border-border/50 ${a.color}`}>
                {a.icon} {a.name.split(' ')[0]}
              </span>
            ))}
            {messageCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); resetChat(); }}
                className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground hover:text-destructive transition-colors"
                title="Reset percakapan"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Reset
              </button>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <ScrollArea className="h-[340px] px-4 py-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BrainCircuit className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Memuat asisten...</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-[8px] text-white font-bold">CP</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm ml-auto'
                      : 'bg-muted border border-border/30 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      : (
                        <div>
                          {msg.content
                            ? renderMarkdown(msg.content)
                            : (
                              <div className="flex items-center gap-1.5 py-1">
                                <div className="flex gap-0.5">
                                  {[0, 150, 300].map(d => (
                                    <div key={d} className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">Agen berpikir...</span>
                              </div>
                            )
                          }
                          {msg.streaming && msg.content && <span className="inline-block h-3 w-0.5 bg-violet-500 ml-0.5 animate-pulse" />}
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
            <div className="px-4 pb-2 border-t border-border/30">
              <p className="text-[9px] text-muted-foreground my-2 font-medium uppercase tracking-wide">Mulai dengan pertanyaan cepat:</p>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.q)}
                    className="flex items-center gap-1.5 text-[10px] text-left px-2 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted hover:border-violet-300/60 dark:hover:border-violet-700/60 transition-all text-muted-foreground hover:text-foreground"
                    data-testid={`chip-topic-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <chip.icon className="h-3 w-3 shrink-0 text-violet-500" />
                    <span className="leading-tight">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border/30 bg-muted/20">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasTopic ? `Tanya tentang "${topicLabel}"... (Enter kirim, Shift+Enter baris baru)` : ''}
                disabled={!hasTopic || isStreaming}
                rows={2}
                className="resize-none text-xs min-h-[44px] max-h-[100px] flex-1 bg-background"
                data-testid="input-topic-assistant"
              />
              {isStreaming ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopStreaming}
                  className="h-[44px] px-3 shrink-0 border-destructive/60 text-destructive hover:bg-destructive/10"
                  data-testid="button-stop-stream-topic"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || !hasTopic}
                  className="h-[44px] px-3 shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
                  data-testid="button-send-topic"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              Chaesa Prime · OpenClaw Multi-Agent Protocol · Topik: <span className="font-medium">{topicLabel}</span>
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
