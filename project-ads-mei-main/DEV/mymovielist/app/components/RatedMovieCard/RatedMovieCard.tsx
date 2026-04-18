'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import styles from './RatedMovieCard.module.css'

interface RatedMovieCardProps {
  movieId: number
  rating: number // 1-10 scale from database
  className?: string
}

const RatedMovieCard = ({ movieId, rating, className }: RatedMovieCardProps) => {
  const [movieData, setMovieData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchMovieData = async () => {
      const { data, error } = await supabase
        .rpc('get_movie_details', { p_movie_id: movieId })

      if (error) {
        console.error(error)
        setError('Error fetching movie details')
        return
      }

      setMovieData(data?.[0] || null)
    }

    fetchMovieData()
  }, [movieId])

  // Convert rating from 1-10 to 0.5-5.0 scale
  const displayRating = rating / 2

  const getStarFill = (starIndex: number) => {
    const starValue = starIndex + 1
    if (displayRating >= starValue) return 'full'
    if (displayRating >= starValue - 0.5) return 'half'
    return 'empty'
  }

  const renderStars = () => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      const fill = getStarFill(i)
      if (fill === 'empty') break
      
      stars.push(
        <svg
          key={i}
          className={`${styles.star} ${styles[fill]}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          {fill === 'full' && (
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          )}
          {fill === 'half' && (
            <>
              <defs>
                <linearGradient id={`half-${movieId}-${i}`}>
                  <stop offset="50%" stopColor="var(--accent-start)" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={`url(#half-${movieId}-${i})`}
              />
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill="none"
                stroke="var(--accent-start)"
                strokeWidth="1"
              />
            </>
          )}
        </svg>
      )
    }
    return stars
  }

  if (error) {
    return <div className={`${styles.card} ${className}`}>{error}</div>
  }

  if (!movieData) {
    return (
      <div className={`${styles.card} ${className}`}>
        <Image
          src={'/placeholder.png'}
          alt="loading"
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
        />
        <div className={styles.stars} />
      </div>
    )
  }

  const imgUrl = movieData.image_url || '/placeholder.png'

  return (
    <Link className={`${styles.card} ${className}`} href={`/movies/${movieData.id}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={imgUrl}
          alt={`Movie poster for ${movieData.title}`}
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      <div className={styles.stars}>
        {renderStars()}
      </div>
    </Link>
  )
}

export default RatedMovieCard
