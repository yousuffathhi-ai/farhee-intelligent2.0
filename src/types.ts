export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  encryptionKeyFingerprint: string;
}

export type SupportedLanguage = 
  | 'en' | 'ar' | 'es' | 'fr' | 'de' | 'zh' | 'hi' | 'ja' 
  | 'ru' | 'pt' | 'it' | 'ko' | 'tr' | 'ta' | 'bn' | 'ur';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'music' | 'document' | 'code';
  url?: string;
  name: string;
  fileType: string;
  sizeBytes?: number;
  formattedSize?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  language?: SupportedLanguage;
  isEncrypted?: boolean;
  iv?: string;
  cipherPreview?: string;
  attachments?: MessageAttachment[];
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  language: SupportedLanguage;
  tags: string[];
}

export type DocumentType = 'pdf' | 'pptx' | 'xlsx' | 'docx';

export interface DocumentExport {
  id: string;
  name: string;
  type: DocumentType;
  category: string;
  sizeBytes: number;
  createdAt: number;
  updatedAt: number;
  downloadUrl?: string;
  syncStatus: 'local' | 'synced' | 'conflict-resolved' | 'pending';
  version: number;
  encrypted: boolean;
  metadata: {
    title: string;
    author: string;
    keywords?: string[];
    recordCount?: number;
    sheetCount?: number;
    slideCount?: number;
    pageCount?: number;
  };
}

export interface ImageAsset {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
  style: string;
  createdAt: number;
  isEdited?: boolean;
  editInstruction?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  duration: number;
  prompt: string;
  audioUrl?: string;
  procedural?: boolean;
  createdAt: number;
}

export interface SyncAuditLog {
  id: string;
  timestamp: number;
  action: string;
  detail: string;
  strategy: 'LWW (Last-Write-Wins)';
  winner: 'client' | 'cloud' | 'equal';
}

export interface ProjectAnalytics {
  totalMessages: number;
  totalTokensEstimated: number;
  documentsGenerated: number;
  imagesCreated: number;
  musicTracksCreated: number;
  storageUsedBytes: number;
  syncSuccessRate: number;
  languageDistribution: { language: string; count: number }[];
  activityTimeline: { date: string; chats: number; exports: number; media: number }[];
}
