# Backend Development Plan — Progress & Open Items

## Status

### Milestone 0-1: Server Skeleton + Watchlist CRUD
- [x] Server Express jalan, struktur folder sesuai architecture.md
- [x] Watchlist CRUD (GET/POST/DELETE) — sudah dites lengkap di Postman
- [x] Error handling (validation, duplicate, not found) — sudah dites

### Milestone 2-3: Sectors Integration + Signal Engine
- [x] sectors.client.js — auth header dikonfirmasi Data Lead (raw key, no Bearer)
- [x] sectors-normalizer.service.js — normalisasi overview, daily history, peers
- [x] signal-engine.service.js — detector price movement, volume spike, 90-day deviation aktif
- [ ] detectPeerDivergence — sengaja dinonaktifkan, lihat Open Items
- [x] scan.service.js — orkestrasi scan seluruh watchlist
- [ ] Testing end-to-end /api/scan dengan API key asli

## Open Items

### Signal Threshold
Threshold (price change 5%, volume 2x, dst) masih nilai default sementara dari backend dev,
BELUM divalidasi dengan data historis. Perlu didiskusikan dengan Research/Signal Engine
team sebelum dipakai untuk demo/keputusan riil.

### Peer Divergence
Dinonaktifkan sementara karena data peer (yearly_mcap_chg) dan data symbol utama
(daily_price_change) tidak sepadan satuan waktunya. Mengaktifkan perlu tambahan
Daily API call per peer — perlu didiskusikan dampak rate limit sebelum implementasi.

### Rate Limit
Belum ada batas pasti dari Sectors (dikonfirmasi Data Lead). Perlu diawasi kalau
/scan dipanggil untuk watchlist besar.

## Belum Dikerjakan
- AI Agent integration (Milestone 4) — sengaja belum disentuh sesuai scope task ini