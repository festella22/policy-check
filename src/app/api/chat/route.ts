import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getLLMModel, getApiKey } from '@/lib/llm/provider'
import { searchAllConnectors, formatResultsForPrompt } from '@/lib/connectors'
import { HR_POLICY_SYSTEM_PROMPT } from '@/lib/prompts/hr-policy'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId } = await req.json()

    // Auth: anon client validates user session from cookie
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // DB: service client bypasses RLS for multi-tenant queries
    const supabase = await createServiceClient()

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) return new Response('Profile not found', { status: 404 })

    const { data: connectorRows } = await supabase
      .from('connectors')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .eq('status', 'active')

    const lastMessage = messages[messages.length - 1]?.content || ''
    const connectors = (connectorRows || []).map((c) => ({
      type: c.type,
      credentials: c.config,
      lastSynced: c.last_synced_at,
    }))

    const [searchResults] = await Promise.all([
      searchAllConnectors(lastMessage, connectors),
    ])
    const context = formatResultsForPrompt(searchResults)

    // Create conversation server-side if none exists
    let activeConversationId: string | null = conversationId || null
    let isNewConversation = false
    if (!activeConversationId) {
      const { data: convo } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          firm_id: profile.firm_id,
          title: lastMessage.slice(0, 80),
        })
        .select('id')
        .single()
      activeConversationId = convo?.id || null
      isNewConversation = true
    }

    // Fire-and-forget audit log and user message save
    supabase.from('audit_log').insert({
      user_id: user.id,
      firm_id: profile.firm_id,
      question: lastMessage,
      sources_queried: connectors.map((c) => c.type),
    })

    if (activeConversationId) {
      supabase.from('messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: lastMessage,
        sources: [],
      })
    }

    const systemPrompt = `${HR_POLICY_SYSTEM_PROMPT}\n\n## Search results from connected sources\n\n${context}`
    const apiKey = getApiKey()
    const model = getLLMModel(apiKey)

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        if (activeConversationId) {
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: text,
            sources: searchResults.map((r) => ({
              title: r.title,
              url: r.url,
              excerpt: r.excerpt,
              connector: r.connector,
              last_synced: r.last_synced,
            })),
          })
        }
      },
    })

    return result.toDataStreamResponse({
      headers: isNewConversation && activeConversationId
        ? { 'X-Conversation-Id': activeConversationId }
        : undefined,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
