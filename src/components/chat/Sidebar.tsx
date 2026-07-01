'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/types'
import { MessageSquare, Settings, LogOut, Shield, Plus } from 'lucide-react'

export default function Sidebar({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      setIsAdmin(profile?.role === 'admin')

      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      setConversations(convos || [])
    }
    load()
  }, [userId, pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function newConversation() {
    router.push('/chat')
  }

  return (
    <aside className="w-56 bg-white border-r border-[#DDD8CC] flex flex-col shrink-0">
      <div className="p-5 border-b border-[#DDD8CC]">
        <p className="font-serif text-[15px] font-bold text-[#28261F]">HR Policy Q&A</p>
        <p className="text-[11px] text-[#4F7A5E] font-semibold uppercase tracking-widest mt-0.5">Knowledge Base</p>
      </div>

      <div className="p-3">
        <button
          onClick={newConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#28261F] hover:bg-[#F9F8F3] transition-colors font-medium"
        >
          <Plus size={14} />
          New question
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={`block px-3 py-2 rounded-lg text-[13px] truncate transition-colors ${
              pathname === `/chat/${c.id}`
                ? 'bg-[#EBF2ED] text-[#4F7A5E]'
                : 'text-[#6B6860] hover:bg-[#F9F8F3] hover:text-[#28261F]'
            }`}
          >
            <MessageSquare size={12} className="inline mr-1.5 opacity-60" />
            {c.title || 'Untitled question'}
          </Link>
        ))}
      </div>

      <div className="p-3 border-t border-[#DDD8CC] flex flex-col gap-1">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#6B6860] hover:bg-[#F9F8F3] hover:text-[#28261F] transition-colors"
          >
            <Shield size={13} />
            Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#6B6860] hover:bg-[#F9F8F3] hover:text-[#28261F] transition-colors w-full text-left"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
