'use client'

import { ReactNode } from 'react'
import { cn } from '@/utilitas/cn'

interface HeroSectionProps {
  title: string
  subtitle?: string
  description?: string
  children?: ReactNode
  backgroundImage?: string
  className?: string
}

export function HeroSection({
  title,
  subtitle,
  description,
  children,
  backgroundImage,
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative min-h-screen flex items-center justify-center px-8 py-24',
        className
      )}
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
        {subtitle && (
          <p className="text-caption uppercase tracking-widest text-neutral-400 font-semibold">
            {subtitle}
          </p>
        )}

        <h1 className="text-display-lg md:text-display-xl text-high-contrast leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-body-lg text-neutral-400 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {children && <div className="pt-4">{children}</div>}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-neutral-500"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}
