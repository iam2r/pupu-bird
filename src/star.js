var C = require('./config.js');

function createStar(x, y, bonus) {
  return { x: x, y: y, collected: false, missed: false, phase: Math.random() * Math.PI * 2, bonus: bonus || false };
}

function drawStar(ctx, s) {
  ctx.save();
  // 危险星：红色脉冲光环
  if (s.bonus) {
    var pulseAlpha = 0.15 + 0.15 * Math.sin(Date.now() * 0.006 + s.phase);
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  var alpha = 0.5 + 0.4 * Math.sin(Date.now() * 0.004 + s.phase);
  // 外发光
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(s.x, s.y, 18, 0, Math.PI * 2);
  ctx.fill();
  // 星星本体
  ctx.globalAlpha = alpha;
  var r = 14, ir = 5, cx = s.x, cy = s.y;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var rad = (i % 2 === 0) ? r : ir;
    var angle = (i * Math.PI) / 5 - Math.PI / 2;
    var sx = cx + Math.cos(angle) * rad;
    var sy = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  // 中心亮点
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function checkPickup(s, bx, by, br) {
  if (s.collected) return false;
  var dx = s.x - bx, dy = s.y - by;
  return Math.sqrt(dx * dx + dy * dy) < br * 1.4;
}

module.exports = { createStar: createStar, drawStar: drawStar, checkPickup: checkPickup };
