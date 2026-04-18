'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import MoviePoster from '@/app/components/MovieDetails/MoviePoster';
import RatingFunctionality from '@/app/components/RatingFunctionality/RatingFunctionality';
import styles from './page.module.css';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CommentForm from '@/app/components/CommentForm/CommentForm';
import NotFound from '@/app/not-found';

interface Comment {
  id: string;
  username: string;
  userId: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  userReaction: 'liked' | 'disliked' | null;
}

interface ReviewData {
  movieId: number;
  movieTitle: string;
  moviePosterUrl: string | null;
  username: string;
  rating: number;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  userReaction: 'liked' | 'disliked' | null;
  comments: Comment[];
}

const ReviewPage = () => {
  const params = useParams();
  const { id } =  params; 
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const COMMENTS_PER_PAGE = 10;

  const fetchCommentsBatch = async (reviewId: number, userId: string | null, from: number, to: number, sortMethod: 'newest' | 'likes') => {
    const { data, error } = await supabase.rpc('get_replies_with_stats', {
        p_review_id: reviewId,
        p_user_id: userId || null,
        p_sort_by: sortMethod,
        p_limit: to - from + 1,
        p_offset: from
    });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    if (data) {
        return data.map((c: any) => ({
            id: c.id,
            username: c.username || 'Unknown',
            userId: c.user_id,
            content: c.content,
            likes: c.likes_count,
            dislikes: c.dislikes_count,
            createdAt: new Date(c.created_at).toLocaleDateString(),
            userReaction: c.user_reaction
        }));
    }
    
    return [];
  };

  useEffect(() => {
    async function fetchReviewData() {
      if (!id) return;
      const numericId = Number(id);
      if (isNaN(numericId)) {
        setReview(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Get Current User (for likes/dislikes)
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;
        setCurrentUserId(userId);

        // 2. Fetch Full Review Details via RPC
        const { data: reviewDetails, error: reviewError } = await supabase
            .rpc('get_full_review_details', {
                p_review_id: numericId,
                p_user_id: userId
            });

        if (reviewError) throw new Error(`Review fetch error: ${reviewError.message}`);
        if (!reviewDetails || reviewDetails.length === 0) throw new Error('Review not found (ID does not exist)');

        const r = reviewDetails[0];

        // 3. Fetch Initial Comments
        const initialComments = await fetchCommentsBatch(numericId, userId, 0, COMMENTS_PER_PAGE - 1, sortBy);
        setHasMoreComments(initialComments.length === COMMENTS_PER_PAGE);

        setReview({
            movieId: r.movie_id,
            movieTitle: r.movie_title,
            moviePosterUrl: r.movie_poster_url,
            username: r.username || 'Unknown User',
            rating: r.rating || 0,
            content: r.content,
            createdAt: new Date(r.created_at).toLocaleDateString(),
            likes: r.likes_count,
            dislikes: r.dislikes_count,
            userReaction: r.user_reaction as 'liked' | 'disliked' | null,
            comments: initialComments
        });

      } catch (err: any) {
        // console.error('Error fetching review:', err);
        setReview(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReviewData();
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!review) return <NotFound />;

  const handleReviewLike = async (liked: boolean) => {
    if (!review) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Please login to vote");
        return;
    }

    const { data, error } = await supabase.rpc('toggle_review_like', {
        p_review_id: Number(id),
        p_user_id: user.id,
        p_liked: liked
    });

    if (error) {
        console.error("Error toggling like:", error);
        return;
    }

    
    const { data: reviewLikesData } = await supabase
        .rpc('get_review_likes', { 
            p_review_id: Number(id), 
            p_user_id: user.id 
        });
    
    if (reviewLikesData) {
        setReview(prev => prev ? ({
            ...prev,
            likes: reviewLikesData.likes_count,
            dislikes: reviewLikesData.dislikes_count,
            userReaction: reviewLikesData.user_reaction
        }) : null);
    }
  };

  const handleCommentLike = async (commentId: string, liked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Please login to vote");
        return;
    }

    const { error } = await supabase.rpc('toggle_reply_like', {
        p_reply_id: Number(commentId),
        p_user_id: user.id,
        p_liked: liked
    });

    if (error) {
        console.error("Error toggling comment like:", error);
        return;
    }

    // Refetch likes for this comment
    const { data: replyLikesData } = await supabase
        .rpc('get_reply_likes', { 
            p_reply_id: Number(commentId), 
            p_user_id: user.id 
        });

    if (replyLikesData) {
        setReview(prev => {
            if (!prev) return null;
            const newComments = prev.comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        likes: replyLikesData.likes_count,
                        dislikes: replyLikesData.dislikes_count,
                        userReaction: replyLikesData.user_reaction
                    };
                }
                return c;
            });
            return { ...prev, comments: newComments };
        });
    }
  };

  const handleLoadMore = async () => {
    if (!review || !id) return;
    const numericId = Number(id);
    const from = review.comments.length;
    const to = from + COMMENTS_PER_PAGE - 1;

    const newComments = await fetchCommentsBatch(numericId, currentUserId, from, to, sortBy);
    
    if (newComments.length < COMMENTS_PER_PAGE) {
        setHasMoreComments(false);
    }

    setReview(prev => prev ? ({
        ...prev,
        comments: [...prev.comments, ...newComments]
    }) : null);
  };

  const handleCommentAdded = async (newCommentData: any) => {
    if (!id) return;
    
    // Fetch the username for the current user if we don't have it
    // We can try to get it from the session or fetch it
    let username = 'You';
    if (currentUserId) {
        const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentUserId)
            .single();
        if (userData) username = userData.username;
    }

    const newComment: Comment = {
        id: newCommentData.id,
        username: username,
        userId: currentUserId || '',
        content: newCommentData.reply,
        likes: 0,
        dislikes: 0,
        createdAt: new Date(newCommentData.date_time).toLocaleDateString(),
        userReaction: null
    };
    
    setReview(prev => prev ? ({
        ...prev,
        comments: [newComment, ...prev.comments]
    }) : null);
  };

  const handleCollapseComments = () => {
    if (!review) return;
    // Keep only the first page of comments
    const collapsedComments = review.comments.slice(0, COMMENTS_PER_PAGE);
    setReview(prev => prev ? ({
        ...prev,
        comments: collapsedComments
    }) : null);
    // Since we collapsed, we assume there are more comments available (the ones we just hid)
    setHasMoreComments(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', commentId);

    if (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
        return;
    }

    setReview(prev => prev ? ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
    }) : null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          <Link href={`/movies/${review.movieId}`}>
            <MoviePoster title={review.movieTitle} posterUrl={review.moviePosterUrl} />
          </Link>
          <Link href={`/movies/${review.movieId}`} className={styles.movieTitleLink}>
            <h2 className={styles.movieTitle}>{review.movieTitle}</h2>
          </Link>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.avatar}></div>
              <div className={styles.userInfo}>
                <Link href={`/user/${review.username}`} className={styles.username}>
                  {review.username}
                </Link>
                <RatingFunctionality initialRating={review.rating} readOnly={true} />
              </div>
              <span className={styles.date}>{review.createdAt}</span>
            </div>

            <div className={styles.reviewBody}>
              {review.content}
            </div>

            <div className={styles.reviewActions}>
              <button onClick={() => handleReviewLike(true)}>
                {review.userReaction === 'liked' ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                {review.likes}
              </button>
              <button onClick={() => handleReviewLike(false)}>
                {review.userReaction === 'disliked' ? <ThumbDownIcon /> : <ThumbDownAltOutlinedIcon />}
                {review.dislikes}
              </button>
              <button><CommentOutlinedIcon /> {review.comments.length}</button>
            </div>
          </div>

          <div className={styles.commentsSection}>
            <div className={styles.sortControls}>
                <span>Sort by:</span>
                <button 
                    onClick={() => setSortBy('newest')}
                    className={`${styles.sortButton} ${sortBy === 'newest' ? styles.active : ''}`}
                >
                    Newest
                </button>
                <button 
                    onClick={() => setSortBy('likes')}
                    className={`${styles.sortButton} ${sortBy === 'likes' ? styles.active : ''}`}
                >
                    Top (Likes)
                </button>
            </div>
            {[...review.comments].sort((a, b) => {
              if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              } else {
                return b.likes - a.likes;
              }
            }).map((comment: any) => (
              <div key={comment.id} className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <div className={styles.avatarSmall}></div>
                  <Link href={`/user/${comment.username}`} className={styles.usernameLink}>
                    {comment.username}
                  </Link>
                  <span className={styles.date}>{comment.createdAt}</span>
                  {currentUserId === comment.userId && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)} 
                      className={styles.deleteButton}
                      title="Delete reply"
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </button>
                  )}
                </div>
                <div className={styles.commentBody}>
                  {comment.content}
                </div>
                <div className={styles.commentActions}>
                  <button onClick={() => handleCommentLike(comment.id, true)}>
                    {comment.userReaction === 'liked' ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                    {comment.likes}
                  </button>
                  <button onClick={() => handleCommentLike(comment.id, false)}>
                    {comment.userReaction === 'disliked' ? <ThumbDownIcon /> : <ThumbDownAltOutlinedIcon />}
                    {comment.dislikes}
                  </button>
                </div>
              </div>
            ))}

            <div className={styles.loadButtons}>
              {hasMoreComments && (
                <button onClick={handleLoadMore} className={styles.loadMoreButton}>
                  Load More Comments
                </button>
              )}

              {review.comments.length > COMMENTS_PER_PAGE && (
                <button onClick={handleCollapseComments} className={styles.loadMoreButton}>
                  Show Less
                </button>
              )}
            </div>
          </div>

          {currentUserId ? (
            <CommentForm reviewId={Number(id)} onCommentAdded={handleCommentAdded} />
          ) : (
            <div className={styles.loginMessage}>
              <p>
                You need to <a href={`/authentication?redirect=${encodeURIComponent(window.location.pathname)}`}>login</a> to write a reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewPage