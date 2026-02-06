import { jsonb, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '../../postgres'
import type { PrivateMediaItem } from '../PrivateMediaTypes'

export const didcommPrivateMediaSharing = pgTable(
  'DidcommPrivateMediaSharing',
  {
    ...getPostgresBaseRecordTable(),

    /** Owner */
    userId: text('user_id').notNull(),

    /** Optional description */
    description: text('description'),

    /** DIDComm threading (optional but future-proof) */
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),

    /** Media items (encrypted or plain depending on ciphering info) */
    items: jsonb('items').$type<PrivateMediaItem[]>(),

    /** Versioning for optimistic updates / migrations */
    version: text('version'),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommPrivateMediaSharing'),

    /** Prevent duplicate threads per user + context */
    unique().on(table.contextCorrelationId, table.threadId),
  ]
)
