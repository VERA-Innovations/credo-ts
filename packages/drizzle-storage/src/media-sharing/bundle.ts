import { didcommMediaSharingDrizzleRecord } from './media-sharing-record'
import { bundleMigrationDefinition } from '../util'
import type { DrizzleRecordBundle } from '../DrizzleRecord'

export const mediaSharingBundle = {
  name: 'media-sharing',
  records: [didcommMediaSharingDrizzleRecord],
  migrations: bundleMigrationDefinition('media-sharing'),
} as const satisfies DrizzleRecordBundle
