import React from 'react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { Footer } from '../components/Footer'

export function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0b0b12] text-white">
      <Header />
      <Hero />
      <HowItWorks />
      <Footer />
    </main>
  )
}

