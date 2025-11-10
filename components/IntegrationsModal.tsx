import React from 'react';
import { XMarkIcon, DocumentArrowUpIcon, EnvelopeIcon, PresentationChartBarIcon, CalendarDaysIcon } from './Icons';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTEGRATIONS = [
    {
        name: 'Google Drive',
        description: 'Import/export files directly.',
        icon: <DocumentArrowUpIcon className="w-6 h-6 text-green-500" />
    },
    {
        name: 'Gmail',
        description: 'Generate or summarize work emails.',
        icon: <EnvelopeIcon className="w-6 h-6 text-red-500" />
    },
    {
        name: 'Google Calendar',
        description: 'Schedule lessons or meetings.',
        icon: <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
    },
    {
        name: 'Sheets / Docs',
        description: 'Generate structured reports or lesson outlines.',
        icon: <PresentationChartBarIcon className="w-6 h-6 text-yellow-500" />
    }
]

const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="text-2xl font-bold">Live Workspace Integration</h2>
          <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Goal</h3>
                <p className="text-slate-500 dark:text-slate-400">Connect to your existing workflow tools.</p>
            </div>

            <div className="space-y-4">
                {INTEGRATIONS.map(integration => (
                     <div key={integration.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                            {integration.icon}
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">{integration.name}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{integration.description}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => alert(`${integration.name} integration is coming soon!`)}
                            className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded-md transition-colors whitespace-nowrap"
                        >
                            Connect
                        </button>
                    </div>
                ))}
            </div>
        </div>
         <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-700/50 flex-shrink-0 flex justify-end">
            <button onClick={onClose} className="font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 px-6 rounded-md transition-colors">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsModal;