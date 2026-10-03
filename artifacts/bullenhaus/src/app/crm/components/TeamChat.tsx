/**
 * TeamChat — floating employee chat widget for the Bullenhaus CRM.
 *
 * Lives in the bottom-right corner of every CRM page. Uses the Next.js
 * backend (port 3001 via XTransformPort) for REST + socket.io (port 3003)
 * for realtime. Maps the current Supabase user to an Employee record by email.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/browserClient'
import { useAuth } from '../../trading/contexts/AuthContext'
import { io, Socket } from 'socket.io-client'
import {
  MessageSquare, X, Send, Search, Users, Loader2, ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Employee {
  id: string
  name: string
  role: string
  avatarColor: string
}
interface Conversation {
  id: string
  type: string
  title: string
  participants: Array<{ id: string; name: string; role: string; avatarColor: string }>
  lastMessage?: { content: string; senderId: string; createdAt: string } | null
  updatedAt: string
}
interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: string
  senderAvatarColor: string
  content: string
  contentType: string
  createdAt: string
}
interface Presence {
  employeeId: string
  name: string
  role: string
  avatarColor: string
  status: string
}

const API_BASE = '/api?XTransformPort=3001'
// helper to build API URLs through the gateway
const apiUrl = (path: string) =>
  path.includes('?')
    ? `${path}&XTransformPort=3001`
    : `${path}?XTransformPort=3001`

// ---------------------------------------------------------------------------
// Avatar helper
// ---------------------------------------------------------------------------
function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.35 }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      title={name}
    >
      {initials}
    </div>
  )
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function TeamChat() {
  const { user: authUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loadingEmp, setLoadingEmp] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [presence, setPresence] = useState<Presence[]>([])
  const [draft, setDraft] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [search, setSearch] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingPeers, setTypingPeers] = useState<Record<string, boolean>>({})
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastTypingEmit = useRef(0)

  // -------------------------------------------------------------------------
  // Resolve current user (from AuthContext) → Employee via backend API.
  // If the user is not in the Employee DB yet, auto-provision them so the
  // chat is available to EVERYONE with CRM access (no admin seeding required).
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const email = authUser?.email
    if (!email) { setLoadingEmp(false); return }
    ;(async () => {
      try {
        // 1. Try to find existing employee by email
        const res = await fetch(apiUrl(`/api/employees/by-email?email=${encodeURIComponent(email)}`))
        if (res.ok) {
          const data = await res.json()
          if (cancelled) return
          if (data.employee) {
            setEmployee(data.employee)
            return
          }
        }
        // 2. Not found — auto-provision a new employee record.
        //    Derive name + role from the email so the chat works immediately.
        const localPart = email.split('@')[0] || 'User'
        const name = localPart
          .split(/[._-]+/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ')
        // Pick a stable avatar color from a palette based on email hash
        const palette = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7']
        let hash = 0
        for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0
        const avatarColor = palette[Math.abs(hash) % palette.length]

        const createRes = await fetch(apiUrl('/api/employees'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            role: 'agent',
            department: 'sales',
            avatarColor,
          }),
        })
        if (createRes.ok) {
          const data = await createRes.json()
          if (cancelled) return
          setEmployee(data.employee)
        }
      } catch {
        // not fatal — chat just won't appear
      } finally {
        if (!cancelled) setLoadingEmp(false)
      }
    })()
    return () => { cancelled = true }
  }, [authUser?.email])

  // -------------------------------------------------------------------------
  // Load conversation list + all employees
  // -------------------------------------------------------------------------
  const loadConversations = useCallback(async () => {
    if (!employee) return
    try {
      const res = await fetch(apiUrl('/api/chat/conversations'), {
        headers: { 'x-employee-id': employee.id },
      })
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
      if (data.conversations?.length > 0 && !activeId) {
        setActiveId(data.conversations[0].id)
      }
    } catch { /* ignore */ }
  }, [employee, activeId])

  useEffect(() => {
    if (!employee) return
    loadConversations()
    fetch(apiUrl('/api/employees'))
      .then((r) => r.json())
      .then((d) => setAllEmployees(d.employees || []))
      .catch(() => {})
  }, [employee, loadConversations])

  // -------------------------------------------------------------------------
  // Socket.io connection
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!employee || !open) return
    const socket = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
    })
    socketRef.current = socket

    const onConnect = () => {
      socket.emit('employee:identify', {
        employeeId: employee.id,
        name: employee.name,
        role: employee.role,
        avatarColor: employee.avatarColor,
      })
    }
    if (socket.connected) onConnect()
    socket.on('connect', onConnect)

    socket.on('presence:update', (list: Presence[]) => setPresence(list))

    socket.on('message:new', (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === activeId) {
        setMessages((prev) =>
          prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
        )
      }
      loadConversations()
    })

    socket.on('typing:start', (p: { conversationId: string; employeeId: string }) => {
      if (p.conversationId === activeId && p.employeeId !== employee.id) {
        setTypingPeers((prev) => ({ ...prev, [p.employeeId]: true }))
        if (typingTimeouts.current[p.employeeId]) clearTimeout(typingTimeouts.current[p.employeeId])
        typingTimeouts.current[p.employeeId] = setTimeout(() => {
          setTypingPeers((prev) => { const n = { ...prev }; delete n[p.employeeId]; return n })
        }, 4000)
      }
    })
    socket.on('typing:stop', (p: { conversationId: string; employeeId: string }) => {
      if (p.conversationId === activeId) {
        setTypingPeers((prev) => { const n = { ...prev }; delete n[p.employeeId]; return n })
      }
    })

    return () => {
      socket.off('connect', onConnect)
      socket.off('presence:update')
      socket.off('message:new')
      socket.off('typing:start')
      socket.off('typing:stop')
      socket.disconnect()
      socketRef.current = null
    }
  }, [employee, open, activeId, loadConversations])

  // -------------------------------------------------------------------------
  // Load messages when active conversation changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!activeId || !employee) return
    setLoadingMsgs(true)
    setMessages([])
    fetch(apiUrl(`/api/chat/conversations/${activeId}/messages?limit=100`), {
      headers: { 'x-employee-id': employee.id },
    })
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
    socketRef.current?.emit('conversation:join', activeId)
    fetch(apiUrl(`/api/chat/conversations/${activeId}/read`), {
      method: 'POST',
      headers: { 'x-employee-id': employee.id },
    }).catch(() => {})
  }, [activeId, employee])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------
  const send = async () => {
    const content = draft.trim()
    if (!content || !activeId || !employee) return
    setSending(true)
    try {
      const res = await fetch(apiUrl(`/api/chat/conversations/${activeId}/messages`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-employee-id': employee.id },
        body: JSON.stringify({ content, contentType: 'text' }),
      })
      if (!res.ok) throw new Error('send failed')
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setDraft('')
      socketRef.current?.emit('message:send', { conversationId: activeId, message: data.message })
      socketRef.current?.emit('typing:stop', { conversationId: activeId, employeeId: employee.id })
      loadConversations()
    } catch (e) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const onDraftChange = (v: string) => {
    setDraft(v)
    if (!activeId || !employee) return
    const now = Date.now()
    if (now - lastTypingEmit.current > 1500) {
      lastTypingEmit.current = now
      socketRef.current?.emit('typing:start', {
        conversationId: activeId, employeeId: employee.id, name: employee.name,
      })
    }
  }

  const startDirectChat = async (otherId: string) => {
    if (!employee) return
    try {
      const res = await fetch(apiUrl('/api/chat/conversations'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-employee-id': employee.id },
        body: JSON.stringify({ participantIds: [otherId], type: 'direct' }),
      })
      const data = await res.json()
      setShowNewChat(false)
      setSearch('')
      await loadConversations()
      setActiveId(data.conversation.id)
    } catch {
      toast.error('Failed to start chat')
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loadingEmp) return null
  if (!employee) return null // not a CRM employee

  const activeConvo = conversations.find((c) => c.id === activeId)
  const onlineIds = new Set(presence.map((p) => p.employeeId))
  const typingNames = Object.keys(typingPeers)
    .map((id) => presence.find((p) => p.employeeId === id)?.name)
    .filter(Boolean)

  const filteredEmployees = allEmployees
    .filter((e) => e.id !== employee.id)
    .filter((e) => !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-aura-gold text-black shadow-lg shadow-aura-gold/30 hover:scale-105 transition-transform"
            title="Team Chat"
          >
            <MessageSquare size={22} />
            {presence.length > 1 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {presence.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[420px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-white/10 glass-card shadow-2xl"
          >
            {/* Sidebar: conversations */}
            <div className={`flex flex-col border-r border-white/5 ${activeId && !showNewChat ? 'hidden w-48 sm:flex' : 'w-full sm:w-48'}`}>
              <div className="flex h-12 items-center justify-between border-b border-white/5 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60">Chat</span>
                <button onClick={() => setOpen(false)} className="text-aura-platinum/40 hover:text-aura-platinum">
                  <X size={14} />
                </button>
              </div>

              {!showNewChat ? (
                <>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-aura-platinum/40">
                        No conversations yet.
                      </div>
                    ) : (
                      conversations.map((c) => {
                        const other = c.participants.find((p) => p.id !== employee.id)
                        const name = other?.name || c.title
                        const color = other?.avatarColor || '#888'
                        const isOnline = other ? onlineIds.has(other.id) : false
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setActiveId(c.id); setShowNewChat(false) }}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-lg p-2 text-left transition ${activeId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                          >
                            <div className="relative">
                              <Avatar name={name} color={color} size={28} />
                              {isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0A0A0B] bg-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-medium text-aura-platinum">{name}</p>
                              <p className="truncate text-[9px] text-aura-platinum/40">
                                {c.lastMessage
                                  ? `${c.lastMessage.senderId === employee.id ? 'You: ' : ''}${c.lastMessage.content}`
                                  : 'No messages'}
                              </p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                  <div className="border-t border-white/5 p-2">
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-aura-gold/10 py-2 text-[10px] font-bold uppercase tracking-wider text-aura-gold hover:bg-aura-gold/20"
                    >
                      <Users size={12} /> New Chat
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col">
                  <div className="border-b border-white/5 p-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search team…"
                        className="w-full rounded-md border border-white/10 bg-black/30 py-1.5 pl-7 pr-2 text-[11px] text-aura-platinum placeholder:text-aura-platinum/30 focus:border-aura-gold/30 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
                    {filteredEmployees.map((emp) => {
                      const isOnline = onlineIds.has(emp.id)
                      return (
                        <button
                          key={emp.id}
                          onClick={() => startDirectChat(emp.id)}
                          className="mb-0.5 flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-white/5"
                        >
                          <div className="relative">
                            <Avatar name={emp.name} color={emp.avatarColor} size={28} />
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0A0A0B] bg-emerald-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-aura-platinum">{emp.name}</p>
                            <p className="text-[9px] uppercase tracking-wider text-aura-gold/60">{emp.role}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="border-t border-white/5 py-2 text-[10px] text-aura-platinum/40 hover:text-aura-platinum"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Main: messages */}
            <div className="flex flex-1 flex-col">
              {!activeConvo || showNewChat ? (
                <div className="flex flex-1 flex-col items-center justify-center text-aura-platinum/30">
                  <MessageSquare size={32} className="mb-2 opacity-40" />
                  <p className="text-[11px]">Select a conversation</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex h-12 items-center justify-between border-b border-white/5 px-3">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const other = activeConvo.participants.find((p) => p.id !== employee.id)
                        const isOnline = other ? onlineIds.has(other.id) : false
                        return (
                          <>
                            <div className="relative">
                              <Avatar name={other?.name || '?'} color={other?.avatarColor || '#888'} size={24} />
                              {isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0A0A0B] bg-emerald-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-aura-platinum">{other?.name || activeConvo.title}</p>
                              <p className="text-[8px] uppercase tracking-wider text-aura-platinum/40">
                                {isOnline ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => { setActiveId(null); setShowNewChat(true) }}
                      className="text-[9px] uppercase tracking-wider text-aura-platinum/40 hover:text-aura-gold"
                    >
                      New
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar glass-card p-3">
                    {loadingMsgs ? (
                      <div className="flex items-center justify-center py-6 text-aura-platinum/40">
                        <Loader2 size={14} className="mr-2 animate-spin" /> Loading…
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-6 text-center text-[11px] text-aura-platinum/40">
                        No messages yet. Say hello! 👋
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {messages.map((m, idx) => {
                          const mine = m.senderId === employee.id
                          const prev = messages[idx - 1]
                          const showAvatar = !prev || prev.senderId !== m.senderId
                          return (
                            <div key={m.id} className={`flex gap-1.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                              {showAvatar ? (
                                <Avatar name={m.senderName} color={m.senderAvatarColor} size={22} />
                              ) : (
                                <div style={{ width: 22 }} className="shrink-0" />
                              )}
                              <div
                                className={`max-w-[75%] rounded-xl px-2.5 py-1.5 text-[11px] ${
                                  mine ? 'bg-aura-gold text-black' : 'bg-white/5 text-aura-platinum border border-white/5'
                                }`}
                              >
                                {showAvatar && !mine && (
                                  <p className="mb-0.5 text-[9px] font-semibold opacity-60">{m.senderName}</p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                <p className={`mt-0.5 text-[8px] opacity-50 ${mine ? 'text-right' : 'text-left'}`}>
                                  {formatTime(m.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        {typingNames.length > 0 && (
                          <div className="flex items-center gap-1 pl-7 text-[9px] text-aura-platinum/40">
                            <span className="flex gap-0.5">
                              <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                              <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                              <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
                            </span>
                            {typingNames.join(', ')} typing…
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="border-t border-white/5 p-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                        placeholder="Type a message…"
                        disabled={sending}
                        className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-aura-platinum placeholder:text-aura-platinum/30 focus:border-aura-gold/30 focus:outline-none"
                      />
                      <button
                        onClick={send}
                        disabled={sending || !draft.trim()}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-aura-gold text-black disabled:opacity-30 hover:bg-aura-gold-light"
                      >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
