import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from './Icons';
import { Message } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageMessages: Message[];
}

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, imageMessages }) => {
  const [selectedImage, setSelectedImage] = useState<Message | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    // If the detailed view is open, clicking the background closes it.
    if (selectedImage && e.target === e.currentTarget) {
      setSelectedImage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div 
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="text-2xl font-bold">Media Library</h2>
          <button onClick={handleClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto relative" onClick={handleModalContentClick}>
          {imageMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center text-slate-500 dark:text-slate-400">
                <PhotoIcon className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">No Media Found</h3>
                <p>Images you upload in your chats will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {imageMessages.map((message) => (
                <div key={message.id} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer group" onClick={() => setSelectedImage(message)}>
                  <img src={message.image} alt="User upload" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              ))}
            </div>
          )}

          {selectedImage && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row max-w-4xl w-full max-h-full overflow-hidden">
                    <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4">
                         <img src={selectedImage.image} alt="Selected upload" className="max-w-full max-h-[70vh] object-contain" />
                    </div>
                    <div className="w-full md:w-1/3 p-6 flex flex-col">
                        <h4 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Context</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">From chat on {new Date(parseInt(selectedImage.id.split('-')[1])).toLocaleDateString()}</p>
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg overflow-y-auto flex-1">
                           <p className="text-slate-700 dark:text-slate-300 italic">"{selectedImage.text || 'No text was sent with this image.'}"</p>
                        </div>
                        <button onClick={() => setSelectedImage(null)} className="mt-6 w-full text-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600/80 text-slate-800 dark:text-white py-2 px-4 rounded-md transition-colors font-medium">
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
