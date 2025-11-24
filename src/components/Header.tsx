import React from 'react'
 

export function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-black/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              aria-label="Go to home"
              href="/"
              className="flex items-center gap-2"
            >
              <img
                src="/SciDraft-symbol-logo.png"
                alt="SciDraft"
                className="h-8 w-8 sm:hidden"
              />
              <img
                src="/SciDraft-logo1-white.png"
                alt="SciDraft"
                className="hidden sm:block h-8"
              />
            </a>
            <a
              href="/templates"
              className="text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              Templates
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/new-report"
              className="rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] transition"
            >
              Create New Report
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
