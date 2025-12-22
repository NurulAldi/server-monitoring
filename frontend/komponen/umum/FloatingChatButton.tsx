'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import ChatbotAI from './ChatbotAI'

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-primary hover:bg-accent-primary-hover shadow-2xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`}
        aria-label="Toggle AI Chat"
      >
        <MessageSquare className="w-6 h-6 text-pure-black group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide-in Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-bg-primary border-l border-bg-border shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-bg-border bg-bg-secondary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-pure-black" />
            </div>
            <div>
              <h3 className="text-heading font-semibold text-text-primary">
                AI Assistant
              </h3>
              <p className="text-body-small text-text-secondary">
                Server Health Analysis
              </p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-text-secondary hover:text-text-primary" />
          </button>
        </div>

        {/* Chat Content - Full Height */}
        <div className="h-[calc(100vh-73px)] overflow-hidden">
          <ChatbotAI className="h-full" />
        </div>
      </div>

      {/* Backdrop Overlay (Mobile) */}
      {isOpen && (
        <div
          onClick={toggleChat}
          className="fixed inset-0 bg-pure-black/50 z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default FloatingChatButton
