import React from 'react';
import { TrashIcon } from './Icons';

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle: string;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({ isOpen, onClose, onConfirm, chatTitle }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-primary)] text-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col items-center text-center transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 flex items-center justify-center bg-red-500/10 rounded-full mb-4">
            <TrashIcon className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Delete Chat</h2>
        <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
          Are you sure you want to delete this chat? <br />
          <span className="font-semibold text-white">"{chatTitle}"</span> will be permanently deleted.
        </p>
        <div className="w-full flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-[var(--color-bg-tertiary)] text-white font-semibold py-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary-hover)] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;