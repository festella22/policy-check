import { ConnectorResult } from '@/types'

interface JustWorksCredentials {
  api_key: string
}

// JustWorks does not have an official public search API as of mid-2026.
// This connector fetches known policy endpoints and does keyword matching.
// Replace with official API endpoints when available.
const POLICY_ENDPOINTS = [
  { path: '/v1/benefits', label: 'Benefits' },
  { path: '/v1/pto_policies', label: 'PTO Policy' },
  { path: '/v1/leave_policies', label: 'Leave Policies' },
]

export async function searchJustWorks(
  query: string,
  credentials: Record<string, string>
): Promise<ConnectorResult[]> {
  const { api_key } = credentials as unknown as JustWorksCredentials

  if (!api_key) throw new Error('JustWorks API key missing')

  const BASE = 'https://api.justworks.com'
  const results: ConnectorResult[] = []
  const queryLower = query.toLowerCase()

  for (const endpoint of POLICY_ENDPOINTS) {
    try {
      const res = await fetch(`${BASE}${endpoint.path}`, {
        headers: {
          Authorization: `Bearer ${api_key}`,
          Accept: 'application/json',
        },
      })

      if (!res.ok) continue

      const data = await res.json()
      const text = JSON.stringify(data).toLowerCase()

      if (text.includes(queryLower)) {
        results.push({
          title: `JustWorks — ${endpoint.label}`,
          url: null,
          excerpt: summarizeJustWorksData(data, endpoint.label),
          connector: 'justworks',
          last_synced: new Date().toISOString(),
        })
      }
    } catch {
      // Skip failed endpoints silently
    }
  }

  return results
}

function summarizeJustWorksData(data: any, label: string): string {
  if (Array.isArray(data)) {
    return data.slice(0, 3).map((item: any) =>
      typeof item === 'object' ? Object.entries(item).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ') : String(item)
    ).join(' | ')
  }
  return `${label} data retrieved from JustWorks.`
}
