import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { LanguageModel } from 'ai'

export type LLMProvider = 'anthropic' | 'openai' | 'google'

function detectProvider(apiKey: string): LLMProvider {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic'
  if (apiKey.startsWith('AIza')) return 'google'
  return 'openai'
}

export function getLLMModel(apiKey: string): LanguageModel {
  const provider = detectProvider(apiKey)

  if (provider === 'anthropic') {
    const client = createAnthropic({ apiKey })
    return client('claude-sonnet-4-6')
  }

  if (provider === 'google') {
    const client = createGoogleGenerativeAI({ apiKey })
    return client('gemini-2.0-flash')
  }

  // Default: OpenAI
  const client = createOpenAI({ apiKey })
  return client('gpt-4o')
}

export function getApiKey(): string {
  const key =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GOOGLE_API_KEY

  if (!key) throw new Error('No LLM API key configured.')
  return key
}
