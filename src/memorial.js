// memorial.js — 死亡纪念卡离屏 Canvas 生成
// 依赖: config.js（THEMES、MEMORIAL_MSGS、roundRect、seededRandom、getTodayStr、BIRD_SIZE）

var C = require('./config.js');

// 模块私有：离屏 Canvas 引用
var memorialCanvas = null;
var memorialCtx = null;
var avatarImage = null;

// 确保离屏 Canvas 存在
function ensureMemorialCanvas() {
  if (memorialCanvas) return;
  try {
    memorialCanvas = wx.createCanvas();
    memorialCanvas.width = 750;
    memorialCanvas.height = 1100;
    memorialCtx = memorialCanvas.getContext('2d');
    console.log('memorial canvas created:', !!memorialCtx);
  } catch(e) {
    console.error('memorial canvas failed:', e);
    memorialCanvas = null;
    memorialCtx = null;
  }
}

// 获取离屏 Canvas（供外部保存用）
function getMemorialCanvas() {
  return memorialCanvas;
}

// 渲染纪念卡到离屏 Canvas
// drawAcc(ctx, cx, cy, r, t, accKey) — 由 game.js 传入 bird.drawAccessoryOnCtx
function renderMemorialCard(score, pipesPassed, currentTheme, currentAccessory, memorialMsg, drawAcc, userAvatarUrl) {
  ensureMemorialCanvas();
  if (!memorialCtx) return;

  var ctx = memorialCtx;
  var cw = 750, ch = 1100;
  var t = C.THEMES[currentTheme];
  var msg = memorialMsg || C.MEMORIAL_MSGS[0];

  // 清空
  ctx.clearRect(0, 0, cw, ch);

  // 渐变背景
  var bg = ctx.createLinearGradient(0, 0, 0, ch);
  bg.addColorStop(0, t.sky[0]);
  bg.addColorStop(0.4, t.sky[2]);
  bg.addColorStop(1, t.sky[3]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);

  // 装饰花瓣
  var pColors = t.petal;
  for (var i = 0; i < 40; i++) {
    var px = C.seededRandom('petal' + i + currentTheme) * cw;
    var py = C.seededRandom('py' + i + currentTheme) * ch;
    var ps = C.seededRandom('ps' + i) * 14 + 6;
    ctx.save();
    ctx.globalAlpha = C.seededRandom('pa' + i) * 0.3 + 0.08;
    ctx.translate(px, py);
    ctx.rotate(C.seededRandom('pr' + i) * Math.PI * 2);
    ctx.fillStyle = pColors[Math.floor(C.seededRandom('pc' + i) * pColors.length)];
    ctx.beginPath();
    ctx.ellipse(0, 0, ps, ps * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 白色卡面
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  C.roundRect(ctx, 60, 100, cw - 120, ch - 200, 40);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,180,190,0.35)';
  ctx.lineWidth = 2;
  C.roundRect(ctx, 60, 100, cw - 120, ch - 200, 40);
  ctx.stroke();

  // 顶部装饰线
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.5;
  C.roundRect(ctx, 140, 160, cw - 280, 3, 1.5);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 微信头像
  if (userAvatarUrl) {
    if (!avatarImage || avatarImage._src !== userAvatarUrl) {
      avatarImage = wx.createImage();
      avatarImage._src = userAvatarUrl;
      avatarImage.src = userAvatarUrl;
    }
    if (avatarImage.width > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cw / 2, 70, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImage, cw / 2 - 30, 40, 60, 60);
      ctx.restore();
    }
    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cw / 2, 70, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 标题
  ctx.fillStyle = t.textPri;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('飞行纪念', cw / 2, 210 + 36 * 0.35);

  // 小鸟插图（大号）
  var birdCX = cw / 2, birdCY = 380, bigR = 70;
  ctx.save(); ctx.translate(birdCX, birdCY);

  // 身体
  ctx.fillStyle = t.bird;
  ctx.beginPath(); ctx.arc(0, 0, bigR, 0, Math.PI * 2); ctx.fill();
  // 腮红
  ctx.fillStyle = t.birdBlush;
  ctx.beginPath(); ctx.arc(-bigR * 0.2, bigR * 0.35, bigR * 0.22, 0, Math.PI * 2); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(bigR * 0.4, -bigR * 0.3, bigR * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3A2A3A';
  ctx.beginPath(); ctx.arc(bigR * 0.5, -bigR * 0.3, bigR * 0.12, 0, Math.PI * 2); ctx.fill();
  // 鸟喙
  ctx.fillStyle = t.birdBeak;
  ctx.beginPath(); ctx.moveTo(bigR * 0.9, -4); ctx.lineTo(bigR * 1.8, 2); ctx.lineTo(bigR * 0.9, 8); ctx.fill();
  // 翅膀
  ctx.fillStyle = t.birdWing;
  ctx.beginPath(); ctx.ellipse(-bigR * 0.2, bigR * 0.1, bigR * 0.8, bigR * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
  // 配饰（通过回调绘制）
  if (drawAcc) drawAcc(ctx, 0, 0, bigR, t, currentAccessory);
  ctx.restore();

  // 分数
  ctx.fillStyle = t.textPri;
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(score.toString(), cw / 2, 500 + 72 * 0.35);

  // 管道数
  ctx.fillStyle = t.textSec;
  ctx.font = 'bold 18px sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(pipesPassed + ' 根管道', cw / 2, 540 + 18 * 0.35);

  // 效率
  var efficiency = pipesPassed > 0 ? (score / pipesPassed).toFixed(1) : '0';
  ctx.font = '14px sans-serif';
  ctx.fillText('均分 ' + efficiency + '/管', cw / 2, 565 + 14 * 0.35);

  // 分隔
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.3;
  C.roundRect(ctx, 200, 600, cw - 400, 1, 0.5);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 寄语（支持换行）
  var lines = msg.split('\n');
  var msgY = 660;
  ctx.fillStyle = t.textPri;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (var li = 0; li < lines.length; li++) {
    ctx.fillText(lines[li], cw / 2, msgY + li * 36 + 22 * 0.35);
  }

  // 底部装饰
  var decoY = 780;
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.4;
  for (var di = 0; di < 5; di++) {
    ctx.beginPath();
    ctx.arc(cw / 2 + (di - 2) * 80, decoY, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 底部文字
  ctx.fillStyle = t.textSec;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t.name + ' · 治愈飞行日记', cw / 2, 870 + 16 * 0.35);
  ctx.fillText('噗噗鸟 · ' + C.getTodayStr(), cw / 2, 900 + 16 * 0.35);

  ctx.textAlign = 'left';
}

// 保存/分享纪念卡
var _shareImagePath = '';

function shareMemorialCard() {
  if (!memorialCanvas) {
    wx.showToast({ title: '生成失败', icon: 'none' });
    return;
  }
  memorialCanvas.toTempFilePath({
    success: function(res) {
      _shareImagePath = res.tempFilePath;
      if (wx.showShareImageMenu) {
        wx.showShareImageMenu({ path: res.tempFilePath });
      } else if (wx.shareAppMessage) {
        wx.shareAppMessage({ title: '来挑战我的噗噗鸟记录！', imageUrl: res.tempFilePath });
      }
    },
    fail: function() { wx.showToast({ title: '生成图片失败', icon: 'none' }); }
  });
}

function saveToAlbum(canvas) {
  var c = canvas || memorialCanvas;
  if (!c) {
    wx.showToast({ title: '生成失败', icon: 'none' });
    return;
  }
  // Step 1: canvas → temp file
  var genOpts = { x: 0, y: 0, width: c.width || 750, height: c.height || 1100, success: onTempFile, fail: function(e) { wx.showToast({ title: '生成图片失败', icon: 'none' }); } };
  if (c.toTempFilePath) c.toTempFilePath(genOpts);
  else if (wx.canvasToTempFilePath) { genOpts.canvas = c; wx.canvasToTempFilePath(genOpts); }
  else { wx.showToast({ title: '当前版本不支持', icon: 'none' }); }

  function onTempFile(res) {
    var fp = res.tempFilePath;
    _shareImagePath = fp;
    // Step 2: 隐私授权
    var tryAuth = function() {
      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success: function() { doSave(fp); },
        fail: function() {
          wx.openSetting({
            success: function(sr) {
              if (sr.authSetting['scope.writePhotosAlbum']) doSave(fp);
              else wx.showToast({ title: '请在设置中开启相册权限', icon: 'none' });
            }
          });
        }
      });
    };
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({ success: tryAuth, fail: tryAuth });
    } else {
      tryAuth();
    }
  }
  function doSave(fp) {
    wx.saveImageToPhotosAlbum({
      filePath: fp,
      success: function() { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
      fail: function(e) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    });
  }
}

function getShareImagePath() { return _shareImagePath; }

// 尝试获取离屏 Canvas 的临时路径
function prefetchMemorialImagePath(cb) {
  if (!memorialCanvas) { cb(''); return; }
  wx.canvasToTempFilePath({
    canvas: memorialCanvas,
    success: function(res) { cb(res.tempFilePath); },
    fail: function() { cb(''); }
  });
}

// 销毁（释放离屏 Canvas）
function destroyMemorialCanvas() {
  memorialCanvas = null;
  memorialCtx = null;
}

module.exports = {
  ensureMemorialCanvas: ensureMemorialCanvas,
  getMemorialCanvas: getMemorialCanvas,
  renderMemorialCard: renderMemorialCard,
  shareMemorialCard: shareMemorialCard,
  saveToAlbum: saveToAlbum,
  getShareImagePath: getShareImagePath,
  prefetchMemorialImagePath: prefetchMemorialImagePath,
  destroyMemorialCanvas: destroyMemorialCanvas
};
