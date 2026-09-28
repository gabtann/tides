import { useId } from 'react'

// Satu-satunya tempat brand gradient jadi elemen visual utama. StyleDesign §2 mengizinkan gradient di wordmark
// header dan hero, tapi hanya sebagai gambar statis, jadi wordmark dibuat SVG (role img), bukan teks HTML dengan
// background-clip. Tagline positioning + kalimat prinsip wajib berpasangan, lihat StyleDesign §7.
// Rata tengah hanya di dalam blok ini; sisa app tetap rata kiri. Lebarnya ikut <main> (max 640px).
export function HeroSection() {
  const gradientId = useId()

  return (
    <section aria-label="Introduction" className="w-full py-10 text-center sm:py-14">
      <svg role="img" aria-label="TIDES" viewBox="0 0 200 52" className="mx-auto h-12 w-auto">
        <defs>
          {/* x1,y1 -> x2,y2 kiri-atas ke kanan-bawah, setara linear-gradient(135deg, ...) */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7E14FF" />
            <stop offset="1" stopColor="#47BFFF" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="44"
          textLength="200"
          lengthAdjust="spacingAndGlyphs"
          fill={`url(#${gradientId})`}
          className="font-display text-[52px] font-bold"
        >
          TIDES
        </text>
      </svg>
      <p className="mx-auto mt-4 max-w-[60ch] text-fg">AI-Powered Intelligence for the Indonesian Stock Market.</p>
      <p className="mx-auto mt-2 max-w-[60ch] text-[13px] leading-[18px] text-muted">
        Investigates the data. Doesn&apos;t predict prices or give financial advice.
      </p>
    </section>
  )
}
