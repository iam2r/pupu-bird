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

wx.onTouchStart(function(e) { game.onTouch(e); });
wx.onTouchMove(function(e) { game.onTouch(e); });
wx.onTouchEnd(function(e) { game.onTouch(e); });

function loop(now) {
  var dt = lastTime ? (now - lastTime) / 1000 : 0.016;
  lastTime = now;
  game.update(dt);
  ctx.clearRect(0, 0, W, H);
  game.draw(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
