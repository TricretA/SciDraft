import React from 'react'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/70">© {new Date().getFullYear()} SciDraft. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/terms-of-service" className="text-white/80 hover:text-white">Terms</a>
            <a href="/privacy-policy" className="text-white/80 hover:text-white">Privacy Policy</a>
            <a href="/about" className="text-white/80 hover:text-white">About</a>
            <a href="/faqs" className="text-white/80 hover:text-white">FAQs</a>
            <a href="/contact" className="text-white/80 hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

