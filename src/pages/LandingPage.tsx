import React from 'react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { Footer } from '../components/Footer'

export function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 -z-10 opacity-60 gradient-animate" />
      <Header />
      <Hero />
      <HowItWorks />
      <Footer />
    </main>
  )
}
