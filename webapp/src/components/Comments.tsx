import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Comment {
  id: string;
  design_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CommentsProps {
  designId: string;
}

export function Comments({ designId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [designId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/comments/${designId}`);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/comments/${designId}`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([...comments, response.data.comment]);
      setNewComment('');
      toast({
        title: '✓ Comment posted',
        description: 'Your comment has been added',
      });
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      toast({
        title: 'Failed to post comment',
        description: err.response?.data?.error || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments(comments.filter((c) => c.id !== commentId));
      toast({
        title: '✓ Comment deleted',
        description: 'Your comment has been removed',
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast({
        title: 'Failed to delete',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-display text-sm uppercase tracking-wider">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="border border-border p-4 text-center text-sm text-muted-foreground">
          Please login to comment
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-border p-3 space-y-2 bg-secondary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                {isAuthenticated && comment.user_id === localStorage.getItem('userId') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(comment.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(comment.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
