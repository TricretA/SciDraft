import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
 

const headlines = [
  'Struggling to explain what your results even mean? Get it done here',
  'Stuck staring at a blank lab report? Draft it here...'
]

export function Hero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % headlines.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="hero" className="relative isolate pt-24 sm:pt-28 lg:pt-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[-10%] h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,0.35), transparent)' }}
          animate={{ y: [0, 20, -10, 0], opacity: [0.8, 1, 0.9, 0.8] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-[10%] bottom-[-6%] h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.25), transparent)' }}
          animate={{ x: [0, 10, -10, 0], opacity: [0.7, 0.9, 0.8, 0.7] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[5%] top-[10%] h-[22rem] w-[22rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.25), transparent)' }}
          animate={{ y: [0, -15, 10, 0], opacity: [0.7, 0.9, 0.8, 0.7] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white"
            >
              {headlines[index]}
            </motion.h1>
          </AnimatePresence>
          <p className="mt-4 text-base sm:text-lg text-white/80">
            Smart, structured drafts from your manual and results — fast and accurate.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href="/new-report"
              className="rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] transition"
            >
              Create Report
            </a>
            <a
              href="/templates"
              className="rounded-md border border-white/20 bg-white/5 px-5 py-3 text-sm sm:text-base font-semibold text-white hover:bg-white/10 active:scale-[0.98] transition"
            >
              Manual Templates
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
