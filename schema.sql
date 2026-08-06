-- SQL Schema for Neon Database (FitShare App)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL
);

-- Fits (Outfits) Table
CREATE TABLE IF NOT EXISTS fits (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  image TEXT NOT NULL,
  links JSONB DEFAULT '[]'::jsonb,
  likes INT DEFAULT 0,
  author_id VARCHAR(100) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  created_at BIGINT NOT NULL
);

-- Fit Likes Table (tracks which user liked which fit)
CREATE TABLE IF NOT EXISTS fit_likes (
  user_id VARCHAR(100) NOT NULL,
  fit_id VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, fit_id)
);
