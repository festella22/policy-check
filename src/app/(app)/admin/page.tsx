import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminConnectors from '@/components/admin/AdminConnectors'
import AdminAuditLog from '@/components/admin/AdminAuditLog'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('firm_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/chat')

  const { data: connectors } = await supabase
    .from('connectors')
    .select('*')
    .eq('firm_id', profile.firm_id)
    .order('created_at')

  const { data: auditLog } = await supabase
    .from('audit_log')
    .select('*')
    .eq('firm_id', profile.firm_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-5 border-b border-[#DDD8CC] bg-white">
        <h1 className="font-serif text-[19px] font-bold text-[#28261F]">Admin</h1>
        <p className="text-[13px] text-[#6B6860] mt-0.5">Manage connected sources and review usage</p>
      </div>

      <div className="px-8 py-6 flex flex-col gap-8 max-w-3xl">
        <AdminConnectors
          connectors={connectors || []}
          firmId={profile.firm_id}
        />
        <AdminAuditLog entries={auditLog || []} />
      </div>
    </div>
  )
}
