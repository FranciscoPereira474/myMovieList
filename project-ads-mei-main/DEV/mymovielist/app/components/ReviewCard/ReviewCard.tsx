'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import RatingFunctionality from '../RatingFunctionality/RatingFunctionality'
import styles from './ReviewCard.module.css'

interface ReviewCardProps {
  reviewId: number
  reviewText: string
  reviewDate: string
  username: string
  avatarUrl: string | null
  movieId: number
  movieTitle: string
  movieImageUrl: string
  totalLikes: number
  totalDislikes: number
  rating?: number | null
  replyCount?: number
}

const ReviewCard = ({
  reviewId,
  reviewText,
  reviewDate,
  username,
  avatarUrl,
  movieId,
  movieTitle,
  movieImageUrl,
  totalLikes: initialLikes,
  totalDislikes: initialDislikes,
  rating,
  replyCount
}: ReviewCardProps) => {
  const [user, setUser] = useState<any>(null)
  const [totalLikes, setTotalLikes] = useState(initialLikes)
  const [totalDislikes, setTotalDislikes] = useState(initialDislikes)
  const [userLike, setUserLike] = useState<boolean | null>(null)
  const [showLoginMessage, setShowLoginMessage] = useState<'like' | 'dislike' | null>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if user already liked/disliked this review using RPC
        const { data: reactions, error } = await supabase
          .rpc('get_review_likes', { 
            p_review_id: reviewId,
            p_user_id: user.id
          })
        
        if (!error && reactions) {
          if (reactions.user_reaction === 'liked') {
            setUserLike(true)
          } else if (reactions.user_reaction === 'disliked') {
            setUserLike(false)
          }
        }
      }
    }
    getUser()
  }, [reviewId])

  const handleLike = async (liked: boolean) => {
    if (!user) {
      setShowLoginMessage(liked ? 'like' : 'dislike')
      setTimeout(() => setShowLoginMessage(null), 3000)
      return
    }

    try {
      // Call RPC function instead of direct queries
      const { data: result, error } = await supabase
        .rpc('toggle_review_like', {
          p_review_id: reviewId,
          p_user_id: user.id,
          p_liked: liked
        })

      if (error) {
        console.error('Error toggling like:', error)
        return
      }

      // Update local state based on result
      if (result === 'removed') {
        if (liked) {
          setTotalLikes(totalLikes - 1)
        } else {
          setTotalDislikes(totalDislikes - 1)
        }
        setUserLike(null)
      } else if (result === 'liked') {
        if (userLike === false) {
          // Switching from dislike to like
          setTotalDislikes(totalDislikes - 1)
          setTotalLikes(totalLikes + 1)
        } else {
          // First time liking
          setTotalLikes(totalLikes + 1)
        }
        setUserLike(true)
      } else if (result === 'disliked') {
        if (userLike === true) {
          // Switching from like to dislike
          setTotalLikes(totalLikes - 1)
          setTotalDislikes(totalDislikes + 1)
        } else {
          // First time disliking
          setTotalDislikes(totalDislikes + 1)
        }
        setUserLike(false)
      }
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <Link href={`/user/${username}`} className={styles.userLink}>
          <div className={styles.userInfo}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.username}>{username}</span>
          </div>
        </Link>
        <span className={styles.date}>{formatDate(reviewDate)}</span>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.movieSection}>
          <Link href={`/movies/${movieId}`}>
            <img 
              src={movieImageUrl} 
              alt={movieTitle}
              className={styles.moviePoster}
            />
          </Link>
        </div>

        <div className={styles.reviewContent}>
          {rating && (
            <div className={styles.ratingDisplay}>
              <RatingFunctionality readOnly initialRating={rating} />
            </div>
          )}
          <Link href={`/reviews/${reviewId}`}>
            <p className={styles.reviewText}>{reviewText}</p>
          </Link>

          <div className={styles.stats}>
            <div className={styles.likeButtonWrapper}>
              <button 
                className={`${styles.likeButton} ${userLike === true ? styles.active : ''}`}
                onClick={() => handleLike(true)}
                aria-label="Like review"
              >
                {userLike === true ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
                {totalLikes}
              </button>
              {showLoginMessage === 'like' && (
                <div className={styles.loginMessage}>
                  You need to log in to like reviews
                </div>
              )}
            </div>
            
            <div className={styles.likeButtonWrapper}>
              <button 
                className={`${styles.likeButton} ${userLike === false ? styles.active : ''}`}
                onClick={() => handleLike(false)}
                aria-label="Dislike review"
              >
                {userLike === false ? <ThumbDownIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
                {totalDislikes}
              </button>
              {showLoginMessage === 'dislike' && (
                <div className={styles.loginMessage}>
                  You need to log in to dislike reviews
                </div>
              )}
            </div>
            
            <Link href={`/reviews/${reviewId}`} className={styles.replyCountLink}>
              <button className={styles.likeButton}>
                <CommentOutlinedIcon fontSize="small" />
                {replyCount || 0}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
