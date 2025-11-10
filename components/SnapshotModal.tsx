import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, CameraSwitchIcon } from './Icons';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapshot: (imageDataUrl: string) => void;
}

const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, onClose, onSnapshot }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCamera();
    setError(null);
    setIsCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
      setFacingMode(mode);
    } catch (err) {
      console.error(`Error starting camera in ${mode} mode:`, err);
      // If environment camera fails, try user camera as a fallback (common on desktops)
      if (mode === 'environment') {
          console.log("Falling back to user camera.");
          startCamera('user');
      } else {
         setError('Could not access camera. Please check permissions.');
      }
    }
  }, [stopCamera]);
  
  useEffect(() => {
    if (isOpen) {
      startCamera('environment');
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);
  
  const handleSwitchCamera = () => {
    startCamera(facingMode === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Flip the image if it's the user-facing camera for a non-mirrored result
    if (facingMode === 'user') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        ctx.restore();
    } else {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSnapshot(dataUrl);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div 
        className="relative bg-black w-full h-full max-w-full max-h-full flex flex-col items-center justify-center transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas ref={canvasRef} className="hidden"></canvas>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-contain ${facingMode === 'user' ? 'transform -scale-x-1' : ''}`}
        />
        
        {!isCameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="w-10 h-10 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 p-4">
              <p className="text-lg text-center">{error}</p>
              <button onClick={onClose} className="mt-4 bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md">Close</button>
          </div>
        )}

        {isCameraReady && (
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
              <div className="absolute left-6 bottom-6">
                  <button onClick={handleSwitchCamera} className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm hover:bg-white/30" aria-label="Switch camera">
                      <CameraSwitchIcon className="w-7 h-7" />
                  </button>
              </div>
              <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white/90 p-1 flex items-center justify-center ring-4 ring-white/30 ring-offset-2 ring-offset-black/20 hover:bg-white transition-colors" aria-label="Take picture">
                  <div className="w-full h-full rounded-full bg-white border-4 border-black/20"></div>
              </button>
              <div className="absolute right-6 bottom-6">
                   <button onClick={onClose} className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm hover:bg-white/30" aria-label="Close camera">
                      <XMarkIcon className="w-7 h-7" />
                   </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotModal;
