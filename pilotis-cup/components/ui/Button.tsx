import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'rounded-[10px] px-5 py-3 text-sm font-bold transition-opacity disabled:opacity-50 cursor-pointer'

  const variants = {
    primary: 'bg-[#015484] text-white hover:opacity-90',
    secondary: 'bg-[#f68721] text-white hover:opacity-90',
    ghost: 'bg-transparent text-[#506a6e] hover:text-[#201b54]',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
