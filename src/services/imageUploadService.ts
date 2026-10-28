import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  isFallbackDataUrl?: boolean;
  error?: string;
}

/**
 * Resizes and compresses an image file in the browser using HTML5 Canvas.
 * Produces a lightweight JPEG (typically 20KB-40KB) ensuring instant uploads
 * and seamless fallback persistence in Firestore.
 */
export function compressAndResizeImage(
  file: File,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (JPG, PNG, or WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The selected file could not be parsed as an image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context is unavailable.'));
          return;
        }

        // Draw and compress image
        ctx.fillStyle = '#141923';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve({ blob: file, dataUrl });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a profile avatar with a strict 4-second timeout.
 * If Firebase Storage is unprovisioned, blocked by CORS, or times out,
 * it safely falls back to the compressed base64 DataURL so the avatar
 * is immediately saved in the user profile without freezing the UI.
 */
export async function uploadAvatarSafely(userId: string, file: File): Promise<ImageUploadResult> {
  try {
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be under 10MB.' };
    }

    // 1. Client-side compression
    const { blob, dataUrl } = await compressAndResizeImage(file, 360, 360, 0.85);

    // 2. Try Firebase Storage with 4000ms timeout
    try {
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_avatar.jpg`);
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage connection timed out')), 4000)
      );

      const uploadTask = (async () => {
        const snapshot = await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        return await getDownloadURL(snapshot.ref);
      })();

      const storageUrl = await Promise.race([uploadTask, timeoutPromise]);
      return { success: true, url: storageUrl, isFallbackDataUrl: false };
    } catch (storageErr: any) {
      console.warn('Firebase Storage upload failed or timed out. Using compressed Data URL fallback:', storageErr?.message || storageErr);
      return { success: true, url: dataUrl, isFallbackDataUrl: true };
    }
  } catch (err: any) {
    console.error('Fatal avatar compression/upload error:', err);
    return { success: false, error: err?.message || 'Failed to process image file.' };
  }
}
