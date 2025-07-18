'use client';

// Media viewer component for popup display of images and videos
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Modal, ModalContent, ModalOverlay, ModalTitle } from '@/components/ui/modal';
import { MediaItem } from '@/types/blog';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MediaViewerProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export function MediaViewer({ 
  media, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious, 
  showNavigation = false 
}: MediaViewerProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Reset video state when media changes
  useEffect(() => {
    if (media?.type === 'video') {
      setIsVideoPlaying(false);
      setIsVideoMuted(false);
    }
  }, [media]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (showNavigation && onPrevious) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (showNavigation && onNext) {
            onNext();
          }
          break;
        case ' ':
          if (media?.type === 'video' && videoElement) {
            e.preventDefault();
            togglePlayPause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious, showNavigation, media, videoElement]);

  const togglePlayPause = () => {
    if (!videoElement) return;

    if (isVideoPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleMute = () => {
    if (!videoElement) return;
    
    videoElement.muted = !isVideoMuted;
    setIsVideoMuted(!isVideoMuted);
  };

  const downloadMedia = () => {
    if (!media) return;
    
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!media) return null;

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
        <ModalTitle className="sr-only">
          {media ? `Viewing ${media.filename}` : 'Media Viewer'}
        </ModalTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Navigation Buttons */}
          {showNavigation && (
            <>
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {onNext && (
                <button
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Media Content */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {media.type === 'image' ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                src={media.url}
                alt={media.filename}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                draggable={false}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative max-w-full max-h-full"
              >
                <video
                  ref={setVideoElement}
                  src={media.url}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  controls={false}
                  muted={isVideoMuted}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onLoadedData={() => {
                    if (videoElement) {
                      videoElement.muted = isVideoMuted;
                    }
                  }}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={togglePlayPause}
                      className="w-16 h-16 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Video Controls Bar */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlayPause}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                    >
                      {isVideoMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={downloadMedia}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Info Bar */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{media.filename}</h3>
                <p className="text-sm text-gray-300">
                  {formatFileSize(media.size)} • {media.type.toUpperCase()}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadMedia}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
} 