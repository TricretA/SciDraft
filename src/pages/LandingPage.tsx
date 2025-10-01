import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Zap, Users, Star, CheckCircle, Microscope, FlaskConical, TestTube, Fish, Ruler, PenTool, ExternalLink, BookOpenCheck, Info, Play, Handshake, Siren, CircleUser } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePageTitle, PAGE_TITLES } from '../hooks/usePageTitle'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function LandingPage() {
  usePageTitle(PAGE_TITLES.HOME)
  
  const [currentHeadline, setCurrentHeadline] = useState(0)
  const headlines = [
    "Struggling to explain what your results even mean?, Get it done here",
    "Stuck staring at a blank lab report? Draft it here...",
    "We help you Draft, you write it down..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#1a1a2e]/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              {/* Desktop Logo */}
              <img
                src="/SciDraft-logo1-white.png"
                alt="SciDraft" 
                className="hidden md:block h-20 w-15"
              />
              {/* Mobile Symbol Logo */}
              <img
                src="/SciDraft-symbol-logo.png"
                alt="SciDraft" 
                className="md:hidden h-10 w-10"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              {/* Desktop Navigation */}
              <a 
                href="https://prompt-2-json.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden md:block text-gray-300 hover:text-white transition-colors"
              >Other Services</a>
              <Link 
                to="/lab-report-guide" 
                className="hidden md:block text-gray-300 hover:text-white transition-colors"
              >Lab Report Guide</Link>
              <Link 
                to="/signup" 
                className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >Create Report</Link>
              
              {/* Mobile Navigation Icons */}
              <a 
                href="https://prompt-2-json.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="md:hidden text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Other Services"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <Link 
                to="/lab-report-guide" 
                className="md:hidden text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Lab Report Guide"
              >
                <BookOpenCheck className="h-5 w-5" />
              </Link>
              <Link 
                to="/signup" 
                className="md:hidden bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >Create</Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
        {/* Animated Scientific Icons Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-10 text-blue-400/20"
          >
            <Microscope className="h-12 w-12" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              rotate: [0, -360]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-40 right-20 text-purple-400/20"
          >
            <FlaskConical className="h-10 w-10" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, 120, 0],
              y: [0, -80, 0],
              rotate: [0, 180]
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-40 left-20 text-cyan-400/20"
          >
            <TestTube className="h-8 w-8" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, -60, 0],
              y: [0, 40, 0],
              rotate: [0, -180]
            }}
            transition={{ 
              duration: 22,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-40 text-green-400/20"
          >
            <Fish className="h-9 w-9" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, 90, 0],
              y: [0, -30, 0],
              rotate: [0, 270]
            }}
            transition={{ 
              duration: 16,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-60 left-40 text-orange-400/20"
          >
            <Ruler className="h-7 w-7" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, -70, 0],
              y: [0, 50, 0],
              rotate: [0, -270]
            }}
            transition={{ 
              duration: 24,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-80 right-60 text-pink-400/20"
          >
            <PenTool className="h-6 w-6" />
          </motion.div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1 
              key={currentHeadline}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 min-h-[200px] flex items-center justify-center"
            >
              {headlines[currentHeadline]}
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >Generate professional lab reports in minutes. Upload your manual, enter results, and let us help you create comprehensive reports drafts that meet academic standards.</motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link 
                to="/signup" 
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
              >
                Start Creating Reports
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/see-scidraft-in-action" 
                className="group bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
              >
                See SciDraft in Action
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-[#16213e] via-[#1a1a2e] to-[#0f0f23] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-full blur-xl"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose SciDraft?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Streamline your lab report creation with cutting-edge AI technology
            </p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div 
              variants={fadeInUp} 
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
              className="text-center p-8 bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-300">
                Generate comprehensive lab reports in under 5 minutes instead of hours
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp} 
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
              className="text-center p-8 bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional Quality</h3>
              <p className="text-gray-300">
                AI-generated reports that meet academic standards and formatting requirements
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp} 
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
              className="text-center p-8 bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl hover:border-green-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Student Focused</h3>
              <p className="text-gray-300">
                Designed specifically for Biology, Chemistry, and Physics lab reports
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              x: [0, 200, 0],
              y: [0, -100, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -150, 0],
              y: [0, 80, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-cyan-600/20 to-pink-600/20 rounded-full blur-3xl"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How SciDraft Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple 4-step process to create professional lab reports
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Subject & Unit', desc: 'Select your subject and unit from our comprehensive database' },
              { step: '2', title: 'Upload Lab Manual', desc: 'Upload your practical manual or choose from our templates' },
              { step: '3', title: 'Enter Results', desc: 'Input your experimental data and observations' },
              { step: '4', title: 'Generate Report', desc: 'Get your professional lab report instantly' }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              x: [0, 150, 0],
              y: [0, -80, 0],
              opacity: [0.1, 0.25, 0.1]
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -120, 0],
              y: [0, 60, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, 80, 0],
              y: [0, -40, 0],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Join thousands of researchers who trust SciDraft
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "PhD Student, Biology",
                content: "SciDraft transformed my research workflow. What used to take weeks now takes hours!"
              },
              {
                name: "Michael Chen",
                role: "Graduate Student, Chemistry",
                content: "The AI-powered analysis is incredibly accurate. It's like having a research assistant 24/7."
              },
              {
                name: "Dr. Emily Rodriguez",
                role: "Research Professor",
                content: "I recommend SciDraft to all my students. The quality of generated reports is exceptional."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeInOut"
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeInOut" }
                }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="text-gray-200 mb-4 leading-relaxed"
                >
                  "{testimonial.content}"
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.3 }}
                >
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Desktop Footer Links */}
            <ul className="hidden md:flex justify-center space-x-8 mb-8">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/lab-report-guide" className="text-gray-400 hover:text-white transition-colors">Lab Report Guide</a></li>
              <li><a href="/see-scidraft-in-action" className="text-gray-400 hover:text-white transition-colors">SciDraft in Action</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
            
            {/* Mobile Footer Icons */}
            <ul className="md:hidden flex justify-center space-x-6 mb-8">
              <li>
                <a 
                  href="/about" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="About"
                >
                  <Info className="h-6 w-6" />
                </a>
              </li>
              <li>
                <a 
                  href="/lab-report-guide" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="Lab Report Guide"
                >
                  <BookOpenCheck className="h-6 w-6" />
                </a>
              </li>
              <li>
                <a 
                  href="/see-scidraft-in-action" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="SciDraft in Action"
                >
                  <Play className="h-6 w-6" />
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="Terms of Service"
                >
                  <Handshake className="h-6 w-6" />
                </a>
              </li>
              <li>
                <a 
                  href="/privacy-policy" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="Privacy Policy"
                >
                  <Siren className="h-6 w-6" />
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  className="text-gray-400 hover:text-white transition-colors p-2 block"
                  aria-label="Contact"
                >
                  <CircleUser className="h-6 w-6" />
                </a>
              </li>
            </ul>
            
            <div className="border-t border-gray-800 pt-8">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-gray-400"
              >
                &copy; Built by Tricre8 - &nbsp;
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ 
                    duration: 2,
                    delay: 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <motion.span
                    animate={{
                      scale: [1, 1.05, 1],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="inline-block"
                  >
                    Think
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="mx-1"
                  >
                    |
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1, 1.05, 1],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
                    className="inline-block"
                  >
                    Create
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.8 }}
                    className="mx-1"
                  >
                    |
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1, 1.05, 1],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2
                    }}
                    className="inline-block"
                  >
                    Solve
                  </motion.span>
                </motion.span>
              </motion.p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}