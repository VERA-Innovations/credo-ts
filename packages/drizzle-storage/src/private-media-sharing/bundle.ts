import { didcommPrivateMediaSharingDrizzleRecord } from './private-media-sharing-record'
import { bundleMigrationDefinition } from '../util'
import type { DrizzleRecordBundle } from '../DrizzleRecord'

export const privateMediaSharingBundle = {
  name: 'private-media-sharing',
  records: [didcommPrivateMediaSharingDrizzleRecord],
  migrations: bundleMigrationDefinition('private-media-sharing'),
} as const satisfies DrizzleRecordBundle
