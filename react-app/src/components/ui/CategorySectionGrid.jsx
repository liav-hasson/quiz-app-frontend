import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { CATEGORY_SECTIONS } from '../../constants/categoryGroups'

/**
 * CategorySectionGrid - 3x3 grid of category sections
 * 
 * Displays section boxes that expand to show categories when clicked.
 * Only one section can be expanded at a time.
 */
const CategorySectionGrid = ({ 
  availableCategories = {}, 
  selectedCategory, 
  onCategorySelect,
  onSectionChange 
}) => {
  const [expandedSection, setExpandedSection] = useState(null)

  const handleSectionClick = (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null)
      onSectionChange?.(null)
    } else {
      setExpandedSection(sectionId)
      onSectionChange?.(sectionId)
    }
  }

  const handleCategoryClick = (category) => {
    onCategorySelect(category)
  }

  // Filter sections to only show those with available categories
  const sectionsWithData = CATEGORY_SECTIONS.map(section => ({
    ...section,
    availableCategories: section.categories.filter(cat => 
      Object.keys(availableCategories).includes(cat)
    )
  }))

  // Get color classes for a section
  const getColorClasses = (color, isActive) => {
    const colorMap = {
      'accent-primary': {
        border: isActive ? 'border-fuchsia-500' : 'border-white/10 hover:border-fuchsia-500/50',
        bg: isActive ? 'bg-fuchsia-500/20' : 'bg-white/5 hover:bg-fuchsia-500/10',
        text: isActive ? 'text-fuchsia-400' : 'text-text-secondary hover:text-fuchsia-400',
        glow: isActive ? 'shadow-[0_0_15px_rgba(217,70,239,0.3)]' : '',
      },
      'accent-secondary': {
        border: isActive ? 'border-cyan-500' : 'border-white/10 hover:border-cyan-500/50',
        bg: isActive ? 'bg-cyan-500/20' : 'bg-white/5 hover:bg-cyan-500/10',
        text: isActive ? 'text-cyan-400' : 'text-text-secondary hover:text-cyan-400',
        glow: isActive ? 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' : '',
      },
      'accent-tertiary': {
        border: isActive ? 'border-violet-500' : 'border-white/10 hover:border-violet-500/50',
        bg: isActive ? 'bg-violet-500/20' : 'bg-white/5 hover:bg-violet-500/10',
        text: isActive ? 'text-violet-400' : 'text-text-secondary hover:text-violet-400',
        glow: isActive ? 'shadow-[0_0_15px_rgba(139,92,246,0.3)]' : '',
      },
      'accent-quaternary': {
        border: isActive ? 'border-pink-500' : 'border-white/10 hover:border-pink-500/50',
        bg: isActive ? 'bg-pink-500/20' : 'bg-white/5 hover:bg-pink-500/10',
        text: isActive ? 'text-pink-400' : 'text-text-secondary hover:text-pink-400',
        glow: isActive ? 'shadow-[0_0_15px_rgba(236,72,153,0.3)]' : '',
      },
      'accent-quinary': {
        border: isActive ? 'border-emerald-500' : 'border-white/10 hover:border-emerald-500/50',
        bg: isActive ? 'bg-emerald-500/20' : 'bg-white/5 hover:bg-emerald-500/10',
        text: isActive ? 'text-emerald-400' : 'text-text-secondary hover:text-emerald-400',
        glow: isActive ? 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' : '',
      },
    }
    return colorMap[color] || colorMap['accent-secondary']
  }

  // Find which section contains the selected category
  const selectedSection = selectedCategory 
    ? CATEGORY_SECTIONS.find(s => s.categories.includes(selectedCategory))?.id 
    : null

  return (
    <div className="space-y-3">
      {/* 3x3 Grid of Section Boxes */}
      <div className="grid grid-cols-3 gap-2">
        {sectionsWithData.map((section) => {
          const isExpanded = expandedSection === section.id
          const hasSelection = selectedSection === section.id
          // Only show as active if: expanded, OR has selection and nothing else is expanded
          const isActive = isExpanded || (hasSelection && !expandedSection)
          const colors = getColorClasses(section.color, isActive)
          const IconComponent = section.icon
          const categoryCount = section.availableCategories.length

          return (
            <motion.button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-2 rounded-lg border transition-all duration-200
                flex flex-col items-center justify-center gap-1
                ${colors.border} ${colors.bg} ${colors.glow}
                ${categoryCount === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={categoryCount === 0}
            >
              <IconComponent className={`w-5 h-5 ${colors.text}`} />
              <span className={`font-arcade text-[10px] ${colors.text}`}>
                {section.name}
              </span>
              {/* Category count badge */}
              <span className="absolute top-1 right-1 text-[6px] font-orbitron text-text-muted">
                {categoryCount}
              </span>
              {/* Expand indicator */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                >
                  <ChevronDown className={`w-3 h-3 ${colors.text}`} />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Expanded Categories Panel */}
      <AnimatePresence mode="wait">
        {expandedSection && (
          <motion.div
            key={expandedSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {(() => {
              const section = sectionsWithData.find(s => s.id === expandedSection)
              if (!section) return null
              const colors = getColorClasses(section.color, true)

              return (
                <div className={`p-3 rounded-lg border ${colors.border} bg-bg-card/50 backdrop-blur-sm`}>
                  <div className="flex flex-wrap gap-2">
                    {section.availableCategories.map((category) => {
                      const isSelected = selectedCategory === category
                      return (
                        <motion.button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            px-3 py-2 rounded-lg border text-left transition-all
                            font-orbitron text-xs leading-tight
                            ${isSelected 
                              ? `${colors.border} ${colors.bg} ${colors.glow} text-white` 
                              : 'border-white/10 bg-white/5 text-text-secondary hover:border-white/30 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          {category}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategorySectionGrid
