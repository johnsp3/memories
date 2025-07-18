'use client';

// Comments section component with add, edit, and delete functionality
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Edit, Trash2, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';
import { 
  getComments, 
  addComment, 
  updateComment, 
  deleteComment 
} from '@/lib/comments';
import { Comment } from '@/types/blog';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  postId: string;
  className?: string;
}

export function CommentsSection({ postId, className }: CommentsSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load comments
  const loadComments = async () => {
    try {
      const fetchedComments = await getComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // Add new comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const commentId = await addComment(
        postId,
        newComment.trim(),
        user.uid,
        user.displayName || 'User',
        user.email || ''
      );

      // Add the new comment to the list
      const newCommentObj: Comment = {
        id: commentId,
        postId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'User',
        authorEmail: user.email || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setComments([newCommentObj, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing comment
  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Save edited comment
  const handleSaveEdit = async () => {
    if (!editingComment || !editContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      await updateComment(editingComment, editContent.trim());
      
      // Update the comment in the list
      setComments(comments.map(comment => 
        comment.id === editingComment 
          ? { ...comment, content: editContent.trim(), updatedAt: new Date() }
          : comment
      ));
      
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {user && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-gray-600" />
            </div>
            
            <div className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px]"
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">
                          {comment.authorName}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatRelativeTime(comment.createdAt)}
                          {comment.updatedAt > comment.createdAt && ' (edited)'}
                        </span>
                      </div>
                      
                      {/* Actions (only for comment author) */}
                      {user && user.uid === comment.authorId && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    {editingComment === comment.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                          
                          <Button
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim() || submitting}
                            size="sm"
                          >
                            {submitting ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 