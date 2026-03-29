export interface UploadResult {
    storageUrl: string;
    storagePath: string;
}
export declare function uploadFileToBucket(buffer: Buffer, originalName: string, userId: string, contentType?: string): Promise<UploadResult>;
export declare function deleteFileFromBucket(storagePath: string): Promise<void>;
export declare function getSignedUrl(storagePath: string, expiresInMs?: number): Promise<string>;
//# sourceMappingURL=googleStorage.d.ts.map