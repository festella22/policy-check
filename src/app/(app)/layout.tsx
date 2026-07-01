import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/chat/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#F9F8F3]">
      <Sidebar userId={user.id} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
