import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'

import { QuestionAnswerRecord } from '@credo-ts/question-answer'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommQuestionAnswerAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommQuestionAnswer']>

export class DrizzleDidcommQuestionAnswerRecordAdapter extends BaseDrizzleRecordAdapter<
  QuestionAnswerRecord,
  typeof postgres.didcommQuestionAnswer,
  typeof postgres,
  typeof sqlite.didcommQuestionAnswer,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommQuestionAnswer, sqlite: sqlite.didcommQuestionAnswer },
      QuestionAnswerRecord,
      [],
      config
    )
  }

  public async getValues(record: QuestionAnswerRecord, agentContext?: AgentContext) {
    const { connectionId, role, state, threadId, ...customTags } = record.getTags()

    const rawValues = {
      state,
      role,
      connectionId,
      threadId,

      questionText: record.questionText,
      questionDetail: record.questionDetail,
      validResponses: record.validResponses,
      signatureRequired: record.signatureRequired,
      response: record.response,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommQuestionAnswerAdapterValues,
    agentContext?: AgentContext
  ): Promise<QuestionAnswerRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, QuestionAnswerRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
