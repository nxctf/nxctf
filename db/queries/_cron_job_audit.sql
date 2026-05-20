delete from auth.audit_log_entries
where created_at < now() - interval '60 days';

-- buat cron job untuk menjalankan query di atas setiap bulan sekali
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-audit-logs',
  '0 3 1 * *', -- tiap tanggal 1 jam 3 pagi
  $$ delete from auth.audit_log_entries
     where created_at < now() - interval '60 days'; $$
);
