-- Migration: Add optional hashtags array column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.projects.hashtags IS 'Optional architectural and engineering tags for project categorization and SEO hashtags';
