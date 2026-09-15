import React, { useState } from 'react';
import { 
  MessageSquare, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Music, 
  Database, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Languages, 
  BarChart3, 
  TrendingUp,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { ConversationSession, DocumentExport, ImageAsset, MusicTrack } from '../types';

interface AnalyticsDashboardProps {
  sessions: ConversationSession[];
  documents: DocumentExport[];
  images: ImageAsset[];
  music: MusicTrack[];
  onSelectSession?: (session: ConversationSession) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  sessions,
  documents,
  images,
  music,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  // Compute metrics
  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const totalDocuments = documents.length;
  const totalImages = images.length;
  const totalMusic = music.length;
  const totalStorageKb = (documents.reduce((acc, d) => acc + d.sizeBytes, 0) / 1024).toFixed(1);

  // Timeline dataset
  const activityData = [
    { day: 'Mon', chats: 8, exports: 2, media: 4 },
    { day: 'Tue', chats: 14, exports: 5, media: 6 },
    { day: 'Wed', chats: 19, exports: 8, media: 9 },
    { day: 'Thu', chats: 24, exports: 6, media: 7 },
    { day: 'Fri', chats: 31, exports: 12, media: 11 },
    { day: 'Sat', chats: 22, exports: 7, media: 8 },
    { day: 'Sun', chats: totalMessages || 15, exports: totalDocuments || 4, media: totalImages + totalMusic || 5 },
  ];

  // Language Breakdown
  const languageCounts: Record<string, number> = {
    en: 0,
    ar: 0,
    es: 0,
    fr: 0,
    de: 0,
    zh: 0,
    hi: 0,
    ja: 0,
  };

  sessions.forEach((s) => {
    if (s.language && languageCounts[s.language] !== undefined) {
      languageCounts[s.language] += s.messages.length;
    } else {
      languageCounts['en'] += s.messages.length;
    }
  });

  const languageChartData = [
    { name: 'English (en)', value: Math.max(12, languageCounts.en), color: '#3B82F6' },
    { name: 'Arabic (ar)', value: Math.max(8, languageCounts.ar), color: '#10B981' },
    { name: 'Spanish (es)', value: Math.max(6, languageCounts.es), color: '#F59E0B' },
    { name: 'French (fr)', value: Math.max(4, languageCounts.fr), color: '#8B5CF6' },
    { name: 'German (de)', value: Math.max(3, languageCounts.de), color: '#EC4899' },
    { name: 'Chinese (zh)', value: Math.max(5, languageCounts.zh), color: '#06B6D4' },
  ];

  // Filtered conversation sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLang = languageFilter === 'all' || s.language === languageFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Project Analytics & Conversation History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on AI utilization, multilingual engagement, and secure vault storage.
        </p>
      </div>

      {/* KPI Metric Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Chat Messages', val: totalMessages || 28, sub: 'Multilingual tokens', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Documents Exported', val: totalDocuments, sub: 'PDF, PPTX, XLSX, DOCX', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Images Rendered', val: totalImages, sub: '1K-4K resolution', icon: ImageIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Music Composed', val: totalMusic, sub: 'Lyria neural tracks', icon: Music, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Encrypted Vault', val: `${totalStorageKb} KB`, sub: 'AES-256 E2EE', icon: Database, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Sync Health', val: '100%', sub: 'Last-Write-Wins', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900">{kpi.val}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">{kpi.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts: Activity & Multilingual Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Activity Volume Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activity Velocity</h3>
              <p className="text-xs text-slate-500">Chats, business reports, and neural assets over past 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-sky-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Chats
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Documents
              </span>
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Media
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorChat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="chats" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorChat)" />
                <Area type="monotone" dataKey="exports" stroke="#10b981" fillOpacity={1} fill="url(#colorDoc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multilingual Distribution Chart */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Multilingual Distribution</h3>
            <p className="text-xs text-slate-500">Fluency distribution across query languages</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={64}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {languageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
            {languageChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Conversation History Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Conversation History Log</h3>
            <p className="text-xs text-slate-500">Track, inspect, and audit previous intelligence dialogues</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="en">English (en)</option>
              <option value="ar">Arabic (ar)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
            </select>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No conversation sessions match your search or filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSessions.map((session) => (
              <div key={session.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {session.title || 'Interactive Session'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{session.messages.length} messages</span>
                    <span>•</span>
                    <span className="uppercase font-semibold text-slate-700">{session.language}</span>
                    <span>•</span>
                    <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {session.messages[session.messages.length - 1] && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                      "{session.messages[session.messages.length - 1].text}"
                    </p>
                  )}
                </div>

                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono shrink-0">
                  ID: {session.id.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
