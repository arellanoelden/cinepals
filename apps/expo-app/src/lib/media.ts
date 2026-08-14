import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PickedMedia {
  uri: string;
  contentType: string;
  fileExtension: string;
}

// Matches the backend's presigned-upload cap (media-upload-handler.ts) -
// most web GIFs (Giphy/Tenor) are 1-3MB, so this is enforced client-side too
// for a faster failure than waiting on the S3 round trip.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESS_QUALITY = 0.8;

function isGif(mimeType: string | null | undefined, uri: string): boolean {
  return mimeType === 'image/gif' || uri.toLowerCase().endsWith('.gif');
}

// Picks a single image or GIF from the library. Static images are resized
// (if oversized) and recompressed to JPEG client-side; GIFs are passed
// through as-is (re-encoding through the image manipulator strips
// animation) and just size-capped.
export async function pickReviewMedia(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permission to access photos is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  if (isGif(asset.mimeType, asset.uri)) {
    if ((asset.fileSize ?? 0) > MAX_UPLOAD_BYTES) {
      throw new Error('GIF is too large (max 5MB)');
    }
    return { uri: asset.uri, contentType: 'image/gif', fileExtension: 'gif' };
  }

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width && asset.width > MAX_IMAGE_DIMENSION) {
    context.resize({ width: MAX_IMAGE_DIMENSION, height: null });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: IMAGE_COMPRESS_QUALITY });

  return { uri: saved.uri, contentType: 'image/jpeg', fileExtension: 'jpg' };
}
