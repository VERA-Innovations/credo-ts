import { GenericRecord, JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter, type DrizzleAdapterRecordValues } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import { encryptDataWithKey, decryptDataWithKey, getEncryptionKeyFromAgentContext } from '../../storage/utils/encrypt'
import { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

type DrizzleGenericRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['genericRecord']>

export class DrizzleGenericRecordAdapter extends BaseDrizzleRecordAdapter<
  GenericRecord,
  typeof postgres.genericRecord,
  typeof postgres,
  typeof sqlite.genericRecord,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(database, { postgres: postgres.genericRecord, sqlite: sqlite.genericRecord }, GenericRecord)
  }

  private getModuleConfig(agentContext?: AgentContext): DrizzleStorageModuleConfig | null {
    if (!agentContext) return null

    try {
      return agentContext.resolve(DrizzleStorageModuleConfig)
    } catch (err) {
      return null
    }
  }

  private shouldEncryptColumn(columnName: string, agentContext?: AgentContext): boolean {
    const moduleConfig = this.getModuleConfig(agentContext)
    if (!moduleConfig?.encryptedColumns) return false

    const columnsToEncrypt = moduleConfig.encryptedColumns['GenericRecord'] ?? []
    return columnsToEncrypt.includes(columnName)
  }

  public getValues(record: GenericRecord, agentContext?: AgentContext) {
    let contentValue = record.content

    // Encrypt content if configured
    if (this.shouldEncryptColumn('content', agentContext)) {
      try {
        const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
        const stringValue = JSON.stringify(record.content)
        contentValue = encryptDataWithKey(stringValue, encryptionKey) as never
      } catch (err) {
        // If encryption fails, store as-is
        contentValue = record.content
      }
    }

    // Support encrypting arbitrary string fields (if any added to GenericRecord)
    const result: Record<string, unknown> = {
      content: contentValue,
      customTags: record.getTags() as Record<string, string>,
    }

    // Check for any other string fields that should be encrypted
    const moduleConfig = this.getModuleConfig(agentContext)
    if (moduleConfig?.encryptedColumns['GenericRecord']) {
      const columnsToEncrypt = moduleConfig.encryptedColumns['GenericRecord']
      for (const column of columnsToEncrypt) {
        if (column !== 'content' && column in record) {
          const value = (record as Record<string, unknown>)[column]
          if (typeof value === 'string') {
            try {
              const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
              result[column] = encryptDataWithKey(value, encryptionKey)
            } catch (err) {
              result[column] = value
            }
          }
        }
      }
    }

    return result as any
  }

  public toRecord(values: DrizzleGenericRecordAdapterValues, agentContext?: AgentContext): GenericRecord {
    const { customTags, ...remainingValues } = values
    let content: Record<string, unknown> = {}

    // If content is configured to be encrypted, try to decrypt it
    if (this.shouldEncryptColumn('content', agentContext) && typeof remainingValues.content === 'string') {
      try {
        const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
        const decryptedString = decryptDataWithKey(remainingValues.content, encryptionKey)
        content = JSON.parse(decryptedString)
      } catch (err) {
        console.error('Error decrypting content:', err)
        // If decryption fails, try to parse as regular JSON
        try {
          content = JSON.parse(remainingValues.content)
        } catch (_err) {
          content = {}
        }
      }
    } else if (typeof remainingValues.content === 'string') {
      // Not encrypted, parse as JSON
      try {
        content = JSON.parse(remainingValues.content)
      } catch (_err) {
        content = {}
      }
    } else if (typeof remainingValues.content === 'object' && remainingValues.content !== null) {
      // Already an object (from jsonb column type)
      content = remainingValues.content as Record<string, unknown>
    }

    const record = JsonTransformer.fromJSON({ ...remainingValues, content }, GenericRecord)
    record.setTags(customTags as TagsBase)

    // Decrypt any other string fields that are configured for encryption
    const moduleConfig = this.getModuleConfig(agentContext)
    if (moduleConfig?.encryptedColumns['GenericRecord']) {
      const columnsToEncrypt = moduleConfig.encryptedColumns['GenericRecord']
      for (const column of columnsToEncrypt) {
        if (column !== 'content' && column in record) {
          const value = (record as Record<string, unknown>)[column]
          if (typeof value === 'string') {
            try {
              const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
              const decrypted = decryptDataWithKey(value, encryptionKey)
              (record as Record<string, unknown>)[column] = decrypted
            } catch (err) {
              console.error(`Error decrypting field ${column}:`, err) // TODO: do better error handling/logging strategy
            }
          }
        }
      }
    }

    return record
  }
}

