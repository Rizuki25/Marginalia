-- Marginalia · Tahap 1 MVP, bagian sampul buku
-- Bucket publik untuk gambar sampul. Berkas disimpan di folder
-- <user_id>/... sehingga policy bisa memakai auth.uid() tanpa join.

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "book covers are readable" on storage.objects;
create policy "book covers are readable" on storage.objects
  for select to public
  using (bucket_id = 'book-covers');

drop policy if exists "book covers insert own folder" on storage.objects;
create policy "book covers insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "book covers update own folder" on storage.objects;
create policy "book covers update own folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "book covers delete own folder" on storage.objects;
create policy "book covers delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
