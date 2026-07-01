'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/chat')
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex items-center justify-center">
      <div className="bg-white border border-[#DDD8CC] rounded-xl p-10 w-full max-w-sm shadow-sm">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-[#28261F]">HR Policy Q&A</h1>
          <p className="text-sm text-[#6B6860] mt-1">Sign in to your firm's knowledge base</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#A8A49A]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#DDD8CC] rounded-lg px-3 py-2.5 text-sm text-[#28261F] outline-none focus:border-[#4F7A5E] bg-[#F9F8F3]"
              placeholder="you@firm.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#A8A49A]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#DDD8CC] rounded-lg px-3 py-2.5 text-sm text-[#28261F] outline-none focus:border-[#4F7A5E] bg-[#F9F8F3]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#28261F] text-[#F9F8F3] rounded-lg py-2.5 text-sm font-semibold mt-2 hover:bg-[#4F7A5E] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
