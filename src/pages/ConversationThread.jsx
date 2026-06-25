import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchMessages, sendMessage } from '../services/resources.js'
import { getSocket } from '../services/socket.js'
import { useAuth } from '../hooks/useAuth.js'

export default function ConversationThread() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Ajoute un message en évitant les doublons (l'écho socket + la réponse REST).
  const addMessage = (m) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))

  useEffect(() => {
    let active = true
    fetchMessages(id)
      .then((msgs) => active && setMessages(msgs))
      .catch(() => {})

    const socket = getSocket()
    socket.emit('conversation:join', id)
    const onNew = (m) => {
      if (m.conversationId === id) addMessage(m)
    }
    socket.on('message:new', onNew)
    return () => {
      active = false
      socket.off('message:new', onNew)
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true)
    try {
      const m = await sendMessage(id, content)
      addMessage(m)
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Link to="/messages" aria-label="Retour" className="text-2xl text-slate-400">
          ‹
        </Link>
        <h1 className="font-semibold text-slate-800">{t('messages.title')}</h1>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-slate-100 px-3 py-3">
        <input
          className="input py-2"
          placeholder={t('messages.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary px-4 py-2" disabled={sending || !text.trim()}>
          {t('messages.send')}
        </button>
      </form>
    </div>
  )
}
