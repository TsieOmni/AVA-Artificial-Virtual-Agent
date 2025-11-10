import React from 'react';
import { ClipboardIcon } from './Icons';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  // Split by code blocks, keeping the delimiters
  const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);

  const renderTextPart = (part: string, key: number) => {
    const paragraphs = part.split('\n\n').filter(p => p.trim());
    return (
      <React.Fragment key={key}>
        {paragraphs.map((para, paraIndex) => {
          const lines = para.split('\n');
          
          const isUnorderedList = lines.every(l => l.trim().startsWith('- '));
          const isOrderedList = lines.every(l => l.trim().match(/^\d+\.\s/));

          const renderLine = (line: string) => {
            return line
              .replace(/^\s*-\s*/, '')
              .replace(/^\s*\d+\.\s*/, '')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>');
          };

          if (isUnorderedList) {
            return (
              <ul key={`${key}-${paraIndex}`} className="list-disc list-inside space-y-1 my-2">
                {lines.map((line, i) => <li key={i} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />)}
              </ul>
            );
          }
          if (isOrderedList) {
            return (
              <ol key={`${key}-${paraIndex}`} className="list-decimal list-inside space-y-1 my-2">
                {lines.map((line, i) => <li key={i} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />)}
              </ol>
            );
          }

          return <p key={`${key}-${paraIndex}`} className="my-1 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLine(para) }} />;
        })}
      </React.Fragment>
    );
  };

  const renderCodePart = (part: string, key: number) => {
    const codeContent = part.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '');
    return (
      <div key={key} className="bg-black rounded-md my-2 text-sm font-mono">
        <div className="flex justify-end items-center px-3 py-1 bg-slate-900 rounded-t-md">
          <button 
            onClick={() => navigator.clipboard.writeText(codeContent)} 
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ClipboardIcon className="h-4 w-4" />
            Copy code
          </button>
        </div>
        <pre className="p-3 overflow-x-auto"><code className="whitespace-pre-wrap break-words">{codeContent}</code></pre>
      </div>
    );
  };

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          return renderCodePart(part, index);
        }
        return renderTextPart(part, index);
      })}
    </>
  );
};

export default SimpleMarkdown;