/**
 * Service that provides the encryption key for DrizzleStorageModule.
 * This can be injected by modules or resolved from the dependency container.
 */
export class EncryptionKeyProvider {
  private encryptionKey: string | undefined

  public constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey
  }

  public getEncryptionKey(): string | undefined {
    return this.encryptionKey
  }

  public setEncryptionKey(key: string): void {
    this.encryptionKey = key
  }

  public hasEncryptionKey(): boolean {
    return !!this.encryptionKey
  }
}
