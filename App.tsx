
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sender, Message, ImageForApi, ChatSession, KnowledgebaseSection, AgentName, InteractiveElement } from './types';
import { geminiService } from './services/geminiService';
// FIX: Import `AvaLogo` to resolve 'Cannot find name' error.
import { SendIcon, MicrophoneIcon, XCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon, VideoCameraIcon, CameraSwitchIcon, Bars3Icon, PencilSquareIcon, MagnifyingGlassIcon, BookOpenIcon, UserCircleIcon, WrenchScrewdriverIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, PlusCircleIcon, PhotoIcon, DocumentArrowUpIcon, DocumentTextIcon, CameraIcon, ArrowUpTrayIcon, XMarkIcon, PlusIcon, UsersIcon, HomeIcon, AvaLogo, ArrowLeftCircleIcon, ArrowRightCircleIcon, CubeIcon } from './components/Icons';
import { ACCENT_COLOR_MAP, AGENT_CONFIG } from './config';
import AccountModal from './components/AccountModal';
import PersonalizationModal, { PersonalizationSettings } from './components/PersonalizationModal';
import SettingsModal, { AppSettings } from './components/SettingsModal';
import LibraryModal from './components/LibraryModal';
import SnapshotModal from './components/SnapshotModal';
import KnowledgebaseModal from './components/KnowledgebaseModal';
import BlackboardModal from './components/BlackboardModal';
import ChatSearchModal from './components/ChatSearchModal';
import SignOutModal from './components/SignOutModal';
import AIMessage from './components/AIMessage';
import UserMessage from './components/UserMessage';
import LoadingIndicator from './components/LoadingIndicator';
import { LiveServerMessage, Blob } from '@google/genai';
import IntegrationsModal from './components/IntegrationsModal';
import AdminPanelModal from './components/AdminPanelModal';

const getFormattedTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const WaveformIndicator: React.FC = () => (
    <div className="flex items-center justify-center space-x-1 h-5">
      <span className="w-1 h-2 bg-white/80 rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
      <span className="w-1 h-4 bg-white/80 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
      <span className="w-1 h-5 bg-white/80 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
      <span className="w-1 h-3 bg-white/80 rounded-full animate-wave" style={{ animationDelay: '0.4s' }} />
      <span className="w-1 h-4 bg-white/80 rounded-full animate-wave" style={{ animationDelay: '0.5s' }} />
    </div>
);

// Live API Audio Helper Functions
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
  
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp the value to avoid issues with out-of-range data
        const s = Math.max(-1, Math.min(1, data[i]));
        // Scale to 16-bit integer range
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const blobToBase64 = (blob: globalThis.Blob): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const parts = dataUrl.split(',');
        if (parts.length === 2 && parts[1]) {
          resolve(parts[1]);
        } else {
          console.error("Failed to create valid base64 data from blob.");
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.error("FileReader error on blob.");
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;
const isTtsSupported = 'speechSynthesis' in window;

const defaultAllSessions: Record<AgentName, ChatSession[]> = {
  ava: [],
  tutor: [],
  academics: [],
  work: [],
  entrepreneur: [],
};

export default function App({ onLogout }: { onLogout: () => void }) {
  const [isAdmin] = useState(true); // Admin toggle for demo
  const [allSessions, setAllSessions] = useState<Record<AgentName, ChatSession[]>>(defaultAllSessions);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentName>('ava');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isKnowledgebaseModalOpen, setIsKnowledgebaseModalOpen] = useState(false);
  const [isChatSearchModalOpen, setIsChatSearchModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isAdminPanelModalOpen, setIsAdminPanelModalOpen] = useState(false);
  const [blackboardData, setBlackboardData] = useState<{ image: string; userMessage: Message; aiMessage: Message; history: Message[] } | null>(null);

  const [userInput, setUserInput] = useState('');
  const [imageForPreview, setImageForPreview] = useState<string | null>(null);
  const [imageForApi, setImageForApi] = useState<ImageForApi | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // State for Live API interaction
  const [liveHighlights, setLiveHighlights] = useState<InteractiveElement[]>([]);
  const [liveAiComment, setLiveAiComment] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const [knowledgebaseSections, setKnowledgebaseSections] = useState<KnowledgebaseSection[]>(() => {
    const savedSections = localStorage.getItem('knowledgebaseSections');
    return savedSections ? JSON.parse(savedSections) : [];
  });
  
  const [userData, setUserData] = useState({
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    fullName: 'User',
    username: 'user',
    email: 'user@example.com',
  });
  const [personalizationSettings, setPersonalizationSettings] = useState<PersonalizationSettings>({
    tone: 'default',
    customInstructions: '',
    instructionTags: [],
    shareLocation: false,
    locationStatus: 'idle',
    occupation: '',
    referenceMemories: true,
    referenceHistory: true,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      appearance: 'system',
      accentColor: 'default',
      language: 'auto',
      spokenLanguage: 'auto',
      voice: '',
      multiFactorAuth: false,
    };
  });
  
  useEffect(() => {
    try {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        setUserData(prev => ({
          ...prev, // Keep default avatar if none is set
          fullName: storedUser.fullName || 'User',
          username: storedUser.email ? storedUser.email.split('@')[0] : 'user',
          email: storedUser.email || ''
        }));
      }
    } catch(e) {
      console.error("Failed to parse user data from localStorage", e);
    }
  }, []);
  
  const firstName = useMemo(() => userData.fullName.split(' ')[0], [userData.fullName]);
  const accent = useMemo(() => ACCENT_COLOR_MAP[appSettings.accentColor], [appSettings.accentColor]);
  const activeAgentConfig = useMemo(() => AGENT_CONFIG[activeAgent], [activeAgent]);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const agentButtonRef = useRef<HTMLButtonElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  // Refs for Live API
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const isLiveSessionActiveRef = useRef(false);
  const cameraReadyRef = useRef(isCameraReady);
  const facingModeRef = useRef(facingMode);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const microphoneSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const isMicActiveRef = useRef(isMicActive);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);
  useEffect(() => { cameraReadyRef.current = isCameraReady; }, [isCameraReady]);
  useEffect(() => { facingModeRef.current = facingMode; }, [facingMode]);

  const activeAgentSessions = useMemo(() => allSessions[activeAgent] || [], [allSessions, activeAgent]);
  const activeChat = useMemo(() => activeAgentSessions.find(session => session.id === activeChatId), [activeAgentSessions, activeChatId]);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);
  
  const allImageMessages = useMemo(() => {
    return (Object.values(allSessions) as ChatSession[][])
        .reduce((acc, val) => acc.concat(val), [] as ChatSession[])
        .flatMap(session => session.messages)
        .filter(message => message.sender === Sender.User && message.image)
        .reverse();
  }, [allSessions]);

  const removeAttachments = useCallback(() => {
    setImageForPreview(null);
    setImageForApi(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    setAttachedFile(null);
    if (docFileInputRef.current) docFileInputRef.current.value = "";
  }, []);

  const handleNewChat = useCallback((agent: AgentName) => {
    if (isCameraOn) return;

    const newChatId = `${agent}-chat-${Date.now()}`;
    const newSession: ChatSession = { id: newChatId, title: 'New Chat', messages: [] };

    setAllSessions(prev => ({
        ...prev,
        [agent]: [newSession, ...(prev[agent] || [])]
    }));
    setActiveChatId(newChatId);

    if (activeAgent !== agent) {
        setActiveAgent(agent);
    }

    setUserInput('');
    removeAttachments();
    setIsLoading(false);
  }, [isCameraOn, removeAttachments, activeAgent]);
  
  useEffect(() => {
    localStorage.setItem('knowledgebaseSections', JSON.stringify(knowledgebaseSections));
  }, [knowledgebaseSections]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
        if (appSettings.appearance === 'dark' || (appSettings.appearance === 'system' && mediaQuery.matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };
    
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [appSettings.appearance]);

  useEffect(() => {
    try {
        const savedSessionsStr = localStorage.getItem('allChatSessions');
        const savedActiveAgent = localStorage.getItem('activeAgent') as AgentName | null;
        const savedActiveId = localStorage.getItem('activeChatId');
        const loadedAgent = savedActiveAgent || 'ava';
        setActiveAgent(loadedAgent);
        const allLoadedSessions: Record<AgentName, ChatSession[]> = savedSessionsStr ? JSON.parse(savedSessionsStr) : defaultAllSessions;
        setAllSessions(allLoadedSessions);
        const agentSessions = allLoadedSessions[loadedAgent] || [];
        const activeId = savedActiveId ? JSON.parse(savedActiveId) : null;

        if (activeId && agentSessions.some((s: ChatSession) => s.id === activeId)) {
            setActiveChatId(activeId);
        } else if (agentSessions.length > 0) {
            setActiveChatId(agentSessions[0].id);
        } else {
            handleNewChat(loadedAgent);
        }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
        handleNewChat('ava');
    }
  }, []); // Eslint-disable-line react-hooks/exhaustive-deps, one-time load

  useEffect(() => {
      localStorage.setItem('allChatSessions', JSON.stringify(allSessions));
      localStorage.setItem('activeAgent', activeAgent);
      if (activeChatId) {
          localStorage.setItem('activeChatId', JSON.stringify(activeChatId));
      }
  }, [allSessions, activeAgent, activeChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node) &&
        profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node)
      ) { setIsProfileMenuOpen(false); }
      if (
        attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node) &&
        attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node)
      ) { setIsAttachmentMenuOpen(false); }
      if (
        agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node) &&
        agentButtonRef.current && !agentButtonRef.current.contains(event.target as Node)
      ) { setIsAgentMenuOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isTtsSupported) return;

    const setupVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        return; // Voices not loaded yet. The event listener will call this again.
      }

      setAppSettings(prevSettings => {
        // 1. Check if the currently saved voice is still valid and available.
        const currentVoiceIsValid = voices.some(v => v.name === prevSettings.voice);
        if (prevSettings.voice && currentVoiceIsValid) {
          return prevSettings; // The existing voice is fine, no change needed.
        }

        // 2. If not, find a new, high-quality default female voice.
        let bestVoice: SpeechSynthesisVoice | undefined;

        // Prioritized search for high-quality, human-like female voices in English.
        const voicePreferences = [
          // Specific, high-quality voices across different platforms
          (v: SpeechSynthesisVoice) => v.name === 'Google US English' && v.lang === 'en-US',
          (v: SpeechSynthesisVoice) => v.name === 'Microsoft Zira - English (United States)' && v.lang === 'en-US',
          (v: SpeechSynthesisVoice) => v.name === 'Samantha' && v.lang === 'en-US',
          // Generic preferences for female voices
          (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.name.toLowerCase().includes('female'),
          (v: SpeechSynthesisVoice) => v.lang === 'en-GB' && v.name.toLowerCase().includes('female'),
          // Fallbacks
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.default,
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US'),
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en-GB'),
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
        ];

        for (const condition of voicePreferences) {
          bestVoice = voices.find(condition);
          if (bestVoice) break;
        }
        
        // Final fallback to the very first available voice if no English voice is found.
        if (!bestVoice && voices.length > 0) {
          bestVoice = voices[0];
        }

        if (bestVoice && prevSettings.voice !== bestVoice.name) {
          return { ...prevSettings, voice: bestVoice.name };
        }
        
        // If no voices are found at all, or the best voice is already set, do nothing.
        return prevSettings;
      });
    };

    // The `onvoiceschanged` event is the most reliable way to get the list of voices.
    window.speechSynthesis.onvoiceschanged = setupVoices;
    setupVoices(); // Also call it once, in case voices are already loaded.
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null; // Cleanup
    };
  }, [isTtsSupported]);

  const stopCamera = useCallback(() => {
    isLiveSessionActiveRef.current = false;

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
    videoStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }

    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (microphoneSourceRef.current) {
        microphoneSourceRef.current.disconnect();
        microphoneSourceRef.current = null;
    }
    for (const source of audioSourcesRef.current.values()) {
      source.stop();
    }
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    setIsMicActive(false);
    setIsAiResponding(false);
    setLiveHighlights([]);
    setLiveAiComment(null);

    setIsCameraOn(false);
    setIsCameraReady(false);
  }, []);
  
  const speak = useCallback((text: string) => {
    if (!isTtsEnabled || !isTtsSupported || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Prioritize the language setting for more accurate voice selection.
    const targetLang = appSettings.language !== 'auto' ? appSettings.language : 'en';
    utterance.lang = targetLang;

    if (voices.length === 0) {
      // If voices are not loaded yet, the browser will use the utterance.lang to pick a default.
      window.speechSynthesis.speak(utterance);
      return;
    }
    
    let selectedVoice: SpeechSynthesisVoice | undefined;

    // 1. Try to use the voice from settings, but only if its language is compatible.
    const settingsVoice = voices.find(v => v.name === appSettings.voice);
    if (settingsVoice && settingsVoice.lang.startsWith(targetLang)) {
        selectedVoice = settingsVoice;
    }

    // 2. If no settings voice, find the best available voice for the target language.
    if (!selectedVoice) {
      const languageVoices = voices.filter(v => v.lang.startsWith(targetLang));
      if (languageVoices.length > 0) {
        // Prefer a default voice for the language, or one marked as 'female', or the first one.
        selectedVoice = 
            languageVoices.find(v => v.default) ||
            languageVoices.find(v => v.name.toLowerCase().includes('female')) ||
            languageVoices[0];
      }
    }
    
    // 3. As an ultimate fallback, find a suitable English voice if the target language had no voices.
    if (!selectedVoice) {
        const voicePreferences = [
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.default,
            (v: SpeechSynthesisVoice) => v.name === 'Google US English' && v.lang === 'en-US',
            (v: SpeechSynthesisVoice) => v.name === 'Microsoft Zira - English (United States)' && v.lang === 'en-US',
            (v: SpeechSynthesisVoice) => v.name === 'Samantha' && v.lang === 'en-US',
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US'),
        ];
        for (const condition of voicePreferences) {
            const foundVoice = voices.find(condition);
            if (foundVoice) {
                selectedVoice = foundVoice;
                break;
            }
        }
    }
  
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  
    window.speechSynthesis.speak(utterance);
  }, [isTtsEnabled, appSettings.voice, appSettings.language]);

  const handleSendMessage = useCallback(async (
      textOverride?: string,
      imageOverride?: { preview: string; api: ImageForApi },
      fileOverride?: { name: string; content: string }
  ) => {
    const currentText = textOverride ?? userInput.trim();
    const currentImagePreview = imageOverride?.preview ?? imageForPreview;
    const currentImageForApi = imageOverride?.api ?? imageForApi;
    const currentFile = fileOverride ?? attachedFile;

    if (isLoading || !activeChatId || (!currentText && !currentImageForApi && !currentFile)) {
        setIsLoading(false);
        return;
    }
    
    let userMessageTextForApi = currentText;
    if (currentFile) {
        userMessageTextForApi = `The user has attached a file named "${currentFile.name}".\n\nFile Content:\n"""\n${currentFile.content}\n"""\n\nUser's question about the file:\n"""\n${currentText}\n"""`;
    }

    const messageIdPrefix = imageOverride ? 'user-live-' : 'user-';
    const userMessage: Message = {
      id: `${messageIdPrefix}${Date.now()}`, 
      sender: Sender.User, 
      text: currentText,
      image: currentImagePreview ?? undefined,
      imageForApi: currentImageForApi ?? undefined,
      fileName: currentFile?.name,
      timestamp: getFormattedTimestamp(),
    };
    
    const isFirstUserMessage = (activeChat?.messages.filter(m => m.sender === Sender.User).length ?? 0) === 0;

    const updatedAgentSessions = activeAgentSessions.map(session => {
        if (session.id === activeChatId) {
            const newTitle = isFirstUserMessage && currentText ? (currentText.length > 30 ? currentText.substring(0, 27) + '...' : currentText) : session.title;
            return { ...session, title: newTitle, messages: [...session.messages, userMessage] };
        }
        return session;
    });

    setAllSessions(prev => ({...prev, [activeAgent]: updatedAgentSessions }));
    setIsLoading(true);
    setUserInput('');
    removeAttachments();

    try {
      const historyForApi = updatedAgentSessions.find(s => s.id === activeChatId)?.messages ?? [];
      const aiResponse = await geminiService.sendMessage(userMessageTextForApi, historyForApi, knowledgebaseSections, firstName, activeAgent, appSettings.language, currentImageForApi ?? undefined);
      speak(aiResponse.text);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`, sender: Sender.AI, text: aiResponse.text,
        visualization: aiResponse.visualization,
        interactiveElements: aiResponse.interactiveElements,
        timestamp: getFormattedTimestamp(),
      };
      
      setAllSessions(prev => ({
        ...prev,
        [activeAgent]: prev[activeAgent].map(session => 
          session.id === activeChatId ? { ...session, messages: [...session.messages, aiMessage] } : session
        )
      }));

    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`, sender: Sender.AI,
        text: "I'm sorry, an unexpected error occurred. Please try again.", timestamp: getFormattedTimestamp(),
      };
      setAllSessions(prev => ({
        ...prev,
        [activeAgent]: prev[activeAgent].map(session =>
          session.id === activeChatId ? { ...session, messages: [...session.messages, errorMessage] } : session
        )
      }));
    } finally {
      setIsLoading(false);
    }
  }, [userInput, imageForPreview, imageForApi, attachedFile, isLoading, activeChatId, activeAgent, allSessions, knowledgebaseSections, removeAttachments, speak, firstName, activeAgentSessions, activeChat, appSettings.language]);
  
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    if (videoStreamRef.current) stopCamera();
    if (isSnapshotModalOpen) setIsSnapshotModalOpen(false);
    
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } }, audio: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
        }
        videoStreamRef.current = stream;
        setIsCameraOn(true);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        setFacingMode(mode);

        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        sessionPromiseRef.current = geminiService.startLiveSession({
            onOpen: () => {
                const inputAudioContext = inputAudioContextRef.current;
                if (!inputAudioContext || !videoStreamRef.current) return;
                const source = inputAudioContext.createMediaStreamSource(videoStreamRef.current);
                microphoneSourceRef.current = source;
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;
                scriptProcessor.onaudioprocess = (event) => {
                    if (isMicActiveRef.current) {
                        const inputData = event.inputBuffer.getChannelData(0);
                        sessionPromiseRef.current?.then((s) => s.sendRealtimeInput({ media: createBlob(inputData) }));
                    }
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onMessage: async (message: LiveServerMessage) => {
                if (message.toolCall) {
                    const newHighlights: InteractiveElement[] = [];
                    let newComment = '';
                    for (const call of message.toolCall.functionCalls) {
                        if (call.name === 'highlightArea' && call.args.comment) {
                            newHighlights.push({ type: 'highlight', x: call.args.x as number, y: call.args.y as number, width: call.args.width as number, height: call.args.height as number });
                            newComment = call.args.comment as string;
                        }
                        if (call.name === 'pointToArea' && call.args.comment) {
                            newHighlights.push({ type: 'point', x: call.args.x as number, y: call.args.y as number, radius: (call.args.radius as number) ?? 5 });
                            newComment = call.args.comment as string;
                        }
                        sessionPromiseRef.current?.then(s => s.sendToolResponse({ functionResponses: { id: call.id, name: call.name, response: { result: 'ok' } } }));
                    }
                    setLiveHighlights(newHighlights);
                    setLiveAiComment(newComment);
                }
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                }

                if (message.serverContent?.turnComplete) {
                    const finalInput = currentInputTranscriptionRef.current.trim();
                    const finalOutput = currentOutputTranscriptionRef.current.trim();
                    
                    currentInputTranscriptionRef.current = '';
                    currentOutputTranscriptionRef.current = '';
            
                    if (finalInput || finalOutput) {
                        const saveMessages = (imageDataUrl: string | null) => {
                            let imageForPreview: string | undefined = undefined;
                            let imageForApiPayload: ImageForApi | undefined = undefined;
            
                            if (imageDataUrl) {
                                const dataParts = imageDataUrl.split(',');
                                if (dataParts.length === 2 && dataParts[1]) {
                                    imageForPreview = imageDataUrl;
                                    imageForApiPayload = { data: dataParts[1], mimeType: 'image/jpeg' };
                                } else {
                                    console.error("Invalid data URL from snapshot, discarding image.");
                                }
                            }
            
                            const userMessage: Message = {
                                id: `user-live-${Date.now()}`,
                                sender: Sender.User,
                                text: finalInput || "[Visual input]",
                                image: imageForPreview,
                                imageForApi: imageForApiPayload,
                                timestamp: getFormattedTimestamp(),
                            };
                            const aiMessage: Message = {
                                id: `ai-live-${Date.now() + 1}`,
                                sender: Sender.AI,
                                text: finalOutput,
                                timestamp: getFormattedTimestamp(),
                            };
            
                            setAllSessions(prev => {
                                const currentAgentSessions = prev[activeAgent] || [];
                                const updatedSessions = currentAgentSessions.map(session => {
                                    if (session.id === activeChatId) {
                                        const newMessages = [...session.messages, userMessage, aiMessage];
                                        const isFirstUserMessage = session.messages.filter(m => m.sender === Sender.User).length === 0;
                                        const newTitle = isFirstUserMessage && finalInput ? (finalInput.length > 30 ? finalInput.substring(0, 27) + '...' : finalInput) : session.title;
                                        return { ...session, title: newTitle, messages: newMessages };
                                    }
                                    return session;
                                });
                                return { ...prev, [activeAgent]: updatedSessions };
                            });
                        };
            
                        if (videoRef.current && canvasRef.current && isCameraReady) {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                if (facingMode === 'user') {
                                    ctx.save();
                                    ctx.scale(-1, 1);
                                    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                                    ctx.restore();
                                } else {
                                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                }
                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => saveMessages(reader.result as string);
                                        reader.onerror = () => {
                                            console.error("FileReader failed for snapshot blob.");
                                            saveMessages(null);
                                        };
                                        reader.readAsDataURL(blob);
                                    } else {
                                        console.error("canvas.toBlob failed to produce a blob.");
                                        saveMessages(null);
                                    }
                                }, 'image/jpeg', 0.8);
                            } else {
                                saveMessages(null);
                            }
                        } else {
                            console.warn("Could not get snapshot, saving transcription only.");
                            saveMessages(null);
                        }
                    }
                }

                const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audio && outputAudioContextRef.current) {
                    setIsAiResponding(true);
                    const outCtx = outputAudioContextRef.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                    const audioBuffer = await decodeAudioData(decode(audio), outCtx, 24000, 1);
                    const source = outCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outCtx.destination);
                    source.addEventListener('ended', () => {
                        audioSourcesRef.current.delete(source);
                        if (audioSourcesRef.current.size === 0) {
                            setIsAiResponding(false);
                        }
                    });
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    audioSourcesRef.current.add(source);
                }
                if (message.serverContent?.interrupted) {
                    for (const source of audioSourcesRef.current.values()) {
                        source.stop();
                        audioSourcesRef.current.delete(source);
                    }
                    nextStartTimeRef.current = 0;
                    setIsAiResponding(false);
                }
            },
            onError: (e) => console.error('Live session error:', e),
            onClose: () => console.log('Live session closed'),
        }, activeAgent);

        isLiveSessionActiveRef.current = true;
        const frameProcessor = () => {
          if (!isLiveSessionActiveRef.current) return;

          if (videoRef.current && canvasRef.current && cameraReadyRef.current) {
            const video = videoRef.current;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const canvas = canvasRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                if (facingModeRef.current === 'user') {
                  ctx.save();
                  ctx.scale(-1, 1);
                  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                  ctx.restore();
                } else {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    const base64data = await blobToBase64(blob);
                    if (base64data) {
                      sessionPromiseRef.current?.then((s) => {
                        if (isLiveSessionActiveRef.current) {
                          s.sendRealtimeInput({ media: { data: base64data, mimeType: 'image/jpeg' } });
                        }
                      });
                    }
                  }
                }, 'image/jpeg', 0.7);
              }
            }
          }

          setTimeout(() => {
            requestAnimationFrame(frameProcessor);
          }, 500); // ~2 FPS
        };
        requestAnimationFrame(frameProcessor);
    } catch (err) {
        console.error(`Error accessing ${mode} camera:`, err);
        alert("Could not access the camera. Please check permissions and try again.");
    }
  }, [stopCamera, isSnapshotModalOpen, activeAgent, activeChatId]);

  const handleToggleCamera = useCallback(async () => {
    if (isCameraOn) {
        stopCamera();
    } else {
        await startCamera(facingMode);
    }
  }, [isCameraOn, facingMode, stopCamera, startCamera]);

  useEffect(() => {
    return () => {
      if (isCameraOn) stopCamera();
      recognitionRef.current?.abort();
    };
  }, [isCameraOn, stopCamera]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      removeAttachments();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageForPreview(base64String);
        const [mimePart, dataPart] = base64String.split(';base64,');
        setImageForApi({ mimeType: mimePart.split(':')[1], data: dataPart });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const textContent = e.target?.result as string;
          removeAttachments();
          setAttachedFile({ name: file.name, content: textContent });
        };
        reader.onerror = () => alert("Failed to read the file.");
        reader.readAsText(file);
      } else if (/\.(pdf|doc|docx)$/i.test(file.name)) {
        alert(`Content analysis for "${file.name}" is not yet supported. Only .txt file content can be read. Please try converting your file to .txt for now.`);
      } else {
        alert(`File type not supported. Please upload a .txt, .pdf, or Word document.`);
      }
    }
    if (event.target) event.target.value = "";
  };

  const handleSwitchCamera = useCallback(async () => {
    if (!isCameraOn) return;
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setIsCameraReady(false); 
    await startCamera(newMode);
  }, [isCameraOn, facingMode, startCamera]);

  const handleSpeechResult = (transcript: string) => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      setUserInput(transcript);
      return;
    }

    setIsLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setIsLoading(false);
        return;
    }
    
    if (facingMode === 'user') {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }
    
    canvas.toBlob(async (blob) => {
      if (blob) {
          const dataUrl = await new Promise<string>(res => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blob);
          });
          const base64Data = dataUrl.split(',')[1];
          const imagePayload = {
              preview: dataUrl,
              api: { data: base64Data, mimeType: 'image/jpeg' }
          };
          await handleSendMessage(transcript, imagePayload);
      } else {
          await handleSendMessage(transcript);
      }
      if (window.innerWidth < 768) {
          stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };
  
  const handleToggleRecording = useCallback((onResultCallback: (transcript: string) => void) => {
    if (!isSpeechRecognitionSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const recognition = new SpeechRecognition();
      if (appSettings.spokenLanguage && appSettings.spokenLanguage !== 'auto') {
        recognition.lang = appSettings.spokenLanguage;
      }
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onResultCallback(transcript);
      };
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          alert("Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.");
        } else if (event.error !== 'no-speech') {
          console.error("Speech recognition error:", event.error);
        }
        setIsRecording(false);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  }, [isRecording, appSettings.spokenLanguage]);

  const handleMicToggle = useCallback(() => {
    setIsMicActive(prev => {
        const newMicState = !prev;
        if (newMicState) { // User is starting to speak, implement barge-in
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
            }
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsAiResponding(false);
        }
        return newMicState;
    });
  }, []);
  
  const handleToggleTts = () => {
    if (isTtsEnabled) {
      window.speechSynthesis.cancel();
    }
    setIsTtsEnabled(prev => !prev);
  };
  
  const handleSnapshotTaken = (imageDataUrl: string) => {
    if (imageDataUrl) {
      if (isCameraOn) {
        stopCamera();
      }
      removeAttachments();
      setImageForPreview(imageDataUrl);
      const [mimePart, dataPart] = imageDataUrl.split(';base64,');
      setImageForApi({ mimeType: mimePart.split(':')[1], data: dataPart });
    }
    setIsSnapshotModalOpen(false);
  };

  const filteredSessions = useMemo(() => {
    const reversed = [...activeAgentSessions].reverse();
    if (!searchQuery) return reversed;
    return reversed.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeAgentSessions, searchQuery]);
  
  const openAccountModal = () => { setIsProfileMenuOpen(false); setIsAccountModalOpen(true); }
  const openPersonalizationModal = () => { setIsProfileMenuOpen(false); setIsPersonalizationModalOpen(true); }
  const openSettingsModal = () => { setIsProfileMenuOpen(false); setIsSettingsModalOpen(true); }
  const handleSignOut = () => { setIsProfileMenuOpen(false); setIsSignOutModalOpen(true); };

  const handleCloseBlackboard = (blackboardHistory: Message[]) => {
    if (activeChatId && blackboardHistory.length > 1) {
      setAllSessions(prev => ({
        ...prev,
        [activeAgent]: prev[activeAgent].map(session => {
          if (session.id === activeChatId) {
            const newMessagesFromBlackboard = blackboardHistory.slice(1);
            return { ...session, messages: [...session.messages, ...newMessagesFromBlackboard] };
          }
          return session;
        })
      }));
    }
    setBlackboardData(null);
  };

  const handleOpenSnapshotModal = () => {
    if (isCameraOn) { stopCamera(); }
    setIsSnapshotModalOpen(true);
    setIsAttachmentMenuOpen(false);
  };

  const handleAgentSelect = (agent: AgentName) => {
    setActiveAgent(agent);
    setIsAgentMenuOpen(false);
    const agentSessions = allSessions[agent] || [];
    if (agentSessions.length > 0) {
        setActiveChatId(agentSessions[0].id);
    } else {
        handleNewChat(agent);
    }
    if(window.innerWidth < 768) { setIsSidebarOpen(false); }
  };

  const isChatView = true;
  const ChatIcon = activeAgentConfig.icon;

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] relative overflow-hidden">
      {isSidebarOpen && window.innerWidth < 768 && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/50 md:hidden" />
      )}
      <aside className={`bg-[var(--color-bg-primary)] flex flex-col border-r border-[var(--color-border)]
                       fixed top-0 left-0 h-full z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                       md:relative md:translate-x-0 md:transition-[width] group ${isSidebarOpen ? 'md:w-80' : 'md:w-20'} ${!isSidebarOpen && 'is-collapsed'}`}
      >
        <div className={`p-4 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'space-y-4' : 'space-y-2'}`}>
          <div className="relative group/tooltip">
            <button onClick={() => handleNewChat(activeAgent)} className={`w-full flex items-center justify-between p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary-hover)] transition-all duration-200
                                                        group-[.is-collapsed]:w-12 group-[.is-collapsed]:h-12 group-[.is-collapsed]:rounded-full group-[.is-collapsed]:justify-center group-[.is-collapsed]:p-0 group-[.is-collapsed]:mx-auto`}>
              <span className="group-[.is-collapsed]:hidden">New Chat</span>
              <PencilSquareIcon className="w-5 h-5 group-[.is-collapsed]:hidden" />
              <PlusIcon className="w-6 h-6 hidden group-[.is-collapsed]:block" />
            </button>
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
              New Chat
            </span>
          </div>

          <div className="relative group-[.is-collapsed]:hidden">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input type="text" placeholder="Search chats" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 ${accent.ring}`}/>
          </div>
          <div className="relative group/tooltip">
             <button onClick={() => setIsChatSearchModalOpen(true)} className="w-12 h-12 rounded-full justify-center items-center p-0 mx-auto hover:bg-[var(--color-bg-tertiary-hover)] transition-all duration-200 hidden group-[.is-collapsed]:flex">
                <MagnifyingGlassIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
              <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
                Search
              </span>
          </div>
          <div className="relative group/tooltip">
            <button onClick={() => setIsLibraryModalOpen(true)} className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                            group-[.is-collapsed]:w-12 group-[.is-collapsed]:h-12 group-[.is-collapsed]:rounded-full group-[.is-collapsed]:justify-center group-[.is-collapsed]:gap-0 group-[.is-collapsed]:mx-auto`}>
              <BookOpenIcon className="w-5 h-5" />
              <span className="group-[.is-collapsed]:hidden">Library</span>
            </button>
            <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
                Library
            </span>
          </div>
          <div className="relative">
            <div className="relative group/tooltip">
              <button ref={agentButtonRef} onClick={() => setIsAgentMenuOpen(p => !p)} className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                              group-[.is-collapsed]:w-12 group-[.is-collapsed]:h-12 group-[.is-collapsed]:rounded-full group-[.is-collapsed]:justify-center group-[.is-collapsed]:gap-0 group-[.is-collapsed]:mx-auto`}>
                <UsersIcon className="w-5 h-5" />
                <span className="group-[.is-collapsed]:hidden">Agents</span>
              </button>
              <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
                  Agents
              </span>
            </div>
            {isAgentMenuOpen && (
              <div ref={agentMenuRef} className="absolute bottom-full mb-2 left-2 w-[calc(100%-1rem)] bg-[var(--color-bg-primary)]/80 backdrop-blur-sm rounded-lg border border-[var(--color-border)] shadow-xl p-2 z-20 transition-all duration-200 ease-out transform origin-bottom
                           group-[.is-collapsed]:left-full group-[.is-collapsed]:ml-2 group-[.is-collapsed]:bottom-auto group-[.is-collapsed]:top-1/2 group-[.is-collapsed]:-translate-y-1/2 group-[.is-collapsed]:w-60 group-[.is-collapsed]:origin-left" style={{ opacity: isAgentMenuOpen ? 1 : 0, transform: isAgentMenuOpen ? 'scale(1)' : 'scale(0.95)' }}>
                  {Object.entries(AGENT_CONFIG)
                    .filter(([agentKey]) => agentKey !== activeAgent)
                    .map(([agentKey, agentConfig]) => (
                    <button key={agentKey} onClick={() => handleAgentSelect(agentKey as AgentName)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left text-[var(--color-text-primary)]">
                        {agentKey === 'ava' ? <HomeIcon className="w-5 h-5" /> : agentConfig.icon && <agentConfig.icon className="w-5 h-5" />}
                        <span>{agentKey === 'ava' ? 'Ava (Home)' : agentConfig.title}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 group-[.is-collapsed]:hidden">
          {filteredSessions.map(session => (
            <a key={session.id} href="#" onClick={(e) => { e.preventDefault(); setActiveChatId(session.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} 
              className={`block p-2 rounded-md truncate transition-colors ${activeChatId === session.id ? 'bg-[var(--color-bg-tertiary)]' : 'hover:bg-[var(--color-bg-tertiary-hover)]'}`}
            >
              {session.title}
            </a>
          ))}
        </nav>
        <div className="flex-grow hidden group-[.is-collapsed]:block"></div>
        <div className="p-4 border-t border-[var(--color-border)] mt-auto flex-shrink-0 relative">
          {isProfileMenuOpen && (
            <div ref={profileMenuRef} className="absolute bottom-full mb-2 w-[calc(100%-2rem)] bg-[var(--color-bg-primary)]/80 backdrop-blur-sm rounded-lg border border-[var(--color-border)] shadow-xl p-2 z-20 transition-all duration-200 ease-out transform origin-bottom
                         group-[.is-collapsed]:left-full group-[.is-collapsed]:ml-2 group-[.is-collapsed]:bottom-0 group-[.is-collapsed]:w-60 group-[.is-collapsed]:origin-left" style={{ opacity: isProfileMenuOpen ? 1 : 0, transform: isProfileMenuOpen ? 'scale(1)' : 'scale(0.95)' }}>
              <button onClick={openAccountModal} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left text-[var(--color-text-primary)]">
                <UserCircleIcon className="w-5 h-5" /><span>Account</span>
              </button>
              <button onClick={openPersonalizationModal} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left text-[var(--color-text-primary)]">
                <WrenchScrewdriverIcon className="w-5 h-5" /><span>Personalization</span>
              </button>
               {isAdmin && (
                <button onClick={() => setIsKnowledgebaseModalOpen(true)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left text-[var(--color-text-primary)]">
                    <ArrowUpTrayIcon className="w-5 h-5" /><span>Knowledgebase</span>
                </button>
               )}
              <button onClick={openSettingsModal} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left text-[var(--color-text-primary)]">
                <Cog6ToothIcon className="w-5 h-5" /><span>Settings</span>
              </button>
              <div className="h-px bg-[var(--color-border)] my-1"></div>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-900/40 transition-colors text-left text-red-500">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" /><span>Sign out</span>
              </button>
            </div>
          )}
          {isAdmin && (
            <div className="relative group/tooltip mb-2">
                <button onClick={() => setIsAdminPanelModalOpen(true)} className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                                group-[.is-collapsed]:w-12 group-[.is-collapsed]:h-12 group-[.is-collapsed]:rounded-full group-[.is-collapsed]:justify-center group-[.is-collapsed]:gap-0 group-[.is-collapsed]:mx-auto`}>
                    <CubeIcon className="w-5 h-5" />
                    <span className="group-[.is-collapsed]:hidden">Admin Panel</span>
                </button>
                <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
                    Admin Panel
                </span>
            </div>
          )}
           <div className="relative group/tooltip">
              <button ref={profileButtonRef} onClick={() => setIsProfileMenuOpen(prev => !prev)} className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left
                            group-[.is-collapsed]:flex-col group-[.is-collapsed]:w-auto group-[.is-collapsed]:h-auto group-[.is-collapsed]:justify-center group-[.is-collapsed]:gap-1 group-[.is-collapsed]:py-2`}>
                <img src={userData.avatar} alt="User avatar" className="w-8 h-8 rounded-full object-cover group-[.is-collapsed]:w-10 group-[.is-collapsed]:h-10"/>
                <span className="font-semibold truncate group-[.is-collapsed]:hidden">{userData.fullName}</span>
                <span className="hidden group-[.is-collapsed]:block text-xs text-[var(--color-text-secondary)]">Account</span>
              </button>
              <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-[.is-collapsed]:group-hover/tooltip:opacity-100 group-[.is-collapsed]:group-hover/tooltip:visible transition-all pointer-events-none">
                {userData.fullName}
              </span>
            </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <header className="bg-[var(--color-bg-primary)]/70 backdrop-blur-md p-4 border-b border-[var(--color-border)] shadow-sm flex-shrink-0 z-10 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className="relative group/tooltip">
                <button onClick={() => setIsSidebarOpen(prev => !prev)} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-tertiary-hover)] transition-colors" aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
                    {isSidebarOpen ? <ArrowLeftCircleIcon className="w-6 h-6" /> : <ArrowRightCircleIcon className="w-6 h-6" />}
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[var(--color-bg-primary)] text-white text-xs font-semibold py-1.5 px-3 rounded-md border border-[var(--color-border)] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none z-20">
                    {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                </span>
              </div>
              {activeAgent !== 'ava' && (
                <button onClick={() => handleAgentSelect('ava')} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-bg-tertiary-hover)]" aria-label="Go to Home">
                  <HomeIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {ChatIcon && <ChatIcon className="w-7 h-7" />}
              <h1 className={`text-xl font-bold text-center`}>{activeAgentConfig.title}</h1>
            </div>
            <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)] rounded-full p-1">
              {(activeAgent === 'work' || activeAgent === 'entrepreneur') && (
                  <>
                      <button onClick={() => setIsIntegrationsModalOpen(true)} className={`p-2 rounded-full transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary-hover)]`} aria-label="Open integrations">
                          <CubeIcon className="w-5 h-5" />
                      </button>
                      <div className="w-px h-5 bg-[var(--color-border)]"></div>
                  </>
              )}
              <button onClick={handleToggleCamera} className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isCameraOn ? 'bg-green-600 text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary-hover)]'}`} aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}>
                  <VideoCameraIcon className="w-5 h-5" />
              </button>
              {isTtsSupported && (
                <>
                  <div className="w-px h-5 bg-[var(--color-border)]"></div>
                  <button onClick={handleToggleTts} className={`p-2 rounded-full transition-colors ${isTtsEnabled ? accent.text : 'text-[var(--color-text-secondary)]'} hover:bg-[var(--color-bg-tertiary-hover)]`} aria-label={isTtsEnabled ? 'Disable audio output' : 'Enable audio output'}>
                    {isTtsEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
        </header>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="flex-1 flex overflow-hidden">
            <>
              <main className={`flex-1 flex-col transition-all duration-300 ease-in-out ${isCameraOn ? (window.innerWidth < 768 ? 'hidden' : 'flex w-1/2') : 'flex w-full'}`}>
                {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
                        <h1 className="text-4xl font-bold">{activeAgentConfig.subtitle}</h1>
                        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">Ask me anything, or show me your work.</p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-w-xl">
                            {activeAgentConfig.promptStarters.map((suggestion) => (
                              <button
                                  key={suggestion.name}
                                  onClick={() => handleSendMessage(suggestion.prompt)}
                                  className="flex flex-col items-center justify-center text-center gap-1.5 p-2 rounded-xl w-24 h-24 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-accent)]"
                              >
                                  <div className={`p-2 rounded-full ${suggestion.iconBgColor}`}>
                                      {suggestion.icon}
                                  </div>
                                  <span className="font-semibold text-sm">{suggestion.name}</span>
                              </button>
                            ))}
                        </div>
                    </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                      <div className="space-y-4 p-4 md:p-6">
                        {messages.map((msg, index) =>
                          msg.sender === Sender.AI ? (
                            <AIMessage
                              key={msg.id}
                              message={msg}
                              speak={speak}
                              previousSender={messages[index - 1]?.sender}
                            />
                          ) : (
                            <UserMessage
                              key={msg.id}
                              message={msg}
                              accentColor={appSettings.accentColor}
                            />
                          )
                        )}
                      </div>
                      {isLoading && (
                        <div className="p-4 md:p-6">
                           <LoadingIndicator previousSender={messages[messages.length - 1]?.sender} />
                        </div>
                      )}
                      <div ref={chatEndRef} />
                  </div>
                )}
              </main>
              <aside className={`relative bg-black transition-all duration-300 ease-in-out ${isCameraOn ? 'w-full fixed inset-0 z-20 md:relative md:w-1/2 md:border-l md:border-[var(--color-border)]' : 'w-0'} overflow-hidden group`}>
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-1' : ''}`}></video>
                  {isCameraOn && !isCameraReady && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  {isCameraOn && isCameraReady && (
                    <>
                      <div className="absolute inset-0 pointer-events-none">
                        {liveHighlights.map((el, index) => {
                          if (el.type === 'highlight' && el.width && el.height) {
                            const clipPathValue = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${el.x}% ${el.y}%, ${el.x + el.width}% ${el.y}%, ${el.x + el.width}% ${el.y + el.height}%, ${el.x}% ${el.y + el.height}%)`;
                            return (
                              <React.Fragment key={index}>
                                <div className="absolute inset-0 bg-black/60" style={{ clipPath: clipPathValue }}/>
                                <div className="absolute border-2 border-cyan-400 rounded-lg shadow-[0_0_15px_3px_rgba(34,211,238,0.6)]" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%` }}/>
                              </React.Fragment>
                            );
                          }
                          if (el.type === 'point' && el.radius) {
                            return (
                              <div key={index} className="absolute flex items-center justify-center" style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-12 h-12 rounded-full bg-blue-500/50 animate-ping"></div>
                                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                      {(isAiResponding || liveAiComment) && (
                        <div className="absolute bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex flex-col items-center gap-2 animate-fade-in z-10">
                            {isAiResponding && (
                                <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 py-2 px-4 rounded-lg text-center text-white text-sm shadow-lg flex items-center justify-center gap-3">
                                    <WaveformIndicator />
                                </div>
                            )}
                            {liveAiComment && (
                                <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-lg text-center text-white text-sm shadow-lg">
                                    {liveAiComment}
                                </div>
                            )}
                        </div>
                      )}
                    </>
                  )}
                  <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center gap-4 transition-opacity duration-300 ${isCameraOn && isCameraReady ? 'opacity-100' : 'opacity-0'}`}>
                      <button onClick={handleSwitchCamera} className="absolute left-4 bottom-4 p-2 bg-black/30 rounded-full text-white backdrop-blur-sm" aria-label="Switch camera">
                          <CameraSwitchIcon className="w-6 h-6" />
                      </button>
                      
                      {isCameraReady && (
                        <button onClick={handleMicToggle} className={`p-4 rounded-full transition-all duration-200 transform active:scale-90 ${isMicActive ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' : `${accent.bg} shadow-lg ${accent.bg.replace('-500','-500/50')}`}`} aria-label={isMicActive ? 'Stop listening' : 'Start listening'}>
                            <MicrophoneIcon className="w-8 h-8 text-white"/>
                        </button>
                      )}

                      <button onClick={handleToggleCamera} className="absolute right-4 bottom-4 p-2 bg-black/30 rounded-full text-white backdrop-blur-sm" aria-label="Stop camera session">
                          <XMarkIcon className="w-6 h-6" />
                      </button>
                  </div>
              </aside>
            </>
        </div>

        {isChatView && !isCameraOn && (
          <footer className={`bg-[var(--color-bg-primary)]/80 backdrop-blur-md p-4 border-t border-[var(--color-border)] flex-shrink-0 z-10`}>
            <div className="max-w-3xl mx-auto">
              {imageForPreview && (
                <div className="relative mb-2 w-fit">
                  <img src={imageForPreview} alt="Preview" className="h-24 w-auto rounded-md" />
                  <button onClick={removeAttachments} className="absolute -top-2 -right-2 bg-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-red-600 transition-colors" aria-label="Remove image">
                    <XCircleIcon className="w-5 h-5"/>
                  </button>
                </div>
              )}
              {attachedFile && (
                <div className="relative mb-2 w-fit bg-[var(--color-bg-tertiary)] p-2 rounded-md flex items-center gap-2">
                  <DocumentTextIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                  <span className="text-sm font-medium">{attachedFile.name}</span>
                  <button onClick={removeAttachments} className="absolute -top-2 -right-2 bg-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-red-600 transition-colors" aria-label="Remove file">
                    <XCircleIcon className="w-5 h-5"/>
                  </button>
                </div>
              )}
              <div className={`relative flex items-end gap-2 bg-[var(--color-bg-primary)] rounded-xl p-2 focus-within:ring-2 ${accent.ring} transition-shadow border border-transparent focus-within:border-[var(--color-accent)]`}>
                  {isAttachmentMenuOpen && (
                  <div
                    ref={attachmentMenuRef}
                    className="absolute bottom-full mb-2 w-48 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm rounded-lg border border-[var(--color-border)] shadow-xl p-2 z-20 transition-all duration-200 ease-out transform origin-bottom"
                      style={{
                      opacity: isAttachmentMenuOpen ? 1 : 0,
                      transform: isAttachmentMenuOpen ? 'scale(1)' : 'scale(0.95)',
                    }}
                  >
                    <button 
                      onClick={handleOpenSnapshotModal}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <span>Take a picture</span>
                    </button>
                      <button
                      onClick={() => { docFileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left"
                    >
                      <DocumentArrowUpIcon className="w-5 h-5" />
                      <span>Upload file</span>
                    </button>
                    <button 
                      onClick={() => { imageFileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--color-bg-tertiary-hover)] transition-colors text-left"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      <span>Upload image</span>
                    </button>
                  </div>
                )}
                <button
                  ref={attachmentButtonRef}
                  onClick={() => setIsAttachmentMenuOpen(prev => !prev)} 
                  disabled={isRecording || isLoading || !!imageForPreview || !!attachedFile} 
                  className={`p-2 text-[var(--color-text-secondary)] hover:${accent.text} transition-colors rounded-full disabled:opacity-50`} 
                  aria-label="More options"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                </button>
                <input type="file" ref={imageFileInputRef} onChange={handleImageChange} className="hidden" accept="image/*"/>
                <input type="file" ref={docFileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf,.doc,.docx" />
                <textarea
                  ref={textareaRef} value={userInput} onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question..."
                  className="w-full bg-transparent resize-none outline-none p-2 placeholder-[var(--color-text-secondary)] max-h-40"
                  rows={1}
                  disabled={isRecording || isLoading}
                />
                {isSpeechRecognitionSupported && (
                    <button onClick={() => handleToggleRecording(handleSpeechResult)} disabled={isLoading} className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isRecording ? 'text-red-500 animate-pulse' : `text-[var(--color-text-secondary)] hover:${accent.text}`}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                      <MicrophoneIcon className="w-5 h-5"/>
                    </button>
                  )}
                <button onClick={() => handleSendMessage()} disabled={isLoading || (!userInput.trim() && !imageForApi && !attachedFile)} className={`p-2 ${accent.bg} text-white rounded-full ${accent.hoverBg} disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors`} aria-label="Send message">
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </footer>
        )}
        <AccountModal 
          isOpen={isAccountModalOpen} 
          onClose={() => setIsAccountModalOpen(false)}
          userData={userData}
          setUserData={setUserData}
        />
        <PersonalizationModal
            isOpen={isPersonalizationModalOpen}
            onClose={() => setIsPersonalizationModalOpen(false)}
            settings={personalizationSettings}
            setSettings={setPersonalizationSettings}
        />
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            settings={appSettings}
            setSettings={setAppSettings}
        />
        <LibraryModal
            isOpen={isLibraryModalOpen}
            onClose={() => setIsLibraryModalOpen(false)}
            imageMessages={allImageMessages}
        />
        <SnapshotModal
            isOpen={isSnapshotModalOpen}
            onClose={() => setIsSnapshotModalOpen(false)}
            onSnapshot={handleSnapshotTaken}
        />
        <KnowledgebaseModal
          isOpen={isKnowledgebaseModalOpen}
          onClose={() => setIsKnowledgebaseModalOpen(false)}
          knowledgebaseSections={knowledgebaseSections}
          setKnowledgebaseSections={setKnowledgebaseSections}
        />
        {blackboardData && (
          <BlackboardModal
            isOpen={!!blackboardData}
            onClose={handleCloseBlackboard}
            sessionData={blackboardData}
            knowledgebaseSections={knowledgebaseSections}
            userName={firstName}
          />
        )}
        <ChatSearchModal
          isOpen={isChatSearchModalOpen}
          onClose={() => setIsChatSearchModalOpen(false)}
          chatSessions={activeAgentSessions}
          setActiveChatId={(id) => {
            setActiveChatId(id);
            setIsChatSearchModalOpen(false);
          }}
        />
        <SignOutModal
            isOpen={isSignOutModalOpen}
            onClose={() => setIsSignOutModalOpen(false)}
            onConfirm={onLogout}
            email={userData.email}
        />
        <IntegrationsModal
            isOpen={isIntegrationsModalOpen}
            onClose={() => setIsIntegrationsModalOpen(false)}
        />
        <AdminPanelModal
            isOpen={isAdminPanelModalOpen}
            onClose={() => setIsAdminPanelModalOpen(false)}
        />
      </div>
    </div>
  );
}
