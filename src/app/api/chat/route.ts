import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getLLMModel, getApiKey } from '@/lib/llm/provider'
import { searchAllConnectors, formatResultsForPrompt } from '@/lib/connectors'
import { HR_POLICY_SYSTEM_PROMPT } from '@/lib/prompts/hr-policy'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId } = await req.json()
    const supabase = await createServiceClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get user's firm and connectors
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (!profile) return new Response('Profile not found', { status: 404 })

    const { data: connectorRows } = await supabase
      .from('connectors')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .eq('status', 'active')

    // Search all connected sources
    const lastMessage = messages[messages.length - 1]?.content || ''
    const connectors = (connectorRows || []).map((c) => ({
      type: c.type,
      credentials: c.config,
      lastSynced: c.last_synced_at,
    }))

    const searchResults = await searchAllConnectors(lastMessage, connectors)
    const context = formatResultsForPrompt(searchResults)

    // Audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      firm_id: profile.firm_id,
      question: lastMessage,
      sources_queried: connectors.map((c) => c.type),
    })

    // Save user message
    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: lastMessage,
        sources: [],
      })
    }

    const systemPrompt = `${HR_POLICY_SYSTEM_PROMPT}

## Search results from connected sources

${context}`

    const apiKey = getApiKey()
    const model = getLLMModel(apiKey)

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
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

    return result.toDataStreamResponse()
  } catch (err) {
    console.error('Chat error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
