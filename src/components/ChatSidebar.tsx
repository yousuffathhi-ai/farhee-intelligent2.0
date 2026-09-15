import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeft,
  Sparkles, 
  ShieldCheck, 
  Clock,
  Layers,
  FileSpreadsheet,
  Image as ImageIcon,
  Music
} from 'lucide-react';
import { ConversationSession, UserRole } from '../types';

interface ChatSidebarProps {
  sessions: ConversationSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole: UserRole;
  encryptionFingerprint: string;
  onTriggerQuickAction: (actionType: 'excel' | 'pptx' | 'image' | 'music') => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onToggle,
  userRole,
  encryptionFingerprint,
  onTriggerQuickAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  // Group sessions by date with deep keyword filtering across title, messages, and attachments
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesTitle = s.title.toLowerCase().includes(q);
    const matchesMessages = s.messages.some((m) =>
      m.text.toLowerCase().includes(q) ||
      m.attachments?.some((a) => a.name.toLowerCase().includes(q))
    );
    return matchesTitle || matchesMessages;
  });

  const groups: { label: string; items: ConversationSession[] }[] = [
    {
      label: 'Today',
      items: filteredSessions.filter((s) => now - s.updatedAt < oneDay),
    },
    {
      label: 'Yesterday',
      items: filteredSessions.filter(
        (s) => now - s.updatedAt >= oneDay && now - s.updatedAt < 2 * oneDay
      ),
    },
    {
      label: 'Previous 7 Days',
      items: filteredSessions.filter(
        (s) => now - s.updatedAt >= 2 * oneDay && now - s.updatedAt < 7 * oneDay
      ),
    },
    {
      label: 'Older',
      items: filteredSessions.filter((s) => now - s.updatedAt >= 7 * oneDay),
    },
  ].filter((g) => g.items.length > 0);

  const handleStartRename = (session: ConversationSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitleText.trim()) {
      onRenameSession(id, editTitleText.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-[#f0f4f9] border-r border-slate-200/80 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-72 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
        }`}
      >
        {/* Top Header & + New Chat */}
        <div className="p-3.5 space-y-2.5 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                Conversations
              </span>
            </div>

            {/* Mobile Close Button / Desktop Collapse Button */}
            <button
              type="button"
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Gemini Style "+ New Chat" Button */}
          <button
            type="button"
            id="sidebar-new-chat-button"
            onClick={() => {
              onCreateSession();
              // On mobile, auto-close after creating
              if (window.innerWidth < 768) onToggle();
            }}
            className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs border border-slate-200 shadow-xs hover:shadow-sm hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-sky-600 group-hover:rotate-90 transition-transform duration-200" />
              <span>New chat</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">⌘K</span>
          </button>

          {/* Search Conversations Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-white/80 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {groups.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {searchQuery ? 'No matching conversations' : 'No past conversations'}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                {group.items.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const isEditing = editingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 768) onToggle();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#d3e3fd] text-[#041e49] font-semibold'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isActive ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(session.id, e)}
                            className="flex items-center gap-1 flex-1 min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              className="w-full h-6 px-1.5 text-xs bg-white border border-sky-400 rounded focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={(e) => handleSaveRename(session.id, e)}
                              className="p-1 hover:text-emerald-600"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <span className="truncate" title={session.title}>
                            {session.title || 'Untitled chat'}
                          </span>
                        )}
                      </div>

                      {/* Action buttons (Rename & Delete) */}
                      {!isEditing && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(session, e)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-300/60"
                            title="Rename chat"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer: Quick Studio Links & Security Info */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-100/70 space-y-2">
          {/* Quick Studio Triggers */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onTriggerQuickAction('excel')}
              className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200/70 text-slate-600 hover:text-emerald-700 transition-all text-[10px]"
              title="Open Document Studio"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mb-0.5" />
              <span>Docs</span>
            </button>
            <button
              type="button"
              onClick={() => onTriggerQuickAction('image')}
              className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200/70 text-slate-600 hover:text-indigo-700 transition-all text-[10px]"
              title="Open Image Studio"
            >
              <ImageIcon className="h-3.5 w-3.5 text-indigo-600 mb-0.5" />
              <span>Images</span>
            </button>
            <button
              type="button"
              onClick={() => onTriggerQuickAction('music')}
              className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white hover:bg-purple-50 border border-slate-200/70 text-slate-600 hover:text-purple-700 transition-all text-[10px]"
              title="Open Music Studio"
            >
              <Music className="h-3.5 w-3.5 text-purple-600 mb-0.5" />
              <span>Music</span>
            </button>
          </div>

          {/* User & Security Status */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold uppercase tracking-wider text-slate-700">
                {userRole}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-indigo-600">
              <ShieldCheck className="h-3 w-3" />
              <span>{encryptionFingerprint.slice(0, 6)}...</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
