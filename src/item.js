// item.js — 盲盒道具系统（Canvas绘制图标）
var C = require('./config.js');

var ITEMS = {
  shield: { name: '护盾', color: '#4FC3F7', prob: 0.40 },
  magnet: { name: '磁铁', color: '#FFB74D', prob: 0.25 },
  slow:   { name: '减速', color: '#81C784', prob: 0.20 },
  double: { name: '双倍', color: '#E57373', prob: 0.15 }
};

function randomType() {
  var r = Math.random(), acc = 0;
  var keys = Object.keys(ITEMS);
  for (var i = 0; i < keys.length; i++) {
    acc += ITEMS[keys[i]].prob;
    if (r < acc) return keys[i];
  }
  return keys[keys.length - 1];
}

function createItem(x, y) {
  return { x: x, y: y, collected: false, type: randomType(), phase: Math.random() * Math.PI * 2 };
}

// ---- Canvas 图标绘制 ----

function _drawShield(ctx, cx, cy, s) {
  // 盾牌轮廓
  ctx.fillStyle = '#4FC3F7';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx + s, cy - s * 0.5, cx + s * 0.8, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.4, cy + s);
  ctx.lineTo(cx, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.4, cy + s);
  ctx.lineTo(cx - s * 0.8, cy + s * 0.3);
  ctx.quadraticCurveTo(cx - s, cy - s * 0.5, cx, cy - s);
  ctx.fill();
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(cx - s * 0.2, cy - s * 0.3, s * 0.25, 0, Math.PI * 2); ctx.fill();
}

function _drawMagnet(ctx, cx, cy, s) {
  // 马蹄形磁铁
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = s * 0.35; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - s * 0.35, cy, s * 0.7, Math.PI * 0.2, Math.PI * 1.2, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.35, cy, s * 0.7, Math.PI * 0.8, Math.PI * 1.8, true);
  ctx.stroke();
  // N/S 极色块
  ctx.fillStyle = '#F44336';
  ctx.beginPath(); ctx.arc(cx - s * 0.5, cy - s * 0.55, s * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2196F3';
  ctx.beginPath(); ctx.arc(cx + s * 0.5, cy - s * 0.55, s * 0.3, 0, Math.PI * 2); ctx.fill();
}

function _drawSlow(ctx, cx, cy, s) {
  // 圆形时钟
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = s * 0.3;
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2); ctx.stroke();
  // 指针（指向7点方向 = 减速）
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = s * 0.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - s * 0.3, cy + s * 0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.2, cy - s * 0.5); ctx.stroke();
}

function _drawDouble(ctx, cx, cy, s) {
  // 两个小闪电代表双倍
  ctx.fillStyle = '#C62828';
  for (var di = 0; di < 2; di++) {
    var dx = cx + (di - 0.5) * s * 0.7;
    ctx.beginPath();
    ctx.moveTo(dx, cy - s);
    ctx.lineTo(dx - s * 0.3, cy - s * 0.1);
    ctx.lineTo(dx + s * 0.1, cy - s * 0.1);
    ctx.lineTo(dx - s * 0.1, cy + s);
    ctx.lineTo(dx + s * 0.4, cy + s * 0.1);
    ctx.lineTo(dx - s * 0.2, cy + s * 0.1);
    ctx.closePath();
    ctx.fill();
  }
}

function _drawTypeIcon(ctx, type, cx, cy, s) {
  if (type === 'shield') _drawShield(ctx, cx, cy, s);
  else if (type === 'magnet') _drawMagnet(ctx, cx, cy, s);
  else if (type === 'slow') _drawSlow(ctx, cx, cy, s);
  else if (type === 'double') _drawDouble(ctx, cx, cy, s);
}

// ---- 对外接口 ----

function drawItem(ctx, it) {
  ctx.save();
  var alpha = 0.65 + 0.25 * Math.sin(Date.now() * 0.004 + it.phase);
  var r = 12;
  ctx.globalAlpha = alpha;
  // 盲盒
  ctx.fillStyle = '#FFCC80';
  C.roundRect(ctx, it.x - r, it.y - r, r * 2, r * 2, 4); ctx.fill();
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 1;
  C.roundRect(ctx, it.x - r, it.y - r, r * 2, r * 2, 4); ctx.stroke();
  // 问号
  ctx.fillStyle = '#5D4037';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', it.x, it.y);
  ctx.restore();
}

function drawBackpack(ctx, bp, t, autoMode) {
  var slotW = 36, slotH = 40, gap = 6;
  var slotCount = C.BALANCE.backpackSlots;
  var autoW = 38, autoGap = 5;
  var totalW = slotW * slotCount + gap * (slotCount - 1) + autoGap + autoW;
  var startX = (C.W - totalW) / 2;
  var y = C.GROUND_Y - 4;
  // 背包槽
  for (var i = 0; i < slotCount; i++) {
    var sx = startX + i * (slotW + gap);
    ctx.fillStyle = i < bp.length ? t.scoreBg : 'rgba(255,255,255,0.25)';
    ctx.strokeStyle = t.accent; ctx.lineWidth = 1;
    C.roundRect(ctx, sx, y - slotH, slotW, slotH, 6); ctx.fill();
    C.roundRect(ctx, sx, y - slotH, slotW, slotH, 6); ctx.stroke();
    if (i < bp.length) {
      _drawTypeIcon(ctx, bp[i], sx + slotW / 2, y - slotH + 12, 8);
      ctx.fillStyle = '#333'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(ITEMS[bp[i]].name, sx + slotW / 2, y - 4);
    }
  }
  // AUTO 按钮
  var autoX = startX + slotCount * (slotW + gap) - gap + autoGap;
  ctx.fillStyle = autoMode ? t.accent : 'rgba(255,255,255,0.25)';
  ctx.strokeStyle = t.accent; ctx.lineWidth = 1;
  C.roundRect(ctx, autoX, y - slotH, autoW, slotH, 6); ctx.fill();
  C.roundRect(ctx, autoX, y - slotH, autoW, slotH, 6); ctx.stroke();
  ctx.fillStyle = autoMode ? '#fff' : t.textSec;
  ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AUTO', autoX + autoW / 2, y - slotH / 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function hitTestBackpack(tx, ty, bp) {
  if (!bp || bp.length === 0) return -1;
  var slotW = 36, slotH = 40, gap = 6;
  var slotCount = C.BALANCE.backpackSlots;
  var totalW = slotW * slotCount + gap * (slotCount - 1);
  var startX = (C.W - totalW) / 2;
  var y = C.GROUND_Y - 8;
  for (var i = 0; i < slotCount; i++) {
    var sx = startX + i * (slotW + gap);
    if (tx >= sx && tx <= sx + slotW && ty >= y - slotH && ty <= y) return i;
  }
  return -1;
}

function hitTestAuto(tx, ty) {
  var slotW = 36, slotH = 40, gap = 6, autoW = 38, autoGap = 5;
  var totalW = slotW * C.BALANCE.backpackSlots + gap * (C.BALANCE.backpackSlots - 1) + autoGap + autoW;
  var startX = (C.W - totalW) / 2;
  var autoX = startX + C.BALANCE.backpackSlots * (slotW + gap) - gap + autoGap;
  var y = C.GROUND_Y - 4;
  return (tx >= autoX && tx <= autoX + autoW && ty >= y - slotH && ty <= y);
}

function checkPickup(it, bx, by, br) {
  if (it.collected) return false;
  var dx = it.x - bx, dy = it.y - by;
  return Math.sqrt(dx * dx + dy * dy) < br * 1.4;
}

module.exports = {
  ITEMS: ITEMS,
  createItem: createItem,
  drawItem: drawItem,
  drawBackpack: drawBackpack,
  hitTestBackpack: hitTestBackpack,
  hitTestAuto: hitTestAuto,
  checkPickup: checkPickup
};
