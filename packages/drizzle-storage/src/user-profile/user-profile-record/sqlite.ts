import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getSqliteBaseRecordTable, sqliteBaseRecordIndexes } from '../../sqlite'

/**
 * Table
 */
export const userProfile = sqliteTable(
  'UserProfile',
  {
    ...getSqliteBaseRecordTable(),

    displayName: text('display_name'),
    description: text('description'),
    preferredLanguage: text('preferred_language'),

    /**
     * SQLite stores JSON as text
     */
    displayPicture: text('display_picture', { mode: 'json' }).$type<Record<string, unknown> | undefined>(),
    displayIcon: text('display_icon', { mode: 'json' }).$type<Record<string, unknown> | undefined>(),
  },
  (table) => [...sqliteBaseRecordIndexes(table, 'userProfile')]
)
