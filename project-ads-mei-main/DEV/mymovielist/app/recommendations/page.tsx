'use client'
import { supabase } from '@/lib/supabaseClient'
import React, { useEffect } from 'react'
import MovieCard from '@/app/components/MovieCard/MovieCard'
import Pagination from '@/app/components/Pagination/Pagination'
import styles from './page.module.css'
import Link from 'next/dist/client/link'

const ITEMS_PER_PAGE = 24

const RecommendationsPage = () => {
  const [user, setUser] = React.useState<any>(null)
  const [allMovieIds, setAllMovieIds] = React.useState<number[]>([])
  const [currentPageIds, setCurrentPageIds] = React.useState<number[]>([])
  const [totalCount, setTotalCount] = React.useState<number>(0)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [loading, setLoading] = React.useState<boolean>(true)

  async function fetchRecommendations(page: number = 1, cachedIds?: number[]) {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setUser(user)

      let movieIds = cachedIds

      // Only fetch from API if we don't have cached IDs
      if (!movieIds) {
        const response = await fetch(`/recommendations/api/engine?userId=${user.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }

        const data = await response.json()
        movieIds = data.movieIds || []
        setAllMovieIds(movieIds!)
      }
      
      if (!movieIds || movieIds.length === 0) {
        setCurrentPageIds([])
        setTotalCount(0)
        setLoading(false)
        return
      }

      setTotalCount(movieIds.length)

      // Calculate pagination
      const offset = (page - 1) * ITEMS_PER_PAGE
      const paginatedIds = movieIds.slice(offset, offset + ITEMS_PER_PAGE)

      setCurrentPageIds(paginatedIds)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    fetchRecommendations(page, allMovieIds)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Recommendations</h1>
          <p className={styles.count}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>
            Please{' '}
            <Link href="/authentication" className={styles.authLink}>
              log in
            </Link>{' '}
            to see your personalized recommendations
          </h2>
          <p>We&apos;ll suggest movies based on your ratings and preferences.</p>
        </div>
      </div>
    )
  }

  if (currentPageIds.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Recommendations</h1>
        </div>
        <div className={styles.emptyState}>
          <h2>No recommendations yet</h2>
          <p>Start rating some movies and we&apos;ll suggest films you might enjoy!</p>
          <Link href="/movies" className={styles.browseLink}>
            Browse Movies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Recommendations</h1>
            <p className={styles.subtitle}>Movies we think you&apos;ll love based on your ratings</p>
          </div>
        </div>
        <p className={styles.count}>
          {totalCount} {totalCount === 1 ? 'recommendation' : 'recommendations'}
        </p>
      </div>

      <div className={styles.movieGrid}>
        {currentPageIds.map((movieId) => (
          <MovieCard
            key={movieId}
            movieId={movieId}
            className={styles.movieCard}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        loading={loading}
      />
    </div>
  )
}

export default RecommendationsPage