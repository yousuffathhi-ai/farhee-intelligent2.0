import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  File as FileIcon, 
  Image as ImageIcon, 
  Music, 
  X, 
  Download, 
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { MessageAttachment } from '../types';

export function getFileCategoryIcon(fileType: string, fileName: string) {
  const lowerName = fileName.toLowerCase();
  const lowerType = fileType.toLowerCase();

  if (lowerType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName)) {
    return <ImageIcon className="h-4 w-4 text-sky-500" />;
  }
  if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-rose-500" />;
  }
  if (lowerType.includes('sheet') || lowerType.includes('excel') || lowerType.includes('csv') || /\.(xlsx|xls|csv)$/i.test(lowerName)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  }
  if (lowerType.includes('audio') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(lowerName)) {
    return <Music className="h-4 w-4 text-purple-500" />;
  }
  if (/\.(ts|tsx|js|jsx|json|py|html|css|sql|sh|md)$/i.test(lowerName)) {
    return <FileCode className="h-4 w-4 text-amber-500" />;
  }
  return <FileIcon className="h-4 w-4 text-slate-500" />;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface PreSendTrayProps {
  attachments: MessageAttachment[];
  onRemove: (id: string) => void;
}

/**
 * Pre-send attachment tray shown immediately above the chat input box
 */
export const PreSendAttachmentTray: React.FC<PreSendTrayProps> = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2.5 mb-2 bg-slate-100/90 border border-slate-200/90 rounded-2xl overflow-x-auto">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 shrink-0">
        Attached ({attachments.length}):
      </div>
      {attachments.map((att) => {
        const isImage = att.type === 'image' || (att.previewUrl && att.previewUrl.startsWith('data:image/'));

        return (
          <div
            key={att.id}
            className="group relative flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 max-w-[220px]"
          >
            {isImage && att.previewUrl ? (
              <img
                src={att.previewUrl}
                alt={att.name}
                className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                {getFileCategoryIcon(att.fileType, att.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-800 truncate" title={att.name}>
                {att.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {att.formattedSize || formatBytes(att.sizeBytes)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(att.id)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

interface MessageAttachmentsProps {
  attachments?: MessageAttachment[];
  isUser?: boolean;
}

/**
 * In-message rendered attachment cards
 */
export const MessageAttachmentsView: React.FC<MessageAttachmentsProps> = ({ attachments, isUser = false }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <div className={`flex flex-wrap gap-2.5 my-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {attachments.map((att) => {
          const isImage = att.type === 'image' || (att.previewUrl && att.previewUrl.startsWith('data:image/'));

          if (isImage && att.previewUrl) {
            return (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-900 cursor-pointer"
                onClick={() => setLightboxImage(att.previewUrl || null)}
              >
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="max-h-48 max-w-[280px] object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-medium">
                  <Maximize2 className="h-4 w-4" />
                  <span>Preview</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                  <div className="text-[11px] font-medium truncate">{att.name}</div>
                  <div className="text-[9px] text-slate-300">{att.formattedSize || formatBytes(att.sizeBytes)}</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={att.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${
                isUser
                  ? 'bg-white/90 text-slate-800 border-white/50 shadow-xs'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white hover:border-sky-300'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200/70 shadow-xs shrink-0">
                {getFileCategoryIcon(att.fileType, att.name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[180px]" title={att.name}>
                  {att.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {att.formattedSize || formatBytes(att.sizeBytes)} • {att.fileType.toUpperCase() || 'DOCUMENT'}
                </div>
              </div>

              {att.url || att.previewUrl ? (
                <a
                  href={att.url || att.previewUrl}
                  download={att.name}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition-colors"
                  title={`Download ${att.name}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Lightbox image preview modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 rounded-full bg-slate-800/80"
              title="Close image"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Full Preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
