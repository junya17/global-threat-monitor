const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

let count = 0;

// 現在表示中の通信アニメーション
const animations = [];

// アニメーションの長さ（ミリ秒）
const DURATION = 3000;

// 経度・緯度をCanvas座標に変換
function project(lon, lat) {
  return {
    x: ((lon + 180) / 360) * canvas.width,
    y: ((90 - lat) / 180) * canvas.height,
  };
}

// 東京の位置
const target = project(139.7, 35.7);

// 大陸の簡略化した輪郭（経度・緯度）
const continents = [
  // 北アメリカ
  [
    [-168, 65],
    [-140, 72],
    [-125, 55],
    [-125, 40],
    [-115, 32],
    [-100, 20],
    [-82, 25],
    [-80, 45],
    [-60, 52],
    [-95, 72],
  ],

  // 南アメリカ
  [
    [-81, 12],
    [-65, 10],
    [-50, -2],
    [-35, -10],
    [-45, -30],
    [-55, -55],
    [-72, -40],
    [-80, -10],
  ],

  // ヨーロッパ・アジア
  [
    [-11, 36],
    [-10, 60],
    [10, 72],
    [45, 70],
    [70, 60],
    [100, 65],
    [140, 55],
    [180, 60],
    [170, 40],
    [140, 30],
    [120, 5],
    [105, -8],
    [80, 8],
    [60, 25],
    [40, 35],
    [20, 35],
  ],

  // アフリカ
  [
    [-17, 35],
    [10, 37],
    [35, 30],
    [50, 10],
    [40, -15],
    [20, -35],
    [10, -34],
    [-5, -5],
  ],

  // オーストラリア
  [
    [113, -12],
    [135, -10],
    [153, -25],
    [145, -39],
    [115, -34],
  ],
];

// 背景・グリッド・大陸を描画
function drawMap() {
  ctx.fillStyle = "#101c2d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 緯度経度のグリッド
  ctx.strokeStyle = "#26374a";
  ctx.lineWidth = 1;

  for (let lon = -180; lon <= 180; lon += 30) {
    const x = project(lon, 0).x;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    const y = project(0, lat).y;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 大陸を描画
  for (const continent of continents) {
    ctx.beginPath();

    continent.forEach(([lon, lat], index) => {
      const point = project(lon, lat);

      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.closePath();
    ctx.fillStyle = "#1d3544";
    ctx.fill();
    ctx.strokeStyle = "#35566a";
    ctx.stroke();
  }
}

// 二次ベジェ曲線上の位置を計算
function bezier(p0, p1, p2, t) {
  const a = (1 - t) ** 2;
  const b = 2 * (1 - t) * t;
  const c = t ** 2;

  return {
    x: a * p0.x + b * p1.x + c * p2.x,
    y: a * p0.y + b * p1.y + c * p2.y,
  };
}

// 曲線の制御点を計算
function controlPoint(start, end) {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 90,
  };
}

// 毎フレーム実行する描画処理
function draw(now) {
  drawMap();

  // 古いイベントを後ろから削除
  for (let i = animations.length - 1; i >= 0; i--) {
    const animation = animations[i];

    const elapsed = now - animation.startTime;
    const t = Math.min(elapsed / DURATION, 1);

    // 通信の曲線を描画
    ctx.beginPath();
    ctx.moveTo(animation.start.x, animation.start.y);
    ctx.quadraticCurveTo(
      animation.control.x,
      animation.control.y,
      target.x,
      target.y,
    );

    ctx.strokeStyle = "rgba(45, 212, 191, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 曲線上の光の位置
    const point = bezier(animation.start, animation.control, target, t);

    // 光の粒
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#5eead4";
    ctx.shadowColor = "#5eead4";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 終了したアニメーションを削除
    if (t >= 1) {
      animations.splice(i, 1);
    }
  }

  // 東京のマーカー
  ctx.beginPath();
  ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#34d399";
  ctx.fill();

  requestAnimationFrame(draw);
}

// Pythonから模擬イベントを取得
async function fetchEvent() {
  try {
    const response = await fetch("/api/event");

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const event = await response.json();

    const start = project(event.lon, event.lat);

    animations.push({
      start: start,
      control: controlPoint(start, target),
      startTime: performance.now(),
    });

    count++;
    document.getElementById("count").textContent = count;

    // ログを追加
    const row = document.createElement("div");

    row.textContent = `${event.country} | ${event.ip} | TCP ${event.port}`;

    const events = document.getElementById("events");
    events.prepend(row);

    // 最新10件のみ表示
    while (events.children.length > 10) {
      events.lastElementChild.remove();
    }
  } catch (error) {
    console.error("イベント取得エラー:", error);
  }
}

// アニメーション開始
requestAnimationFrame(draw);

// 1秒ごとにイベント取得
setInterval(fetchEvent, 1000);
fetchEvent();
