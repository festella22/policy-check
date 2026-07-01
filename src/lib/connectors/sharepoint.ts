import { ConnectorResult } from '@/types'

interface SharePointCredentials {
  tenant_id: string
  client_id: string
  client_secret: string
  site_url?: string
}

async function getAccessToken(credentials: SharePointCredentials): Promise<string> {
  const { tenant_id, client_id, client_secret } = credentials

  const res = await fetch(
    `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  )

  if (!res.ok) throw new Error(`SharePoint auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

export async function searchSharePoint(
  query: string,
  credentials: Record<string, string>
): Promise<ConnectorResult[]> {
  const creds = credentials as unknown as SharePointCredentials

  if (!creds.tenant_id || !creds.client_id || !creds.client_secret) {
    throw new Error('SharePoint credentials incomplete')
  }

  const token = await getAccessToken(creds)

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/search/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          entityTypes: ['driveItem', 'listItem'],
          query: { queryString: query },
          size: 5,
          fields: ['name', 'webUrl', 'lastModifiedDateTime', 'summary'],
        }],
      }),
    }
  )

  if (!res.ok) throw new Error(`SharePoint search failed: ${res.status}`)

  const data = await res.json()
  const hits = data.value?.[0]?.hitsContainers?.[0]?.hits || []

  return hits.map((hit: any) => ({
    title: hit.resource?.name || 'Untitled',
    url: hit.resource?.webUrl || null,
    excerpt: hit.summary || hit.resource?.name || '',
    connector: 'sharepoint' as const,
    last_synced: hit.resource?.lastModifiedDateTime || null,
  }))
}
