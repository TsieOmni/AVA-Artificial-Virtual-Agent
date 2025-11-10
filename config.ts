import React from 'react';
import { AgentName } from './types';
import { AppSettings } from './components/SettingsModal';
import { ChartPieIcon, BookOpenIcon, LightBulbIcon, DocumentTextIcon, BanknotesIcon, QuestionMarkCircleIcon, CheckCircleIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, PencilSquareIcon, EnvelopeIcon, PresentationChartBarIcon, TutorIcon, AcademicCapIcon, BriefcaseIcon, RocketLaunchIcon } from './components/Icons';

export const ACCENT_COLOR_MAP: { [key in AppSettings['accentColor']]: { bg: string, hoverBg: string, text: string, ring: string, darkRing: string } } = {
  default: { bg: 'bg-[var(--color-accent)]', hoverBg: 'hover:bg-[var(--color-accent-hover)]', text: 'text-[var(--color-accent)]', ring: 'focus-within:ring-[var(--color-accent)]', darkRing: 'dark:focus-within:ring-[var(--color-accent)]' },
  blue: { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', text: 'text-blue-500', ring: 'focus-within:ring-blue-500', darkRing: 'dark:focus-within:ring-blue-500' },
  green: { bg: 'bg-green-500', hoverBg: 'hover:bg-green-600', text: 'text-green-500', ring: 'focus-within:ring-green-500', darkRing: 'dark:focus-within:ring-green-500' },
  purple: { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600', text: 'text-purple-500', ring: 'focus-within:ring-purple-500', darkRing: 'dark:focus-within:ring-purple-500' },
  red: { bg: 'bg-red-500', hoverBg: 'hover:bg-red-600', text: 'text-red-500', ring: 'focus-within:ring-red-500', darkRing: 'dark:focus-within:ring-red-500' },
  yellow: { bg: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-600', text: 'text-yellow-500', ring: 'focus-within:ring-yellow-500', darkRing: 'dark:focus-within:ring-yellow-500' },
};

export const AGENT_CONFIG: Record<AgentName, {
    title: string;
    icon: React.FC<{ className?: string }> | null;
    subtitle: string;
    promptStarters: { name: string, icon: React.ReactElement, iconBgColor: string, prompt: string }[];
}> = {
    ava: {
        title: 'Ava',
        icon: null,
        subtitle: 'What can I help you with?',
        promptStarters: [
            // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts files.
            { name: 'Analyze data', icon: React.createElement(ChartPieIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-blue-500', prompt: "Help me analyze some data. I will provide the context and the dataset." },
            { name: 'Homework', icon: React.createElement(BookOpenIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-green-500', prompt: "I need help with my homework. Here is the problem:" },
            { name: 'Brainstorm', icon: React.createElement(LightBulbIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-purple-500', prompt: "Let's brainstorm some ideas for a new project." },
            { name: 'Lesson Plan', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-yellow-500', prompt: "Help me create a lesson plan for a class on the basics of programming." },
            { name: 'Marketing', icon: React.createElement(BanknotesIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-red-500', prompt: "I need help creating a marketing slogan for a new coffee brand." },
        ]
    },
    tutor: {
        title: 'AI Tutor',
        icon: TutorIcon,
        subtitle: 'How can I assist you today?',
        promptStarters: [
            // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts files.
            { name: 'Explain Topic', icon: React.createElement(QuestionMarkCircleIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-blue-500', prompt: 'Explain the topic of...' },
            { name: 'Quiz Me', icon: React.createElement(CheckCircleIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-green-500', prompt: 'Quiz me on the basics of...' },
            { name: 'Homework Help', icon: React.createElement(BookOpenIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-purple-500', prompt: 'I need help with my homework. Here is the problem:' },
            { name: 'Lesson Plan', icon: React.createElement(ClipboardDocumentListIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-yellow-500', prompt: 'Help me create a lesson plan for...' }
        ]
    },
    academics: {
        title: 'Academics',
        icon: AcademicCapIcon,
        subtitle: 'How can I assist you with your research?',
        promptStarters: [
            // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts files.
            { name: 'Summarize', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-blue-500', prompt: 'Summarize the key findings of the following paper:' },
            { name: 'Find Sources', icon: React.createElement(MagnifyingGlassIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-green-500', prompt: 'Find academic sources on the topic of...' },
            { name: 'Explain Concept', icon: React.createElement(LightBulbIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-purple-500', prompt: 'Explain the academic concept of...' },
            { name: 'Draft Abstract', icon: React.createElement(PencilSquareIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-yellow-500', prompt: 'Help me draft an abstract for my research on...' }
        ]
    },
    work: {
        title: 'My Work Agent',
        icon: BriefcaseIcon,
        subtitle: 'How can I help you be more productive?',
        promptStarters: [
            // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts files.
            { name: 'Draft Email', icon: React.createElement(EnvelopeIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-blue-500', prompt: 'Draft a professional email to a client about...' },
            { name: 'Create Report', icon: React.createElement(PresentationChartBarIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-green-500', prompt: 'Help me structure a quarterly report on...' },
            { name: 'Action Items', icon: React.createElement(CheckCircleIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-purple-500', prompt: 'Pull out the action items from the following meeting notes:' },
            { name: 'Summarize', icon: React.createElement(ClipboardDocumentListIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-yellow-500', prompt: 'Summarize this document for me:' }
        ]
    },
    entrepreneur: {
        title: 'Entrepreneur',
        icon: RocketLaunchIcon,
        subtitle: 'Ready to build the next big thing?',
        promptStarters: [
            // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts files.
            { name: 'Business Plan', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-blue-500', prompt: 'Help me outline a business plan for...' },
            { name: 'Market Analysis', icon: React.createElement(ChartPieIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-green-500', prompt: 'Analyze the market for a new SaaS product in...' },
            { name: 'Pitch Deck', icon: React.createElement(PresentationChartBarIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-purple-500', prompt: 'Create a 5-slide pitch deck for my startup idea:' },
            { name: 'Fundraising', icon: React.createElement(BanknotesIcon, { className: "w-5 h-5 text-white" }), iconBgColor: 'bg-yellow-500', prompt: 'What are the key steps in a seed fundraising round?' }
        ]
    }
};