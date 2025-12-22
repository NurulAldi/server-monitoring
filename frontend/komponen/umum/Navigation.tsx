'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilitas/cn'
import { Tombol } from './Tombol'

interface NavLink {
  href: string
  label: string
}

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin', label: 'Admin' },
  { href: '/autentikasi', label: 'Login' },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'glass-strong py-4'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-heading-md font-bold text-high-contrast transition-smooth hover:text-soft-white">
          Server Monitor
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-body font-medium transition-smooth',
                pathname === link.href
                  ? 'text-high-contrast'
                  : 'text-neutral-400 hover:text-high-contrast'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Tombol variant="primary" size="sm" className="hidden md:inline-flex">
          Get Started
        </Tombol>
      </div>
    </nav>
  )
}
