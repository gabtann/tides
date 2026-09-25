import type { ReactNode } from 'react'

export function ErrorState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-line border-l-4 border-l-high bg-surface p-4 text-fg">
      <p>{message}</p>
      {children && <div className="mt-3 flex flex-wrap items-center gap-4">{children}</div>}
    </div>
  )
}
