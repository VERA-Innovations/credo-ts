import type { CipheringInfo } from "@2060.io/credo-ts-didcomm-media-sharing"
import { BaseRecord, utils } from "@credo-ts/core"

export interface PrivateMediaItem {    
   id: string;  
   uri: string;  
   mimeType: string;  
   description?: string;  
   byteCount?: number;  
   fileName?: string;  
   ciphering?: CipheringInfo;  
   metadata?: Record<string, unknown>;  
}  
  
type DefaultPrivateMediaTags = {  
  userId: string    
}  
  
type CustomPrivateMediaTags = {  
  // File categorization  
  mediaType?: 'image' | 'video' | 'document' | 'audio'  
  // Access control  
  isPublic?: string  
  sharedWith?: string[]  // Array of user IDs  OR DIDComm connection IDs
  // User-defined custom tags  
  customTags?: string[]  // e.g., ['invoice', 'receipt', 'contract']  
}  

type PrivateMediaRecordProps = {
  id? : string
  createdAt? : Date  // Optional, will default to new Date()  
  userId: string
  description? : string
  threadId? : string
  parentThreadId? : string
  items? : PrivateMediaItem[]
  version? : string
  // Note: I think we don't need the media type as it is generated from the item's mime type
  // mediaType? : 'image' | 'video' | 'document' | 'audio'
  isPublic? : string
  sharedWith? : string[]  // Array of user IDs  OR DIDComm connection IDs
  customTags? : string[]
}

export class PrivateMediaRecord extends BaseRecord<DefaultPrivateMediaTags, CustomPrivateMediaTags> {    
  public static readonly type = 'PrivateMediaRecord'    
  public readonly type = PrivateMediaRecord.type  
  
  public userId!: string    
  public threadId?: string
  public description?: string
  public parentThreadId?: string
  public items?: PrivateMediaItem[]    
  public version?: string    
    
  public constructor(props: PrivateMediaRecordProps) {    
    super()    
    if (props) {    
      this.id = props.id ?? utils.uuid()    
      this.createdAt = props.createdAt ?? new Date()  
      this.userId = props.userId
      this.userId = props.userId
      this.threadId = props.threadId ?? utils.uuid()
      this.parentThreadId = props.parentThreadId ?? undefined
      this.description = props.description    
      this.items = props.items ?? []  // Default to empty array
      this.version = String(props.version ?? 1)  // Default to version 1
      this.setTag('isPublic', props.isPublic ?? 'false') 
      if (props.customTags && props.customTags.length > 0) {  
        this.setTag('customTags', props.customTags)  
      }   
    }    
  }    
    
  public getTags() {      
  const baseTags = {      
    userId: this.userId,      
  };  
  
  const dynamicTags: Record<string, unknown> = {};  
    
  if (this.items?.length) {  
    // dynamicTags.itemCount = this.items.length;  
    // dynamicTags.hasItems = true;  
      
    const mediaTypes = [...new Set(this.items.map(item => item.mimeType?.split('/')[0]))];  
    if (mediaTypes.length === 1) {  
      dynamicTags.mediaType = mediaTypes[0];  
    }  
  }  
  
  return { ...this._tags, ...baseTags, ...dynamicTags }      
}

  // Helper method for custom tagging  
  public addCustomTag(tag: string) {  
    const currentTags = this.getTag('customTags') as string[] || [];  
    if (!currentTags.includes(tag)) {  
      this.setTag('customTags', [...currentTags, tag]);  
    }  
  }  
    
  public removeCustomTag(tag: string) {  
    const currentTags = this.getTag('customTags') as string[] || [];  
    this.setTag('customTags', currentTags.filter(t => t !== tag));  
  }  
}