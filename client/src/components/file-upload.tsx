import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, X, FileText, Image as ImageIcon, Film, Music, Table } from 'lucide-react';
import type { UploadedFile } from '@shared/schema';

interface FileUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function FileUpload({ uploadedFiles, onFilesChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      name: file.name,
      type: file.type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }));
    onFilesChange([...uploadedFiles, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(uploadedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-3.5 w-3.5 text-purple-500" />;
    if (type.includes('video')) return <Film className="h-3.5 w-3.5 text-red-500" />;
    if (type.includes('audio')) return <Music className="h-3.5 w-3.5 text-pink-500" />;
    if (type.includes('sheet') || type.includes('csv')) return <Table className="h-3.5 w-3.5 text-green-500" />;
    return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <UploadCloud className="h-4 w-4 text-primary" />
          File Referensi (Opsional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.mp3,.mp4,.wav"
            className="hidden"
            data-testid="input-file-upload"
          />
          <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Klik untuk upload file referensi
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOC, Excel, Gambar, Audio, Video
          </p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">File Terlampir:</p>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1.5 px-3"
                >
                  {getFileIcon(file.type)}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs">({file.size})</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Upload file ke AI (ChatGPT/Claude) bersama dengan prompt yang dihasilkan untuk analisis yang lebih mendalam.
        </p>
      </CardContent>
    </Card>
  );
}
