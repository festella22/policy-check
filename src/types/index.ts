export type UserRole = 'user' | 'admin'
export type ConnectorType = 'confluence' | 'sharepoint' | 'justworks'
export type ConnectorStatus = 'active' | 'error' | 'disconnected'

export interface Firm {
  id: string
  name: string
  created_at: string
}

export interface UserProfile {
  id: string
  firm_id: string
  role: UserRole
  created_at: string
}

export interface Connector {
  id: string
  firm_id: string
  type: ConnectorType
  name: string
  config: Record<string, string>
  status: ConnectorStatus
  last_synced_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  firm_id: string
  title: string | null
  created_at: string
}

export interface Source {
  title: string
  url: string | null
  excerpt: string
  connector: ConnectorType
  last_synced: string | null
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sources: Source[]
  created_at: string
}

export interface AuditEntry {
  id: string
  user_id: string
  firm_id: string
  question: string
  sources_queried: string[]
  created_at: string
}

export interface ConnectorResult {
  title: string
  url: string | null
  excerpt: string
  connector: ConnectorType
  last_synced: string | null
}
