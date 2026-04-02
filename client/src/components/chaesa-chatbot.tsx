import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, Lightbulb, Workflow, Smartphone, ClipboardList, Bot, BookOpen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  "Apa itu Ekosistem Kompetensi Digital di Chaesa AI Studio?",
  "Mengapa ebook harus jadi langkah pertama sebelum chatbot atau e-course?",
  "Bagaimana cara transfer kompetensi dari ebook ke Chatbot AI?",
  "Bagaimana mengubah ebook menjadi E-Course 8 modul?",
  "Apa perbedaan Mini App Builder dan Document Generator?",
  "Bagaimana pipeline 9-langkah bekerja dari Ebook+ sampai Ekosistem?",
  "Bagaimana cara mulai membangun ekosistem untuk pemula?",
  "Tips monetisasi ekosistem kompetensi digital di Indonesia?",
];

const FEATURE_CHIPS = [
  { label: "Ekosistem", icon: Workflow, question: "Jelaskan konsep Ekosistem Kompetensi Digital — mengapa ebook adalah langkah 1 dan bagaimana transfer ke chatbot, e-course, mini app, dan document generator" },
  { label: "Chatbot AI", icon: Bot, question: "Bagaimana transfer kompetensi dari ebook ke Chatbot Demo AI yang bisa menjawab audiens 24 jam otomatis?" },
  { label: "E-Course", icon: BookOpen, question: "Bagaimana mengubah ebook menjadi E-Course terstruktur — silabus, modul, dan strategi monetisasi?" },
  { label: "Mini App", icon: ClipboardList, question: "Apa itu Mini App Builder dan Document Generator sebagai produk digital turunan dari ekosistem kompetensi ebook?" },
];

export function ChaesaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo! Saya Chaesa, asisten AI Chaesa AI Studio.

Konsep utama kami: Ekosistem Kompetensi Digital.

Ebook adalah Langkah 1 — fondasi tempat Anda mendokumentasikan kompetensi/keahlian. Dari ebook, kompetensi ditransfer ke produk digital lain: Chatbot AI, E-Course, Mini App, dan Document Generator.

Saya bisa membantu Anda:
- Memahami konsep transfer kompetensi dari ebook ke produk digital lain
- Memilih mode generasi yang tepat (16 mode tersedia)
- Mengikuti pipeline 9-langkah untuk distribusi dan monetisasi
- Tips membangun ekosistem digital di 24 industri Indonesia

Mulai dari mana dulu?`
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: userMessage,
        history: messages.slice(-10)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' 
      }]);
    }
  });

  const handleSend = (messageToSend?: string) => {
    const message = messageToSend || input.trim();
    if (!message || chatMutation.isPending) return;
    
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    chatMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showQuickSection = messages.length <= 2;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl z-[9999] bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:shadow-purple-500/30"
          data-testid="button-open-chaesa"
          aria-label="Tanya Chaesa"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-purple-600 to-pink-500 shrink-0">
          <SheetTitle className="flex items-center gap-3 text-white">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                C
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <span className="font-bold block">Chaesa</span>
              <p className="text-xs text-white/80 font-normal">Asisten Chaesa AI Studio · 13 Mode · 9 Langkah</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.role}-${idx}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xs font-bold">C</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xs font-bold">C</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Questions & Feature Chips */}
        {showQuickSection && (
          <div className="px-4 pb-2 space-y-3 border-t pt-3 shrink-0">
            {/* Feature quick-access chips */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Workflow className="h-3 w-3" />
                Fitur unggulan:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {FEATURE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.question)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 hover:border-primary/40 transition-colors text-left"
                    disabled={chatMutation.isPending}
                    data-testid={`chip-feature-${idx}`}
                  >
                    <chip.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular questions */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Pertanyaan populer:
              </p>
              <div className="flex flex-wrap gap-1">
                {QUICK_QUESTIONS.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={chatMutation.isPending}
                    data-testid={`chip-question-${idx}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-background shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Tanya Chaesa tentang fitur atau cara pakai..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatMutation.isPending}
              className="rounded-full"
              data-testid="input-chaesa-message"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || chatMutation.isPending}
              className="rounded-full shrink-0"
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
