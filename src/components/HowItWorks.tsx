import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Beaker, Sparkles, Download } from 'lucide-react'

const steps = [
  {
    title: 'Select/Upload Manual',
    description: 'Choose a matching template or upload your official manual (PDF).',
    icon: BookOpen,
    gradient: 'from-blue-500 via-indigo-500 to-purple-600'
  },
  {
    title: 'Enter Results',
    description: 'Provide your experiment observations and measurements for structured analysis.',
    icon: Beaker,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600'
  },
  {
    title: 'Generate Report',
    description: 'Get a clean draft with sections aligned to your manual and results.',
    icon: Sparkles,
    gradient: 'from-violet-500 via-purple-500 to-indigo-600'
  },
  {
    title: 'Download',
    description: 'Download your draft instantly as a PDF — clean and ready.',
    icon: Download,
    gradient: 'from-blue-500 to-purple-600'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How It Works</h2>
          <p className="mt-3 text-white/80">Four simple steps to a structured lab report.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md"
            >
              <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r ${s.gradient} p-3 shadow-lg shadow-black/20`}>
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-white/80">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
