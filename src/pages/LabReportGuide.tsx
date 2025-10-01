import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, FileText, Download, Sparkles } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

// FAQ data extracted from Questions.txt
const faqData = [
  {
    id: 1,
    question: "What is a lab report?",
    answer: "A lab report is a structured document that explains an experiment you performed. It records the objectives, methods, results, and your interpretation of what those results mean."
  },
  {
    id: 2,
    question: "What is the laboratory report format?",
    answer: "The standard lab report format follows 10 sections: Title, Introduction, Objectives, Materials, Procedure, Results, Discussion, Recommendations, Conclusion, References."
  },
  {
    id: 3,
    question: "Example of a laboratory report",
    answer: "A sample chemistry report might include: Title: Titration of Acids and Bases → Aim: To determine the concentration of an acid using NaOH solution → Results: recorded titration values → Conclusion: the molarity of the acid was calculated."
  },
  {
    id: 4,
    question: "How to write a laboratory report",
    answer: "Start by recording your raw results in the lab. Then write your report in the correct order: title, introduction, objectives, etc. Use clear, precise language and reference reliable sources."
  },
  {
    id: 5,
    question: "What goes in the results of a lab report?",
    answer: "Only factual data you observed: measurements, tables, graphs, drawings, and notes from the experiment. No explanations (those go in the discussion)."
  },
  {
    id: 6,
    question: "What are the steps of writing a laboratory report?",
    answer: "1. Do the experiment\n2. Record results\n3. Draft your report sections\n4. Write introduction and discussion\n5. Add references\n6. Review and proofread"
  },
  {
    id: 7,
    question: "What is a scientific lab report?",
    answer: "A scientific lab report is the formal way scientists communicate experiments and findings, following strict format rules."
  },
  {
    id: 8,
    question: "What is the correct order of the lab report steps?",
    answer: "Title → Introduction → Objectives → Materials → Procedure → Results → Discussion → Recommendations → Conclusion → References."
  },
  {
    id: 9,
    question: "How to write a procedure in a lab report?",
    answer: "Write the exact steps you followed in the lab, using past tense and chronological order."
  },
  {
    id: 10,
    question: "Lab report PDF download",
    answer: "Students often look for sample lab reports in PDF format. SciDraft provides downloadable drafts and examples to guide you."
  },
  {
    id: 11,
    question: "Lab report for students",
    answer: "Lab reports are required in biology, chemistry, and physics courses to test your ability to conduct and explain experiments."
  },
  {
    id: 12,
    question: "Chemistry, Biology, Physics lab reports",
    answer: "Each subject has specific experiments, but the format remains the same. Example: Chemistry → titration, Biology → microscopy, Physics → projectile motion."
  },
  {
    id: 13,
    question: "Laboratory report generator",
    answer: "SciDraft is an AI-powered generator that helps students create structured lab reports quickly."
  },
  {
    id: 14,
    question: "Formats, templates, downloads",
    answer: "Lab reports can be written in Word or exported as PDFs. A good template ensures all required sections are included. SciDraft generates structured reports directly in PDF/DOCX format."
  }
];

interface FAQItemProps {
  faq: typeof faqData[0];
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg mb-4 overflow-hidden shadow-2xl hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset transition-all duration-300 group"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faq.id}`}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 pr-4 transition-colors duration-300">
            {faq.question}
          </h3>
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-300 group-hover:text-blue-300 transition-all duration-300" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-300 group-hover:text-blue-300 transition-all duration-300" />
            )}
          </div>
        </div>
      </button>
      
      {isOpen && (
        <div
          id={`faq-answer-${faq.id}`}
          className="px-6 py-4 bg-white/5 border-t border-white/20 animate-fade-in"
        >
          <div className="text-gray-200 leading-relaxed whitespace-pre-line">
            {faq.answer}
          </div>
        </div>
      )}
    </div>
  );
};

const LabReportGuide: React.FC = () => {
  usePageTitle('Lab Report Guide - Complete Writing Guide | SciDraft');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const expandAll = () => {
    setOpenItems(new Set(faqData.map(faq => faq.id)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob will-change-transform motion-reduce:animate-none"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 will-change-transform motion-reduce:animate-none"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 will-change-transform motion-reduce:animate-none"></div>
        </div>
      </div>
      {/* Header Section */}
      <div className="relative z-10">
        <div className={`backdrop-blur-xl bg-white/10 border-b border-white/20 transition-all duration-1000 will-change-transform motion-reduce:transition-none ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-3 rounded-full border border-white/30 shadow-2xl hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Lab Report Writing Guide
              </h1>
              <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Master the art of scientific writing with our comprehensive guide. 
                Learn everything from basic structure to advanced formatting techniques.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-8 transition-all duration-1000 delay-300 will-change-transform motion-reduce:transition-none ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={expandAll}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium hover:scale-105 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <FileText className="h-4 w-4 mr-2" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-lg hover:from-gray-700 hover:to-slate-700 transition-all duration-300 font-medium hover:scale-105 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <FileText className="h-4 w-4 mr-2" />
            Collapse All
          </button>
          <a
            href="/new-report"
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium hover:scale-105 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Start Writing Now
          </a>
        </div>

        {/* FAQ Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          {faqData.map((faq, index) => (
            <div
              key={faq.id}
              className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${500 + index * 100}ms` }}
            >
              <FAQItem
                faq={faq}
                isOpen={openItems.has(faq.id)}
                onToggle={() => toggleItem(faq.id)}
              />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/30 rounded-lg p-8 shadow-2xl hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-500">
            <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ready to Write Your Lab Report?
            </h3>
            <p className="text-gray-200 mb-6">
              Put your knowledge into practice with SciDraft's intelligent writing assistant.
            </p>
            <a
              href="/new-report"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm border border-white/20"
            >
              <FileText className="h-5 w-5 mr-2" />
              Start Writing Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabReportGuide;