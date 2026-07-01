'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from './MessageBubble'
import { Send } from 'lucide-react'

const QUICK_QUESTIONS = [
  'What is the parental leave policy?',
  'How many PTO days do I accrue per year?',
  'What are the expense receipt requirements?',
  'How does the 401(k) match work?',
  'What is the remote work policy?',
  'What must a new hire complete in the first 30 days?',
]

interface InitialMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  conversationId?: string | null
  initialMessages?: InitialMessage[]
}

export default function ChatInterface({ conversationId: initConvoId, initialMessages }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(initConvoId || null)
  const router = useRouter()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { conversationId },
    initialMessages: initialMessages || [],
    onResponse: (response) => {
      const newId = response.headers.get('X-Conversation-Id')
      if (newId && !conversationId) {
        setConversationId(newId)
        router.replace(`/chat/${newId}`, { scroll: false })
      }
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-5 border-b border-[#DDD8CC] bg-white">
        <h1 className="font-serif text-[19px] font-bold text-[#28261F]">Ask a policy question</h1>
        <p className="text-[13px] text-[#6B6860] mt-0.5">Answers sourced from Confluence, SharePoint, and JustWorks</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="m-auto max-w-xl w-full flex flex-col items-center gap-6 text-center">
            <div className="w-10 h-10 rounded-full border border-[#DDD8CC] flex items-center justify-center text-lg text-[#A8A49A]">§</div>
            <div>
              <h2 className="font-serif text-[17px] font-bold text-[#28261F]">What would you like to know?</h2>
              <p className="text-[13.5px] text-[#6B6860] mt-1 leading-relaxed">Ask anything about HR policies, benefits, compliance, or workplace rules.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleInputChange({ target: { value: q } } as any)}
                  className="text-left px-4 py-3 rounded-lg border border-[#DDD8CC] text-[13px] text-[#6B6860] hover:border-[#4F7A5E] hover:text-[#4F7A5E] hover:bg-[#EBF2ED] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: any) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {isLoading && (
          <div className="flex gap-1.5 px-4 py-3 bg-white border border-[#DDD8CC] rounded-xl rounded-bl-sm w-fit">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[#A8A49A] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-8 py-4 border-t border-[#DDD8CC] bg-white">
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 items-center bg-[#F9F8F3] border border-[#DDD8CC] rounded-xl px-4 py-1 focus-within:border-[#4F7A5E] transition-colors"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="e.g. What is the parental leave policy?"
            className="flex-1 bg-transparent text-[14px] text-[#28261F] placeholder:text-[#A8A49A] outline-none py-3"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#4F7A5E] text-white rounded-lg p-2 hover:bg-[#3d6049] transition-colors disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="text-[11px] text-[#A8A49A] mt-2 px-1">
          Answers may be inferred. Confirm sensitive matters with HR or Legal directly.
        </p>
      </div>
    </div>
  )
}
