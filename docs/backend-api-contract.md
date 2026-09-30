# Backend API Contract — TIDES

> **Version:** CP2 (Checkpoint 2)
> **Last Updated:** 2026-09-30
> **Status:** SIAP dengan Catatan (Agent service belum aktif)
> **Base URL:** `http://localhost:4000/api`

---

## Daftar Isi

1. [Arsitektur dan Lapisan](#arsitektur-dan-lapisan)
2. [Autentikasi dan Rate Limit](#autentikasi-dan-rate-limit)
3. [Envelope Respons Standar](#envelope-respons-standar)
4. [Spesifikasi Endpoint](#spesifikasi-endpoint)
5. [Scan Output — Kontrak untuk Agent](#scan-output--kontrak-untuk-agent)
6. [Evidence Brief — Kontrak Respons Agent](#evidence-brief--kontrak-respons-agent)
7. [Error Contract](#error-contract)
8. [Catatan Implementasi dan Batasan Saat Ini](#catatan-implementasi-dan-batasan-saat-ini)

---

## Arsitektur dan Lapisan

```text
Frontend  -->  Backend (Express)  -->  Sectors API   (external)
                                  -->  Agent Service (external, opsional)
LapisanFile UtamaKeteranganRoutersrc/routes/index.jsMount di /api, apply requireApiKey globalControllerssrc/api/*.controller.jsInput -> Service -> JSON responseServicessrc/services/*.service.jsBusiness logic, tidak punya akses req/resIntegrationsrc/integration/*.client.jsHTTP client ke layanan eksternalMiddlewaresrc/middleware/auth, rate-limit, validation, error-handlerAutentikasi dan Rate LimitHeader AutentikasiBackend menggunakan requireApiKey middleware yang dipasang secara global setelah /health.
Semua endpoint (kecuali /health) memerlukan autentikasi.Cara mengirim API key (salah satu):Plaintextx-api-key: <your-key>
Authorization: Bearer <your-key>
Jika TIDES_API_KEY di .env dikosongkan: Server berjalan tanpa autentikasi
(dengan warning di console). Cocok untuk dev lokal.Error 401:JSON{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Missing API Key" } }
Rate LimitsEndpointLimitWindowPOST /scan10 reqper menit per IPSemua endpoint lainnya60 reqper menit per IPError 429:JSON{ "success": false, "error": { "code": "RATE_LIMITED", "message": "Too many requests" } }
Envelope Respons StandarSukses:JSON{
  "success": true,
  "data": { }
}
Error:JSON{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
Security Note: Pesan error dari SECTORS_* code dan HTTP 5xx di-mask menjadi"An error occurred while communicating with external services" untuk mencegahinformation disclosure. Detail penuh hanya tercetak di server console.Spesifikasi EndpointGET /api/healthHealth check server. Tidak memerlukan autentikasi.MethodGETAuthTidak perluRate LimitTidak adaResponse 200:JSON{ "success": true, "data": { "status": "ok" } }
GET /api/watchlistMendapatkan seluruh simbol yang ada di watchlist.MethodGETAuthrequireApiKeyRate Limit60 req/menitResponse 200:JSON{
  "success": true,
  "data": {
    "watchlist": [
      { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
    ]
  }
}
FieldTipeKeterangandata.watchlistWatchlistEntry[]Array bisa kosong jika belum ada entryWatchlistEntry.symbolstringTicker uppercase tanpa .JKWatchlistEntry.added_atstring (ISO 8601)Waktu penambahanPOST /api/watchlistMenambahkan satu simbol ke watchlist.MethodPOSTAuthrequireApiKeyRate Limit60 req/menitMiddlewarerequireFields(['symbol'])Content-Typeapplication/jsonRequest Body:JSON{ "symbol": "BBCA" }
FieldTipeValidasisymbolstringWajib. Format [A-Za-z0-9]{1,10} dengan opsional .JK/.jk suffix. Disimpan uppercase tanpa suffix.Response 201:JSON{
  "success": true,
  "data": { "symbol": "BBCA", "added_at": "2026-09-26T18:23:56.727Z" }
}
Error Codes:CodeHTTPKondisiVALIDATION_ERROR400Field symbol tidak ada, bukan string, atau format tidak validDUPLICATE_ENTRY400Simbol sudah ada di watchlistLIMIT_REACHED400Watchlist sudah mencapai 50 simbolDELETE /api/watchlist/:symbolMenghapus satu simbol dari watchlist.MethodDELETEAuthrequireApiKeyRate Limit60 req/menitPath Parameter:ParameterKeterangan:symbolMenerima format dengan atau tanpa suffix .JK/.jk. Contoh: BBCA, BBCA.JK, bbca.jk — semua valid dan menghapus BBCA.Response 200:JSON{
  "success": true,
  "data": { "removed": "BBCA" }
}
PENTING: Field yang dikembalikan adalah removed (bukan deleted).Error Codes:CodeHTTPKondisiVALIDATION_ERROR400Format ticker tidak valid (gagal normalizeTicker)NOT_FOUND404Simbol tidak ada di watchlistPOST /api/scanMenjalankan scan engine untuk seluruh simbol di watchlist.MethodPOSTAuthrequireApiKeyRate Limit10 req/menitRequest BodyTidak diperlukanResponse 200:JSON{
  "success": true,
  "data": {
    "scanned_at": "2026-09-26T18:23:57.209Z",
    "symbols_scanned": 2,
    "signals_detected": 3,
    "queue": [
      {
        "ticker": "BBCA",
        "signal": {
          "type": "PRICE_MOVEMENT",
          "priority": "HIGH",
          "description": "Price movement requires further investigation.",
          "details": {
            "direction": "UP",
            "magnitude": 6.2
          }
        },
        "currentContext": {
          "currentPrice": 8500,
          "dailyChange": 6.2,
          "latestDate": "2026-09-26",
          "sector": "Financials",
          "industry": "Banks"
        },
        "availableTools": ["getOverview", "getHistorical", "getPeers"]
      }
    ],
    "errors": [
      { "symbol": "BBRI", "message": "An error occurred while communicating with external services", "code": "SECTORS_TIMEOUT" }
    ]
  }
}
FieldKeteranganscanned_atISO timestamp waktu scan dimulaisymbols_scannedJumlah simbol di watchlist saat scansignals_detectedJumlah total signal terdeteksiqueueArray AgentSignal — input siap untuk Agent (lihat bagian 5)errorsPer-simbol errors; scan tetap dilanjutkan meski ada error parsialGET /api/signalsMengembalikan antrian signal dari hasil scan terakhir tanpa menjalankan scan baru.MethodGETAuthrequireApiKeyRate Limit60 req/menitResponse 200:JSON{
  "success": true,
  "data": {
    "signals": [
      {
        "ticker": "BBCA",
        "signal": {
          "type": "PRICE_MOVEMENT",
          "priority": "HIGH",
          "description": "Price movement requires further investigation.",
          "details": {
            "direction": "UP",
            "magnitude": 6.2
          }
        },
        "currentContext": {
          "currentPrice": 8500,
          "dailyChange": 6.2,
          "latestDate": "2026-09-26",
          "sector": "Financials",
          "industry": "Banks"
        },
        "availableTools": ["getOverview", "getHistorical", "getPeers"]
      }
    ]
  }
}
Mengembalikan signals: [] jika server baru dijalankan dan POST /scan belum dipanggil.Data bersifat in-memory — restart server mengosongkan cache scan.POST /api/agent/investigateMengirimkan signal ke AI Agent untuk investigasi mendalam dan mengembalikan Evidence Brief. Payload Agent ini dirakit menggunakan pola Adapter secara stateless dari controller.MethodPOSTAuthrequireApiKeyRate Limit60 req/menitTimeout Agent15 detikContent-Typeapplication/jsonPrasyaratAGENT_BASE_URL wajib diatur di .envRequest Body — Payload Minimal:JSON{ "ticker": "BBCA" }
Request Body — Payload Lengkap (deterministik, direkomendasikan):JSON{
  "ticker": "BBCA",
  "signal": {
    "type": "PRICE_MOVEMENT",
    "priority": "HIGH",
    "description": "Price movement requires further investigation.",
    "details": {
      "direction": "UP",
      "magnitude": 6.2
    }
  },
  "currentContext": {
    "currentPrice": 8500,
    "dailyChange": 6.2,
    "latestDate": "2026-09-26",
    "sector": "Financials",
    "industry": "Banks"
  },
  "availableTools": ["getOverview", "getHistorical", "getPeers"]
}
Auto-Enrichment Logic:
Jika payload hanya berisi ticker, controller melakukan live-fetch ke API Sectors untuk membentuk currentContext secara langsung (stateless).Response 200:JSON{
  "success": true,
  "data": {
    "ticker": "BBCA",
    "signal": "Price moved 6.2% in one day",
    "observed": ["BBCA rose 6.2% on 2026-09-26"],
    "compared": ["Sector peers rose 1.1% on average"],
    "interpreted": ["Movement appears specific to BBCA"],
    "unknown": ["Cause of volume spike not confirmed"],
    "evidenceStrength": "MODERATE",
    "researchPriority": "MEDIUM",
    "generatedAt": "2026-09-26T18:23:57.209Z",
    "limitation": null
  }
}
Error Codes:CodeHTTPKondisiVALIDATION_ERROR400Input tidak valid (body, ticker)AGENT_NOT_CONFIGURED500AGENT_BASE_URL kosong di .envAGENT_TIMEOUT504Request ke Agent melebihi 15 detikAGENT_REQUEST_FAILED502Agent merespons HTTP errorScan Output — Kontrak untuk AgentSetiap elemen di data.queue dari POST /scan (dan output adapter /agent/investigate) mematuhi kontrak tipe data berikut.Skema AgentSignalTypeScriptinterface AgentSignal {
  ticker: string;              // Uppercase, tanpa .JK
  signal: {
    type: 'PRICE_MOVEMENT' | 'VOLUME_MOVEMENT' | 'HISTORICAL_DEVIATION' | 'PEER_DIVERGENCE';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    details: {
      direction?: 'UP' | 'DOWN';  
      magnitude: number;          // Angka persentase murni, misal 6.2
    };
  };
  currentContext: {
    currentPrice: number;
    dailyChange: number;       // Angka persentase murni, misal 6.2
    latestDate: string;        // YYYY-MM-DD
    sector: string | null;
    industry: string | null;
  };
  availableTools: string[];    // Hanya ["getOverview", "getHistorical", "getPeers"]
}
Matriks Kelengkapan Field (Task 2)Field Dibutuhkan AgentStatusNama di payloadCatatantickerTERSEDIAtickerUppercase tanpa .JKsignal (tipe sinyal)TERSEDIAsignalObject bersarang berisi type, priority, description, dan details.currentContextTERSEDIAcurrentContextBerisi currentPrice, dailyChange, latestDate, sector, industryavailableToolsTERSEDIAavailableTools3 tools hardcoded berdasarkan kesepakatan MVPEvidence Brief — Kontrak Respons AgentbuildEvidenceBrief() di evidence.service.js menormalisasi output Agent menjadi EvidenceBrief.Skema EvidenceBriefTypeScriptinterface EvidenceBrief {
  ticker: string | null;
  signal: string | null;            // Deskripsi narasi sinyal dari Agent
  observed: string[];               // Fakta langsung dari data
  compared: string[];               // Perbandingan historis/peer
  interpreted: string[];            // Interpretasi yang didukung bukti
  unknown: string[];                // Hal yang tidak dapat dikonfirmasi
  evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK';  // Selalu UPPERCASE
  researchPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedAt: string;              // ISO 8601
  limitation: string | null;
}
Normalisasi dan FallbackFieldNormalisasiFallbackevidenceStrength.toUpperCase(), validasi ke enum'WEAK'researchPriority.toUpperCase(), validasi ke enumSTRONG->HIGH, MODERATE->MEDIUM, WEAK->LOWgeneratedAtPass-throughnew Date().toISOString()observed/compared/interpreted/unknownString tunggal dibungkus [string], undefined menjadi [][]limitationPass-throughnullError ContractTabel Pemetaan Error (Task 4)SkenarioHTTPerror.codePesan ke FrontendDitangani DiSectors unavailable (API mati/unreachable)502SECTORS_UNREACHABLEmaskedsectors.client.jsSectors rate-limited429SECTORS_RATE_LIMITEDmaskedsectors.client.jsSectors timeout (>8 detik)504SECTORS_TIMEOUTmaskedsectors.client.js + AbortControllerSectors auth failed502SECTORS_AUTH_FAILEDmaskedsectors.client.jsSectors server error 500502SECTORS_SERVER_ERRORmaskedsectors.client.jsAgent unavailable (AGENT_BASE_URL kosong)500AGENT_NOT_CONFIGUREDmaskedagent.client.jsAgent HTTP error (4xx/5xx dari Agent)502AGENT_REQUEST_FAILEDmaskedagent.client.jsAgent timeout (>15 detik)504AGENT_TIMEOUTmaskedagent.client.js + AbortControllerInput tidak valid (format, tipe)400VALIDATION_ERRORPesan spesifik (tidak di-mask)service layer, agent.controller.jsData tidak ditemukan404NOT_FOUND"Symbol 'X' not found"watchlist.service.jsDuplicate entry400DUPLICATE_ENTRY"Symbol 'X' already in watchlist"watchlist.service.jsWatchlist penuh400LIMIT_REACHED"Watchlist is full"watchlist.store.jsRate limit Backend429RATE_LIMITED"Too many requests"rate-limit.jsAutentikasi gagal401UNAUTHORIZED"Missing/Invalid API Key"auth.jsMasking Policyerror-handler.js secara otomatis me-mask pesan untuk:Error dengan code diawali SECTORS_Error dengan status >= 500 (termasuk semua error Agent)Detail penuh dicetak ke console.error di server.Catatan Implementasi dan Batasan Saat IniSiapSemua 6 endpoint sudah terdaftar dan dapat diakses.Auth dan rate-limit sudah terimplementasi di semua endpoint yang dilindungi.Error masking mencegah information disclosure ke client.normalizeTicker digunakan konsisten di add dan remove watchlist serta investigate controller.EvidenceBrief contract terdefinisi lengkap dengan normalisasi dan fallback.Auto-enrichment (Adapter) di controller memungkinkan Frontend memanggil investigate dengan payload minimal.Siap dengan CatatanGET /signals tidak ada Frontend consumer saat ini. Endpoint berjalan dengan benar
tapi Frontend belum mengimplementasi method-nya. Endpoint sudah terdokumentasi dan siap digunakan.Agent service belum aktif. POST /agent/investigate akan selalu return AGENT_NOT_CONFIGURED
sampai AGENT_BASE_URL diisi. Kontrak (request/response) sudah fully defined.Scan data bersifat in-memory. Restart server mengosongkan cache lastScanResult.detectPeerDivergence dinonaktifkan secara sengaja karena mismatch satuan waktu
(daily vs yearly). Ada TODO di signal-engine.service.js.Direkomendasikan (Bukan Blocker)Tambahkan next_scan_available_at di response POST /scan agar Frontend bisa
menghitung kapan scan berikutnya dapat dilakukan.Pertimbangkan HTTP 503 (bukan 500) untuk AGENT_NOT_CONFIGURED — semantik lebih tepat.