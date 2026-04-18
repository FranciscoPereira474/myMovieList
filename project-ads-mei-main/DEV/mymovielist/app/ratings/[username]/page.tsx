'use client'
import { supabase } from '@/lib/supabaseClient'
import React, { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import RatedMovieCard from '@/app/components/RatedMovieCard/RatedMovieCard'
import Pagination from '@/app/components/Pagination/Pagination'
import ShareButton from '@/app/components/ShareButton/ShareButton'
import NotFound from '@/app/not-found'
import styles from '../page.module.css'
import SortFilter from '@/app/components/sortFilter/sortFilter'

const ITEMS_PER_PAGE = 24

const UserRatingsPageContent = () => {
  const params = useParams()
  const username = params?.username as string
  
  const [ratedFilms, setRatedFilms] = React.useState<any[]>([])
  const [totalCount, setTotalCount] = React.useState<number>(0)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>('')
  const [userNotFound, setUserNotFound] = React.useState<boolean>(false)

  const searchParams = useSearchParams();
  const sortByParam = searchParams.get('sortBy');
  
  const [sortOrder, setSortOrder] = React.useState<string>(sortByParam || 'title_asc')

  const router = useRouter();

  const cleanUrl = () => {
    router.push(`/ratings/${username}`);
  }

  async function fetchRatings(page: number = 1, sortOrder: string = 'title_asc') {
    if (!username) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      // Fetch the user_id from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (userError || !userData?.id) {
        setUserNotFound(true)
        setLoading(false)
        return
      }

      // Get total count using database function
      const { data: countData, error: countError } = await supabase
        .rpc('get_user_ratings_count', { p_user_id: userData.id })

      if (countError) throw countError
      setTotalCount(countData || 0)

      // Get paginated data using database function
      const offset = (page - 1) * ITEMS_PER_PAGE
      const { data, error: ratingsError } = await supabase
        .rpc('get_user_ratings_with_titles_paginated', {
          p_user_id: userData.id,
          p_limit: ITEMS_PER_PAGE,
          p_offset: offset
        })

      if (ratingsError) throw ratingsError

      if (sortOrder.split('_')[0] === 'date') {
        const [_, direction] = sortOrder.split('_')
        data?.sort((a: any, b: any) => {
          const dateA = new Date(a.date_time)
          const dateB = new Date(b.date_time)
          return direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
        })
      }

      else if (sortOrder.split('_')[0] === 'title') {
        const [_, direction] = sortOrder.split('_')
        data?.sort((a: any, b: any) => {
          if (direction === 'asc') {
            return a.title.localeCompare(b.title)
          } else {
            return b.title.localeCompare(a.title)
          }
        })
      }

      else if (sortOrder.split('_')[0] === 'rating') {
        const [_, direction] = sortOrder.split('_')
        data?.sort((a: any, b: any) => {
          return direction === 'asc' ? a.rating - b.rating : b.rating - a.rating
        })
      }

      setRatedFilms(data || [])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error fetching ratings:', error)
      setError('Error loading ratings')
    } finally {
      setLoading(false)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    fetchRatings(page, sortOrder)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  useEffect(() => {
    setCurrentPage(1)
    fetchRatings(1, sortOrder)
  }, [username, sortOrder])

  if (userNotFound) return <NotFound customMessage="User not found!" />

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Ratings</h1>
          <p className={styles.count}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>{error}</h2>
        </div>
      </div>
    )
  }

  const sortOptions: Record<string, string> = {
    'Title (A-Z)': 'title_asc',
    'Title (Z-A)': 'title_desc',
    'Date Rated (Oldest)': 'date_asc',
    'Date Rated (Newest)': 'date_desc',
    'Rating (Lowest)': 'rating_asc',
    'Rating (Highest)': 'rating_desc'
  }

  const handleSortSelect = (value: string) => {
    setSortOrder(value)
    router.replace(`/ratings/${username}?sortBy=${value}`)
    console.log('Sort selected:', value);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWithShare}>
            <h1 className={styles.title}>{username}'s Ratings</h1>
            {username && (
              <ShareButton url={`${window.location.origin}/ratings/${username}?sortBy=${sortOrder}`} />
            )}
          </div>
          <p className={styles.count}>
            {totalCount} {totalCount === 1 ? 'film' : 'films'}
          </p>
        </div>
        <SortFilter sortBy={sortOrder} sortOptions={sortOptions} handleSortChange={handleSortSelect} />
      </div>
      

      {totalCount === 0 ? (
        <div className={styles.emptyState}>
          <h2>No ratings yet</h2>
        </div>
      ) : (
        <>
          <div className={styles.movieGrid}>
            {ratedFilms.map((film: any) => (
              <RatedMovieCard
                key={film.movie_id}
                movieId={film.movie_id}
                rating={film.rating}
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
        </>
      )}
    </div>
  )
}

const UserRatingsPage = () => {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Ratings</h1>
          <p className={styles.count}>Loading...</p>
        </div>
      </div>
    }>
      <UserRatingsPageContent />
    </Suspense>
  )
}

export default UserRatingsPage
