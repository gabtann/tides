import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

const VARIANT_CLASS: Record<Variant, string> = {
  // Satu-satunya "momen berani" (StyleDesign §5): glow lembut yang menguat saat hover/focus.
  primary:
    'bg-brand text-white shadow-[0_0_24px_-8px_rgba(126,20,255,0.6)] transition-shadow hover:shadow-[0_0_32px_-4px_rgba(126,20,255,0.8)] focus-visible:shadow-[0_0_32px_-4px_rgba(126,20,255,0.8)] motion-reduce:transition-none disabled:bg-line disabled:text-muted disabled:shadow-none',
  secondary: 'border border-link text-link hover:underline hover:underline-offset-4 disabled:opacity-50 disabled:no-underline',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`rounded-[10px] px-4 py-2 font-medium disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  )
}
