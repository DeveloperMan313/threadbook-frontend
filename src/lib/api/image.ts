import { PUBLIC_API_ORIGIN } from '$env/static/public';

/**
 * Get image URL
 * @param {string} bucket - image bucket
 * @param {string} filename - image filename
 * @returns {string} - image URL
 */
const getImageURL = (bucket: string, filename: string): string => {
  return `${PUBLIC_API_ORIGIN}/uploads/${bucket}/${filename}`;
}

export const ImageApi = {
  /**
   * Get user avatar URL
   * @param {string} filename - avatar filename
   * @returns {string} - avatar URL
   */
  getUserAvatarURL(filename: string): string {
    return getImageURL('avatars', filename);
  },

  /**
   * Get spool banner URL
   * @param {string} filename - banner filename
   * @returns {string} - banner URL
   */
  getSpoolBannerURL(filename: string): string {
    return getImageURL('uploads', filename);
  }
}
