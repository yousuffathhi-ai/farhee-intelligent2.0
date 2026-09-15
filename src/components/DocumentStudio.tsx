import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  FileText, 
  FileDown, 
  Download, 
  Lock, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  Eye,
  LayoutTemplate,
  Check,
  Edit3,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { DocumentExport, DocumentType, UserRole } from '../types';
import { 
  sampleBusinessReport, 
  exportToExcel, 
  exportToPdf, 
  exportToPptx, 
  exportToDocx, 
  BusinessReportData 
} from '../lib/exporters';
import { 
  PROFESSIONAL_DOCUMENT_TEMPLATES, 
  DocumentTemplateItem 
} from '../data/documentTemplates';

interface DocumentStudioProps {
  documents: DocumentExport[];
  onSaveDocument: (doc: DocumentExport) => void;
  userRole: UserRole;
  isOnline: boolean;
  onSyncWithCloud: () => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  documents,
  onSaveDocument,
  userRole,
  isOnline,
  onSyncWithCloud,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('annual-report');
  const [reportData, setReportData] = useState<BusinessReportData>(() => {
    const defaultTemplate = PROFESSIONAL_DOCUMENT_TEMPLATES[0];
    return defaultTemplate ? defaultTemplate.data : sampleBusinessReport;
  });
  const [isExporting, setIsExporting] = useState<DocumentType | null>(null);
  const [previewTab, setPreviewTab] = useState<'financial' | 'regional' | 'summary'>('financial');
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  const canExportEnterpriseExcel = userRole === 'admin' || userRole === 'analyst';

  // Handle template selection
  const handleSelectTemplate = (template: DocumentTemplateItem) => {
    setSelectedTemplateId(template.id);
    setReportData(JSON.parse(JSON.stringify(template.data)));
    setTemplateNotice(`Loaded template: "${template.name}"`);
    setTimeout(() => setTemplateNotice(null), 3500);
  };

  const handleExport = async (type: DocumentType) => {
    setIsExporting(type);

    try {
      let blob: Blob;
      let extension: string;

      switch (type) {
        case 'xlsx':
          blob = await exportToExcel(reportData);
          extension = 'xlsx';
          break;
        case 'pdf':
          blob = await exportToPdf(reportData);
          extension = 'pdf';
          break;
        case 'pptx':
          blob = await exportToPptx(reportData);
          extension = 'pptx';
          break;
        case 'docx':
          blob = await exportToDocx(reportData);
          extension = 'docx';
          break;
      }

      // Download directly to client machine
      const fileName = `${reportData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${Date.now()}.${extension}`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();

      // Record in cloud vault & local storage
      const newDoc: DocumentExport = {
        id: 'doc_' + Date.now(),
        name: fileName,
        type,
        category: 'Business Analysis',
        sizeBytes: blob.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        downloadUrl,
        syncStatus: isOnline ? 'synced' : 'pending',
        version: 1,
        encrypted: true,
        metadata: {
          title: reportData.title,
          author: reportData.author,
          recordCount: reportData.financialMetrics.length,
          sheetCount: type === 'xlsx' ? 4 : undefined,
          slideCount: type === 'pptx' ? 5 : undefined,
        },
      };

      onSaveDocument(newDoc);
    } catch (err: any) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const activeTemplate = PROFESSIONAL_DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Enterprise Business Document Studio
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Choose from pre-defined professional templates (Annual Reports, Project Proposals, Audits) 
              or customize records, then compile multi-worksheet Excel models, executive PDFs, PowerPoint decks, and Word files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Excel Button */}
            <button
              id="export-excel-button"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting !== null || !canExportEnterpriseExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title={!canExportEnterpriseExcel ? 'Role restriction: Analyst or Admin required' : 'Generate multi-tab financial Excel'}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{isExporting === 'xlsx' ? 'Compiling...' : 'Export Excel (.xlsx)'}</span>
            </button>

            {/* PDF Button */}
            <button
              id="export-pdf-button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              <span>{isExporting === 'pdf' ? 'Rendering...' : 'Export PDF (.pdf)'}</span>
            </button>

            {/* PPTX Button */}
            <button
              id="export-pptx-button"
              onClick={() => handleExport('pptx')}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all disabled:opacity-40"
            >
              <Presentation className="h-4 w-4" />
              <span>{isExporting === 'pptx' ? 'Building...' : 'Export Slides (.pptx)'}</span>
            </button>

            {/* DOCX Button */}
            <button
              id="export-docx-button"
              onClick={() => handleExport('docx')}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all disabled:opacity-40"
            >
              <FileDown className="h-4 w-4" />
              <span>{isExporting === 'docx' ? 'Packaging...' : 'Export Word (.docx)'}</span>
            </button>
          </div>
        </div>

        {/* Role Warning for Viewers */}
        {!canExportEnterpriseExcel && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
            <span>Role-Based Access Control: You are currently viewing as <strong>Viewer</strong>. To export raw financial Excel models with formulas, switch to <strong>Analyst</strong> or <strong>Admin</strong> in the top navigation.</span>
          </div>
        )}
      </div>

      {/* Pre-Defined Professional Document Templates Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <LayoutTemplate className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Pre-Defined Professional Document Templates
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an industry-standard template before generating your file to instantly prefill executive metrics, financial models, and narratives.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {templateNotice && (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                {templateNotice}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{isCustomizing ? 'Hide Field Editor' : 'Customize Details'}</span>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {PROFESSIONAL_DOCUMENT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            const formatBadgeColor = 
              tmpl.recommendedFormat === 'xlsx' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              tmpl.recommendedFormat === 'pdf' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              tmpl.recommendedFormat === 'pptx' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-sky-50 text-sky-700 border-sky-200';

            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${formatBadgeColor}`}>
                      .{tmpl.recommendedFormat.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                    {tmpl.name}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                    {tmpl.badge}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 hover:text-indigo-600 font-medium">
                      Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Quick Field Editor */}
        {isCustomizing && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                Customize Template Details Prior to Export
              </span>
              <span className="text-slate-500 text-[11px]">Modifications apply immediately to the preview & downloads</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 text-[11px] font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-semibold mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={reportData.company || ''}
                  onChange={(e) => setReportData({ ...reportData, company: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] font-semibold mb-1">Author / Department</label>
                <input
                  type="text"
                  value={reportData.author}
                  onChange={(e) => setReportData({ ...reportData, author: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-[11px] font-semibold mb-1">Executive Summary Narrative</label>
              <textarea
                rows={2}
                value={reportData.executiveSummary}
                onChange={(e) => setReportData({ ...reportData, executiveSummary: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Business Data Model Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Data Table & KPI Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {reportData.title}
                </h3>
                {activeTemplate && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/50">
                    Template: {activeTemplate.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Author: {reportData.author} {reportData.company ? `• ${reportData.company}` : ''}
              </p>
            </div>

            {/* Preview Subtabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs shrink-0">
              <button
                onClick={() => setPreviewTab('financial')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  previewTab === 'financial' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Financials ({reportData.financialMetrics.length} Rows)
              </button>
              <button
                onClick={() => setPreviewTab('regional')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  previewTab === 'regional' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Regional Breakdown
              </button>
              <button
                onClick={() => setPreviewTab('summary')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  previewTab === 'summary' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Executive Narrative
              </button>
            </div>
          </div>

          {/* Tab 1: Financial Model */}
          {previewTab === 'financial' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3 text-right">Revenue ($)</th>
                    <th className="py-2.5 px-3 text-right">COGS ($)</th>
                    <th className="py-2.5 px-3 text-right">Gross Profit</th>
                    <th className="py-2.5 px-3 text-right">OpEx</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Income</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.financialMetrics.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.month}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">${row.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">${row.cogs.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600">${row.grossProfit.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">${row.opex.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">${row.netIncome.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-sky-600">{row.marginPct}%</td>
                    </tr>
                  ))}
                  {/* Totals / Averages Row */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 text-slate-900">Total / Avg</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ${reportData.financialMetrics.reduce((a, b) => a + b.revenue, 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ${reportData.financialMetrics.reduce((a, b) => a + b.cogs, 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      ${reportData.financialMetrics.reduce((a, b) => a + b.grossProfit, 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ${reportData.financialMetrics.reduce((a, b) => a + b.opex, 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                      ${reportData.financialMetrics.reduce((a, b) => a + b.netIncome, 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-700">
                      {(reportData.financialMetrics.reduce((a, b) => a + b.marginPct, 0) / reportData.financialMetrics.length).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Regional Model */}
          {previewTab === 'regional' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Operating Region</th>
                    <th className="py-2.5 px-3 text-right">Revenue ($)</th>
                    <th className="py-2.5 px-3 text-right">YoY Growth %</th>
                    <th className="py-2.5 px-3 text-right">Market Share</th>
                    <th className="py-2.5 px-3 text-right">Headcount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.regionalData.map((reg) => (
                    <tr key={reg.region} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{reg.region}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">${reg.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">+{reg.growthPct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{reg.marketSharePct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">{reg.headcount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Narrative */}
          {previewTab === 'summary' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed">
                <h4 className="font-bold text-slate-900 mb-2">Executive Summary</h4>
                <p>{reportData.executiveSummary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Strategic Next Steps</h4>
                <ul className="space-y-2">
                  {reportData.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Right Info Card: E2EE & Cloud Vault Metadata */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                End-to-End Encryption
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Every generated Excel workbook, PDF report, presentation, and document is 
                packaged with an AES-256-GCM verification seal before storage.
              </p>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] font-mono text-indigo-900 space-y-1">
                <div>Cipher: AES-GCM (256-bit)</div>
                <div>Hash: PBKDF2 (100k iters)</div>
                <div>Sync Strategy: Last-Write-Wins</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Cloud Vault Sync:</span>
                <span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isOnline ? 'Continuous Active' : 'Preserved Locally'}
                </span>
              </div>
              <button
                onClick={onSyncWithCloud}
                disabled={!isOnline}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                Re-sync Local Vault with Cloud
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Exported Documents Vault List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Exported Vault Documents ({documents.length})
          </h3>
          <span className="text-xs text-slate-500">
            {documents.filter((d) => d.syncStatus === 'synced').length} synced to secure cloud
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No business documents generated yet. Click an export button above to compile your first report.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const Icon = doc.type === 'xlsx' 
                ? FileSpreadsheet 
                : doc.type === 'pdf' 
                ? FileText 
                : doc.type === 'pptx' 
                ? Presentation 
                : FileDown;

              const badgeColor = doc.type === 'xlsx'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : doc.type === 'pdf'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : doc.type === 'pptx'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-sky-50 text-sky-700 border-sky-200';

              return (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${badgeColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{doc.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-indigo-600 font-medium">
                          <Lock className="h-3 w-3" /> E2EE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      doc.syncStatus === 'synced'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {doc.syncStatus === 'synced' ? 'Cloud Synced' : 'Local Vault'}
                    </span>

                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        download={doc.name}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Re-download File"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
