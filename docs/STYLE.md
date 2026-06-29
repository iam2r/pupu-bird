# 设计风格规范

## 概述

本项目采用**清新可爱风格**，以浅粉、浅紫、奶油色系为主色调，面向全年龄段用户。所有渲染基于微信小游戏 **Canvas 2D API**，适配 iPhone 竖屏。

---

## 配色方案

### 背景渐变（全项目统一）

所有页面和游戏模块使用四段垂直线性渐变：

| 位置 | 色值 | 说明 |
|------|------|------|
| 0% (顶部) | `#FDE8EC` / `#FDE4EC` | 浅粉 |
| 35%–40% | `#FEF5F0` / `#FEF0EB` | 奶油白 |
| 70%–75% | `#F5E8F6` / `#F2E4F6` | 浅紫 |
| 100% (底部) | `#EDE0F4` | 淡薰衣草 |

> **说明**：Hub（`#FDE8EC`）和游戏模块（`#FDE4EC`）的顶部起始色略有差异，其余停靠点一致。Block Puzzle 模块使用浅蓝色系变体（`#E8F4FD` → `#FEF9F0` → `#F5EEF8` → `#EDE4F4`）。

### 文字色

| 用途 | 色值 | 说明 |
|------|------|------|
| 主标题/纯黑文字 | `#1A1A1A` | Hub 游戏名称、主标题 |
| 深色标题 | `#4A2C4A` | 深紫灰，游戏内标题、分数数字 |
| 正文/描述 | `#555555` | 中灰，卡片描述文字 |
| 次级标签 | `rgba(155,120,155,0.45–0.7)` | 半透明紫灰，"SCORE"标签等 |
| 底部提示 | `#888888` | Hub 底部操作提示 |
| 返回按钮文字 | `#6B4C6B` | 粉紫灰 |
| Block Puzzle 专属标题 | `#3A3A4A` / `#4A5A6A` | 蓝灰调，匹配该模块浅蓝色系 |

### 游戏主题色

每个游戏模块拥有独立的品牌色，用于卡片选中边框、侧边竖条等处：

| 游戏 | 主题色 | 色名 |
|------|--------|------|
| 噗噗鸟 (Flappy Bird) | `#FF9F8F` | 珊瑚粉 |
| 贪吃蛇 (Snake) | `#C5B4E3` | 薰衣草紫 |
| 方块消消乐 (Block Puzzle) | `#A8D8EA` | 天空蓝 |
| 数字拼图 (2048) | `#FFE5A3` | 暖黄 |
| 打砖块 (Breakout) | `#FFB3BA` | 柔粉 |

### 游戏内元素色

#### Flappy Bird
- 小鸟身体：`#FFB3B3`，翅膀：`#F09898`，鸟喙：`#FFB347`，腮红：`#FFD4D4`
- 管道：`#FFB8B8`，暗边：`#F09898`
- 地面：`#FEF5E7`（奶油），草皮：`#B8DDC8`（柔绿）
- 死亡态小鸟：`#FEA0A0`，翅膀：`#E88888`

#### Snake
- 蛇头：`#FF8C7A`，蛇身交替：`#FFB3B3` / `#FFC4B8`
- 蛇眼白：`#FFFFFF`，瞳孔：`#3A2A3A`
- 食物：`#FF6B6B`（外），`#FF8585`（内）
- 网格交替色：`rgba(255,220,225,0.12)` / `rgba(255,235,230,0.10)`

#### Block Puzzle（7 种方块）
- I：`#4FC3F7`（浅蓝）
- O：`#FFD54F`（暖黄）
- T：`#CE93D8`（浅紫）
- S：`#81C784`（薄荷绿）
- Z：`#EF9A9A`（珊瑚红）
- J：`#64B5F6`（天蓝）
- L：`#FFB74D`（橘黄）

#### 2048 方块色阶

| 数值 | 背景色 | 文字色 |
|------|--------|--------|
| 2 | `#FDE4EC` | `#6B4C6B` |
| 4 | `#FDD8E0` | `#6B4C6B` |
| 8 | `#FFB3B3` | `#FFFFFF` |
| 16 | `#FF9F8F` | `#FFFFFF` |
| 32 | `#FF8C8C` | `#FFFFFF` |
| 64 | `#F07070` | `#FFFFFF` |
| 128 | `#F5E8F6` | `#4A2C4A` |
| 256 | `#EDE0F4` | `#4A2C4A` |
| 512 | `#D8B4E0` | `#FFFFFF` |
| 1024 | `#C5B4E3` | `#FFFFFF` |
| 2048 | `#FFE5A3` | `#6B4C6B` |
| 4096 | `#FFB347` | `#FFFFFF` |
| 8192 | `#FF6B6B` | `#FFFFFF` |

#### Breakout 砖块 5 行配色
1. `#FFB3B3` / 边框 `#F09898`（珊瑚粉）
2. `#FFD4B3` / 边框 `#F0B888`（杏橙）
3. `#FFE5A3` / 边框 `#F0D070`（奶油黄）
4. `#C5E8C5` / 边框 `#A0D0A0`（薄荷绿）
5. `#C5B4E3` / 边框 `#A898D0`（薰衣草紫）

### 按钮配色

| 按钮类型 | 渐变起止 |
|----------|----------|
| 通用"再来一次"/"继续游戏" | `#FFB3B3` → `#FF9F8F`（暖珊瑚粉渐变） |
| Block Puzzle "再来一次" | `#A8D8EA` → `#7EC8E3`（天空蓝渐变，匹配该模块主题） |

按钮文字统一使用 `#FFFFFF`（白色），边框使用半透明暖色描边。

### 卡片/面板配色

- Hub 卡片背景：`rgba(255,255,255,0.78)`，选中态 `rgba(255,255,255,0.95)`
- 游戏内面板背景：`rgba(255,255,255,0.55–0.95)`
- 奶油白弹窗：`rgba(255,252,250,0.95)`（游戏结束弹窗）
- 游戏结束遮罩：`#FEFAF7`（不透明实色，完全遮挡游戏区）
- 阴影色：`rgba(180,160,170,0.12–0.18)`
- 边框描边：`rgba(220,200,210,0.35)` / `rgba(200,180,200,0.25)`

### 背景装饰

- 小圆点颜色（交替）：粉色 `rgba(255,182,193,0.06–0.08)`、淡紫 `rgba(216,180,220,0.05–0.07)`、奶油橘 `rgba(255,218,185,0.06–0.08)`、浅蓝 `rgba(200,220,240,0.05–0.06)`
- 圆点数量：每页 16–24 个，散布位置通过模运算伪随机生成

---

## 字体规则

### 字体族

- **统一使用 `sans-serif`**（系统默认无衬线字体，无自定义字体文件）

### 字重与大小

| 用途 | 字号 | 字重 | 对齐 |
|------|------|------|------|
| Hub 主标题 "游戏中心" | 24px | bold | center |
| Hub 副标题 "GAME CENTER" | 10px | bold | center |
| Hub 游戏名称 | 15px | bold | left |
| Hub 游戏描述 | 11px | normal | left |
| Hub Emoji 图标 | 18px | normal | center |
| Hub 箭头 "›" | 16px | normal | right |
| Hub 底部提示 | 11px | normal | center |
| 返回按钮 "← 返回" | 12px | normal | center |
| 游戏标题 | 22–26px | bold | center |
| 游戏副标题/描述 | 11–12px | normal | center |
| 游戏分数数字 | 40–44px | bold | center |
| 游戏分数面板内数字 | 16–19px | bold | center |
| "SCORE" 标签 | 10px | bold | center |
| "最佳" 分数 | 13px | bold | center |
| 按钮文字 | 13–15px | bold | center |
| 2048 方块数字 | 动态计算 | bold | center |
| Block Puzzle 信息标签 | 9–10px | bold | center |
| Block Puzzle 信息数值 | 15px | bold | center |
| 胜利弹窗 | 20px | bold | center |

### 基线对齐

**所有文字绘制均使用 `alphabetic` 基准线，并通过 Y 轴偏移 `fontSize * 0.35` 补偿垂直居中**。这是因为 Canvas `alphabetic` 基线位于字符实际视觉中心之上，乘以 0.35 系数向下偏移后可实现视觉垂直居中。

```javascript
// 模式示例
ctx.textBaseline = "alphabetic";
var textOffset = fontSize * 0.35;
ctx.fillText(text, centerX, centerY + textOffset);
```

此项规则在**全部 6 个源文件、所有文字绘制处无例外地统一应用**。

---

## UI 组件模式

### 1. 圆角矩形 `roundRect(ctx, x, y, w, h, r)`

所有卡片、面板、按钮、方块、返回按钮均通过此辅助函数绘制。实现在每个模块文件中独立定义（未抽取公共模块），使用 `arcTo` 构建路径。

```javascript
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
```

### 2. Hub 游戏卡片

- 尺寸：`itemW = W - 2 × 18`，高 `78px`，间距 `10px`
- 圆角半径：`22px`
- 结构：阴影层（偏移 1,2）→ 半透明白色背景 → 左侧 4px 品牌色竖条 → Emoji 圆形底 → 右侧箭头
- 选中态：更高不透明度背景 + 品牌色边框描边

### 3. 返回按钮

- 位置：`(10, SAFE_TOP + 4)`，尺寸 `68 × 28px`
- 圆角半径：`14px`
- 半透明白色背景 `rgba(255,255,255,0.7)`
- 文字 `"← 返回"`，色值 `#6B4C6B`（Block Puzzle 为 `#5A6A7A`）
- 点击热区向四周扩展 **6px** 以提升可触性

### 4. 分数面板

- 游戏中悬浮在顶部的磨砂 pill，居中放置
- 尺寸约 `90–100 × 30–32px`，圆角 `15–16px`
- 背景 `rgba(255,255,255,0.55–0.65)`
- 内容为 emoji + 分数数字

### 5. 游戏结束弹窗

- 全屏不透明遮罩 `#FEFAF7` 或半透明遮罩 `rgba(255,240,245,0.5–0.55)`
- 居中圆角白色卡片 `rgba(255,252,250,0.95)`，宽 `W × 0.82`，高 `H × 0.28–0.34`
- 圆角半径 `20px`
- 内容结构：标题（"游戏结束"）→ 分隔线 → 分数 → "SCORE" 标签 → 最佳分数 → "再来一次"按钮
- 按钮：宽 `W × 0.54`，高 `42px`，圆角 `21px`，珊瑚粉渐变

### 6. 开始画面提示

- 底部居中 pill：宽 `140–170px`，高 `32px`，圆角 `16px`
- 文字如 "轻触屏幕开始"、"滑动屏幕开始"

### 7. 游戏标题柔光

- 使用径向渐变 `createRadialGradient`，中心点为标题位置
- 渐变从 `rgba(...0.1)` 到 `rgba(255,255,255,0)`，营造柔和光晕

### 8. 线性/径向渐变

- 背景使用 `createLinearGradient`（垂直）
- 按钮使用 `createLinearGradient`（垂直）
- 球体（Breakout）使用 `createRadialGradient`（高光到边缘）
- 标题光晕使用 `createRadialGradient`

### 9. 背景装饰圆点

- 颜色数组交替循环
- 位置通过模运算伪随机散布：`dx = (i × 173 + 41) % W`，`dy = (i × 257 + 83) % H`（不同模块质数略有差异）
- 半径 `0.5–1.0px`，数量 `16–24` 个

---

## DPI 与 Canvas 渲染规则

### 设备像素比 (DPR)

```javascript
var si = wx.getSystemInfoSync();
W = si.windowWidth;
H = si.windowHeight;
dpr = si.pixelRatio;
```

### Canvas 设置

```javascript
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);
```

- Canvas 物理像素尺寸 = 逻辑尺寸 × DPR
- 所有绘制坐标使用**逻辑像素**（即 `W`、`H` 坐标系），由 `ctx.scale(dpr, dpr)` 统一缩放
- 确保在 Retina / 高 DPI 屏幕上文字和图形清晰锐利

### 安全区域 (Safe Area)

```javascript
SAFE_TOP = si.safeArea?.top || si.statusBarHeight || 44;
```

- 优先读取 `safeArea.top`
- 降级到 `statusBarHeight`
- 完全不可用时默认 `44px`
- 所有 UI 元素（返回按钮、分数面板、游戏区域）均基于 `SAFE_TOP` 偏移布局，避免被刘海/状态栏遮挡

### 游戏循环

- 使用 `requestAnimationFrame(gameLoop)` 驱动
- 时间增量 `dt = (now - lastTime) / 1000`（单位：秒）
- 首帧无历史时间时默认 `dt = 0.016`（约 60fps）
- 物理计算中 `dt` 限制上限为 `0.1s`，防止掉帧后的大幅跳跃

---

## 其他视觉规则

### 阴影

- 投影色值统一：`rgba(180,160,170,0.12–0.18)`，暖灰调
- 偏移量通常为 `(1–2px, 2–3px)`
- 按钮、卡片、面板均使用阴影营造层次感

### 高光

- 方块/按钮顶部绘制白色半透明高光条，模拟光泽
- 如 `rgba(255,255,255,0.3)` 填充顶部 `2–4px`
- 球体（Breakout）使用径向渐变 + 白色高光点
- 蛇身段使用白色半透明顶部高光边缘

### 动画/动态效果

- 蛇食物：正弦脉冲缩放 `1 + sin(time × 0.005) × 0.08`
- Flappy Bird 白云：基于 `Date.now()` 水平平移
- Flappy Bird 地面纹理：基于时间水平滚动
- Breakout 球：径向渐变高光
- 所有动态效果通过 `Date.now()` 而非帧计数驱动，保证时间一致性
