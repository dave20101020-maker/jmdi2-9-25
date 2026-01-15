export type GoogleTokenPayload = {
  accessToken?: string;
  refreshToken?: string;
};

export function getAuthUrl(): string {
  return "";
}

export async function exchangeCode(_code: string): Promise<GoogleTokenPayload> {
  return {};
}

export function storeTokens(_userId: string, _tokens: GoogleTokenPayload) {
  return;
}

export function getStatus(_userId: string) {
  return { connected: false };
}
