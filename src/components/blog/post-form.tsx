'use client';

// Blog post creation and editing form with media upload support
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/ui/tag-input';
import { MediaManager } from '@/components/media/media-manager';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal';
import { useAuthStore } from '@/store/auth-store';
import { createPost, updatePost } from '@/lib/database';
import { uploadMultipleFiles } from '@/lib/storage';
import { BlogPost, MediaItem } from '@/types/blog';
import { cn } from '@/lib/utils';

// Form validation schema
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
  existingPost?: BlogPost | null;
}

export function PostForm({ isOpen, onClose, onSave, existingPost }: PostFormProps) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      tags: [],
    },
  });

  const watchedTags = watch('tags');



  // Load existing post data when editing or reset for new posts
  useEffect(() => {
    if (isOpen) {
      if (existingPost) {
        reset({
          title: existingPost.title,
          content: existingPost.content,
          excerpt: existingPost.excerpt,
          tags: existingPost.tags || [], // Ensure it's an array
        });
        setUploadedMedia(existingPost.media || []);
      } else {
        reset({
          title: '',
          content: '',
          excerpt: '',
          tags: [], // Explicitly set empty array
        });
        setUploadedMedia([]);
      }
      setSelectedFiles([]);
    }
  }, [existingPost, reset, isOpen]);

  // Auto-generate excerpt from content
  useEffect(() => {
    const content = watch('content');
    const currentExcerpt = watch('excerpt');
    if (content && !currentExcerpt) {
      const excerpt = content.slice(0, 200).trim();
      setValue('excerpt', excerpt);
    }
  }, [watch, setValue]);

  const handleTagsChange = (newTags: string[]) => {
    setValue('tags', newTags);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(onSubmit)(e);
  };

  // Reset form when modal closes
  const handleClose = () => {
    reset({
      title: '',
      content: '',
      excerpt: '',
      tags: [],
    });
    setSelectedFiles([]);
    setUploadedMedia([]);
    onClose();
  };

  const onSubmit = async (data: PostFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let postId: string;
      let finalMedia: MediaItem[] = [...uploadedMedia];

      if (existingPost) {
        // Update existing post
        postId = existingPost.id;
      } else {
        // Create new post
        postId = await createPost(data, user.uid, user.displayName || 'User', user.email || '');
      }

      // Upload new files if any
      if (selectedFiles.length > 0) {
        const newMedia = await uploadMultipleFiles(selectedFiles, user.uid, postId);
        finalMedia = [...finalMedia, ...newMedia];
      }

      // Update the post with all data including media
      const updateData = {
        ...data,
        media: finalMedia
      };
      
      await updatePost(postId, updateData);

      // Create the complete post object
      const completePost: BlogPost = {
        id: postId,
        ...data,
        media: finalMedia,
        authorId: user.uid,
        authorName: user.displayName || 'User',
        authorEmail: user.email || '',
        createdAt: existingPost?.createdAt || new Date(),
        updatedAt: new Date(),
        viewCount: existingPost?.viewCount || 0,
        avgRating: existingPost?.avgRating || 0,
        totalRatings: existingPost?.totalRatings || 0,
      };

      onSave(completePost);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Media viewer handled by MediaManager component
  const handleMediaUpload = (files: File[]) => {
    setSelectedFiles(files); // Replace instead of append to avoid duplication
  };

  const handleMediaRemove = (mediaId: string) => {
    setUploadedMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Modal open={isOpen} onOpenChange={handleClose}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>
              {existingPost ? 'Edit Post' : 'Create New Post'}
            </ModalTitle>
          </ModalHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-900">
                Title *
              </label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter post title..."
                className={cn(errors.title && 'border-red-500')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium text-gray-900">
                Content *
              </label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="Write your post content..."
                className={cn('min-h-[200px]', errors.content && 'border-red-500')}
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label htmlFor="excerpt" className="text-sm font-medium text-gray-900">
                Excerpt
              </label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                placeholder="Brief description of your post (auto-generated if left empty)..."
                className={cn('min-h-[100px]', errors.excerpt && 'border-red-500')}
              />
              {errors.excerpt && (
                <p className="text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Tags */}
            <TagInput
              tags={watchedTags || []}
              onTagsChange={handleTagsChange}
              maxTags={10}
              placeholder="Add a tag..."
              disabled={isLoading}
            />
            {errors.tags && (
              <p className="text-sm text-red-600">{errors.tags.message}</p>
            )}



            {/* Media Upload */}
            <MediaManager
              uploadedMedia={uploadedMedia}
              selectedFiles={selectedFiles}
              onMediaUpload={handleMediaUpload}
              onMediaRemove={handleMediaRemove}
              onFileRemove={handleFileRemove}
              disabled={isLoading}
              maxFiles={10}
            />



            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving...' : existingPost ? 'Update Post' : 'Create Post'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Media Viewer - Temporarily disabled during refactor */}
      {/* <MediaViewer
        media={viewerMedia}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerMedia(null);
        }}
      /> */}
    </>
  );
} 