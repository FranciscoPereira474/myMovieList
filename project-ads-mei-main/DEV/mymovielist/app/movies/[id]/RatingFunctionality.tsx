'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import styles from '@/app/movies/[id]/style/RatingFunctionality.module.css'

interface RatingFunctionalityProps {
  movieId: number
}

const RatingFunctionality = ({ movieId }: RatingFunctionalityProps) => {
  const [user, setUser] = useState<any>(null)
  const [currentRating, setCurrentRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    checkAuthAndFetchData()
  }, [movieId])

  async function checkAuthAndFetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user's movie data using database function
        const { data, error } = await supabase.rpc('get_user_movie_data', {
          p_user_id: user.id,
          p_movie_id: movieId
        })

        if (error) throw error

        if (data && data.length > 0) {
          const userData = data[0]
          // Convert DB rating (1-10) to display rating (0.5-5.0)
          const displayRating = userData.rating ? userData.rating / 2 : 0
          setCurrentRating(displayRating)
          setIsInWatchlist(userData.in_watchlist || false)
        } else {
          // No rating exists - check watchlist separately since get_user_movie_data
          // only returns data when there's a rating record
          const { data: watchlistData } = await supabase
            .from('watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', movieId)
            .maybeSingle()

          if (watchlistData) {
            setIsInWatchlist(true)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRating(rating: number) {
    if (!user) return

    try {
      // Convert display rating (0.5-5.0) to DB rating (1-10)
      const dbRating = Math.round(rating * 2)
      
      const { error } = await supabase.rpc('rate_movie', {
        p_user_id: user.id,
        p_movie_id: movieId,
        p_rating: dbRating
      })

      if (error) throw error

      setCurrentRating(rating)
    } catch (error) {
      console.error('Error saving rating:', error)
      alert('Failed to save rating. Please try again.')
    }
  }

  async function clearRating() {
    if (!user) return

    try {
      const { error } = await supabase.rpc('clear_rating', {
        p_user_id: user.id,
        p_movie_id: movieId
      })

      if (error) throw error

      setCurrentRating(0)
    } catch (error) {
      console.error('Error clearing rating:', error)
      alert('Failed to clear rating. Please try again.')
    }
  }

  async function toggleWatchlist() {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('toggle_watchlist', {
        p_user_id: user.id,
        p_movie_id: movieId
      })

      if (error) throw error

      // Function returns true if added, false if removed
      setIsInWatchlist(data)
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      alert('Failed to update watchlist. Please try again.')
    }
  }

  function getStarFill(starIndex: number): 'empty' | 'half' | 'full' {
    const rating = hoverRating || currentRating
    const starValue = starIndex + 1
    
    if (rating >= starValue) return 'full'
    if (rating >= starValue - 0.5) return 'half'
    return 'empty'
  }

  function handleStarClick(starIndex: number, isHalf: boolean) {
    const rating = starIndex + (isHalf ? 0.5 : 1)
    // If clicking the same rating, clear it
    if (currentRating === rating) {
      clearRating()
    } else {
      handleRating(rating)
    }
  }

  function handleStarHover(starIndex: number, event: React.MouseEvent<HTMLDivElement>) {
    if (!user) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    
    const rating = starIndex + (isLeftHalf ? 0.5 : 1)
    setHoverRating(rating)
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.loginPrompt}>
          <Link href={`/authentication?redirect=${encodeURIComponent(window.location.pathname)}`}>Sign in</Link> to rate and add to watchlist
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Watchlist Button */}
      <button
        className={`${styles.watchlistButton} ${isInWatchlist ? styles.active : ''}`}
        onClick={toggleWatchlist}
        title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isInWatchlist ? (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
            <path d="M200-200v-560 454-85 191Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v320h-80v-320H200v560h280v80H200Zm494 40L552-222l57-56 85 85 170-170 56 57L694-80ZM320-440q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 160h240v-80H440v80Zm0-160h240v-80H440v80Z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--muted)">
            <path d="M680-40v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM200-200v-560 560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v353q-18-11-38-18t-42-11v-324H200v560h280q0 21 3 41t10 39H200Zm120-160q17 0 28.5-11.5T360-320q0-17-11.5-28.5T320-360q-17 0-28.5 11.5T280-320q0 17 11.5 28.5T320-280Zm0-160q17 0 28.5-11.5T360-480q0-17-11.5-28.5T320-520q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440Zm0-160q17 0 28.5-11.5T360-640q0-17-11.5-28.5T320-680q-17 0-28.5 11.5T280-640q0 17 11.5 28.5T320-600Zm120 160h240v-80H440v80Zm0-160h240v-80H440v80Zm0 320h54q8-23 20-43t28-37H440v80Z"/>
          </svg>
        )}
      </button>

      {/* Rating Stars */}
      <div className={styles.ratingContainer}>
        <div
          className={styles.starsWrapper}
          onMouseLeave={() => setHoverRating(0)}
        >
          {/* SVG gradient definition for half stars */}
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="halfGradient">
                <stop offset="50%" stopColor="var(--accent-start, #6ee7b7)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
              </linearGradient>
            </defs>
          </svg>

          {[0, 1, 2, 3, 4].map((starIndex) => {
            const fillType = getStarFill(starIndex)
            return (
              <div
                key={starIndex}
                className={`${styles.star} ${
                  fillType === 'full' ? styles.filled :
                  fillType === 'half' ? styles.half :
                  ''
                }`}
                onMouseMove={(e) => handleStarHover(starIndex, e)}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const isLeftHalf = x < rect.width / 2
                  handleStarClick(starIndex, isLeftHalf)
                }}
              >
                <svg
                  className={styles.starIcon}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RatingFunctionality