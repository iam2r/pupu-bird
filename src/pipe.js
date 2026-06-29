// pipe.js — 管道生成 + 绘制
// 依赖: config.js（布局常量、辅助函数）

var C = require('./config.js');

// 创建管道对象
function createPipe(x, gapCenter) {
  return { x: x, gapCenter: gapCenter, passed: false, petalSpawned: false };
}

// 计算随机缺口中心（支持每日挑战种子）
function randomGapCenter(pipeIndex, isDailyChallenge) {
  var min = C.GAME_TOP + C.PIPE_GAP / 2 + 30;
  var max = C.GAME_BOTTOM - C.PIPE_GAP / 2 - 30;

  if (isDailyChallenge) {
    var seed = C.getTodayStr() + '_pipe_' + pipeIndex;
    var r = C.seededRandom(seed);
    return min + r * (max - min);
  }
  return min + Math.random() * (max - min);
}

// 绘制管道
function drawPipe(ctx, p, t) {
  var top = p.gapCenter - C.PIPE_GAP / 2;
  var bot = p.gapCenter + C.PIPE_GAP / 2;
  var pw = C.PIPE_WIDTH;

  ctx.fillStyle = t.pipe;
  ctx.fillRect(p.x, C.GAME_TOP, pw, top - C.GAME_TOP);
  ctx.fillRect(p.x, bot, pw, C.GAME_BOTTOM - bot);

  // 高光
  ctx.fillStyle = t.pipeDark;
  ctx.fillRect(p.x, C.GAME_TOP, 4, top - C.GAME_TOP);
  ctx.fillRect(p.x + pw - 4, C.GAME_TOP, 4, top - C.GAME_TOP);
  ctx.fillRect(p.x, bot, 4, C.GAME_BOTTOM - bot);
  ctx.fillRect(p.x + pw - 4, bot, 4, C.GAME_BOTTOM - bot);

  // 管口
  var lipW = pw + 8;
  ctx.fillStyle = t.pipe;
  ctx.fillRect(p.x - 4, top - 8, lipW, 8);
  ctx.fillRect(p.x - 4, bot, lipW, 8);
  ctx.fillStyle = t.pipeDark;
  ctx.fillRect(p.x - 4, top - 8, lipW, 3);
  ctx.fillRect(p.x - 4, bot + 5, lipW, 3);
}

// 检查鸟与管道碰撞
function checkCollision(p, birdX, birdY, birdR) {
  if (birdX + birdR > p.x && birdX - birdR < p.x + C.PIPE_WIDTH) {
    var top = p.gapCenter - C.PIPE_GAP / 2;
    var bot = p.gapCenter + C.PIPE_GAP / 2;
    if (birdY - birdR < top || birdY + birdR > bot) return true;
  }
  return false;
}

// 判断鸟是否已通过管道
function hasPassedPipe(p, birdX) {
  return !p.passed && p.x + C.PIPE_WIDTH < birdX;
}

module.exports = {
  createPipe: createPipe,
  randomGapCenter: randomGapCenter,
  drawPipe: drawPipe,
  checkCollision: checkCollision,
  hasPassedPipe: hasPassedPipe
};
