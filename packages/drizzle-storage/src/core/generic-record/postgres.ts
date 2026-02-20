import { pgTable, text } from 'drizzle-orm/pg-core'
import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '../../postgres/baseRecord'

export const genericRecord = pgTable(
  'GenericRecord',
  {
    ...getPostgresBaseRecordTable(),

    content: text('content').notNull().$type<Record<string, unknown>>(),
  },
  (table) => postgresBaseRecordIndexes(table, 'genericRecord')
)
