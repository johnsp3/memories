// Storage service functions for Firebase Storage
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from './firebase';
import { MediaItem } from '@/types/blog';

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  userId: string,
  postId?: string
): Promise<MediaItem> => {
  try {
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    
    // Determine storage path
    const storagePath = postId 
      ? `posts/${postId}/${fileName}`
      : `temp/${userId}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Determine file type
    const fileType: 'image' | 'video' = file.type.startsWith('image/') ? 'image' : 'video';
    
    const mediaItem: MediaItem = {
      id: fileName,
      url: downloadURL,
      type: fileType,
      filename: file.name,
      size: file.size,
      createdAt: new Date(),
    };
    
    return mediaItem;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  userId: string,
  postId?: string,
  onProgress?: (index: number, total: number) => void
): Promise<MediaItem[]> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const mediaItem = await uploadFile(file, userId, postId);
      onProgress?.(index + 1, files.length);
      return mediaItem;
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Delete multiple files
 */
export const deleteMultipleFiles = async (filePaths: string[]): Promise<void> => {
  try {
    const deletePromises = filePaths.map(path => deleteFile(path));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple files:', error);
    throw error;
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (filePath: string) => {
  try {
    const storageRef = ref(storage, filePath);
    return await getMetadata(storageRef);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 */
export const listFiles = async (directoryPath: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, directoryPath);
    const result = await listAll(storageRef);
    
    return result.items.map(item => item.fullPath);
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Move files from temp to post directory
 */
export const moveFilesToPost = async (
  tempFiles: MediaItem[],
  userId: string,
  postId: string
): Promise<MediaItem[]> => {
  try {
    const movedFiles: MediaItem[] = [];
    
    for (const file of tempFiles) {
      // Download the file data (this is a workaround since Firebase doesn't have a native move)
      const response = await fetch(file.url);
      const blob = await response.blob();
      const fileObj = new File([blob], file.filename, { type: blob.type });
      
      // Upload to new location
      const newFile = await uploadFile(fileObj, userId, postId);
      movedFiles.push(newFile);
      
      // Delete from temp location
      const tempPath = `temp/${userId}/${file.id}`;
      await deleteFile(tempPath);
    }
    
    return movedFiles;
  } catch (error) {
    console.error('Error moving files to post:', error);
    throw error;
  }
};

/**
 * Clean up temp files older than 24 hours
 */
export const cleanupTempFiles = async (userId: string): Promise<void> => {
  try {
    const tempPath = `temp/${userId}`;
    const files = await listFiles(tempPath);
    
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (const filePath of files) {
      try {
        const metadata = await getFileMetadata(filePath);
        const fileTime = new Date(metadata.timeCreated).getTime();
        
        if (now - fileTime > oneDayMs) {
          await deleteFile(filePath);
        }
      } catch {
        // File might have been deleted already, continue
        console.warn('Could not check file metadata:', filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    // Don't throw error for cleanup operations
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Max file size: 500MB
  const MAX_SIZE = 500 * 1024 * 1024;
  
  // Allowed file types
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mkv', 'video/webm', 'video/mov', 'video/avi'];
  const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 500MB limit'
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images (JPEG, PNG, WebP, GIF) or videos (MP4, MKV, WebM, MOV, AVI)'
    };
  }
  
  return { valid: true };
};

/**
 * Get optimized image URL for different sizes
 */
export const getOptimizedImageUrl = (originalUrl: string): string => {
  // For now, return original URL
  // In production, you might want to use Firebase's image transformation
  // or implement your own image optimization service
  return originalUrl;
}; 