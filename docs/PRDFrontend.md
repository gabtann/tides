# TIDES — Frontend Product Requirements Document

## 1. Ringkasan Produk

TIDES (Track 1, AI Agents & Assistants, Sectors 2026 Hackathon) adalah AI research agent yang memindai watchlist saham Indonesia menggunakan data Sectors, mendeteksi perubahan yang layak diperiksa, melakukan investigasi multi-step (historis, peer, fundamental), menguji ulang sinyal tersebut, lalu menyajikan evidence brief berbasis bukti.

Prinsip inti: investigator, bukan predictor. TIDES tidak memprediksi harga dan tidak memberi rekomendasi beli/jual. TIDES membantu manusia menentukan apa yang layak diteliti lebih lanjut, keputusan akhir tetap di tangan user.

Dokumen ini fokus ke scope frontend. Logika agent, signal detection engine, dan integrasi Sectors API didokumentasikan terpisah oleh tim Agent/AI Lead dan Sectors/Data Lead.

## 2. Masalah yang Diselesaikan

Investor atau analis harus memantau banyak saham sekaligus dan membandingkan tiap saham dengan histori serta peer sektornya untuk tahu perubahan mana yang penting. Proses ini repetitif dan makan waktu kalau dilakukan manual satu per satu. TIDES mengotomatisasi bagian deteksi dan triage itu, lalu menyerahkan interpretasi akhir ke manusia.

## 3. Target User

Investor ritel atau analis pemula yang memegang watchlist saham Indonesia (kira-kira 5 sampai 20 ticker), butuh cara cepat tahu saham mana yang berubah signifikan tanpa mengecek satu per satu secara manual.

## 4. Alur Inti Produk

```
WATCHLIST -> SCAN -> DETECT -> TRIAGE -> INVESTIGATE -> CHALLENGE -> EVIDENCE BRIEF -> keputusan manusia
```

Alur riset di atas itu alur agent/backend, dibagikan bareng seluruh tim (lihat workflow.md), tidak berubah. Di sisi frontend, ada satu langkah tambahan yang murni UI, Signal Detail, dipasang di antara Research Queue dan Investigation. Ini bukan langkah riset baru, cuma layar preview ringan dari data yang sudah ada di tangan (hasil scan), supaya proses investigate multi-step yang agak lama (sekitar 10-30 detik) tidak langsung terpanggil tiap kali kartu di Queue diklik, user lihat ringkasannya dulu, baru pilih lanjut atau tidak.

Alur ini dipetakan ke enam layar frontend, dijelaskan satu per satu di bagian 5.

## 5. Spesifikasi Layar

### Screen 1, Watchlist

Tujuan: kelola daftar ticker yang mau dipantau.

Elemen: judul "My Watchlist", daftar ticker (tiap item punya tombol hapus), tombol "+ Add Stock" untuk menambah ticker baru, tombol utama "Scan Watchlist".

State: kosong (belum ada ticker, ajak user tambah dulu, tombol Scan nonaktif), loading saat scan berjalan, error kalau scan gagal karena masalah jaringan atau API.

Interaksi: tambah ticker lewat input teks sederhana, hapus ticker dari daftar, klik Scan Watchlist berpindah ke Screen 2 dalam state loading dulu.

### Screen 2, Research Queue

Tujuan: tampilkan hasil scan terurut berdasarkan prioritas riset.

Elemen: daftar kartu per ticker, dikelompokkan atau diberi label HIGH, MEDIUM, LOW, tiap kartu menampilkan nama ticker dan alasan singkat (contoh: "Unusual price-volume movement").

Catatan wajib tampil di layar, bukan cuma di dokumen internal: "HIGH = prioritas penelitian, bukan rekomendasi investasi."

State: kosong (tidak ada sinyal signifikan, tampilkan pesan netral bukan alarm), loading, error.

Interaksi: klik kartu membawa user ke Screen 3, Signal Detail, untuk ticker yang dipilih.

### Screen 3, Signal Detail (baru)

Tujuan: preview ringan satu sinyal sebelum user commit ke investigasi penuh. Tidak memanggil `investigate()`, cuma menampilkan ulang data yang sudah ada di context dari hasil scan, jadi tampil instan tanpa loading.

Elemen: ticker, nama perusahaan, badge prioritas, teks alasan (`reason`), waktu relatif terdeteksi, elemen yang sama persis dengan isi `SignalCard` di Research Queue, cuma versi layar penuh, bukan kartu. Tombol utama "Investigate" di bawahnya.

State: karena tidak ada fetch, cuma satu state normal. Kalau user entah bagaimana sampai ke layar ini tanpa data (contoh, refresh langsung di URL ini tanpa lewat Queue dulu), tampilkan ajakan balik ke Research Queue, jangan spinner kosong.

Interaksi: klik "Investigate" baru memanggil `investigate(ticker)` dan membawa user ke Screen 4, Investigation, dalam state loading. Ada juga link kembali ke Research Queue.

### Screen 4, Investigation

Tujuan: tampilkan detail investigasi satu ticker.

Elemen: nama ticker, empat blok data: "What changed?", "Historical context", "Peer context", "Fundamental context".

State: karena tiap blok kemungkinan berasal dari tool call terpisah dan bisa selesai di waktu berbeda, sebaiknya tiap blok punya loading state sendiri, bukan satu spinner besar untuk seluruh layar.

Interaksi: tombol lanjut membawa user ke Screen 5, Challenge Signal.

### Screen 5, Challenge Signal

Tujuan: tampilkan hasil pengujian ulang terhadap sinyal awal, apakah pergerakan itu memang spesifik ke saham ini atau ikut pola peer yang lebih luas.

Elemen: "Initial Signal" (ringkasan temuan awal), "TIDES Challenge" (hasil pengecekan ke konteks lebih luas), "Signal strength" (Strong, Moderate, Weak).

State: loading saat proses challenge berjalan.

Interaksi: tombol "View Evidence" membawa user ke Screen 6.

### Screen 6, Evidence Brief

Tujuan: laporan akhir, siap dibaca dan dijadikan dasar riset lanjutan user sendiri.

Elemen: empat bagian terstruktur, OBSERVED (fakta angka mentah), COMPARED (histori dan peer), INTERPRETED (narasi penjelasan dari agent), UNKNOWN (apa yang tidak bisa disimpulkan dari data yang ada), ditutup dengan Evidence Strength dan Research Priority.

Interaksi: tombol kembali ke watchlist atau investigasi ticker lain.

## 6. Di Luar Scope (Non-goals)

Tidak dibangun sama sekali: rekomendasi beli atau jual, prediksi harga, automated trading, portfolio optimizer, chatbot finance umum, news scraper, real-time push notification (MVP cukup on-demand scan), chart kompleks dengan banyak indikator.

## 7. Definition of Done, Slice Frontend

Enam layar berfungsi dengan data mock, alur navigasi Watchlist ke Research Queue ke Signal Detail ke Investigation ke Challenge ke Evidence Brief lengkap dan bisa dijalankan end-to-end, responsive dasar sampai ukuran mobile, siap tukar dari data mock ke data backend asli tanpa refactor besar karena kontrak tipe data sudah disepakati (lihat Architecture.md).

## 8. Asumsi dan Pertanyaan Terbuka

Asumsi: API backend berbentuk REST atau JSON async. Endpoint scan mengembalikan daftar sinyal dengan prioritas. Endpoint investigate per ticker mengembalikan empat context block. Evidence brief bukan endpoint terpisah, dia digabung ke response endpoint challenge, supaya backend tidak memproses ulang seluruh konteks saat Evidence screen dibuka langsung.

Keputusan (diperbarui): watchlist disimpan di backend memakai Supabase, bukan di frontend. Frontend memanggil watchlist lewat TidesApi (lihat Architecture.md bagian 4), Context/reducer di frontend cuma jadi cache tampilan, bukan sumber kebenaran.

Karena watchlist disimpan per user, backend perlu identitas minimal walau tanpa login penuh. Rencana saat ini: sesi anonim (misal lewat Supabase anonymous auth), token sesi disimpan di localStorage sisi frontend dan dikirim di tiap request. Detail siapa yang bicara langsung ke Supabase (frontend langsung, atau backend sebagai proxy) masih menunggu konfirmasi tim, rekomendasi saat ini backend yang proxy supaya frontend tidak perlu dependency Supabase sama sekali.

Pengecualian: khusus untuk kebutuhan juri me-review submission dari browser mereka sendiri (kemungkinan tanpa sesi aktif), ada snapshot statis hasil satu run asli yang dibundel di aplikasi, dipakai kalau tidak ada data sesi yang bisa diambil. Ini render path terpisah, tidak memengaruhi alur watchlist normal.