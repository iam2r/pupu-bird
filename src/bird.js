// bird.js — 小鸟绘制 + 配饰系统
// 依赖: config.js

var C = require('./config.js');

// ==================== 配饰绘制 ====================
function drawAccessoryOnCtx(ctx, cx, cy, r, t, accKey, bobY) {
  cy += (bobY || 0);
  if (accKey === 'none') return;
  if (accKey === 'hat') {
    var capDark = t.acc.hat[1];
    var capLight = t.acc.hat[0];
    var hOff = r * 0.22;
    ctx.fillStyle = capDark;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.5 - hOff);
    ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 0.95 - hOff, cx + r * 0.25, cy - r * 1.05 - hOff);
    ctx.quadraticCurveTo(cx + r * 0.45, cy - r * 0.65 - hOff, cx + r * 0.4, cy - r * 0.45 - hOff);
    ctx.quadraticCurveTo(cx, cy - r * 0.35 - hOff, cx - r * 0.4, cy - r * 0.5 - hOff);
    ctx.fill();
    ctx.strokeStyle = capLight;
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy - r * 0.48 - hOff);
    ctx.quadraticCurveTo(cx, cy - r * 0.38 - hOff, cx + r * 0.38, cy - r * 0.46 - hOff);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy - r * 1.05 - hOff, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
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
    var crOff = r * 0.18;
    ctx.fillStyle = crGold;
    C.roundRect(ctx, cx - r * 0.5, cy - r * 0.62 - crOff, r * 1.0, r * 0.1, r * 0.05); ctx.fill();
    var pts = [-r * 0.32, 0, r * 0.32];
    for (var pi = 0; pi < 3; pi++) {
      ctx.beginPath();
      ctx.arc(cx + pts[pi], cy - r * 0.75 - crOff, r * 0.22, Math.PI, 0, false);
      ctx.fill();
    }
    ctx.fillStyle = crAccent;
    for (var pj = 0; pj < 3; pj++) {
      ctx.beginPath();
      ctx.arc(cx + pts[pj], cy - r * 0.95 - crOff, r * 0.06, 0, Math.PI * 2);
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
    // 圆润发带横跨头顶
    ctx.fillStyle = rb1;
    C.roundRect(ctx, cx - r * 0.6, cy - r * 0.72, r * 1.2, r * 0.12, r * 0.06); ctx.fill();
    // 左耳坠（圆角泪滴）
    ctx.fillStyle = rb2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy - r * 0.66);
    ctx.quadraticCurveTo(cx - r * 0.55, cy - r * 0.35, cx - r * 0.4, cy - r * 0.2);
    ctx.quadraticCurveTo(cx - r * 0.25, cy - r * 0.4, cx - r * 0.28, cy - r * 0.66);
    ctx.fill();
    // 右耳坠
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.38, cy - r * 0.66);
    ctx.quadraticCurveTo(cx + r * 0.55, cy - r * 0.35, cx + r * 0.4, cy - r * 0.2);
    ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.4, cx + r * 0.28, cy - r * 0.66);
    ctx.fill();
    // 中心蝴蝶结
    ctx.fillStyle = rb2;
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.66, r * 0.14, r * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (accKey === 'headphones') {
    var hpDark = t.acc.headphones[0], hpBand = t.acc.headphones[1];
    var noteTime = Date.now() * 0.002;
    // 弧形头梁
    ctx.strokeStyle = hpBand;
    ctx.lineWidth = r * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.05, r * 0.85, Math.PI * 0.78, Math.PI * 0.22, true);
    ctx.stroke();
    // 两只耳罩都在左侧
    var cupW = r * 0.2, cupH = r * 0.3;
    var cupPositions = [{ x: cx - r * 0.85, y: cy - r * 0.12 }, { x: cx - r * 0.72, y: cy + r * 0.32 }];
    for (var ei = 0; ei < 2; ei++) {
      var ex = cupPositions[ei].x, ey = cupPositions[ei].y;
      ctx.fillStyle = hpDark;
      C.roundRect(ctx, ex - cupW, ey - cupH / 2, cupW * 2, cupH, r * 0.07); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      C.roundRect(ctx, ex - cupW * 0.5, ey - cupH * 0.25, cupW * 0.6, cupH * 0.35, r * 0.03); ctx.fill();
    }
    // 音符从左耳飘出
    ctx.fillStyle = hpBand;
    ctx.globalAlpha = 0.7;
    for (var ni = 0; ni < 2; ni++) {
      var nx = cx - r * 0.6 - ni * r * 0.3;
      var ny = cy - r * 0.5 - Math.sin(noteTime + ni) * r * 0.3;
      ctx.font = (r * 0.6) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ni === 0 ? '♪' : '♫', nx, ny);
    }
    ctx.globalAlpha = 1;
  }
  if (accKey === 'star') {
    var starGold = t.acc.star[0], starDark = t.acc.star[1];
    var sx = cx, sy = cy - r * 0.85;
    var outR = r * 0.32, inR = r * 0.16;
    // 经典五角星，内外半径接近使星形圆润胖萌
    ctx.fillStyle = starGold;
    ctx.beginPath();
    for (var si = 0; si < 10; si++) {
      var rad = si % 2 === 0 ? outR : inR;
      var sa = (si * Math.PI) / 5 - Math.PI / 2;
      var stx = sx + Math.cos(sa) * rad;
      var sty = sy + Math.sin(sa) * rad;
      if (si === 0) ctx.moveTo(stx, sty);
      else ctx.lineTo(stx, sty);
    }
    ctx.closePath();
    ctx.fill();
    // 高光圆点
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(sx - r * 0.06, sy - r * 0.08, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 中心珠
    ctx.fillStyle = starDark;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  if (accKey === 'halo') {
    var haloGlow = t.acc.halo[0], haloCore = t.acc.halo[1];
    var hx = cx, hy = cy - r * 1.0;
    var haloRX = r * 0.45, haloRY = r * 0.15;
    // 外层柔光
    ctx.strokeStyle = haloGlow;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = r * 0.35;
    ctx.beginPath();
    ctx.ellipse(hx, hy, haloRX, haloRY, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 中层光晕
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = r * 0.2;
    ctx.strokeStyle = haloCore;
    ctx.beginPath();
    ctx.ellipse(hx, hy, haloRX, haloRY, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 内层亮环
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = r * 0.08;
    ctx.strokeStyle = haloGlow;
    ctx.beginPath();
    ctx.ellipse(hx, hy, haloRX, haloRY, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 顶部亮点
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy - haloRY, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ==================== 唯一鸟身绘制（比例统一，通过 r 控制大小） ====================
function drawBirdBody(ctx, r, t, dead, wingFlap) {
  // 身体
  ctx.fillStyle = dead ? t.birdWing : t.bird;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // 腮红
  ctx.fillStyle = dead ? 'rgba(255,150,150,0.4)' : t.birdBlush;
  ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
  // 翅膀（支持扑动动画）
  ctx.save();
  if (wingFlap) ctx.rotate(wingFlap);
  ctx.fillStyle = dead ? t.pipeDark : t.birdWing;
  ctx.beginPath(); ctx.ellipse(-r * 0.2, r * 0.1, r * 0.8, r * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 眼白
  var eyeX = r * 0.3, eyeY = -r * 0.25, eyeR = r * 0.3;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

  // 瞳孔
  if (dead) {
    // 死亡 X_X 眼
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#3A2A3A';
    ctx.lineWidth = r * 0.06;
    ctx.lineCap = 'round';
    var ex = r * 0.35, ey = -r * 0.25, es = r * 0.11;
    ctx.beginPath(); ctx.moveTo(ex - es, ey - es); ctx.lineTo(ex + es, ey + es); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + es, ey - es); ctx.lineTo(ex - es, ey + es); ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    // 眼珠微动（配合翅膀扑动更灵动）
    var eyeOffX = 0, eyeOffY = 0;
    if (wingFlap !== undefined) {
      var t2 = Date.now() * 0.001;
      eyeOffX = Math.sin(t2 * 1.3) * r * 0.04;
      eyeOffY = Math.cos(t2 * 1.7) * r * 0.03;
    }
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#3A2A3A';
    ctx.beginPath(); ctx.arc(r * 0.4 + eyeOffX, -r * 0.25 + eyeOffY, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 鸟喙（上下分色，张嘴动画，扁平小巧）
  var bkOpen = wingFlap ? Math.abs(wingFlap) * r * 0.2 : 0;
  var bkTipX = r * 1.32, bkTipY = r * -0.02;
  var bkBaseX = r * 0.72;
  // 上喙
  ctx.fillStyle = t.birdBeak;
  ctx.beginPath();
  ctx.moveTo(bkBaseX, -r * 0.12);
  ctx.quadraticCurveTo(r * 1.05, -r * 0.08, bkTipX, bkTipY - bkOpen * 0.3);
  ctx.quadraticCurveTo(r * 1.02, r * 0.02, bkBaseX, r * 0.02);
  ctx.fill();
  // 下喙
  ctx.fillStyle = t.accentDark;
  ctx.beginPath();
  ctx.moveTo(bkBaseX, r * 0.02 + bkOpen);
  ctx.quadraticCurveTo(r * 0.95, r * 0.1 + bkOpen, bkTipX - r * 0.08, r * 0.06 + bkOpen);
  ctx.quadraticCurveTo(r * 0.82, r * 0.12 + bkOpen, bkBaseX, r * 0.18 + bkOpen);
  ctx.fill();

}

// ==================== 游戏小鸟 ====================
function drawBird(ctx, birdY, birdVY, state, shakeTimer, t, currentAccessory, chargeRatio, birdX, isDead) {
  chargeRatio = chargeRatio || 0;
  birdX = birdX || C.BIRD_X;
  if (isDead === undefined) isDead = (state === C.STATE.DEAD);
  var r = C.BIRD_SIZE / 2;
  var shakeX = 0, shakeY = 0;
  if (shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * shakeTimer * 12;
    shakeY = (Math.random() - 0.5) * shakeTimer * 12;
  }
  ctx.save();
  ctx.translate(birdX + shakeX, birdY + shakeY);
  // 死亡：速度驱动旋转(坠→弹→停)，存活：俯仰角跟随速度
  var angle;
  if (isDead) {
    var absV = Math.abs(birdVY);
    angle = birdVY > 0 ? Math.min(Math.PI * 0.48, absV / 400) : -Math.min(0.3, absV / 800);
  } else {
    angle = Math.max(-0.5, Math.min(0.5, birdVY / 600));
  }
  ctx.rotate(angle);

  // 蓄力视觉：翅膀抖动 + 能量涟漪
  if (chargeRatio > 0.01) {
    var beatRate = 15 + chargeRatio * 55; // 15→70Hz 抖动频率

    // 能量涟漪（三层：深色轮廓 → 白色光环 → 主题色外晕）
    var rippleCount = Math.floor(chargeRatio * 4) + 2;
    for (var ri = 0; ri < rippleCount; ri++) {
      var ripplePhase = ((Date.now() * 0.004 + ri * 0.55) % 1);
      var rippleR = r * (0.7 + ripplePhase * 1.6);
      var fadeAlpha = Math.max(0, 1 - ripplePhase);
      // 1. 深色轮廓环（亮色背景下提供对比）
      ctx.globalAlpha = chargeRatio * 0.35 * fadeAlpha;
      ctx.strokeStyle = t.accentDark;
      ctx.lineWidth = r * 0.28;
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
      // 2. 白色光环
      ctx.globalAlpha = chargeRatio * 0.7 * fadeAlpha;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 第二层涟漪（主题色 + 白色双线，错相更快）
    for (ri = 0; ri < rippleCount; ri++) {
      var rp2 = ((Date.now() * 0.005 + ri * 0.5 + 0.3) % 1);
      var rr2 = r * (0.7 + rp2 * 1.6);
      var fadeAlpha2 = Math.max(0, 1 - rp2);
      // 主题色辉光
      ctx.globalAlpha = chargeRatio * 0.45 * fadeAlpha2;
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = r * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, rr2, 0, Math.PI * 2);
      ctx.stroke();
      // 细白线
      ctx.globalAlpha = chargeRatio * 0.6 * fadeAlpha2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, rr2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 身体呼吸膨胀
    ctx.save();
    var breathe = 1 + Math.sin(Date.now() * 0.001 * beatRate * 0.4) * chargeRatio * 0.06;
    ctx.scale((1 + chargeRatio * 0.3) * breathe, (1 + chargeRatio * 0.3) * breathe);

    // 旋转粒子环（双色交替，白色核心）
    ctx.globalAlpha = chargeRatio * 0.6;
    var dotCount = Math.floor(chargeRatio * 12);
    for (var di = 0; di < dotCount; di++) {
      var da = (di / dotCount) * Math.PI * 2 + Date.now() * 0.005;
      var dr = r * 1.35;
      var dx = Math.cos(da) * dr, dy = Math.sin(da) * dr;
      // 光晕
      ctx.fillStyle = di % 2 === 0 ? t.accentDark : t.accent;
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      // 白色核心
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawBirdBody(ctx, r, t, isDead);

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
function drawBirdCore(ctx, r, t, dead, currentAccessory) {
  drawBirdBody(ctx, r, t, dead);
  drawAccessoryOnCtx(ctx, 0, 0, r, t, currentAccessory);
}

function drawLogoBird(ctx, cx, cy, bigR, t, currentAccessory, bobAmount) {
  ctx.save();
  ctx.translate(cx, cy);
  if (bobAmount) ctx.translate(0, bobAmount);
  var flap = Math.sin(Date.now() * 0.008) * 0.15;
  var bob2 = Math.sin(Date.now() * 0.005) * bigR * 0.08;
  drawBirdBody(ctx, bigR, t, false, flap);
  drawAccessoryOnCtx(ctx, 0, 0, bigR, t, currentAccessory, bob2);
  ctx.restore();
}

module.exports = {
  drawAccessoryOnCtx: drawAccessoryOnCtx,
  drawBirdBody: drawBirdBody,
  drawBirdCore: drawBirdCore,
  drawBird: drawBird,
  drawLogoBird: drawLogoBird
};
