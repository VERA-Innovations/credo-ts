import { type AgentContext, GenericRecord, JsonTransformer, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleGenericRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['genericRecord']>

// export class DrizzleGenericRecordAdapter extends BaseDrizzleRecordAdapter<
//   GenericRecord,
//   typeof postgres.genericRecord,
//   typeof postgres,
//   typeof sqlite.genericRecord,
//   typeof sqlite
// > {
//   public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
//     super(database, { postgres: postgres.genericRecord, sqlite: sqlite.genericRecord }, GenericRecord)
//   }

//   // private getModuleConfig(agentContext?: AgentContext): DrizzleStorageModuleConfig | null {
//   //   if (!agentContext) return null

//   //   try {
//   //     return agentContext.resolve(DrizzleStorageModuleConfig)
//   //   } catch (_err) {
//   //     return null
//   //   }
//   // }

//   // private shouldEncryptColumn(columnName: string, agentContext?: AgentContext): boolean {
//   //   const moduleConfig = this.getModuleConfig(agentContext)
//   //   if (!moduleConfig?.encryptedColumns) return false

//   //   const columnsToEncrypt = moduleConfig.encryptedColumns.GenericRecord ?? []
//   //   return columnsToEncrypt.includes(columnName)
//   // }

//   // private columnsToBeEncrypted(agentContext?: AgentContext): string[] {
//   //   const moduleConfig = this.getModuleConfig(agentContext)
//   //   if (!moduleConfig?.encryptedColumns) return []

//   //   const columnsToEncrypt = moduleConfig.encryptedColumns.GenericRecord ?? []
//   //   return columnsToEncrypt
//   // }

//   public getValues(record: GenericRecord, agentContext?: AgentContext) {
//     let contentValue = record.content

//     // Encrypt content if configured
//     if (this.shouldEncryptColumn('content', agentContext)) {
//       try {
//         // biome-ignore lint/style/noNonNullAssertion: <explanation>
//         const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
//         const stringValue = JSON.stringify(record.content)
//         contentValue = encryptDataWithKey(stringValue, encryptionKey) as never
//       } catch (_err) {
//         // If encryption fails, store as-is
//         contentValue = record.content
//       }
//     }

//     // Support encrypting arbitrary string fields (if any added to GenericRecord)
//     const result: Record<string, unknown> = {
//       content: contentValue,
//       customTags: record.getTags() as Record<string, string>,
//     }

//     // Check for any other string fields that should be encrypted
//     const moduleConfig = this.getModuleConfig(agentContext)
//     if (moduleConfig?.encryptedColumns.GenericRecord) {
//       const columnsToEncrypt = moduleConfig.encryptedColumns.GenericRecord
//       for (const column of columnsToEncrypt) {
//         if (column !== 'content' && column in record) {
//           const value = (record as unknown as Record<string, unknown>)[column]
//           if (typeof value === 'string') {
//             try {
//               // biome-ignore lint/style/noNonNullAssertion: <explanation>
//               const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
//               result[column] = encryptDataWithKey(value, encryptionKey)
//             } catch (_err) {
//               result[column] = value
//             }
//           }
//         }
//       }
//     }

//     return result as any
//   }

//   public toRecord(values: DrizzleGenericRecordAdapterValues, agentContext?: AgentContext): GenericRecord {
//     const { customTags, ...remainingValues } = values
//     let content: Record<string, unknown> = {}

//     // If content is configured to be encrypted, try to decrypt it
//     if (this.shouldEncryptColumn('content', agentContext) && typeof remainingValues.content === 'string') {
//       try {
//         // biome-ignore lint/style/noNonNullAssertion: <explanation>
//         const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
//         const decryptedString = decryptDataWithKey(remainingValues.content, encryptionKey)
//         content = JSON.parse(decryptedString)
//       } catch (_err) {
//         // If decryption fails, try to parse as regular JSON
//         try {
//           content = JSON.parse(remainingValues.content)
//         } catch (_err) {
//           content = {}
//         }
//       }
//     } else if (typeof remainingValues.content === 'string') {
//       // Not encrypted, parse as JSON
//       try {
//         content = JSON.parse(remainingValues.content)
//       } catch (_err) {
//         content = {}
//       }
//     } else if (typeof remainingValues.content === 'object' && remainingValues.content !== null) {
//       // Already an object (from jsonb column type)
//       content = remainingValues.content as Record<string, unknown>
//     }

//     const record = JsonTransformer.fromJSON({ ...remainingValues, content }, GenericRecord)
//     record.setTags(customTags as TagsBase)

//     // Decrypt any other string fields that are configured for encryption
//     const moduleConfig = this.getModuleConfig(agentContext)
//     if (moduleConfig?.encryptedColumns.GenericRecord) {
//       const columnsToEncrypt = moduleConfig.encryptedColumns.GenericRecord
//       for (const column of columnsToEncrypt) {
//         if (column !== 'content' && column in record) {
//           const value = (record as unknown as Record<string, unknown>)[column]
//           if (typeof value === 'string') {
//             try {
//               // biome-ignore lint/style/noNonNullAssertion: <explanation>
//               const encryptionKey = getEncryptionKeyFromAgentContext(agentContext!)
//               const decrypted = decryptDataWithKey(value, encryptionKey)

//               ;(record as unknown as Record<string, unknown>)[column] = decrypted
//             } catch (err) {
//               agentContext?.config.logger.error(`Error decrypting field ${column}:`, err) // TODO: do better error handling/logging strategy
//             }
//           }
//         }
//       }
//     }

//     return record
//   }
// }

export class DrizzleGenericRecordAdapter extends BaseDrizzleRecordAdapter<
  GenericRecord,
  typeof postgres.genericRecord,
  typeof postgres,
  typeof sqlite.genericRecord,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.genericRecord, sqlite: sqlite.genericRecord }, GenericRecord, [
      // Add additional fields that need to be excluded from encryption at all
    ], config)
  }

  public getValues(record: GenericRecord, agentContext?: AgentContext) {
    const dbValues = this.prepareValuesForDb(record, agentContext);

    // Add any specific mappings unique to this adapter (like tags)
    return {
      ...dbValues,
      customTags: record.getTags() as Record<string, string>,
    } as any;
  }

  public toRecord(values: DrizzleGenericRecordAdapterValues, agentContext?: AgentContext): GenericRecord {
    const { customTags, ...remainingValues } = values;

    // prepareRecordFromDb handles all decryption and string-to-object conversion
    const decryptedValues = this.prepareRecordFromDb(remainingValues, agentContext);

    const record = JsonTransformer.fromJSON(decryptedValues, GenericRecord);
    record.setTags(customTags as TagsBase);

    return record;
  }
}