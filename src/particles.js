// particles.js — 花瓣粒子系统
// 依赖: config.js（布局常量 BIRD_X/W/H、STATE）

var C = require('./config.js');

// 生成普通花瓣
function spawnPetals(petals, x, y, count, t, spreadX, spreadY) {
  spreadX = spreadX || 40;
  spreadY = spreadY || 30;
  var colors = t.petal;
  for (var i = 0; i < count; i++) {
    petals.push({
      x: x + (Math.random() - 0.5) * spreadX,
      y: y + (Math.random() - 0.5) * spreadY,
      vx: (Math.random() - 0.5) * 90,
      vy: Math.random() * 60 + 30,
      size: Math.random() * 5 + 3,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 3,
      alpha: 0.9,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// 死亡花瓣雨
function spawnDeathPetals(petals, birdY, t) {
  var colors = t.petal;
  for (var i = 0; i < 60; i++) {
    petals.push({
      x: C.BIRD_X + (Math.random() - 0.5) * C.W,
      y: birdY + (Math.random() - 0.5) * C.H * 0.3 - C.H * 0.15,
      vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * -180 - 40,
      size: Math.random() * 7 + 4,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 5,
      alpha: 0.95,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

// 更新花瓣
function updatePetals(petals, dt, state) {
  var s = Math.min(dt, 0.1);
  var isDead = state === C.STATE.DEAD || state === C.STATE.MEMORIAL;
  for (var i = petals.length - 1; i >= 0; i--) {
    var p = petals[i];
    p.x += p.vx * s;
    p.y += p.vy * s;
    p.vy += isDead ? 60 * s : 40 * s;
    p.vx *= (1 - 0.8 * s);
    p.rot += p.rotV * s;
    p.life -= s * 0.35;
    p.alpha = Math.max(0, p.life * 0.9);
    if (p.life <= 0) petals.splice(i, 1);
  }
}

// 绘制花瓣
function drawPetals(ctx, petals) {
  for (var i = 0; i < petals.length; i++) {
    var p = petals[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    // 花瓣形状：小椭圆
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // 花瓣纹理线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.7);
    ctx.lineTo(0, p.size * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}

// ---- 得分飞行文字 ----
function spawnScoreFly(arr, x, y, amount) {
  arr.push({
    x: x + (Math.random() - 0.5) * 30,
    y: y + (Math.random() - 0.5) * 16 - 10,
    amount: amount,
    life: 1,
    scale: 1.4 + Math.random() * 0.6,
    driftX: (Math.random() - 0.5) * 40
  });
}

function updateScoreFlies(arr, dt, targetX, targetY) {
  var s = Math.min(dt, 0.1);
  var arrived = 0;
  for (var i = arr.length - 1; i >= 0; i--) {
    var f = arr[i];
    f.life -= s * 1.1;
    var dx = targetX - f.x;
    var dy = targetY - f.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      var speed = 400 + (1 - f.life) * 600;
      f.x += (dx / dist) * speed * s + f.driftX * s * (1 - f.life);
      f.y += (dy / dist) * speed * s;
      f.driftX *= (1 - 3 * s);
    }
    f.scale = 0.6 + f.life * 1.4;
    if (f.life <= 0 || dist < 8) {
      if (dist < 8) arrived++;
      arr.splice(i, 1);
    }
  }
  return arrived;
}

function drawScoreFlies(ctx, arr) {
  for (var i = 0; i < arr.length; i++) {
    var f = arr[i];
    ctx.save();
    ctx.globalAlpha = Math.min(1, f.life * 1.2);
    ctx.translate(f.x, f.y);
    ctx.scale(f.scale, f.scale);
    // 光晕
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 描边
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeText('+' + f.amount, 0, 0);
    // 填充（渐变金→白）
    ctx.fillStyle = f.life > 0.5 ? '#FFD700' : '#FFFFFF';
    ctx.fillText('+' + f.amount, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

module.exports = {
  spawnPetals: spawnPetals,
  spawnDeathPetals: spawnDeathPetals,
  updatePetals: updatePetals,
  drawPetals: drawPetals,
  spawnScoreFly: spawnScoreFly,
  updateScoreFlies: updateScoreFlies,
  drawScoreFlies: drawScoreFlies
};
