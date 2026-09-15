import React, { useState } from 'react';
import { 
  Cloud, 
  CloudRain, 
  Lock, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  FileText, 
  Key, 
  Download,
  Flame
} from 'lucide-react';
import { DocumentExport, SyncAuditLog, UserRole } from '../types';

interface CloudVaultProps {
  documents: DocumentExport[];
  syncLogs: SyncAuditLog[];
  isOnline: boolean;
  onToggleOnline: () => void;
  isSyncing: boolean;
  onSync: () => void;
  encryptionFingerprint: string;
  userRole: UserRole;
  onSimulateConflict: () => void;
}

export const CloudVault: React.FC<CloudVaultProps> = ({
  documents,
  syncLogs,
  isOnline,
  onToggleOnline,
  isSyncing,
  onSync,
  encryptionFingerprint,
  userRole,
  onSimulateConflict,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentExport | null>(null);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Cloud className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Encrypted Cloud Storage & LWW Sync Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              All documents, database entries, and session logs are sealed with client-side AES-256-GCM encryption.
              The offline vault functions continuously without internet connectivity and reconciles via Last-Write-Wins (LWW) timestamps upon connection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="vault-simulate-conflict-btn"
              onClick={onSimulateConflict}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
              title="Test Last-Write-Wins (LWW) Conflict Resolution"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Simulate Conflict</span>
            </button>

            <button
              id="vault-sync-now-btn"
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Reconciling...' : 'Sync Cloud Vault'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Status Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Connection & Mode */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Network State</span>
            <button
              onClick={onToggleOnline}
              className="text-[11px] font-semibold text-sky-600 hover:underline"
            >
              Toggle
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-base font-bold text-slate-900">
              {isOnline ? 'Active Cloud Gateway' : 'Offline Vault Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isOnline
              ? 'Real-time WebSocket & REST synchronization enabled.'
              : 'Working in local isolated vault. Edits safely stored in local browser cache.'}
          </p>
        </div>

        {/* E2EE Zero Knowledge */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Zero-Knowledge E2EE</span>
            <Lock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900">
            AES-256-GCM
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
            Key Hash: {encryptionFingerprint}
          </div>
        </div>

        {/* LWW Conflict Strategy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Reconciliation Logic</span>
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-base font-bold text-slate-900">
            Last-Write-Wins (LWW)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Millisecond timestamps resolve distributed branch updates deterministically.
          </p>
        </div>

      </div>

      {/* Cloud Documents Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Stored Encrypted Cloud Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Vault is empty. Create business documents or chat files to see them stored securely.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                  <th className="py-2.5 px-3">Last Modified</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <Lock className="h-3 w-3 text-indigo-500" />
                      <span>{doc.name}</span>
                    </td>
                    <td className="py-2.5 px-3 uppercase font-mono text-[11px] text-slate-600">{doc.type}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(doc.updatedAt).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.syncStatus === 'synced'
                          ? 'bg-emerald-50 text-emerald-700'
                          : doc.syncStatus === 'conflict-resolved'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        <CheckCircle2 className="h-3 w-3" />
                        {doc.syncStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          download={doc.name}
                          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Get</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync & Conflict Audit Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Conflict Resolution & Sync Audit Trail (LWW)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {syncLogs.length} audit events
          </span>
        </div>

        {syncLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No synchronization conflicts logged yet. Click "Simulate Conflict" above to test the resolution engine.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{log.action}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {log.strategy}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.detail}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    log.winner === 'client' ? 'text-emerald-600' : log.winner === 'cloud' ? 'text-sky-600' : 'text-slate-500'
                  }`}>
                    Winner: {log.winner.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
