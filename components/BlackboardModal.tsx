import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PauseIcon, SendIcon } from './Icons';
import { Message, ImageForApi, Sender, KnowledgebaseSection } from '../types';
import { geminiService } from '../services/geminiService';

interface BlackboardModalProps {
  isOpen: boolean;
  onClose: (finalHistory: Message[]) => void;
  sessionData: {
    image: string;
    userMessage: Message;
    aiMessage: Message;
    history: Message[];
  };
  knowledgebaseSections: KnowledgebaseSection[];
  userName: string;
}

const BlackboardModal: React.FC<BlackboardModalProps> = ({ isOpen, onClose, sessionData, knowledgebaseSections, userName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      setMessages(sessionData.history);
    }
  }, [isOpen, sessionData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  useEffect(() => {
    const updateImageDimensions = () => {
      if (imageRef.current) {
        const { width, height, top, left } = imageRef.current.getBoundingClientRect();
        setImageDimensions({ width, height, top, left });
      }
    };

    if (isOpen) {
      window.addEventListener('resize', updateImageDimensions);
      const timer = setTimeout(updateImageDimensions, 100);
      return () => {
        window.removeEventListener('resize', updateImageDimensions);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);


  const handleSendMessage = async () => {
    if (isLoading || !userInput.trim() || !sessionData.userMessage.imageForApi) return;

    const userMessage: Message = {
      id: `bb-user-${Date.now()}`,
      sender: Sender.User,
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const historyForApi = newMessages.map(msg => ({...msg, imageForApi: undefined}));
      const aiResponse = await geminiService.sendMessage(
        userInput,
        historyForApi,
        knowledgebaseSections,
        userName,
        'ava', // Blackboard mode is an Ava-specific feature
        sessionData.userMessage.imageForApi
      );

      const aiMessage: Message = {
        id: `bb-ai-${Date.now()}`,
        sender: Sender.AI,
        text: aiResponse.text,
        interactiveElements: aiResponse.interactiveElements,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("Blackboard send message error:", error);
        const errorMessage: Message = {
            id: `bb-error-${Date.now()}`,
            sender: Sender.AI,
            text: "Sorry, I ran into an error. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const latestInteractiveElements = messages[messages.length - 1]?.interactiveElements || [];
  const aiMessages = messages.filter(msg => msg.sender === Sender.AI);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img
          ref={imageRef}
          onLoad={() => {
            if (imageRef.current) {
              const { width, height, top, left } = imageRef.current.getBoundingClientRect();
              setImageDimensions({ width, height, top, left });
            }
          }}
          src={sessionData.image}
          alt="User's problem"
          className="max-w-full max-h-full object-contain"
        />
        <div 
          className="absolute pointer-events-none"
          style={{ 
            width: imageDimensions.width,
            height: imageDimensions.height,
            top: imageDimensions.top,
            left: imageDimensions.left,
          }}
        >
          {latestInteractiveElements.map((el, index) => {
            if (el.type === 'highlight' && el.width && el.height) {
              const x = el.x;
              const y = el.y;
              const width = el.width;
              const height = el.height;
              // The clip-path polygon creates a "hole" in the overlay by defining the outer bounds
              // and then the inner hole. The 'evenodd' fill-rule is key here.
              const clipPathValue = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${x}% ${y}%, ${x + width}% ${y}%, ${x + width}% ${y + height}%, ${x}% ${y + height}%)`;

              return (
                <React.Fragment key={index}>
                  {/* Dimming overlay with a cutout for the highlighted area */}
                  <div
                    className="absolute inset-0 bg-black/60 animate-fade-in"
                    style={{ clipPath: clipPathValue }}
                  />
                  {/* Glowing border around the cutout area to draw attention */}
                  <div
                    className="absolute border-2 border-cyan-400 rounded-2xl shadow-[0_0_15px_3px_rgba(34,211,238,0.6)] animate-fade-in"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  />
                </React.Fragment>
              );
            }
            if (el.type === 'point' && el.radius) {
                return (
                     <div
                        key={index}
                        className="absolute flex items-center justify-center"
                        style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.radius * 2}%`, height: `${el.radius * 2}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="absolute w-full h-full rounded-full bg-blue-500/50 animate-ping"></div>
                        <div className="absolute w-1/2 h-1/2 rounded-full bg-blue-500"></div>
                    </div>
                );
            }
            return null;
          })}
        </div>
      </div>

      <div className="absolute top-4 left-4 right-4 md:left-auto md:w-96 space-y-0 max-h-[60%] overflow-y-auto pr-2 no-scrollbar">
        <div className="relative pl-5"> {/* Timeline container */}
          {aiMessages.map((msg, index) => (
            <div key={msg.id} className="relative pb-8 animate-slide-in-top" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Vertical line */}
              {index < aiMessages.length - 1 && (
                <div className="absolute top-5 left-[9px] h-full w-0.5 bg-slate-600"></div>
              )}
              {/* Circle indicator */}
              <div className="absolute top-3 left-0">
                <div className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              {/* Message content */}
              <div className="ml-8 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-lg">
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="relative pb-8">
              {aiMessages.length > 0 && <div className="absolute top-5 left-[9px] h-full w-0.5 bg-slate-600"></div>}
              <div className="absolute top-3 left-0">
                <div className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="ml-8 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2 h-5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>


      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
        <div className="relative flex-1 max-w-lg">
             <textarea
                ref={textareaRef}
                rows={1}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder="What do you think is next?"
                className="w-full bg-slate-700/80 backdrop-blur-md border border-slate-600 rounded-full py-3 pl-5 pr-14 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-y-auto max-h-32"
                disabled={isLoading}
             />
             <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="absolute right-2 top-2.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
             >
                <SendIcon className="w-5 h-5" />
             </button>
        </div>
        <button className="p-3 bg-slate-700/80 backdrop-blur-md border border-slate-600 rounded-full text-white">
          <PauseIcon className="w-6 h-6" />
        </button>
        <button onClick={() => onClose(messages)} className="p-3 bg-red-600/80 backdrop-blur-md border border-red-500 rounded-full text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }

        @keyframes slide-in-top {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-top { animation: slide-in-top 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BlackboardModal;