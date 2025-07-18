import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, deletePost } from '@/lib/database';
import { BlogPost } from '@/types/blog';

// Query keys for React Query caching
export const postsKeys = {
  all: ['posts'] as const,
  lists: () => [...postsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...postsKeys.lists(), filters] as const,
  details: () => [...postsKeys.all, 'detail'] as const,
  detail: (id: string) => [...postsKeys.details(), id] as const,
};

// Hook for infinite posts with pagination
export function useInfinitePosts(options: {
  sortBy?: 'newest' | 'oldest' | 'rating' | 'views';
  limit?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: postsKeys.list(options),
    queryFn: ({ pageParam }) => getPosts({
      ...options,
      startAfter: pageParam,
      limit: options.limit || 12,
    }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: null,
  });
}

// Hook for deleting a post
export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_, postId) => {
      // Remove the deleted post from all cached queries
      queryClient.invalidateQueries({ queryKey: postsKeys.all });
      
      // Also update the cache optimistically by removing the post
      queryClient.setQueriesData(
        { queryKey: postsKeys.lists() },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData;
          const data = oldData as { pages: Array<{ posts: BlogPost[] }> };
          
          return {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              posts: page.posts.filter((post: BlogPost) => post.id !== postId),
            })),
          };
        }
      );
    },
  });
}

// Hook for updating posts cache after creation/update
export function useUpdatePostsCache() {
  const queryClient = useQueryClient();
  
  return {
    invalidatePosts: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
    addNewPost: (newPost: BlogPost) => {
      // Add the new post to the beginning of the first page
      queryClient.setQueriesData(
        { queryKey: postsKeys.lists() },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData;
          const data = oldData as { pages: Array<{ posts: BlogPost[] }> };
          if (!data.pages) return oldData;
          
          const updatedData = { ...data };
          if (updatedData.pages[0]) {
            updatedData.pages[0] = {
              ...updatedData.pages[0],
              posts: [newPost, ...updatedData.pages[0].posts],
            };
          }
          
          return updatedData;
        }
      );
    },
    updatePost: (updatedPost: BlogPost) => {
      // Update the post in all cached queries
      queryClient.setQueriesData(
        { queryKey: postsKeys.lists() },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData;
          const data = oldData as { pages: Array<{ posts: BlogPost[] }> };
          
          return {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              posts: page.posts.map((post: BlogPost) => 
                post.id === updatedPost.id ? updatedPost : post
              ),
            })),
          };
        }
      );
    },
  };
} 