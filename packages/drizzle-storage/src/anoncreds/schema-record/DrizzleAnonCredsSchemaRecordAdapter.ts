import { AnonCredsSchemaRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsSchemaAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['anonCredsSchema']>

export class DrizzleAnonCredsSchemaRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsSchemaRecord,
  typeof postgres.anonCredsSchema,
  typeof postgres,
  typeof sqlite.anonCredsSchema,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.anonCredsSchema, sqlite: sqlite.anonCredsSchema }, AnonCredsSchemaRecord, [], config)
  }

  public async getValues(record: AnonCredsSchemaRecord, agentContext?: AgentContext) {
    const { schemaId, issuerId, schemaName, schemaVersion, methodName, unqualifiedSchemaId, ...customTags } =
      record.getTags()

    const { issuerId: _, name: __, version: ___, ...restSchema } = record.schema

    const rawValues = {
      schemaId,
      schema: restSchema,
      issuerId,
      schemaName,
      schemaVersion,
      methodName,
      unqualifiedSchemaId,
    }

    // Await encryption/stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleAnonCredsSchemaAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsSchemaRecord> {
    const { customTags, unqualifiedSchemaId, issuerId, schemaName, schemaVersion, ...remainingValues } = values

    // Await decryption/parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(
      {
        ...decryptedValues,
        schema: {
          ...decryptedValues.schema,
          issuerId,
          name: schemaName,
          version: schemaVersion
        }
      },
      AnonCredsSchemaRecord
    )

    record.setTags({
      ...customTags as TagsBase,
      unqualifiedSchemaId: unqualifiedSchemaId ?? undefined,
    })

    return record
  }
}
