import { ConnectorResult } from '@/types'

interface ConfluenceCredentials {
  base_url: string
  api_token: string
  email: string
  space_keys?: string
}

export async function searchConfluence(
  query: string,
  credentials: Record<string, string>
): Promise<ConnectorResult[]> {
  const { base_url, api_token, email } = credentials as unknown as ConfluenceCredentials

  if (!base_url || !api_token || !email) {
    throw new Error('Confluence credentials incomplete')
  }

  const auth = Buffer.from(`${email}:${api_token}`).toString('base64')
  const cql = `text ~ "${query}" AND type = "page" ORDER BY lastModified DESC`

  const res = await fetch(
    `${base_url}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=5&expand=body.view,version`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    }
  )

  if (!res.ok) throw new Error(`Confluence search failed: ${res.status}`)

  const data = await res.json()

  return (data.results || []).map((page: any) => ({
    title: page.title,
    url: `${base_url}/wiki${page._links?.webui || ''}`,
    excerpt: stripHtml(page.body?.view?.value || '').slice(0, 500),
    connector: 'confluence' as const,
    last_synced: page.version?.when || null,
  }))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
