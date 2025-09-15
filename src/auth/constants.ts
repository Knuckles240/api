export const jwtConstants = {
  access_token: getEnvVar('ACCESS_TOKEN'),
  access_token_secret: getEnvVar('ACCESS_TOKEN_SECRET'),
  refresh_token: getEnvVar('REFRESH_TOKEN'),
  refresh_token_secret: getEnvVar('REFRESH_TOKEN_SECRET')
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (typeof value !== 'string') {
    throw new Error(`Environment variable ${key} must be a string.`);
  }
  return value;
}

