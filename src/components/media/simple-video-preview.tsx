'use client';

import { useState } from 'react';
import { Video, Play } from 'lucide-react';

interface SimpleVideoPreviewProps {
  videoUrl: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function SimpleVideoPreview({ videoUrl, alt, className, onClick }: SimpleVideoPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center cursor-pointer group overflow-hidden ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      {/* Video icon */}
      <div className="relative z-10 flex flex-col items-center space-y-2">
        <div className={`p-4 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 ${
          isHovered ? 'bg-white/30 scale-110' : ''
        }`}>
          <Video className="w-8 h-8 text-white" />
        </div>
        
        <div className="text-center">
          <div className="text-white/90 text-sm font-medium">Video</div>
          <div className="text-white/70 text-xs">{alt}</div>
        </div>
      </div>
      
      {/* Play button overlay */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-black/50 rounded-full p-3">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
      
      {/* Corner indicator */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        VIDEO
      </div>
    </div>
  );
} 