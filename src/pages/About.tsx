import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { 
  Users, 
  Target, 
  Award, 
  Globe, 
  Heart, 
  Lightbulb, 
  Shield, 
  Zap, 
  BookOpen, 
  Microscope, 
  GraduationCap, 
  Star,
  ArrowRight,
  CheckCircle,
  Mail,
  Linkedin,
  Twitter,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface TeamMember {
  name: string
  role: string
  bio: string
  image: string
  linkedin?: string
  twitter?: string
  email?: string
}

interface Milestone {
  year: string
  title: string
  description: string
}

interface Value {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export function About() {
  const { scrollYProgress } = useScroll()
  const [activeSection, setActiveSection] = useState('')
  
  // Animated gradient background
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const gradientRotation = useTransform(scrollYProgress, [0, 1], [0, 360])
  
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'mission', 'stats', 'values', 'timeline', 'team']
      const scrollPosition = window.scrollY + 100
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const teamMembers: TeamMember[] = [
    {
      name: "Dr. Sarah Chen",
      role: "Founder & CEO",
      bio: "Former research scientist with 15+ years in academic publishing and lab report automation.",
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20asian%20woman%20scientist%20in%20lab%20coat%20smiling%20confidently&image_size=square",
      linkedin: "#",
      twitter: "#",
      email: "sarah@scidraft.com"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO",
      bio: "Full-stack developer and former educator passionate about making science accessible through technology.",
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20hispanic%20male%20software%20engineer%20wearing%20glasses&image_size=square",
      linkedin: "#",
      twitter: "#",
      email: "michael@scidraft.com"
    },
    {
      name: "Dr. Emily Watson",
      role: "Head of Product",
      bio: "Educational technology specialist with expertise in student learning outcomes and UX design.",
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20caucasian%20woman%20product%20manager%20in%20modern%20office&image_size=square",
      linkedin: "#",
      email: "emily@scidraft.com"
    },
    {
      name: "James Park",
      role: "Lead Developer",
      bio: "Expert in AI and machine learning with a focus on educational applications and automation.",
      image: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20asian%20male%20software%20developer%20in%20casual%20shirt&image_size=square",
      linkedin: "#",
      twitter: "#",
      email: "james@scidraft.com"
    }
  ]

  const milestones: Milestone[] = [
    {
      year: "2022",
      title: "The Idea",
      description: "Founded by frustrated science students who spent countless hours on repetitive lab reports."
    },
    {
      year: "2023",
      title: "First Prototype",
      description: "Launched beta version with basic report generation for chemistry and biology labs."
    },
    {
      year: "2024",
      title: "AI Integration",
      description: "Integrated advanced AI to provide intelligent suggestions and automated formatting."
    },
    {
      year: "2024",
      title: "Multi-University",
      description: "Expanded to serve students across 50+ universities with custom templates."
    }
  ]

  const values: Value[] = [
    {
      icon: BookOpen,
      title: "Education First",
      description: "We believe in empowering students to focus on learning, not formatting."
    },
    {
      icon: Shield,
      title: "Academic Integrity",
      description: "Our tools enhance learning while maintaining the highest standards of academic honesty."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously evolve our platform with cutting-edge technology and user feedback."
    },
    {
      icon: Heart,
      title: "Student Success",
      description: "Every feature is designed with student success and learning outcomes in mind."
    }
  ]

  const stats = [
    { number: "50,000+", label: "Students Served" },
    { number: "200+", label: "Universities" },
    { number: "1M+", label: "Reports Generated" },
    { number: "98%", label: "Satisfaction Rate" }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Dark Gradient Background */}
      <motion.div
        className="fixed inset-0 -z-10"
        style={{
          background: `conic-gradient(from ${gradientRotation}deg at 50% 50%, 
            #0f172a 0deg, #1e293b 60deg, #334155 120deg, #475569 180deg, 
            #1e293b 240deg, #0f172a 300deg, #0f172a 360deg)`,
          y: backgroundY
        }}
      />
      
      {/* Enhanced Glassmorphism Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm -z-10" />
      
      {/* Hero Section */}
      <motion.section 
        id="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-transparent to-slate-800/40 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center bg-white/95 backdrop-blur-md rounded-3xl border border-gray-200 p-12 shadow-2xl"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              About <span className="text-orange-500">SciDraft</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              Revolutionizing science education by automating lab reports and empowering students to focus on what matters most - learning.
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section 
        id="mission"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: -15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-600/30 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105"
            >
              <motion.div 
                className="flex items-center mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-blue-400 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg"
                >
                  <Target className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white">Our Mission</h2>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-lg text-gray-200 mb-6 leading-relaxed"
              >
                At SciDraft, we believe that students should spend their time understanding scientific concepts, 
                not struggling with report formatting. Our mission is to eliminate the tedious aspects of lab 
                report writing while maintaining academic integrity and enhancing learning outcomes.
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg text-gray-200 mb-8 leading-relaxed"
              >
                We're building the future of science education - one where technology amplifies human potential 
                and makes quality education accessible to everyone.
              </motion.p>
              <div className="flex flex-wrap gap-4">
                {['Student-Focused', 'Academically Sound', 'Innovation-Driven'].map((item, index) => (
                  <motion.div 
                    key={item}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    viewport={{ once: true }}
                    className="flex items-center bg-slate-700/60 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-500/40"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-white font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative"
            >
              <motion.div 
                className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-600/30 hover:shadow-3xl transition-all duration-500 hover:scale-105"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="relative overflow-hidden rounded-2xl mb-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20science%20laboratory%20with%20students%20working%20collaboratively%20on%20experiments%20bright%20and%20inspiring&image_size=landscape_4_3"
                    alt="Students in laboratory"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      viewport={{ once: true }}
                      className="text-center p-4 bg-slate-700/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-500/40 hover:bg-slate-600/70 transition-all duration-300"
                    >
                      <motion.div 
                        className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-1"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-sm text-gray-200 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div 
                className="absolute -bottom-6 -right-6 bg-gradient-to-br from-orange-400 to-red-500 text-white p-6 rounded-2xl shadow-2xl border border-white/20"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                viewport={{ once: true }}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Microscope className="h-8 w-8 mb-2" />
                </motion.div>
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-sm opacity-90">Happy Students</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        id="stats"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5
                }}
                viewport={{ once: true }}
                className="text-center p-8 bg-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-slate-600/30 group"
              >
                <motion.div 
                   className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3"
                   whileHover={{ scale: 1.1 }}
                   transition={{ type: "spring", stiffness: 400 }}
                 >
                   {stat.number}
                 </motion.div>
                <motion.div 
                  className="text-gray-200 font-medium group-hover:text-white transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.label}
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ scale: 1.02 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        id="values"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Our Core Values
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              These principles guide everything we do at SciDraft
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 60, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    rotateY: 5
                  }}
                  viewport={{ once: true }}
                  className="bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 text-center border border-slate-600/30 group relative overflow-hidden"
                >
                  <motion.div 
                    className="bg-gradient-to-br from-blue-400/20 to-purple-600/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-slate-500/40"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent className="h-10 w-10 text-gray-200" />
                    </motion.div>
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-gray-200 mb-4 group-hover:text-blue-300 transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    {value.title}
                  </motion.h3>
                  <motion.p 
                    className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                    viewport={{ once: true }}
                  >
                    {value.description}
                  </motion.p>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    whileHover={{ scale: 1.02 }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Timeline Section */}
      <motion.section 
        id="timeline"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Our Journey
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              From a simple idea to revolutionizing science education
            </motion.p>
          </motion.div>

          <div className="relative">
            <motion.div 
              className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 rounded-full"
              initial={{ height: 0 }}
              whileInView={{ height: '100%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
              viewport={{ once: true }}
            />
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, rotateY: index % 2 === 0 ? -15 : 15 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.3,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  viewport={{ once: true }}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <motion.div 
                    className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className="bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-600/30 group relative overflow-hidden"
                      whileHover={{ 
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3)"
                      }}
                    >
                      <div className="flex items-center mb-6">
                        <motion.span 
                          className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                          whileHover={{ scale: 1.1 }}
                        >
                          {milestone.year}
                        </motion.span>
                      </div>
                      <motion.h3 
                        className="text-2xl font-bold text-gray-200 mb-3 group-hover:text-blue-300 transition-colors duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        {milestone.title}
                      </motion.h3>
                      <motion.p 
                        className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.3 + 0.4 }}
                        viewport={{ once: true }}
                      >
                        {milestone.description}
                      </motion.p>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        whileHover={{ scale: 1.02 }}
                      />
                    </motion.div>
                  </motion.div>
                  
                  {/* Timeline dot */}
                  <motion.div 
                    className="relative z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.3 + 0.2,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.3, rotate: 180 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full border-4 border-white/20 shadow-2xl backdrop-blur-sm"></div>
                  </motion.div>
                  
                  <div className="w-1/2"></div>
                </motion.div>
               ))}
             </div>
           </div>
         </div>
       </motion.section>

      {/* Team Section */}
      <motion.section 
        id="team"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Meet Our Team
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Passionate educators, scientists, and technologists working together to transform science education
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 60, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5
                }}
                viewport={{ once: true }}
                className="bg-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-600/30 overflow-hidden hover:shadow-3xl transition-all duration-500 group relative"
              >
                <motion.div 
                  className="aspect-square overflow-hidden relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                </motion.div>
                <motion.div 
                  className="p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                  viewport={{ once: true }}
                >
                  <motion.h3 
                    className="text-xl font-bold text-gray-200 mb-2 group-hover:text-blue-300 transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    {member.name}
                  </motion.h3>
                  <motion.div 
                    className="text-blue-400 font-semibold mb-3 group-hover:text-purple-400 transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    {member.role}
                  </motion.div>
                  <motion.p 
                    className="text-gray-300 text-sm mb-4 leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.5 }}
                    viewport={{ once: true }}
                  >
                    {member.bio}
                  </motion.p>
                  
                  <div className="flex space-x-3">
                    {member.email && (
                      <motion.a
                        href={`mailto:${member.email}`}
                        className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Mail className="h-5 w-5" />
                      </motion.a>
                    )}
                    {member.linkedin && (
                      <motion.a
                        href={member.linkedin}
                        className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Linkedin className="h-5 w-5" />
                      </motion.a>
                    )}
                    {member.twitter && (
                      <motion.a
                        href={member.twitter}
                        className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Twitter className="h-5 w-5" />
                      </motion.a>
                    )}
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ scale: 1.02 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"
          animate={{
            background: [
              "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)",
              "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)",
              "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
            viewport={{ once: true }}
            className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-slate-600/30 hover:shadow-3xl transition-all duration-500 group"
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <GraduationCap className="h-16 w-16 text-orange-400 mx-auto" />
            </motion.div>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6 group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-500"
              whileHover={{ scale: 1.05 }}
            >
              Ready to Transform Your Lab Reports?
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Join thousands of students who are already saving time and improving their grades with SciDraft.
            </motion.p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/signup"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl relative overflow-hidden group/btn"
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                    whileHover={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">Get Started Free</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/demo"
                  className="inline-flex items-center px-8 py-4 border-2 border-slate-500/40 text-gray-200 rounded-full font-semibold hover:bg-slate-700/60 hover:border-slate-400/60 transition-all duration-300 backdrop-blur-sm"
                >
                  Watch Demo
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          whileHover={{ scale: 1.02 }}
        />
      </motion.section>
    </div>
  )
}