export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      GOOGLE_OAUTH_CLIENT_ID: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      SECRET_ENC_KEY: !!process.env.SECRET_ENC_KEY
    })
  };
}
