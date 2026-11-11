# NXCTF - Self-Hosted Supabase & Vagrant VM Environment

Panduan menjalankan dan mengelola backend Supabase Self-Hosted serta Next.js dev server di dalam VM Vagrant.

---

## 1. Arsitektur & Informasi Akses

| Komponen | Host & Port | Keterangan |
| :--- | :--- | :--- |
| **NXCTF Frontend (Next.js)** | `http://192.168.56.101:3000` | Berjalan di VM dengan dev mode |
| **Supabase Studio (Dashboard)** | `http://192.168.56.101:8088` | Basic Auth: `supabase` / `<DASHBOARD_PASSWORD di backend/supabase/.env>` |
| **Supabase REST API** | `http://192.168.56.101:8088/rest/v1/` | PostgREST Gateway |
| **Supabase Auth API** | `http://192.168.56.101:8088/auth/v1/` | GoTrue Auth Gateway |
| **PostgreSQL Database** | `192.168.56.101:5432` | User: `postgres`, Pass: di `backend/supabase/.env` |

> Port API Gateway menggunakan port `8088` karena port `8000` di dalam VM sudah digunakan oleh daemon `nxctl`.

---

## 2. Script Otomasi Backend

Semua script berada di folder `backend/`:

### A. Setup Pertama Kali & Inisialisasi Database (`setup.sh`)
Script ini akan:
1. Memeriksa file `.env` di `backend/supabase/.env` dan mengisi cryptographic keys (JWT, Anon, Service Role, dll).
2. Menjalankan Docker Compose stack Supabase di latar belakang (`docker compose up -d`).
3. Menunggu database PostgreSQL siap (`pg_isready`).
4. Menginjeksi skema database dari `db/init.sql`.
5. Memperbarui file root `.env.local` dengan publishable key dan Supabase URL lokal.

```bash
# Jalankan di dalam VM Vagrant:
bash backend/setup.sh
```

### B. Menerapkan Update Query (`update-db.sh`)
Jika Anda memiliki query baru di `db/update_queries.sql` dan ingin menerapkannya **tanpa menghapus data yang sudah ada**:

```bash
bash backend/update-db.sh
```

### C. Seed Data Percobaan (`seed-test.sh`)
Untuk memasukkan sampel data tantangan dan event dari `db/seed/test_challenges.sql`:

```bash
bash backend/seed-test.sh
```

### D. Membuat User / Admin Baru via CLI (`create-user.sh`)
Tanpa perlu mengubah permission/file SQL di `db/`, Anda bisa langsung membuat akun Admin atau Player lewat CLI:

```bash
# Buat akun Admin:
bash backend/create-user.sh admin admin@nxctf.local Admin123! --admin

# Buat akun Player biasa:
bash backend/create-user.sh player1 player1@nxctf.local Player123!
```

---

## 3. Menjalankan Frontend Development Mode di VM

Untuk performa optimal di dalam VM (menghindari bottleneck VirtualBox shared folder `vboxsf` dan error `ETXTBSY`), jalankan script `start-dev.sh` yang otomatis me-mount `/tmp/nxctf-next-dev` (ext4 native) ke `.next-dev`:

```bash
# Menjalankan dev server di dalam VM Vagrant:
cd ~/nxctf-v1
bash backend/start-dev.sh
```

Untuk mematikan dev server (dan opsional mematikan container Supabase):
```bash
# Matikan Next.js dev server saja (+ unmount .next-dev & node_modules):
bash backend/stop-dev.sh

# Matikan Next.js dev server SEKALIGUS seluruh container Supabase:
bash backend/stop-dev.sh --all
```

---

## 4. Perintah Berguna Lainnya

### Menghentikan & Menyalakan Ulang Backend Supabase:
```bash
cd ~/nxctf-v1/backend/supabase
docker compose stop      # Menghentikan sementara
docker compose start     # Menyalakan kembali
docker compose down      # Mematikan container
docker compose up -d     # Menyalakan container di background
docker compose ps        # Memeriksa status kesehatan container
```

### Akses PostgreSQL Langsung via CLI:
```bash
docker exec -it supabase-db psql -U postgres -d postgres
```

