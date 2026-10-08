export function HeroSection() {
  return (
    <section aria-label="Introduction" className="w-full py-3 text-center sm:py-5">
      <div
        role="img"
        aria-label="TIDES"
        className="hero-glow mx-auto flex w-full flex-col items-center gap-2"
      >
        <img
          src="/logo-tides.png"
          alt=""
          aria-hidden="true"
          className="h-36 w-auto sm:h-48"
        />

        <span
          aria-hidden="true"
          className="font-brand text-5xl leading-none font-bold tracking-tight text-[#D61F43] sm:text-6xl"
        >
          TIDES
        </span>
      </div>

      <p className="mx-auto mt-5 max-w-[60ch] text-fg">
        AI-Powered Intelligence for the Indonesian Stock Market.
      </p>

      <p className="mx-auto mt-1 max-w-[60ch] text-[13px] leading-[18px] text-muted">
        Investigates the data. Doesn&apos;t predict prices or give financial advice.
      </p>
      
    </section>
  )
}