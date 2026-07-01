import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('conversation_id', params.id)
    .order('created_at')

  if (error) redirect('/chat')

  return (
    <ChatInterface
      conversationId={params.id}
      initialMessages={(messages || []) as Array<{ id: string; role: 'user' | 'assistant'; content: string }>}
    />
  )
}
