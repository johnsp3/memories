'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MediaUpload } from '@/components/media/media-upload';
import { MediaViewer } from '@/components/media/media-viewer';
import { VideoThumbnail } from '@/components/media/video-thumbnail';
import { MediaItem } from '@/types/blog';

interface MediaManagerProps {
  uploadedMedia: MediaItem[];
  selectedFiles: File[];
  onMediaUpload: (files: File[]) => void;
  onMediaRemove: (mediaId: string) => void;
  onFileRemove: (fileIndex: number) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

export function MediaManager({
  uploadedMedia,
  selectedFiles,
  onMediaUpload,
  onMediaRemove,
  onFileRemove,
  disabled = false,
  maxFiles = 10,
  className = ""
}: MediaManagerProps) {
  const [viewerMedia, setViewerMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openMediaViewer = (media: MediaItem) => {
    setViewerMedia(media);
    setIsViewerOpen(true);
  };

  const totalMediaCount = uploadedMedia.length + selectedFiles.length;

  return (
    <div className={className}>
      {/* Media Upload */}
      {!disabled && totalMediaCount < maxFiles && (
        <div className="mb-6">
          <MediaUpload onFilesSelected={onMediaUpload} />
        </div>
      )}

      {/* Existing Media */}
      {uploadedMedia.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Uploaded Media ({uploadedMedia.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {uploadedMedia.map((media) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  {media.type === 'image' ? (
                    <Image
                      src={media.url}
                      alt={media.filename}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <VideoThumbnail
                      videoUrl={media.url}
                      alt={media.filename}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Media Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openMediaViewer(media)}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!disabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onMediaRemove(media.id)}
                        className="bg-red-500/80 hover:bg-red-600/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {media.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selected Files ({selectedFiles.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎥</div>
                        <div className="text-xs text-gray-600 px-2">
                          {file.name}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* File Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    {!disabled && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onFileRemove(index)}
                        className="bg-red-500/80 hover:bg-red-600/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* File Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {file.type.startsWith('image/') ? 'image' : 'video'}
                    </span>
                  </div>

                  {/* File Size */}
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Media Count Warning */}
      {totalMediaCount >= maxFiles && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-800">
            Maximum {maxFiles} media files allowed. Remove some files to add more.
          </p>
        </div>
      )}

      {/* Media Viewer */}
      <MediaViewer
        media={viewerMedia}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerMedia(null);
        }}
      />
    </div>
  );
} 