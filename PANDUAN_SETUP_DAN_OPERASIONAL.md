# Panduan Setup, Instalasi & Operasional Aplikasi Absensi Wisuda
Aplikasi Absensi Wisuda Real-Time (Express + React + Vite + SSE)

---

## 📋 DAFTAR ISI
1. [Kebutuhan Sistem (System Requirements)](#1-kebutuhan-sistem-system-requirements)
2. [Arsitektur & Topologi Jaringan](#2-arsitektur--topologi-jaringan)
3. [Langkah-Langkah Instalasi di Ubuntu Server 24.04](#3-langkah-langkah-instalasi-di-ubuntu-server-24-04)
4. [Konfigurasi Cloudflare Tunnel](#4-konfigurasi-cloudflare-tunnel)
5. [Panduan Operasional Penggunaan Aplikasi](#5-panduan-operasional-penggunaan-aplikasi)
6. [Pemecahan Masalah (Troubleshooting)](#6-pemecahan-masalah-troubleshooting)

---

## 1. Kebutuhan Sistem (System Requirements)

### Spesifikasi Virtual Machine (VM) Proxmox
* **Sistem Operasi**: Ubuntu Server 24.04 LTS (Minimal / Standard)
* **CPU**: Minimal 1 vCPU (Direkomendasikan 2 vCPU untuk handling multi-connection SSE)
* **RAM**: Minimal 1 GB (Direkomendasikan 2 GB)
* **Penyimpanan**: 10 GB Disk Space (SSD/NVMe sangat direkomendasikan)
* **IP Address**: Static LAN IP (Contoh: `10.10.10.17`)

### Prasyarat Perangkat Lunak (Software Stack)
* **Node.js**: Versi v20 LTS ke atas (untuk support ESM native dan efisiensi memori)
* **NPM**: Bawaan dari Node.js
* **PM2**: Node.js Process Manager (untuk menjaga aplikasi tetap berjalan di background)
* **Cloudflared**: Daemon Cloudflare Tunnel untuk expose lokal server ke publik secara aman

---

## 2. Arsitektur & Topologi Jaringan

```text
[ Internet / Browser Pengguna ]
             │
             ▼
┌──────────────────────────────┐
│  absensiwisuda.integ.ac.id   │  <-- Domain di Cloudflare DNS
└────────────┬─────────────────┘
             │ (Amunisi HTTPS / SSL otomatis via Cloudflare)
             ▼
┌──────────────────────────────┐
│      Cloudflare Edge         │
└────────────┬─────────────────┘
             │ (Enkripsi Tunnel Secure)
             ▼
┌──────────────────────────────┐
│      Cloudflare Tunnel       │  <-- Konektor terinstall di Proxmox / VM
└────────────┬─────────────────┘
             │ (Rute Lokal)
             ▼
┌──────────────────────────────┐
│      Ubuntu Server VM        │  <-- IP: 10.10.10.17
│   (Port 3000 - PM2 Service)  │
└──────────────────────────────┘
```

Kelebihan topologi ini:
* **Tanpa Port Forwarding**: Anda tidak perlu membuka port modem/router ke publik.
* **SSL Otomatis**: Domain `absensiwisuda.integ.ac.id` otomatis mendapatkan sertifikat HTTPS gratis dari Cloudflare.
* **Keamanan Maksimal**: IP publik asli server Anda (`10.10.10.17`) tersembunyi di balik proxy Cloudflare.

---

## 3. Langkah-Langkah Instalasi di Ubuntu Server 24.04

Login ke VM Ubuntu Server Anda via SSH, kemudian jalankan langkah-langkah di bawah ini:

### Langkah 3.1: Update dan Upgrade Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### Langkah 3.2: Install Git & Build Tools
```bash
sudo apt install git build-essential curl -y
```

### Langkah 3.3: Install Node.js v20 menggunakan NVM (Node Version Manager)
Gunakan NVM agar instalasi Node.js bersih dan mudah di-manage:
```bash
# Unduh & install script NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Aktifkan NVM di sesi terminal saat ini
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js versi 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verifikasi instalasi (pastikan muncul versi v20.x.x)
node -v
npm -v
```

### Langkah 3.4: Salin / Clone Source Code Aplikasi
Masuk ke direktori web root `/var/www/` (atau direktori home Anda):
```bash
sudo mkdir -p /var/www/absensi-wisuda
sudo chown -R $USER:$USER /var/www/absensi-wisuda
cd /var/www/absensi-wisuda

# Tarik project Anda dari repositori Git, atau salin semua file ke folder ini.
# Pastikan file-file seperti package.json, server.ts, src/, dll. berada di sini.
```

### Langkah 3.5: Install Dependencies & Build Aplikasi
```bash
# Masuk ke direktori proyek
cd /var/www/absensi-wisuda

# Install semua library npm
npm install

# Build aplikasi React & server CJS menggunakan esbuild
npm run build
```
*Catatan: Proses build akan menghasilkan file client-side di folder `/dist` dan file executable backend di `/dist/server.cjs`.*

### Langkah 3.6: Konfigurasi dan Jalankan PM2 (Process Manager)
PM2 bertugas menjaga aplikasi agar otomatis hidup jika terjadi crash atau jika server Ubuntu restart.
```bash
# Install PM2 secara global
npm install -g pm2

# Jalankan server menggunakan PM2
pm2 start dist/server.cjs --name "absensi-wisuda"

# Simpan konfigurasi PM2 agar startup otomatis saat boot
pm2 save

# Daftarkan PM2 ke systemd startup Ubuntu
pm2 startup
```
*Gunakan perintah yang dihasilkan oleh `pm2 startup` di layar terminal Anda (biasanya dimulai dengan `sudo env PATH=... pm2 startup systemd -u ...`)*.

---

## 4. Konfigurasi Cloudflare Tunnel

Karena Cloudflare Connector Anda mengarah ke Proxmox, silakan konfigurasikan Tunnel Anda melalui dashboard **Cloudflare Zero Trust**:

### Langkah 4.1: Daftarkan Domain / Subdomain
1. Buka dashboard [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. Masuk ke menu **Networks** > **Tunnels**.
3. Pilih Tunnel yang aktif yang terhubung dengan Proxmox Anda.
4. Klik **Edit** pada Tunnel tersebut.
5. Pindah ke tab **Public Hostname**.
6. Klik **Add a public hostname**.

### Langkah 4.2: Masukkan Aturan Routing
Isi formulir dengan detail berikut:
* **Subdomain**: (Kosongkan jika menggunakan domain utama `absensiwisuda.integ.ac.id` langsung, atau isi `absensi` jika menggunakan subdomain `absensi.wisuda.integ.ac.id`)
* **Domain**: `absensiwisuda.integ.ac.id` (atau `wisuda.integ.ac.id` jika subdomain)
* **Path**: (Biarkan kosong)
* **Type**: `HTTP`
* **URL**: `10.10.10.17:3000` (Mengarah langsung ke VM Ubuntu Anda pada port aplikasi 3000)

Klik **Save hostname**. Cloudflare akan mengurus pembuatan DNS record dan instalasi SSL HTTPS secara instan! Sekarang Anda bisa mengakses aplikasi lewat `https://absensiwisuda.integ.ac.id`.

---

## 5. Panduan Operasional Penggunaan Aplikasi

Bagikan bagian ini kepada teman-teman panitia wisuda Anda yang bertindak sebagai operator lapangan.

Aplikasi ini memiliki 3 Tab Utama:

### A. Tab: MEJA PENERIMA TAMU (Operator Registrasi)
Tab ini digunakan oleh petugas di pintu masuk gedung untuk menandai kehadiran wisudawan.

1. **Pencarian Cepat**: Masukkan **NIM** atau **Nama** wisudawan di kolom pencarian.
2. **Filter Fakultas**: Wisudawan otomatis terbagi menjadi **Fakultas Informatika** (untuk Prodi Manajemen Informatika) dan **Fakultas Teknik** (untuk Prodi Teknik Komputer). Gunakan filter ini untuk mempermudah pencarian.
3. **Tandai Kehadiran**: Klik tombol **"Tandai Hadir"** berwarna hijau.
   * Status akan langsung berubah menjadi **"HADIR"** dengan stampel waktu (WIB/WIT sesuai server).
   * Data kehadiran akan langsung terkirim secara instan (real-time) tanpa perlu refresh halaman ke proyektor AV melalui protokol **Server-Sent Events (SSE)**.
4. **Batal Hadir**: Jika ada kesalahan input, klik tombol merah **"Batalkan Kehadiran"** untuk mengembalikan status wisudawan ke belum hadir.

### B. Tab: PROYEKSI AV (Tampilan Panggung / Proyektor)
Tab ini didesain khusus untuk ditampilkan di layar proyektor utama di dalam aula wisuda.

1. **Denah Tempat Duduk Interaktif (Seating Map)**:
   * Menampilkan representasi tata letak kursi wisudawan secara dinamis.
   * **Warna Abu-abu**: Kursi masih kosong (wisudawan belum check-in).
   * **Warna Hijau Menyala**: Wisudawan sudah hadir di dalam aula.
2. **Pop-up Sambutan Selamat Datang (Welcome Screen Overlay)**:
   * Ketika operator di Meja Penerima Tamu mengeklik **"Tandai Hadir"**, dalam waktu kurang dari **0.1 detik** layar proyektor akan memunculkan Pop-up sambutan selamat datang raksasa yang mewah.
   * Pop-up ini memuat: **Nama Lengkap**, **NIM**, **Fakultas & Prodi**, **Judul Tugas Akhir**, serta **Foto Wisudawan**.
   * **Fitur Auto-Dismiss**: Pop-up akan tertutup secara otomatis setelah **2 detik** agar tidak mengganggu antrean berikutnya.
   * **Tombol Close Manual**: Jika ingin menutup pop-up lebih cepat secara manual, operator proyektor bisa mengeklik ikon silang (`X`) di pojok kanan atas pop-up atau mengeklik di area luar pop-up.
3. **Running Ticker Kehadiran Terbaru (Live Feed)**:
   * Di bagian bawah layar proyektor, terdapat running text/ticker horizontal yang secara dinamis memperlihatkan daftar wisudawan terakhir yang baru saja memasuki ruangan.

### C. Tab: GOOGLE SHEETS SYNC (Sinkronisasi Data)
Tab ini digunakan oleh Tim Administrator/PDDIKTI untuk mengimpor data awal dan mengekspor hasil absensi.

1. **Import Data Awal**:
   * Salin URL spreadsheet Google Sheets Anda yang berisi daftar wisudawan (pastikan spreadsheet diset ke "Anyone with link can view").
   * Tempel URL ke kolom yang disediakan, lalu klik **"Tarik & Sinkronkan Data"**.
   * Sistem akan otomatis membaca kolom: NO, NPM, NAMA GELAR, FAKULTAS, PRODI, IPK, TOTAL SKS, Ayah, Ibu, Judul, Pembimbing, Foto, dan No WA.
   * Sistem akan mengelompokkan mahasiswa secara cerdas ke dalam **Fakultas Informatika** dan **Fakultas Teknik** secara otomatis sesuai prodi mereka.
2. **Export Kehadiran**:
   * Setelah acara wisuda selesai, administrator dapat mengunduh seluruh data absensi lengkap dengan status kehadiran dan waktu check-in dalam format Excel/CSV yang siap dilaporkan ke pimpinan universitas.

---

## 6. Pemecahan Masalah (Troubleshooting)

### Q: Aplikasi tidak bisa diakses lewat domain `absensiwisuda.integ.ac.id`?
1. Pastikan status Cloudflare Tunnel Anda di dashboard Zero Trust berstatus **Active / Healthy**.
2. Pastikan service PM2 berjalan di VM Ubuntu Anda dengan perintah: `pm2 status`. Jika mati, jalankan: `pm2 restart absensi-wisuda`.
3. Periksa koneksi lokal di dalam jaringan Proxmox dari Tunnel Connector ke IP `10.10.10.17`.

### Q: Bagaimana cara melihat log/error server secara langsung?
Jalankan perintah ini di terminal Ubuntu Server Anda:
```bash
pm2 logs absensi-wisuda
```

### Q: Bagaimana cara merestart aplikasi jika ada perubahan data manual?
```bash
pm2 restart absensi-wisuda
```

---
*Selamat bertugas, semoga acara Wisuda berjalan dengan lancar dan sukses mulia!*
