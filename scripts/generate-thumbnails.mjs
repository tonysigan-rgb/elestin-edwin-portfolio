import { createPrivateKey, createSign } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";

const folders = [
  { id: "1Q9ggNqy97KpFJl_OSEyClvQ4CvUNb3eP", category: "wedding" },
  { id: "17EIbqk4WS5Gt4HNpcT4DnZuGCc-tDxGg", category: "corporate" },
  { id: "1YrBIR_c9jiumiudIZ8sDDsPxOk52tVQf", category: "reels" },
];
const outputDirectory = join(process.cwd(), "assets", "live-thumbnails");
const manifestPath = join(outputDirectory, "manifest.json");
const serviceAccountJson = process.env.DRIVE_SERVICE_ACCOUNT_JSON;

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  const assertion = `${header}.${claims}.${signer.sign(createPrivateKey(serviceAccount.private_key), "base64url")}`;
  const response = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status}).`);
  return (await response.json()).access_token;
}

async function listFolderVideos(folder, token) {
  const results = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: `'${folder.id}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime,capabilities/canDownload)",
      orderBy: "createdTime desc",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Could not list the ${folder.category} folder (${response.status}).`);
    const payload = await response.json();
    results.push(...(payload.files || []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return results.filter((file) => file.mimeType?.startsWith("video/") && file.capabilities?.canDownload);
}

async function downloadVideo(file, token, destination) {
  const params = new URLSearchParams({ alt: "media", supportsAllDrives: "true" });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok || !response.body) throw new Error(`Could not download ${file.name} (${response.status}).`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

function extractFrame(videoPath, thumbnailPath, seconds) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", String(seconds),
    "-i", videoPath,
    "-frames:v", "1",
    "-vf", "scale='min(1600,iw)':-2",
    "-q:v", "2",
    thumbnailPath,
  ], { encoding: "utf8" });
  return result.status === 0;
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return {};
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!serviceAccountJson) {
    console.log("No DRIVE_SERVICE_ACCOUNT_JSON secret is configured; thumbnail generation skipped.");
    return;
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const token = await getAccessToken(serviceAccount);
  await mkdir(outputDirectory, { recursive: true });
  const oldManifest = await readManifest();
  const videos = (await Promise.all(folders.map((folder) => listFolderVideos(folder, token)))).flat();
  const nextManifest = {};
  let generated = 0;

  for (const file of videos) {
    const thumbnail = `${file.id}.jpg`;
    const thumbnailPath = join(outputDirectory, thumbnail);
    nextManifest[file.id] = { modifiedTime: file.modifiedTime, thumbnail };
    if (oldManifest[file.id]?.modifiedTime === file.modifiedTime && await exists(thumbnailPath)) continue;

    const videoPath = join(tmpdir(), `${file.id}-${Date.now()}.video`);
    const temporaryThumbnailPath = join(tmpdir(), `${file.id}-${Date.now()}.jpg`);
    try {
      await downloadVideo(file, token, videoPath);
      const extracted = extractFrame(videoPath, temporaryThumbnailPath, 30) || extractFrame(videoPath, temporaryThumbnailPath, 1);
      if (!extracted) throw new Error(`Could not extract a preview frame from ${file.name}.`);
      await rename(temporaryThumbnailPath, thumbnailPath);
      generated += 1;
    } finally {
      await rm(videoPath, { force: true });
      await rm(temporaryThumbnailPath, { force: true });
    }
  }

  for (const [fileId, entry] of Object.entries(oldManifest)) {
    if (!nextManifest[fileId]) await rm(join(outputDirectory, entry.thumbnail), { force: true });
  }

  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
  console.log(`Checked ${videos.length} videos; generated ${generated} 30-second thumbnails.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
