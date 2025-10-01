import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  ExternalLink,
  X,
  Send,
  Bot,
  User,
  ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface ContactOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  contact: string
  action: string
  gradient: string
  shadowColor: string
}

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export function Contact() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const contactOptions: ContactOption[] = [
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with our expert team for immediate assistance',
      icon: Phone,
      contact: '+254 796 484 962',
      action: 'Call Now',
      gradient: 'from-cyan-400 via-blue-500 to-purple-600',
      shadowColor: 'shadow-cyan-500/25'
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us detailed inquiries and get comprehensive responses',
      icon: Mail,
      contact: 'tricre8team@gmail.com',
      action: 'Send Email',
      gradient: 'from-pink-400 via-red-500 to-orange-500',
      shadowColor: 'shadow-pink-500/25'
    },
    {
      id: 'chat',
      title: 'Chat with Assistant',
      description: 'Get instant help from our AI-powered support assistant',
      icon: MessageCircle,
      contact: 'AI Assistant Available 24/7',
      action: 'Start Chat',
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      shadowColor: 'shadow-green-500/25'
    }
  ]

  const socialLinks = [
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@bundlefasta',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      color: 'from-pink-500 to-red-500'
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/profile.php?id=61556508605305',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'from-blue-600 to-blue-700'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/bnk.001?igsh=YjdkYTE0c3I0oGs3',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const handleContactClick = (contactId: string) => {
    if (contactId === 'phone') {
      window.open('tel:+254796484962', '_self')
    } else if (contactId === 'email') {
      window.open('mailto:tricre8team@gmail.com', '_self')
    } else if (contactId === 'chat') {
      setSelectedContact(contactId)
    }
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Thank you for your message! Our team will get back to you shortly.',
        'I understand your inquiry. Let me connect you with the right specialist.',
        'That\'s a great question! I\'ll help you find the information you need.',
        'I\'m here to assist you. Could you provide more details about your request?'
      ]
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'bot',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100, window.innerHeight + 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent flex items-center">
                <MessageCircle className="h-10 w-10 text-cyan-400 mr-4" />
                Contact Us
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Connect with our team through the future of communication
              </p>
            </motion.div>
            <Link
              to="/"
              className="group inline-flex items-center px-6 py-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <motion.h2 
              className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Choose Your Connection
            </motion.h2>
            <motion.p 
              className="text-white/70 text-xl max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Experience next-generation support through our advanced communication channels
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {contactOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => handleContactClick(option.id)}
                >
                  <div className={`relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 h-full transition-all duration-500 group-hover:bg-white/20 group-hover:border-white/30 ${option.shadowColor} group-hover:shadow-2xl`}>
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-20 rounded-3xl transition-opacity duration-500`} />
                    
                    {/* Icon */}
                    <div className="relative z-10 mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-200 transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-white/70 mb-6 leading-relaxed">
                        {option.description}
                      </p>
                      
                      {/* Hidden Contact Details */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        whileHover={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 mb-4">
                          <p className="text-white/90 font-medium text-sm">
                            {option.contact}
                          </p>
                        </div>
                      </motion.div>

                      <button className={`w-full bg-gradient-to-r ${option.gradient} text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center group-hover:scale-105`}>
                        {option.action}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Social Media Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-8">
            Connect on Social Media
          </h3>
          <div className="flex justify-center space-x-6">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-16 h-16 bg-gradient-to-br ${social.color} rounded-2xl flex items-center justify-center text-2xl backdrop-blur-md border border-white/20 hover:shadow-2xl transition-all duration-300`}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {selectedContact === 'chat' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedContact(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl h-[600px] backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Assistant</h3>
                    <p className="text-white/70 text-sm">Online • Ready to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="w-10 h-10 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 h-[400px] overflow-y-auto space-y-4">
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start max-w-xs ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-blue-500 ml-2' : 'bg-green-500 mr-2'}`}>
                        {message.sender === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div className={`backdrop-blur-md border border-white/20 rounded-2xl p-3 ${message.sender === 'user' ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                        <p className="text-white text-sm">{message.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-white/20">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}