import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('conversation_id', id)
    .order('created_at')

  if (error) redirect('/chat')

  return (
    <ChatInterface
      conversationId={id}
      initialMessages={(messages || []) as Array<{ id: string; role: 'user' | 'assistant'; content: string }>}
    />
  )
}
