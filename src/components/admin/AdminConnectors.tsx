'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Connector, ConnectorType } from '@/types'
import { CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react'

const CONNECTOR_FIELDS: Record<ConnectorType, { key: string; label: string; secret?: boolean }[]> = {
  confluence: [
    { key: 'base_url', label: 'Base URL (e.g. https://yourfirm.atlassian.net)' },
    { key: 'email', label: 'Admin email' },
    { key: 'api_token', label: 'API token', secret: true },
  ],
  sharepoint: [
    { key: 'tenant_id', label: 'Azure Tenant ID' },
    { key: 'client_id', label: 'Azure Client ID' },
    { key: 'client_secret', label: 'Azure Client Secret', secret: true },
  ],
  justworks: [
    { key: 'api_key', label: 'JustWorks API key', secret: true },
  ],
}

export default function AdminConnectors({ connectors, firmId }: { connectors: Connector[]; firmId: string }) {
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<ConnectorType>('confluence')
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function addConnector() {
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('connectors').insert({
      firm_id: firmId,
      type,
      name: name || type,
      config: fields,
      status: 'active',
    })
    setSaving(false)
    if (error) {
      setSaveError('Failed to save connector. Check credentials and try again.')
      return
    }
    setAdding(false)
    setName('')
    setFields({})
    router.refresh()
  }

  async function removeConnector(id: string) {
    await supabase.from('connectors').delete().eq('id', id)
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[16px] font-bold text-[#28261F]">Connected Sources</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[13px] text-[#4F7A5E] font-semibold hover:underline"
        >
          <Plus size={14} /> Add source
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {connectors.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-white border border-[#DDD8CC] rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              {c.status === 'active'
                ? <CheckCircle size={15} className="text-[#4F7A5E]" />
                : <XCircle size={15} className="text-red-400" />
              }
              <div>
                <p className="text-[14px] font-semibold text-[#28261F]">{c.name}</p>
                <p className="text-[12px] text-[#A8A49A]">
                  {c.type} · {c.last_synced_at ? `Last synced ${new Date(c.last_synced_at).toLocaleDateString()}` : 'Never synced'}
                </p>
              </div>
            </div>
            <button onClick={() => removeConnector(c.id)} className="text-[#A8A49A] hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {connectors.length === 0 && !adding && (
          <p className="text-[13px] text-[#A8A49A] py-4 text-center border border-dashed border-[#DDD8CC] rounded-xl">
            No sources connected yet. Add one above.
          </p>
        )}

        {adding && (
          <div className="bg-white border border-[#DDD8CC] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#A8A49A]">Source type</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as ConnectorType); setFields({}) }}
                className="border border-[#DDD8CC] rounded-lg px-3 py-2 text-[13px] text-[#28261F] bg-[#F9F8F3] outline-none"
              >
                <option value="confluence">Confluence</option>
                <option value="sharepoint">SharePoint</option>
                <option value="justworks">JustWorks</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#A8A49A]">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${type.charAt(0).toUpperCase() + type.slice(1)} HR Docs`}
                className="border border-[#DDD8CC] rounded-lg px-3 py-2 text-[13px] text-[#28261F] bg-[#F9F8F3] outline-none"
              />
            </div>

            {CONNECTOR_FIELDS[type].map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[#A8A49A]">{f.label}</label>
                <input
                  type={f.secret ? 'password' : 'text'}
                  value={fields[f.key] || ''}
                  onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                  className="border border-[#DDD8CC] rounded-lg px-3 py-2 text-[13px] text-[#28261F] bg-[#F9F8F3] outline-none font-mono"
                />
              </div>
            ))}

            {saveError && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={addConnector}
                disabled={saving}
                className="bg-[#28261F] text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-[#4F7A5E] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add connector'}
              </button>
              <button onClick={() => { setAdding(false); setSaveError('') }} className="text-[13px] text-[#6B6860] hover:text-[#28261F]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
