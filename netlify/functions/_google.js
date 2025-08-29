import { google } from "googleapis";
export function getGoogleClients() {
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents"
    ],
  });
  return {
    sheets: google.sheets({ version: "v4", auth }),
    drive:  google.drive({ version: "v3", auth }),
    docs:   google.docs({ version: "v1", auth }),
  };
}
