import React from 'react'

/**
 * Lazy loading utilities for heavy dependencies
 * Helps reduce initial bundle size by loading modules only when needed
 */

// Framer Motion lazy loader
export const loadFramerMotion = async () => {
  const { motion, AnimatePresence } = await import('framer-motion')
  return { motion, AnimatePresence }
}

// PDF.js lazy loader (already implemented in NewReport.tsx)
export const loadPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist')
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default
  return pdfjsLib
}

// HTML2PDF lazy loader
export const loadHtml2Pdf = async () => {
  const html2pdf = await import('html2pdf.js')
  return html2pdf.default
}

// jsPDF lazy loader
export const loadJsPdf = async () => {
  const jsPDF = await import('jspdf')
  return jsPDF.default
}



// Generic lazy component loader with loading state
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn)
}

// Cache for loaded modules to avoid re-importing
const moduleCache = new Map<string, any>()

export const loadWithCache = async <T>(
  key: string,
  loader: () => Promise<T>
): Promise<T> => {
  if (moduleCache.has(key)) {
    return moduleCache.get(key)
  }
  
  const module = await loader()
  moduleCache.set(key, module)
  return module
}