import {
  AgentContext,
  BaseRecord,
  type BaseRecordConstructor,
  CredoError,
  decodeCursor,
  type Query,
  type QueryOptions,
  RecordDuplicateError,
  RecordNotFoundError,
} from '@credo-ts/core'
import { and, asc, DrizzleQueryError, desc, eq } from 'drizzle-orm'
import { PgTable, pgTable } from 'drizzle-orm/pg-core'
import {
  sqliteTable,
} from 'drizzle-orm/sqlite-core'
import { type DrizzleDatabase, isDrizzlePostgresDatabase, isDrizzleSqliteDatabase } from '../DrizzleDatabase'
import { CredoDrizzleStorageError } from '../error'
import { getPostgresBaseRecordTable } from '../postgres' // no
import { getSqliteBaseRecordTable } from '../sqlite'
import { cursorAfterCondition, cursorBeforeCondition } from '../util'
import {
  DrizzlePostgresErrorCode,
  DrizzleSqliteErrorCode,
  extractPostgresErrorCode,
  extractSqliteErrorCode,
} from './drizzleError'
import { type DrizzleCustomTagKeyMapping, queryToDrizzlePostgres } from './queryToDrizzlePostgres' // mo
import { queryToDrizzleSqlite } from './queryToDrizzleSqlite' // no
import type { DrizzleStorageModuleConfig } from '../DrizzleStorageModuleConfig'
import { decryptDataWithKey, encryptDataWithKey } from '../storage/utils/encrypt'
import type { DrizzleAdapterRecordValues, DrizzleAdapterValues, PgTransaction, SQLiteTransaction, Transaction } from './type'

/**
 * Adapter between a specific Record class and the record Type
 */
export abstract class BaseDrizzleRecordAdapter<
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  CredoRecord extends BaseRecord<any, any, any>,
  PostgresTable extends ReturnType<typeof pgTable<string, ReturnType<typeof getPostgresBaseRecordTable>>>,
  PostgresSchema extends Record<string, unknown>,
  SQLiteTable extends ReturnType<typeof sqliteTable<string, ReturnType<typeof getSqliteBaseRecordTable>>>,
  SQLiteSchema extends Record<string, unknown>,
> {
  public recordClass: BaseRecordConstructor<CredoRecord>

  // Not sure if we should include 'metadata' column as well. Coz, we need that to be encrypted for connection profile
  public protectedColumns: string[] = [];

  public table: {
    postgres: PostgresTable
    sqlite: SQLiteTable
  }

  /**
   * Allows overriding top level tags (as used by Credo record classes)
   * to the database structure. For example mapping from the tag `presentationAuthSession`
   * to the nested database json structure `presentation.authSession`.
   */
  public tagKeyMapping?: DrizzleCustomTagKeyMapping

  public constructor(
    public database: DrizzleDatabase<PostgresSchema, SQLiteSchema>,
    table: {
      postgres: PostgresTable
      sqlite: SQLiteTable
    },
    recordClass: BaseRecordConstructor<CredoRecord>,
    additionalProtectedColumns: string[] = [],
    public config: DrizzleStorageModuleConfig
  ) {
    this.table = table
    this.recordClass = recordClass
    this.protectedColumns = ['contextCorrelationId', 'id', 'createdAt', 'updatedAt', ...additionalProtectedColumns]
  }

  public abstract getValues(record: CredoRecord, agentContext?: AgentContext): Promise<any>
  public async getValuesWithBase(agentContext: AgentContext, record: CredoRecord) {
    const values = await this.getValues(record, agentContext)
    return {
      ...values,

      // Always store based on context correlation id
      contextCorrelationId: agentContext.contextCorrelationId,

      id: record.id,
      // This should probably be avoided for creating/updating connection records. 
      // To use the metadata received from getValues and not get it overridden
      metadata: typeof values.metadata === "string" ? values.metadata : record.metadata.data,
      // If it's already a plain object or string from prepareValuesForDb, use it directly.
      // metadata: typeof (values as any).metadata === 'string' ? (values as any).metadata !== "{}" ? (values as any).metadata : null : record.metadata.data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }

  private async _toRecord(values: DrizzleAdapterRecordValues<SQLiteTable>, agentContext?: AgentContext): Promise<CredoRecord> {
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([_key, value]) => value !== null)
    ) as DrizzleAdapterRecordValues<SQLiteTable>

    return  await this.toRecord(filteredValues, agentContext)
  }

  public getModuleConfig(): DrizzleStorageModuleConfig | null {
    return this.config
  }

  // TODO: remove agentContext
  protected async prepareValuesForDb(record: any, agentContext?: AgentContext): Promise<Record<string, any>> {
    if (!this.getModuleConfig()?.enableEncryption) {
      return record;
    }
    const result = { ...record };
    const columnsToEncrypt = this.columnsToBeEncrypted();
    const encryptionKey = (columnsToEncrypt.length > 0 && this.config.encryptionKey)
      ? this.config.encryptionKey
      : null;

    // Loop through every key in the record to prepare it for the DB
    for (const key in result) {
      console.log("Processing key:", key);
      const rawValue = result[key];
      console.log("Raw value:", rawValue);
      if (rawValue === undefined || rawValue === null) continue;

      const shouldEncrypt = columnsToEncrypt.includes(key) && !this.protectedColumns.includes(key);

      if (shouldEncrypt && encryptionKey) {
        console.log("Encrypting value for key:", key);
        const stringValue = typeof rawValue === 'object' ? JSON.stringify(rawValue) : String(rawValue);
        result[key] = await encryptDataWithKey(stringValue, encryptionKey);
        console.log("Encrypted value for key:", key, "result:", result[key]);
      } 
      // This if statement is dangerous coz it stringyfies all the
      // else if (typeof rawValue === 'object' || Array.isArray(rawValue)) {   
      //   // Only stringify if it's a plain object, let Arrays pass through 
      //   // IF the DB expects an actual Array type.
      //   // TODO: I think we would need to encrypt array as well
      //   result[key] = JSON.stringify(rawValue);
      // }
    }
    return result;
  }

  protected async prepareRecordFromDb(values: Record<string, any>, agentContext?: AgentContext): Promise<Record<string, any>> {
    const processed = { ...values };
    const columnsToEncrypt = this.columnsToBeEncrypted();
    const encryptionKey = (columnsToEncrypt.length > 0 && this.config.encryptionKey)
      ? this.config.encryptionKey
      : null;

    for (const key in processed) {
      let value = processed[key];
      if (typeof value !== 'string') continue;

      // 1. Decrypt if necessary
      if (typeof value === 'string' && columnsToEncrypt.includes(key) && !this.protectedColumns.includes(key) && encryptionKey) {
        try {
          value = await decryptDataWithKey(value, encryptionKey);

          // 2. If it was encrypted, it was definitely stringified. Try to parse it back.
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              processed[key] = JSON.parse(value);
            } catch {
              processed[key] = value;
            }
          } else {
            processed[key] = value;
          }
        } catch (_e) {
          console.error(`Decryption failed for key: ${key}`);
          processed[key] = value;
        }
      } else {
        // If not encrypted, keep value as is (driver might have already parsed JSON)
        processed[key] = value;
      }
    }
    return processed;
  }

  public columnsToBeEncrypted(): string[] {
    const moduleConfig = this.getModuleConfig()
    if (!moduleConfig?.encryptedColumns) return []

    const columnsToEncrypt = moduleConfig.encryptedColumns[this.recordClass.name] ?? []
    return columnsToEncrypt
  }

  public abstract toRecord(values: DrizzleAdapterRecordValues<SQLiteTable>, agentContext?: AgentContext): Promise<CredoRecord>

  public async query(agentContext: AgentContext, query?: Query<CredoRecord>, queryOptions?: QueryOptions) {
    try {
      if (isDrizzlePostgresDatabase(this.database)) {
        const cursor = queryOptions?.cursor

        const hasAfter = !!cursor?.after
        const hasBefore = !!cursor?.before

        // Backward pagination ONLY when we have before but NOT after
        const isBackward = hasBefore && !hasAfter

        const whereConditions = [
          // Always filter by context
          eq(this.table.postgres.contextCorrelationId, agentContext.contextCorrelationId),

          // Existing query filters
          query ? queryToDrizzlePostgres(query, this.table.postgres, this.tagKeyMapping) : undefined,
        ]

        // AFTER cursor (lower bound)
        if (cursor?.after) {
          const afterCursor = decodeCursor(cursor.after)
          if (!afterCursor) {
            return []
          }
          whereConditions.push(cursorAfterCondition(this.table.postgres, afterCursor))
        }

        // BEFORE cursor (upper bound)
        if (cursor?.before) {
          const beforeCursor = decodeCursor(cursor.before)
          if (!beforeCursor) {
            return []
          }
          whereConditions.push(cursorBeforeCondition(this.table.postgres, beforeCursor))
        }

        const filteredWhere = whereConditions.filter(Boolean)

        // Order must flip ONLY for backward pagination
        const orderBy = isBackward
          ? [asc(this.table.postgres.createdAt), desc(this.table.postgres.id)]
          : [desc(this.table.postgres.createdAt), asc(this.table.postgres.id)]

        let queryResult = this.database
          .select()
          .from(this.table.postgres as PgTable)
          .where(and(...filteredWhere))
          .orderBy(...orderBy)

        // TODO: I think since we are adding the cursor based pagination it makes more sense to add default limit even if no limit is passed
        // This way we take the limit passed or the default limit. Maybe '100'
        // Or we can add it as a default limit in the storageService itself
        if (queryOptions?.limit !== undefined) {
          queryResult = queryResult.limit(queryOptions.limit) as typeof queryResult
        }

        // Note: Offset should NOT be used with cursor pagination
        // PS: This is also mentioned in the drizzle docs at the end of the page(search 'offset'):
        // https://orm.drizzle.team/docs/guides/cursor-based-pagination
        // So we skip offset in case we have cursor passed
        if (!cursor && queryOptions?.offset !== undefined) {
          queryResult = queryResult.offset(queryOptions.offset ?? 0) as typeof queryResult
        }

        let result = await queryResult

        // Restore canonical order for backward pagination
        if (isBackward) {
          result = result.reverse()
        }

        return await Promise.all(
          result.map(async ({ contextCorrelationId, ...item }) =>
            await this._toRecord(item as DrizzleAdapterRecordValues<PostgresTable>, agentContext)
          )
        )
      }

      if (isDrizzleSqliteDatabase(this.database)) {
        const cursor = queryOptions?.cursor

        const hasAfter = !!cursor?.after
        const hasBefore = !!cursor?.before

        // Backward pagination ONLY when we have before but NOT after
        const isBackward = hasBefore && !hasAfter

        const whereConditions = [
          // Always filter by context
          eq(this.table.sqlite.contextCorrelationId, agentContext.contextCorrelationId),

          // Existing query filters
          query ? queryToDrizzleSqlite(query, this.table.sqlite, this.tagKeyMapping) : undefined,
        ]

        // AFTER cursor (lower bound)
        if (cursor?.after) {
          const afterCursor = decodeCursor(cursor.after)

          if (!afterCursor) {
            return []
          }
          whereConditions.push(cursorAfterCondition(this.table.sqlite, afterCursor))
        }

        // BEFORE cursor (upper bound)
        if (cursor?.before) {
          const beforeCursor = decodeCursor(cursor.before)

          if (!beforeCursor) {
            return []
          }
          whereConditions.push(cursorBeforeCondition(this.table.sqlite, beforeCursor))
        }

        const filteredWhere = whereConditions.filter(Boolean)

        // Flip ordering ONLY for backward pagination
        const orderBy = isBackward
          ? [asc(this.table.sqlite.createdAt), desc(this.table.sqlite.id)]
          : [desc(this.table.sqlite.createdAt), asc(this.table.sqlite.id)]

        let queryResult = this.database
          .select()
          .from(this.table.sqlite as SQLiteTable)
          .where(and(...filteredWhere))
          .orderBy(...orderBy)

        // TODO: I think since we are adding the cursor based pagination it makes more sense to add default limit even if no limit is passed
        // This way we take the limit passed or the default limit. Maybe '100'
        // Or we can add it as a default limit in the storageService itself
        if (queryOptions?.limit !== undefined) {
          queryResult = queryResult.limit(queryOptions.limit) as typeof queryResult
        }

        // Note: Offset should NOT be used with cursor pagination
        // PS: This is also mentioned in the drizzle docs at the end of the page(search 'offset'):
        // https://orm.drizzle.team/docs/guides/cursor-based-pagination
        // So we skip offset in case we have cursor passed
        if (!cursor && queryOptions?.offset !== undefined) {
          queryResult = queryResult.offset(queryOptions.offset ?? 0) as typeof queryResult
        }

        let result = await queryResult

        // Restore canonical order for backward pagination
        if (isBackward) {
          result = result.reverse()
        }

        return await Promise.all(
          result.map(async ({ contextCorrelationId, ...item }) =>
            await this._toRecord(item as DrizzleAdapterRecordValues<SQLiteTable>, agentContext)
          )
        )
      }
    } catch (error) {
      if (error instanceof CredoError) throw error

      throw new CredoDrizzleStorageError(`Error querying '${this.recordClass.type}' record with query`)
    }

    throw new CredoDrizzleStorageError('Unsupported database type')
  }

  public async getById(agentContext: AgentContext, id: string, tx?: Transaction<this>, forUpdate?: boolean) {
    try {
      if (isDrizzlePostgresDatabase(this.database)) {
        const session = (tx as PgTransaction) ?? this.database

        let queryResult = session
          .select()
          .from(this.table.postgres as PgTable)
          .where(
            and(
              eq(this.table.postgres.id, id),
              eq(this.table.postgres.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .limit(1)

        if (forUpdate) {
          queryResult = queryResult.for('no key update') as typeof queryResult
        }

        const [result] = await queryResult

        if (!result) {
          throw new RecordNotFoundError(`record with id ${id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        // biome-ignore lint/correctness/noUnusedVariables: no explanation
        const { contextCorrelationId, ...item } = result
        return await this._toRecord(item as DrizzleAdapterRecordValues<PostgresTable>, agentContext)
      }

      if (isDrizzleSqliteDatabase(this.database)) {
        const session = (tx as SQLiteTransaction) ?? this.database

        const [result] = await session
          .select()
          .from(this.table.sqlite)
          .where(
            and(
              eq(this.table.sqlite.id, id),
              eq(this.table.sqlite.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .limit(1)

        if (!result) {
          throw new RecordNotFoundError(`record with id ${id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        // biome-ignore lint/correctness/noUnusedVariables: no explanation
        const { contextCorrelationId, ...item } = result
        return await this._toRecord(item as DrizzleAdapterRecordValues<SQLiteTable>, agentContext)
      }
    } catch (error) {
      if (error instanceof CredoError) throw error

      throw new CredoDrizzleStorageError(`Error retrieving '${this.recordClass.type}' record with id '${id}'`, {
        cause: error,
      })
    }

    throw new CredoDrizzleStorageError('Unsupported database type')
  }

  public async insert(agentContext: AgentContext, record: CredoRecord) {
    try {
      if (isDrizzlePostgresDatabase(this.database)) {
        // biome-ignore lint/suspicious/noExplicitAny: no explanation
        await this.database.insert(this.table.postgres).values(await this.getValuesWithBase(agentContext, record) as any)
        return
      }

      if (isDrizzleSqliteDatabase(this.database)) {
        // biome-ignore lint/suspicious/noExplicitAny: no explanation
        await this.database.insert(this.table.sqlite).values(await this.getValuesWithBase(agentContext, record) as any)
        return
      }
    } catch (error) {
      if (error instanceof DrizzleQueryError) {
        const sqliteErrorCode = extractSqliteErrorCode(error)
        const postgresErrorCode = extractPostgresErrorCode(error)

        if (
          sqliteErrorCode === DrizzleSqliteErrorCode.SQLITE_CONSTRAINT_PRIMARYKEY ||
          postgresErrorCode === DrizzlePostgresErrorCode.CONSTRAINT_UNIQUE_KEY
        ) {
          throw new RecordDuplicateError(`Record with id '${record.id}' already exists`, {
            recordType: record.type,
            cause: error,
          })
        }
      }

      throw new CredoDrizzleStorageError(`Error saving '${record.type}' record with id '${record.id}'`, {
        cause: error,
      })
    }

    throw new CredoDrizzleStorageError('Unsupported database type')
  }

  public async updateByIdWithLock(
    agentContext: AgentContext,
    id: string,
    updateCallback: (record: CredoRecord) => Promise<CredoRecord>
  ) {
    // SQLite  does not support locking, so there's no need to create a transaction
    if (isDrizzleSqliteDatabase(this.database)) {
      const record = await this.getById(agentContext, id)
      const updatedRecord = await updateCallback(record)
      updatedRecord.updatedAt = new Date()
      await this.update(agentContext, updatedRecord)

      return updatedRecord
    }

    return await this.database.transaction(async (tx) => {
      const record = await this.getById(agentContext, id, tx, true)
      const updatedRecord = await updateCallback(record)
      updatedRecord.updatedAt = new Date()
      await this.update(agentContext, updatedRecord, tx)

      return updatedRecord
    })
  }

  public async update(agentContext: AgentContext, record: CredoRecord, tx?: Transaction<this>) {
    // Although id should always be set, if for some reason it is not set it can be quite impactful
    if (!record.id) {
      throw new CredoDrizzleStorageError(`Record of type ${record.type}' is missing 'id' column.`)
    }

    try {
      if (isDrizzlePostgresDatabase(this.database)) {
        const session = (tx as PgTransaction) ?? this.database
        const updated = await session
          .update(this.table.postgres)
          // biome-ignore lint/suspicious/noExplicitAny: generics really don't play well here
          .set(await this.getValuesWithBase(agentContext, record) as any)
          .where(
            and(
              eq(this.table.postgres.id, record.id),
              eq(this.table.postgres.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .returning({ id: this.table.postgres.id })

        if (updated.length === 0) {
          throw new RecordNotFoundError(`record with id ${record.id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        return
      }

      if (isDrizzleSqliteDatabase(this.database)) {
        const session = (tx as SQLiteTransaction) ?? this.database
        const updated = await session
          .update(this.table.sqlite)
          // biome-ignore lint/suspicious/noExplicitAny: generics really don't play well here
          .set(await this.getValuesWithBase(agentContext, record) as any)
          .where(
            and(
              eq(this.table.sqlite.id, record.id),
              eq(this.table.sqlite.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .returning({
            id: this.table.sqlite.id,
          })

        if (updated.length === 0) {
          throw new RecordNotFoundError(`record with id ${record.id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        return
      }
    } catch (error) {
      if (error instanceof CredoError) throw error

      throw new CredoDrizzleStorageError(`Error updating '${record.type}' record with id '${record.id}'`, {
        cause: error,
      })
    }

    throw new CredoDrizzleStorageError('Unsupported database type')
  }

  public async delete(agentContext: AgentContext, id: string) {
    // Although id should always be set, if for some reason it is not set it can be quite impactful
    if (!id) {
      throw new CredoDrizzleStorageError(`Missing required 'id' for delete.`)
    }

    try {
      if (isDrizzlePostgresDatabase(this.database)) {
        const deleted = await this.database
          .delete(this.table.postgres)
          .where(
            and(
              eq(this.table.postgres.id, id),
              eq(this.table.postgres.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .returning({
            id: this.table.postgres.id,
          })

        if (deleted.length === 0) {
          throw new RecordNotFoundError(`record with id ${id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        return
      }

      if (isDrizzleSqliteDatabase(this.database)) {
        const deleted = await this.database
          .delete(this.table.sqlite)
          .where(
            and(
              eq(this.table.sqlite.id, id),
              eq(this.table.sqlite.contextCorrelationId, agentContext.contextCorrelationId)
            )
          )
          .returning({
            id: this.table.sqlite.id,
          })

        if (deleted.length === 0) {
          throw new RecordNotFoundError(`record with id ${id} not found.`, {
            recordType: this.recordClass.type,
          })
        }

        return
      }
    } catch (error) {
      if (error instanceof CredoError) throw error

      throw new CredoDrizzleStorageError(`Error deleting record '${this.recordClass.type}' with id '${id}'`, {
        cause: error,
      })
    }

    throw new CredoDrizzleStorageError('Unsupported database type')
  }
}
