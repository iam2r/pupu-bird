// ui.js — 界面绘制（菜单/分数面板/结束面板/主题选择/纪念卡画面等）
// 依赖: config.js（常量、布局、辅助函数）、bird.js（drawLogoBird）、particles.js（drawPetals）

var C = require('./config.js');
var Bird = require('./bird.js');
var Particles = require('./particles.js');

// ==================== 面板触摸状态（内聚管理） ====================
var _panelState = {
  scroll: 0,
  startY: 0,
  touchY: 0,
  touched: false,
  didScroll: false
};

// 纪念卡画面头像缓存
var _memAvatarImg = null;

// 头像占位符绘制
function _drawAvatarPlaceholder(ctx, cx, cy, r, t) {
  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // 小人图标
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = t.textSec;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ==================== 返回按钮 ====================
function drawBackButton(ctx, theme) {
  var bx = C.backBtn.x, by = C.backBtn.y, bw = C.backBtn.w, bh = C.backBtn.h;
  var t = C.getT(theme);
  ctx.fillStyle = t.accent;
  C.roundRect(ctx, bx, by, bw, bh, 14);
  ctx.fill();
  C.drawText(ctx, '返回', bx + bw / 2, by + bh / 2, 13, '#FFFFFF', true);
  ctx.textAlign = 'left';
}

// ==================== 天空背景 ====================
function drawSky(ctx, t) {
  var grad = ctx.createLinearGradient(0, 0, 0, C.GAME_BOTTOM + 10);
  grad.addColorStop(0, t.sky[0]);
  grad.addColorStop(0.25, t.sky[1]);
  grad.addColorStop(0.55, t.sky[2]);
  grad.addColorStop(0.8, t.sky[3]);
  grad.addColorStop(1, t.sky[3]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, C.W, C.GAME_BOTTOM + 10);

  // 轻柔白云
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  var cloudOffset = Date.now() * 0.003;
  for (var ci = 0; ci < 4; ci++) {
    var cx = ((ci * 250 + cloudOffset) % (C.W + 200)) - 100;
    var cy = C.GAME_TOP + 70 + ci * 90;
    ctx.beginPath(); ctx.ellipse(cx, cy, 50, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 28, cy - 5, 35, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 18, cy + 2, 25, 7, 0.1, 0, Math.PI * 2); ctx.fill();
  }
}

// ==================== 地面 ====================
function drawGround(ctx, t) {
  ctx.fillStyle = t.grass;
  ctx.fillRect(0, C.GROUND_Y - 6, C.W, 12);
  ctx.fillStyle = t.ground;
  ctx.fillRect(0, C.GROUND_Y, C.W, C.H - C.GROUND_Y);

  ctx.fillStyle = 'rgba(200,185,160,0.3)';
  var offset = (Date.now() * 0.06) % 40;
  for (var x = -40 + offset; x < C.W + 40; x += 40) {
    ctx.fillRect(x, C.GROUND_Y, 22, 3);
  }
}

// ==================== 分数面板（游戏中） ====================
function drawScorePanel(ctx, score, t) {
  var pw = 90, ph = 32;
  var px = (C.W - pw) / 2, py = C.GAME_TOP + 2;

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  C.roundRect(ctx, px, py, pw, ph, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,180,0.25)';
  ctx.lineWidth = 0.5;
  C.roundRect(ctx, px, py, pw, ph, 16);
  ctx.stroke();

  C.drawText(ctx, score.toString(), C.W / 2, py + ph / 2, 19, t.textPri, true);
  ctx.textAlign = 'left';
}

// ==================== 开始画面 ====================
function drawStartScreen(ctx, t, stateData) {
  var currentAccessory = stateData.currentAccessory;
  var points = stateData.points;
  var unlockedThemes = stateData.unlockedThemes;
  var currentTheme = stateData.currentTheme;
  var avatarEnabled = stateData.avatarEnabled;
  var avatarImg = stateData.avatarImg;
  var userAvatarUrl = stateData.userAvatarUrl;

  // ---- 标题'噗噗鸟' ----
  var titleY = C.GAME_TOP + 40;
  C.drawText(ctx, '噗噗鸟', C.W / 2, titleY, 24, t.textPri, true);

  // ---- 副标题（两行规则说明） ----
  var subY = titleY + 28;
  C.drawText(ctx, '轻按跳跃 穿越管道', C.W / 2, subY, 12, t.textSec, false);
  C.drawText(ctx, '按住蓄力 收集星星', C.W / 2, subY + 18, 12, t.textSec, false);

  // ---- 积分（返回按钮下方：钻石图形 + 数字） ----
  var diamondCX = 30, diamondCY = C.SAFE_TOP + 44;
  var dw = 7, dh = 5;
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.moveTo(diamondCX, diamondCY - dh);
  ctx.lineTo(diamondCX + dw, diamondCY);
  ctx.lineTo(diamondCX, diamondCY + dh);
  ctx.lineTo(diamondCX - dw, diamondCY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  C.drawTextLeft(ctx, points.toString(), diamondCX + dw + 5, diamondCY, 13, t.textPri, true);

  // ---- 小鸟 logo（titleY + 200） ----
  var logoY = titleY + 200;
  var bigR = C.BIRD_SIZE * 3;
  var bob = Math.sin(Date.now() * 0.004) * 4;
  Bird.drawLogoBird(ctx, C.W / 2, logoY, bigR, t, currentAccessory, bob, avatarEnabled ? avatarImg : null);

  var btnRowY = logoY + 200;
  var circleR = 15;
  var spacing = 12;
  var totalW = circleR * 2 * 3 + spacing * 2;
  var startX = (C.W - totalW) / 2;
  var pinkFill = 'rgba(255,179,179,0.22)';
  var pinkBorder = 'rgba(255,159,143,0.55)';

  // 1. 主题按钮 — Canvas色块圆圈（bird色填充 + accent色描边）
  var btn1CX = startX + circleR;
  var isThemeLocked = !unlockedThemes[currentTheme];
  // 外圈边框
  ctx.strokeStyle = pinkBorder;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(btn1CX, btnRowY, circleR, 0, Math.PI * 2); ctx.stroke();
  // 内圈色块
  ctx.fillStyle = isThemeLocked ? '#D5D5D5' : t.bird;
  ctx.beginPath(); ctx.arc(btn1CX, btnRowY, circleR - 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isThemeLocked ? '#AAAAAA' : t.accent;
  ctx.lineWidth = isThemeLocked ? 1 : 1.5;
  ctx.beginPath(); ctx.arc(btn1CX, btnRowY, circleR - 2, 0, Math.PI * 2); ctx.stroke();
  if (isThemeLocked) {
    // 小锁图标
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.2;
    var lw = 7, lh = 6, ly = btnRowY - 1;
    ctx.beginPath();
    ctx.arc(btn1CX, ly, lw / 2, Math.PI, 0, false);
    ctx.stroke();
    ctx.strokeRect(btn1CX - lw / 2, ly, lw, lh);
  }

  // 2. 头像按钮 — 微信头像 / 人物图标（居中，最显眼）
  var btn2CX = startX + circleR * 3 + spacing;
  ctx.fillStyle = avatarEnabled ? 'rgba(255,200,180,0.35)' : pinkFill;
  ctx.beginPath(); ctx.arc(btn2CX, btnRowY, circleR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = avatarEnabled ? t.accent : pinkBorder;
  ctx.lineWidth = avatarEnabled ? 2 : 1;
  ctx.beginPath(); ctx.arc(btn2CX, btnRowY, circleR, 0, Math.PI * 2); ctx.stroke();
  if (avatarEnabled && avatarImg && avatarImg.width > 0) {
    // 显示头像缩略图
    ctx.save();
    ctx.beginPath();
    ctx.arc(btn2CX, btnRowY, circleR - 2, 0, Math.PI * 2);
    ctx.clip();
    var thumbScale = ((circleR - 2) * 2) / Math.min(avatarImg.width, avatarImg.height);
    ctx.drawImage(avatarImg, btn2CX - avatarImg.width * thumbScale / 2, btnRowY - avatarImg.height * thumbScale / 2, avatarImg.width * thumbScale, avatarImg.height * thumbScale);
    ctx.restore();
  } else {
    // 人物剪影图标
    var iconX = btn2CX, iconY = btnRowY;
    ctx.fillStyle = '#CCBBBB';
    ctx.beginPath();
    ctx.arc(iconX, iconY - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(iconX, iconY + 7, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. 配饰按钮 — 粉色底圆 + 微型小鸟(半径10px)戴配饰
  var btn3CX = startX + circleR * 5 + spacing * 2;
  ctx.fillStyle = pinkFill;
  ctx.beginPath(); ctx.arc(btn3CX, btnRowY, circleR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = pinkBorder;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(btn3CX, btnRowY, circleR, 0, Math.PI * 2); ctx.stroke();
  var mr = 10, bx = btn3CX, by = btnRowY;
  ctx.save();
  ctx.translate(bx, by);
  Bird.drawBirdBody(ctx, mr, t, false);
  Bird.drawAccessoryOnCtx(ctx, 0, 0, mr, t, currentAccessory);
  ctx.restore();

  // ---- Start 按钮（跟随主题色，带阴影+描边） ----
  var startBtnW = 140, startBtnH = 40;
  var startBtnX = (C.W - startBtnW) / 2;
  var startBtnCY = btnRowY + 50;

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  C.roundRect(ctx, startBtnX, startBtnCY - startBtnH / 2 + 2, startBtnW, startBtnH, 20);
  ctx.fill();

  // 主体 — 跟随主题色
  ctx.fillStyle = t.accent;
  C.roundRect(ctx, startBtnX, startBtnCY - startBtnH / 2, startBtnW, startBtnH, 20);
  ctx.fill();

  // 白色描边
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  C.roundRect(ctx, startBtnX, startBtnCY - startBtnH / 2, startBtnW, startBtnH, 20);
  ctx.stroke();

  C.drawText(ctx, '开始', C.W / 2, startBtnCY, 16, '#FFFFFF', true);

  ctx.textAlign = 'left';
}

// ==================== 主题选择面板 ====================
function drawThemePanel(ctx, t, stateData) {
  var points = stateData.points || 0;
  var unlockedThemes = stateData.unlockedThemes || {};
  var currentTheme = stateData.currentTheme;

  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, C.W, C.H);

  // 面板几何
  var pw = C.W * 0.82, ph = C.H * 0.52;
  var px = (C.W - pw) / 2, py = (C.H - ph) / 2;

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  C.roundRect(ctx, px + 2, py + 3, pw, ph, 18);
  ctx.fill();

  // 白色面板
  ctx.fillStyle = '#FFFFFF';
  C.roundRect(ctx, px, py, pw, ph, 18);
  ctx.fill();

  // 标题
  C.drawText(ctx, '主题选择', px + pw / 2, py + 28, 15, t.textPri, true);

  // 关闭按钮 x
  var closeCX = px + pw - 22, closeCY = py + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath(); ctx.arc(closeCX, closeCY, 12, 0, Math.PI * 2); ctx.fill();
  C.drawText(ctx, '✕', closeCX, closeCY, 13, '#999', true);

  // 列表区（clip）
  var listTop = py + 48, listBottom = py + ph - 12, listH = listBottom - listTop;
  var rowH = 44;
  var keys = Object.keys(C.THEMES);
  var totalH = keys.length * rowH;
  var maxScroll = Math.max(0, totalH - listH);
  var panelScroll = Math.max(0, Math.min(_panelState.scroll, maxScroll));
  _panelState.scroll = panelScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 4, listTop, pw - 8, listH);
  ctx.clip();

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var th = C.THEMES[key];
    var rowY = listTop - panelScroll + i * rowH;
    if (rowY + rowH < listTop || rowY > listBottom) continue;

    var isCurrent = key === currentTheme;
    var unlocked = unlockedThemes[key];

    // 当前主题高亮
    if (isCurrent) {
      ctx.fillStyle = 'rgba(255,179,179,0.13)';
      C.roundRect(ctx, px + 12, rowY + 2, pw - 24, rowH - 4, 8);
      ctx.fill();
    }

    // 主题名
    C.drawTextLeft(ctx, th.name, px + 26, rowY + rowH / 2, 12, t.textPri, false);

    // 色块预览
    var swCX = px + pw * 0.55, swCY = rowY + rowH / 2;
    ctx.fillStyle = th.bird;
    ctx.beginPath(); ctx.arc(swCX, swCY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(swCX, swCY, 10, 0, Math.PI * 2); ctx.stroke();

    // 状态文字（右对齐）
    var stX = px + pw - 30;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    if (unlocked) {
      if (isCurrent) {
        ctx.fillStyle = t.accent;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✓ 使用中', stX, rowY + rowH / 2 + 10 * 0.35);
      } else {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px sans-serif';
        ctx.fillText('已解锁', stX, rowY + rowH / 2 + 10 * 0.35);
      }
    } else {
      var canAfford = points >= th.unlock;
      ctx.fillStyle = canAfford ? t.accent : '#CCCCCC';
      ctx.font = '10px sans-serif';
      ctx.fillText(th.unlock + '分', stX, rowY + rowH / 2 + 10 * 0.35);
    }

    // 分隔线
    if (i < keys.length - 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px + 20, rowY + rowH);
      ctx.lineTo(px + pw - 20, rowY + rowH);
      ctx.stroke();
    }
  }

  ctx.restore();
  ctx.textAlign = 'left';
}

// ==================== 配饰选择面板 ====================
function drawAccessoryPanel(ctx, t, stateData) {
  var currentAccessory = stateData.currentAccessory || 'none';
  var points = stateData.points || 0;
  var unlockedAccessories = stateData.unlockedAccessories || { none: true };

  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, C.W, C.H);

  // 面板几何
  var pw = C.W * 0.82, ph = C.H * 0.48;
  var px = (C.W - pw) / 2, py = (C.H - ph) / 2;

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  C.roundRect(ctx, px + 2, py + 3, pw, ph, 18);
  ctx.fill();

  // 白色面板
  ctx.fillStyle = '#FFFFFF';
  C.roundRect(ctx, px, py, pw, ph, 18);
  ctx.fill();

  // 标题
  C.drawText(ctx, '配饰选择', px + pw / 2, py + 28, 15, t.textPri, true);

  // 关闭按钮 x
  var closeCX = px + pw - 22, closeCY = py + 18;
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.beginPath(); ctx.arc(closeCX, closeCY, 12, 0, Math.PI * 2); ctx.fill();
  C.drawText(ctx, '✕', closeCX, closeCY, 13, '#999', true);

  // 列表区（clip）
  var listTop = py + 48, listBottom = py + ph - 12, listH = listBottom - listTop;
  var rowH = 52;
  var totalH = C.ACC_KEYS.length * rowH;
  var maxScroll = Math.max(0, totalH - listH);
  var panelScroll = Math.max(0, Math.min(_panelState.scroll, maxScroll));
  _panelState.scroll = panelScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 4, listTop, pw - 8, listH);
  ctx.clip();

  for (var i = 0; i < C.ACC_KEYS.length; i++) {
    var key = C.ACC_KEYS[i];
    var acc = C.ACCESSORIES[key];
    var rowY = listTop - panelScroll + i * rowH;
    if (rowY + rowH < listTop || rowY > listBottom) continue;

    var isCurrent = key === currentAccessory;
    var unlocked = key === 'none' || unlockedAccessories[key];

    // 当前配饰高亮
    if (isCurrent) {
      ctx.fillStyle = 'rgba(255,179,179,0.13)';
      C.roundRect(ctx, px + 12, rowY + 2, pw - 24, rowH - 4, 8);
      ctx.fill();
    }

    // 配饰名（未解锁灰色）
    var nameColor = unlocked ? t.textPri : '#CCCCCC';
    C.drawTextLeft(ctx, acc.name, px + 26, rowY + rowH / 2, 12, nameColor, false);

    // 微型鸟预览（带配饰，未解锁灰度）
    var birdCX = px + pw * 0.56, birdCY = rowY + rowH / 2;
    ctx.save();
    ctx.translate(birdCX, birdCY);
    if (unlocked) {
      Bird.drawBirdBody(ctx, 10, t, false);
      Bird.drawAccessoryOnCtx(ctx, 0, 0, 10, t, key);
    } else {
      ctx.globalAlpha = 0.35;
      Bird.drawBirdBody(ctx, 10, t, false);
      Bird.drawAccessoryOnCtx(ctx, 0, 0, 10, t, key);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 状态文字（右对齐）
    var stX = px + pw - 30;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    if (unlocked) {
      if (isCurrent) {
        ctx.fillStyle = t.accent;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('✓ 使用中', stX, rowY + rowH / 2 + 10 * 0.35);
      } else {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px sans-serif';
        ctx.fillText('已解锁', stX, rowY + rowH / 2 + 10 * 0.35);
      }
    } else {
      var accCost = acc.cost || 0;
      var canAfford = points >= accCost;
      ctx.fillStyle = canAfford ? t.accent : '#CCCCCC';
      ctx.font = '10px sans-serif';
      ctx.fillText(accCost + '分', stX, rowY + rowH / 2 + 10 * 0.35);
    }

    // 分隔线
    if (i < C.ACC_KEYS.length - 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px + 20, rowY + rowH);
      ctx.lineTo(px + pw - 20, rowY + rowH);
      ctx.stroke();
    }
  }

  ctx.restore();
  ctx.textAlign = 'left';
}

// ==================== 游戏结束面板 ====================
function drawGameOverPanel(ctx, t, stateData) {
  var score = stateData.score;
  var medalLevel = stateData.medalLevel;
  var best = stateData.best;
  var unlockedThemes = stateData.unlockedThemes;

  var pw = C.W * 0.82, ph = C.H * 0.38;
  var px = (C.W - pw) / 2;
  var panelCenter = C.GAME_TOP + C.GAME_H / 2;
  var py = panelCenter - ph / 2;

  // 阴影
  ctx.fillStyle = 'rgba(180,160,170,0.15)';
  C.roundRect(ctx, px + 2, py + 3, pw, ph, 20);
  ctx.fill();

  // 面板背景
  ctx.fillStyle = 'rgba(255,252,250,0.95)';
  C.roundRect(ctx, px, py, pw, ph, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,200,210,0.35)';
  ctx.lineWidth = 0.5;
  C.roundRect(ctx, px, py, pw, ph, 20);
  ctx.stroke();

  // 标题
  var titleY = py + 30;
  C.drawText(ctx, '游戏结束', px + pw / 2, titleY, 11, t.textSec, true);

  // 分隔线
  ctx.fillStyle = 'rgba(220,200,210,0.3)';
  ctx.fillRect(px + 24, py + 46, pw - 48, 0.5);

  // 分数区
  var scoreY = py + 95;

  // 勋章
  if (medalLevel > 0) {
    var medalCX = px + pw * 0.28;
    var medalCY = scoreY;
    var medalColors = ['rgba(205,127,50,0.85)', 'rgba(192,192,192,0.85)', 'rgba(255,215,0,0.85)'];
    var medalEmoji = ['铜', '银', '金'];

    ctx.fillStyle = medalColors[medalLevel - 1].replace('0.85', '0.12');
    ctx.beginPath(); ctx.arc(medalCX, medalCY, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = medalColors[medalLevel - 1];
    ctx.beginPath(); ctx.arc(medalCX, medalCY, 24, 0, Math.PI * 2); ctx.fill();

    C.drawText(ctx, medalEmoji[medalLevel - 1], medalCX, medalCY, 22, '#fff', false);
  }

  var scoreTextX = medalLevel > 0 ? px + pw * 0.62 : px + pw / 2;

  // 分数底光
  ctx.fillStyle = 'rgba(220,200,210,0.12)';
  ctx.beginPath(); ctx.arc(scoreTextX, scoreY, 34, 0, Math.PI * 2); ctx.fill();

  C.drawText(ctx, score.toString(), scoreTextX, scoreY, 40, t.textPri, true);
  C.drawText(ctx, 'SCORE', scoreTextX, scoreY + 50, 10, t.textSec, true);

  // 最佳分数
  var bestLabel = '最高 ' + (best || 0);
  C.drawText(ctx, bestLabel, scoreTextX, scoreY + 72, 13, t.textSec, false);

  // "查看纪念卡" 按钮
  var cardBtnW = pw * 0.65, cardBtnH = 38;
  var cardBtnX = (C.W - cardBtnW) / 2;
  var cardBtnY = py + ph - cardBtnH - 58;

  ctx.fillStyle = 'rgba(255,220,220,0.5)';
  C.roundRect(ctx, cardBtnX, cardBtnY, cardBtnW, cardBtnH, 19);
  ctx.fill();
  ctx.strokeStyle = t.accent;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  C.roundRect(ctx, cardBtnX, cardBtnY, cardBtnW, cardBtnH, 19);
  ctx.stroke();
  ctx.globalAlpha = 1;
  C.drawText(ctx, '查看纪念卡', C.W / 2, cardBtnY + cardBtnH / 2, 13, t.textPri, true);

  // 再来一次按钮
  var btnW = pw * 0.65, btnH = 42;
  var btnX = (C.W - btnW) / 2;
  var btnY = py + ph - btnH - 10;

  ctx.fillStyle = 'rgba(200,160,160,0.2)';
  C.roundRect(ctx, btnX, btnY + 2, btnW, btnH, 21);
  ctx.fill();

  var btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
  btnGrad.addColorStop(0, t.accent);
  btnGrad.addColorStop(1, t.accentDark);
  ctx.fillStyle = btnGrad;
  C.roundRect(ctx, btnX, btnY, btnW, btnH, 21);
  ctx.fill();

  ctx.strokeStyle = t.accentDark;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.5;
  C.roundRect(ctx, btnX, btnY, btnW, btnH, 21);
  ctx.stroke();
  ctx.globalAlpha = 1;

  C.drawText(ctx, '再来一次', C.W / 2, btnY + btnH / 2, 15, '#FFFFFF', true);

  ctx.textAlign = 'left';
}

// ==================== 纪念卡画面 ====================
function drawMemorialScreen(ctx, t, stateData) {
  var score = stateData.score;
  var pipesPassed = stateData.pipesPassed || 0;
  var currentAccessory = stateData.currentAccessory;
  var memorialMsg = stateData.memorialMsg;
  var petals = stateData.petals;
  var userAvatarUrl = stateData.userAvatarUrl;

  // 背景
  ctx.fillStyle = t.bgCard;
  ctx.fillRect(0, 0, C.W, C.H);

  // 卡片区域
  var cardW = C.W * 0.82, cardH = C.H * 0.55;
  var cardX = (C.W - cardW) / 2;
  var cardY = C.GAME_TOP + C.GAME_H * 0.05;

  // 卡片阴影
  ctx.fillStyle = 'rgba(180,160,170,0.15)';
  C.roundRect(ctx, cardX + 2, cardY + 3, cardW, cardH, 24);
  ctx.fill();

  // 卡片背景
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  C.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.strokeStyle = t.accent;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  C.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 头像 / 占位符
  var avatarCY = cardY + 22, avatarR = 16;
  if (userAvatarUrl && _memAvatarImg && _memAvatarImg._src === userAvatarUrl && _memAvatarImg.width > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(C.W / 2, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    var scale = (avatarR * 2) / Math.min(_memAvatarImg.width, _memAvatarImg.height);
    ctx.drawImage(_memAvatarImg, C.W / 2 - _memAvatarImg.width * scale / 2, avatarCY - _memAvatarImg.height * scale / 2, _memAvatarImg.width * scale, _memAvatarImg.height * scale);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(C.W / 2, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.stroke();
  } else if (userAvatarUrl && (!_memAvatarImg || _memAvatarImg._src !== userAvatarUrl)) {
    // 异步加载头像
    _memAvatarImg = wx.createImage();
    _memAvatarImg._src = userAvatarUrl;
    _memAvatarImg.src = userAvatarUrl;
    // 加载期间画虚线圆
    _drawAvatarPlaceholder(ctx, C.W / 2, avatarCY, avatarR, t);
  } else {
    _drawAvatarPlaceholder(ctx, C.W / 2, avatarCY, avatarR, t);
  }

  // 标题
  C.drawText(ctx, '飞行纪念', C.W / 2, cardY + 58, 18, t.textPri, true);

  // 小鸟
  var birdCY = cardY + cardH * 0.38, bigR = C.BIRD_SIZE * 2.2;
  var avatarEnabled = stateData.avatarEnabled;
  var avatarImg = stateData.avatarImg;
  Bird.drawLogoBird(ctx, C.W / 2, birdCY, bigR, t, currentAccessory, 0, avatarEnabled ? avatarImg : null);

  // 分数 + 管道双数据
  var scoreAreaY = cardY + cardH * 0.62;
  C.drawText(ctx, score.toString(), C.W / 2, scoreAreaY, 40, t.textPri, true);
  C.drawText(ctx, pipesPassed + ' 根管道', C.W / 2, scoreAreaY + 32, 12, t.textSec, false);
  var eff = pipesPassed > 0 ? (score / pipesPassed).toFixed(1) : '0';
  C.drawText(ctx, '均分 ' + eff + '/管', C.W / 2, scoreAreaY + 48, 11, t.textSec, false);

  // 寄语
  var msgY = cardY + cardH * 0.82;
  var lines = (memorialMsg || C.MEMORIAL_MSGS[0]).split('\n');
  for (var li = 0; li < lines.length; li++) {
    C.drawText(ctx, lines[li], C.W / 2, msgY + li * 22, 14, t.textPri, true);
  }

  // 按钮区域
  var btnAreaY = cardY + cardH + 10;
  var btnW = C.W * 0.34, btnH = 40;
  var btnSpacing = C.W * 0.04;

  // 分享好友按钮
  var shareBtnX = (C.W - btnW * 2 - btnSpacing) / 2;
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.15;
  C.roundRect(ctx, shareBtnX, btnAreaY, btnW, btnH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 1;
  C.roundRect(ctx, shareBtnX, btnAreaY, btnW, btnH, 20);
  ctx.stroke();
  C.drawText(ctx, '分享好友', shareBtnX + btnW / 2, btnAreaY + btnH / 2, 13, t.textPri, true);

  // 保存相册按钮
  var saveBtnX = shareBtnX + btnW + btnSpacing;
  ctx.fillStyle = t.accent;
  C.roundRect(ctx, saveBtnX, btnAreaY, btnW, btnH, 20);
  ctx.fill();
  C.drawText(ctx, '保存相册', saveBtnX + btnW / 2, btnAreaY + btnH / 2, 13, '#fff', true);

  // 再来一次按钮
  var replayBtnX = (C.W - btnW) / 2;
  btnAreaY = btnAreaY + btnH + 10;
  ctx.fillStyle = t.accent;
  C.roundRect(ctx, replayBtnX, btnAreaY, btnW, btnH, 20);
  ctx.fill();
  C.roundRect(ctx, replayBtnX, btnAreaY, btnW, btnH, 20);
  ctx.fill();
  C.drawText(ctx, '再来一次', replayBtnX + btnW / 2, btnAreaY + btnH / 2, 15, '#FFFFFF', true);

  ctx.textAlign = 'left';

  // 花瓣在纪念卡画面上继续飘
  if (petals.length > 0) Particles.drawPetals(ctx, petals);
}

// ==================== 触摸命中检测 ====================

// 检查返回按钮点击
function hitBackButton(tx, ty) {
  return tx >= C.backBtn.x - 6 && tx <= C.backBtn.x + C.backBtn.w + 6 &&
         ty >= C.backBtn.y - 6 && ty <= C.backBtn.y + C.backBtn.h + 6;
}

// 面板几何辅助（与 drawThemePanel / drawAccessoryPanel 保持一致）
function _panelGeo(panelType) {
  var pw = C.W * 0.82;
  var ph = panelType === 'theme' ? C.H * 0.52 : C.H * 0.48;
  var px = (C.W - pw) / 2;
  var py = (C.H - ph) / 2;
  var listTop = py + 48;
  var listBottom = py + ph - 12;
  var rowH = panelType === 'theme' ? 44 : 52;
  return { pw: pw, ph: ph, px: px, py: py, listTop: listTop, listBottom: listBottom, rowH: rowH };
}

// 检查菜单画面点击（返回 {action, ...}）
function hitTestMenu(tx, ty, stateData) {
  var t = stateData.t;
  var unlockedThemes = stateData.unlockedThemes;
  var currentAccessory = stateData.currentAccessory || 'none';
  var paneling = stateData.paneling || null;

  // ---- 面板内命中 ----
  if (paneling === 'theme' || paneling === 'accessory') {
    var geo = _panelGeo(paneling);
    var panelScroll = stateData.panelScroll || 0;

    // 关闭按钮 x（扩大触摸区）
    var closeCX = geo.px + geo.pw - 22, closeCY = geo.py + 18;
    if (Math.sqrt((tx - closeCX) * (tx - closeCX) + (ty - closeCY) * (ty - closeCY)) < 16) {
      return { action: 'closePanel' };
    }

    // 面板外 → 关闭
    if (tx < geo.px - 10 || tx > geo.px + geo.pw + 10 ||
        ty < geo.py - 10 || ty > geo.py + geo.ph + 10) {
      return { action: 'closePanel' };
    }

    // 列表区内命中行
    if (ty >= geo.listTop && ty <= geo.listBottom &&
        tx >= geo.px + 12 && tx <= geo.px + geo.pw - 12) {
      var keys = paneling === 'theme' ? Object.keys(C.THEMES) : C.ACC_KEYS;
      var idx = Math.floor((ty - geo.listTop + panelScroll) / geo.rowH);
      if (idx >= 0 && idx < keys.length) {
        var key = keys[idx];
        if (paneling === 'theme') {
          var th = C.THEMES[key];
          if (unlockedThemes[key]) {
            return { action: 'switchTheme', theme: key, closePanel: true };
          } else if ((stateData.points || 0) >= th.unlock) {
            return { action: 'unlockTheme', theme: key, cost: th.unlock, closePanel: true };
          }
          // 积分不够：无声忽略
          return null;
        } else {
          var unlockedAccessories2 = stateData.unlockedAccessories || { none: true };
          if (key === 'none' || unlockedAccessories2[key]) {
            return { action: 'switchAccessory', accessory: key, closePanel: true };
          } else {
            var accCost2 = C.ACCESSORIES[key] ? C.ACCESSORIES[key].cost : 0;
            if ((stateData.points || 0) >= accCost2) {
              return { action: 'unlockAccessory', accessory: key, cost: accCost2, closePanel: true };
            }
            return null;
          }
        }
      }
    }

    return null;
  }

  // ---- 正常菜单命中（面板未打开） ----
  // 按钮行坐标：与 drawStartScreen 同步
  var titleY = C.GAME_TOP + 40;
  var logoY = titleY + 200;
  var btnRowY = logoY + 200;
  var circleR = 15;
  var spacing = 12;
  var totalW = circleR * 2 * 3 + spacing * 2;
  var startX = (C.W - totalW) / 2;

  // 1. 主题按钮 → 打开主题面板
  var btn1CX = startX + circleR;
  if (Math.sqrt((tx-btn1CX)*(tx-btn1CX) + (ty-btnRowY)*(ty-btnRowY)) < circleR + 4) {
    return { action: 'openPanel', panel: 'theme' };
  }

  // 2. 头像按钮 → 授权/切换头像纹理（居中）
  var btn2CX = startX + circleR * 3 + spacing;
  if (Math.sqrt((tx-btn2CX)*(tx-btn2CX) + (ty-btnRowY)*(ty-btnRowY)) < circleR + 4) {
    return { action: 'toggleAvatar' };
  }

  // 3. 配饰按钮 → 打开配饰面板
  var btn3CX = startX + circleR * 5 + spacing * 2;
  if (Math.sqrt((tx-btn3CX)*(tx-btn3CX) + (ty-btnRowY)*(ty-btnRowY)) < circleR + 4) {
    return { action: 'openPanel', panel: 'accessory' };
  }

  // 4. Start 按钮（btnRowY + 50，140x40 矩形检测）
  var startBtnW = 140, startBtnH = 40;
  var startBtnX = (C.W - startBtnW) / 2;
  var startBtnCY = btnRowY + 50;
  if (tx >= startBtnX && tx <= startBtnX + startBtnW &&
      ty >= startBtnCY - startBtnH / 2 && ty <= startBtnCY + startBtnH / 2) {
    return { action: 'startGame' };
  }

  // 其他区域：不做任何事
  return null;
}

// 检查游戏结束画面点击
function hitTestGameOver(tx, ty, stateData) {
  var pw = C.W * 0.82, ph = C.H * 0.38;
  var px = (C.W - pw) / 2;
  var panelCenter = C.GAME_TOP + C.GAME_H / 2;
  var py = panelCenter - ph / 2;

  // 查看纪念卡按钮
  var cardBtnW = pw * 0.65, cardBtnH = 38;
  var cardBtnX = (C.W - cardBtnW) / 2;
  var cardBtnY = py + ph - cardBtnH - 58;
  if (tx >= cardBtnX && tx <= cardBtnX + cardBtnW &&
      ty >= cardBtnY && ty <= cardBtnY + cardBtnH) {
    return { action: 'showMemorial' };
  }

  // 再来一次按钮
  var btnW = pw * 0.65, btnH = 42;
  var btnX = (C.W - btnW) / 2;
  var btnY = py + ph - btnH - 10;
  if (tx >= btnX && tx <= btnX + btnW &&
      ty >= btnY && ty <= btnY + btnH) {
    return { action: 'replay' };
  }

  return { action: 'none' };
}

// 检查纪念卡画面点击
function hitTestMemorial(tx, ty, userAvatarUrl) {
  var cardW = C.W * 0.82;
  var cardH = C.H * 0.55;
  var cardX = (C.W - cardW) / 2;
  var cardY = C.GAME_TOP + C.GAME_H * 0.05;

  // 头像占位区域（无头像时点击授权）
  var avatarCY = cardY + 22, avatarR = 20;
  if (!userAvatarUrl) {
    if (Math.sqrt((tx - C.W / 2) * (tx - C.W / 2) + (ty - avatarCY) * (ty - avatarCY)) < avatarR) {
      return { action: 'authAvatar' };
    }
  }

  var btnAreaY = cardY + cardH + 10;
  var btnW = C.W * 0.34, btnH = 40;
  var btnSpacing = C.W * 0.04;

  // 分享好友按钮
  var shareBtnX = (C.W - btnW * 2 - btnSpacing) / 2;
  if (tx >= shareBtnX && tx <= shareBtnX + btnW &&
      ty >= btnAreaY && ty <= btnAreaY + btnH) {
    return { action: 'shareCard' };
  }

  // 保存相册按钮
  var saveBtnX = shareBtnX + btnW + btnSpacing;
  if (tx >= saveBtnX && tx <= saveBtnX + btnW &&
      ty >= btnAreaY && ty <= btnAreaY + btnH) {
    return { action: 'saveToAlbum' };
  }

  // 再来一次按钮（单独一行居中）
  var replayBtnX = (C.W - btnW) / 2;
  var replayY = btnAreaY + btnH + 10;
  if (tx >= replayBtnX && tx <= replayBtnX + btnW &&
      ty >= replayY && ty <= replayY + btnH) {
    return { action: 'replay' };
  }

  return { action: 'none' };
}

// ==================== 面板触摸处理（内聚滚动+命中） ====================

// 重置面板状态（打开/关闭面板时调用）
function resetPanelState() {
  _panelState.scroll = 0;
  _panelState.touched = false;
  _panelState.didScroll = false;
}

// 处理面板内触摸：滚动、关闭、行选择
// 返回 {action, ...} 或 null
function handlePanelTouch(tx, ty, e, stateData) {
  var paneling = stateData.paneling;
  var geo = _panelGeo(paneling);

  // 获取当前触摸Y
  var ct;
  if (e.touches && e.touches.length > 0) {
    ct = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    ct = e.changedTouches[0].clientY;
  } else {
    return null;
  }

  var hasTouches = e.touches && e.touches.length > 0;
  var isOutside = tx < geo.px - 10 || tx > geo.px + geo.pw + 10 ||
                  ty < geo.py - 10 || ty > geo.py + geo.ph + 10;

  // touchStart：触摸点在面板外 → closePanel
  if (hasTouches && !_panelState.touched) {
    if (isOutside) return { action: 'closePanel' };
    _panelState.touched = true;
    _panelState.startY = ct;
    _panelState.touchY = ct;
    _panelState.didScroll = false;
    return null;
  }

  // 未激活面板触摸 → 不处理
  if (!_panelState.touched) return null;

  // touchMove：更新 scroll（delta>3px 才滚动，避免抖动）
  if (hasTouches) {
    var delta = Math.abs(_panelState.touchY - ct);
    if (delta > 3) _panelState.didScroll = true;

    var keys = paneling === 'theme' ? Object.keys(C.THEMES) : C.ACC_KEYS;
    var listH = geo.listBottom - geo.listTop;
    var totalH = keys.length * geo.rowH;
    var maxScroll = Math.max(0, totalH - listH);
    _panelState.scroll = Math.max(0, Math.min(
      _panelState.scroll + _panelState.touchY - ct, maxScroll
    ));
    _panelState.touchY = ct;
    return null;
  }

  // touchEnd
  var totalDelta = Math.abs(_panelState.startY - ct);
  _panelState.touched = false;

  // 滚动过(delta>6px) → 不响应点击
  if (totalDelta > 6) {
    _panelState.didScroll = false;
    return null;
  }
  _panelState.didScroll = false;

  // 关闭按钮 ✕
  var closeCX = geo.px + geo.pw - 22, closeCY = geo.py + 18;
  if (Math.sqrt((tx - closeCX) * (tx - closeCX) + (ty - closeCY) * (ty - closeCY)) < 16) {
    return { action: 'closePanel' };
  }

  // 面板外 → 关闭
  if (isOutside) return { action: 'closePanel' };

  // 列表区内命中行检测
  if (ty >= geo.listTop && ty <= geo.listBottom &&
      tx >= geo.px + 12 && tx <= geo.px + geo.pw - 12) {
    var keys = paneling === 'theme' ? Object.keys(C.THEMES) : C.ACC_KEYS;
    var idx = Math.floor((ty - geo.listTop + _panelState.scroll) / geo.rowH);
    if (idx >= 0 && idx < keys.length) {
      var key = keys[idx];
      if (paneling === 'theme') {
        var th = C.THEMES[key];
        if (stateData.unlockedThemes[key]) {
          return { action: 'switchTheme', theme: key, closePanel: true };
        } else if ((stateData.points || 0) >= th.unlock) {
          return { action: 'unlockTheme', theme: key, cost: th.unlock, closePanel: true };
        }
        return null;
      } else {
        var unlockedAccessories = stateData.unlockedAccessories || { none: true };
        if (key === 'none' || unlockedAccessories[key]) {
          return { action: 'switchAccessory', accessory: key, closePanel: true };
        } else {
          var accCost = C.ACCESSORIES[key] ? C.ACCESSORIES[key].cost : 0;
          if ((stateData.points || 0) >= accCost) {
            return { action: 'unlockAccessory', accessory: key, cost: accCost, closePanel: true };
          }
          return null;
        }
      }
    }
  }

  return null;
}

// ==================== 蓄力指示条（鸟上方） ====================
function drawChargeBar(ctx, chargeRatio, theme, birdY) {
  var t = C.getT(theme);
  var barX = C.BIRD_X - C.BIRD_SIZE * 0.6, barY = birdY - C.BIRD_SIZE * 0.7, barW = C.BIRD_SIZE * 1.2, barH = 5;
  // 发光背景
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  // 背景灰条
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(barX, barY, barW, barH);
  // 前景主题色条
  var fillW = barW * chargeRatio;
  if (fillW > 0) {
    ctx.fillStyle = t.accent;
    ctx.fillRect(barX, barY, fillW, barH);
    // 高亮尖端
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(barX + fillW - 4, barY, 4, barH);
  }
  // 满蓄闪烁
  if (chargeRatio >= 0.95) {
    var blink = 0.5 + 0.5 * Math.sin(Date.now() * 0.02);
    ctx.fillStyle = 'rgba(255,255,255,' + (blink * 0.5) + ')';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  }
}

// ==================== 调试面板（DEBUG 模式） ====================
function drawDebugButton(ctx) {
  if (!C.DEBUG) return;
  var btnW = 56, btnH = 28, bx = C.W - btnW - 10, by = C.H - btnH - 10;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  C.roundRect(ctx, bx, by, btnW, btnH, 14);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Debug', bx + btnW / 2, by + btnH / 2 + 11 * 0.35);
  ctx.textAlign = 'left';
}

function drawDebugPanel(ctx) {
  if (!C.DEBUG) return;
  var pw = 220, ph = 230, px = (C.W - pw) / 2, py = (C.H - ph) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, C.W, C.H);
  ctx.fillStyle = '#fff';
  C.roundRect(ctx, px, py, pw, ph, 16);
  ctx.fill();

  var items = ['+5 Points', '+50 Points', 'Clear Data', 'Unlock All', 'Close'];
  for (var i = 0; i < items.length; i++) {
    var iy = py + 24 + i * 42;
    ctx.fillStyle = '#eee';
    C.roundRect(ctx, px + 16, iy, pw - 32, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(items[i], px + pw / 2, iy + 22 + 14 * 0.35);
  }
  ctx.textAlign = 'left';
}

function hitTestDebug(tx, ty, paneling) {
  if (!C.DEBUG) return null;
  var btnW = 56, btnH = 28, bx = C.W - btnW - 10, by = C.H - btnH - 10;
  if (tx >= bx - 6 && tx <= bx + btnW + 6 && ty >= by - 6 && ty <= by + btnH + 6) {
    return { action: 'openDebug' };
  }
  if (paneling !== 'debug') return null;
  var pw = 220, ph = 230, px = (C.W - pw) / 2, py = (C.H - ph) / 2;
  if (tx < px || tx > px + pw || ty < py || ty > py + ph) return { action: 'closeDebug' };
  var relY = ty - py - 24;
  var idx = Math.floor(relY / 42);
  var actions = ['add5', 'add50', 'clear', 'unlockAll', 'closeDebug'];
  if (idx >= 0 && idx < actions.length) return { action: actions[idx] };
  return null;
}

module.exports = {
  drawBackButton: drawBackButton,
  drawSky: drawSky,
  drawGround: drawGround,
  drawScorePanel: drawScorePanel,
  drawChargeBar: drawChargeBar,
  drawStartScreen: drawStartScreen,
  drawThemePanel: drawThemePanel,
  drawAccessoryPanel: drawAccessoryPanel,
  drawGameOverPanel: drawGameOverPanel,
  drawMemorialScreen: drawMemorialScreen,
  drawDebugButton: drawDebugButton,
  drawDebugPanel: drawDebugPanel,
  hitBackButton: hitBackButton,
  hitTestMenu: hitTestMenu,
  hitTestGameOver: hitTestGameOver,
  hitTestMemorial: hitTestMemorial,
  hitTestDebug: hitTestDebug,
  resetPanelState: resetPanelState,
  handlePanelTouch: handlePanelTouch
};
