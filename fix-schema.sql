-- ============================================================
-- FIX SCHEMA: Add missing 'images' column to ads table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add images array column if not exists
ALTER TABLE ads ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name IN ('image', 'images');