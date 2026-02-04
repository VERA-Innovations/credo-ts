import type {
  AgentContext,
  BaseRecord,
  BaseRecordConstructor,
  Query,
  QueryOptions,
  StorageService,
} from '@credo-ts/core'
import { injectable } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../adapter/BaseDrizzleRecordAdapter'
import { DrizzleStorageModuleConfig } from '../DrizzleStorageModuleConfig'
import { CredoDrizzleStorageError } from '../error/CredoDrizzleStorageError'
import { decryptBasicMessageContent, encryptBasicMessageContent } from './utils/encrypt'

@injectable()
export class DrizzleStorageService<T extends BaseRecord> implements StorageService<T> {
  public readonly supportsCursorPagination = true

  public constructor(public config: DrizzleStorageModuleConfig) {}

  private getAdapterForRecordType(recordType: string) {
    const adapter = this.config.adapters.find((adapter) => adapter.recordClass.type === recordType)
    if (!adapter) {
      throw new CredoDrizzleStorageError(
        `Could not find a registered drizzle adapter for record type '${recordType}'. Make sure to register the record type in the DrizzleStorageModule.`
      )
    }

    // biome-ignore lint/suspicious/noExplicitAny: no explanation
    return adapter as BaseDrizzleRecordAdapter<T, any, any, any, any>
  }

  public async save(agentContext: AgentContext, record: T): Promise<void> {
    record.createdAt = record.createdAt ?? new Date()
    // Triage: For some reason this would give error when storing the connection record
    // Probably need to add it in credo-main branch
    // Als, the logic makes more sense to use current time stamp then to take `createdAt`
    record.updatedAt = new Date()

    
    if (record.type === 'BasicMessageRecord') {
      (record as any).content = await encryptBasicMessageContent(agentContext, (record as any).content)
    }

    const adapter = this.getAdapterForRecordType(record.type)
    await adapter.insert(agentContext, record)
  }

  public async update(agentContext: AgentContext, record: T): Promise<void> {
    record.updatedAt = new Date()

    if (record.type === 'BasicMessageRecord') {
      (record as any).content = await encryptBasicMessageContent(agentContext, (record as any).content)
    }

    const adapter = this.getAdapterForRecordType(record.type)
    await adapter.update(agentContext, record)
  }

  /**
   * Update the record by id with a lock based on the value returned in `updateCallback`.
   *
   * NOTE that this has no effect when SQLite is used, as SQLite does not support row level
   * locking
   */
  public async updateByIdWithLock(
    agentContext: AgentContext,
    recordClass: BaseRecordConstructor<T>,
    id: string,
    updateCallback: (record: T) => Promise<T>
  ): Promise<T> {
    const adapter = this.getAdapterForRecordType(recordClass.type)
    const updatedRecord = await adapter.updateByIdWithLock(agentContext, id, updateCallback)
    return updatedRecord
  }

  public async delete(agentContext: AgentContext, record: T): Promise<void> {
    const adapter = this.getAdapterForRecordType(record.type)
    await adapter.delete(agentContext, record.id)
  }

  public async deleteById(
    agentContext: AgentContext,
    recordClass: BaseRecordConstructor<T>,
    id: string
  ): Promise<void> {
    const adapter = this.getAdapterForRecordType(recordClass.type)

    await adapter.delete(agentContext, id)
  }

  public async getById(agentContext: AgentContext, recordClass: BaseRecordConstructor<T>, id: string): Promise<T> {
    const adapter = this.getAdapterForRecordType(recordClass.type)

    const record = await adapter.getById(agentContext, id)
    if (record.type === 'BasicMessageRecord') {
      (record as any).content = await decryptBasicMessageContent(agentContext, (record as any).content)
    }
    return record
  }

  public async getAll(agentContext: AgentContext, recordClass: BaseRecordConstructor<T>): Promise<T[]> {
    const adapter = this.getAdapterForRecordType(recordClass.type)

    const records = await adapter.query(agentContext)

    if (recordClass.type === 'BasicMessageRecord' && records.length > 0) {
      for (const record of records) {
        (record as any).content = await decryptBasicMessageContent(agentContext, (record as any).content)
      }
    }

    return records
  }

  public async findByQuery(
    agentContext: AgentContext,
    recordClass: BaseRecordConstructor<T>,
    query: Query<T>,
    queryOptions?: QueryOptions
  ): Promise<T[]> {
    const adapter = this.getAdapterForRecordType(recordClass.type)

    const records = await adapter.query(agentContext, query, queryOptions)
    if (recordClass.type === 'BasicMessageRecord' && records.length > 0) {
      for (const record of records) {
        (record as any).content = await decryptBasicMessageContent(agentContext, (record as any).content)
      }
    }
    return records
  }
}
