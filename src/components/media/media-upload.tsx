'use client';

// Media upload component with drag and drop support
import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertCircle } from 'lucide-react';
import { validateFile } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function MediaUpload({ onFilesSelected, maxFiles = 10, className }: MediaUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setErrors([]);
    const newErrors: string[] = [];

    // Validate accepted files
    const validFiles: FileWithPreview[] = [];
    acceptedFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const fileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file)
          });
          validFiles.push(fileWithPreview);
        } else {
          validFiles.push(file);
        }
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      newErrors.push(`${rejection.file.name}: File type not supported`);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  }, [selectedFiles, onFilesSelected, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.mkv', '.webm', '.mov', '.avi']
    },
    maxFiles,
    multiple: true
  });



  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <Upload 
              className={cn(
                "w-12 h-12 transition-colors duration-200",
                isDragActive ? "text-blue-500" : "text-gray-400"
              )} 
            />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? "Drop files here..." : "Upload media files"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Drag & drop images or videos, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports: JPG, PNG, WebP, GIF, MP4, MKV, WebM, MOV, AVI (max 500MB each)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File count indicator (if files selected) */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
} 