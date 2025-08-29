export async function handler(event) {
  const tenant = (event.queryStringParameters?.tenant || "").trim() || "unknown";
  return { statusCode: 200, body: `pong — tenant=${tenant}` };
}
