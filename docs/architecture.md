# 心口不一 — ECS 架构文档

## 目录

- [1. 项目概述](#1-项目概述)
- [2. ECS 架构概述](#2-ecs-架构概述)
- [3. 核心层](#3-核心层)
- [4. 组件清单](#4-组件清单)
- [5. 实体清单](#5-实体清单)
- [6. 系统详解](#6-系统详解)
- [7. 游戏流程](#7-游戏流程)
- [8. 场景结构](#8-场景结构)
- [9. 扩展指南](#9-扩展指南)
- [10. 目录结构](#10-目录结构)

---

## 1. 项目概述

**心口不一**是一款剪刀石头布的心理博弈游戏。玩家宣称自己要出的招式（可以骗人），然后真正出招时可以选择反悔。AI 对手也会虚张声势。诚实获胜触发暴击（2 点伤害），骗人获胜只造成 1 点伤害。

### 技术栈

| 层 | 技术 |
|---|------|
| 游戏引擎 | Phaser 3.90 |
| 语言 | TypeScript (ES2022) |
| 构建 | Vite 6 |
| 架构 | ECS (Entity Component System) |
| 测试 | Playwright (e2e) |

### 分辨率

1170 × 2100（3x Retina 竖屏），通过 `Scale.FIT` + `CENTER_BOTH` 自适应缩放。

---

## 2. ECS 架构概述

### 为什么选择 ECS

传统 OOP 的 BattleScene 是 745 行的 God Object，包含 34 个私有字段和 20 个方法，游戏逻辑、UI 管理、动画控制混杂在一起。ECS 将三者严格分离：

- **Entity（实体）**：纯 ID，不包含任何数据或行为
- **Component（组件）**：纯数据接口，不包含任何方法
- **System（系统）**：纯逻辑，读取/写入组件数据

### 核心原则

```
组件 = 数据     （没有方法）
系统  = 逻辑     （没有状态，除了 Phaser 引用）
实体  = ID       （没有数据，没有行为）
```

系统之间不直接调用（PhaseSystem 作为指挥者是唯一例外）。所有通信通过组件数据进行：CombatSystem 写 `CombatEvent`，AnimationSystem 和 ResultSystem 读它。

### 系统分类

| 类别 | 系统 | 特点 |
|------|------|------|
| **纯逻辑** | AISystem, BobSystem, CombatSystem | 零 Phaser 依赖，可单测 |
| **Phaser 桥接** | RenderSystem, AnimationSystem, HealthBarSystem, InputSystem, DeclarationSystem, CountdownSystem, ResultSystem | 将 ECS 数据同步到 Phaser 对象 |
| **指挥者** | PhaseSystem | 持有所有定时逻辑，直接调用其他系统 |

### 更新模式

- **逐帧系统**（3 个）：BobSystem, HealthBarSystem, RenderSystem — 注册到 World，每 16ms 执行一次
- **回调驱动系统**（8 个）：PhaseSystem, InputSystem, AISystem, DeclarationSystem, CountdownSystem, CombatSystem, AnimationSystem, ResultSystem — 由 PhaseSystem 在特定时机显式调用

---

## 3. 核心层

### World（`src/ecs/World.ts`，102 行）

实体管理器 + 组件存储 + 系统运行器。

```typescript
class World {
  spawn(): number                              // 分配新实体 ID
  despawn(entity: number): void                // 删除实体及所有组件
  add<T>(entity, component, data): void        // 添加组件
  remove(entity, component): void              // 移除组件
  get<T>(entity, component): T | undefined     // 读取组件
  has(entity, ...components): boolean          // 检查组件存在性
  query(...components): number[]               // 查找拥有全部指定组件的实体
  addSystem(system): void                      // 注册系统
  update(delta): void                          // 运行所有系统
}
```

组件存储结构：`Map<C, Map<number, unknown>>` —— 按组件类型分桶，桶内按实体 ID 索引。查询时取第一个组件类型的候选集，然后交集过滤。

### Component（`src/ecs/Components.ts`，111 行）

16 个组件类型，由 `const enum C` 定义（编译后内联为数字，零运行时开销）。每个组件有对应的数据接口。

### System（`src/ecs/System.ts`，9 行）

```typescript
interface System {
  readonly requiredComponents: readonly C[]
  update(world: World, entities: number[], delta: number): void
}
```

`requiredComponents` 声明该系统需要哪些组件。World.update 自动将匹配的实体列表传入 `entities` 参数。

---

## 4. 组件清单

| # | 组件 | 字段 | 携带者 |
|---|------|------|--------|
| 0 | `Position` | `x, y` | daodun, bibilabu |
| 1 | `Sprite` | `texture, scale, flipX, depth, visible` | daodun, bibilabu |
| 2 | `Phase` | `current: Phase, transitioning: boolean` | gameState |
| 3 | `Round` | `number` | gameState |
| 4 | `Score` | `player, ai` | gameState |
| 5 | `Health` | `current, max` | daodun, bibilabu |
| 6 | `BluffIntent` | `declare: RPS\|null, actual: RPS\|null` | daodun, bibilabu |
| 7 | `VisualState` | `state: 'idle'\|'attack'\|'hit'\|'victory'\|'defeated'` | daodun, bibilabu |
| 8 | `PlayerTag` | `{}`（标记组件） | daodun |
| 9 | `AITag` | `bluffChance` | bibilabu |
| 10 | `IdleBobbing` | `baseY, amplitude, halfDuration` | daodun, bibilabu |
| 11 | `TextRef` | `obj: Phaser.GameObjects.Text` | 未使用 |
| 12 | `GraphicsRef` | `obj: Phaser.GameObjects.Graphics` | daodun, bibilabu |
| 13 | `ContainerRef` | `obj: Phaser.GameObjects.Container` | 未使用 |
| 14 | `CombatEvent` | `outcome: Outcome, isCrit: boolean` | gameState（每回合覆盖） |
| 15 | `ImageRef` | `obj: Phaser.GameObjects.Image` | 未使用 |

### 游戏类型别名

```typescript
type RPS = 'rock' | 'scissors' | 'paper'
type Phase = 'declare' | 'reveal' | 'countdown' | 'attack' | 'result' | 'game_over'
type PetState = 'idle' | 'attack' | 'hit' | 'victory' | 'defeated'
type Outcome = 'player_win' | 'player_lose' | 'draw'
```

---

## 5. 实体清单

游戏共 3 个 ECS 实体：

### gameState（游戏状态）

```
Phase, Round, Score, CombatEvent
```

不参与渲染，承载回合流程所需的所有状态数据。

### daodun（刀盾，玩家宠物）

```
Position   { x: 300, y: 930 }
Sprite     { texture: 'daodun_idle', scale: 0.9, flipX: true, depth: 10, visible: true }
Health     { current: 5, max: 5 }
BluffIntent{ declare: null, actual: null }
VisualState{ state: 'idle' }
PlayerTag  {}
IdleBobbing{ baseY: 930, amplitude: 9, halfDuration: 800 }
GraphicsRef{ obj: <health bar graphics> }
```

### bibilabu（比比拉布，AI 宠物）

```
Position   { x: 870, y: 930 }
Sprite     { texture: 'bibilabu_idle', scale: 0.9, flipX: false, depth: 10, visible: true }
Health     { current: 5, max: 5 }
BluffIntent{ declare: null, actual: null }
VisualState{ state: 'idle' }
AITag      { bluffChance: 0.4 }
IdleBobbing{ baseY: 930, amplitude: 9, halfDuration: 900 }
GraphicsRef{ obj: <health bar graphics> }
```

> **注**：按钮、气泡、文字等 Phaser UI 对象不作为 ECS 实体，而是由各系统直接持有引用。这些对象的生命周期管理（创建/销毁/显示/隐藏）属于 Phaser 的职责，用 ECS 间接访问反而增加复杂度。

---

## 6. 系统详解

### 6.1 PhaseSystem（指挥者，288 行）

```
requiredComponents: [Phase]
更新模式: 回调驱动
```

整个游戏的状态机。拥有全部 `delayedCall` 定时链，在合适的时机调用其他系统的方法。

**状态流转**：

```
declare → reveal → countdown → attack → result → declare (循环)
                                                    → game_over (结束)
```

**关键方法**：

| 方法 | 触发时机 | 行为 |
|------|----------|------|
| `startDeclarePhase()` | 回合开始 / 上层延迟调用 | 重置 BluffIntent，round++，显示宣称按钮 |
| `onPlayerDeclare(move)` | 玩家点击宣称按钮 | 显示气泡，600ms 后 AI 选择，再 1s 后进入揭示阶段 |
| `onPlayerReveal(move)` | 玩家点击出招按钮 | 记录实际招式，400ms 后进入倒计时 |
| `startCountdown()` | 揭示完成 | 3-2-1-开始！，揭示双方表情符号，600ms 后进入战斗 |
| `executeAttack()` | 倒计时结束 | 调用 CombatSystem.resolve()，播放攻击/受击动画 |
| `showResult()` | 动画完成 | 更新分数，显示结果文字，判定游戏结束 |
| `endGame()` | 有宠物 HP ≤ 0 | 淡出，切换到 VictoryScene 或 DefeatScene |

### 6.2 InputSystem（输入桥接，167 行）

```
requiredComponents: [BluffIntent, PlayerTag]
更新模式: 回调驱动
```

将 Phaser 按钮点击事件转化为 ECS 组件写入。

- `createButtons()` — 创建 3 个宣称按钮 + 3 个出招按钮（复用同一组样式）
- `showDeclareButtons()` / `showRevealButtons()` — 切换按钮可见性
- 点击时写 `BluffIntent.declare` 或 `BluffIntent.actual`，通过 `onDeclare`/`onReveal` 回调通知 PhaseSystem

### 6.3 AISystem（AI 决策，52 行）

```
requiredComponents: [BluffIntent, AITag]
更新模式: 回调驱动
```

纯逻辑，零 Phaser 依赖。

- 从 RPS 中随机选择 `actual` 招式
- 根据 `bluffChance`（0.4 = 40% 诚实概率）决定 `declare` 是诚实还是虚张声势
- 直接写入 bibilabu 的 `BluffIntent` 组件

### 6.4 DeclarationSystem（对话气泡，91 行）

```
requiredComponents: []
更新模式: 回调驱动
```

管理宠物头顶的对话气泡。

- `createBubbles()` — 创建 daodun 和 bibilabu 的气泡容器（圆角矩形 + 三角尾巴 + 文字）
- `showDaodunBubble(move)` / `showBibilabuBubble(move)` — 显示「我要出✊石头！」并播放弹入动画
- `hideBubbles()` — 隐藏双方气泡

### 6.5 CountdownSystem（倒计时，92 行）

```
requiredComponents: []
更新模式: 回调驱动
```

3-2-1-开始！倒计时 + 招式表情符号揭示。

- `runCountdown(onComplete)` — 依次显示 3/2/1/开始！，每步 500ms，带缩放弹跳
- `revealMoveEmojis(daodunMove, bibilabuMove)` — 在宠物上方显示 ✊/✌️/✋
- `hideMoveEmojis()` — 隐藏

### 6.6 CombatSystem（战斗结算，60 行）

```
requiredComponents: [BluffIntent, Health]
更新模式: 回调驱动
```

纯逻辑，零 Phaser 依赖，可独立单元测试。

1. 读取双方 `BluffIntent.actual`
2. 通过 `RPS_WINS_AGAINST` 查表判定胜负
3. 暴击判定：玩家宣称诚实（`declare === actual`）且获胜 → 2 点伤害
4. 写入 `Health.current`（直接修改引用）
5. 将 `CombatEvent { outcome, isCrit }` 写入 gameState 实体

### 6.7 AnimationSystem（动画，148 行）

```
requiredComponents: [Position]
更新模式: 回调驱动
```

所有战斗动画的 Phaser Tween 包装。

| 方法 | 动画 | 视觉状态 |
|------|------|----------|
| `playAttack(entity, pet)` | 向对手方向冲刺 150px，yoyo 弹回 | attack → idle |
| `playHit(entity, pet, isCrit)` | 反向震屏 3-5 次，着染红色 | hit → idle |
| `playVictory(entity, pet)` | 向上弹跳 60px | victory → idle |
| `playDefeated(entity, pet)` | 下沉 30px | defeated → idle |
| `showCritText(entity)` | 暴击文字上浮渐隐 | — |

每个方法会设置 `VisualState.state`，动画结束时重置为 `idle`。BobSystem 和 RenderSystem 依赖此状态来暂停/恢复各自的行为。

### 6.8 HealthBarSystem（血条，57 行）

```
requiredComponents: [Health, GraphicsRef]
更新模式: 逐帧
```

每帧读取 Health 组件并重绘血条。

- 240×30 圆角矩形
- 颜色阈值：绿色（>50%）、黄色（25-50%）、红色（<25%）
- 比比拉布的血条从右侧填充（`flipped`），通过检查 `PlayerTag` 是否存在来判断
- 血条绘制在宠物实体自带的 `GraphicsRef` 上

### 6.9 ResultSystem（结果显示，177 行）

```
requiredComponents: []
更新模式: 回调驱动
```

管理所有文字标签的状态。

- **比分**：顶部的「刀盾 X - X 比比拉布」
- **阶段标签**：宣称/出招/结果等阶段提示
- **回合标签**：当前回合数
- **结果文字**：胜利/失败/平局，暴击有特殊颜色
- **详情文字**：双方宣称/实际的完整对比
- **欺骗文字**：12 种情况的欺骗/诚实评价

暴击/欺骗/输赢的文字描述覆盖全部排列组合（赢/输/平 × 玩家诚实/骗人 × AI 诚实/骗人），逻辑互不矛盾。

### 6.10 BobSystem（空闲浮动，30 行）

```
requiredComponents: [Position, IdleBobbing]
更新模式: 逐帧
```

纯逻辑。用 `Math.sin` 在 `baseY` 上下做正弦波动。

- 仅当 `VisualState.state === 'idle'` 时执行，动画期间自动暂停
- daodun 半周期 800ms，bibilabu 900ms，振幅 9px

### 6.11 RenderSystem（渲染同步，73 行）

```
requiredComponents: [Position, Sprite]
更新模式: 逐帧（最后执行）
```

ECS → Phaser 的桥梁。

- **首帧**：根据 Sprite 组件数据创建 `Phaser.GameObjects.Image`
- **后续帧**：同步 texture、scale、flipX、visible
- **位置同步**：仅在 `VisualState.state === 'idle'` 时同步 x/y。动画期间由 AnimationSystem 的 Tween 控制位置，RenderSystem 不覆盖

`getImage(entity)` 方法暴露给 AnimationSystem，用于获取 Tween 的目标对象。

---

## 7. 游戏流程

### 7.1 完整时序

```
BattleScene.create()
  │
  ├─ World 创建，实体生成，系统注册，UI 创建
  ├─ game loop 启动 (16ms interval)
  │    ├─ BobSystem.update()    — 空闲浮动
  │    ├─ HealthBarSystem.update() — 血条绘制
  │    └─ RenderSystem.update() — ECS → Phaser 同步
  │
  └─ 500ms 后 → PhaseSystem.startDeclarePhase()
       │
       ├─ [declare]  显示宣称按钮，等待玩家点击
       │    └─ 点击 → 写 BluffIntent.declare → 600ms → AI 选择 → 1s → reveal
       │
       ├─ [reveal]   显示出招按钮，等待玩家点击
       │    └─ 点击 → 写 BluffIntent.actual → 400ms → countdown
       │
       ├─ [countdown] 3→2→1→开始！→ 揭示双方表情 → 600ms → attack
       │
       ├─ [attack]   CombatSystem.resolve() → 伤害 → 动画
       │    ├─ 平局：双方攻击 + 受击
       │    ├─ 玩家赢：daodun 攻击 → bibilabu 受击（暴击则显示暴击文字）
       │    └─ 玩家输：bibilabu 攻击 → daodun 受击
       │    └─ 1.2s → result
       │
       ├─ [result]   比分、结果文字、欺骗描述
       │    ├─ 有人 HP ≤ 0 → 2s → endGame
       │    └─ 否则 → 2.5s → 回到 declare（下一回合）
       │
       └─ [game_over] 淡出 → VictoryScene / DefeatScene
```

### 7.2 系统间数据流

```
InputSystem         ──写──→ BluffIntent.declare (daodun)
AISystem            ──写──→ BluffIntent.declare / actual (bibilabu)
InputSystem         ──写──→ BluffIntent.actual (daodun)
                        │
CombatSystem.resolve()  ├──读── BluffIntent (双方)
                        ├──读── Health (双方)
                        ├──写── Health.current (败方)
                        └──写── CombatEvent (gameState)
                              │
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
        AnimationSystem  HealthBarSystem  ResultSystem
        (读 CombatEvent,  (读 Health)     (读 CombatEvent,
         VisualState)                     BluffIntent, Score)
```

---

## 8. 场景结构

游戏共 4 个场景：

| 场景 | 文件 | 行数 | 职责 |
|------|------|------|------|
| TitleScene | `src/scenes/TitleScene.ts` | 142 | 标题画面、开始按钮、预加载 PNG 资源 |
| BattleScene | `src/scenes/BattleScene.ts` | 226 | ECS 引导：创建 World、生成实体、注册系统、启动游戏循环 |
| VictoryScene | `src/scenes/VictoryScene.ts` | ~65 | 胜利画面、再来一局 |
| DefeatScene | `src/scenes/DefeatScene.ts` | ~65 | 失败画面、再来一局 |

### BattleScene 职责边界

BattleScene 的 `create()` 方法（约 120 行引导逻辑）：

1. 绘制背景
2. 创建 World
3. 生成 gameState / daodun / bibilabu 实体
4. 创建 HP 文字和爱心图标（直接 Phaser 对象）
5. 实例化所有 11 个系统
6. 通过 `phaseSystem.wire()` 连接指挥者与其他系统
7. 注册 3 个逐帧系统到 World
8. 调用各系统的 `createXXX()` 初始化 UI
9. 启动 game loop（16ms 间隔）
10. 500ms 后触发第一个阶段

> BattleScene 不包含任何游戏逻辑。所有逻辑在 System 中。

---

## 9. 扩展指南

### 9.1 新增角色

1. 在 `public/assets/pets/` 放入 5 帧 PNG（idle/attack/hit/victory/defeated）
2. 在 BattleScene 中 spawn 新实体，添加对应的组件
3. 新增角色的 AI 逻辑：在 AISystem 中添加对应的处理方法
4. 多角色对战需要调整 CombatSystem 的伤害分配逻辑

### 9.2 新增招式

1. 扩展 `RPS` 类型（如添加 `lizard`、`spock`）
2. 更新 `RPS_WINS_AGAINST` 映射表
3. 在 InputSystem 的 `createButtons` 中添加新按钮
4. 更新 RPS_EMOJI / RPS_NAME 映射

### 9.3 新增机制

1. 定义新的组件数据接口 → 添加到 `Components.ts`
2. 实现新的 System → 放在 `systems/` 中
3. 如果影响回合流程 → 在 PhaseSystem 中插入新的阶段
4. 如果只是数据展示 → 添加新的桥接系统读取组件、驱动 Phaser 对象

### 9.4 系统间通信规范

- **逐帧系统**之间不直接调用，通过组件数据通信
- **回调驱动系统**由 PhaseSystem 显式调用，不互相依赖
- 临时事件（如 CombatEvent）写在 gameState 实体上，后续系统读取
- 持久状态（如 Health、Score）保留在对应实体上，跨回合保持

---

## 10. 目录结构

```
src/
├── main.ts                        # Phaser 游戏入口，Scale 配置
├── gameConfig.json                # 游戏参数（血量、伤害、欺骗率）
│
├── ecs/                           # ECS 核心
│   ├── Components.ts              # 16 个组件枚举 + 数据接口
│   ├── World.ts                   # 实体管理、组件存储、系统调度
│   ├── System.ts                  # System 接口
│   └── systems/                   # 11 个系统
│       ├── PhaseSystem.ts         # 指挥者：状态机 + 定时链
│       ├── InputSystem.ts         # 按钮 → BluffIntent 桥接
│       ├── AISystem.ts            # AI 招式选择
│       ├── DeclarationSystem.ts   # 对话气泡
│       ├── CountdownSystem.ts     # 3-2-1 倒计时
│       ├── CombatSystem.ts        # RPS 结算、伤害、暴击
│       ├── AnimationSystem.ts     # Tween 动画、纹理切换
│       ├── HealthBarSystem.ts     # 血条绘制
│       ├── ResultSystem.ts        # 结果文字、比分标签
│       ├── BobSystem.ts           # 空闲浮动
│       └── RenderSystem.ts        # ECS → Phaser 渲染同步
│
├── scenes/                        # Phaser 场景
│   ├── TitleScene.ts              # 标题画面
│   ├── BattleScene.ts             # ECS 引导（~120 行引导 + 背景绘制）
│   ├── VictoryScene.ts            # 胜利画面
│   └── DefeatScene.ts             # 失败画面
│
└── docs/
    └── architecture.md            # 本文档

public/assets/pets/                # 宠物帧 PNG（运行时加载）
├── daodun_idle.png
├── daodun_attack.png
├── daodun_hit.png
├── daodun_victory.png
├── daodun_defeated.png
├── bibilabu_idle.png
├── bibilabu_attack.png
├── bibilabu_hit.png
├── bibilabu_victory.png
└── bibilabu_defeated.png

tests/
└── e2e.mjs                        # Playwright 端到端测试
```
