import { Link } from 'react-router'

// Sementara sampai layar ini dibangun (hari 3 sampai 5).
export function StubScreen({ title, ticker }: { title: string; ticker: string }) {
  return (
    <section>
      <h1 className="font-display text-[28px] leading-[34px] font-semibold">{title}</h1>
      <p className="mt-2 font-semibold tabular-nums">{ticker}</p>
      <p className="mt-4 text-muted">This screen is not built yet.</p>
      <Link to="/queue" className="mt-6 inline-block rounded text-link hover:underline hover:underline-offset-4">
        Back to research queue
      </Link>
    </section>
  )
}
