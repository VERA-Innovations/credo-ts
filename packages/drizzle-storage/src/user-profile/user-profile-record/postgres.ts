import { pgTable, text } from 'drizzle-orm/pg-core'
import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '../../postgres'

/**
 * Table
 */
export const userProfile = pgTable(
  'UserProfile',
  {
    ...getPostgresBaseRecordTable(),

    displayName: text('display_name'),
    description: text('description'),
    preferredLanguage: text('preferred_language'),

    displayPicture: text('display_picture').$type<Record<string, unknown> | undefined>(),
    displayIcon: text('display_icon').$type<Record<string, unknown> | undefined>(),
  },
  (table) => [...postgresBaseRecordIndexes(table, 'userProfile')]
)
