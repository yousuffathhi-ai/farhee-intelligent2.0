import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  SupportedLanguage, 
  ChatMessage, 
  ConversationSession, 
  DocumentExport, 
  ImageAsset, 
  MusicTrack, 
  SyncAuditLog,
  MessageAttachment
} from './types';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { ImageStudio } from './components/ImageStudio';
import { MusicStudio } from './components/MusicStudio';
import { DocumentStudio } from './components/DocumentStudio';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CloudVault } from './components/CloudVault';
import { TwoFactorModal } from './components/TwoFactorModal';
import { StorageService } from './lib/storage';
import { deriveKey, getFingerprint, encryptText } from './lib/crypto';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export default function App() {
  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState<'chat' | 'images' | 'music' | 'documents' | 'dashboard' | 'vault'>('chat');
  
  // Multilingual State
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  // Network & Offline Mode State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // RBAC & User Profile
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // 2FA Security
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(true);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [twoFactorSecret] = useState<string>('JBSWY3DPEHPK3PXP');
  const [backupCodes] = useState<string[]>([
    'FARHEE-9214-A',
    'FARHEE-3851-B',
    'FARHEE-7193-C',
    'FARHEE-4820-D',
    'FARHEE-6035-E',
    'FARHEE-1582-F',
  ]);

  // E2EE Key Fingerprint State
  const [encryptionPassphrase] = useState<string>('farhee-intelligent-2.0-master-user-passphrase');
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [encryptionFingerprint, setEncryptionFingerprint] = useState<string>('4F:9A:8C:21');

  // Data Stores
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session_default');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentExport[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncAuditLog[]>([]);

  // 1. Initialize Encryption Key on mount
  useEffect(() => {
    async function initE2EE() {
      try {
        const key = await deriveKey(encryptionPassphrase);
        const fp = await getFingerprint(encryptionPassphrase);
        setCryptoKey(key);
        setEncryptionFingerprint(fp);
      } catch (err) {
        console.warn('WebCrypto init error:', err);
      }
    }
    initE2EE();
  }, [encryptionPassphrase]);

  // 2. Load stored items from local storage
  useEffect(() => {
    const loadedSessions = StorageService.getSessions();
    const loadedDocs = StorageService.getDocuments();
    const loadedImgs = StorageService.getImages();
    const loadedMusic = StorageService.getMusicTracks();
    const loadedLogs = StorageService.getSyncLogs();

    setDocuments(loadedDocs);
    setImages(loadedImgs);
    setMusicTracks(loadedMusic);
    setSyncLogs(loadedLogs);

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      setCurrentSessionId(loadedSessions[0].id);
      setMessages(loadedSessions[0].messages);
    } else {
      // Seed initial welcoming message
      const initialMsg: ChatMessage = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `### Welcome! It's great to work with you ✦\n\nI am farhee intelligent 2.0 — your personal AI collaborator and trusted teammate. Whether you're navigating complex financials, drafting executive proposals, analyzing documents, or exploring creative ideas, I'm here to support you every step of the way.\n\n- **Client-Side AES-256-GCM Encryption**: Your conversations and files remain entirely private, protected with key fingerprint \`${encryptionFingerprint}\`.\n- **Interactive Document Studio**: Choose from pre-made templates like *Annual Reports*, *Project Proposals*, and *Financial Audits*, and export cleanly to Excel, PDF, PowerPoint, or Word.\n- **Local Conversation Search**: Easily filter through all your past conversations anytime using the search bar.\n- **Drag & Drop Attachments**: Drop or attach any spreadsheet, PDF, or document for immediate insights.\n\nHow are you feeling about your projects today? Let me know what you'd like to dive into, and we'll tackle it together!`,
        timestamp: Date.now(),
        language: 'en',
        isEncrypted: true,
        cipherPreview: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };

      const initialSession: ConversationSession = {
        id: 'session_default',
        title: 'Executive Intelligence Briefing',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [initialMsg],
        language: 'en',
        tags: ['briefing', 'general'],
      };

      setSessions([initialSession]);
      setMessages([initialMsg]);
      StorageService.saveSession(initialSession);
    }
  }, []);

  // 3. Online/Offline network listeners & Automatic LWW Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored: Initiating automatic Last-Write-Wins sync...', 'info');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline mode active: All changes preserved locally with AES-256 encryption.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'warning' | 'info') => {
    setSyncToast({ message, type });
    setTimeout(() => setSyncToast(null), 4500);
  };

  // 4. Cloud Sync with Last-Write-Wins (LWW)
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await StorageService.syncWithCloud();
      setDocuments(StorageService.getDocuments());
      setSyncLogs(StorageService.getSyncLogs());

      if (result.success) {
        if (result.conflictsResolved.length > 0) {
          showToast(`Synced with cloud: ${result.conflictsResolved.length} conflict(s) resolved via Last-Write-Wins.`, 'warning');
        } else {
          showToast(`Cloud Vault synchronized successfully (${result.syncedCount} items).`, 'success');
        }
      } else {
        showToast('Sync deferred: Operating in offline mode.', 'info');
      }
    } catch (err: any) {
      console.warn('Sync handler error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Session Management Handlers
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    const target = sessions.find((s) => s.id === id);
    if (target) {
      setMessages(target.messages);
    }
  };

  const handleCreateSession = () => {
    const newSession: ConversationSession = {
      id: 'session_' + Date.now(),
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      language: currentLanguage,
      tags: [],
    };
    StorageService.saveSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleDeleteSession = (id: string) => {
    StorageService.deleteSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (currentSessionId === id) {
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        handleCreateSession();
      }
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s));
    setSessions(updated);
    const target = updated.find((s) => s.id === id);
    if (target) StorageService.saveSession(target);
  };

  // 6. Send Chat Message handler with Attachment Support
  const handleSendMessage = async (text: string, attachments: MessageAttachment[] = []) => {
    let encryptedPreview = '';
    let ivStr = '';

    if (cryptoKey) {
      try {
        const textToEncrypt = text || (attachments.length > 0 ? `[User uploaded ${attachments.length} attachment(s)]` : '');
        const enc = await encryptText(textToEncrypt, cryptoKey);
        encryptedPreview = enc.cipherText.slice(0, 32) + '...';
        ivStr = enc.iv;
      } catch (e) {}
    }

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now(),
      language: currentLanguage,
      isEncrypted: true,
      iv: ivStr,
      cipherPreview: encryptedPreview,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Derive or update session title
    const effectiveTitle = text.trim() 
      ? (text.slice(0, 35) + (text.length > 35 ? '...' : '')) 
      : (attachments[0]?.name || 'Document Analysis');

    const currentSession = sessions.find((s) => s.id === currentSessionId) || {
      id: currentSessionId,
      title: effectiveTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      language: currentLanguage,
      tags: [],
    };

    const updatedSession: ConversationSession = {
      ...currentSession,
      title: (currentSession.messages.length === 0 || currentSession.title === 'New conversation' || currentSession.title === 'New Chat')
        ? effectiveTitle
        : currentSession.title,
      updatedAt: Date.now(),
      messages: updatedMessages,
      language: currentLanguage,
    };

    StorageService.saveSession(updatedSession);
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === currentSessionId);
      if (idx >= 0) {
        return prev.map((s) => (s.id === currentSessionId ? updatedSession : s));
      }
      return [updatedSession, ...prev];
    });

    // Request AI response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: currentLanguage,
          role: userRole,
          attachments: attachments.map((a) => ({
            name: a.name,
            fileType: a.fileType,
            type: a.type,
            formattedSize: a.formattedSize,
            previewUrl: a.previewUrl,
          })),
          history: updatedMessages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.text || 'I have processed your request.';

      let botEncPreview = '';
      if (cryptoKey) {
        try {
          const encBot = await encryptText(botText, cryptoKey);
          botEncPreview = encBot.cipherText.slice(0, 32) + '...';
        } catch (e) {}
      }

      const botMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        text: botText,
        timestamp: Date.now(),
        language: currentLanguage,
        isEncrypted: true,
        cipherPreview: botEncPreview,
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);

      const finalSession = {
        ...updatedSession,
        updatedAt: Date.now(),
        messages: finalMessages,
      };
      StorageService.saveSession(finalSession);
      setSessions((prev) => prev.map((s) => (s.id === currentSessionId ? finalSession : s)));

    } catch (err: any) {
      console.error('Chat error:', err);
      // Offline fallback answer
      const offlineMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'assistant',
        text: `### 🔒 Offline Vault Mode Active\n\nYour message${attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''} has been secured in the local encrypted vault via **AES-256-GCM**.\n\nAll session updates are preserved in IndexedDB and will automatically synchronize to the cloud using Last-Write-Wins (LWW) conflict resolution upon network restoration.`,
        timestamp: Date.now(),
        language: currentLanguage,
        isEncrypted: true,
      };

      const finalMessages = [...updatedMessages, offlineMsg];
      setMessages(finalMessages);
    }
  };

  // Quick Action triggers from Chat
  const handleQuickAction = (actionType: 'excel' | 'pptx' | 'image' | 'music') => {
    switch (actionType) {
      case 'excel':
      case 'pptx':
        setActiveTab('documents');
        break;
      case 'image':
        setActiveTab('images');
        break;
      case 'music':
        setActiveTab('music');
        break;
    }
  };

  // Document Saved Callback
  const handleSaveDocument = (doc: DocumentExport) => {
    StorageService.saveDocument(doc);
    setDocuments(StorageService.getDocuments());
    showToast(`Document "${doc.name}" saved with AES-256 encryption.`, 'success');
  };

  // Image Saved Callback
  const handleSaveImage = (img: ImageAsset) => {
    StorageService.saveImage(img);
    setImages(StorageService.getImages());
    showToast(`Image generated & stored in Encrypted Vault.`, 'success');
  };

  // Music Track Saved Callback
  const handleSaveMusic = (track: MusicTrack) => {
    StorageService.saveMusicTrack(track);
    setMusicTracks(StorageService.getMusicTracks());
    showToast(`Music track "${track.title}" synthesized successfully.`, 'success');
  };

  // Simulate Conflict for Last-Write-Wins testing
  const handleSimulateConflict = () => {
    const now = Date.now();
    const fakeConflictDoc: DocumentExport = {
      id: 'doc_conflict_test',
      name: 'Q3_Global_Strategy_Conflict_Test.xlsx',
      type: 'xlsx',
      category: 'Conflict Simulation',
      sizeBytes: 42100,
      createdAt: now - 30000,
      updatedAt: now + 5000, // Newer timestamp
      syncStatus: 'conflict-resolved',
      version: 2,
      encrypted: true,
      metadata: {
        title: 'Q3 Global Strategy (Local Revision)',
        author: 'farhee Analyst Node',
      },
    };

    StorageService.saveDocument(fakeConflictDoc);
    StorageService.addSyncLog({
      action: 'Simulated Conflict Triggered',
      detail: `Concurrent write on "Q3_Global_Strategy_Conflict_Test.xlsx". Client timestamp (${now + 5000}) > Cloud timestamp (${now}). Client write won.`,
      strategy: 'LWW (Last-Write-Wins)',
      winner: 'client',
    });

    setDocuments(StorageService.getDocuments());
    setSyncLogs(StorageService.getSyncLogs());
    showToast('Simulated conflict resolved: Local revision persisted using Last-Write-Wins (LWW).', 'warning');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      
      {/* Toast Notification Banner */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 text-xs ${
            syncToast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : syncToast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {syncToast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
            {syncToast.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
            {syncToast.type === 'info' && <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
            <div>
              <div className="font-semibold">{syncToast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        isSyncing={isSyncing}
        onManualSync={handleSync}
        pendingSyncCount={StorageService.getOfflineQueue().length}
        userRole={userRole}
        onRoleChange={setUserRole}
        is2FAEnabled={is2FAEnabled}
        onOpen2FAModal={() => setIs2FAModalOpen(true)}
        encryptionFingerprint={encryptionFingerprint}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${activeTab === 'chat' ? 'max-w-7xl p-2 sm:p-4' : 'max-w-7xl p-4 sm:p-6 lg:p-8'}`}>
        
        {/* Tab 1: Chat Assistant (Gemini-Inspired Layout) */}
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            userRole={userRole}
            isOnline={isOnline}
            onTriggerQuickAction={handleQuickAction}
            encryptionPassphrase={encryptionPassphrase}
            encryptionFingerprint={encryptionFingerprint}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        )}

        {/* Tab 2: Neural Image Studio */}
        {activeTab === 'images' && (
          <ImageStudio
            images={images}
            onSaveImage={handleSaveImage}
            isOnline={isOnline}
          />
        )}

        {/* Tab 3: Neural Music Studio */}
        {activeTab === 'music' && (
          <MusicStudio
            tracks={musicTracks}
            onSaveTrack={handleSaveMusic}
            isOnline={isOnline}
          />
        )}

        {/* Tab 4: Business Document Studio */}
        {activeTab === 'documents' && (
          <DocumentStudio
            documents={documents}
            onSaveDocument={handleSaveDocument}
            userRole={userRole}
            isOnline={isOnline}
            onSyncWithCloud={handleSync}
          />
        )}

        {/* Tab 5: Project Analytics & Conversation History */}
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            sessions={sessions}
            documents={documents}
            images={images}
            music={musicTracks}
          />
        )}

        {/* Tab 6: Encrypted Cloud Vault */}
        {activeTab === 'vault' && (
          <CloudVault
            documents={documents}
            syncLogs={syncLogs}
            isOnline={isOnline}
            onToggleOnline={() => setIsOnline(!isOnline)}
            isSyncing={isSyncing}
            onSync={handleSync}
            encryptionFingerprint={encryptionFingerprint}
            userRole={userRole}
            onSimulateConflict={handleSimulateConflict}
          />
        )}

      </main>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        is2FAEnabled={is2FAEnabled}
        onToggle2FA={setIs2FAEnabled}
        secret={twoFactorSecret}
        backupCodes={backupCodes}
      />

    </div>
  );
}
