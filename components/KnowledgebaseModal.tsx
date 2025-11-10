import React, { useState, useCallback } from 'react';
import { XMarkIcon, DocumentTextIcon, ArrowUpTrayIcon, TrashIcon } from './Icons';
import { KnowledgebaseFile, KnowledgebaseSection } from '../types';

interface KnowledgebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgebaseSections: KnowledgebaseSection[];
  setKnowledgebaseSections: React.Dispatch<React.SetStateAction<KnowledgebaseSection[]>>;
}

const KnowledgebaseModal: React.FC<KnowledgebaseModalProps> = ({ isOpen, onClose, knowledgebaseSections, setKnowledgebaseSections }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [stagedFiles, setStagedFiles] = useState<KnowledgebaseFile[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleFileProcessing = useCallback((files: FileList) => {
    const validFiles: File[] = Array.from(files).filter(file => 
      /\.(txt|pdf|docx)$/i.test(file.name)
    );

    if (validFiles.length === 0) {
      alert("No valid files selected. Please upload .txt, .pdf, or .docx files.");
      return;
    }

    validFiles.forEach(file => {
      // Prevent duplicates in staged files
      if (stagedFiles.some(f => f.name === file.name)) return;

      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setStagedFiles(prev => [...prev, { name: file.name, content }]);
        };
        reader.readAsText(file);
      } else {
        setStagedFiles(prev => [...prev, { name: file.name, content: `[Content of non-text file: ${file.name}]` }]);
      }
    });
  }, [stagedFiles]);

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcessing(e.dataTransfer.files);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileProcessing(e.target.files);
    }
    e.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleRemoveStagedFile = (fileName: string) => {
    setStagedFiles(prev => prev.filter(f => f.name !== fileName));
  };
  
  const handleCreateSection = () => {
    if (!sectionTitle.trim() || stagedFiles.length === 0) return;
    const newSection: KnowledgebaseSection = {
        id: `section-${Date.now()}`,
        title: sectionTitle.trim(),
        files: stagedFiles,
    };
    setKnowledgebaseSections(prev => [...prev, newSection]);
    setSectionTitle('');
    setStagedFiles([]);
  };

  const handleRemoveFile = (sectionId: string, fileName: string) => {
    setKnowledgebaseSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return { ...section, files: section.files.filter(f => f.name !== fileName) };
      }
      return section;
    }).filter(section => section.files.length > 0)); // Also remove section if it becomes empty
  };
  
  const handleRemoveSection = (sectionId: string) => {
    setKnowledgebaseSections(prev => prev.filter(s => s.id !== sectionId));
  };
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
        } else {
            newSet.add(sectionId);
        }
        return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 ease-out"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
          <h2 className="text-2xl font-bold">Manage Knowledgebase</h2>
          <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            {/* New Section Area */}
            <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <h3 className="font-semibold text-lg">Create New Section</h3>
                <div>
                    <label htmlFor="section-title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Section Title</label>
                    <input
                        id="section-title"
                        type="text"
                        value={sectionTitle}
                        onChange={e => setSectionTitle(e.target.value)}
                        placeholder="e.g. Marketing"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <label
                  htmlFor="file-upload"
                  className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors ${isDragging ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}
                  onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center text-center">
                        <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">TXT, PDF, DOC, or DOCX</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileSelect} accept=".txt,.pdf,.doc,.docx" />
                </label>
                {stagedFiles.length > 0 && (
                     <div>
                        <h4 className="text-sm font-medium mb-2">Files to be added:</h4>
                        <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                            {stagedFiles.map(file => (
                                <li key={file.name} className="flex items-center justify-between bg-slate-200 dark:bg-slate-700/60 p-2 rounded-md">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <DocumentTextIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                        <span className="text-sm truncate font-medium">{file.name}</span>
                                    </div>
                                    <button onClick={() => handleRemoveStagedFile(file.name)} className="p-1 text-slate-500 hover:text-red-500 rounded-full">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={handleCreateSection} disabled={!sectionTitle.trim() || stagedFiles.length === 0} className="w-full font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-6 rounded-md transition-colors">
                    Create Section
                </button>
            </div>

            {/* Existing Sections Area */}
            <div>
                <h3 className="font-semibold text-lg mb-2">Existing Sections</h3>
                {knowledgebaseSections.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No sections created yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {knowledgebaseSections.map(section => (
                            <li key={section.id} className="bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleSection(section.id)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`transition-transform duration-200 ${expandedSections.has(section.id) ? 'rotate-90' : ''}`}>
                                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </span>
                                        <h4 className="text-md font-semibold truncate">{section.title}</h4>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{section.files.length} file{section.files.length !== 1 && 's'}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveSection(section.id); }} className="p-1 text-slate-500 hover:text-red-500 rounded-full">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {expandedSections.has(section.id) && (
                                    <div className="px-3 pb-3">
                                         <ul className="space-y-2 pl-7 border-l-2 border-slate-300 dark:border-slate-600 ml-2">
                                            {section.files.map(file => (
                                                <li key={file.name} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-800/50">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <DocumentTextIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                                        <span className="text-sm truncate">{file.name}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveFile(section.id, file.name)} className="p-1 text-slate-400 hover:text-red-500 rounded-full">
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
         <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-700/50 flex-shrink-0 flex justify-end">
            <button onClick={onClose} className="font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 px-6 rounded-md transition-colors">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgebaseModal;