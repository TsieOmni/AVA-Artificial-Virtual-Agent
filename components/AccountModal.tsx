import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface UserData {
  avatar: string;
  fullName: string;
  username: string;
  email: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const InfoRow: React.FC<{ label: string; value: string; onEdit?: () => void }> = ({ label, value, onEdit }) => (
  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 border-b border-[var(--color-border)]">
    <div>
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-[var(--color-text-primary)]">{value}</p>
    </div>
    {onEdit && (
      <button onClick={onEdit} className="text-sm mt-2 sm:mt-0 font-medium bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-tertiary-hover)] text-[var(--color-text-primary)] py-1.5 px-4 rounded-md transition-colors self-start">
        Change {label.toLowerCase()}
      </button>
    )}
  </div>
);

const ActionRow: React.FC<{ title: string; description?: string; buttonLabel: string; buttonColor?: string; onClick: () => void; }> = 
({ title, description, buttonLabel, buttonColor = 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-tertiary-hover)]', onClick }) => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 border-b border-[var(--color-border)]">
        <div className="mb-2 sm:mb-0 mr-4">
            <p className="text-[var(--color-text-primary)]">{title}</p>
            {description && <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">{description}</p>}
        </div>
        <button onClick={onClick} className={`text-sm font-medium ${buttonColor} text-white py-1.5 px-4 rounded-md transition-colors whitespace-nowrap self-start`}>
            {buttonLabel}
        </button>
    </div>
);

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, userData, setUserData }) => {
  const [editingField, setEditingField] = useState<'fullName' | 'username' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingField(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (editingField) {
      setUserData(prev => ({ ...prev, [editingField]: tempValue }));
      setEditingField(null);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({...prev, avatar: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderEditableRow = (label: 'fullName' | 'username') => {
    const displayLabel = label === 'fullName' ? 'Full Name' : 'Username';
    if (editingField === label) {
      return (
        <div className="py-4 border-b border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">{displayLabel}</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                    autoFocus
                />
                <div className="flex gap-2 self-end sm:self-center">
                  <button onClick={handleSave} className="font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white py-2 px-4 rounded-md transition-colors">Save</button>
                  <button onClick={() => setEditingField(null)} className="font-medium bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors">Cancel</button>
                </div>
            </div>
        </div>
      );
    }
    return <InfoRow label={displayLabel} value={userData[label]} onEdit={() => { setEditingField(label); setTempValue(userData[label]); }} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10 md:pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] w-full max-w-2xl rounded-xl border border-[var(--color-border)] shadow-2xl flex flex-col max-h-[calc(100vh-5rem)] transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)] flex-shrink-0">
          <h2 className="text-2xl font-bold">Account</h2>
          <button onClick={onClose} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-tertiary)]">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto px-6">
          {/* Account Section */}
          <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-[var(--color-border)]">
            <img src={userData.avatar} alt="User Avatar" className="w-16 h-16 rounded-full mr-4 mb-3 sm:mb-0 object-cover" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{userData.fullName}</p>
              <p className="text-[var(--color-text-secondary)] text-sm">{userData.username}</p>
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*"/>
            <button onClick={() => avatarInputRef.current?.click()} className="text-sm mt-2 sm:mt-0 font-medium bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-tertiary-hover)] text-[var(--color-text-primary)] py-1.5 px-4 rounded-md transition-colors self-start">
              Change avatar
            </button>
          </div>
          {renderEditableRow('fullName')}
          {renderEditableRow('username')}
          <InfoRow label="Email" value={userData.email} />

          {/* Subscription Section */}
          <h3 className="text-xl font-bold pt-8 pb-2">Your Subscription</h3>
          <ActionRow 
            title="Unlock the most powerful search experience with Pro."
            description="Get the most out of Pro. Learn more"
            buttonLabel="Upgrade plan"
            buttonColor="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={() => alert('Subscription plans coming soon!')}
          />

          {/* System Section */}
          <h3 className="text-xl font-bold pt-8 pb-2">System</h3>
          <ActionRow title="Support" buttonLabel="Contact" onClick={() => alert('Support channel coming soon!')}/>
          <ActionRow title={`You are signed in as ${userData.username}`} buttonLabel="Sign out" onClick={() => alert('Signing out...')}/>
          <ActionRow title="Sign out of all sessions" description="Devices or browsers where you are signed in" buttonLabel="Sign out of all sessions" onClick={() => alert('Signing out of all sessions...')}/>
          <ActionRow title="Delete account" description="Permanently delete your account and data" buttonLabel="Learn more" buttonColor="bg-[var(--color-bg-tertiary)] hover:bg-red-500/80 hover:text-white" onClick={() => alert('Account deletion is permanent. Please be careful!')}/>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;