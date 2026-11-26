-- Revoke public SELECT/INSERT/DELETE exposure on deprecated blog engagement tables
DO $$
BEGIN
  IF to_regclass('public.blog_likes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow public select blog_likes" ON public.blog_likes';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public insert blog_likes" ON public.blog_likes';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public delete blog_likes" ON public.blog_likes';
    EXECUTE 'REVOKE ALL ON public.blog_likes FROM anon, public';
    EXECUTE 'CREATE POLICY "Verified admin can manage blog_likes" ON public.blog_likes FOR ALL TO authenticated USING (public.has_role(''admin'')) WITH CHECK (public.has_role(''admin''))';
  END IF;

  IF to_regclass('public.blog_comments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow public select blog_comments" ON public.blog_comments';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public insert blog_comments" ON public.blog_comments';
    EXECUTE 'REVOKE ALL ON public.blog_comments FROM anon, public';
    EXECUTE 'CREATE POLICY "Verified admin can manage blog_comments" ON public.blog_comments FOR ALL TO authenticated USING (public.has_role(''admin'')) WITH CHECK (public.has_role(''admin''))';
  END IF;
END $$;
