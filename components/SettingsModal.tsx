

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon } from './Icons';

export interface AppSettings {
  appearance: 'system' | 'light' | 'dark';
  accentColor: 'default' | 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  language: string;
  spokenLanguage: string;
  voice: string;
  multiFactorAuth: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const ACCENT_COLORS: { [key in AppSettings['accentColor']]: string } = {
    default: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-6">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
);
  
const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode; }> = ({ label, description, children }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-700/50">
      <div>
        <p className="text-slate-800 dark:text-white">{label}</p>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
);

const Dropdown: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; }> = ({ value, onChange, children }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-slate-200/50 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-indigo-600' : 'bg-slate-500 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800`}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    
    useEffect(() => {
        if (!isOpen) return;
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              setAvailableVoices(voices);
              // Set a default voice if the current one isn't available
              if (!voices.some(v => v.name === settings.voice)) {
                  const defaultVoice = voices.find(v => v.lang.startsWith('en') && v.default) || voices[0];
                  if(defaultVoice) handleSettingChange('voice', defaultVoice.name);
              }
            }
        };

        loadVoices();
        // Voices are loaded asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;
        
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setSettings(prev => ({...prev, [key]: value}));
    };

    const handlePlayVoice = () => {
        if (!settings.voice || typeof window.speechSynthesis === 'undefined') return;

        window.speechSynthesis.cancel(); // Stop any currently playing speech
        const utterance = new SpeechSynthesisUtterance("Hello, this is the selected voice.");
        const selectedVoice = availableVoices.find(v => v.name === settings.voice);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <div 
            className="bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
            style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-2 p-6 overflow-y-auto">
                <Section title="General">
                    <SettingRow label="Appearance">
                        <Dropdown value={settings.appearance} onChange={e => handleSettingChange('appearance', e.target.value)}>
                           <option value="system">System</option>
                           <option value="light">Light</option>
                           <option value="dark">Dark</option>
                        </Dropdown>
                    </SettingRow>
                    <SettingRow label="Accent color">
                         <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full ${ACCENT_COLORS[settings.accentColor]}`}></div>
                            <Dropdown value={settings.accentColor} onChange={e => handleSettingChange('accentColor', e.target.value)}>
                               {Object.keys(ACCENT_COLORS).map(color => (
                                   <option key={color} value={color} className="capitalize">{color}</option>
                               ))}
                            </Dropdown>
                        </div>
                    </SettingRow>
                    <SettingRow label="Language">
                        <Dropdown value={settings.language} onChange={e => handleSettingChange('language', e.target.value)}>
                           <option value="auto">Auto-detect</option>
                           <option value="en">English</option>
                           <option value="af">Afrikaans</option>
                           <option value="xh">isiXhosa</option>
                           <option value="zu">isiZulu</option>
                           <option value="st">Sesotho</option>
                           <option value="sw">Kiswahili</option>
                           <option value="yo">Yoruba</option>
                           <option value="ig">Igbo</option>
                           <option value="ha">Hausa</option>
                           <option value="es">Español</option>
                           <option value="fr">Français</option>
                        </Dropdown>
                    </SettingRow>
                     <SettingRow label="Spoken language" description="For best results, select the language you mainly speak.">
                        <Dropdown value={settings.spokenLanguage} onChange={e => handleSettingChange('spokenLanguage', e.target.value)}>
                           <option value="auto">Auto-detect</option>
                           <option value="en-US">English (US)</option>
                           <option value="en-GB">English (UK)</option>
                           <option value="en-ZA">English (South Africa)</option>
                           <option value="af-ZA">Afrikaans (South Africa)</option>
                           <option value="zu-ZA">isiZulu (South Africa)</option>
                           <option value="xh-ZA">isiXhosa (South Africa)</option>
                           <option value="st-ZA">Sesotho (South Africa)</option>
                           <option value="sw-KE">Kiswahili (Kenya)</option>
                           <option value="yo-NG">Yoruba (Nigeria)</option>
                           <option value="ig-NG">Igbo (Nigeria)</option>
                           <option value="ha-NG">Hausa (Nigeria)</option>
                           <option value="es-ES">Español (España)</option>
                           <option value="fr-FR">Français (France)</option>
                        </Dropdown>
                    </SettingRow>
                     <SettingRow label="Voice">
                         <button onClick={handlePlayVoice} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600/80 text-slate-800 dark:text-white py-1.5 px-4 rounded-md transition-colors text-sm font-medium">
                            <PlayIcon className="w-4 h-4" />
                            Play
                         </button>
                        <Dropdown value={settings.voice} onChange={e => handleSettingChange('voice', e.target.value)}>
                           {availableVoices.length > 0 ? (
                             availableVoices.map(voice => (
                               <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>
                             ))
                           ) : (
                             <option value="">Loading voices...</option>
                           )}
                        </Dropdown>
                    </SettingRow>
                </Section>
                <Section title="Security">
                     <SettingRow label="Multi-factor Authentication">
                        <ToggleSwitch enabled={settings.multiFactorAuth} onChange={(val) => handleSettingChange('multiFactorAuth', val)} />
                    </SettingRow>
                </Section>
                 <Section title="About">
                    <SettingRow label="Version">
                        <span className="text-sm text-slate-500 dark:text-slate-400">1.0.0</span>
                    </SettingRow>
                     <SettingRow label="Terms of Use">
                        <a href="#" className="text-sm text-indigo-500 hover:underline">Read terms</a>
                    </SettingRow>
                     <SettingRow label="Privacy Policy">
                        <a href="#" className="text-sm text-indigo-500 hover:underline">Read policy</a>
                    </SettingRow>
                </Section>
            </div>
          </div>
        </div>
    );
};

export default SettingsModal;