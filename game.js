// 噗噗鸟 — 入口
var game = require("./src/game.js");

var info = wx.getSystemInfoSync();
var W = info.windowWidth, H = info.windowHeight;
var dpr = info.pixelRatio;

var canvas = wx.createCanvas();
var ctx = canvas.getContext("2d");
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

var lastTime = 0;
game.init(canvas, ctx, {});

// 开放数据域（排行榜 sharedCanvas）
var openDataCtx = wx.getOpenDataContext ? wx.getOpenDataContext() : null;
var leaderboardOpen = false;
game.setLeaderboardOpen = function(open) {
  leaderboardOpen = open;
  if (open) {
    if (openDataCtx) openDataCtx.postMessage({ action: 'refresh' });
  } else {
    if (openDataCtx) openDataCtx.postMessage({ action: 'hide' });
  }
};

// 隐私授权处理
if (wx.onNeedPrivacyAuthorization) {
  wx.onNeedPrivacyAuthorization(function(resolve) {
    wx.showModal({
      title: '隐私授权',
      content: '噗噗鸟需要相册权限来保存纪念卡',
      success: function(r) { resolve({ event: r.confirm ? 'agree' : 'disagree' }); }
    });
  });
}
if (wx.getPrivacySetting) {
  wx.getPrivacySetting({
    success: function(s) {
      if (!s.needAuthorization) console.log('privacy already authorized');
    }
  });
}

wx.onTouchStart(function(e) { game.onTouch(e); });
wx.onTouchMove(function(e) { game.onTouch(e); });
wx.onTouchEnd(function(e) { game.onTouch(e); });

function loop(now) {
  var dt = lastTime ? (now - lastTime) / 1000 : 0.016;
  lastTime = now;
  game.update(dt);
  ctx.clearRect(0, 0, W, H);
  game.draw(ctx);
  // 排行榜 sharedCanvas 叠加在最上层
  if (leaderboardOpen && openDataCtx && openDataCtx.canvas) {
    ctx.drawImage(openDataCtx.canvas, 0, 0, W, H);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
