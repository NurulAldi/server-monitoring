'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useSocket } from '../../soket/useSocket'
import { useAISocket } from '../../soket/useAISocket'

interface PesanChat {
  id: string
  tipe: 'user' | 'ai' | 'system'
  konten: string
  timestamp: Date
  serverId?: string
  questionId?: string
  dataUsed?: any[]
  confidence?: number
}

interface PropsChatbotAI {
  serverId?: string
  className?: string
}

export function ChatbotAI({ serverId, className = '' }: PropsChatbotAI) {
  const [pesan, setPesan] = useState<PesanChat[]>([])
  const [input, setInput] = useState('')
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const socket = useSocket()
  const { aiSocket, isAIConnected, aiConnectionError, onAI, offAI } = useAISocket()

  // Pesan sambutan awal
  useEffect(() => {
    const pesanSambutan: PesanChat = {
      id: 'welcome',
      tipe: 'system',
      konten: `Halo! Saya adalah asisten AI untuk monitoring kesehatan server. Saya dapat membantu Anda dengan:

• Menjawab pertanyaan tentang sistem monitoring
• Menganalisis data kesehatan server (CPU, memory, disk, dll.)
• Menjelaskan makna perubahan data dan tren

⚠️ **PENTING**: Saya TIDAK BISA mengambil tindakan langsung, mengubah data, atau membuat keputusan sistem. Saya hanya memberikan analisis informatif.`,
      timestamp: new Date()
    }
    setPesan([pesanSambutan])
  }, [])

  // Socket.IO listeners untuk AI events
  useEffect(() => {
    if (!aiSocket || !isAIConnected) return

    const handleAIThinking = (data: any) => {
      console.log('AI thinking:', data)
      setCurrentQuestionId(data.questionId)
      setSedangMemuat(true)
      setError(null)
    }

    const handleAIResponse = (data: any) => {
      console.log('AI response:', data)

      const pesanAI: PesanChat = {
        id: data.questionId,
        tipe: 'ai',
        konten: data.answer,
        timestamp: new Date(data.timestamp),
        serverId: data.serverId,
        questionId: data.questionId,
        dataUsed: data.dataUsed,
        confidence: data.confidence
      }

      setPesan(prev => [...prev, pesanAI])
      setSedangMemuat(false)
      setCurrentQuestionId(null)
    }

    const handleAIError = (data: any) => {
      console.log('AI error:', data)

      const pesanError: PesanChat = {
        id: data.questionId || Date.now().toString(),
        tipe: 'system',
        konten: `❌ Error: ${data.message}`,
        timestamp: new Date(data.timestamp)
      }

      setPesan(prev => [...prev, pesanError])
      setSedangMemuat(false)
      setCurrentQuestionId(null)
      setError(data.message)
    }

    // Setup listeners
    onAI('ai:thinking', handleAIThinking)
    onAI('ai:response', handleAIResponse)
    onAI('ai:error', handleAIError)

    return () => {
      offAI('ai:thinking', handleAIThinking)
      offAI('ai:response', handleAIResponse)
      offAI('ai:error', handleAIError)
    }
  }, [aiSocket, isAIConnected, onAI, offAI])

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [pesan, sedangMemuat])

  const kirimPesan = async () => {
    if (!input.trim() || sedangMemuat) return

    const pesanUser: PesanChat = {
      id: Date.now().toString(),
      tipe: 'user',
      konten: input.trim(),
      timestamp: new Date(),
      serverId
    }

    setPesan(prev => [...prev, pesanUser])
    setInput('')
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pertanyaan: pesanUser.konten,
          serverId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle immediate error response (validation errors, etc.)
        const pesanError: PesanChat = {
          id: (Date.now() + 1).toString(),
          tipe: 'system',
          konten: `❌ Error: ${data.message}`,
          timestamp: new Date()
        }
        setPesan(prev => [...prev, pesanError])
        setError(data.message)
        return
      }

      // If success, Socket.IO will handle the response
      // The response contains questionId and status: 'processing'
      console.log('Question sent, waiting for Socket.IO response:', data.questionId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      setError(errorMessage)

      const pesanError: PesanChat = {
        id: (Date.now() + 1).toString(),
        tipe: 'system',
        konten: `❌ Error: ${errorMessage}`,
        timestamp: new Date()
      }

      setPesan(prev => [...prev, pesanError])
      setSedangMemuat(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      kirimPesan()
    }
  }

  const formatWaktu = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex flex-col h-full bg-bg-secondary border border-bg-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-bg-border bg-bg-primary">
        <Bot className="w-6 h-6 text-accent-primary" />
        <div className="flex-1">
          <h3 className="text-heading font-semibold text-text-primary">AI Assistant</h3>
          <p className="text-body-small text-text-secondary">Monitoring Health Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAIConnected ? 'bg-status-success' : 'bg-status-critical'} ${!isAIConnected ? 'animate-pulse' : ''}`}></div>
          <span className="text-xs text-text-muted">
            {isAIConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <Info className="w-4 h-4 text-text-muted ml-auto cursor-help"
              title="AI hanya memberikan analisis informatif dan tidak dapat mengambil tindakan sistem" />
      </div>

      {/* Chat Area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {pesan.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.tipe === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.tipe !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0">
                {msg.tipe === 'ai' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <Info className="w-4 h-4 text-white" />
                )}
              </div>
            )}

            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.tipe === 'user'
                  ? 'bg-accent-primary text-white'
                  : msg.tipe === 'ai'
                  ? 'bg-bg-primary text-text-primary border border-bg-border'
                  : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
              }`}
            >
              <div className="text-body-small whitespace-pre-wrap">{msg.konten}</div>
              <div className="text-xs opacity-70 mt-2">
                {formatWaktu(msg.timestamp)}
              </div>
            </div>

            {msg.tipe === 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {sedangMemuat && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-bg-primary p-3 rounded-lg border border-bg-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-body-small text-text-secondary ml-2">AI sedang berpikir...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-status-critical/10 border border-status-critical/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-status-critical flex-shrink-0" />
          <span className="text-body-small text-status-critical">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-status-critical hover:text-status-critical/80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-bg-border bg-bg-primary">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tanyakan tentang kesehatan server atau analisis data..."
            className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={sedangMemuat}
          />
          <button
            onClick={kirimPesan}
            disabled={!input.trim() || sedangMemuat}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Kirim
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-2 text-xs text-text-muted text-center">
          AI hanya memberikan analisis informatif • Tidak dapat mengambil tindakan sistem
        </div>
      </div>
    </div>
  )
}

export default ChatbotAI