'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ReviewCard from '@/app/components/ReviewCard/ReviewCard'
import Pagination from '@/app/components/Pagination/Pagination'
import styles from '../HighestRatedReviews.module.css'

interface Review {
  review_id: number
  review_text: string
  review_date: string
  user_id: string
  username: string
  avatar_url: string | null
  movie_id: number
  movie_title: string
  movie_image_url: string
  total_likes: number
  total_dislikes: number
  like_ratio: number
  total_count: number
  rating: number | null
  reply_count: number
}

const REVIEWS_PER_PAGE = 20

const HighestRatedReviewsAllTime = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    async function fetchHighestRatedReviews() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_highest_rated_reviews_all_time', {
          p_page: currentPage,
          p_page_size: REVIEWS_PER_PAGE
        })
        
        if (error) throw new Error(error.message)
        
        setReviews(data || [])
        if (data && data.length > 0) {
          setTotalCount(data[0].total_count)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHighestRatedReviews()
  }, [currentPage])

  if (loading) {
    return (
      <div className={styles.page}>
        <h1>Highest Rated Reviews of All Time</h1>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1>Highest Rated Reviews of All Time</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / REVIEWS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.page}>
      <h1>Highest Rated Reviews of All Time</h1>
      
      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          <p>No reviews found.</p>
        </div>
      ) : (
        <>
          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <ReviewCard
                key={review.review_id}
                reviewId={review.review_id}
                reviewText={review.review_text}
                reviewDate={review.review_date}
                username={review.username}
                avatarUrl={review.avatar_url}
                movieId={review.movie_id}
                movieTitle={review.movie_title}
                movieImageUrl={review.movie_image_url}
                totalLikes={review.total_likes}
                totalDislikes={review.total_dislikes}
                rating={review.rating}
                replyCount={review.reply_count}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}

export default HighestRatedReviewsAllTime
