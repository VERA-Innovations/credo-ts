import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '../../sqlite'
import type { PrivateMediaItem } from '../PrivateMediaTypes'

export const didcommPrivateMediaSharing = sqliteTable(
  'DidcommPrivateMediaSharing',
  {
    ...getSqliteBaseRecordTable(),

    /** Owner */
    userId: text('user_id').notNull(),

    /** Optional description */
    description: text('description'),

    /** DIDComm threading (optional but future-proof) */
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),

    /**
     * SQLite stores JSON as TEXT
     * Drizzle handles serialization/deserialization
     */
    items: text('items', { mode: 'json' }).$type<PrivateMediaItem[]>(),

    /** Versioning for optimistic updates / migrations */
    version: text('version'),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommPrivateMediaSharing'),

    /** Prevent duplicate threads per context */
    unique().on(table.contextCorrelationId, table.threadId),
  ]
)
