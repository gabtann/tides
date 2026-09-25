import { Link } from 'react-router'

// Link navigasi kecil di atas judul layar. Teks saja, tanpa glyph panah (StyleDesign §3).
export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="inline-block rounded text-[13px] leading-[18px] text-muted hover:text-fg hover:underline hover:underline-offset-4 focus-visible:text-fg"
    >
      {children}
    </Link>
  )
}
