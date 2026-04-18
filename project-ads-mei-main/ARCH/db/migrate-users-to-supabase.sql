-- Migration script to adapt users table for Supabase authentication
-- Run this in your Supabase SQL Editor

-- Step 1: Backup existing users table (optional but recommended)
DROP TABLE IF EXISTS users_backup;
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop old users table and recreate it to work with Supabase auth
DROP TABLE IF EXISTS reviews_likes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create new users table linked to Supabase auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create index on username for fast lookups
CREATE INDEX idx_users_username ON users (username);

-- Step 5: Recreate dependent tables with UUID foreign keys
CREATE TABLE ratings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_ratings_movie_id ON ratings (movie_id);
CREATE INDEX idx_ratings_user_id ON ratings (user_id);
CREATE INDEX idx_ratings_date_time ON ratings (date_time DESC);

CREATE TABLE watchlist (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_watchlist_user_id ON watchlist (user_id);
CREATE INDEX idx_watchlist_movie_id ON watchlist (movie_id);
CREATE INDEX idx_watchlist_date_time ON watchlist (date_time DESC);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    review TEXT NOT NULL,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_movie_id ON reviews (movie_id);
CREATE INDEX idx_reviews_user_id ON reviews (user_id);
CREATE INDEX idx_reviews_date_time ON reviews (date_time DESC);

CREATE TABLE reviews_likes (
    review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked BOOLEAN NOT NULL,
    PRIMARY KEY (review_id, user_id)
);

-- Step 6: Create a trigger to automatically create a user profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Enable Row Level Security (RLS) on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for users table
-- Allow users to read all profiles
CREATE POLICY "Users can view all profiles"
    ON users
    FOR SELECT
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Step 10: Enable RLS on other tables
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_likes ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies for ratings
CREATE POLICY "Users can view all ratings"
    ON ratings
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own ratings"
    ON ratings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
    ON ratings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
    ON ratings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 12: Create RLS policies for watchlist
CREATE POLICY "Users can view their own watchlist"
    ON watchlist
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist"
    ON watchlist
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watchlist"
    ON watchlist
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 13: Create RLS policies for reviews
CREATE POLICY "Users can view all reviews"
    ON reviews
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own reviews"
    ON reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 14: Create RLS policies for reviews_likes
CREATE POLICY "Users can view all review likes"
    ON reviews_likes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own review likes"
    ON reviews_likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review likes"
    ON reviews_likes
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review likes"
    ON reviews_likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Migration complete!
-- Now all user authentication is handled by Supabase auth.users
-- The public.users table stores additional profile information
