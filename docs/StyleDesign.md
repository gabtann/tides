# TIDES — Style & Design System

Diperbarui: palet dan tipografi diganti total mengikuti warna logo (gradient ungu ke biru), menggantikan arah "dossier kertas" versi sebelumnya. Prinsip konten (nada investigatif, tenang, tanpa hype) dari PRD.md tetap berlaku, itu prinsip produk, bukan pilihan visual, jadi tidak ikut berubah.

## 1. Arah Desain

TIDES sekarang tampil sebagai produk AI modern, gelap, dengan satu aksen gradient khas (ungu ke biru, dari logo) yang dipakai sengaja di tempat terbatas, bukan disebar ke semua elemen. Tetap tenang secara konten (data dulu, interpretasi belakangan), tapi secara visual lebih hidup dan kontemporer dibanding arah sebelumnya.

## 2. Warna

Token dasar:

- Latar utama (`base`): `#15121D`, charcoal gelap dengan corak ungu tipis, bukan hitam pekat, sengaja diturunkan dari warna logo supaya nyambung, bukan hitam generik.
- Permukaan kartu (`surface`): `#211C2E`, sedikit lebih terang dari base, dipakai untuk kartu dan panel. Beda kecerahannya tipis (dekat 1:1), jadi kartu tetap butuh border tipis di bawah supaya kelihatan sebagai lapisan terpisah, bukan cuma warna.
- Garis pembatas (`border`): `#3A3350`, dipakai untuk border kartu dan pembatas antar section.
- Teks utama (`text-primary`): `#EDE6FF`, warna lavender terang yang sama persis dengan warna glow di logo, jadi teks dan mark terasa satu keluarga warna. Kontras ke base 15.3:1, jauh di atas syarat AA.
- Teks sekunder (`text-muted`): `#9F97B8`, dipakai untuk teks pendukung dan metadata. Kontras ke base 6.7:1, aman.

Brand gradient, dipakai sangat terbatas:

- `linear-gradient(135deg, #7E14FF, #47BFFF)`, dari violet ke biru muda, persis dari file logo.
- Dipakai HANYA sebagai gambar statis: logo/wordmark di header (favicon.svg dan variannya). TIDAK dipakai sebagai latar tombol atau teks mana pun. Alasannya konkret, bukan cuma gaya, teks putih di atas ujung biru gradient (`#47BFFF`) cuma dapat kontras 2.07:1, jauh di bawah syarat AA 4.5:1, jadi tombol dengan latar gradient dan teks putih itu genuinely gagal aksesibilitas di sebagian areanya, bukan cuma soal selera.
- Tombol aksi utama (contoh "Scan Watchlist") pakai warna solid `#7E14FF` (ujung gelap gradient), bukan gradient penuh. Teks putih di atasnya dapat kontras 6.12:1, aman.
- Warna solid `#47BFFF` (ujung biru gradient) dipakai sendirian untuk link, focus ring, dan elemen interaktif sekunder yang tidak perlu warna kuat. Kontras ke base 8.95:1.

Warna semantik prioritas riset, sengaja tetap keluarga warna hangat (rust, ochre, sage), supaya kontras jelas dari warna dingin (ungu-biru) yang dipakai branding. Ini penting, bukan kebetulan, badge prioritas tidak boleh ketuker sama elemen branding kalau warnanya beda keluarga:

- HIGH: `#CC5C42` (coral-rust)
- MEDIUM: `#D69A3C` (amber)
- LOW: `#6FA374` (sage)

Ketiganya dipakai sebagai fill badge penuh (pill/chip), bukan teks warna di atas latar gelap, teks di dalam badge pakai warna `base` (`#15121D`) sebagai teks gelap di atas fill terang, kontrasnya 4.1-7.5:1 tergantung warnanya, semua lolos AA. Dipakai juga sebagai border kiri tipis di kartu sinyal, kontras terhadap `surface` di atas 3.6:1, cukup buat elemen dekoratif/non-teks.

## 3. Tipografi

Dua keluarga huruf:

- Judul dan heading, termasuk wordmark: Space Grotesk, grotesk geometris modern, sengaja bukan Inter supaya tidak terasa generik, dan cukup beda karakter dari font body.
- Body, label, dan data: IBM Plex Sans, dipertahankan dari versi sebelumnya, karena sudah punya varian tabular figures yang dipakai buat angka dan kode ticker.

Skala tipe: judul layar 28px/34px, subjudul section 18px/24px, body 15px/22px, label kecil 13px/18px. Line length body di bawah 80 karakter.

Hindari huruf kapital semua untuk label umum, hindari eyebrow label di atas heading, hindari tanda panah di akhir tombol atau link. Pengecualian kapital cuma untuk teks tetap di badge prioritas (HIGH/MEDIUM/LOW) dan disclaimer wajib.

## 4. Layout

Satu kolom, mobile-first, lebar konten maksimum tetap sekitar 640px bahkan di desktop, prinsip ini independen dari tema warna, murni soal kegunaan di HP.

Radius dibuat berjenjang, bukan satu radius rata dipakai ke semua elemen (itu ciri khas tampilan SaaS generik yang mau dihindari):

- Kartu dan panel: radius 12px
- Tombol: radius 10px
- Badge/chip prioritas: radius penuh (pill, 999px)

Kartu tidak pakai drop shadow standar, tapi border tipis 1px warna `border` di sekelilingnya untuk memisahkan dari latar, karena beda kecerahan base-surface sendiri terlalu tipis untuk dikenali tanpa border.

## 5. Gerak (Motion) dan Momen Glow

Restraint tetap berlaku, animasi cuma dipakai saat state berubah nyata. Satu pengecualian yang sengaja ditambahkan: tombol aksi utama (misal "Scan Watchlist") boleh punya glow lembut redup di sekelilingnya (box-shadow blur warna `#7E14FF`, bukan fill tombolnya), yang sedikit menguat saat hover/focus. Glow ini dekoratif di luar tombol, bukan warna latar tombol itu sendiri, jadi tidak menyentuh soal kontras teks. Ini "satu momen berani" yang diizinkan, sesuai prinsip habiskan keberanian visual di satu tempat, bukan disebar. Elemen lain tetap tenang, tanpa hover flourish atau efek berulang di banyak kartu. Hormati preferensi reduced motion sistem operasi.

## 6. Komponen

Watchlist item: baris dengan nama ticker (IBM Plex Sans tabular) dan tombol hapus kecil di kanan.

Priority badge: chip pill terisi penuh warna semantik (bagian 2), teks warna base di dalamnya, plus bentuk kecil berbeda per level (persegi HIGH, lingkaran MEDIUM, segitiga LOW) supaya tidak cuma mengandalkan warna.

Evidence Strength indicator: bentuk kecil (isi penuh, separuh, garis luar saja) untuk Strong/Moderate/Weak, sama seperti sebelumnya, independen dari perubahan warna.

Tombol utama: fill solid `#7E14FF` (bukan gradient, lihat bagian 2 soal alasan kontras), teks putih, radius 10px, glow lembut (bagian 5).

Tombol sekunder/link: warna solid `#47BFFF`, tanpa fill latar, underline cuma saat hover.

Section header (Observed/Compared/Interpreted/Unknown, dan lainnya): label dengan garis kiri warna sesuai konteksnya, tanpa ikon dekoratif.

Section header grup sinyal (High priority/Medium priority/Low priority di Research Queue): titik kecil 8px warna semantik, judul sentence case, badge jumlah item di sebelahnya (contoh "2 items", huruf kecil biasa, bukan kapital). Tidak ada label status tambahan di sisi kanan (semacam "urgent"), itu bertentangan dengan nada tenang dan non-alarmis yang sudah ditetapkan di PRD.

Kartu sinyal (Research Queue): panel `surface` dengan border kiri warna prioritas (bagian 2), seluruh kartu adalah satu elemen `<Link>` yang bisa diklik, bukan sekadar dekorasi. Isinya, dari atas ke bawah:
- Baris atas: ticker tebal (IBM Plex Sans tabular) diikuti nama perusahaan dalam teks muted lebih kecil di baris yang sama, dengan badge prioritas rata kanan.
- Baris tengah: teks alasan (`reason`), warna teks utama.
- Baris bawah: waktu relatif sejak terdeteksi (misal "12m ago") di kiri, warna muted redup, dan satu glyph chevron kecil (`›`) di kanan sebagai isyarat visual bahwa kartu bisa diklik. Chevron ini murni dekoratif (`aria-hidden`), BUKAN elemen link terpisah, karena kartunya sendiri sudah jadi satu link utuh, menaruh link kedua di dalamnya akan jadi link bersarang yang tidak valid dan membingungkan pembaca layar.

Tidak ada teks CTA terpisah macam "Inspect Dossier" atau tanda panah menempel ke teks, itu berulang dari, dan melanggar, larangan panah di ujung link/tombol yang sudah ada di bagian 3.

Loading state dan error state: pesan spesifik dan actionable, bukan spinner generik.

## 7. Suara dan Konten

Prinsip ini tidak berubah dari versi sebelumnya, karena ini soal produk, bukan tema visual:

Tombol pakai kata kerja aktif dan spesifik ("Scan Watchlist"), bukan bahasa jualan.

Nama aksi konsisten sepanjang alur (tombol "Investigate" menuju layar "Investigation").

Pesan error menjelaskan apa yang terjadi dan langkah berikutnya, ditulis dalam suara sistem, bukan permintaan maaf generik.

Layar kosong adalah ajakan bertindak, bukan ruang hampa.

## 8. Aksesibilitas dan Responsif

Kontras warna minimum AA untuk semua teks, dihitung dan diverifikasi untuk tiap kombinasi di bagian 2 (bukan diperkirakan). Desain mobile-first. Semua elemen interaktif punya focus ring terlihat jelas memakai warna `#47BFFF`.