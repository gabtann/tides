// Akses localStorage yang tidak pernah melempar: storage bisa diblokir, penuh, atau berisi data lama.
export function loadJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage tidak tersedia: state tetap hidup di memori.
  }
}
