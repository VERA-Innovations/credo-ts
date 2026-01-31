import type {
  DidCommMediaSharingRole,
  DidCommMediaSharingState,
  SharedMediaItem,
} from '@2060.io/credo-ts-didcomm-media-sharing'
import { foreignKey, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { didcommConnection } from '../../didcomm/sqlite'
import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '../../sqlite'

export const didcommMediaSharing = sqliteTable(
  'DidcommMediaSharing',
  {
    ...getSqliteBaseRecordTable(),

    /**
     * SQLite stores timestamps as integers (ms since epoch)
     */
    // sentTime: integer('sent_time').notNull(),
    sentTime: integer('sent_time', { mode: 'timestamp_ms' }),

    state: text('state').$type<DidCommMediaSharingState>().notNull(),
    role: text('role').$type<DidCommMediaSharingRole>().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),
    description: text('description'),

    items: text('items', { mode: 'json' }).$type<SharedMediaItem[]>(),
  },
  (table) => [
    ...sqliteBaseRecordIndexes(table, 'didcommMediaSharing'),

    unique().on(table.contextCorrelationId, table.threadId),

    foreignKey({
      columns: [table.contextCorrelationId],
      foreignColumns: [table.contextCorrelationId],
    }).onDelete('cascade'),

    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
