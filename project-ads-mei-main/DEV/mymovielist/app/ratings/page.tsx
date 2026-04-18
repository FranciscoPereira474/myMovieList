'use client'
import { supabase } from '@/lib/supabaseClient'
import React, { useEffect, Suspense } from 'react'
import RatedMovieCard from '@/app/components/RatedMovieCard/RatedMovieCard'
import Pagination from '@/app/components/Pagination/Pagination'
import ShareButton from '@/app/components/ShareButton/ShareButton'
import styles from './page.module.css'
import Link from 'next/dist/client/link'
import SortFilter from '../components/sortFilter/sortFilter'

import {useRouter, useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 24

const RatingsPageContent = () => {
  const [user, setUser] = React.useState<any>(null)
  const [username, setUsername] = React.useState<string>('')
  const [ratedFilms, setRatedFilms] = React.useState<any[]>([])
  const [totalCount, setTotalCount] = React.useState<number>(0)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [loading, setLoading] = React.useState<boolean>(true)



  const searchParams = useSearchParams();
  const sortByParam = searchParams.get('sortBy');
  const [sortOrder, setSortOrder] = React.useState<string>(sortByParam || 'title_asc')

  const router = useRouter();
  
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
    // Sorting logic can be implemented here
    // add to URL without reloading
    const newUrl = `/ratings?sortBy=${value}`
    router.push(newUrl)
    
  }

  async function checkAuthAndFetchRatings(page: number = 1, sortOrder: string = 'title_asc') {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setUser(user)

      // Get username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!userError && userData) {
        setUsername(userData.username)
      }

      // Get total count using database function
      const { data: countData, error: countError } = await supabase
        .rpc('get_user_ratings_count', { p_user_id: user.id })

      if (countError) throw countError
      setTotalCount(countData || 0)

      // Get paginated data using database function
      const offset = (page - 1) * ITEMS_PER_PAGE
      const { data, error } = await supabase
        .rpc('get_user_ratings_with_titles_paginated', {
          p_user_id: user.id,
          p_limit: ITEMS_PER_PAGE,
          p_offset: offset
        })
      
      if (error) throw error

      if (Object.values(sortOptions).includes(sortByParam as string)){
        sortOrder = sortByParam as string
        setSortOrder(sortByParam as string)
        
      }
      

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
    } finally {
      setLoading(false)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    checkAuthAndFetchRatings(page, sortOrder)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    checkAuthAndFetchRatings(1, sortOrder);
  }, [sortOrder])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Ratings</h1>
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
            <Link className={styles.authLink} href={`/authentication?redirect=${encodeURIComponent(window.location.pathname)}`}>log in</Link>
            {' '}to view your ratings
          </h2>
        </div>
      </div>
    )
  }




  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWithShare}>
            <h1 className={styles.title}>My Ratings</h1>
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
          <h2>You haven't rated any films yet</h2>
          <p>Start rating movies to see them here!</p>
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

const RatingsPage = () => {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Ratings</h1>
          <p className={styles.count}>Loading...</p>
        </div>
      </div>
    }>
      <RatingsPageContent />
    </Suspense>
  )
}

export default RatingsPage
