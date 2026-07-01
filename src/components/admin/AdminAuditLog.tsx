import { AuditEntry } from '@/types'

export default function AdminAuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <section>
      <h2 className="font-serif text-[16px] font-bold text-[#28261F] mb-4">Recent Questions</h2>
      <div className="bg-white border border-[#DDD8CC] rounded-xl overflow-hidden">
        {entries.length === 0 && (
          <p className="text-[13px] text-[#A8A49A] py-6 text-center">No questions logged yet.</p>
        )}
        {entries.map((e, i) => (
          <div key={e.id} className={`flex items-start justify-between px-4 py-3 gap-4 ${i < entries.length - 1 ? 'border-b border-[#DDD8CC]' : ''}`}>
            <p className="text-[13px] text-[#28261F] leading-snug flex-1">{e.question}</p>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-[#A8A49A]">{new Date(e.created_at).toLocaleDateString()}</p>
              <p className="text-[11px] text-[#4F7A5E] font-mono">{(e.sources_queried || []).join(', ')}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
