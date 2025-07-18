'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Blog post list component with search, filtering, and media preview using React Query
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Eye, Star, MessageCircle, Calendar, Tag, Edit, Trash2, Image as ImageIcon, Video, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaViewer } from '@/components/media/media-viewer';
import { VideoThumbnail } from '@/components/media/video-thumbnail';
import { PostDetail } from './post-detail';
import { useAuthStore } from '@/store/auth-store';
import { searchPosts, getPostsByTag } from '@/lib/database';
import { useInfinitePosts, useDeletePost, useUpdatePostsCache } from '@/hooks/use-posts';
import { BlogPost, MediaItem } from '@/types/blog';
import { formatRelativeTime, truncateText } from '@/lib/utils';

interface PostListProps {
  onEditPost: (post: BlogPost) => void;
  onCreatePost: () => void;
  refreshKey?: number;
}

export function PostList({ onEditPost, onCreatePost, refreshKey }: PostListProps) {
  const { user } = useAuthStore();
  const [searchInput, setSearchInput] = useState(''); // Immediate input value
  const [searchQuery, setSearchQuery] = useState(''); // Debounced search value
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'views'>('newest');
  const [viewerMedia, setViewerMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  
  // For search/tag filtering (fallback to old method)
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  // React Query hooks
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useInfinitePosts({ sortBy });

  const deletePostMutation = useDeletePost();
  const { invalidatePosts } = useUpdatePostsCache();

  // Flatten the infinite query data into a single array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = infiniteData?.pages.flatMap((page: any) => page.posts) || [];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle search and tag filtering (using fallback methods)
  useEffect(() => {
    const loadFilteredPosts = async () => {
      if (!searchQuery && !selectedTag) {
        setFilteredPosts([]);
        return;
      }

      setLoadingFiltered(true);
      try {
        let fetchedPosts: BlogPost[];

        if (searchQuery) {
          fetchedPosts = await searchPosts(searchQuery);
        } else if (selectedTag) {
          fetchedPosts = await getPostsByTag(selectedTag);
        } else {
          fetchedPosts = [];
        }

        setFilteredPosts(fetchedPosts);
      } catch (error) {
        console.error('Error loading filtered posts:', error);
      } finally {
        setLoadingFiltered(false);
      }
    };

    loadFilteredPosts();
  }, [searchQuery, selectedTag]);

  // Effect to handle refresh
  useEffect(() => {
    if (refreshKey) {
      invalidatePosts();
      refetchPosts();
    }
  }, [refreshKey, invalidatePosts, refetchPosts]);

  // Reset search when sort changes
  useEffect(() => {
    if (!searchQuery && !selectedTag) {
      refetchPosts();
    }
  }, [sortBy, refetchPosts, searchQuery, selectedTag]);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePostMutation.mutateAsync(postId);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  const handlePostDeleted = () => {
    setIsDetailOpen(false);
    setViewingPostId(null);
    invalidatePosts();
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedTag('');
  };

  const handleViewPost = (post: BlogPost) => {
    setViewingPostId(post.id);
    setIsDetailOpen(true);
  };

  const handleViewMedia = (media: MediaItem) => {
    setViewerMedia(media);
    setIsViewerOpen(true);
  };

  // Determine which posts to display
  const displayPosts = (searchQuery || selectedTag) ? filteredPosts : posts;
  const isLoading = (searchQuery || selectedTag) ? loadingFiltered : isLoadingPosts;

  // Get unique tags from all posts for the filter dropdown
  const allTags = Array.from(
    new Set(displayPosts.flatMap(post => post.tags || []))
  ).sort();

  return (
    <>
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-white/50 border-white/30 focus:border-blue-500/50 focus:bg-white/80"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex gap-3 items-center">
              {/* Create New Post Button */}
              <Button
                onClick={onCreatePost}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>

              {/* Clear filters */}
              {(searchQuery || selectedTag) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear filters
                </Button>
              )}

              {/* Tag filter */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 bg-white/50 border border-white/30 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/80"
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              {/* Sort filter - only show when not searching/filtering */}
              {!searchQuery && !selectedTag && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 bg-white/50 border border-white/30 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/80"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="views">Most Viewed</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && displayPosts.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && displayPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedTag
                ? 'Try adjusting your search or filters'
                : 'Create your first blog post to get started'}
            </p>
            <Button onClick={onCreatePost}>Create New Post</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {displayPosts.map((post) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
                  >
                    {/* Media Preview */}
                    {post.media && post.media.length > 0 && (
                      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                        {post.media.length === 1 ? (
                                                                                // Single media item
                           <div className="h-full">
                             {post.media[0].type === 'image' ? (
                               <Image
                                 src={post.media[0].url}
                                 alt={post.media[0].filename}
                                 fill
                                 className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                 onClick={() => handleViewMedia(post.media[0])}
                                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                               />
                             ) : (
                               <div className="h-full cursor-pointer" onClick={() => handleViewMedia(post.media[0])}>
                                 <VideoThumbnail
                                   videoUrl={post.media[0].url}
                                   alt={post.media[0].filename}
                                   className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                 />
                               </div>
                             )}
                          </div>
                        ) : post.media.length === 2 ? (
                          // Two media items side by side
                          <div className="grid grid-cols-2 h-full gap-1">
                            {post.media.slice(0, 2).map((media, index) => (
                                                             <div key={index} className="relative h-full">
                                 {media.type === 'image' ? (
                                   <Image
                                     src={media.url}
                                     alt={media.filename}
                                     fill
                                     className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                     onClick={() => handleViewMedia(media)}
                                     sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                   />
                                 ) : (
                                   <div className="h-full cursor-pointer" onClick={() => handleViewMedia(media)}>
                                     <VideoThumbnail
                                       videoUrl={media.url}
                                       alt={media.filename}
                                       className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                     />
                                   </div>
                                 )}
                               </div>
                            ))}
                          </div>
                                                 ) : post.media.length === 3 ? (
                           // Three media items: one large, two small
                           <div className="grid grid-cols-2 h-full gap-1">
                             <div className="relative h-full">
                               {post.media[0].type === 'image' ? (
                                 <Image
                                   src={post.media[0].url}
                                   alt={post.media[0].filename}
                                   fill
                                   className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                   onClick={() => handleViewMedia(post.media[0])}
                                   sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                 />
                               ) : (
                                 <div className="h-full cursor-pointer" onClick={() => handleViewMedia(post.media[0])}>
                                   <VideoThumbnail
                                     videoUrl={post.media[0].url}
                                     alt={post.media[0].filename}
                                     className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                   />
                                 </div>
                               )}
                            </div>
                            <div className="grid grid-rows-2 gap-1">
                              {post.media.slice(1, 3).map((media, index) => (
                                <div key={index} className="relative h-full">
                                  {media.type === 'image' ? (
                                    <Image
                                      src={media.url}
                                      alt={media.filename}
                                      fill
                                      className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                      onClick={() => handleViewMedia(media)}
                                      sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12vw, 8vw"
                                    />
                                  ) : (
                                    <div className="h-full cursor-pointer" onClick={() => handleViewMedia(media)}>
                                      <VideoThumbnail
                                        videoUrl={media.url}
                                        alt={media.filename}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Four or more media items: large, two small, and overlay
                          <div className="grid grid-cols-2 h-full gap-1">
                            <div className="relative h-full">
                              {post.media[0].type === 'image' ? (
                                <Image
                                  src={post.media[0].url}
                                  alt={post.media[0].filename}
                                  fill
                                  className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                  onClick={() => handleViewMedia(post.media[0])}
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                />
                              ) : (
                                <div className="h-full cursor-pointer" onClick={() => handleViewMedia(post.media[0])}>
                                  <VideoThumbnail
                                    videoUrl={post.media[0].url}
                                    alt={post.media[0].filename}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="grid grid-rows-2 gap-1">
                              {post.media.slice(1, 3).map((media, index) => (
                                <div key={index} className="relative h-full">
                                  {index === 1 && post.media.length > 3 ? (
                                    // Overlay for remaining items
                                    <div className="relative h-full">
                                      {media.type === 'image' ? (
                                        <Image
                                          src={media.url}
                                          alt={media.filename}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12vw, 8vw"
                                        />
                                      ) : (
                                        <VideoThumbnail
                                          videoUrl={media.url}
                                          alt={media.filename}
                                          className="h-full w-full object-cover"
                                        />
                                      )}
                                      <div 
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/70"
                                        onClick={() => handleViewPost(post)}
                                      >
                                        <span className="text-white font-semibold text-lg">
                                          +{post.media.length - 3} more
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {media.type === 'image' ? (
                                        <Image
                                          src={media.url}
                                          alt={media.filename}
                                          fill
                                          className="object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                                          onClick={() => handleViewMedia(media)}
                                          sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12vw, 8vw"
                                        />
                                      ) : (
                                        <div className="h-full cursor-pointer" onClick={() => handleViewMedia(media)}>
                                          <VideoThumbnail
                                            videoUrl={media.url}
                                            alt={media.filename}
                                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Media type indicators */}
                        <div className="absolute top-3 left-3 flex gap-1">
                          {post.media.some(m => m.type === 'image') && (
                            <div className="bg-black/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {post.media.filter(m => m.type === 'image').length}
                            </div>
                          )}
                          {post.media.some(m => m.type === 'video') && (
                            <div className="bg-black/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              {post.media.filter(m => m.type === 'video').length}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleViewPost(post)}>
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {truncateText(post.excerpt || post.content, 150)}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs cursor-pointer hover:bg-blue-200 transition-colors duration-200"
                              onClick={() => setSelectedTag(tag)}
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            <span>{post.avgRating ? post.avgRating.toFixed(1) : 'N/A'}</span>
                          </div>
                                                     <div className="flex items-center gap-1">
                             <MessageCircle className="w-4 h-4" />
                             <span>0</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatRelativeTime(post.createdAt)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {user && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditPost(post)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Load More Button - only for infinite query */}
            {!searchQuery && !selectedTag && hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  {isFetchingNextPage ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full mr-2"
                      />
                      Loading more posts...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Viewer */}
      <MediaViewer
        media={viewerMedia}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerMedia(null);
        }}
      />

      {/* Post Detail */}
      <PostDetail
        postId={viewingPostId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setViewingPostId(null);
        }}
        onEdit={onEditPost}
        onDelete={handlePostDeleted}
      />
    </>
  );
} 