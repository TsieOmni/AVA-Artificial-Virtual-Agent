import React from 'react';
import { ClipboardIcon } from './Icons';

// Helper function to parse inline formatting like **bold** text.
const parseInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  // Split by code blocks first, keeping the delimiters
  const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);

  const renderTextPart = (part: string, key: number) => {
    const lines = part.trim().split('\n');
    // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const elements: React.ReactElement[] = [];
    let currentListItems: string[] = [];
    let currentParagraphLines: string[] = [];

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        elements.push(
          <p key={`p-${key}-${elements.length}`} className="whitespace-pre-wrap my-2">
            {parseInlineFormatting(currentParagraphLines.join('\n'))}
          </p>
        );
        currentParagraphLines = [];
      }
    };
    
    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-2">
            {currentListItems.map((item, itemIndex) => (
              <li key={itemIndex}>
                {parseInlineFormatting(item.trim().substring(item.trim().indexOf(' ') + 1))}
              </li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        flushParagraph(); // A list item starts, so end the current paragraph
        currentListItems.push(trimmedLine);
      } else if (trimmedLine === '') { // An empty line is a paragraph break
        flushParagraph();
        flushList();
      } else {
        flushList(); // A paragraph line starts, so end the current list
        currentParagraphLines.push(line);
      }
    });

    flushParagraph();
    flushList();

    const elementsWithDividers = elements.map((element, index) => (
      <React.Fragment key={`${element.key}-frag`}>
        {element}
        {index < elements.length - 1 && (
          <div className="w-full h-px my-3 bg-[var(--color-border)]" />
        )}
      </React.Fragment>
    ));

    return <div key={key}>{elementsWithDividers}</div>;
  };
  
  const renderCodePart = (part: string, key: number) => {
    // This logic remains the same
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
