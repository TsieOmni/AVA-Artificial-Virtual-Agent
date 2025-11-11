import React, { useState } from 'react';
import { XMarkIcon } from './Icons';

interface CookiePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-indigo-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const CookiePreferenceRow: React.FC<{ title: string; children: React.ReactNode; toggleState: boolean; onToggle: (state: boolean) => void; alwaysActive?: boolean; }> = ({ title, children, toggleState, onToggle, alwaysActive }) => (
    <div className="py-4 border-b border-zinc-700/50">
        <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold text-white">{title} {alwaysActive && <span className="text-sm font-normal text-zinc-400">(always active)</span>}</h3>
            <ToggleSwitch enabled={toggleState} onChange={onToggle} disabled={alwaysActive} />
        </div>
        <p className="text-zinc-400 text-sm">{children}</p>
    </div>
);


const CookiePreferenceModal: React.FC<CookiePreferenceModalProps> = ({ isOpen, onClose }) => {
  // In a real app, this state would be tied to a cookie management service.
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-900 text-white w-full max-w-2xl max-h-[95vh] flex flex-col rounded-2xl border border-zinc-800 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-center">Cookie Preference Center</h2>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
            <p className="text-zinc-400 text-sm mb-4">
                Using websites and apps involves storing and retrieving information from your device, including cookies and other identifiers, which can be shared with third parties, for various activities. We provide a simple tool below allowing you to tailor your choices as you deem fit. You can change your consent at any time.{' '}
                <a href="#" className="text-indigo-400 hover:underline">Learn more.</a>
            </p>
            
            <CookiePreferenceRow 
                title="Strictly Necessary Cookies"
                toggleState={true}
                onToggle={() => {}} // No-op
                alwaysActive={true}
            >
                These cookies are essential for the site to function and cannot be toggled off. They assist with security, user authentication, customer support, etc.
            </CookiePreferenceRow>

             <CookiePreferenceRow 
                title="Analytics Cookies"
                toggleState={analyticsEnabled}
                onToggle={setAnalyticsEnabled}
            >
                These cookies help us understand how visitors interact with our site. They allow us to measure traffic and improve site performance.
            </CookiePreferenceRow>

             <CookiePreferenceRow 
                title="Marketing Performance Cookies"
                toggleState={marketingEnabled}
                onToggle={setMarketingEnabled}
            >
                These cookies help us measure the effectiveness of our marketing campaigns.
            </CookiePreferenceRow>
        </div>

         <div className="p-6 mt-auto border-t border-zinc-700/50 flex-shrink-0 flex justify-end">
            <button 
                onClick={onClose} 
                className="font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white py-2 px-6 rounded-md transition-colors"
            >
                Confirm My Choices
            </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferenceModal;
