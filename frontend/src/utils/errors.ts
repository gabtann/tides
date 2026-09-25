// TidesApi me-reject dengan Error yang message-nya layak ditampilkan; fallback hanya kalau message kosong.
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
