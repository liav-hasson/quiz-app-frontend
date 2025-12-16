import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/**
 * MarkdownRenderer - Renders markdown text with syntax-highlighted code blocks
 * 
 * Supports:
 * - Code blocks with language detection (```bash, ```yaml, etc.)
 * - Inline code
 * - Line breaks and paragraphs
 * - Basic markdown formatting (bold, italic, lists)
 */
const MarkdownRenderer = memo(function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null

  return (
    <ReactMarkdown
      className={`markdown-content ${className}`}
      components={{
        // Render code blocks with syntax highlighting
        code({ node, inline, className: codeClassName, children, ...props }) {
          const match = /language-(\w+)/.exec(codeClassName || '')
          const language = match ? match[1] : ''
          
          if (!inline && language) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                customStyle={{
                  margin: '1rem 0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '1rem',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          }
          
          // Inline code or code blocks without language
          if (!inline) {
            return (
              <SyntaxHighlighter
                style={oneDark}
                language="text"
                PreTag="div"
                customStyle={{
                  margin: '1rem 0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '1rem',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          }
          
          // Inline code
          return (
            <code 
              className="bg-white/10 px-1.5 py-0.5 rounded text-accent-secondary font-mono text-sm"
              {...props}
            >
              {children}
            </code>
          )
        },
        // Style paragraphs
        p({ children }) {
          return <p className="mb-4 last:mb-0">{children}</p>
        },
        // Style lists
        ul({ children }) {
          return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
        },
        // Style strong/bold
        strong({ children }) {
          return <strong className="font-bold text-white">{children}</strong>
        },
        // Style emphasis/italic
        em({ children }) {
          return <em className="italic text-gray-300">{children}</em>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
})

export default MarkdownRenderer
