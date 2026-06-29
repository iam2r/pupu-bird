// bird.js — 小鸟绘制 + 配饰系统
// 依赖: config.js

var C = require('./config.js');

// ==================== 配饰绘制 ====================
function drawAccessoryOnCtx(ctx, cx, cy, r, t, accKey) {
  if (accKey === 'none') return;
  if (accKey === 'hat') {
    // 贝雷帽：用深色帽身 + 浅色帽边，与鸟身形成对比
    var capDark = t.acc.hat[1];  // 深色
    var capLight = t.acc.hat[0]; // 浅色边
    // 帽檐(浅色)
    ctx.fillStyle = capLight;
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.5, r * 0.7, r * 0.075, 0, 0, Math.PI * 2); ctx.fill();
    // 帽身(深色)
    ctx.fillStyle = capDark;
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.9, r * 0.55, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    // 小球
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy - r * 1.15, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  if (accKey === 'bow') {
    var bowX = cx + r * 0.35, bowY = cy - r * 0.7;
    var bc1 = t.acc.bow[0], bc2 = t.acc.bow[1];
    ctx.fillStyle = bc1; ctx.beginPath(); ctx.ellipse(bowX - r * 0.3, bowY, r * 0.3, r * 0.18, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bowX + r * 0.3, bowY, r * 0.3, r * 0.18, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bc2; ctx.beginPath(); ctx.arc(bowX, bowY, r * 0.12, 0, Math.PI * 2); ctx.fill();
  }
  if (accKey === 'glasses') {
    var gY = cy - r * 0.25, gc = t.acc.glasses[0];
    ctx.fillStyle = gc; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(cx + r * 0.35, gY, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.85, gY, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = gc; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + r * 0.63, gY); ctx.lineTo(cx + r * 0.57, gY); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(cx + r * 0.3, gY - r * 0.08, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.8, gY - r * 0.08, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (accKey === 'crown') {
    var crGold = t.acc.crown[1], crAccent = t.acc.crown[0];
    // crown base bar
    ctx.fillStyle = crGold;
    ctx.fillRect(cx - r * 0.5, cy - r * 0.65, r * 1.0, r * 0.12);
    // three triangular points
    var pts = [-r * 0.42, 0, r * 0.42];
    for (var pi = 0; pi < 3; pi++) {
      ctx.beginPath();
      ctx.moveTo(cx + pts[pi] - r * 0.15, cy - r * 0.65);
      ctx.lineTo(cx + pts[pi], cy - r * 1.15);
      ctx.lineTo(cx + pts[pi] + r * 0.15, cy - r * 0.65);
      ctx.fill();
    }
    // accent dots at tips
    ctx.fillStyle = crAccent;
    for (var pi2 = 0; pi2 < 3; pi2++) {
      ctx.beginPath();
      ctx.arc(cx + pts[pi2], cy - r * 1.09, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (accKey === 'flower') {
    var fx = cx - r * 0.6, fy = cy - r * 0.5;
    var flPetal = t.acc.flower[0], flCenter = t.acc.flower[1];
    for (var i = 0; i < 5; i++) {
      var angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      var px = fx + Math.cos(angle) * r * 0.16;
      var py = fy + Math.sin(angle) * r * 0.16;
      ctx.fillStyle = flPetal;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = flCenter;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  if (accKey === 'ribbon') {
    var rb1 = t.acc.ribbon[0], rb2 = t.acc.ribbon[1];
    // horizontal band across head
    ctx.fillStyle = rb1;
    ctx.fillRect(cx - r * 0.62, cy - r * 0.72, r * 1.24, r * 0.16);
    // left tail drooping down
    ctx.fillStyle = rb2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.72);
    ctx.lineTo(cx - r * 0.5, cy - r * 0.25);
    ctx.lineTo(cx - r * 0.3, cy - r * 0.56);
    ctx.fill();
    // right tail
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.4, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.25);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.56);
    ctx.fill();
    // center knot
    ctx.fillStyle = rb2;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.64, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  if (accKey === 'headphones') {
    var hpDark = t.acc.headphones[0], hpBand = t.acc.headphones[1];
    // connecting arc over head
    ctx.strokeStyle = hpBand;
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, Math.PI * 0.82, Math.PI * 0.18, true);
    ctx.stroke();
    // ear cups
    ctx.fillStyle = hpDark;
    ctx.beginPath();
    ctx.arc(cx - r * 0.92, cy + r * 0.08, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.92, cy + r * 0.08, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // ear cup inner highlights
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.92, cy + r * 0.08, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.92, cy + r * 0.08, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  if (accKey === 'star') {
    var starGold = t.acc.star[0], starDark = t.acc.star[1];
    var sx = cx, sy = cy - r * 0.85;
    var outerR = r * 0.32, innerR = r * 0.13;
    // 5-pointed star
    ctx.fillStyle = starGold;
    ctx.beginPath();
    for (var si = 0; si < 10; si++) {
      var rad = si % 2 === 0 ? outerR : innerR;
      var sa = (si * Math.PI) / 5 - Math.PI / 2;
      var stx = sx + Math.cos(sa) * rad;
      var sty = sy + Math.sin(sa) * rad;
      if (si === 0) ctx.moveTo(stx, sty);
      else ctx.lineTo(stx, sty);
    }
    ctx.closePath();
    ctx.fill();
    // small inner sparkle
    ctx.fillStyle = starDark;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  if (accKey === 'halo') {
    var haloGlow = t.acc.halo[0], haloCore = t.acc.halo[1];
    var hx = cx, hy = cy - r * 0.85;
    // 外发光
    ctx.strokeStyle = haloGlow;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = r * 0.35;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.55, r * 0.15, 0, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = r * 0.2;
    ctx.strokeStyle = haloCore;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.55, r * 0.15, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // 内核光环
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = r * 0.09;
    ctx.strokeStyle = haloGlow;
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.5, r * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 顶部亮点
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy - r * 0.1, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ==================== 唯一鸟身绘制（比例统一，通过 r 控制大小） ====================
function drawBirdBody(ctx, r, t, dead, avatarImg) {
  // 身体
  ctx.fillStyle = dead ? t.birdWing : t.bird;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // 腮红
  ctx.fillStyle = dead ? 'rgba(255,150,150,0.4)' : t.birdBlush;
  ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
  // 翅膀
  ctx.fillStyle = dead ? t.pipeDark : t.birdWing;
  ctx.beginPath(); ctx.ellipse(-r * 0.2, r * 0.1, r * 0.8, r * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();

  // 眼白
  var eyeX = r * 0.3, eyeY = -r * 0.25, eyeR = r * 0.3;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

  // 头像纹理 — 眼睛阴影轮廓
  if (avatarImg && avatarImg.width > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = 'multiply';
    var texScale = (eyeR * 2) / Math.min(avatarImg.width, avatarImg.height);
    var dw = avatarImg.width * texScale;
    var dh = avatarImg.height * texScale;
    ctx.drawImage(avatarImg, eyeX - dw / 2, eyeY - dh / 2, dw, dh);
    ctx.restore();
  }

  // 瞳孔（半透明，透出底下头像纹理）
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#3A2A3A';
  ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.25, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  // 鸟喙
  ctx.fillStyle = t.birdBeak;
  ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.25); ctx.lineTo(r * 1.7, r * 0.15); ctx.lineTo(r * 0.7, r * 0.5); ctx.fill();

}

// ==================== 游戏小鸟 ====================
function drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, avatarImg) {
  chargeRatio = chargeRatio || 0;
  var r = C.BIRD_SIZE / 2;
  var shakeX = 0, shakeY = 0;
  if (shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * shakeTimer * 12;
    shakeY = (Math.random() - 0.5) * shakeTimer * 12;
  }
  ctx.save();
  ctx.translate(C.BIRD_X + shakeX, birdY + shakeY);
  var angle = state === C.STATE.DEAD ? Math.PI / 2 : Math.max(-0.5, Math.min(0.5, birdVY / 600));
  ctx.rotate(angle);

  // 蓄力视觉：翅膀抖动 + 能量涟漪
  if (chargeRatio > 0.01) {
    var beatRate = 15 + chargeRatio * 55; // 15→70Hz 抖动频率
    
    // 能量涟漪（从内向外扩散的圆环）
    var rippleCount = Math.floor(chargeRatio * 5) + 2;
    for (var ri = 0; ri < rippleCount; ri++) {
      var ripplePhase = ((Date.now() * 0.004 + ri * 0.6) % 1);
      var rippleR = r * (0.8 + ripplePhase * 1.5);
      ctx.globalAlpha = chargeRatio * 0.7 * Math.max(0, 1 - ripplePhase);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 第二层涟漪（主题色，稍慢）
    for (ri = 0; ri < rippleCount - 1; ri++) {
      var rp2 = ((Date.now() * 0.003 + ri * 0.6 + 0.3) % 1);
      var rr2 = r * (0.8 + rp2 * 1.5);
      ctx.globalAlpha = chargeRatio * 0.5 * Math.max(0, 1 - rp2);
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, rr2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 身体呼吸膨胀
    ctx.save();
    var breathe = 1 + Math.sin(Date.now() * 0.001 * beatRate * 0.4) * chargeRatio * 0.06;
    ctx.scale((1 + chargeRatio * 0.3) * breathe, (1 + chargeRatio * 0.3) * breathe);
    
    // 旋转粒子环
    ctx.globalAlpha = chargeRatio * 0.55;
    ctx.fillStyle = t.accent;
    var dotCount = Math.floor(chargeRatio * 12);
    for (var di = 0; di < dotCount; di++) {
      var da = (di / dotCount) * Math.PI * 2 + Date.now() * 0.005;
      var dr = r * 1.4;
      ctx.beginPath();
      ctx.arc(Math.cos(da) * dr, Math.sin(da) * dr, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawBirdBody(ctx, r, t, state === C.STATE.DEAD, avatarImg);

  // 翅膀抖动（白色残影小翅膀）
  if (chargeRatio > 0.01) {
    var beatRate2 = 15 + chargeRatio * 55;
    var wingFlutter = Math.sin(Date.now() * 0.001 * beatRate2) * chargeRatio * 0.5;
    ctx.globalAlpha = chargeRatio * 0.5;
    // 左翼
    ctx.save();
    ctx.translate(-r * 0.5, -r * 0.25);
    ctx.rotate(-wingFlutter);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.45, r * 0.15, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 右翼
    ctx.save();
    ctx.translate(r * 0.5, -r * 0.25);
    ctx.rotate(wingFlutter);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.45, r * 0.15, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  
  drawAccessoryOnCtx(ctx, 0, 0, r, t, currentAccessory);
  if (chargeRatio > 0) {
    ctx.restore();
  }

  ctx.restore();
}

// ==================== Logo大鸟（菜单/纪念卡） ====================
function drawBirdCore(ctx, r, t, dead, currentAccessory, avatarImg) {
  drawBirdBody(ctx, r, t, dead, avatarImg);
  drawAccessoryOnCtx(ctx, 0, 0, r, t, currentAccessory);
}

function drawLogoBird(ctx, cx, cy, bigR, t, currentAccessory, bobAmount, avatarImg) {
  ctx.save();
  ctx.translate(cx, cy);
  if (bobAmount) ctx.translate(0, bobAmount);
  drawBirdCore(ctx, bigR, t, false, currentAccessory, avatarImg);
  ctx.restore();
}

module.exports = {
  drawAccessoryOnCtx: drawAccessoryOnCtx,
  drawBirdBody: drawBirdBody,
  drawBirdCore: drawBirdCore,
  drawBird: drawBird,
  drawLogoBird: drawLogoBird
};
