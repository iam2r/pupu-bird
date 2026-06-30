var C = require('./config.js');

function createStar(x, y, bonus) {
  return { x: x, y: y, collected: false, missed: false, phase: Math.random() * Math.PI * 2, bonus: bonus || false };
}

function drawStar(ctx, s, t) {
  ctx.save();
  var alpha = 0.5 + 0.4 * Math.sin(Date.now() * 0.004 + s.phase);
  var cx = s.x, cy = s.y;

  // 1. 主题色外圈光环（统一所有星星，在亮色背景下提供对比）
  ctx.globalAlpha = alpha * 0.22;
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  // 2. 危险星：红色脉冲环（主题色环内层）
  if (s.bonus) {
    var pulseAlpha = 0.15 + 0.15 * Math.sin(Date.now() * 0.006 + s.phase);
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 黄色外发光
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // 4. 星星本体
  ctx.globalAlpha = alpha;
  var r = 12, ir = 4.5;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var rad = (i % 2 === 0) ? r : ir;
    var angle = (i * Math.PI) / 5 - Math.PI / 2;
    var sx2 = cx + Math.cos(angle) * rad;
    var sy2 = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(sx2, sy2);
    else ctx.lineTo(sx2, sy2);
  }
  ctx.closePath();
  ctx.fill();
  // 主题色描边（在亮色背景下勾勒轮廓）
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = t.accentDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 5. 中心白色亮点 + 主题色细轮廓
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = t.accentDark;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.restore();
}

function checkPickup(s, bx, by, br) {
  if (s.collected) return false;
  var dx = s.x - bx, dy = s.y - by;
  return Math.sqrt(dx * dx + dy * dy) < br * 1.4;
}

module.exports = { createStar: createStar, drawStar: drawStar, checkPickup: checkPickup };
