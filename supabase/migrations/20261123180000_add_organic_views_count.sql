-- Add organic_views_count and initial_views_count to blogs
ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS organic_views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_views_count integer NOT NULL DEFAULT 0;

-- Update increment_blog_views function to track both total views and organic views
CREATE OR REPLACE FUNCTION public.increment_blog_views(p_slug text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_views integer;
BEGIN
  UPDATE public.blogs
  SET views_count = coalesce(views_count, 0) + 1,
      organic_views_count = coalesce(organic_views_count, 0) + 1
  WHERE slug = p_slug
  RETURNING views_count INTO v_new_views;

  RETURN coalesce(v_new_views, 0);
END;
$$;
