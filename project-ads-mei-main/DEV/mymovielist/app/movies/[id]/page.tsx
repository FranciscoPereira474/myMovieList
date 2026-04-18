'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from '@/app/movies/[id]/style/page.module.css'
import MoviePoster from '@/app/components/MovieDetails/MoviePoster'
import MovieHeader from '@/app/components/MovieDetails/MovieHeader'
import MovieDescription from '@/app/components/MovieDetails/MovieDescription'
import RatingFunctionality from './RatingFunctionality'
import RatingDisplay from '@/app/components/RatingDisplay/RatingDisplay'
import ReviewListPreview from '@/app/components/ReviewListPreview/ReviewListPreview'
import { ReviewPreviewData } from '@/app/components/ReviewListPreview/ReviewListPreview'
import NotFound from '@/app/not-found'
import { containsProfanity } from '@/lib/profanityFilter'

interface Movie {
  id: string
  title: string
  description: string
  rating: number
  release_year: number
  director: string
  actors: string[]
  genres: string[]
  image_url: string
}

export default function MoviePage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const movieId = params?.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingData, setRatingData] = useState<{ avg_rating: number; rating_count: number } | null>(null)
  const [reviewContent, setReviewContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [popularReviews, setPopularReviews] = useState<ReviewPreviewData[]>([])
  const [recentReviews, setRecentReviews] = useState<ReviewPreviewData[]>([])
  
  const [popularLimit, setPopularLimit] = useState(3);
  const [recentLimit, setRecentLimit] = useState(3);
  const [hasMorePopular, setHasMorePopular] = useState(false);
  const [hasMoreRecent, setHasMoreRecent] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handlePostReview = async () => {
    setPostError(null)
    setIsPosting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push(`/authentication?redirectTo=${encodeURIComponent(pathname || '/')}`)
        return
      }

      if (!reviewContent.trim()) return

      if (containsProfanity(reviewContent)) {
        setPostError("Please keep the language clean. Your review contains inappropriate words.");
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          movie_id: Number(movieId),
          review: reviewContent
        })

      if (error) throw error

      setReviewContent('')
      // Refresh reviews by incrementing trigger to force useEffect refetch
      setRefreshTrigger(prev => prev + 1)
    } catch (error: any) {
      console.error('Error posting review:', error)
      setPostError('Failed to post review: ' + error.message)
    } finally {
      setIsPosting(false)
    }
  }

  const handleLikeReview = async (reviewId: number, isLike: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Please login to vote");
        return;
    }

    // Optimistic update
    const updateReviews = (reviews: ReviewPreviewData[]) => {
        return reviews.map(r => {
            if (r.id === reviewId) {
                // Determine new state
                let newLikes = r.likes;
                let newDislikes = r.dislikes;
                let newReaction: 'liked' | 'disliked' | null = null;

                if (isLike) {
                    if (r.userReaction === 'liked') {
                        // Toggle off
                        newLikes--;
                        newReaction = null;
                    } else {
                        // Toggle on
                        newLikes++;
                        newReaction = 'liked';
                        if (r.userReaction === 'disliked') {
                            newDislikes--;
                        }
                    }
                } else {
                    if (r.userReaction === 'disliked') {
                        // Toggle off
                        newDislikes--;
                        newReaction = null;
                    } else {
                        // Toggle on
                        newDislikes++;
                        newReaction = 'disliked';
                        if (r.userReaction === 'liked') {
                            newLikes--;
                        }
                    }
                }
                return { ...r, likes: newLikes, dislikes: newDislikes, userReaction: newReaction };
            }
            return r;
        });
    };

    setPopularReviews(prev => updateReviews(prev));
    setRecentReviews(prev => updateReviews(prev));

    const { error } = await supabase.rpc('toggle_review_like', {
        p_review_id: reviewId,
        p_user_id: user.id,
        p_liked: isLike
    });

    if (error) {
        console.error("Error toggling like:", error);
        
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
        return;
    }

    // Update local state
    setPopularReviews(prev => prev.filter(r => r.id !== reviewId));
    setRecentReviews(prev => prev.filter(r => r.id !== reviewId));
    
    // Trigger refresh to ensure consistency
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    async function fetchMovie() {
      if (!movieId) return
      try {
        const { data, error } = await supabase.rpc('get_movie_details', { p_movie_id: Number(movieId) })
        if (error) throw new Error(error.message)
        if (!data || data.length === 0) {
          setMovie(null)
          return
        }

        const movieData = data[0]

        const movieWithRating: Movie = {
          id: movieData.id,
          title: movieData.title,
          description: movieData.description,
          release_year: movieData.release_year,
          image_url: movieData.image_url,
          actors: movieData.actors || [],
          genres: movieData.genres || [],
          rating: movieData.rating ?? 0,
          director: movieData.director || 'Unknown',
        }

        setMovie(movieWithRating)

        const numericMovieId = Number(movieId);
        if (isNaN(numericMovieId)) {
            console.error("Invalid movie ID:", movieId);
            return;
        }

        // Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;
        setCurrentUserId(userId);

        // Reviews fetching moved to separate useEffects

      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    async function fetchRating() {
      if (!movieId) return
      try {
        const { data, error } = await supabase.rpc('get_movie_rating', { p_movie_id: Number(movieId) })
        if (!error && data && data.length > 0) {
          setRatingData(data[0])
        }
      } catch (err) {
        console.error('Error fetching rating:', err)
      }
    }

    fetchMovie()
    fetchRating()
  }, [movieId])

  const handleShowMorePopular = () => {
    setLoadingPopular(true);
    setPopularLimit(prev => prev + 3);
  };

  const handleCollapsePopular = () => {
    setPopularReviews(prev => prev.slice(0, 3));
    setHasMorePopular(true);
    setPopularLimit(3);
  };

  const handleShowMoreRecent = () => {
    setLoadingRecent(true);
    setRecentLimit(prev => prev + 3);
  };

  const handleCollapseRecent = () => {
    setRecentReviews(prev => prev.slice(0, 3));
    setHasMoreRecent(true);
    setRecentLimit(3);
  };

  // Separate effect for Popular Reviews
  useEffect(() => {
    async function fetchPopular() {
        if (!movieId) return;
        const numericMovieId = Number(movieId);
        if (isNaN(numericMovieId)) return;

        setLoadingPopular(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            const { data: popularData, error: popularError } = await supabase.rpc('get_movie_reviews_with_stats_with_replies', {
                p_movie_id: numericMovieId,
                p_user_id: userId,
                p_sort_by: 'likes',
                p_limit: popularLimit + 1
            });
            
            if (popularError) {
                console.error('Error fetching popular reviews (RPC):', popularError);
                console.error('Full error details:', JSON.stringify(popularError, null, 2));
                // Fallback logic could go here if needed, but skipping for brevity/clarity as RPC should work
            } else if (popularData) {
                const hasMore = popularData.length > popularLimit;
                const dataToShow = hasMore ? popularData.slice(0, popularLimit) : popularData;
                setHasMorePopular(hasMore);
                setPopularReviews(dataToShow.map((r: any) => ({
                    id: r.id,
                    username: r.username,
                    userId: r.user_id,
                    rating: r.rating,
                    content: r.content,
                    likes: r.likes_count,
                    dislikes: r.dislikes_count,
                    userReaction: r.user_reaction,
                    createdAt: new Date(r.created_at).toLocaleDateString(),
                    replyCount: r.reply_count
                })));
            }
        } catch (err) {
            console.error("Error in fetchPopular:", err);
        } finally {
            setLoadingPopular(false);
        }
    }
    fetchPopular();
  }, [movieId, popularLimit, refreshTrigger]);

  // Separate effect for Recent Reviews
  useEffect(() => {
    async function fetchRecent() {
        if (!movieId) return;
        const numericMovieId = Number(movieId);
        if (isNaN(numericMovieId)) return;

        setLoadingRecent(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            const { data: recentData, error: recentError } = await supabase.rpc('get_movie_reviews_with_stats_with_replies', {
                p_movie_id: numericMovieId,
                p_user_id: userId,
                p_sort_by: 'newest',
                p_limit: recentLimit + 1
            });

            if (recentError) {
                console.error('Error fetching recent reviews (RPC):', recentError);
                console.error('Full error details:', JSON.stringify(recentError, null, 2));
            } else if (recentData) {
                const hasMore = recentData.length > recentLimit;
                const dataToShow = hasMore ? recentData.slice(0, recentLimit) : recentData;
                setHasMoreRecent(hasMore);
                setRecentReviews(dataToShow.map((r: any) => ({
                    id: r.id,
                    username: r.username,
                    userId: r.user_id,
                    rating: r.rating,
                    content: r.content,
                    likes: r.likes_count,
                    dislikes: r.dislikes_count,
                    userReaction: r.user_reaction,
                    createdAt: new Date(r.created_at).toLocaleDateString(),
                    replyCount: r.reply_count
                })));
            }
        } catch (err) {
            console.error("Error in fetchRecent:", err);
        } finally {
            setLoadingRecent(false);
        }
    }
    fetchRecent();
  }, [movieId, recentLimit, refreshTrigger]);

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!movie) return <NotFound customMessage={"Movie not found!"} />

  return (
    <div className={styles.page}>
      <div className={styles.background} style={{ backgroundImage: `url(${movie.image_url})` }} />
      <div className={styles.overlay} />

      <div className={styles.container}>
        <div className={styles.posterSection}>
          <MoviePoster posterUrl={movie.image_url} title={movie.title} />
          <RatingDisplay 
            avgRating={ratingData?.avg_rating ? ratingData.avg_rating / 2 : null} 
            ratingCount={ratingData?.rating_count || 0} 
          />
          <RatingFunctionality movieId={Number(movieId)} />
        </div>

        <div className={styles.infoSection}>
          <MovieHeader title={movie.title} releaseYear={movie.release_year} director={movie.director} />
          
          <MovieDescription description={movie.description} />

          {movie.genres && movie.genres.length > 0 && (
            <div className={styles.section}>
              <h3>Genres</h3>
              <div className={styles.genreTags}>
                {movie.genres.map((genre, index) => (
                  <span key={index} className={styles.genreTag}>{genre}</span>
                ))}
              </div>
            </div>
          )}

          {movie.actors && movie.actors.length > 0 && (
            <div className={styles.section}>
              <h3>Cast</h3>
              <div className={styles.castList}>
                {movie.actors.map((actor, index) => (
                  <span key={index} className={styles.castMember}>{actor}</span>
                ))}
              </div>
            </div>
          )}

          <ReviewListPreview 
            label="Popular Reviews" 
            movieId={Number(movieId)}
            reviews={popularReviews}
            onLike={handleLikeReview}
            onShowMore={handleShowMorePopular}
            onCollapse={handleCollapsePopular}
            onDelete={handleDeleteReview}
            currentUserId={currentUserId}
            hasMore={hasMorePopular}
            isExpanded={popularLimit > 3}
            isLoading={loadingPopular && popularLimit > 3}
          />

          <ReviewListPreview 
            label="Recent Reviews" 
            movieId={Number(movieId)}
            reviews={recentReviews}
            onLike={handleLikeReview}
            onShowMore={handleShowMoreRecent}
            onCollapse={handleCollapseRecent}
            onDelete={handleDeleteReview}
            currentUserId={currentUserId}
            hasMore={hasMoreRecent}
            isExpanded={recentLimit > 3}
            isLoading={loadingRecent && recentLimit > 3}
          />

          <div className={styles.writeReview}>
            <h2 className={styles.reviewTitle}>Write your review</h2>
            {currentUserId ? (
              <div className={styles.reviewForm}>
                <textarea 
                  className={styles.reviewTextarea} 
                  placeholder="Review here..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  disabled={isPosting}
                />
                <div className={styles.reviewFooter}>
                  {postError && <span className={styles.postError}>{postError}</span>}
                  <button 
                    className={styles.postButton}
                    onClick={handlePostReview}
                    disabled={isPosting}
                  >
                    {isPosting ? 'POSTING...' : 'POST'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.loginMessage}>
                <p>
                  You need to <a href={`/authentication?redirect=${encodeURIComponent(pathname)}`}>login</a> to write a review
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
