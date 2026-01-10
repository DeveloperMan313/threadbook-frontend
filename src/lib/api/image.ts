import { PUBLIC_API_ORIGIN } from '$env/static/public';

/**
 * Get image URL
 * @param {string} bucket - image bucket
 * @param {string} filename - image filename
 * @returns {string?} - image URL or undefined if filename is empty
 */
const getImageURL = (bucket: string, filename: string): string | undefined => {
  return filename ? `${PUBLIC_API_ORIGIN}/uploads/${bucket}/${filename}` : undefined;
};

export const ImageApi = {
  /**
   * Get user avatar URL
   * @param {string} filename - avatar filename
   * @returns {string?} - avatar URL or undefined if filename is empty
   */
  getUserAvatarURL(filename: string): string | undefined {
    return getImageURL('avatars', filename);
  },

  /**
   * Get spool banner URL
   * @param {string} filename - banner filename
   * @returns {string?} - banner URL or undefined if filename is empty
   */
  getSpoolBannerURL(filename: string): string | undefined {
    return getImageURL('spools', filename);
  },

  /**
   * Get message attachment URL
   * @param {string} filename - attachment filename
   * @returns {string?} - attachment URL or undefined if filename is empty
   */
  getMessageAttachmentURL(filename: string): string | undefined {
    return getImageURL('files', filename);
  }
};
