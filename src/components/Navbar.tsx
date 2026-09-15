import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  KeyRound, 
  UserCheck, 
  RefreshCw, 
  Languages, 
  Sparkles,
  Lock
} from 'lucide-react';
import { UserRole, SupportedLanguage, LanguageInfo } from '../types';

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
];

interface NavbarProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  pendingSyncCount: number;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  is2FAEnabled: boolean;
  onOpen2FAModal: () => void;
  encryptionFingerprint: string;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  isOnline,
  onToggleOnline,
  isSyncing,
  onManualSync,
  pendingSyncCount,
  userRole,
  onRoleChange,
  is2FAEnabled,
  onOpen2FAModal,
  encryptionFingerprint,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  farhee intelligent 2.0
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20">
                  <Sparkles className="h-3 w-3" />
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Multilingual AI Suite • E2EE Encrypted Vault
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'chat', label: 'Chat Assistant' },
              { id: 'images', label: 'Image Studio' },
              { id: 'music', label: 'Music Studio' },
              { id: 'documents', label: 'Business Docs' },
              { id: 'dashboard', label: 'Analytics' },
              { id: 'vault', label: 'Cloud Vault' },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Control Bar: Language, Security, Offline, Role */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative inline-flex items-center">
              <Languages className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                id="language-selector"
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="h-8 pl-7 pr-3 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Offline / Online Toggle */}
            <button
              id="offline-toggle-button"
              onClick={onToggleOnline}
              title={isOnline ? 'Online Mode (Click to simulate offline)' : 'Offline Mode (Working locally)'}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  <span className="hidden md:inline">Offline Mode</span>
                </>
              )}
            </button>

            {/* Cloud Sync Button */}
            <button
              id="manual-sync-button"
              onClick={onManualSync}
              disabled={isSyncing || !isOnline}
              title="Sync local changes to cloud with Last-Write-Wins resolution"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingSyncCount > 0 ? (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px]">
                  {pendingSyncCount}
                </span>
              ) : (
                <span className="hidden sm:inline">Sync</span>
              )}
            </button>

            {/* E2EE Lock Indicator */}
            <div
              title={`End-to-End Encryption AES-256-GCM Active. Key Fingerprint: ${encryptionFingerprint}`}
              className="hidden sm:inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700"
            >
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-[11px] font-mono">{encryptionFingerprint.slice(0, 8)}...</span>
            </div>

            {/* 2FA Status Button */}
            <button
              id="two-factor-auth-button"
              onClick={onOpen2FAModal}
              title="Manage Two-Factor Authentication (2FA) & Recovery Keys"
              className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                is2FAEnabled
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{is2FAEnabled ? '2FA Enabled' : 'Enable 2FA'}</span>
            </button>

            {/* Role Switcher (RBAC) */}
            <div className="relative inline-flex items-center">
              <UserCheck className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-400" />
              <select
                id="role-selector"
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="h-8 pl-6 pr-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="admin">Admin (Full)</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100">
          {[
            { id: 'chat', label: 'Chat' },
            { id: 'images', label: 'Images' },
            { id: 'music', label: 'Music' },
            { id: 'documents', label: 'Documents' },
            { id: 'dashboard', label: 'Analytics' },
            { id: 'vault', label: 'Cloud Vault' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1 text-xs font-medium whitespace-nowrap rounded-lg ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-600 bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
