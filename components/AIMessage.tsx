import React, { useState } from 'react';
import { Message, Sender } from '../types';
import SimpleMarkdown from './SimpleMarkdown';
import { ClipboardIcon, CheckIcon, SpeakerWaveIcon, FlagIcon } from './Icons';

const AIMessage: React.FC<{ message: Message; speak: (text: string) => void; previousSender?: Sender; }> = ({ message, speak, previousSender }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const showTopBorder = previousSender === Sender.AI;
    
    return (
      <div className={`w-full bg-[var(--color-bg-tertiary)]/30 py-4 md:py-6 border-b border-[var(--color-border)] ${showTopBorder ? 'border-t' : ''}`}>
        <div className="max-w-3xl mx-auto px-4 md:px-0">
            <div className="prose prose-sm dark:prose-invert prose-p:my-0 text-[var(--color-text-primary)] break-words pt-0.5">
              {message.visualization && (
                <img
                  src={message.visualization}
                  alt="AI generated visualization"
                  className="my-2 rounded-lg max-h-80 w-auto"
                />
              )}
              <SimpleMarkdown text={message.text} />
            </div>
            <div className="mt-2 flex items-center gap-2">
                <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Copy">
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
                <button onClick={() => speak(message.text)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Read aloud">
                    <SpeakerWaveIcon className="w-4 h-4" />
                </button>
                <button onClick={() => alert('Report functionality will be available soon.')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Report">
                    <FlagIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    );
};

export default AIMessage;