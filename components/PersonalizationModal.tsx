import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

export interface PersonalizationSettings {
  tone: 'default' | 'cynic' | 'listener' | 'nerd';
  customInstructions: string;
  instructionTags: string[];
  shareLocation: boolean;
  locationStatus: 'idle' | 'loading' | 'success' | 'error';
  occupation: string;
  referenceMemories: boolean;
  referenceHistory: boolean;
}

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PersonalizationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PersonalizationSettings>>;
}

const TONES = {
  default: { title: 'Default', description: 'Cheerful and adaptive' },
  cynic: { title: 'Cynic', description: 'Critical and sarcastic' },
  listener: { title: 'Listener', description: 'Thoughtful and supportive' },
  nerd: { title: 'Nerd', description: 'Exploratory and enthusiastic' },
};

const TAGS = ['Chatty', 'Witty', 'Straight shooting', 'Encouraging', 'Gen Z', 'Formal', 'Strategy', 'Gen Y'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-4 border-b border-slate-200 dark:border-slate-700/50">
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">{title}</h3>
    {children}
  </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-indigo-600' : 'bg-slate-500 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900`}
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


const PersonalizationModal: React.FC<PersonalizationModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);
  
  const handleSaveAbout = () => {
    setSettings(prev => ({
        ...prev,
        shareLocation: localSettings.shareLocation,
        occupation: localSettings.occupation,
        locationStatus: localSettings.locationStatus,
    }));
    // Maybe show a toast "Saved!"
  };
  
  const handleLocationToggle = (enabled: boolean) => {
    setLocalSettings(prev => ({...prev, shareLocation: enabled}));
    if (enabled) {
        setLocalSettings(prev => ({...prev, locationStatus: 'loading'}));
        navigator.geolocation.getCurrentPosition(
            () => {
                setLocalSettings(prev => ({...prev, locationStatus: 'success'}));
            },
            () => {
                setLocalSettings(prev => ({...prev, locationStatus: 'error', shareLocation: false}));
            }
        );
    } else {
        setLocalSettings(prev => ({...prev, locationStatus: 'idle'}));
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = localSettings.instructionTags.includes(tag)
      ? localSettings.instructionTags.filter(t => t !== tag)
      : [...localSettings.instructionTags, tag];
    setSettings(prev => ({...prev, instructionTags: newTags}));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="text-2xl font-bold">Personalization</h2>
          <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-2 p-6 overflow-y-auto">
          <Section title="Base style and tone">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(TONES).map(([key, { title, description }]) => (
                <button 
                  key={key}
                  onClick={() => setSettings(prev => ({...prev, tone: key as PersonalizationSettings['tone']}))}
                  className={`p-4 rounded-lg text-left border-2 transition-colors ${settings.tone === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                >
                  <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Custom instructions">
            <textarea
              value={settings.customInstructions}
              onChange={(e) => setSettings(prev => ({...prev, customInstructions: e.target.value}))}
              placeholder="Use simple language and spell in South African English when responding"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
                {TAGS.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${localSettings.instructionTags.includes(tag) ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
          </Section>

          <Section title="About you">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-800 dark:text-white">Location</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {localSettings.shareLocation && localSettings.locationStatus === 'success' && 'Location successfully shared.'}
                            {localSettings.shareLocation && localSettings.locationStatus === 'loading' && 'Accessing location...'}
                             {localSettings.shareLocation && localSettings.locationStatus === 'error' && 'Could not access location.'}
                            {!localSettings.shareLocation && 'Share your location for better results.'}
                        </p>
                    </div>
                    <ToggleSwitch enabled={localSettings.shareLocation} onChange={handleLocationToggle} />
                </div>
                 <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tell me more about yourself</label>
                    <input
                        id="occupation"
                        type="text"
                        value={localSettings.occupation}
                        onChange={e => setLocalSettings(prev => ({...prev, occupation: e.target.value}))}
                        placeholder="Tell me more about you so I can be able to assist you. e.g Occupation, What do you do etc"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSaveAbout} className="font-medium bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors">
                        Save
                    </button>
                </div>
            </div>
          </Section>

          <Section title="Memory">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-800 dark:text-white">Reference saved memories</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Allow AI to use your saved notes and files.</p>
                    </div>
                    <ToggleSwitch enabled={settings.referenceMemories} onChange={(val) => setSettings(prev => ({...prev, referenceMemories: val}))} />
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-800 dark:text-white">Reference chat history</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Allow AI to use past conversations to improve.</p>
                    </div>
                    <ToggleSwitch enabled={settings.referenceHistory} onChange={(val) => setSettings(prev => ({...prev, referenceHistory: val}))} />
                </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default PersonalizationModal;