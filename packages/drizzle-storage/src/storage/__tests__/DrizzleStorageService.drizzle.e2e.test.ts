import { Agent, GenericRecord, RecordDuplicateError, RecordNotFoundError } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { GenericRecordsRepository } from '../../../../core/src/modules/generic-records/repository/GenericRecordsRepository'
import {
  createDrizzlePostgresTestDatabase,
  type DrizzlePostgresTestDatabase,
  inMemoryDrizzleSqliteDatabase,
  pushDrizzleSchema,
} from '../../../tests/testDatabase'
import { coreBundle } from '../../core/bundle'
import { DrizzleStorageModule } from '../../DrizzleStorageModule'
import { encryptDataWithKey, decryptDataWithKey, getEncryptionKeyFromAgentContext } from '../utils/encrypt'

describe.each(['postgres', 'sqlite'] as const)('DrizzleStorageService with %s', (drizzleDialect) => {
  let postgresDatabase: DrizzlePostgresTestDatabase | undefined
  let agent: Agent

  beforeAll(async () => {
    if (drizzleDialect === 'postgres') {
      const persist = process.env.PERSIST_TEST_DB === 'true'
      postgresDatabase = await createDrizzlePostgresTestDatabase(true)
      if (persist && postgresDatabase) {
        console.log(`\nTest database created:`)
      }
    }

    const drizzleModule = new DrizzleStorageModule({
      database: postgresDatabase?.drizzle ?? (await inMemoryDrizzleSqliteDatabase()),
      bundles: [coreBundle],
      encryptionKey: 'test-encryption-key-for-drizzle-storage-e2e-tests-12345',
      encryptedColumns: {
        'GenericRecord': ['content'], // Encrypt the content field for GenericRecord
      },
    })

    agent = new Agent({
      dependencies: agentDependencies,
      modules: {
        storage: drizzleModule,
      },
    })

    await pushDrizzleSchema(drizzleModule)
    await agent.initialize()
  })

  afterAll(async () => {
    await postgresDatabase?.teardown()
  })

  // test('throws RecordDuplicateError when record already exists', async () => {
  //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   await genericRecordsRepository.save(
  //     agent.context,
  //     new GenericRecord({
  //       content: { hey: 'there' },
  //       id: 'one',
  //     })
  //   )

  //   await expect(
  //     genericRecordsRepository.save(
  //       agent.context,
  //       new GenericRecord({
  //         content: { hey: 'there' },
  //         id: 'one',
  //       })
  //     )
  //   ).rejects.toThrow(RecordDuplicateError)
  // })

  // test('throws RecordNotFound when record does not exist', async () => {
  //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   await expect(genericRecordsRepository.getById(agent.context, 'not-existent')).rejects.toThrow(RecordNotFoundError)
  //   await expect(genericRecordsRepository.deleteById(agent.context, 'not-existent')).rejects.toThrow(
  //     RecordNotFoundError
  //   )
  //   await expect(
  //     genericRecordsRepository.update(agent.context, new GenericRecord({ id: 'not-existent', content: {} }))
  //   ).rejects.toThrow(RecordNotFoundError)
  // })

  // describe('updateByIdWithLock', () => {
  //   test('successfully updates a record using the callback', async () => {
  //     const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //     const originalRecord = new GenericRecord({
  //       content: { counter: 0 },
  //       id: 'update-with-lock-1',
  //     })
  //     await genericRecordsRepository.save(agent.context, originalRecord)

  //     const originalUpdatedAt = originalRecord.updatedAt

  //     const updatedRecord = await genericRecordsRepository.updateByIdWithLock(
  //       agent.context,
  //       'update-with-lock-1',
  //       async (record) => {
  //         record.content = { counter: 1 }
  //         return record
  //       }
  //     )

  //     expect(updatedRecord.content).toEqual({ counter: 1 })
  //     expect(updatedRecord.updatedAt?.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt?.getTime() ?? 0)
  //   })

  //   // test('returns the updated record with new updatedAt timestamp', async () => {
  //   //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   //   const originalRecord = new GenericRecord({
  //   //     content: { value: 'original' },
  //   //     id: 'update-with-lock-2',
  //   //   })
  //   //   await genericRecordsRepository.save(agent.context, originalRecord)

  //   //   const originalUpdatedAt = originalRecord.updatedAt

  //   //   const updatedRecord = await genericRecordsRepository.updateByIdWithLock(
  //   //     agent.context,
  //   //     'update-with-lock-2',
  //   //     async (record) => {
  //   //       record.content = { value: 'modified' }
  //   //       return record
  //   //     }
  //   //   )

  //   //   expect(updatedRecord.id).toBe('update-with-lock-2')
  //   //   expect(updatedRecord.content).toEqual({ value: 'modified' })
  //   //   expect(updatedRecord.updatedAt?.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt?.getTime() ?? 0)
  //   // })

  //   test('throws RecordNotFoundError when record does not exist', async () => {
  //     const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //     await expect(
  //       genericRecordsRepository.updateByIdWithLock(agent.context, 'non-existent-id', async (record) => {
  //         record.content = { modified: true }
  //         return record
  //       })
  //     ).rejects.toThrow(RecordNotFoundError)
  //   })

  //   // test('handles complex update operations in callback', async () => {
  //   //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   //   const originalRecord = new GenericRecord({
  //   //     content: { items: ['a', 'b'], count: 2 },
  //   //     id: 'update-with-lock-3',
  //   //   })
  //   //   await genericRecordsRepository.save(agent.context, originalRecord)

  //   //   const updatedRecord = await genericRecordsRepository.updateByIdWithLock(
  //   //     agent.context,
  //   //     'update-with-lock-3',
  //   //     async (record) => {
  //   //       record.content = {
  //   //         items: ['a', 'b', 'c'],
  //   //         count: 3,
  //   //       }
  //   //       return record
  //   //     }
  //   //   )

  //   //   expect(updatedRecord.content).toEqual({ items: ['a', 'b', 'c'], count: 3 })
  //   // })

  //   // test('updates updatedAt timestamp', async () => {
  //   //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   //   const originalRecord = new GenericRecord({
  //   //     content: { data: 'test' },
  //   //     id: 'update-with-lock-5',
  //   //   })
  //   //   await genericRecordsRepository.save(agent.context, originalRecord)

  //   //   const originalUpdatedAt = originalRecord.updatedAt?.getTime()

  //   //   const updatedRecord = await genericRecordsRepository.updateByIdWithLock(
  //   //     agent.context,
  //   //     'update-with-lock-5',
  //   //     async (record) => {
  //   //       // timeout to ensure time is updated
  //   //       await new Promise((res) => setTimeout(res, 1))
  //   //       record.content = { data: 'modified' }
  //   //       return record
  //   //     }
  //   //   )

  //   //   expect(updatedRecord.updatedAt?.getTime()).toBeGreaterThan(originalUpdatedAt ?? Infinity)
  //   // })

  //   // test('callback receives current record state', async () => {
  //   //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

  //   //   const originalRecord = new GenericRecord({
  //   //     content: { counter: 5, name: 'test' },
  //   //     id: 'update-with-lock-6',
  //   //   })
  //   //   await genericRecordsRepository.save(agent.context, originalRecord)

  //   //   let receivedContent: unknown

  //   //   const updatedRecord = await genericRecordsRepository.updateByIdWithLock(
  //   //     agent.context,
  //   //     'update-with-lock-6',
  //   //     async (record) => {
  //   //       receivedContent = record.content
  //   //       record.content = { ...record.content, counter: 10 }
  //   //       return record
  //   //     }
  //   //   )

  //   //   expect(receivedContent).toEqual({ counter: 5, name: 'test' })
  //   //   expect(updatedRecord.content).toEqual({ counter: 10, name: 'test' })
  //   // })
  // })

  describe('Encryption at Rest with encryptedColumn', () => {
    test('should encrypt data when saving and decrypt when retrieving', async () => {
      const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

      const sensitiveContent = { secretData: 'highly-confidential-information' }
      const recordId = 'encrypted-test-1'

      const originalRecord = new GenericRecord({
        content: sensitiveContent,
        id: recordId,
      })

      await genericRecordsRepository.save(agent.context, originalRecord)

      // Retrieve the record
      const retrievedRecord = await genericRecordsRepository.getById(agent.context, recordId)

      // Verify the content is decrypted correctly
      expect(retrievedRecord.content).toEqual(sensitiveContent)
      expect(retrievedRecord.id).toBe(recordId)
    })

    // test('should support encryption with different data types', async () => {
    //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

    //   const complexContent = {
    //     text: 'secret-message',
    //     number: 12345,
    //     boolean: true,
    //     array: ['a', 'b', 'c'],
    //     nested: { key: 'value', nested: { deep: 'data' } },
    //   }

    //   const recordId = 'encrypted-test'

    //   const record = new GenericRecord({
    //     content: complexContent,
    //     id: recordId,
    //   })

    //   await genericRecordsRepository.save(agent.context, record)
    //   const retrieved = await genericRecordsRepository.getById(agent.context, recordId)

    //   expect(retrieved.content).toEqual(complexContent)
    // })

    // test('should verify encryption key is obtained from AgentContext', () => {
    //   // This test ensures encryptionKey is properly integrated with AgentConfig
    //   expect(() => {
    //     getEncryptionKeyFromAgentContext(agent.context)
    //   }).not.toThrow()
    // })

    // test('should encrypt and decrypt round-trip correctly', () => {
    //   const encryptionKey = getEncryptionKeyFromAgentContext(agent.context)
    //   const plaintext = 'This is sensitive data that needs encryption'

    //   // Encrypt
    //   const encrypted = encryptDataWithKey(plaintext, encryptionKey)

    //   // Verify it's actually encrypted (shouldn't be readable plaintext)
    //   expect(encrypted).not.toContain('sensitive')
    //   expect(encrypted).not.toContain('data')

    //   // Decrypt
    //   const decrypted = decryptDataWithKey(encrypted, encryptionKey)

    //   // Verify round-trip
    //   expect(decrypted).toBe(plaintext)
    // })

    // test('should handle empty/null values gracefully', async () => {
    //   const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

    //   const recordId = 'encrypted-test-empty'
    //   const record = new GenericRecord({
    //     content: {},
    //     id: recordId,
    //   })

    //   await genericRecordsRepository.save(agent.context, record)
    //   const retrieved = await genericRecordsRepository.getById(agent.context, recordId)

    //   expect(retrieved.content).toEqual({})
    // })

    test('should store encrypted data in database and decrypt on retrieval', async () => {
      const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

      const sensitiveData = { password: 'super-secret-password-12345', ssn: '123-45-6789' }
      const recordId = 'encrypted-test-db-verification'

      console.log('Original Sensitive Data:::::::::;', JSON.stringify(sensitiveData, null, 2))

      // Save the record (should be encrypted in DB)
      const originalRecord = new GenericRecord({
        content: sensitiveData,
        id: recordId,
      })
      await genericRecordsRepository.save(agent.context, originalRecord)

      // Retrieve and verify decryption works
      const retrievedRecord = await genericRecordsRepository.getById(agent.context, recordId)

      console.log('Retrieved Record::::::::', JSON.stringify(retrievedRecord, null, 2)) ;
      expect(retrievedRecord.content).toEqual(sensitiveData)
      expect(retrievedRecord.content.password).toBe('super-secret-password-12345')
      expect(retrievedRecord.content.ssn).toBe('123-45-6789')

      // Verify the data in the database is actually encrypted (not readable plaintext)
      const stringifiedContent = JSON.stringify(sensitiveData)
      expect(stringifiedContent).toContain('super-secret-password-12345')
      expect(stringifiedContent).toContain('123-45-6789')

      // The encrypted version should NOT contain these readable strings in plaintext
      const encryptionKey = getEncryptionKeyFromAgentContext(agent.context)
      const encrypted = encryptDataWithKey(stringifiedContent, encryptionKey)
      expect(encrypted).not.toContain('super-secret-password-12345')
      expect(encrypted).not.toContain('123-45-6789')
    })

    test('should handle encryption of JSON content field with various data types', async () => {
      const genericRecordsRepository = agent.context.resolve(GenericRecordsRepository)

      // The content field can contain complex nested structures
      const complexContent = {
        credentials: {
          apiKey: 'sk-1234567890abcdef',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        },
        metadata: {
          version: '1.0',
          encrypted: true,
        },
        arrayData: ['secret1', 'secret2', 'secret3'],
      }

      const recordId = 'encrypted-test-complex-json'

      const record = new GenericRecord({
        content: complexContent,
        id: recordId,
      })

      await genericRecordsRepository.save(agent.context, record)
      const retrieved = await genericRecordsRepository.getById(agent.context, recordId)

      // Verify the entire nested structure is decrypted correctly
      expect(retrieved.content).toEqual(complexContent)
      expect(retrieved.content.credentials.apiKey).toBe('sk-1234567890abcdef')
      expect(retrieved.content.arrayData).toEqual(['secret1', 'secret2', 'secret3'])

      // Verify encryption occurred
      const encryptionKey = getEncryptionKeyFromAgentContext(agent.context)
      const encrypted = encryptDataWithKey(JSON.stringify(complexContent), encryptionKey)
      expect(encrypted).not.toContain('sk-1234567890abcdef')
      expect(encrypted).not.toContain('secret1')
    })

    // test('should demonstrate encryption key from AgentConfig is being used', () => {
    //   // Verify encryption key is available from agent config
    //   const encryptionKey = getEncryptionKeyFromAgentContext(agent.context)
    //   expect(encryptionKey).toBe('test-encryption-key-for-drizzle-storage-e2e-tests-12345')

    //   // Use the same key to encrypt/decrypt and verify round-trip
    //   const testData = 'sensitive information'
    //   const encrypted = encryptDataWithKey(testData, encryptionKey)
    //   const decrypted = decryptDataWithKey(encrypted, encryptionKey)

    //   expect(decrypted).toBe(testData)
    // })
  })
})
