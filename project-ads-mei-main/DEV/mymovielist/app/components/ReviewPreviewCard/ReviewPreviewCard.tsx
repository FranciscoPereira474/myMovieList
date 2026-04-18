'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import styles from './ReviewPreviewCard.module.css';

interface ReviewPreviewCardProps {
  reviewId: number;
}

interface ReviewData {
  id: number;
  review_text: string;
  rating: number;
  created_at: string;
  user_id: string;
  username: string;
  movie_id: number;
  movie_title: string;
  release_year: number;
  image_url: string;
}

const ReviewPreviewCard: React.FC<ReviewPreviewCardProps> = ({ reviewId }) => {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [replyCount, setReplyCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch review data
        const { data: review, error: reviewError } = await supabase
          .rpc('get_review_by_id', { p_review_id: reviewId });

        if (reviewError) {
          console.error('Error fetching review:', reviewError);
          return;
        }

        if (review && review.length > 0) {
          setReviewData(review[0]);
        }

        // Fetch reply count
        const { data: replies, error: replyError } = await supabase
          .rpc('get_review_reply_count', { p_review_id: reviewId });

        if (!replyError && replies !== null) {
          setReplyCount(replies);
        }

        // Fetch likes, dislikes and user reaction using single RPC function
        const { data: reactions, error: reactionsError } = await supabase
          .rpc('get_review_likes', { 
            p_review_id: reviewId,
            p_user_id: user?.id || null
          });

        if (!reactionsError && reactions) {
          setLikeCount(reactions.likes_count);
          setDislikeCount(reactions.dislikes_count);
          
          // Set user reaction
          if (reactions.user_reaction === 'liked') {
            setUserLike(true);
          } else if (reactions.user_reaction === 'disliked') {
            setUserLike(false);
          } else {
            setUserLike(null);
          }
        }

      } catch (error) {
        console.error('Error in fetchReviewData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [reviewId]);

  const handleLike = async (liked: boolean) => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    try {
      // Call RPC function instead of direct queries
      const { data: result, error } = await supabase
        .rpc('toggle_review_like', {
          p_review_id: reviewId,
          p_user_id: user.id,
          p_liked: liked
        });

      if (error) {
        console.error('Error toggling like:', error);
        return;
      }

      // Update local state based on result
      if (result === 'removed') {
        if (liked) {
          setLikeCount(likeCount - 1);
        } else {
          setDislikeCount(dislikeCount - 1);
        }
        setUserLike(null);
      } else if (result === 'liked') {
        if (userLike === false) {
          // Switching from dislike to like
          setDislikeCount(dislikeCount - 1);
          setLikeCount(likeCount + 1);
        } else {
          // First time liking
          setLikeCount(likeCount + 1);
        }
        setUserLike(true);
      } else if (result === 'disliked') {
        if (userLike === true) {
          // Switching from like to dislike
          setLikeCount(likeCount - 1);
          setDislikeCount(dislikeCount + 1);
        } else {
          // First time disliking
          setDislikeCount(dislikeCount + 1);
        }
        setUserLike(false);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!reviewData) {
    return <div className={styles.error}>Review not found</div>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}h${minutes} ${day}/${month}/${year}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const adjustedRating = Math.round(rating / 2);
    for (let i = 0; i < adjustedRating; i++) {
      stars.push(
        <span key={i} className={styles.starFilled}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.movieInfo}>
          <div className={styles.movieImage}>
            <img src={reviewData.image_url} alt={reviewData.movie_title} />
          </div>

          <div className={styles.userAndMovie}>
            <div className={styles.userSection}>
              <div className={styles.userAvatar}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                  <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/>
                </svg>
              </div>
              <Link 
                href={`/user/${reviewData.username}`} 
                className={styles.username}
              >
                {reviewData.username}
              </Link>
              <span className={styles.reviewDate}>{formatDate(reviewData.created_at)}</span>
            </div>

            <div className={styles.movieTitleSection}>
              <Link 
                href={`/movies/${reviewData.movie_id}`} 
                className={styles.movieTitle}
              >
                {reviewData.movie_title}
              </Link>
              <span className={styles.releaseYear}>{reviewData.release_year}</span>
            </div>

            <div className={styles.ratingSection}>
              <div className={styles.stars}>{renderStars(reviewData.rating)}</div>
            </div>
          </div>
        </div>
      </div>

      <Link href={`/reviews/${reviewId}`} className={styles.reviewText}>
        {reviewData.review_text}
      </Link>

      <div className={styles.reviewFooter}>
        <div 
          className={`${styles.likeSection} ${userLike === true ? styles.active : ''}`}
          onClick={() => handleLike(true)}
        >
          {userLike === true ? (
            <ThumbUpIcon fontSize="small" />
          ) : (
            <ThumbUpOutlinedIcon fontSize="small" />
          )}
          <span>{likeCount.toLocaleString()}</span>
        </div>

        <div 
          className={`${styles.dislikeSection} ${userLike === false ? styles.active : ''}`}
          onClick={() => handleLike(false)}
        >
          {userLike === false ? (
            <ThumbDownIcon fontSize="small" />
          ) : (
            <ThumbDownAltOutlinedIcon fontSize="small" />
          )}
          <span>{dislikeCount.toLocaleString()}</span>
        </div>

        <Link href={`/reviews/${reviewId}`} className={styles.commentCount}>
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px">
            <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
          </svg>
          <span>{replyCount}</span>
        </Link>
      </div>
    </div>
  );
};

export default ReviewPreviewCard;
