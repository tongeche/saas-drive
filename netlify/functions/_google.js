import { google } from "googleapis";

export function getGoogleClients(subjectEmail) {
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents"
    ],
    subject: subjectEmail || undefined,
  });
  return {
    sheets: google.sheets({ version: "v4", auth }),
    drive:  google.drive({ version: "v3", auth }),
    docs:   google.docs({ version: "v1", auth }),
  };
}

export function getGoogleClientsWithUser(refresh_token) {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oAuth2.setCredentials({ refresh_token });
  return {
    sheets: google.sheets({ version: "v4", auth: oAuth2 }),
    drive:  google.drive({ version: "v3", auth: oAuth2 }),
    docs:   google.docs({ version: "v1", auth: oAuth2 }),
  };
}
