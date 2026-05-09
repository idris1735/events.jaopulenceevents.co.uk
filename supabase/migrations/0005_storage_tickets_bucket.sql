-- Create private tickets storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- Service role can upload PDFs (server-side only via admin client)
drop policy if exists "service role upload tickets" on storage.objects;
create policy "service role upload tickets"
on storage.objects
for insert
to service_role
with check (bucket_id = 'tickets');

-- Service role can read and generate signed URLs
drop policy if exists "service role read tickets" on storage.objects;
create policy "service role read tickets"
on storage.objects
for select
to service_role
using (bucket_id = 'tickets');

-- Service role can update (upsert on re-generation)
drop policy if exists "service role update tickets" on storage.objects;
create policy "service role update tickets"
on storage.objects
for update
to service_role
using (bucket_id = 'tickets');
