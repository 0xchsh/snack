'use client'

import { motion } from 'framer-motion'

// Example list cards showcasing different use cases
const EXAMPLE_LISTS = [
  {
    emoji: '📚',
    title: 'Best Design Books of 2024',
    linkCount: 12,
    category: 'Curate',
  },
  {
    emoji: '✈️',
    title: 'Tokyo Travel Guide',
    linkCount: 24,
    category: 'Plan',
  },
  {
    emoji: '🛠️',
    title: 'My Developer Toolkit',
    linkCount: 18,
    category: 'Build',
  },
  {
    emoji: '🍜',
    title: 'NYC Ramen Spots',
    linkCount: 8,
    category: 'Discover',
  },
  {
    emoji: '🎨',
    title: 'Design Inspiration',
    linkCount: 32,
    category: 'Curate',
  },
  {
    emoji: '📱',
    title: 'Favorite Apps',
    linkCount: 15,
    category: 'Share',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}

export function ExampleCards() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Lists for everything
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            From travel guides to dev tools, reading lists to restaurant recommendations.
            Create beautiful, shareable collections in seconds.
          </p>
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {EXAMPLE_LISTS.map((list) => (
            <motion.div
              key={list.title}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group bg-white border border-neutral-200 rounded-xl p-5 cursor-pointer transition-shadow hover:shadow-md"
            >
              {/* Emoji */}
              <span className="text-3xl mb-3 block">{list.emoji}</span>

              {/* Title */}
              <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {list.title}
              </h3>

              {/* Meta */}
              <p className="text-sm text-neutral-500">
                {list.linkCount} links
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
