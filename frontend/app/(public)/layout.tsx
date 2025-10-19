'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 tablet:px-6 desktop:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                datanooblol
              </Link>
            </div>
            <div className="flex items-center">
              <div className="hidden lg:flex space-x-8">
                <Link href="/" className="text-gray-700 hover:text-black">
                  Home
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-black">
                  Blog
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-black">
                  About
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-black">
                  Contact
                </Link>
              </div>
              <button 
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-sm">
          <div className="px-4 py-2 space-y-2">
            <Link href="/" className="block py-2 text-gray-700 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/blog" className="block py-2 text-gray-700 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/about" className="block py-2 text-gray-700 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/contact" className="block py-2 text-gray-700 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 tablet:px-6 desktop:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 datanooblol. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}