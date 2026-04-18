'use client'

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import styles from './CommentForm.module.css';
import { containsProfanity } from '@/lib/profanityFilter';

interface CommentFormProps {
  reviewId: number;
  onCommentAdded: (newComment: any) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ reviewId, onCommentAdded }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/authentication?redirectTo=${encodeURIComponent(pathname || '/')}`);
        return;
      }

      if (!content.trim()) {
        setLoading(false);
        return;
      }

      if (containsProfanity(content)) {
        setError("Please keep the language clean.");
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          reply: content.trim()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setContent('');
      onCommentAdded(data);
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setError(err.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Write your reply</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          placeholder="Reply here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
        />
        <div className={styles.footer}>
          {error && <span className={styles.error}>{error}</span>}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Posting...' : 'POST'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;
