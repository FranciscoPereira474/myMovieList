from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from collections import defaultdict

# Load env vars
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI()

@app.get("/recommendations")
def get_recommendations(user_id: int, limit: int = 5):
    # 1. Get ratings of this user
    ratings = supabase.table("ratings").select("*").eq("user_id", user_id).execute().data
    if not ratings:
        return {"message": "No ratings found for this user"}

    rated_movie_ids = {r["movie_id"] for r in ratings}

    # 2. Get movie->genres mapping
    movie_genres = supabase.table("movie_genres").select("*").execute().data
    genres = supabase.table("genres").select("*").execute().data
    genre_map = {g["id"]: g["genre"] for g in genres}

    movie_to_genres = defaultdict(list)
    for mg in movie_genres:
        movie_to_genres[mg["movie_id"]].append(genre_map[mg["genre_id"]])

    # 3. Compute user's preference per genre
    genre_scores = defaultdict(list)
    for r in ratings:
        for g in movie_to_genres.get(r["movie_id"], []):
            genre_scores[g].append(r["rating"])

    genre_strength = {g: sum(vals)/len(vals) for g, vals in genre_scores.items()}

    # 4. Get all movies
    movies = supabase.table("movies").select("*").execute().data

    # 5. Score movies not rated yet
    recommendations = []
    for m in movies:
        if m["id"] in rated_movie_ids:
            continue
        genres = movie_to_genres.get(m["id"], [])
        if not genres:
            continue
        # Average the user's preference for all genres this movie belongs to
        scores = [genre_strength.get(g, 0) for g in genres]
        score = sum(scores) / len(scores) if scores else 0
        recommendations.append({"movie": m, "score": score})

    # 6. Sort and return top-N
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:limit]
