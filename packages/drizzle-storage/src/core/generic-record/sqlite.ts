import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '../../sqlite/baseRecord'

export const genericRecord = sqliteTable(
  'GenericRecord',
  {
    ...getSqliteBaseRecordTable(),

    content: text('content').notNull().$type<Record<string, unknown>>(),
  },
  (table) => sqliteBaseRecordIndexes(table, 'genericRecord')
)
