'use client';

// Rating section component with star ratings
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, StarHalf } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { 
  addOrUpdateRating, 
  getUserRating, 
  getPostRatings 
} from '@/lib/comments';
import { BlogPost } from '@/types/blog';
import { cn } from '@/lib/utils';

interface RatingSectionProps {
  post: BlogPost;
  onRatingUpdate: (avgRating: number, totalRatings: number) => void;
  className?: string;
}

export function RatingSection({ post, onRatingUpdate, className }: RatingSectionProps) {
  const { user } = useAuthStore();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load user's existing rating
  useEffect(() => {
    const loadUserRating = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const rating = await getUserRating(post.id, user.uid);
        setUserRating(rating);
      } catch (error) {
        console.error('Error loading user rating:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserRating();
  }, [post.id, user]);

  // Handle rating submission
  const handleRatingSubmit = async (rating: number) => {
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      await addOrUpdateRating(post.id, rating, user.uid);
      setUserRating(rating);
      
      // Recalculate ratings
      const ratings = await getPostRatings(post.id);
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        onRatingUpdate(Math.round(avgRating * 10) / 10, ratings.length);
      } else {
        onRatingUpdate(0, 0);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Render star rating
  const renderStars = (rating: number, interactive: boolean = false) => {
    const stars = [];
    const displayRating = hoveredRating !== null && interactive ? hoveredRating : rating;

    for (let i = 1; i <= 5; i++) {
      const isFilled = displayRating >= i;
      const isHalfFilled = displayRating >= i - 0.5 && displayRating < i;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive || submitting}
          onMouseEnter={() => interactive && setHoveredRating(i)}
          onMouseLeave={() => interactive && setHoveredRating(null)}
          onClick={() => interactive && handleRatingSubmit(i)}
          className={cn(
            "transition-all duration-200",
            interactive && !submitting
              ? "hover:scale-110 cursor-pointer"
              : "cursor-default",
            submitting && "opacity-50"
          )}
        >
          {isFilled ? (
            <Star 
              className={cn(
                "w-5 h-5 fill-yellow-400 text-yellow-400",
                interactive && "hover:fill-yellow-500 hover:text-yellow-500"
              )} 
            />
          ) : isHalfFilled ? (
            <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star 
              className={cn(
                "w-5 h-5 text-gray-300",
                interactive && !submitting && "hover:text-yellow-400"
              )} 
            />
          )}
        </button>
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 text-gray-300 animate-pulse" />
            ))}
          </div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Rating Display */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              {renderStars(post.avgRating)}
            </div>
            
            <div className="text-sm text-gray-600">
              {post.totalRatings > 0 ? (
                <span>
                  {post.avgRating.toFixed(1)} ({post.totalRatings} {post.totalRatings === 1 ? 'rating' : 'ratings'})
                </span>
              ) : (
                <span>No ratings yet</span>
              )}
            </div>
          </div>

          {/* Rating Breakdown */}
          {post.totalRatings > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {post.avgRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">
                out of 5
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Rating Section */}
      {user && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {userRating ? 'Your rating:' : 'Rate this post:'}
            </h4>
            
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {renderStars(userRating || 0, true)}
              </div>
              
              {userRating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-blue-600 font-medium"
                >
                  You rated: {userRating} star{userRating !== 1 ? 's' : ''}
                </motion.div>
              )}
              
              {submitting && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                />
              )}
            </div>
            
            {!userRating && (
              <p className="text-xs text-gray-500">
                Click on a star to rate this post
              </p>
            )}
          </div>
        </div>
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!user && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <div className="text-center">
            <div className="flex justify-center space-x-1 mb-2">
              {renderStars(post.avgRating)}
            </div>
            <p className="text-sm text-gray-600">
              Sign in to rate this post
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 