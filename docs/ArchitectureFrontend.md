# TIDES — Frontend Architecture

## 1. Tech Stack

React 18 dengan TypeScript, dibangun pakai Vite untuk setup cepat yang cocok dengan waktu terbatas hackathon. Styling pakai Tailwind CSS supaya iterasi tampilan cepat tanpa menulis banyak file CSS terpisah. Routing pakai React Router. State management cukup React Context ditambah useReducer, tidak perlu library eksternal seperti Redux atau Zustand untuk scope MVP ini.

## 2. Struktur Folder

```
frontend/
  src/
    screens/
      Watchlist/
        WatchlistScreen.tsx
      ResearchQueue/
        ResearchQueueScreen.tsx
      SignalDetail/
        SignalDetailScreen.tsx
      Investigation/
        InvestigationScreen.tsx (versi minimal, polish penuh Hari 4)
      ChallengeSignal/
        ChallengeSignalScreen.tsx (stub)
      EvidenceBrief/
        EvidenceBriefScreen.tsx (stub)
    components/
      PriorityBadge.tsx
      EvidenceStrengthIndicator.tsx (belum dibuat, Hari 5)
      SignalCard.tsx
      BackLink.tsx
      Card.tsx
      Button.tsx
      LoadingState.tsx
      ErrorState.tsx
      StubScreen.tsx
    types/
      ticker.ts
      priority.ts
      watchlist.ts
      signal.ts
      investigation.ts
      challenge.ts
      evidenceBrief.ts
    services/
      tidesApi.ts
      mockTidesApi.ts
      httpTidesApi.ts
      index.ts
    hooks/
      useWatchlist.ts
      useScan.ts
      useInvestigation.ts
      useChallenge.ts (belum dibuat, Hari 5)
    context/
      AppStateContext.tsx
      stateContext.ts
      appReducer.ts
      persistence.ts
    utils/
      storage.ts
      ticker.ts
      queue.ts
      companyNames.ts
      relativeTime.ts
      session.ts (belum dibuat, menunggu keputusan proxy/direct)
    App.tsx
    main.tsx
  public/
  .env.example
  package.json
  tsconfig.json
```

Catatan: daftar ini disusun ulang dari laporan dan screenshot yang sudah dikirim, bukan dari akses langsung ke filesystem kamu, jadi mungkin masih ada file kecil yang tidak persis. Kalau ada yang meleset, itu bukan keputusan yang perlu diikuti, koreksi saja langsung, kamu yang punya kebenaran atas isi folder sebenarnya, bukan dokumen ini.  

## 3. Kontrak Tipe Data

Bagian ini paling penting untuk memudahkan integrasi dengan backend nanti. Semua komponen dan hooks bergantung ke tipe-tipe ini, bukan ke bentuk data mentah dari Sectors.

```typescript
// types/ticker.ts
export type Ticker = string; // contoh: "BBRI"

// types/priority.ts
export type ResearchPriority = "HIGH" | "MEDIUM" | "LOW";
export type EvidenceStrength = "STRONG" | "MODERATE" | "WEAK";

// types/watchlist.ts
export interface WatchlistItem {
  ticker: Ticker;
  addedAt: string; // ISO date
}

// types/signal.ts
export interface Signal {
  ticker: Ticker;
  priority: ResearchPriority;
  reason: string; // ringkasan singkat, contoh: "Unusual price-volume movement"
  detectedAt: string;
}

export interface ScanResult {
  scannedAt: string;
  signals: Signal[];
}

// types/investigation.ts
export interface ContextBlock {
  label: string;
  summary: string;
  dataPoints: Record<string, string | number>;
}

export interface InvestigationResult {
  ticker: Ticker;
  whatChanged: ContextBlock;
  historicalContext: ContextBlock;
  peerContext: ContextBlock;
  fundamentalContext: ContextBlock;
}

// types/challenge.ts
export interface ChallengeResult {
  ticker: Ticker;
  initialSignal: string;
  challengeFinding: string; // contoh: "Peer stocks also showed similar movement."
  signalStrength: EvidenceStrength;
  brief: EvidenceBrief; // evidence brief digabung di sini, bukan endpoint terpisah
}

// types/evidenceBrief.ts
export interface EvidenceBrief {
  ticker: Ticker;
  observed: string;
  compared: string;
  interpreted: string;
  unknown: string;
  evidenceStrength: EvidenceStrength;
  researchPriority: ResearchPriority;
  generatedAt: string;
}
```

## 4. Lapisan Servis

Definisikan sebagai interface dulu, supaya komponen tidak pernah bergantung langsung ke implementasi tertentu.

```typescript
// services/tidesApi.ts
export interface TidesApi {
  getWatchlist(): Promise<WatchlistItem[]>;
  addTicker(ticker: Ticker): Promise<void>;
  removeTicker(ticker: Ticker): Promise<void>;
  scanWatchlist(): Promise<ScanResult>;
  investigate(ticker: Ticker): Promise<InvestigationResult>;
  challenge(ticker: Ticker): Promise<ChallengeResult>;
}
```

Catatan perubahan: `getEvidenceBrief` sengaja tidak ada, evidence brief ikut di dalam `ChallengeResult.brief` (lihat bagian 3), supaya backend tidak perlu memproses ulang seluruh konteks kalau Evidence screen dibuka langsung. `scanWatchlist` tidak menerima argumen ticker karena watchlist disimpan di backend (Supabase), backend sudah tahu isi watchlist dari identitas sesi, tidak perlu dikirim ulang dari frontend tiap scan.

Dua implementasi disediakan dari file terpisah:

`mockTidesApi.ts`, data dummy statis dengan delay artifisial (misal 500ms sampai 1.5 detik) supaya loading state kelihatan realistis saat dites, dipakai dari hari pertama sebelum backend siap. Watchlist di versi mock disimpan di localStorage dengan key `tides.mock.watchlist`, key terpisah dari sistem lama supaya jelas ini detail simulasi mock, bukan bagian dari kontrak asli. Ini penting supaya watchlist tidak hilang tiap refresh atau saat demo device dipakai, meski watchlist "sungguhan" sumber kebenarannya tetap di backend. Key lama `tides.watchlist` sudah tidak dipakai sama sekali.

`httpTidesApi.ts`, dibuat nanti oleh tim, melakukan fetch ke `VITE_API_BASE_URL`. File ini juga tempat menaruh mapping kalau nama field dari Sectors atau backend berbeda dari nama field di atas, jadi komponen tidak perlu tahu bentuk data mentahnya. File ini juga yang melampirkan token sesi (lihat bagian 5) ke tiap request, misalnya lewat header `Authorization`.

Dua jenis error dipisah secara sengaja. Error format ticker dan duplikat itu validasi di sisi frontend, pesannya ditentukan frontend sendiri. Error dari backend (misal ticker ditolak karena tidak dikenal Sectors) diteruskan apa adanya lewat `error.message` dari Promise yang di-reject, bukan digeneralisir jadi pesan frontend yang sama dengan validasi format, karena dua sumber error itu beda sifat, satu soal bentuk input, satu soal isi input yang cuma backend yang tahu benar salahnya.

Update watchlist bersifat pesimis. Input ticker, tombol Add, tombol Remove, dan tombol Scan nonaktif selama request terkait masih berjalan, mencegah race condition seperti scan jalan dengan watchlist yang belum ter-update.

Pemilihan implementasi mana yang aktif cukup lewat satu titik konfigurasi (context provider atau factory function), bukan tersebar di banyak komponen.

## 5. State Management dan Sesi

Watchlist bukan lagi sumber kebenaran di frontend. `api.getWatchlist()` dipanggil SEKALI di level `AppStateProvider` (bukan di tiap kali `useWatchlist` dipakai), lalu `api.addTicker` atau `api.removeTicker` dipanggil tiap user beraksi, backend (Supabase) yang jadi sumber kebenaran. Context/reducer tetap dipakai, tapi cuma sebagai cache tampilan supaya UI responsif tanpa fetch ulang tiap render atau tiap pindah layar, bukan lagi tempat penyimpanan utama, dan `tides.watchlist` di localStorage tidak lagi dipakai.

State watchlist mengikuti bentuk yang sama seperti state scan, `{ status: idle|loading|success|error, items: WatchlistItem[], error? }`, supaya kedua bagian state konsisten polanya. Layar Watchlist dan Research Queue dua-duanya punya tombol Retry kalau watchlist gagal dimuat. Filter di Research Queue baru berjalan kalau `watchlist.status === 'success'`, supaya layar tidak sempat kelihatan "tidak ada perubahan" secara keliru selagi watchlist masih dimuat.

Satu `AppStateProvider` membungkus seluruh aplikasi, menyimpan watchlist (hasil `getWatchlist`) dan hasil scan supaya konsisten antar layar. Contoh, kalau user berpindah dari Investigation kembali ke Research Queue, data tidak perlu di-scan ulang.

Hasil Investigation, Challenge, dan Evidence Brief per ticker juga disimpan di context, disimpan dengan key nama ticker, supaya kalau user membuka ticker yang sama lagi tidak perlu fetch ulang. Ini juga selaras dengan kebutuhan memory antar run di sisi backend, frontend cukup menampilkan apa yang backend kirim tanpa perlu logika memory sendiri.

Karena watchlist kini per identitas, aplikasi butuh sesi minimal walau tanpa login penuh. `utils/session.ts` menyimpan token sesi anonim di localStorage (key `tides.session`), dibuat sekali di kunjungan pertama, dipakai ulang di kunjungan berikutnya. Bagaimana persisnya token ini didapat (lewat Supabase anonymous auth langsung dari frontend, atau backend yang proxy dan cuma mengembalikan token ke frontend) masih menunggu konfirmasi tim, rekomendasi saat ini backend yang proxy, supaya frontend tidak perlu dependency Supabase sama sekali dan cukup kenal `TidesApi`. `httpTidesApi.ts` melampirkan token ini ke tiap request begitu ada.

Hasil scan (`tides.scan` di localStorage) tetap dipertahankan seperti sebelumnya, ini cache per device untuk kenyamanan (menghindari layar kosong saat refresh), berbeda urusan dari watchlist yang sekarang sumber kebenarannya di backend.

## 6. Routing

React Router dengan path berikut:

- `/` untuk Watchlist
- `/queue` untuk Research Queue
- `/signal/:ticker` untuk Signal Detail (baru)
- `/investigate/:ticker` untuk Investigation
- `/challenge/:ticker` untuk Challenge Signal
- `/evidence/:ticker` untuk Evidence Brief

Perubahan perilaku dari sebelumnya: kartu di `SignalCard`/Research Queue sekarang mengarah ke `/signal/:ticker`, BUKAN langsung ke `/investigate/:ticker` seperti implementasi yang sudah ada. Ini butuh perubahan kecil di komponen `SignalCard` yang sudah dibangun, satu baris path tujuan link, bukan perubahan struktur.

`/signal/:ticker` cuma baca `Signal` yang sudah ada di context (hasil scan tersimpan), tidak memanggil API apa pun. Kalau context kosong untuk ticker itu (misal user refresh langsung di URL ini tanpa lewat Queue), tampilkan ajakan balik ke Research Queue, bukan coba fetch atau nampilkan spinner kosong. Tombol "Investigate" di layar ini yang baru memanggil `investigate(ticker)` dan pindah ke `/investigate/:ticker`.

## 7. Pola Loading dan Error

Komponen `LoadingState` dan `ErrorState` dipakai konsisten di semua layar. Khusus Investigation, karena empat context block berasal dari sumber data terpisah dan bisa selesai di waktu berbeda, tiap block punya loading state sendiri, bukan satu spinner besar untuk seluruh layar.

## 8. Konfigurasi Environment

```
# .env.example
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=true
```

Selama backend belum siap, `VITE_USE_MOCK=true` membuat aplikasi jalan penuh dengan `mockTidesApi`. Begitu backend siap, tinggal ganti jadi `false` dan isi `VITE_API_BASE_URL` yang benar.

## 8.1 Dua Utilitas Tampilan Baru (Research Queue)

Dua hal ini murni frontend, tidak butuh perubahan kontrak `TidesApi` atau kerjaan tim lain:

`utils/companyNames.ts`, tabel statis pemetaan ticker ke nama perusahaan (misal `BBRI` ke `Bank Rakyat Indonesia`), dibundel di frontend, bukan dari API. Dipakai buat tampilkan nama perusahaan di kartu sinyal Research Queue. Boleh cuma isi ticker yang sudah dikenal dulu (yang sama dengan daftar di `mockTidesApi`), ticker lain fallback tampilkan ticker-nya saja tanpa nama.

`utils/relativeTime.ts`, fungsi murni yang mengubah `Signal.detectedAt` (ISO string yang sudah ada di tipe data) jadi teks relatif ("12m ago", "2h ago"). Tidak perlu field baru di tipe data, ini murni format tampilan dari data yang sudah dikirim backend.

## 8.2 Item Terbuka: Detail Sinyal Teknis (TRG)

ada permintaan tampilkan detail teknis spesifik per sinyal (contoh: "Block trade anomaly, 2.4x baseline"), semacam ringkasan singkat dari perhitungan Signal Detection Engine. Ini BUKAN cuma soal styling, `Signal` di kontrak kita sekarang cuma punya `reason` sebagai teks bebas, tidak ada field terstruktur buat metrik semacam itu. Kalau ini mau diadakan, perlu didiskusikan dulu ke Agent/AI Lead dan Sectors/Data Lead, karena artinya Signal Detection Engine perlu expose angka pemicunya, bukan cuma kesimpulan tekstualnya. Belum ditambahkan ke tipe data sampai ada keputusan itu.

## 8.3 Item Terbuka: Kontrak `challenge()`, Butuh Konfirmasi Backend/AI Lead sebelum Hari 5

`challenge(ticker)` saat ini cuma terima ticker, tidak terima hasil investigasi. Itu berarti backend harus mengingat hasil `investigate()` sebelumnya (state tambahan di sesi) atau menghitung ulang konteksnya sendiri dari nol, dua-duanya beban ekstra yang sebenarnya bisa dihindari.

Rekomendasi (belum final, perlu konfirmasi Backend/AI Lead): ubah kontrak jadi

```typescript
challenge(ticker: Ticker, investigation: InvestigationResult): Promise<ChallengeResult>
```

Frontend sudah menyimpan `InvestigationResult` lengkap per ticker di context begitu `investigate()` selesai, jadi tinggal dikirim ulang sebagai argumen, backend tidak perlu simpan state sesi tambahan atau hitung ulang historis/peer/fundamental yang sudah pernah dihitung.

Konsekuensi ke perilaku frontend kalau rekomendasi ini dipakai:
- Membuka `/challenge/:ticker` langsung (misal setelah refresh) TIDAK BISA auto-start seperti Investigation, karena screen ini butuh `InvestigationResult` yang mungkin tidak ada di context. Fallback-nya mengarahkan ke `/investigate/:ticker` ("Run investigation for {ticker} first"), bukan cuma kembali ke Queue.
- `/evidence/:ticker` ikut berjenjang: ada `ChallengeResult` di context → tampilkan; tidak ada tapi `InvestigationResult` ada → arahkan ke Challenge; dua-duanya tidak ada → arahkan ke Signal Detail/Queue.

Kalau Backend/AI Lead pilih arah sebaliknya (backend yang menyimpan state investigasi per sesi), maka `challenge(ticker)` tetap seperti sekarang dan `/challenge/:ticker` boleh auto-start persis seperti Investigation. Keputusan ini menentukan, jadi jangan diimplementasikan sampai ada jawaban, cuma dicatat di sini sebagai proposal yang siap dibawa ke diskusi.

## 9. Catatan Integrasi ke Backend

Begitu Data dan Backend Lead sudah punya skema respons asli dari Sectors, langkah yang perlu dilakukan cuma menyesuaikan isi `httpTidesApi.ts` supaya hasil fetch dipetakan ke tipe-tipe di bagian 3. Kalau nama field API asli berbeda dari nama field di sini, taruh proses pemetaannya di file yang sama, bukan di komponen. Dengan begitu, layar dan komponen tidak perlu berubah sama sekali saat backend berpindah dari mock ke data asli.

Satu hal spesifik yang perlu dikonfirmasi Backend/Data Lead sebelum `httpTidesApi.ts` ditulis penuh: bentuk token sesi (nama header, format, cara mendapat token pertama kali) dan apakah watchlist endpoint butuh header itu di semua request atau cuma sebagian. Sebelum konfirmasi itu datang, `mockTidesApi.ts` tidak terpengaruh sama sekali, jadi tidak menahan pekerjaan hari-hari awal.