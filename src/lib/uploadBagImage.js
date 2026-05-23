import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

function randomUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Upload a bag cover image to `bag-images/<merchantId>/<uuid>.jpg`.
 * @param {File} file
 * @param {string} merchantId
 * @returns {Promise<{ publicUrl: string } | { error: string }>}
 */
export async function uploadBagImage(file, merchantId) {
  if (!file || !merchantId) {
    return { error: 'Choose an image and ensure your merchant account is loaded.' };
  }
  if (!file.type?.startsWith('image/')) {
    return { error: 'Please choose an image file (JPEG or PNG).' };
  }

  const supabase = createClient();
  const path = `${merchantId}/${randomUuid()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('bag-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (uploadError) {
    return { error: mapSupabaseError(uploadError, 'Could not upload image.') };
  }

  const { data } = supabase.storage.from('bag-images').getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) {
    return { error: 'Upload succeeded but public URL could not be resolved.' };
  }
  return { publicUrl: `${publicUrl}?t=${Date.now()}` };
}
