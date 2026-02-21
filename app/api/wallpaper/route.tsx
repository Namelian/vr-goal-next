import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const START = "2021-12-05T00:00:00+09:00";
const GOAL  = "2031-12-05T00:00:00+09:00";

function kstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function GET() {
  const start = new Date(START);
  const goal = new Date(GOAL);

  const today = startOfDay(kstNow());
  const dayMs = 86400000;

  const totalDays = Math.max(1, Math.floor((goal.getTime() - start.getTime()) / dayMs));
  const doneDays = Math.max(0, Math.min(totalDays, Math.floor((today.getTime() - start.getTime()) / dayMs)));
  const leftDays = Math.max(0, Math.floor((goal.getTime() - today.getTime()) / dayMs));
  const pct = Math.floor((doneDays / totalDays) * 100);

  const text = `${today.getFullYear()}\n${pct}%\n${leftDays}d left`;

  const res = new ImageResponse(
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
          fontSize: 96,
          fontWeight: 800,
          whiteSpace: "pre-line",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {text}
      </div>
    ),
    { width: 1179, height: 2556 }
  );

  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}