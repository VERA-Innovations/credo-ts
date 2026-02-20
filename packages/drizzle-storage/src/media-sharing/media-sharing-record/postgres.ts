import type {
  DidCommMediaSharingRole,
  DidCommMediaSharingState,
  SharedMediaItem,
} from '@2060.io/credo-ts-didcomm-media-sharing'
import { foreignKey, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { didcommConnection } from '../../didcomm/postgres'
import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '../../postgres'
import { exhaustiveArray } from '../../util'

/**
 * Enums
 */
const mediaSharingStates = exhaustiveArray(
  {} as DidCommMediaSharingState,
  ['init', 'media-requested', 'media-shared', 'done'] as const
)
export const didcommMediaSharingStateEnum = pgEnum('DidcommMediaSharingState', mediaSharingStates)

const mediaSharingRoles = exhaustiveArray({} as DidCommMediaSharingRole, ['sender', 'receiver'] as const)
export const didcommMediaSharingRoleEnum = pgEnum('DidcommMediaSharingRole', mediaSharingRoles)

/**
 * Table
 */
export const didcommMediaSharing = pgTable(
  'DidcommMediaSharing',
  {
    ...getPostgresBaseRecordTable(),

    sentTime: timestamp('sent_time', { withTimezone: true, precision: 3 }),

    state: didcommMediaSharingStateEnum().notNull(),
    role: didcommMediaSharingRoleEnum().notNull(),

    connectionId: text('connection_id').notNull(),
    threadId: text('thread_id'),
    parentThreadId: text('parent_thread_id'),
    description: text('description'),

    items: text('items').$type<SharedMediaItem[]>(),
  },
  (table) => [
    ...postgresBaseRecordIndexes(table, 'didcommMediaSharing'),

    unique().on(table.contextCorrelationId, table.threadId),

    foreignKey({
      columns: [table.connectionId, table.contextCorrelationId],
      foreignColumns: [didcommConnection.id, didcommConnection.contextCorrelationId],
    }).onDelete('cascade'),
  ]
)
