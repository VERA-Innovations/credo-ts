import type { BaseDrizzleRecordAdapter } from "./BaseDrizzleRecordAdapter";
import {
    SQLiteTable as _SQLiteTable,
  SQLiteTransaction as _SQLiteTransaction
} from 'drizzle-orm/sqlite-core'
import { PgTransaction as _PgTransaction } from 'drizzle-orm/pg-core'
import { getSqliteBaseRecordTable } from '../sqlite'
import type { Simplify } from 'drizzle-orm'
// biome-ignore lint/suspicious/noExplicitAny: no explanation
export type AnyDrizzleAdapter = BaseDrizzleRecordAdapter<any, any, any, any, any>

// export type DrizzleAdapterValues<Table extends _SQLiteTable> = Simplify<
//   Omit<
//     { [Key in keyof Table['$inferInsert']]: Table['$inferInsert'][Key] },
//     Exclude<keyof ReturnType<typeof getSqliteBaseRecordTable>, 'customTags'>
//   >
// >

// export type DrizzleAdapterRecordValues<Table extends _SQLiteTable> = Simplify<
//   Omit<{ [Key in keyof Table['$inferInsert']]: Table['$inferInsert'][Key] }, 'contextCorrelationId'>
// >
// biome-ignore lint/suspicious/noExplicitAny: no explanation
export type SQLiteTransaction = _SQLiteTransaction<any, any, any, any>
// biome-ignore lint/suspicious/noExplicitAny: no explanation
export type PgTransaction = _PgTransaction<any>

export type Transaction<T extends AnyDrizzleAdapter> = Parameters<Parameters<T['database']['transaction']>[0]>[0]

export type DrizzleAdapterValues<Table extends _SQLiteTable> = Simplify<
  Omit<
    { [Key in keyof Table['$inferInsert']]: Table['$inferInsert'][Key] },
    Exclude<keyof ReturnType<typeof getSqliteBaseRecordTable>, 'customTags'>
  >
>

export type DrizzleAdapterRecordValues<Table extends _SQLiteTable> = Simplify<
  Omit<{ [Key in keyof Table['$inferInsert']]: Table['$inferInsert'][Key] }, 'contextCorrelationId'>
>