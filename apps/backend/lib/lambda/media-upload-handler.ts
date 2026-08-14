import { randomUUID } from 'node:crypto';
import type { AppSyncResolverEvent } from 'aws-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

// Matches the GIF-size-cap decision: static images get compressed client-side,
// GIFs are uploaded as-is but capped here so a single upload can't blow past
// a reasonable size (most web GIFs from Giphy/Tenor are 1-3MB).
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PRESIGNED_POST_EXPIRY_SECONDS = 60;
const ALLOWED_EXTENSION = /^[a-z0-9]{1,5}$/i;

const s3Client = new S3Client({});

interface GenerateUploadUrlArgs {
  contentType: string;
  fileExtension: string;
}

interface CognitoIdentity {
  sub: string;
}

export async function handler(event: AppSyncResolverEvent<GenerateUploadUrlArgs>) {
  switch (event.info.fieldName) {
    case 'generateUploadUrl': {
      const { contentType, fileExtension } = event.arguments;
      const { sub } = event.identity as unknown as CognitoIdentity;

      if (!contentType.startsWith('image/')) {
        throw new Error('Only image/* content types are supported for post media');
      }
      const extension = fileExtension.replace(/^\./, '');
      if (!ALLOWED_EXTENSION.test(extension)) {
        throw new Error('Invalid file extension');
      }

      const bucket = process.env.MEDIA_BUCKET_NAME;
      if (!bucket) {
        throw new Error('MEDIA_BUCKET_NAME is not configured');
      }

      const key = `uploads/${sub}/${randomUUID()}.${extension}`;

      const post = await createPresignedPost(s3Client, {
        Bucket: bucket,
        Key: key,
        Fields: { 'Content-Type': contentType },
        Conditions: [['content-length-range', 1, MAX_UPLOAD_BYTES]],
        Expires: PRESIGNED_POST_EXPIRY_SECONDS,
      });

      // AppSync's Lambda response mapping (`$util.toJson`) does its own JSON
      // encoding of the whole return value, including AWSJSON-typed fields -
      // it doesn't know `fields` is meant to already be serialized text. If
      // this were pre-stringified here, that string would be encoded a
      // second time on the way out, and the client would receive a string
      // that itself parses back into another string, not an object.
      // Returning the raw object lets AppSync do that one encoding itself.
      return { url: post.url, key, fields: post.fields };
    }
    default:
      throw new Error(`Unsupported field: ${event.info.fieldName}`);
  }
}
