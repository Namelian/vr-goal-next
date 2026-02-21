import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const START = "2021-12-05T00:00:00+09:00";
const GOAL  = "2031-12-05T00:00:00+09:00";

const DAY_MS = 86400000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstTodayMs() {
  const now = Date.now();
  const kst = new Date(now + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  return Date.UTC(y, m, d) - KST_OFFSET_MS; // KST 자정(UTC ms)
}

function getKSTYear(msKstMidnight: number) {
  return new Date(msKstMidnight + KST_OFFSET_MS).getUTCFullYear();
}
function getKSTMonth(msKstMidnight: number) {
  return new Date(msKstMidnight + KST_OFFSET_MS).getUTCMonth(); // 0-11
}
function daysInMonthKST(year: number, month0: number) {
  // year/month are in KST terms but we can compute using UTC safely
  // last day: Date.UTC(year, month+1, 0)
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}
function kstMonthStartMs(year: number, month0: number) {
  // KST year/month의 1일 00:00(KST)을 UTC ms로
  return Date.UTC(year, month0, 1) - KST_OFFSET_MS;
}
function kstDow0Sun(msKstMidnight: number) {
  // KST 기준 요일(0=Sun..6)
  const d = new Date(msKstMidnight + KST_OFFSET_MS);
  return d.getUTCDay();
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function GET() {
  const start = new Date(START).getTime();
  const goal  = new Date(GOAL).getTime();
  const today = kstTodayMs();

  const totalDays = Math.max(1, Math.floor((goal - start) / DAY_MS));
  const doneDays  = Math.max(0, Math.min(totalDays, Math.floor((today - start) / DAY_MS)));
  const leftDays  = Math.max(0, Math.floor((goal - today) / DAY_MS));
  const pct = Math.floor((doneDays / totalDays) * 100);

  const curYear = getKSTYear(today);

  // “프로젝트 전체 연도바” 계산: START 연도부터 GOAL-1 연도까지
  const startYear = getKSTYear(start);
  const endYear = getKSTYear(goal - 1); // 목표 종료일 전날의 연도
  const totalYears = Math.max(1, endYear - startYear + 1);

  // 지난 연도(완료된 연도) 개수: startYear..curYear-1 중, 프로젝트 기간에 포함되는 것
  const passedYears = Math.max(0, Math.min(totalYears, curYear - startYear));
  const futureYears = Math.max(0, totalYears - passedYears - 1); // 현재 연도 제외한 미래

  // 캔버스 사이즈(아이폰 배경)
  const W = 1179, H = 2556;

  // 중앙 컨텐츠 폭(달력/연도바 폭 동일)
  const contentW = 820;              // ← 여기부터 시안에 맞춰 조절
  const centerX = (W - contentW) / 2;

  // 레이아웃: 상단 여백 크게, 전체를 살짝 아래로
  const topPad = 220;
  const bottomPad = 230;

  // 연도바 스타일
  const barGap = 14;
  const barH = 6;
  const barR = 4;

  // 점 달력 스타일
  const dot = 14;           // 점 지름
  const dotGap = 10;        // 점 간격
  const weekCols = 7;       // 요일 7
  const weekRows = 6;       // 월 달력 최대 6주
  const monthBlockW = weekCols * dot + (weekCols - 1) * dotGap;
  const monthBlockH = weekRows * dot + (weekRows - 1) * dotGap;

  const monthLabelH = 28;
  const monthCellGapX = 56;
  const monthCellGapY = 56;

  const gridW = monthBlockW * 3 + monthCellGapX * 2;
  const gridH = (monthLabelH + monthBlockH) * 4 + monthCellGapY * 3;

  // 중앙에서 전체 블록을 맞추기(시안처럼 가운데 몰아넣기)
  const yearTextY = topPad + 170;
  const barsTopY = topPad + 40;
  const gridTopY = yearTextY + 90;

  const barsBottomY = gridTopY + gridH + 70;
  const footerY = barsBottomY + 200;

  // 오늘이 프로젝트 범위 내인지
  const inRange = (ms: number) => ms >= start && ms < goal;

  // 현재 연도의 “오늘까지 진행” 색(흰색), “오늘 위치” 포인트(주황)
  const doneColor = "#F2F2F2";
  const todoColor = "rgba(255,255,255,0.18)";
  const outColor  = "rgba(255,255,255,0.00)"; // 범위 밖은 공란
  const todayDot  = "#FF6A2A";

  function MonthDots({ month0 }: { month0: number }) {
    const mStart = kstMonthStartMs(curYear, month0);
    const dim = daysInMonthKST(curYear, month0);
    const firstDow = kstDow0Sun(mStart); // 0=Sun

    const dots: any[] = [];
    for (let day = 1; day <= dim; day++) {
      const idx = firstDow + (day - 1);
      const row = Math.floor(idx / 7);
      const col = idx % 7;

      const ms = mStart + (day - 1) * DAY_MS;
      let bg = outColor;

      if (inRange(ms)) {
        if (ms < today) bg = doneColor;
        else if (ms === today) bg = todayDot;
        else bg = todoColor;
      } else {
        bg = outColor; // 프로젝트 범위 밖은 공란
      }

      dots.push(
        <div
          key={day}
          style={{
            position: "absolute",
            left: col * (dot + dotGap),
            top: row * (dot + dotGap),
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            background: bg,
          }}
        />
      );
    }

    return (
      <div style={{ position: "relative", width: monthBlockW, height: monthBlockH }}>
        {dots}
      </div>
    );
  }

  function YearBars({ count, bright }: { count: number; bright: boolean }) {
    // count 만큼만 렌더(“무조건 5줄” 금지)
    const bars = [];
    for (let i = 0; i < count; i++) {
      bars.push(
        <div
          key={i}
          style={{
            width: contentW,
            height: barH,
            borderRadius: barR,
            background: bright ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)",
            marginTop: i === 0 ? 0 : barGap,
          }}
        />
      );
    }
    return <div style={{ display: "flex", flexDirection: "column" }}>{bars}</div>;
  }

  const res = new ImageResponse(
    (
      <div style={{ width: W, height: H, background: "#111", display: "flex", flexDirection: "column" }}>
        <div style={{ height: topPad }} />

        {/* 상단: 지난 연도바 */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: contentW }}>
            <YearBars count={passedYears} bright={true} />
          </div>
        </div>

        {/* 연도 텍스트 */}
        <div style={{ height: 70 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: contentW, textAlign: "center", color: "white", fontFamily: "serif", fontSize: 92, fontWeight: 700, opacity: 0.92 }}>
            {curYear}
          </div>
        </div>

        {/* 달력 그리드 */}
        <div style={{ height: 60 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: contentW, display: "flex", justifyContent: "center" }}>
            <div style={{ width: gridW, display: "flex", flexWrap: "wrap", gap: `${monthCellGapY}px ${monthCellGapX}px` }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ width: monthBlockW, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 26 }}>{MONTH_NAMES[i]}</div>
                  <MonthDots month0={i} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단: 다가올 연도바 */}
        <div style={{ height: 80 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: contentW }}>
            <YearBars count={futureYears} bright={false} />
          </div>
        </div>

        {/* 푸터 텍스트(겹침 방지: 연도바 아래 충분히 띄움) */}
        <div style={{ height: 140 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: contentW, textAlign: "center", fontSize: 34 }}>
            <span style={{ color: "#FF6A2A", fontWeight: 700 }}>{leftDays}d left</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}> · {pct}%</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ height: bottomPad }} />
      </div>
    ),
    { width: W, height: H }
  );

  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}