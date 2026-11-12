# 清台

> 把情绪打进袋里的竖屏台球解压游戏。
> 仓库名 `soul-billiards` 是初始代号，产品名以本文与 `docs/` 设计文档为准。

| 项 | 内容 |
|----|------|
| 赛道 | Qoder 高校创造力大赛 · LifeHack 生活娱乐 |
| 形态 | 纯前端 Web App——无后端、无登录、运行期零第三方请求 |
| 部署 | Qoder Sites，**public** 访问模式，静态产物 · <https://soul-billiards-436212hxx0z.qoder.zone> |
| 规格来源 | [`docs/设计摘要.md`](docs/设计摘要.md)（公开摘要）。完整规格文档 v1.0 暂不入库，正式发布后公开 |
| 当前阶段 | **仓库骨架**。`src/game/**` 的核心实现属于 M0 及之后，尚未开始 |

---

## 1. 里程碑状态

| ID | 内容 | DoD 摘要 | 状态 |
|----|------|----------|------|
| — | 仓库骨架 + 构建链路 + 站点部署 | `npm run build` 通过、`dist` 纯静态、站点 public 可访问 | 本提交 |
| M0 | 手感验证（唯一硬卡点） | 真机微信内连续 20 杆：瞄得准、撞库不诡异、进袋判定不吞早/漏吞、力度有层次 | 未开始 |
| M1 | 反馈层 | 吞袋/爆碎/飘字/音效同帧（< 50 ms），`?debug=perf` 掉帧 < 3 帧/关 | 未开始 |
| M2 | 内容与流程 | 九关 + 状态机 + 六种特化球，全程无卡死无状态泄漏 | 未开始 |
| M3 | 表达层 | `RunStats` + 14 条规则各有单测，三张疏导页 | 未开始 |
| M4 | 结算卡与传播 | iOS 微信 / Android 微信 / Safari 三环境真机验证保存图片 | 未开始 |
| M5 | 视觉与文案精修 | 对比度 ≥ 4.5:1，§15 红线全绿，320px 不破版 | 未开始 |
| M6 | 发布与验证 | 手机微信打开 → 3 秒可玩 → 完整通关 → `dist` gzip < 250 KB → 无 console 报错 | 未开始 |

**M0 不通，不写 M1 的代码。** 手感是这类作品的生死线。

---

## 2. 技术栈（§12.1）

| 层 | 选择 | 理由 |
|----|------|------|
| 构建 | Vite 5 | 秒级冷启动，静态产物 |
| 语言 | TypeScript 5 strict | 物理参数与状态机需要类型约束 |
| UI | React 18 | 只管外壳，不参与游戏画面 |
| 样式 | 原生 CSS + CSS 变量 | 色板单一来源，不引 Tailwind |
| 游戏核心 | 纯 TS 类，不依赖 React | `src/game/**` 可独立单测、可被任意宿主复用 |
| 物理 / 音频 / 特效 | 全部自研 | 运行期第三方依赖：0 |

---

## 3. 目录结构

```
.
├── index.html                 # meta 完整：description / theme-color / apple-mobile-web-app-*
├── vite.config.ts             # target es2018（微信 Android XWeb 内核版本不可控）
├── tsconfig.json              # strict + noUncheckedIndexedAccess
├── docs/设计摘要.md            # 公开设计说明（完整规格暂不入库）
├── public/                    # 不放任何位图
└── src/
    ├── main.tsx
    ├── App.tsx                # 屏幕路由（M2 接入 Machine.ts 后接管）
    ├── screens/
    │   └── TitleScreen.tsx
    ├── styles/global.css      # §8.3 色板 → CSS 变量
    └── game/
        └── config/copy.ts     # 面向用户中文文案的唯一出口
```

`src/game/core` `behaviors` `input` `render` `state` `stats` `feedback` `audio` `storage` 按 §12.2 建立，随 M0 逐个落地，骨架阶段不预建空文件。

**约定**

- `game/**` 内不允许 `import React`。
- `config/copy.ts` 是唯一的用户可见文案出口，组件里禁止硬编码中文文案。
- 所有可调数值集中在 `config/tuning.ts`（M0 创建），禁止散落在逻辑里。

---

## 4. 命令

```bash
npm install
npm run dev        # 本地开发，--host 已开启，手机同网段可直接预览
npm run build      # tsc --noEmit + vite build，产出 dist/
npm run preview    # 预览构建产物
npm run test       # vitest（rules.ts / Physics.ts 纯函数单测，M3 起有实际用例）
```

---

## 5. 硬约束

| 约束 | 值 | 违反后果 |
|------|-----|----------|
| 包体 | `dist` gzip < 250 KB | 顶掉首屏 < 3 秒的目标 |
| Webfont | 禁止加载任何 webfont | 一个中文字体子集 300 KB，直接爆预算 |
| 外部请求 | 0（无 API、无 CDN、无统计） | Sites 网关介入 + 微信内白屏风险 |
| 平台后端 | 不建 Function、不开数据库、不加认证端点 | §16 列出的全部平台风险由此清零 |
| 方向 | 竖屏锁定 | — |
| 最小宽度 | 320 px | — |
| 失败状态 | 不存在（G3） | 与设计主张冲突 |

---

## 6. 本地真机预览

`npm run dev` 启动后终端会打印 Network 地址，手机连同一 Wi-Fi 直接访问，在微信内浏览器打开即可验证手感。这是 M0 验收的唯一途径——手感无法在桌面 Chrome 上判定。
