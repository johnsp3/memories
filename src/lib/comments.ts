// Comment and rating service functions
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, Rating } from '@/types/blog';

const COMMENTS_COLLECTION = 'comments';
const RATINGS_COLLECTION = 'ratings';
const POSTS_COLLECTION = 'posts';

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorEmail: string
): Promise<string> => {
  try {
    const comment = {
      postId,
      content,
      authorId,
      authorName,
      authorEmail,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), comment);
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId)
    );

    const snapshot = await getDocs(q);
    const comments: Comment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Comment);
    });

    // Sort client-side by creation date (newest first)
    return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Update a comment
 */
export const updateComment = async (commentId: string, content: string): Promise<void> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(docRef, {
      content,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Add or update a rating for a post
 */
export const addOrUpdateRating = async (
  postId: string,
  rating: number,
  authorId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Check if user already rated this post
    const existingRatingQuery = query(
      collection(db, RATINGS_COLLECTION),
      where('postId', '==', postId),
      where('authorId', '==', authorId)
    );

    const existingRatingSnapshot = await getDocs(existingRatingQuery);
    
    if (!existingRatingSnapshot.empty) {
      // Update existing rating
      const ratingDoc = existingRatingSnapshot.docs[0];
      batch.update(ratingDoc.ref, {
        rating,
        createdAt: Timestamp.now(), // Update timestamp for last rating
      });
    } else {
      // Add new rating
      const newRatingRef = doc(collection(db, RATINGS_COLLECTION));
      batch.set(newRatingRef, {
        postId,
        authorId,
        rating,
        createdAt: Timestamp.now(),
      });
    }

    // Update post's average rating
    await updatePostRating(postId);
    
    await batch.commit();
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    throw error;
  }
};

/**
 * Get user's rating for a post
 */
export const getUserRating = async (postId: string, authorId: string): Promise<number | null> => {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('postId', '==', postId),
      where('authorId', '==', authorId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const ratingDoc = snapshot.docs[0];
    return ratingDoc.data().rating;
  } catch (error) {
    console.error('Error getting user rating:', error);
    throw error;
  }
};

/**
 * Get all ratings for a post
 */
export const getPostRatings = async (postId: string): Promise<Rating[]> => {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('postId', '==', postId)
    );

    const snapshot = await getDocs(q);
    const ratings: Rating[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      ratings.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Rating);
    });

    // Sort client-side by creation date (newest first)
    return ratings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting post ratings:', error);
    throw error;
  }
};

/**
 * Update post's average rating and total ratings count
 */
const updatePostRating = async (postId: string): Promise<void> => {
  try {
    const ratings = await getPostRatings(postId);
    
    if (ratings.length === 0) {
      // No ratings
      const postRef = doc(db, POSTS_COLLECTION, postId);
      await updateDoc(postRef, {
        avgRating: 0,
        totalRatings: 0,
      });
      return;
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const avgRating = totalRating / ratings.length;

    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error('Error updating post rating:', error);
    throw error;
  }
};

/**
 * Delete a rating
 */
export const deleteRating = async (postId: string, authorId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('postId', '==', postId),
      where('authorId', '==', authorId)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const ratingDoc = snapshot.docs[0];
      await deleteDoc(ratingDoc.ref);
      
      // Update post's average rating
      await updatePostRating(postId);
    }
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
}; 