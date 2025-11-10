import React from 'react';
import { Message } from '../types';
import { AppSettings } from './SettingsModal';
import { ACCENT_COLOR_MAP } from '../config';
import { DocumentTextIcon } from './Icons';

const UserMessage: React.FC<{ message: Message; accentColor: AppSettings['accentColor'] }> = ({ message, accentColor }) => {
    const accent = ACCENT_COLOR_MAP[accentColor];
    const containerClasses = `relative user-bubble-container user-bubble-container-${accentColor}`;
    return (
      <div className="flex justify-end w-full group">
        <div className={containerClasses}>
          <div className={`${accent.bg} rounded-2xl rounded-br-sm p-3 max-w-lg lg:max-w-xl w-fit text-white`}>
            {message.image && (
              <img src={message.image} alt="User upload" className="mb-2 rounded-lg max-h-60 w-auto" />
            )}
            {message.fileName && (
              <div className="mb-2 p-2 rounded-md bg-black/20 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 flex-shrink-0 text-white/80" />
                <span className="text-sm font-medium truncate">{message.fileName}</span>
              </div>
            )}
            {message.text && <p className="break-words">{message.text}</p>}
            <div className="text-right text-xs text-white/70 mt-1 ml-4 select-none">
                {message.timestamp}
            </div>
          </div>
        </div>
      </div>
    );
};

export default UserMessage;
