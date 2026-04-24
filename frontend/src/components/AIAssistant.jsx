import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { Send, Sparkles, Loader2, Trash2, Bot, User as UserIcon, Key, X } from 'lucide-react'

/** AI Assistant — chat widget. Renders inline or as floating panel. */
export default function AIAssistant({ variant = 'inline', onNavigate }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`user-session-${Date.now()}`)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [validatingKey, setValidatingKey] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedKey = localStorage.getItem('groq_api_key')
    if (storedKey) {
      setApiKey(storedKey)
      setMessages([{
        role: 'assistant',
        content: "Hey! I'm ERABS AI — your workspace concierge. Ask me to find an available room, summarise today's bookings, or help with approvals.",
      }])
    } else {
      // Show API key modal on first load
      setShowApiKeyModal(true)
      setMessages([{
        role: 'assistant',
        content: "👋 Welcome! To use the AI assistant, please provide your Groq API key. You can get one for free at https://console.groq.com",
      }])
    }
  }, [])

  const validateAndSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setValidatingKey(true)
    try {
      const res = await api.post('/ai/validate-key', {
        api_key: apiKeyInput.trim()
      })
      
      if (res.data.valid) {
        localStorage.setItem('groq_api_key', apiKeyInput.trim())
        setApiKey(apiKeyInput.trim())
        setShowApiKeyModal(false)
        setApiKeyInput('')
        toast.success('API key validated and saved!')
        setMessages([{
          role: 'assistant',
          content: "Great! I'm ready to help. Ask me anything about rooms, bookings, or analytics.",
        }])
      } else {
        toast.error(res.data.message || 'Invalid API key')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to validate API key')
    } finally {
      setValidatingKey(false)
    }
  }

  const removeApiKey = () => {
    localStorage.removeItem('groq_api_key')
    setApiKey('')
    setMessages([{
      role: 'assistant',
      content: "API key removed. Please provide a new key to continue using the assistant.",
    }])
    setShowApiKeyModal(true)
  }

  const send = async (text) => {
    if (!apiKey) {
      toast.error('Please configure your Groq API key first')
      setShowApiKeyModal(true)
      return
    }

    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', { 
        message: msg, 
        session_id: sessionId,
        groq_api_key: apiKey 
      })
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply || '…' }])
    } catch (err) {
      const reason = err.response?.data?.detail || 'AI is temporarily unavailable.'
      
      // If API key is invalid, prompt for new key
      if (err.response?.status === 401 || reason.toLowerCase().includes('api key')) {
        setMessages((m) => [...m, { 
          role: 'assistant', 
          content: `⚠️ ${reason}\n\nPlease update your API key.` 
        }])
        toast.error('Invalid API key. Please update it.')
        setShowApiKeyModal(true)
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${reason}` }])
        toast.error(reason)
      }
    } finally {
      setLoading(false)
    }
  }

  const clear = async () => {
    try { await api.delete('/ai/history', { params: { session_id: sessionId } }) } catch { /* ignore */ }
    setMessages([{
      role: 'assistant',
      content: 'Conversation cleared. How can I help?',
    }])
  }

  const suggestions = [
    'Find me a free room for 4 people in the next hour',
    'Which rooms are idle this week?',
    'Show me peak booking hours',
    'Any chess tables free right now?',
  ]

  return (
    <>
      <div
        data-testid="ai-assistant"
        className={`glass-card overflow-hidden flex flex-col ${
          variant === 'inline' ? 'h-[460px]' : 'h-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-brand-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-glow-blue">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${apiKey ? 'bg-green-400' : 'bg-amber-400'} rounded-full border-2 border-ink-900 animate-pulse`} />
            </div>
            <div>
              <h3 className="text-white font-semibold">ERABS AI</h3>
              <p className="text-xs text-gray-400">
                {apiKey ? 'Your workspace concierge · online' : 'API key required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="text-gray-500 hover:text-brand-400 p-2 rounded-lg transition-colors"
              title="Manage API key"
            >
              <Key size={16} />
            </button>
            <button
              data-testid="ai-clear"
              onClick={clear}
              className="text-gray-500 hover:text-red-400 p-2 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === 'user' ? 'bg-brand-500/20 text-brand-300' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {m.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-white/5 text-gray-100 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Bot size={14} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 size={14} className="text-purple-300 animate-spin" />
                <span className="text-gray-400 text-sm">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && apiKey && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="text-xs text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/30 border border-brand-500/30 rounded-full px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="flex items-center gap-2 px-5 py-4 border-t border-white/5 bg-ink-900/50"
        >
          <input
            data-testid="ai-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKey ? "Ask anything about rooms, bookings, analytics…" : "Configure API key first..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            disabled={loading || !apiKey}
          />
          <button
            data-testid="ai-send"
            type="submit"
            disabled={loading || !input.trim() || !apiKey}
            className="w-11 h-11 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-glow-blue"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>

      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !validatingKey && setShowApiKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    <Key size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Groq API Key</h3>
                    <p className="text-xs text-gray-500">Required for AI assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors"
                  disabled={validatingKey}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Enter your Groq API key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                    disabled={validatingKey}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndSaveApiKey()}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Get your free API key at{' '}
                    <a
                      href="https://console.groq.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-300 underline"
                    >
                      console.groq.com
                    </a>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={validateAndSaveApiKey}
                    disabled={validatingKey || !apiKeyInput.trim()}
                    className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {validatingKey ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Save & Validate'
                    )}
                  </button>
                  {apiKey && (
                    <button
                      onClick={removeApiKey}
                      disabled={validatingKey}
                      className="px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
