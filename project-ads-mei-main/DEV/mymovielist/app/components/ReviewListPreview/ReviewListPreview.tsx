'use client'

import React from 'react'
import Link from 'next/link'
import styles from './ReviewListPreview.module.css'
import StarIcon from '@mui/icons-material/Star';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RatingFunctionality from '../RatingFunctionality/RatingFunctionality';

export interface ReviewPreviewData {
  id: number;
  username: string;
  userId: string;
  rating: number | null;
  content: string;
  likes: number;
  dislikes: number;
  userReaction: 'liked' | 'disliked' | null;
  createdAt: string;
  replyCount?: number;
}

interface ReviewListPreviewProps {
  label: string
  movieId?: number
  reviews?: ReviewPreviewData[]
  onLike?: (reviewId: number, isLike: boolean) => void
  onShowMore?: () => void
  onCollapse?: () => void
  onDelete?: (reviewId: number) => void
  hasMore?: boolean
  isExpanded?: boolean
  isLoading?: boolean
  currentUserId?: string | null
}

const ReviewListPreview = ({ label, movieId, reviews, onLike, onShowMore, onCollapse, onDelete, hasMore, isExpanded, isLoading, currentUserId }: ReviewListPreviewProps) => {
  
  const handleLikeClick = (e: React.MouseEvent, reviewId: number, isLike: boolean) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onLike) {
      onLike(reviewId, isLike);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, reviewId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(reviewId);
    }
  };

  return (
    <div className={styles.reviewListPreviewContent}>
      <div className={styles.link}>
        <h2>{label}</h2>
      </div>
      <div className={styles.reviewsList}>
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <Link key={review.id} href={`/reviews/${review.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <div className={styles.userInfo}>
                    <span className={styles.username}>{review.username}</span>
                    {review.rating && (
                      <span className={styles.rating}>
                        <RatingFunctionality readOnly initialRating={review.rating} />
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.date}>{review.createdAt}</span>
                    {currentUserId === review.userId && onDelete && (
                      <button 
                        className={styles.deleteButton}
                        onClick={(e) => handleDeleteClick(e, review.id)}
                        title="Delete review"
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </button>
                    )}
                  </div>
                </div>
                <p className={styles.reviewContent}>{review.content}</p>
                <div className={styles.reviewFooter}>
                  <button 
                    className={`${styles.actionButton} ${review.userReaction === 'liked' ? styles.active : ''}`}
                    onClick={(e) => handleLikeClick(e, review.id, true)}
                  >
                    {review.userReaction === 'liked' ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
                    {review.likes}
                  </button>
                  <button 
                    className={`${styles.actionButton} ${review.userReaction === 'disliked' ? styles.active : ''}`}
                    onClick={(e) => handleLikeClick(e, review.id, false)}
                  >
                    {review.userReaction === 'disliked' ? <ThumbDownIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
                    {review.dislikes}
                  </button>
                  {review.replyCount !== undefined && (
                    <span className={styles.replyCount}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                        <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
                      </svg>
                      {review.replyCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className={styles.comingSoon}>No reviews yet.</p>
        )}
      </div>
      
      <div className={styles.loadButtons}>
        {isLoading ? (
          <span className={styles.loadingText}>Loading...</span>
        ) : (
          <>
            {hasMore && onShowMore && (
              <button onClick={onShowMore} className={styles.loadMoreButton}>
                Show More
              </button>
            )}
            {isExpanded && onCollapse && (
              <button onClick={onCollapse} className={styles.loadMoreButton}>
                Show Less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ReviewListPreview
