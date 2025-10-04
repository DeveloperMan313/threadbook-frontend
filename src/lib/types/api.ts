/**
 * Base API response
 */
export interface ApiResponse {
  ok: boolean;
  json: {
    error: string;
  };
}

/**
 * Auth credentials
 */
export interface Credentials {
  username?: string;
  email: string;
  password: string;
}
