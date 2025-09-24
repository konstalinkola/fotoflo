import { google } from "googleapis";

export function getGoogleOAuthClient() {
	const clientId = process.env.GOOGLE_CLIENT_ID as string;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
	const redirectUri = process.env.GOOGLE_REDIRECT_URI as string;
	if (!clientId || !clientSecret || !redirectUri) {
		throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI envs");
	}
	return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleDriveClientFromRefreshToken(refreshToken: string) {
	const oauth2Client = getGoogleOAuthClient();
	oauth2Client.setCredentials({ refresh_token: refreshToken });
	return google.drive({ version: "v3", auth: oauth2Client });
}
