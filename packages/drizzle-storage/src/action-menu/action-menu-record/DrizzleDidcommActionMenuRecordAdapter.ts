import { type ActionMenuOptions, ActionMenuRecord, type ActionMenuSelectionOptions } from '@credo-ts/action-menu'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter, } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommActionMenuAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommActionMenu']>
export class DrizzleDidcommActionMenuRecordAdapter extends BaseDrizzleRecordAdapter<
  ActionMenuRecord,
  typeof postgres.didcommActionMenu,
  typeof postgres,
  typeof sqlite.didcommActionMenu,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.didcommActionMenu, sqlite: sqlite.didcommActionMenu }, ActionMenuRecord, [], config)
  }

  public async getValues(record: ActionMenuRecord, agentContext?: AgentContext) {
    const { role, connectionId, threadId, ...customTags } = record.getTags()
    // If encryption enabled, create migration for those packages

    const rawValues = {
      role,
      threadId,
      connectionId,
      state: record.state,
      menu: record.menu ? (JsonTransformer.toJSON(record.menu) as ActionMenuOptions) : null,
      performedAction: record.performedAction
        ? (JsonTransformer.toJSON(record.performedAction) as ActionMenuSelectionOptions)
        : null,
      customTags,
    }

    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)
    return {
      ...processedValues,
      customTags: customTags,
    } as DrizzleDidcommActionMenuAdapterValues
  }

  public async toRecord(values: DrizzleDidcommActionMenuAdapterValues, agentContext?: AgentContext): Promise<ActionMenuRecord> {
    const { customTags, ...remainingValues } = values

    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)
    
    const record = JsonTransformer.fromJSON(decryptedValues, ActionMenuRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
