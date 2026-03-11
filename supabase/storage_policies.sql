-- HomeTaste - Storage policies for recipe images
-- Run this in Supabase SQL Editor AFTER creating the bucket "recipe-images".
-- These policies allow authenticated users to upload/read their own images under: <user_id>/*

-- IMPORTANT:
-- In Supabase SQL Editor, run this as an admin role (usually `postgres`).
-- If you see: "must be owner of table objects", switch the SQL Editor role to `postgres`
-- (top bar dropdown) and re-run.

-- Note: RLS on storage.objects is enabled by default in Supabase projects.

-- SELECT (read): we return public URLs, so allow public reads for this bucket.
-- If you prefer private images + signed URLs, remove this policy and keep only "read own".
drop policy if exists "Public read recipe images" on storage.objects;
create policy "Public read recipe images"
on storage.objects
for select
to public
using (bucket_id = 'recipe-images');

-- INSERT (upload) own files
drop policy if exists "Upload own recipe images" on storage.objects;
create policy "Upload own recipe images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and name is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE (overwrite) own files (used by upsert)
drop policy if exists "Update own recipe images" on storage.objects;
create policy "Update own recipe images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'recipe-images'
  and name is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'recipe-images'
  and name is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE own files (optional)
drop policy if exists "Delete own recipe images" on storage.objects;
create policy "Delete own recipe images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and name is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
