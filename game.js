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
