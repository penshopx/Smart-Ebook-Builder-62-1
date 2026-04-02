import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ExternalLink, Bot, Sparkles, Workflow, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const USE_CASES = [
  { label: "Draft Bab", desc: "Tulis konten bab dari prompt outline" },
  { label: "Silabus Kursus", desc: "Buat kurikulum dari prompt E-Course" },
  { label: "Marketing Copy", desc: "Eksekusi prompt Marketing Kit" },
  { label: "System Prompt", desc: "Uji prompt dari GPT Builder" },
];

export function DokumenterChatButton() {
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenChat = () => {
    window.open('https://chat.dokumentender.com', '_blank', 'width=800,height=700,menubar=no,toolbar=no,location=no,status=no');
    setShowDialog(false);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl z-[9999] bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:shadow-blue-500/30"
        data-testid="button-open-dokumentender"
        aria-label="Buka DokumenTender AI"
      >
        <Bot className="h-6 w-6" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold block">DokumenTender AI</span>
                <span className="text-xs text-muted-foreground font-normal">Whitelabel LLM untuk Indonesia</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Main pitch */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm">Eksekusi Prompt Pipeline Anda di Sini</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Salin prompt dari 13 mode generasi Chaesa AI Studio, lalu jalankan di DokumenTender AI untuk hasil optimal dalam Bahasa Indonesia.
              </p>
            </div>

            {/* Badges */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Gratis</Badge>
                <span>Akses dasar tanpa biaya</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Indonesia</Badge>
                <span>Optimized untuk Bahasa Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Industri</Badge>
                <span>Spesialis dokumen teknis, tender & SOP</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Pipeline</Badge>
                <span>Cocok untuk eksekusi semua 9 langkah ekosistem</span>
              </div>
            </div>

            {/* Use cases */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Workflow className="h-3 w-3" />
                Cocok untuk eksekusi:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {USE_CASES.map((uc, idx) => (
                  <div key={idx} className="flex flex-col p-2 rounded-md bg-muted/50 border text-xs">
                    <span className="font-medium text-foreground">{uc.label}</span>
                    <span className="text-muted-foreground text-[10px] mt-0.5">{uc.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={handleOpenChat}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400"
              data-testid="button-open-chat-popup"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Buka DokumenTender AI
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              data-testid="button-close-dialog"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
