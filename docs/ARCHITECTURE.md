# 项目架构

## 概述

本项目是一个运行于**微信小游戏**平台的游戏合集应用。采用 **Hub + 游戏模块** 的架构模式，所有渲染基于 Canvas 2D API，无任何第三方框架依赖，纯原生 JavaScript 实现。

---

## 架构模式：Hub + 游戏模块

```
┌──────────────────────────────────────────┐
│               game.js (Hub)              │
│                                          │
│  ┌────────────┐  ┌────────────────────┐  │
│  │  游戏列表    │  │  触摸事件路由       │  │
│  │  卡片选择   │  │  onTouchStart/      │  │
│  │  游戏加载   │  │  Move/End 转发      │  │
│  └────────────┘  └────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │        gameLoop (RAF)            │    │
│  │   currentGame?.update(dt)        │    │
│  │   currentGame?.draw(ctx)         │    │
│  │   或 drawHub()                   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │flappy.js │ │snake.js  │ │block.js  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐              │
│  │ 2048.js  │ │breakout.js│             │
│  └──────────┘ └──────────┘              │
└──────────────────────────────────────────┘
```

### Hub (`game.js`) 职责

1. **初始化**：创建 Canvas、获取 2D 上下文、读取系统信息（屏幕尺寸、DPR、安全区域）
2. **游戏列表维护**：定义 5 个游戏入口的元数据（ID、名称、emoji、描述、主题色）
3. **游戏加载**：通过 `loadGame(id)` 函数 `require()` 对应的游戏模块文件
4. **Hub UI 绘制**：当 `currentGame === null` 时渲染游戏选择界面
5. **触摸事件路由**：根据 `currentGame` 是否存在，决定将触摸事件转发给游戏还是处理 Hub 卡片选择
6. **游戏循环**：统一驱动 `currentGame.update(dt)` 和 `currentGame.draw(ctx)`

### 游戏模块职责

每个游戏模块是一个**自包含的闭包**，管理自身的全部状态、逻辑和渲染。模块之间完全独立，无共享状态。

---

## 游戏模块标准接口（5 函数）

每个游戏模块通过 `module.exports` 导出以下 5 个函数，构成统一的契约接口：

### `init(canvas, ctx, params)`

- **调用时机**：用户从 Hub 选中游戏时
- **参数**：
  - `canvas` — 微信小游戏 Canvas 实例
  - `ctx` — Canvas 2D 渲染上下文
  - `params` — 包含 `{ onExit: Function }`，调用 `onExit()` 可返回 Hub
- **职责**：
  - 读取系统信息（屏幕尺寸、DPR、安全区域）
  - 计算游戏布局参数（棋盘位置、元素尺寸等）
  - 初始化返回按钮区域
  - 读取本地存储的最高分（如有）
  - 注册模块级别的触摸事件监听器（如 `wx.onTouchEnd`、`wx.onTouchMove`）
  - 调用内部的 `reset()` 函数重置游戏状态

### `update(dt)`

- **调用时机**：每帧，通过 `requestAnimationFrame` 驱动
- **参数**：`dt` — 距上一帧的时间增量（单位：秒）
- **职责**：
  - 仅在游戏进行中（非 START/DEAD/GAMEOVER 状态）执行逻辑
  - 更新游戏物理（位置、速度、碰撞检测等）
  - 处理定时器逻辑（如 Snake 移动间隔、Tetris 下落间隔）
  - `dt` 上限限制为 `0.1s` 防止掉帧跳跃

### `draw(ctx)`

- **调用时机**：每帧，在 `update` 之后
- **参数**：`ctx` — Canvas 2D 渲染上下文
- **职责**：
  - 按层次顺序绘制：背景 → 游戏元素 → UI 面板 → 返回按钮 → 覆盖层（开始/结束/胜利）
  - 不应对游戏状态做任何修改，纯渲染

### `onTouch(e)`

- **调用时机**：Hub 转发 `wx.onTouchStart`、`wx.onTouchMove`、`wx.onTouchEnd` 时
- **参数**：`e` — 微信小游戏触摸事件对象
- **职责**：
  - 首先检查返回按钮区域（优先级最高）
  - 根据当前游戏状态分发处理：
    - `START` → 开始游戏 / 切换方向
    - `PLAYING` → 游戏内操作（flap、移动、旋转等）
    - `DEAD` / `GAMEOVER` → 重新开始 / 继续
  - 通过 `e.touches[0].clientX/Y` 获取触摸坐标
  - 部分模块会检查 `e.type` 区分 `touchstart` / `touchmove` / `touchend`

### `destroy()`

- **调用时机**：游戏模块卸载时（目前仅在模块内部触发）
- **职责**：
  - 设置 `active = false` 标记阻止回调执行
  - 注销模块级别注册的事件监听器（`wx.offTouchEnd`、`wx.offTouchMove`）
  - 清理引用，防止内存泄漏

---

## 触摸事件转发机制

### Hub 层的全局监听

`game.js` 在 `wx` 对象上注册三个全局触摸事件监听器：

```javascript
wx.onTouchStart(function(e) {
  if (currentGame) { currentGame.onTouch(e); return; }
  // Hub 卡片选择逻辑...
});

wx.onTouchMove(function(e) {
  if (currentGame && currentGame.onTouch) currentGame.onTouch(e);
});

wx.onTouchEnd(function(e) {
  if (currentGame && currentGame.onTouch) currentGame.onTouch(e);
});
```

**路由逻辑**：
- 若 `currentGame` 存在 → 转发给 `currentGame.onTouch(e)`
- 若 `currentGame === null` → Hub 自己处理卡片选择（仅在 `onTouchStart` 中）

### 游戏模块内的触摸处理

各模块的 `onTouch` 函数统一处理逻辑如下：

```
触摸事件
  ├─ 返回按钮区域？ → 调用 onExit() 返回 Hub
  ├─ 状态 = START？ → 开始游戏
  ├─ 状态 = DEAD/GAMEOVER？ → 检查按钮/面板区域 → 重新开始
  ├─ 状态 = PLAYING？ → 游戏内操作（flap/移动/旋转）
  └─ 胜利弹窗？ → 点击继续
```

返回按钮的命中检测统一扩展 **6px** 热区：

```javascript
if (tx >= backBtn.x - 6 && tx <= backBtn.x + backBtn.w + 6 &&
    ty >= backBtn.y - 6 && ty <= backBtn.y + backBtn.h + 6) {
  if (onExit) onExit();
  return;
}
```

### 模块级额外监听

部分游戏需要在 Hub 转发的 `onTouch` 之外注册额外的触摸监听器：

| 游戏 | 额外监听 | 原因 |
|------|----------|------|
| 2048 | `wx.onTouchEnd`（`touchendHandler`） | 需要在手指离开后检测滑动方向和距离，因为滑动过程中只有 `touchstart`/`touchmove` 被转发 |
| Block Puzzle | `wx.onTouchEnd`（`touchendHandler`） | 同上，检测 swipe 方向 vs 点击旋转 |
| Breakout | `wx.onTouchMove`（直接注册） | 挡板需要持续跟随手指位置，不依赖 Hub 转发 |

这些额外监听器在 `init()` 中注册，在 `destroy()` 中注销。

---

## 文件结构

```
flappy-wxgame/
├── game.js              # Hub 入口，游戏列表、卡片选择、事件路由、游戏循环
├── game.json            # 微信小游戏配置文件
├── project.config.json  # 微信开发者工具项目配置
├── src/
│   ├── game.js          # Hub 模块（实际入口）
│   ├── flappy-bird.js   # 噗噗鸟游戏模块
│   ├── snake.js         # 贪吃蛇游戏模块
│   ├── block-puzzle.js  # 方块消消乐游戏模块（Hub ID 为 "tetris"）
│   ├── 2048.js          # 数字拼图游戏模块
│   └── breakout.js      # 打砖块游戏模块
└── docs/                # 项目文档
    ├── STYLE.md         # 设计风格规范
    ├── ARCHITECTURE.md  # 项目架构（本文件）
    └── GAMES.md         # 游戏列表和操作说明
```

### 文件说明

| 文件 | 行数 (约) | 依赖 | 说明 |
|------|----------|------|------|
| `src/game.js` | ~250 | 无 | Hub 入口，管理游戏列表和生命周期 |
| `src/flappy-bird.js` | ~500 | 无 | Flappy Bird 克隆，管道飞行 |
| `src/snake.js` | ~600 | 无 | 经典贪吃蛇，滑动方向控制 |
| `src/block-puzzle.js` | ~800 | 无 | 俄罗斯方块，含侧面板和旋转按钮 |
| `src/2048.js` | ~700 | 无 | 2048 数字合并，含胜利弹窗 |
| `src/breakout.js` | ~730 | 无 | 打砖块，触控挡板，5行砖块 |

### 关键约定

- **无公共工具模块**：`roundRect()` 函数在每个游戏模块中重复定义（~17 行/处），未抽取为共享代码
- **无模块间通信**：游戏模块之间零依赖，完全独立
- **命名不一致**：Hub 中 ID 为 `"tetris"` 的游戏实际加载的是 `block-puzzle.js`
- **作用域风格不一致**：Snake 和 2048 使用 `var`，其余模块混用 `let`/`const`
- **存储键名**：最高分通过 `wx.setStorageSync`/`wx.getStorageSync` 持久化，键名为 `"game2048_best"`、`"blockpuzzle_best"`、`"breakout_best"`、`"snake_best"`（Flappy Bird 不持久化最高分）

### 游戏加载映射

```javascript
function loadGame(id) {
  if (id === "flappy-bird") return require("./flappy-bird.js");
  if (id === "snake")       return require("./snake.js");
  if (id === "tetris")      return require("./block-puzzle.js"); // 注意：文件名与 ID 不同
  if (id === "2048")        return require("./2048.js");
  if (id === "breakout")    return require("./breakout.js");
  return null;
}
```

---

## 状态机模式

所有游戏模块内部均使用状态机管理游戏流程：

```
        ┌─────────┐
        │  START  │  初始/等待开始画面
        └────┬────┘
             │ 用户触摸/滑动
        ┌────▼────┐
        │ PLAYING │  游戏进行中
        └────┬────┘
             │ 死亡/失败条件触发
    ┌────────┴────────┐
    ▼                 ▼
┌──────┐         ┌──────────┐
│ DEAD │         │ GAMEOVER │  (Breakout 区分：有剩余命 vs 无命)
└──┬───┘         └────┬─────┘
   │ 触摸             │ 触摸
   ▼                  ▼
┌─────────┐     ┌─────────┐
│ PLAYING │     │  START  │  重新开始
└─────────┘     └─────────┘
```

各模块状态定义：

| 游戏 | 状态集 |
|------|--------|
| Flappy Bird | `START`, `PLAYING`, `DEAD` |
| Snake | `START`, `PLAYING`, `DEAD` |
| Block Puzzle | `START`, `PLAYING`, `GAMEOVER` |
| 2048 | 无显式状态机，通过 `gameOver`, `won`, `showWinOverlay` 布尔标志管理 |
| Breakout | `START`, `PLAYING`, `DEAD`（掉球有剩余命）, `GAMEOVER`（命耗尽） |

---

## 游戏循环与帧时序

```
requestAnimationFrame(gameLoop)
  │
  ├─ dt = (now - lastTime) / 1000   (首帧 fallback 0.016)
  │
  ├─ currentGame.update(dt)
  │     ├─ 仅 PLAYING 状态执行逻辑
  │     └─ dt 钳制上限 0.1s
  │
  ├─ ctx.clearRect(0, 0, W, H)
  │
  └─ currentGame
       ├─ 存在 → currentGame.draw(ctx)
       └─ null  → drawHub()
```

- 帧率由系统 `requestAnimationFrame` 决定（通常 60fps）
- 物理逻辑基于时间增量 `dt`，与帧率无关
- 渲染每帧全量重绘（非脏矩形）

---

## 本地存储

使用微信小游戏同步存储 API 持久化最高分：

| 存储键 | 对应游戏 | 读写位置 |
|--------|----------|----------|
| `"game2048_best"` | 2048 数字拼图 | `2048.js` init/reset |
| `"blockpuzzle_best"` | 方块消消乐 | `block-puzzle.js` init/reset |
| `"breakout_best"` | 打砖块 | `breakout.js` init/reset |
| `"snake_best"` | 贪吃蛇 | `snake.js` init/reset |
| （无持久化） | Flappy Bird | 每局结束后仅内存保留 |

读取模式（容错处理）：
```javascript
try {
  best = wx.getStorageSync("game2048_best") || 0;
} catch (e) {
  best = 0;
}
```
