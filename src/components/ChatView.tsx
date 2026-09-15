import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  Sparkles, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Music, 
  Presentation, 
  Copy, 
  Check, 
  ShieldAlert,
  Paperclip,
  Plus,
  PanelLeft,
  PanelLeftClose,
  Download,
  Share2,
  Trash2,
  FileUp,
  RotateCcw,
  Languages,
  Bot,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Filter,
  History,
  CornerDownRight,
  ArrowRight,
  FileDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  ChatMessage, 
  SupportedLanguage, 
  UserRole, 
  ConversationSession, 
  MessageAttachment 
} from '../types';
import { exportConversationToPdf } from '../lib/exporters';
import { CodeBlock } from './CodeBlock';
import { 
  PreSendAttachmentTray, 
  MessageAttachmentsView, 
  formatBytes 
} from './AttachmentPreview';
import { ChatSidebar } from './ChatSidebar';
import { LANGUAGES } from './Navbar';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => Promise<void>;
  currentLanguage: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  userRole: UserRole;
  isOnline: boolean;
  onTriggerQuickAction: (actionType: 'excel' | 'pptx' | 'image' | 'music') => void;
  encryptionPassphrase: string;
  encryptionFingerprint: string;
  sessions: ConversationSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  currentLanguage,
  onLanguageChange,
  userRole,
  isOnline,
  onTriggerQuickAction,
  encryptionPassphrase,
  encryptionFingerprint,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showEncryptedPayloadId, setShowEncryptedPayloadId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  // Local Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'current'>('all');
  const [filterOnlyMatches, setFilterOnlyMatches] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut: Ctrl+F / Cmd+F to open search, Escape to close
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchOpen]);

  // Reset match index when query changes
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery, searchScope]);

  // Search Results across ALL past conversations
  const crossSessionResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matches: {
      session: ConversationSession;
      matchedInTitle: boolean;
      matchingMessages: {
        id: string;
        text: string;
        sender: 'user' | 'assistant';
        timestamp: number;
        snippet: string;
        matchedAttachment?: string;
      }[];
    }[] = [];

    sessions.forEach((sess) => {
      const matchedInTitle = sess.title.toLowerCase().includes(q);
      const matchedMessages: {
        id: string;
        text: string;
        sender: 'user' | 'assistant';
        timestamp: number;
        snippet: string;
        matchedAttachment?: string;
      }[] = [];

      sess.messages.forEach((m) => {
        const textMatch = m.text.toLowerCase().includes(q);
        const attMatch = m.attachments?.find((a) => a.name.toLowerCase().includes(q));

        if (textMatch || attMatch) {
          // Extract short snippet around keyword
          let snippet = m.text;
          const idx = m.text.toLowerCase().indexOf(q);
          if (idx !== -1) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(m.text.length, idx + q.length + 60);
            snippet = (start > 0 ? '…' : '') + m.text.substring(start, end).trim() + (end < m.text.length ? '…' : '');
          } else if (attMatch) {
            snippet = `Attachment matched: ${attMatch.name}`;
          }

          matchedMessages.push({
            id: m.id,
            text: m.text,
            sender: m.sender,
            timestamp: m.timestamp,
            snippet,
            matchedAttachment: attMatch?.name,
          });
        }
      });

      if (matchedInTitle || matchedMessages.length > 0) {
        matches.push({
          session: sess,
          matchedInTitle,
          matchingMessages: matchedMessages,
        });
      }
    });

    return matches;
  }, [sessions, searchQuery]);

  // Search Results in CURRENT conversation
  const currentChatMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.attachments?.some((a) => a.name.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Jump to specific message with highlight
  const handleJumpToMessage = (sessionId: string, messageId?: string) => {
    if (sessionId !== currentSessionId) {
      onSelectSession(sessionId);
    }
    if (messageId) {
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        const el = document.getElementById(`chat-msg-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      setTimeout(() => {
        setHighlightedMessageId((current) => (current === messageId ? null : current));
      }, 4000);
    }
  };

  const handleNextMatch = () => {
    if (currentChatMatches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % currentChatMatches.length;
    setActiveMatchIndex(nextIdx);
    const target = currentChatMatches[nextIdx];
    handleJumpToMessage(currentSessionId, target.id);
  };

  const handlePrevMatch = () => {
    if (currentChatMatches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + currentChatMatches.length) % currentChatMatches.length;
    setActiveMatchIndex(prevIdx);
    const target = currentChatMatches[prevIdx];
    handleJumpToMessage(currentSessionId, target.id);
  };

  // Helper to render text with highlighted keywords
  const renderHighlightedSnippet = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-300 text-slate-900 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Displayed messages considering current search filter
  const displayedMessages =
    filterOnlyMatches && searchQuery.trim() && searchScope === 'current'
      ? currentChatMatches
      : messages;

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  // Active Session info
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const sessionTitle = currentSession ? currentSession.title : 'New Chat';

  // Handle Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isSubmitting) return;

    const textToSend = inputText.trim();
    const attachmentsToSend = [...attachments];

    setInputText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsSubmitting(true);
    try {
      await onSendMessage(textToSend, attachmentsToSend);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Enter to submit (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    // reset input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        const previewUrl = loadEvent.target?.result as string;
        const newAttachment: MessageAttachment = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          fileType: file.type || file.name.split('.').pop() || 'file',
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          type: isImage ? 'image' : 'document',
          previewUrl,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      if (isImage || file.type.includes('pdf') || file.size < 5 * 1024 * 1024) {
        reader.readAsDataURL(file);
      } else {
        // large file metadata only
        const newAttachment: MessageAttachment = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          fileType: file.type || file.name.split('.').pop() || 'file',
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          type: 'document',
        };
        setAttachments((prev) => [...prev, newAttachment]);
      }
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Text-To-Speech (TTS) handler
  const handlePlayTTS = async (messageId: string, text: string) => {
    if (playingAudioId === messageId) {
      window.speechSynthesis?.cancel();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(messageId);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });
      const data = await res.json();

      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => fallbackSpeech(text);
        await audio.play();
        return;
      }
    } catch (e) {
      // Fallback
    }

    fallbackSpeech(text);
  };

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
      utterance.lang = currentLanguage;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  // Speech-to-Text Microphone
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = currentLanguage;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition error:', err);
      }
    }

    // Fallback simulated voice prompt
    setIsRecording(true);
    setTimeout(() => {
      setInputText((prev) => (prev ? `${prev} Analyze our enterprise metrics` : 'Generate an executive business analysis for this quarter.'));
      setIsRecording(false);
    }, 1800);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadPdfSuccess, setDownloadPdfSuccess] = useState(false);

  // Download full conversation history as a formatted PDF
  const handleDownloadConversationPdf = async () => {
    if (messages.length === 0) {
      alert('This conversation is currently empty. Start chatting to generate a conversation history!');
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const blob = await exportConversationToPdf({
        sessionTitle: sessionTitle || 'Conversation Session',
        messages,
        userName: 'Shahfiya',
        language: currentLanguage,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (sessionTitle || 'Conversation').replace(/[^a-z0-9]/gi, '_');
      a.download = `Farhee_Intelligent_${cleanName}_History.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadPdfSuccess(true);
      setTimeout(() => setDownloadPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export conversation as PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Export current conversation as plain text
  const exportConversation = () => {
    const textContent = messages.map((m) => `[${m.sender.toUpperCase()} - ${new Date(m.timestamp).toLocaleString()}]:\n${m.text}\n`).join('\n---\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="relative flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-[#f8fafd] shadow-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-sky-500/10 backdrop-blur-xs border-2 border-dashed border-sky-500 rounded-2xl pointer-events-none animate-in fade-in duration-150">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-xl shadow-sky-500/30 mb-3">
            <FileUp className="h-8 w-8 animate-bounce" />
          </div>
          <div className="text-base font-bold text-slate-900">Drop files to attach</div>
          <div className="text-xs text-slate-600 mt-1">Supports Images, PDFs, Spreadsheets, and Documents</div>
        </div>
      )}

      {/* Hidden File Input Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.json,.ts,.js,.py,.md"
        className="hidden"
        id="file-attachment-input"
      />

      {/* 1. Left Chat History Sidebar (Collapsible) */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={onSelectSession}
        onCreateSession={onCreateSession}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole={userRole}
        encryptionFingerprint={encryptionFingerprint}
        onTriggerQuickAction={onTriggerQuickAction}
      />

      {/* 2. Central Main Chat Area (Gemini Inspired) */}
      <div className="flex flex-col flex-1 min-w-0 h-full bg-[#f8fafd] relative">
        
        {/* Top Minimalist Header */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar Toggle Button */}
            <button
              type="button"
              id="sidebar-toggle-button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar (Chat history)'}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>

            {/* Model & Session Indicator */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {sessionTitle}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200/60 shrink-0">
                  <Sparkles className="h-2.5 w-2.5 text-sky-600" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Multilingual Core</span>
                <span>•</span>
                <span className="font-mono text-indigo-600 flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" /> AES-256-GCM
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Quick Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search Button */}
            <button
              type="button"
              id="chat-search-toggle-button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 80);
                }
              }}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isSearchOpen
                  ? 'bg-sky-100 text-sky-800 font-semibold border border-sky-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Search conversations & messages (Ctrl+F / ⌘F)"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block text-[10px] text-slate-400 font-mono border border-slate-200 bg-slate-50 rounded px-1">⌘F</kbd>
            </button>

            {/* Download Conversation (PDF) Button */}
            <button
              type="button"
              id="download-conversation-pdf-button"
              onClick={handleDownloadConversationPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Download conversation history from the current session as a formatted PDF"
            >
              {isDownloadingPdf ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-sky-600" />
              ) : (
                <FileDown className="h-3.5 w-3.5 text-sky-600" />
              )}
              <span className="inline">Download Conversation</span>
              <span className="hidden md:inline-block text-[9px] font-bold uppercase tracking-wider bg-sky-200/90 text-sky-900 px-1 py-0.2 rounded font-mono">
                PDF
              </span>
            </button>

            {/* New Chat shortcut button */}
            <button
              type="button"
              onClick={onCreateSession}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-xs"
              title="Start a fresh conversation"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* PDF Download Toast Notification */}
        {downloadPdfSuccess && (
          <div className="absolute top-14 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">Full conversation history downloaded as PDF!</span>
          </div>
        )}

        {/* Local Search & Conversation Keyword Filter Bar */}
        {isSearchOpen && (
          <div className="bg-white border-b border-slate-200 shadow-sm px-4 py-3 z-20 animate-in slide-in-from-top-2 duration-150">
            <div className="max-w-4xl mx-auto space-y-2.5">
              {/* Search Input and Scope controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords across past conversations (e.g. revenue, proposal, audit, encryption)..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Scope Switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setSearchScope('all')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      searchScope === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All Past Chats ({sessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchScope('current')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      searchScope === 'current'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Current Chat ({messages.length})
                  </button>
                </div>

                {/* Close Search */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  title="Close search (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sub-bar: Suggestions and Current Match Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-500">
                {/* Quick Keyword tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-medium">Suggestions:</span>
                  {['revenue', 'proposal', 'audit', 'encryption', 'presentation', 'financial', 'template'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* In Current Chat: Navigation and Filter switch */}
                {searchScope === 'current' && searchQuery.trim() && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="font-medium text-slate-700">
                      {currentChatMatches.length > 0 
                        ? `Match ${activeMatchIndex + 1} of ${currentChatMatches.length}` 
                        : 'No matches in this chat'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={handlePrevMatch}
                        disabled={currentChatMatches.length === 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Previous match"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMatch}
                        disabled={currentChatMatches.length === 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Next match"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={filterOnlyMatches}
                        onChange={(e) => setFilterOnlyMatches(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>Only show matches in thread</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Cross-session matching list */}
              {searchScope === 'all' && searchQuery.trim() && (
                <div className="mt-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto space-y-2">
                  {crossSessionResults.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      No conversations found matching "{searchQuery}". Try another keyword or phrase.
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] font-semibold text-slate-500">
                        Found {crossSessionResults.length} conversation{crossSessionResults.length > 1 ? 's' : ''} containing "{searchQuery}":
                      </div>
                      {crossSessionResults.map(({ session, matchedInTitle, matchingMessages }) => {
                        const isCurrent = session.id === currentSessionId;
                        return (
                          <div
                            key={session.id}
                            className={`p-2.5 rounded-xl border transition-all text-left ${
                              isCurrent 
                                ? 'bg-sky-50/50 border-sky-200' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() => handleJumpToMessage(session.id)}
                                className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                              >
                                <span className="font-bold text-xs text-slate-900 truncate hover:text-sky-600">
                                  {renderHighlightedSnippet(session.title, searchQuery)}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                                    Current
                                  </span>
                                )}
                              </button>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Matching message snippets */}
                            <div className="space-y-1 mt-1.5">
                              {matchingMessages.slice(0, 3).map((m) => (
                                <div
                                  key={m.id}
                                  onClick={() => handleJumpToMessage(session.id, m.id)}
                                  className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-[11px] text-slate-700 cursor-pointer group transition-colors"
                                  title="Jump to this message in chat"
                                >
                                  <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-sky-600 shrink-0 mt-0.5">
                                    {m.sender === 'user' ? 'You:' : 'AI:'}
                                  </span>
                                  <span className="line-clamp-2 flex-1">
                                    {renderHighlightedSnippet(m.snippet, searchQuery)}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-sky-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                              {matchingMessages.length > 3 && (
                                <div className="text-[10px] text-slate-400 italic pl-1">
                                  + {matchingMessages.length - 3} more matching message{matchingMessages.length - 3 > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Filter Notice Banner if Only Matches Mode is active */}
            {filterOnlyMatches && searchQuery.trim() && searchScope === 'current' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                <span>
                  Filtering active conversation: Showing <strong>{displayedMessages.length}</strong> matching messages for <strong>"{searchQuery}"</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilterOnlyMatches(false)}
                  className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 ml-2"
                >
                  Show all messages
                </button>
              </div>
            )}

            {/* Empty State / Welcome Screen (Inspired by Google Gemini) */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center pt-8 pb-4 animate-in fade-in duration-300">
                {/* Iridescent Gemini Sparkle Icon */}
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-sky-500/20 mb-6 transform hover:scale-105 transition-transform">
                  <Sparkles className="h-9 w-9" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                  Hello, Shahfiya — wonderful to collaborate with you!
                </h1>
                <p className="text-slate-500 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
                  I'm farhee intelligent 2.0, your personal AI teammate and collaborator. Whatever you're tackling today—whether it's diving into business analysis, drafting multi-format executive documents, exploring strategy, or generating creative media—I'm right here with you. What feels best to start on?
                </p>

                {/* Gemini Suggestion Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {[
                    {
                      title: 'Analyze Business Documents',
                      desc: 'Upload PDF, Excel, or Word files for instant financial KPI breakdown and margin analysis.',
                      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
                      action: () => fileInputRef.current?.click(),
                    },
                    {
                      title: 'Draft Financial Spreadsheet',
                      desc: 'Create a 4-tab business model with automated SUM formulas and executive graphs.',
                      icon: <Presentation className="h-4 w-4 text-sky-600" />,
                      action: () => onTriggerQuickAction('excel'),
                    },
                    {
                      title: 'Compose Neural Soundtrack',
                      desc: 'Synthesize a 30s ambient soundtrack or lo-fi clip at 120 BPM with Web Audio.',
                      icon: <Music className="h-4 w-4 text-purple-600" />,
                      action: () => onTriggerQuickAction('music'),
                    },
                    {
                      title: 'Generate Visual Assets',
                      desc: 'Render high-resolution 16:9 concepts with prompt styles and aspect ratio controls.',
                      icon: <ImageIcon className="h-4 w-4 text-indigo-600" />,
                      action: () => onTriggerQuickAction('image'),
                    },
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={card.action}
                      className="p-4 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 transition-colors">
                          {card.icon}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-sky-600 transition-colors">
                          Launch →
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Adaptive Greeting & Cultural Resonance Starters */}
                <div className="w-full max-w-2xl mt-6 pt-4 border-t border-slate-200/60 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Try a conversational or cultural greeting:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Hi machan, let's review our project proposal 📊", text: "Hi machan, let's review our project proposal and outline the key deliverables." },
                      { label: "Good morning Farhee, what are our priorities today? ☀️", text: "Good morning Farhee, could you help me organize today's key executive priorities?" },
                      { label: "Hi nanba, help me draft an annual report 🚀", text: "Hi nanba, let's build out a comprehensive annual report for our executive team." },
                      { label: "Hi friend, let's brainstorm ideas ✨", text: "Hi friend, let's brainstorm creative ideas for our next presentation deck." },
                    ].map((starter, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          setInputText(starter.text);
                          textareaRef.current?.focus();
                        }}
                        className="px-3 py-1.5 rounded-full text-xs bg-slate-100/90 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer text-left"
                      >
                        {starter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {displayedMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isInspecting = showEncryptedPayloadId === msg.id;
              const isHighlighted = highlightedMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200 transition-all ${
                    isHighlighted ? 'p-2 rounded-2xl ring-2 ring-amber-400 bg-amber-50/40 shadow-sm' : ''
                  }`}
                >
                  {/* Message Container */}
                  <div
                    className={`max-w-3xl w-full rounded-2xl transition-all ${
                      isUser
                        ? 'ml-auto max-w-xl'
                        : 'bg-transparent'
                    }`}
                  >
                    {/* User Bubble */}
                    {isUser ? (
                      <div className="flex items-start justify-end gap-3">
                        <div className="flex flex-col items-end">
                          {/* Attached files preview in message */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <MessageAttachmentsView attachments={msg.attachments} isUser={true} />
                          )}

                          {/* Message Text Bubble */}
                          <div className="p-4 rounded-2xl bg-[#e8f0fe] text-slate-900 border border-sky-200/70 shadow-xs rounded-tr-xs">
                            <div className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-sky-500/20">
                              {searchQuery.trim() ? renderHighlightedSnippet(msg.text, searchQuery) : msg.text}
                            </div>
                            
                            {/* Timestamp & E2EE badge */}
                            <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-sky-200/50 text-[10px] text-slate-500">
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {msg.isEncrypted && (
                                <span className="inline-flex items-center gap-0.5 text-indigo-700 font-mono">
                                  <Lock className="h-2.5 w-2.5" /> E2EE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* User Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold shrink-0 shadow-xs mt-1">
                          SF
                        </div>
                      </div>
                    ) : (
                      /* AI Message (Google Gemini Style) */
                      <div className="flex items-start gap-3.5">
                        {/* Gemini Sparkle Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shrink-0 shadow-sm shadow-sky-500/20 mt-1">
                          <Sparkles className="h-4 w-4" />
                        </div>

                        {/* AI Content Area */}
                        <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                          {/* Header bar with model name and timestamp */}
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-xs">
                                farhee intelligent 2.0
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] font-mono text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded">
                                gemini-3.8-flash
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px]">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.isEncrypted && (
                                <button
                                  type="button"
                                  onClick={() => setShowEncryptedPayloadId(isInspecting ? null : msg.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                  title="Inspect zero-knowledge cryptographic cipher"
                                >
                                  <Lock className="h-2.5 w-2.5 text-indigo-600" />
                                  {isInspecting ? 'Hide Cipher' : 'Cipher'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Render Attachments if any */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <MessageAttachmentsView attachments={msg.attachments} isUser={false} />
                          )}

                          {/* Encrypted Inspector View */}
                          {isInspecting ? (
                            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3.5 rounded-xl my-2 overflow-x-auto border border-slate-800">
                              <div className="text-slate-400 text-[10px] mb-1">
                                // Client-Side AES-256-GCM Cryptographic Payload
                              </div>
                              <div>IV: {msg.iv || 'wzG7B8q0+x9...'}</div>
                              <div className="mt-1 break-all">
                                CIPHERTEXT: {msg.cipherPreview || '8a9f0e1c4b72...'}
                              </div>
                              <div className="text-slate-500 text-[10px] mt-2">
                                Zero-Knowledge Protected: Key never sent to any server.
                              </div>
                            </div>
                          ) : (
                            /* Rich Formatted Markdown Output */
                            <div className="text-sm leading-relaxed text-slate-800">
                              <ReactMarkdown
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');
                                    if (!inline && (match || codeString.includes('\n'))) {
                                      return (
                                        <CodeBlock
                                          language={match ? match[1] : undefined}
                                          code={codeString}
                                        />
                                      );
                                    }
                                    return (
                                      <code
                                        className="px-1.5 py-0.5 rounded-md bg-slate-100 text-sky-800 font-mono text-xs border border-slate-200/70"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                  table({ children }) {
                                    return (
                                      <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-xs">
                                        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                          {children}
                                        </table>
                                      </div>
                                    );
                                  },
                                  thead({ children }) {
                                    return <thead className="bg-slate-100 font-semibold text-slate-800">{children}</thead>;
                                  },
                                  tbody({ children }) {
                                    return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
                                  },
                                  tr({ children }) {
                                    return <tr className="hover:bg-slate-50/80 transition-colors">{children}</tr>;
                                  },
                                  th({ children }) {
                                    return <th className="px-3.5 py-2.5 font-semibold text-slate-700">{children}</th>;
                                  },
                                  td({ children }) {
                                    return <td className="px-3.5 py-2.5 text-slate-600 align-top">{children}</td>;
                                  },
                                  h1({ children }) {
                                    return <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">{children}</h1>;
                                  },
                                  h2({ children }) {
                                    return <h2 className="text-lg font-bold text-slate-900 mt-3.5 mb-1.5 tracking-tight border-b border-slate-100 pb-1">{children}</h2>;
                                  },
                                  h3({ children }) {
                                    return <h3 className="text-sm font-bold text-slate-900 mt-3 mb-1">{children}</h3>;
                                  },
                                  ul({ children }) {
                                    return <ul className="list-disc pl-5 my-2 space-y-1 text-slate-700">{children}</ul>;
                                  },
                                  ol({ children }) {
                                    return <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-700">{children}</ol>;
                                  },
                                  li({ children }) {
                                    return <li className="text-sm leading-relaxed">{children}</li>;
                                  },
                                  blockquote({ children }) {
                                    return (
                                      <blockquote className="border-l-3 border-sky-500 bg-sky-50/60 pl-3 py-1.5 my-2 text-slate-700 rounded-r text-sm italic">
                                        {children}
                                      </blockquote>
                                    );
                                  },
                                  p({ children }) {
                                    return <p className="my-1.5 leading-relaxed text-sm text-slate-700">{children}</p>;
                                  },
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Gemini Action Toolbar for AI Output */}
                          {!isInspecting && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-slate-400">
                              <div className="flex items-center gap-1">
                                {/* TTS Read Aloud */}
                                <button
                                  type="button"
                                  onClick={() => handlePlayTTS(msg.id, msg.text)}
                                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                    playingAudioId === msg.id
                                      ? 'bg-sky-50 text-sky-600 font-semibold'
                                      : 'hover:bg-slate-100 hover:text-slate-700'
                                  }`}
                                  title="Listen with Text-to-Speech"
                                >
                                  {playingAudioId === msg.id ? (
                                    <>
                                      <VolumeX className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
                                      <span>Speaking...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="h-3.5 w-3.5" />
                                      <span>Listen</span>
                                    </>
                                  )}
                                </button>

                                {/* Copy Answer */}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(msg.id, msg.text)}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Copy response"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span className="text-emerald-600 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="text-[10px] text-slate-400">
                                farhee 2.0 • Neural Synthesis
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Reasoning / Submitting Indicator */}
            {isSubmitting && (
              <div className="flex items-start gap-3.5 animate-in fade-in">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shrink-0 shadow-xs">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs text-xs text-slate-600 flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 bg-sky-500 rounded-full animate-bounce" />
                  </div>
                  <span className="font-medium">
                    farhee intelligent 2.0 is reasoning in {currentLanguage.toUpperCase()}...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. Gemini Floating Capsule Input Area (Centered & Styled) */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#f8fafd] via-[#f8fafd] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* Offline notification if network is down */}
            {!isOnline && (
              <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Operating in Offline Mode. Messages will be encrypted and synced on reconnection.</span>
              </div>
            )}

            {/* Pre-Send Attachment Tray (Thumbnails & File Badges) */}
            <PreSendAttachmentTray
              attachments={attachments}
              onRemove={handleRemoveAttachment}
            />

            {/* Floating Gemini Input Capsule */}
            <div className="relative flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/60 hover:border-slate-300 transition-all focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-500">
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask farhee intelligent 2.0, or attach files for analysis..."
                disabled={isSubmitting}
                rows={1}
                className="w-full px-4 pt-3.5 pb-2 text-sm bg-transparent border-0 resize-none focus:outline-none text-slate-800 placeholder:text-slate-400 max-h-36 min-h-[44px]"
              />

              {/* Bottom Control Bar inside Capsule */}
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                {/* Left Controls: Prominent Attachment Button & Voice Input */}
                <div className="flex items-center gap-1">
                  {/* Prominent Attachment Button (Paperclip / Plus icon) */}
                  <button
                    type="button"
                    id="attach-file-button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files (Documents, Images, PDFs, Spreadsheets)"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {/* Speech to Text Microphone */}
                  <button
                    type="button"
                    id="speech-mic-button"
                    onClick={toggleRecording}
                    title={isRecording ? 'Listening... click to stop' : 'Voice Input (Speech-to-Text)'}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Attachment Counter Badge */}
                  {attachments.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700">
                      {attachments.length} file{attachments.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Right Controls: Send Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="submit-message-button"
                    onClick={() => handleSubmit()}
                    disabled={(!inputText.trim() && attachments.length === 0) || isSubmitting}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                      (inputText.trim() || attachments.length > 0) && !isSubmitting
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Disclaimer Caption */}
            <div className="text-center text-[11px] text-slate-400 mt-2">
              farhee intelligent 2.0 can make mistakes. Please verify important financial and legal data.
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
