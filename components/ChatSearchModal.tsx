
import React, { useState, useMemo, useEffect } from 'react';
import { ChatSession, AgentName } from '../types';
import { XMarkIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon } from './Icons';

interface ChatSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  setActiveChatId: (id: string) => void;
}

const ChatSearchModal: React.FC<ChatSearchModalProps> = ({ isOpen, onClose, chatSessions, setActiveChatId }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const groupedAndFilteredSessions = useMemo(() => {
    const filtered = chatSessions.filter(session =>
      session.title.toLowerCase().includes(query.toLowerCase()) && session.title !== 'New Chat'
    );

    const groups: { [key: string]: ChatSession[] } = {
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': [],
    };

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    filtered.forEach(session => {
      const timestamp = parseInt(session.id.split('-')[1]);
      const diff = now - timestamp;
      if (diff <= sevenDays) {
        groups['Previous 7 Days'].push(session);
      } else if (diff <= thirtyDays) {
        groups['Previous 30 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
        if (groups[key].length === 0) {
            delete groups[key];
        }
    });

    return groups;
  }, [chatSessions, query]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
    >
        <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-5 left-1/2 -translate-x-1/2 md:left-24 md:translate-x-0 w-[calc(100%-2.5rem)] max-w-sm h-auto max-h-[calc(100vh-2.5rem)]
                       bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)] shadow-2xl flex flex-col
                       transform transition-all duration-300 ease-out"
            style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        >
            <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)] flex-shrink-0">
                <MagnifyingGlassIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <input
                    type="text"
                    placeholder="Search chats..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
                    autoFocus
                />
                <button onClick={onClose} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-tertiary-hover)]">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto p-2">
                {Object.keys(groupedAndFilteredSessions).length > 0 ? (
                    Object.keys(groupedAndFilteredSessions).map((groupTitle) => {
                        const sessions = groupedAndFilteredSessions[groupTitle];
                        return (
                            <div key={groupTitle} className="p-2">
                                <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 px-2">
                                    {groupTitle}
                                </h3>
                                <ul className="space-y-1">
                                    {sessions.map(session => (
                                        <li key={session.id}>
                                            <button
                                                onClick={() => setActiveChatId(session.id)}
                                                className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-[var(--color-bg-tertiary-hover)] transition-colors"
                                            >
                                                <ChatBubbleLeftIcon className="w-5 h-5 flex-shrink-0 text-[var(--color-text-secondary)]"/>
                                                <span className="truncate text-sm font-medium">{session.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center p-8 text-[var(--color-text-secondary)] text-sm">
                        <p>No chats found for "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ChatSearchModal;
