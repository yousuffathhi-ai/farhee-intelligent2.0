import { ConversationSession, DocumentExport, ImageAsset, MusicTrack, SyncAuditLog } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'farhee_sessions_v2',
  DOCUMENTS: 'farhee_documents_v2',
  IMAGES: 'farhee_images_v2',
  MUSIC: 'farhee_music_v2',
  AUDIT_LOGS: 'farhee_sync_logs_v2',
  OFFLINE_QUEUE: 'farhee_offline_queue_v2',
  ACTIVE_USER: 'farhee_user_v2',
  ENCRYPTION_SECRET: 'farhee_e2ee_pass_v2',
};

// Safe LocalStorage helpers with automatic JSON handling
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return fallback;
  }
}

export function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Error writing localStorage key "${key}":`, e);
  }
}

export const StorageService = {
  getSessions(): ConversationSession[] {
    return getLocal<ConversationSession[]>(STORAGE_KEYS.SESSIONS, []);
  },

  saveSession(session: ConversationSession): void {
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: Date.now() };
    } else {
      sessions.unshift({ ...session, updatedAt: Date.now() });
    }
    setLocal(STORAGE_KEYS.SESSIONS, sessions);
    this.queueSyncItem({ type: 'session', id: session.id, updatedAt: Date.now() });
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.SESSIONS, sessions);
  },

  getDocuments(): DocumentExport[] {
    return getLocal<DocumentExport[]>(STORAGE_KEYS.DOCUMENTS, []);
  },

  saveDocument(doc: DocumentExport): void {
    const docs = this.getDocuments();
    const idx = docs.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      docs[idx] = { ...doc, updatedAt: Date.now() };
    } else {
      docs.unshift({ ...doc, updatedAt: Date.now() });
    }
    setLocal(STORAGE_KEYS.DOCUMENTS, docs);
    this.queueSyncItem({ type: 'document', id: doc.id, updatedAt: Date.now() });
  },

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    setLocal(STORAGE_KEYS.DOCUMENTS, docs);
  },

  getImages(): ImageAsset[] {
    return getLocal<ImageAsset[]>(STORAGE_KEYS.IMAGES, []);
  },

  saveImage(img: ImageAsset): void {
    const images = this.getImages();
    images.unshift(img);
    setLocal(STORAGE_KEYS.IMAGES, images);
    this.queueSyncItem({ type: 'image', id: img.id, updatedAt: img.createdAt });
  },

  getMusicTracks(): MusicTrack[] {
    return getLocal<MusicTrack[]>(STORAGE_KEYS.MUSIC, []);
  },

  saveMusicTrack(track: MusicTrack): void {
    const tracks = this.getMusicTracks();
    tracks.unshift(track);
    setLocal(STORAGE_KEYS.MUSIC, tracks);
    this.queueSyncItem({ type: 'music', id: track.id, updatedAt: track.createdAt });
  },

  getSyncLogs(): SyncAuditLog[] {
    return getLocal<SyncAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  addSyncLog(log: Omit<SyncAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getSyncLogs();
    logs.unshift({
      ...log,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    });
    setLocal(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // Cap to last 100
  },

  // Offline Sync Queue
  getOfflineQueue(): { type: string; id: string; updatedAt: number }[] {
    return getLocal(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  queueSyncItem(item: { type: string; id: string; updatedAt: number }): void {
    const queue = this.getOfflineQueue();
    const existingIdx = queue.findIndex((q) => q.id === item.id);
    if (existingIdx >= 0) {
      queue[existingIdx] = item;
    } else {
      queue.push(item);
    }
    setLocal(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  clearOfflineQueue(): void {
    setLocal(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  /**
   * Last-Write-Wins (LWW) Cloud Synchronization Engine
   */
  async syncWithCloud(): Promise<{
    success: boolean;
    conflictsResolved: string[];
    syncedCount: number;
  }> {
    const localDocs = this.getDocuments();

    try {
      const response = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: localDocs,
          clientTimestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync server responded with ${response.status}`);
      }

      const data = await response.json();
      const conflicts = data.conflictsResolved || [];

      // Update sync status on local documents
      const updatedDocs = localDocs.map((d) => ({
        ...d,
        syncStatus: 'synced' as const,
      }));
      setLocal(STORAGE_KEYS.DOCUMENTS, updatedDocs);
      this.clearOfflineQueue();

      if (conflicts.length > 0) {
        conflicts.forEach((conflictStr: string) => {
          this.addSyncLog({
            action: 'Cloud Synchronization',
            detail: conflictStr,
            strategy: 'LWW (Last-Write-Wins)',
            winner: conflictStr.includes('Client-Win') ? 'client' : 'cloud',
          });
        });
      } else {
        this.addSyncLog({
          action: 'Cloud Synchronization',
          detail: `Clean synchronization: ${localDocs.length} documents reconciled without conflict.`,
          strategy: 'LWW (Last-Write-Wins)',
          winner: 'equal',
        });
      }

      return {
        success: true,
        conflictsResolved: conflicts,
        syncedCount: localDocs.length,
      };
    } catch (err: any) {
      console.warn('Sync failed (system may be offline):', err?.message);
      this.addSyncLog({
        action: 'Sync Queued (Offline)',
        detail: `Changes preserved in offline vault; will sync on reconnection.`,
        strategy: 'LWW (Last-Write-Wins)',
        winner: 'client',
      });
      return {
        success: false,
        conflictsResolved: [],
        syncedCount: 0,
      };
    }
  },
};
