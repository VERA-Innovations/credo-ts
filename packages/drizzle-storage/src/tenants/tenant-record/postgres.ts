import type { VersionString } from '@credo-ts/core'
import type { TenantRecord } from '@credo-ts/tenants'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { getPostgresBaseRecordTable, postgresBaseRecordIndexes } from '../../postgres/baseRecord'

export const tenant = pgTable(
  'Tenant',
  {
    ...getPostgresBaseRecordTable(),

    storageVersion: text('storage_version').$type<VersionString>(),
    config: text('config').$type<TenantRecord['config']>().notNull(),
    label: text('label').notNull(),
  },
  (table) => postgresBaseRecordIndexes(table, 'tenant')
)
