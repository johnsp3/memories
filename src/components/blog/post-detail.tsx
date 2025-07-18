'use client';

// Blog post detail view with full content, media gallery, comments, and ratings
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar, Eye, Tag, ArrowLeft, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaViewer } from '@/components/media/media-viewer';
import { VideoThumbnail } from '@/components/media/video-thumbnail';
import { CommentsSection } from './comments-section';
import { RatingSection } from './rating-section';
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal';
import { useAuthStore } from '@/store/auth-store';
import { getPost, incrementViewCount, deletePost } from '@/lib/database';
import { BlogPost, MediaItem } from '@/types/blog';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface PostDetailProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (postId: string) => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  currentPostIndex?: number;
  totalPosts?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function PostDetail({ 
  postId, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onNavigate,
  currentPostIndex = 0,
  totalPosts = 0,
  hasNext = false,
  hasPrevious = false
}: PostDetailProps) {
  const { user } = useAuthStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerMedia, setViewerMedia] = useState<MediaItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewCountIncremented, setViewCountIncremented] = useState(false);
  
  // Touch gesture handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Load post details
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedPost = await getPost(postId);
        if (fetchedPost) {
          setPost(fetchedPost);
          
          // Increment view count only once per session
          if (!viewCountIncremented) {
            await incrementViewCount(postId);
            setViewCountIncremented(true);
            setPost(prev => prev ? { ...prev, viewCount: prev.viewCount + 1 } : null);
          }
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && postId) {
      loadPost();
    }
  }, [postId, isOpen, viewCountIncremented]);

  // Reset view count flag when post changes
  useEffect(() => {
    setViewCountIncremented(false);
  }, [postId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !onNavigate) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (hasPrevious) onNavigate('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (hasNext) onNavigate('next');
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

         if (isOpen) {
       document.addEventListener('keydown', handleKeyDown);
       return () => document.removeEventListener('keydown', handleKeyDown);
     }
   }, [isOpen, onNavigate, hasNext, hasPrevious, onClose]);

   // Touch gesture handlers
   const handleTouchStart = (e: React.TouchEvent) => {
     setTouchEnd(null);
     setTouchStart({
       x: e.targetTouches[0].clientX,
       y: e.targetTouches[0].clientY
     });
   };

   const handleTouchMove = (e: React.TouchEvent) => {
     setTouchEnd({
       x: e.targetTouches[0].clientX,
       y: e.targetTouches[0].clientY
     });
   };

   const handleTouchEnd = () => {
     if (!touchStart || !touchEnd || !onNavigate) return;
     
     const deltaX = touchStart.x - touchEnd.x;
     const deltaY = touchStart.y - touchEnd.y;
     const minSwipeDistance = 50;
     
     // Horizontal swipe for navigation
     if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
       if (deltaX > 0 && hasNext) {
         // Swipe left - next post
         onNavigate('next');
       } else if (deltaX < 0 && hasPrevious) {
         // Swipe right - previous post
         onNavigate('prev');
       }
     }
     
     // Vertical swipe down to close (only on mobile)
     if (deltaY < -minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
       onClose();
     }
   };

  const handleEdit = () => {
    if (post) {
      onEdit(post);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(post.id);
        onDelete(post.id);
        onClose();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const openMediaViewer = (media: MediaItem, index: number) => {
    setViewerMedia(media);
    setViewerIndex(index);
    setIsViewerOpen(true);
  };

  const handleMediaNavigation = (direction: 'next' | 'prev') => {
    if (!post?.media) return;
    
    let newIndex = viewerIndex;
    if (direction === 'next') {
      newIndex = (viewerIndex + 1) % post.media.length;
    } else {
      newIndex = viewerIndex === 0 ? post.media.length - 1 : viewerIndex - 1;
    }
    
    setViewerIndex(newIndex);
    setViewerMedia(post.media[newIndex]);
  };

  const handleRatingUpdate = (avgRating: number, totalRatings: number) => {
    setPost(prev => prev ? { ...prev, avgRating, totalRatings } : null);
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal open={isOpen} onOpenChange={onClose}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 relative sm:rounded-3xl 
                                     sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                                     max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-16 max-sm:left-0 max-sm:right-0 
                                     max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none 
                                     max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom">
          <ModalTitle className="sr-only">
            {post ? post.title : 'Post Details'}
          </ModalTitle>
          
          {/* Navigation Controls */}
          {onNavigate && totalPosts > 1 && (
            <>
              {/* Previous Button */}
              {hasPrevious && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md border-white/20 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200 max-sm:left-2 max-sm:w-10 max-sm:h-10"
                  onClick={() => onNavigate('prev')}
                >
                  <ChevronLeft className="w-5 h-5 max-sm:w-4 max-sm:h-4" />
                </Button>
              )}
              
              {/* Next Button */}
              {hasNext && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md border-white/20 shadow-lg hover:bg-white hover:scale-105 transition-all duration-200 max-sm:right-2 max-sm:w-10 max-sm:h-10"
                  onClick={() => onNavigate('next')}
                >
                  <ChevronRight className="w-5 h-5 max-sm:w-4 max-sm:h-4" />
                </Button>
              )}
              
              {/* Mobile Handle */}
              <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Progress Indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full max-sm:top-6">
                <span className="text-white text-sm font-medium max-sm:text-xs">
                  {currentPostIndex + 1} of {totalPosts}
                </span>
              </div>
            </>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-600">Loading post...</p>
              </div>
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h3>
              <p className="text-gray-600">The post you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            </div>
          ) : (
            <div 
              className="space-y-6"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 p-6 z-10">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Posts</span>
                  </Button>

                  {user && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 space-y-6">
                {/* Title and Meta */}
                <div className="space-y-4">
                  <motion.h1
                    key={post.id} // Re-animate when post changes
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-3xl md:text-4xl font-bold text-gray-900"
                  >
                    {post.title}
                  </motion.h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.viewCount} views</span>
                    </div>

                    {post.updatedAt > post.createdAt && (
                      <span className="text-gray-500">
                        Updated {formatRelativeTime(post.updatedAt)}
                      </span>
                    )}


                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media Gallery */}
                {post.media && post.media.length > 0 && (
                  <motion.div
                    key={`media-${post.id}`} // Re-animate when post changes
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      Media ({post.media.length})
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {post.media.map((media, index) => (
                        <motion.div
                          key={media.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ 
                            scale: 1.03,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
                          onClick={() => openMediaViewer(media, index)}
                        >
                          <div className="aspect-video relative">
                            {media.type === 'image' ? (
                              <Image
                                src={media.url}
                                alt={media.filename}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <VideoThumbnail
                                videoUrl={media.url}
                                alt={media.filename}
                                className="w-full h-full"
                                onClick={() => openMediaViewer(media, index)}
                              />
                            )}
                          </div>
                                                  </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* Content */}
                <motion.div
                  key={`content-${post.id}`} // Re-animate when post changes
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                  className="prose prose-lg max-w-none"
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {post.content}
                    </div>
                  </div>
                </motion.div>

                {/* Rating Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <RatingSection
                    post={post}
                    onRatingUpdate={handleRatingUpdate}
                  />
                </motion.div>

                {/* Comments Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CommentsSection postId={post.id} />
                </motion.div>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Media Viewer */}
      <MediaViewer
        media={viewerMedia}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerMedia(null);
        }}
        onNext={post?.media && post.media.length > 1 ? () => handleMediaNavigation('next') : undefined}
        onPrevious={post?.media && post.media.length > 1 ? () => handleMediaNavigation('prev') : undefined}
        showNavigation={post?.media ? post.media.length > 1 : false}
      />
    </>
  );
} 