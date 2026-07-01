import { ExternalLink } from 'lucide-react'

interface ExtendedMessage {
  id: string
  role: string
  content: string
  sources?: Array<{
    title: string
    url: string | null
    connector: string
    last_synced: string | null
  }>
}

export default function MessageBubble({ message }: { message: ExtendedMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col gap-2 max-w-2xl ${isUser ? 'self-end items-end' : 'self-start'}`}>
      <div
        className={`px-4 py-3 rounded-xl text-[14px] leading-relaxed ${
          isUser
            ? 'bg-[#28261F] text-[#F9F8F3] rounded-br-sm font-sans'
            : 'bg-white border border-[#DDD8CC] text-[#28261F] rounded-bl-sm font-serif'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A8A49A] px-1">Sources</p>
          {message.sources.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-[#F9F8F3] border border-[#DDD8CC] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4F7A5E]">{s.connector}</span>
                <span className="text-[12px] text-[#6B6860]">{s.title}</span>
              </div>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#A8A49A] hover:text-[#4F7A5E] transition-colors">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
