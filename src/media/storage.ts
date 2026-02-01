import { SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { StoredMedia, MediaStorageOptions } from './types';
import { getSupabaseServiceClient } from '../utils/supabase';

const DEFAULT_BUCKET = 'media';

export class MediaStorage {
  private supabase: SupabaseClient;
  private defaultBucket: string;

  constructor(defaultBucket?: string) {
    this.supabase = getSupabaseServiceClient();
    this.defaultBucket = defaultBucket || DEFAULT_BUCKET;
  }

  /**
   * Ensure the storage bucket exists
   */
  async ensureBucket(bucketName?: string): Promise<void> {
    const bucket = bucketName || this.defaultBucket;

    const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const exists = buckets?.some(b => b.name === bucket);

    if (!exists) {
      const { error: createError } = await this.supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });

      if (createError && !createError.message.includes('already exists')) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
    }
  }

  /**
   * Upload a file from local path to Supabase storage
   */
  async uploadFile(
    localPath: string,
    options: MediaStorageOptions = { bucket: this.defaultBucket }
  ): Promise<StoredMedia> {
    const bucket = options.bucket || this.defaultBucket;
    const folder = options.folder || '';

    // Ensure bucket exists
    await this.ensureBucket(bucket);

    // Read file
    const fileBuffer = fs.readFileSync(localPath);
    const fileName = path.basename(localPath);
    const ext = path.extname(localPath).toLowerCase();

    // Determine content type
    const contentType = this.getContentType(ext);

    // Generate storage path with timestamp
    const timestamp = Date.now();
    const storagePath = folder
      ? `${folder}/${timestamp}-${fileName}`
      : `${timestamp}-${fileName}`;

    // Upload to Supabase
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      path: storagePath,
      bucket,
      size: fileBuffer.length,
      contentType,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload a buffer directly to Supabase storage
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    options: MediaStorageOptions = { bucket: this.defaultBucket }
  ): Promise<StoredMedia> {
    const bucket = options.bucket || this.defaultBucket;
    const folder = options.folder || '';

    await this.ensureBucket(bucket);

    const ext = path.extname(fileName).toLowerCase();
    const contentType = this.getContentType(ext);

    const timestamp = Date.now();
    const storagePath = folder
      ? `${folder}/${timestamp}-${fileName}`
      : `${timestamp}-${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload buffer: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      path: storagePath,
      bucket,
      size: buffer.length,
      contentType,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string, bucket?: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket || this.defaultBucket)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600, bucket?: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket || this.defaultBucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string = '', bucket?: string): Promise<{ name: string; size: number; createdAt: string }[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket || this.defaultBucket)
      .list(folder);

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return (data || []).map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at,
    }));
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.gif': 'image/gif',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };

    return types[ext] || 'application/octet-stream';
  }
}

export function createMediaStorage(defaultBucket?: string): MediaStorage {
  return new MediaStorage(defaultBucket);
}
