-- Anulează 0010. Golește bucketul înainte de ștergere.
delete from storage.objects where bucket_id = 'marci';
delete from storage.buckets where id = 'marci';
update brands set logo_url = null where logo_url like '%/marci/%';
