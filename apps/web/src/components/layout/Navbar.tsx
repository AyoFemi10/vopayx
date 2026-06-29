'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Wallet } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Product', href: '/product' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Developers', href: '/developers' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-bg-border">
      <div className="container-vp flex items-center justify-between h-20">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-white group-hover:text-accent-light transition-colors">VOPayX</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href ? 'text-white bg-bg-hover' : 'text-text-secondary hover:text-white hover:bg-bg-hover'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-semibold text-text-secondary hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button 
          className="md:hidden p-2 text-text-secondary hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-bg-secondary border-b border-bg-border p-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="p-3 rounded-xl text-base font-medium text-text-secondary hover:text-white hover:bg-bg-hover"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="divider my-2" />
          {user ? (
            <Link href="/dashboard" className="btn-primary w-full" onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/auth/login" className="btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
