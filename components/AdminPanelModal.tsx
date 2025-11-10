import React from 'react';
import { XMarkIcon, UsersIcon, BookOpenIcon, WrenchScrewdriverIcon, ChartPieIcon, LockClosedIcon } from './Icons';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FIX: Explicitly type the `icon` prop to ensure it accepts a `className` prop for `React.cloneElement`.
const AdminCard: React.FC<{ title: string; description: string; icon: React.ReactElement<{ className?: string }>; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-md">
                    {React.cloneElement(icon, { className: "w-5 h-5 text-slate-600 dark:text-slate-300" })}
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white">{title}</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{description}</p>
        </div>
        <button
            onClick={onClick}
            className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded-md transition-colors self-start"
        >
            Manage
        </button>
    </div>
);


const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="text-2xl font-bold">AVA Studio (Admin Panel)</h2>
          <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminCard 
                    title="Agent Management"
                    description="Configure agent behavior, system prompts, tools, and available features for different user roles."
                    icon={<UsersIcon />}
                    onClick={() => alert("Agent Management section coming soon!")}
                />
                 <AdminCard 
                    title="Content & Training"
                    description="Manage and upload training content to the global knowledgebase for specialized agents."
                    icon={<BookOpenIcon />}
                    onClick={() => alert("Content & Training section coming soon!")}
                />
                 <AdminCard 
                    title="Security & Compliance"
                    description="Configure security layers, data handling policies, content filters, and compliance settings."
                    icon={<LockClosedIcon />}
                    onClick={() => alert("Security & Compliance section coming soon!")}
                />
                 <AdminCard 
                    title="Plan & Feature Management"
                    description="Define subscription plans, manage feature flags, and set usage limits for different tiers."
                    icon={<WrenchScrewdriverIcon />}
                    onClick={() => alert("Plan & Feature Management section coming soon!")}
                />
                <AdminCard 
                    title="Analytics & Reporting"
                    description="View usage statistics, agent performance metrics, and user engagement reports."
                    icon={<ChartPieIcon />}
                    onClick={() => alert("Analytics & Reporting section coming soon!")}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelModal;
