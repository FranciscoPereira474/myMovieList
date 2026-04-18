import ListPreview from "./components/ListPreview/ListPreview";




export default function Home() {
  return (
    <div className="homePage">
      <ListPreview
        label="Popular this week"
        link="/movies"
        movieQueryFunction="popular_movies_last_7_days"
      />
      <ListPreview
        label="Top Rated Movies of All Time"
        link="/movies"
        movieQueryFunction="get_top_rated_movies"
      />
    </div>
  );
}
