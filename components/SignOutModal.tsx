
import React from 'react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
}

const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onClose, onConfirm, email }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#202123] text-white w-full max-w-md p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold mb-4">Are you sure you want to log out?</h2>
        <p className="text-gray-400 mb-8">
          Log out of Ava as <br/> {email}?
        </p>
        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Log out
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-[#343541] text-white font-semibold py-3 rounded-xl hover:bg-[#40414f] transition-colors border border-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOutModal;