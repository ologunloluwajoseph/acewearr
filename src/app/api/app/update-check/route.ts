import { NextRequest, NextResponse } from "next/server";
import { APP_VERSIONS } from "../version/route";

// ============================================================================
//  GET /api/app/update-check?clientVersion=1.0.0&platform=web|android|ios
//  Lightweight endpoint for the mobile app / website to check for updates.
//  Returns:
//  - hasUpdate: boolean
//  - mustUpdate: boolean (below minimum required = forced update)
//  - latestVersion: string
//  - changelog: string[]
//  - downloadUrl: string
// ============================================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientVersion = searchParams.get("clientVersion") || "0.0.0";
  const platform = searchParams.get("platform") || "web";

  const current = APP_VERSIONS[0];
  const clientParts = clientVersion.split(".").map(Number);
  const currentParts = current.version.split(".").map(Number);
  const minParts = current.minRequired.split(".").map(Number);

  let hasUpdate = false;
  for (let i = 0; i < 3; i++) {
    if ((currentParts[i] || 0) > (clientParts[i] || 0)) {
      hasUpdate = true;
      break;
    }
  }

  let mustUpdate = false;
  for (let i = 0; i < 3; i++) {
    if ((clientParts[i] || 0) < (minParts[i] || 0)) {
      mustUpdate = true;
      break;
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      hasUpdate,
      mustUpdate,
      latestVersion: current.version,
      currentVersion: clientVersion,
      platform,
      title: current.title,
      changelog: hasUpdate ? current.changelog : [],
      downloadUrl: current.downloadUrl,
      size: current.size,
      releasedAt: current.releasedAt,
    },
  });
}
