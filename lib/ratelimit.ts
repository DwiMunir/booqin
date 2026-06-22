// Rate limit per-IP IN-MEMORY (sliding window). Benar HANYA untuk SINGLE-instance — tiap proses
// punya memori sendiri. Saat scale ke multi-instance/replika, ganti ke store terdistribusi (Redis).
// Interface `allowRequest` sengaja async agar swap ke Redis nanti drop-in (tak ubah pemanggil).

const WINDOW_MS = 10 * 60 * 1000 // 10 menit
const LIMIT = 3 // submit per IP per window
const MAX_KEYS = 10_000 // batas IP yang dilacak (guard OOM saat flooding)
const SWEEP_EVERY_MS = 60_000

const hits = new Map<string, number[]>()
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return
  lastSweep = now
  for (const [ip, times] of hits) {
    const fresh = times.filter((t) => now - t < WINDOW_MS)
    if (fresh.length === 0) hits.delete(ip)
    else hits.set(ip, fresh)
  }
}

// true = boleh lanjut.
export async function allowRequest(ip: string): Promise<boolean> {
  const now = Date.now()
  sweep(now)

  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= LIMIT) {
    hits.set(ip, recent)
    return false
  }
  // Saat flooding banyak-IP melebihi batas, berhenti menambah key baru (cegah OOM) — degradasi aman.
  if (hits.size >= MAX_KEYS && !hits.has(ip)) return true

  recent.push(now)
  hits.set(ip, recent)
  return true
}
