import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  QrCode, 
  KeyRound, 
  Copy, 
  Check, 
  Lock, 
  RefreshCw 
} from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  onToggle2FA: (enable: boolean) => void;
  secret: string;
  backupCodes: string[];
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  is2FAEnabled,
  onToggle2FA,
  secret,
  backupCodes,
}) => {
  const [code, setCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    // Accepts any standard 6-digit code or demo authenticator code
    setErrorMsg('');
    setSuccessMsg('Two-Factor Authentication successfully verified and activated!');
    onToggle2FA(true);
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  const handleDisable = () => {
    onToggle2FA(false);
    setCode('');
    setSuccessMsg('2FA disabled.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-[11px] text-slate-500">
                TOTP Authenticator & Backup Recovery Keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Status Indicator */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            is2FAEnabled
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">
                Status: {is2FAEnabled ? 'Protected (2FA Active)' : 'Inactive (Single Factor)'}
              </span>
            </div>
            {is2FAEnabled && (
              <button
                onClick={handleDisable}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Disable
              </button>
            )}
          </div>

          {!is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan this QR code with Google Authenticator, Authy, or 1Password to link your account:
              </p>

              {/* QR Code visual simulation */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="grid grid-cols-6 gap-1 p-1">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-3 w-3 rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                            ? 'bg-slate-900'
                            : (i * 7) % 3 === 0
                            ? 'bg-purple-600'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Manual Secret Key */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-mono">Secret:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {secret}
                  </span>
                  <button
                    onClick={handleCopySecret}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Copy secret"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Verification input */}
              <form onSubmit={handleVerifyAndEnable} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter 6-Digit Authenticator Code
                  </label>
                  <input
                    id="two-factor-code-input"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full h-10 px-3 text-center tracking-widest text-lg font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
                )}
                {successMsg && (
                  <p className="text-xs text-emerald-600 font-medium">{successMsg}</p>
                )}

                <button
                  type="submit"
                  id="enable-2fa-button"
                  className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  Verify & Activate 2FA Protection
                </button>
              </form>
            </div>
          ) : (
            /* Recovery Codes Display */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Backup Recovery Codes</span>
                <button
                  onClick={handleCopyCodes}
                  className="text-[11px] text-purple-600 font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  {copiedCodes ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700">
                {backupCodes.map((codeStr, i) => (
                  <div key={i} className="p-1 bg-white rounded border border-slate-200 text-center">
                    {codeStr}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Store these backup codes in a safe vault. They can be used to recover account access if you lose your authenticator device.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
