import { ConnectorResult, ConnectorType } from '@/types'
import { searchConfluence } from './confluence'
import { searchSharePoint } from './sharepoint'
import { searchJustWorks } from './justworks'

export interface ConnectorConfig {
  type: ConnectorType
  credentials: Record<string, string>
  lastSynced: string | null
}

export async function searchAllConnectors(
  query: string,
  connectors: ConnectorConfig[]
): Promise<ConnectorResult[]> {
  const searches = connectors.map(async (connector) => {
    try {
      switch (connector.type) {
        case 'confluence':
          return await searchConfluence(query, connector.credentials)
        case 'sharepoint':
          return await searchSharePoint(query, connector.credentials)
        case 'justworks':
          return await searchJustWorks(query, connector.credentials)
        default:
          return []
      }
    } catch (err) {
      console.error(`Connector ${connector.type} failed:`, err)
      return []
    }
  })

  const results = await Promise.allSettled(searches)
  return results
    .filter((r): r is PromiseFulfilledResult<ConnectorResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
}

export function formatResultsForPrompt(results: ConnectorResult[]): string {
  if (results.length === 0) return 'No results found in connected sources.'

  return results
    .map((r) => {
      const source = `[${r.connector.toUpperCase()} — ${r.title}]${r.url ? `(${r.url})` : ''}`
      const synced = r.last_synced ? `Last synced: ${r.last_synced}` : 'Sync date unknown'
      return `${source}\n${r.excerpt}\n(${synced})`
    })
    .join('\n\n---\n\n')
}
