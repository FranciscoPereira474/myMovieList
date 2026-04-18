import MovieListPage from "./browse/page";  
import ListPreview from "./components/ListPreview/ListPreview";
import Link from "next/dist/client/link";
import ReviewListPreviewSection from "./components/ReviewListPreviewSection/ReviewListPreviewSection";
import styles from './styles/homepage.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Pedir links, ver querys */}
        <ListPreview label="Top Picks for You" link="/recommendations" movieQueryFunction="recommended_movies_for_user"></ListPreview>
        <ListPreview label="Popular this week" link="/list/top-week" movieQueryFunction="popular_movies_last_7_days"></ListPreview>
        <ReviewListPreviewSection label="Popular Reviews This Week" link="/popular-reviews/week" reviewQueryFunction="get_popular_reviews_this_week"></ReviewListPreviewSection>
        <ListPreview label="Top Rated Movies of All Time" link="/list/top-rated-all-time" movieQueryFunction="get_top_rated_movies" showUserRatings={true} showAvgRating={true}></ListPreview>
        <ReviewListPreviewSection label="Top Rated Reviews of All Time" link="/highest-rated-reviews/all-time" reviewQueryFunction="get_top_rated_reviews_all_time"></ReviewListPreviewSection>
    </main>
  );
}
