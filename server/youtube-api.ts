import fs from "fs";
import path from "path";

export async function getYouTubeAuthUrl(clientId: string, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error_description || data.error || "Token exchange failed");
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error_description || "Token refresh failed");
  return {
    accessToken: data.access_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };
}

export async function getConnectedEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as any;
  return data.email || "Unknown";
}

export async function getValidAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  currentAccessToken: string | undefined,
  expiresAt: number | undefined
): Promise<{ accessToken: string; expiresAt: number }> {
  // Refresh if missing or expiring within 60 seconds
  if (!currentAccessToken || !expiresAt || Date.now() > expiresAt - 60_000) {
    return refreshAccessToken(clientId, clientSecret, refreshToken);
  }
  return { accessToken: currentAccessToken, expiresAt };
}

export async function updateBroadcastMetadata(
  accessToken: string,
  broadcastId: string,
  title: string,
  description: string
): Promise<void> {
  // Fetch current snippet — scheduledStartTime is required in the update
  const getRes = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&id=${encodeURIComponent(broadcastId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const getData = await getRes.json() as any;
  if (!getRes.ok || !getData.items?.length) {
    throw new Error(`Broadcast "${broadcastId}" not found. Check the Broadcast ID in Destinations.`);
  }
  const currentSnippet = getData.items[0].snippet;

  const putRes = await fetch("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: broadcastId,
      snippet: {
        scheduledStartTime: currentSnippet.scheduledStartTime,
        title,
        description,
      },
    }),
  });
  const putData = await putRes.json() as any;
  if (!putRes.ok) throw new Error(putData.error?.message || "Failed to update broadcast title/description");
}

export async function updateVideoTags(
  accessToken: string,
  videoId: string,
  tags: string[]
): Promise<void> {
  // Get current video snippet to preserve categoryId and other required fields
  const getRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const getData = await getRes.json() as any;
  if (!getRes.ok || !getData.items?.length) return; // Non-fatal — tags update is best-effort

  const snippet = getData.items[0].snippet;
  const putRes = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: videoId, snippet: { ...snippet, tags } }),
  });
  const putData = await putRes.json() as any;
  if (!putRes.ok) throw new Error(putData.error?.message || "Failed to update video tags");
}

export async function uploadThumbnailToYouTube(
  accessToken: string,
  videoId: string,
  imagePath: string
): Promise<void> {
  const imageData = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png"
    : ext === ".webp" ? "image/webp"
    : "image/jpeg";

  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
      },
      body: imageData,
    }
  );
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Failed to upload thumbnail to YouTube");
}
