# 心口不一 (Bluffing RPS Game)

## Testing
- 修改代码后必须验证游戏能正常运行：先跑 `npx tsc --noEmit` 类型检查，然后启动 dev server (`npx vite`) 用 Playwright 或浏览器验证完整流程（标题→宣称→出招→倒计时→攻击→结果循环）。
