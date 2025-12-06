import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

// MinIO Configuration
const MINIO_ENDPOINT = "http://5.189.146.143:9000";
const MINIO_ACCESS_KEY = "T60mfQSAf2yi6HSbAcgJ";
const MINIO_SECRET_KEY = "HKyZIo3J91oSzAhktGnvpEK6RYELQ8UX4E19JptZ";
const MINIO_BUCKET = "loopers";
const MINIO_REGION = "us-east-1"; // MinIO doesn't care about region, but SDK requires it

// Initialize S3 Client for MinIO
const s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: MINIO_REGION,
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
});

export class MinioStorage {
    /**
     * Upload a file to MinIO
     * @param localFilePath - Path to the local file
     * @param minioKey - Object key in MinIO (filename)
     * @returns Promise<string> - The MinIO object URL
     */
    async uploadFile(localFilePath: string, minioKey: string): Promise<string> {
        try {
            const fileStream = fs.createReadStream(localFilePath);
            const fileStats = fs.statSync(localFilePath);

            const uploadParams = {
                Bucket: MINIO_BUCKET,
                Key: minioKey,
                Body: fileStream,
                ContentLength: fileStats.size,
                ContentType: this.getContentType(localFilePath),
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            // Return the public URL
            return `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${minioKey}`;
        } catch (error) {
            console.error("MinIO upload error:", error);
            throw new Error(`Failed to upload to MinIO: ${error}`);
        }
    }

    /**
     * Generate a presigned URL for streaming
     * @param minioKey - Object key in MinIO
     * @param expiresIn - URL expiration time in seconds (default: 2 hours)
     * @returns Promise<string> - Presigned URL
     */
    async getPresignedUrl(minioKey: string, expiresIn: number = 7200): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: minioKey,
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn });
            return url;
        } catch (error) {
            console.error("MinIO presigned URL error:", error);
            throw new Error(`Failed to generate presigned URL: ${error}`);
        }
    }

    /**
     * Delete a file from MinIO
     * @param minioKey - Object key in MinIO
     */
    async deleteFile(minioKey: string): Promise<void> {
        try {
            await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: MINIO_BUCKET,
                    Key: minioKey,
                })
            );
        } catch (error) {
            console.error("MinIO delete error:", error);
            throw new Error(`Failed to delete from MinIO: ${error}`);
        }
    }

    /**
     * Determine content type based on file extension
     */
    private getContentType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            ".mp4": "video/mp4",
            ".mov": "video/quicktime",
            ".mkv": "video/x-matroska",
            ".avi": "video/x-msvideo",
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
}

export const minioStorage = new MinioStorage();
