import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
  const img = new ImageResponse(
    (
      <div
        style={{
          width: "1179px",
          height: "2556px",
          background: "#111",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 100,
          fontWeight: 800,
        }}
      >
        OK
      </div>
    ),
    { width: 1179, height: 2556 }
  );

  // ✅ 캐시 방지 + 타입 강제
  img.headers.set("Cache-Control", "no-store");
  img.headers.set("Content-Type", "image/png");
  return img;
}