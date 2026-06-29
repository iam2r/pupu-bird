# 噗噗鸟 技术架构

## 模块结构

```
pupu-bird/
├── game.js                # 入口：Canvas 创建 + 游戏循环
├── game.json              # 小游戏配置
├── project.config.json    # IDE 配置
└── src/
    ├── config.js          # 常量 + 10 主题 + 10 配饰 + 物理参数
    ├── game.js            # 主控：状态机 + 模块编排
    ├── bird.js            # 鸟绘制（含配饰叠加 + 蓄力视觉）
    ├── pipe.js            # 管道生成/绘制/碰撞
    ├── star.js            # 星星（普通/危险）+ 绘制
    ├── particles.js       # 花瓣粒子系统
    ├── memorial.js        # 离屏 Canvas 纪念卡生成
    ├── sound.js           # Web Audio 程序化音效
    ├── storage.js         # wx.Storage 封装
    └── ui.js              # 全部界面绘制 + 交互命中
```

## 状态机

```
MENU → PLAYING → DEAD → MEMORIAL
  ↑                ↓         ↓
  └──── restart ────┘    saveCard
```

## 物理参数

| 参数 | 值 | 说明 |
|------|:--:|------|
| GRAVITY_PX | 980 | 重力加速度 |
| CHARGE_MIN_VELOCITY | -350 | 轻点跳跃速度 |
| CHARGE_MAX_VELOCITY | -580 | 满蓄跳跃速度 |
| CHARGE_MAX_TIME | 0.25s | 满蓄所需时间 |
| SCROLL_SPEED | 120 | 管道滚动速度 |
| PIPE_SPACING | W×0.58 | 管道间距 |
| PIPE_GAP | H×0.17 | 管道缺口高度 |
| TERMINAL_V | 550 | 终端速度上限 |

## 音效系统

全部通过 `wx.createWebAudioContext()` 实时合成，零音频文件：

| 音效 | 触发时机 |
|------|----------|
| playFlap | 拍翅膀 |
| playScore | 过管道 |
| playDie | 死亡 |
| playFall | 下落呼啸 |
| playStarPickup | 吃星 |
| startCharge/updateCharge/stopCharge | 蓄力嗡声 |
| playChargeFull | 满蓄叮 |
| playInvincible | 无敌琶音 |
| playCombo | 连击旋律（1~5音） |
