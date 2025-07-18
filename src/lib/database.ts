/* eslint-disable @typescript-eslint/no-explicit-any */

// Database service functions for Firestore operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { BlogPost, BlogPostInput } from '@/types/blog';

// Collections
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';
const RATINGS_COLLECTION = 'ratings';

/**
 * Create a new blog post
 */
export const createPost = async (postData: BlogPostInput, authorId: string, authorName: string, authorEmail: string): Promise<string> => {
  try {
    const post = {
      ...postData,
      published: true, // Always publish posts immediately
      authorId,
      authorName,
      authorEmail,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      viewCount: 0,
      avgRating: 0,
      totalRatings: 0,
      media: []
    };

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), post);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Get paginated blog posts with filtering and sorting
 */
export const getPosts = async (options: {
  sortBy?: 'newest' | 'oldest' | 'rating' | 'views';
  limit?: number;
  startAfter?: unknown;
} = {}): Promise<{ posts: BlogPost[]; hasMore: boolean; lastDoc?: unknown }> => {
  try {
    const { sortBy = 'newest', limit: limitCount = 10, startAfter: lastDoc } = options;
    
    // Simplified query - get all posts and filter client-side temporarily
    let q = query(collection(db, POSTS_COLLECTION));
    
    // Apply sorting based on type
    switch (sortBy) {
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'rating':
        // Use only one sort field to avoid complex index requirements
        q = query(q, orderBy('avgRating', 'desc'));
        break;
      case 'views':
        q = query(q, orderBy('viewCount', 'desc'));
        break;
      case 'newest':
      default:
        q = query(q, orderBy('createdAt', 'desc'));
        break;
    }
    
    // Add pagination
    q = query(q, limit(limitCount + 1)); // Get one extra to check if there are more
    
    // Add startAfter for pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const posts: BlogPost[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      const post = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        // Ensure media is properly formatted
        media: data.media ? data.media.map((item: Record<string, unknown>) => ({
          ...item,
          createdAt: (item.createdAt as { toDate?: () => Date })?.toDate ? (item.createdAt as { toDate: () => Date }).toDate() : item.createdAt
        })) : []
      } as BlogPost;
      
              posts.push(post);
    });
    
    // Check if there are more posts
    const hasMore = posts.length > limitCount;
    if (hasMore) {
      posts.pop(); // Remove the extra post
    }
    
    return { 
      posts, 
      hasMore, 
      lastDoc: hasMore ? snapshot.docs[limitCount - 1] : null
    };
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

/**
 * Get a single blog post by ID
 */
export const getPost = async (postId: string): Promise<BlogPost | null> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const post = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      // Ensure media is properly formatted
      media: data.media ? data.media.map((item: Record<string, unknown>) => ({
        ...item,
        createdAt: (item.createdAt as { toDate?: () => Date })?.toDate ? (item.createdAt as { toDate: () => Date }).toDate() : item.createdAt
      })) : []
    } as BlogPost;
    
    return post;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

/**
 * Update a blog post
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updatePost = async (postId: string, updates: Partial<BlogPostInput & { media?: any[]; published?: boolean }>): Promise<void> => {
  try {
    
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    // Convert media dates to Firestore timestamps if present
    if (updates.media) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateData.media = updates.media.map((item: any) => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? Timestamp.fromDate(item.createdAt) : item.createdAt
      }));
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

/**
 * Delete a blog post
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    
    // First, delete related comments and ratings
    try {
      // Delete all comments for this post
      const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const commentDeletePromises = commentsSnapshot.docs.map(commentDoc => 
        deleteDoc(commentDoc.ref)
      );
      await Promise.all(commentDeletePromises);

      // Delete all ratings for this post
      const ratingsQuery = query(
        collection(db, RATINGS_COLLECTION),
        where('postId', '==', postId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      const ratingDeletePromises = ratingsSnapshot.docs.map(ratingDoc => 
        deleteDoc(ratingDoc.ref)
      );
      await Promise.all(ratingDeletePromises);
    } catch (subError) {
      console.warn('Error deleting related data (continuing with post deletion):', subError);
    }

    // Finally, delete the post itself
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

/**
 * Increment post view count
 */
export const incrementViewCount = async (postId: string): Promise<void> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
};

/**
 * Search posts by content
 */
export const searchPosts = async (searchQuery: string): Promise<BlogPost[]> => {
  try {
    // Firebase doesn't support full-text search natively
    // We'll get all posts and filter client-side for now
    // In production, consider using Algolia or similar service
    const { posts } = await getPosts({ limit: 100 });
    
    const searchTerms = searchQuery.toLowerCase().split(' ');
    
    return posts.filter(post => {
      const searchContent = `${post.title} ${post.content} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchContent.includes(term));
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};

/**
 * Get posts by tag
 */
export const getPostsByTag = async (tag: string): Promise<BlogPost[]> => {
  try {
    // Use Firestore's array-contains operator for efficient tag filtering
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc'),
      limit(50) // Reasonable limit for tag-filtered results
    );
    
    const snapshot = await getDocs(q);
    const posts: BlogPost[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const post = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        // Ensure media is properly formatted
        media: data.media ? data.media.map((item: Record<string, unknown>) => ({
          ...item,
          createdAt: (item.createdAt as { toDate?: () => Date })?.toDate ? (item.createdAt as { toDate: () => Date }).toDate() : item.createdAt
        })) : []
      } as BlogPost;
      
      posts.push(post);
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting posts by tag:', error);
    throw error;
  }
}; 