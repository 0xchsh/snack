'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: 'What is Snack?',
    answer: 'Snack is a simple tool for creating and sharing curated link collections. Think of it as bookmarks you can share with anyone - organized, beautiful, and accessible with a single link.',
  },
  {
    question: 'Is Snack free to use?',
    answer: 'Yes! Snack is completely free to create and share lists. We may introduce premium features in the future, but the core product will always be free.',
  },
  {
    question: 'Do viewers need an account?',
    answer: 'No. Anyone can view your shared lists without signing up. Only creators need an account to make and manage their lists.',
  },
  {
    question: 'Can I make my lists private?',
    answer: 'Yes. You can toggle any list between public and private. Private lists are only visible to you when logged in.',
  },
  {
    question: 'How is this different from bookmarks?',
    answer: 'Bookmarks are personal and hidden in your browser. Snack lists are designed to be shared - with beautiful formatting, social previews, and a clean URL you can send to anyone.',
  },
  {
    question: 'Can I customize my lists?',
    answer: 'Yes! You can add custom emojis, titles, and descriptions to each list. Your profile page showcases all your public lists in one place.',
  },
  {
    question: 'How do I share my lists?',
    answer: 'Every list gets a unique short link like snack.xyz/username/list-name. Just copy and paste it anywhere - social media, messages, or email.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-neutral-50 rounded-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-neutral-900">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-neutral-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-3">
            Frequently<br />asked questions
          </h2>
          <p className="text-neutral-500">
            Quick answers to common questions about<br className="sm:hidden" /> Snack, privacy, and setup.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
