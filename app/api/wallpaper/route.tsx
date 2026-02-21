import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

const START = "2021-12-05T00:00:00+09:00";
const GOAL  = "2031-12-05T00:00:00+09:00";

function kstNow() {
  // KST 기준 "현재"를 안정적으로 얻음
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function startOfKSTDay(d: Date) {
  // KST 기준 날짜(00:00)로 맞춤
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function GET() {
  const start = new Date(START);
  const goal  = new Date(GOAL);
  const nowKST = kstNow();
  const todayKST = startOfKSTDay(nowKST);

  const dayMs = 86400000;

  const totalDays = Math.max(1, Math.floor((goal.getTime() - start.getTime()) / dayMs));
  const doneDays  = Math.max(0, Math.min(totalDays, Math.floor((todayKST.getTime() - start.getTime()) / dayMs)));
  const leftDays  = Math.max(0, Math.floor((goal.getTime() - todayKST.getTime()) / dayMs));
  const pct = Math.floor((doneDays / totalDays) * 100);

  const year = todayKST.getFullYear();

  const img = new ImageResponse(
    (
      <div style={{
        width: "1179px",
        height: "2556px",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        gap: 28
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18
        }}>
          <div style={{ fontSize: 96, fontFamily: "serif", fontWeight: 700, opacity: 0.92 }}>
            {year}
          </div>

          <div style={{ fontSize: 92, fontWeight: 800 }}>
            {pct}%
          </div>

          <div style={{ fontSize: 52, opacity: 0.75 }}>
            {leftDays}d left
          </div>
        </div>
      </div>
    ),
    { width: 1179, height: 2556 }
  );

  // ✅ 단축어/사파리 캐시 방지 (매일 갱신 확실)
  img.headers.set("Cache-Control", "no-store, max-age=0");
  img.headers.set("Content-Type", "image/png");
  return img;
}
