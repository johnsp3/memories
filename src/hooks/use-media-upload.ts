import { useState } from 'react';
import { MediaItem } from '@/types/blog';
import { uploadMultipleFiles } from '@/lib/storage';

export interface MediaUploadState {
  selectedFiles: File[];
  uploadedMedia: MediaItem[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface UseMediaUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onUploadComplete?: (media: MediaItem[]) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_OPTIONS: Required<UseMediaUploadOptions> = {
  maxFiles: 10,
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ],
  onUploadComplete: () => {},
  onError: () => {},
};

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<MediaUploadState>({
    selectedFiles: [],
    uploadedMedia: [],
    isUploading: false,
    uploadProgress: 0,
    error: null,
  });

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Check file type
      if (!opts.allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
        continue;
      }

      // Check file size
      if (file.size > opts.maxFileSize) {
        const sizeMB = Math.round(opts.maxFileSize / (1024 * 1024));
        errors.push(`${file.name}: File size exceeds ${sizeMB}MB limit`);
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  const addFiles = (newFiles: File[]) => {
    const { valid, errors } = validateFiles(newFiles);
    
    if (errors.length > 0) {
      setState(prev => ({ ...prev, error: errors.join(', ') }));
      return;
    }

    const totalFiles = state.selectedFiles.length + state.uploadedMedia.length + valid.length;
    if (totalFiles > opts.maxFiles) {
      setState(prev => ({ 
        ...prev, 
        error: `Maximum ${opts.maxFiles} files allowed` 
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      selectedFiles: [...prev.selectedFiles, ...valid],
      error: null,
    }));
  };

  const removeFile = (index: number) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index),
    }));
  };

  const removeUploadedMedia = (mediaId: string) => {
    setState(prev => ({
      ...prev,
      uploadedMedia: prev.uploadedMedia.filter(media => media.id !== mediaId),
    }));
  };

  const uploadFiles = async (userId: string, postId?: string): Promise<MediaItem[]> => {
    if (state.selectedFiles.length === 0) {
      return state.uploadedMedia;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isUploading: true, 
        uploadProgress: 0,
        error: null 
      }));

      const uploadedMedia = await uploadMultipleFiles(
        state.selectedFiles,
        userId,
        postId,
        (index: number, total: number) => {
          const progress = Math.round((index / total) * 100);
          setState(prev => ({ ...prev, uploadProgress: progress }));
        }
      );

      const allMedia = [...state.uploadedMedia, ...uploadedMedia];
      
      setState(prev => ({
        ...prev,
        uploadedMedia: allMedia,
        selectedFiles: [],
        isUploading: false,
        uploadProgress: 100,
      }));

      opts.onUploadComplete(allMedia);
      return allMedia;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage,
      }));
      
      opts.onError(error instanceof Error ? error : new Error(errorMessage));
      return state.uploadedMedia;
    }
  };

  const setUploadedMedia = (media: MediaItem[]) => {
    setState(prev => ({ ...prev, uploadedMedia: media }));
  };

  const reset = () => {
    setState({
      selectedFiles: [],
      uploadedMedia: [],
      isUploading: false,
      uploadProgress: 0,
      error: null,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    addFiles,
    removeFile,
    removeUploadedMedia,
    uploadFiles,
    setUploadedMedia,
    reset,
    clearError,
    totalMediaCount: state.selectedFiles.length + state.uploadedMedia.length,
    canAddMore: (state.selectedFiles.length + state.uploadedMedia.length) < opts.maxFiles,
  };
} 