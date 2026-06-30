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

// 触控回调
wx.onTouchStart(function(e) { game.onTouch(e); });
wx.onTouchMove(function(e) { game.onTouch(e); });
wx.onTouchEnd(function(e) { game.onTouch(e); });

// 开放数据域 shared canvas（排行榜）
var openDataContext = wx.getOpenDataContext();
var sharedCanvas = openDataContext.canvas;
sharedCanvas.width = W * dpr;
sharedCanvas.height = H * dpr;

function loop(now) {
  var dt = lastTime ? (now - lastTime) / 1000 : 0.016;
  lastTime = now;
  game.update(dt);
  ctx.clearRect(0, 0, W, H);
  game.draw(ctx);
  // 排行榜 shared canvas 叠加（未显示时透明无影响）
  ctx.drawImage(sharedCanvas, 0, 0, W, H);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
