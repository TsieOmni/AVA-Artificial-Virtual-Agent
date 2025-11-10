import React from 'react';
import { Sender } from '../types';

const LoadingIndicator: React.FC<{ previousSender?: Sender }> = ({ previousSender }) => {
    const showTopBorder = previousSender === Sender.AI;
    return (
        <div className={`w-full bg-[var(--color-bg-tertiary)]/30 py-4 md:py-6 border-b border-[var(--color-border)] ${showTopBorder ? 'border-t' : ''}`}>
          <div className="max-w-3xl mx-auto px-4 md:px-0">
              <div className="pt-2">
                <div className="flex items-center space-x-2 h-5">
                  <div className={`w-2 h-2 rounded-full bg-slate-400 animate-pulse`}></div>
                  <div className={`w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.2s]`}></div>
                  <div className={`w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.4s]`}></div>
                </div>
              </div>
          </div>
        </div>
      );
};

export default LoadingIndicator;