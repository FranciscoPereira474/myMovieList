import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const tmdbKey = process.env.TMDB_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MOVIES_TO_FETCH = 2000;
const MOVIES_PER_PAGE = 20;
const TOP_ACTORS = 5;

async function fetchPopularMovies(count) {
  const totalPages = Math.ceil(count / MOVIES_PER_PAGE);
  let allMovies = [];

  for (let page = 1; page <= totalPages; page++) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbKey}&language=en-US&page=${page}`
    );
    const data = await res.json();
    if (!data.results) break;
    allMovies.push(...data.results);

    console.log(`Fetched page ${page}, total movies: ${allMovies.length}`);

    if (allMovies.length >= count) break;

    await new Promise((r) => setTimeout(r, 250));
  }

  return allMovies.slice(0, count);
}

async function fetchCredits(movieId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${tmdbKey}&language=en-US`
  );
  const data = await res.json();
  return data;
}

async function fetchGenres() {
  const res = await fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdbKey}&language=en-US`
  );
  const data = await res.json();
  return data.genres || [];
}

async function main() {
  try {
    console.log("Fetching genres...");
    const tmdbGenres = await fetchGenres();

    // Insert genres into DB
    for (const g of tmdbGenres) {
      const { data, error } = await supabase
        .from("genres")
        .upsert({ genre: g.name }, { onConflict: "genre" })
        .select("id")
        .single();
      if (error) console.error("Error inserting genre:", error.message);
    }

    console.log("Fetching popular movies...");
    const movies = await fetchPopularMovies(MOVIES_TO_FETCH);

    for (const movie of movies) {
      console.log(`\nProcessing: ${movie.title}`);

      const credits = await fetchCredits(movie.id);

      // Insert director
      const director = credits.crew.find((c) => c.job === "Director");
      if (!director) {
        console.warn("⚠️ No director found, skipping:", movie.title);
        continue;
      }

      const { data: dirData, error: dirError } = await supabase
        .from("directors")
        .upsert({ name: director.name }, { onConflict: "name" })
        .select("id")
        .single();
      if (dirError) {
        console.error("Error inserting director:", dirError.message);
        continue;
      }
      const directorId = dirData.id;

      // Insert movie
      const releaseYear = movie.release_date
        ? parseInt(movie.release_date.split("-")[0])
        : null;

      const { data: movieData, error: movieError } = await supabase
        .from("movies")
        .insert({
          title: movie.title,
          description: movie.overview,
          release_year: releaseYear,
          director_id: directorId,
          image_url: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
        })
        .select("id")
        .single();

      if (movieError) {
        console.error(`Error inserting movie ${movie.title}:`, movieError.message);
        continue;
      }
      
      const movieId = movieData.id;

      // Insert top actors
      const topActors = credits.cast.slice(0, TOP_ACTORS);
      for (const actor of topActors) {
        const { data: actorData, error: actorError } = await supabase
          .from("actors")
          .upsert({ name: actor.name }, { onConflict: "name" })
          .select("id")
          .single();
        if (actorError) {
          console.error("Error inserting actor:", actorError.message);
          continue;
        }
        const actorId = actorData.id;

        const { error: maError } = await supabase
          .from("movie_actors")
          .upsert({ movie_id: movieId, actor_id: actorId });
        if (maError) console.error("Error linking movie and actor:", maError.message);
      }

      // Insert genres
      for (const g of movie.genre_ids) {
        const genre = tmdbGenres.find((gen) => gen.id === g);
        if (!genre) continue;

        const { data: genreData, error: genreError } = await supabase
          .from("genres")
          .select("id")
          .eq("genre", genre.name)
          .single();
        if (genreError) {
          console.error("Error finding genre:", genreError.message);
          continue;
        }

        const genreId = genreData.id;

        const { error: mgError } = await supabase
          .from("movie_genres")
          .upsert({ movie_id: movieId, genre_id: genreId });
        if (mgError) console.error("Error linking movie and genre:", mgError.message);
      }

      console.log(`✅ Inserted ${movie.title}`);
    }

    console.log("\n🎉 Finished populating database!");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

main();
