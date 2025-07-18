'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Video } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function VideoThumbnail({ videoUrl, alt, className, onClick }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateThumbnail();
  }, [videoUrl]);

  const generateThumbnail = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set a timeout to fallback to generic icon if thumbnail generation fails
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second timeout

    const handleLoadedData = () => {
      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        // Seek to 1 second (or 10% of duration, whichever is smaller)
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      } catch (error) {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    const handleSeeked = () => {
      try {
        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and create URL
        canvas.toBlob((blob) => {
          clearTimeout(timeout);
          if (blob) {
            const url = URL.createObjectURL(blob);
            setThumbnailUrl(url);
          }
          setIsLoading(false);
        }, 'image/jpeg', 0.8);
      } catch (error) {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    const handleError = () => {
      clearTimeout(timeout);
      setIsLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    // Load the video
    video.src = videoUrl;
    video.load();

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      
      // Clean up blob URL
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  };

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        crossOrigin="anonymous"
        muted
        playsInline
        preload="metadata"
      />
      
      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
            {/* Display thumbnail or fallback */}
      {thumbnailUrl && !isLoading ? (
        <Image
          src={thumbnailUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full relative overflow-hidden">
          {/* Try to use video element as preview */}
          <video
            className="w-full h-full object-cover"
            src={videoUrl}
            muted
            playsInline
            preload="metadata"
            onError={() => setIsLoading(false)}
          />
          
          {/* Overlay for video appearance */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Video badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <Video className="w-3 h-3" />
            <span>VIDEO</span>
          </div>
        </div>
      )}
      
      {/* Play button overlay - only show if we have a thumbnail */}
      {thumbnailUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
} 