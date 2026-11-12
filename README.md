# 末班回廊 / The Last Passage

一个运行在浏览器中的第一人称异常观察游戏。末班车已经离开，你需要辨认地下通道里的异常，找到 **08 号出口**。

**[在线试玩](https://corridor.linsama.com/)** · [Linsama 个站](https://linsama.com/) · [实现说明](docs/ARCHITECTURE.md) · [MIT 许可证](LICENSE)

A browser-based observation game inspired by the anomaly-and-return genre. Built with Three.js, with procedural textures, geometry and audio. No backend, downloaded game assets, or runtime AI service.

Available in 简体中文, English and 日本語. Choose your language on the title screen or in Settings; changing it during play preserves your progress.

タイトル画面または設定から日本語を選べます。プレイ中に言語を変更しても進捗は保たれます。

## 怎么玩

- 先记住 00 号通道的正常样子。
- 发现异常就原路返回；没有异常就继续前进。
- 判断正确，出口编号前进一位；判断错误，回到 00。
- 连续判断正确八次后，走上楼梯离开。

普通模式只通过场景里的编号显示进度；简单模式在判断失败后解释上一段的异常。连接回廊内允许折返继续观察，在到达另一端平台前不会提交判断。

## 特点

- **20 种异常**，覆盖灯光、海报、标识、设施和地面细节。
- **中英日三语**：菜单、提示、字幕、场景标牌与海报同步切换；默认跟随浏览器，也可手动选择并保存。
- **连续回廊**：通过拐角遮挡复用场景，不用黑屏连接关卡。
- **手机操作**：虚拟摇杆或 WASD 按键，可调大小、灵敏度与转身动画。
- **三档画质**：流畅、均衡（默认）、高画质；以 60 FPS 为目标自动调整渲染分辨率，实际帧率取决于设备。
- **程序化声音**：Web Audio 合成配乐、环境声和脚步声；广播匹配当前语言的设备语音，并提供字幕。
- **轻量静态部署**：没有后端、账号系统或运行时 AI 调用。几何、纹理和声音在本地生成。

## 本地运行

需要 Node.js 22 或以上版本，建议使用 Node.js 24；浏览器需要支持 WebGL 2。

```sh
git clone https://github.com/LoveOrange/last-train-corridor.git
cd last-train-corridor
npm ci
npm test
npm run build
npm run dev
```

打开 [http://127.0.0.1:4178](http://127.0.0.1:4178)。开发服务器提供 `dist/` 中的文件；修改源码后需要重新执行 `npm run build`。

| 操作 | 电脑 | 手机 |
| --- | --- | --- |
| 移动 | WASD / 上下方向键 | 左侧摇杆或虚拟按键 |
| 观察 | 鼠标；按住画面拖动；左右方向键 | 在画面空白处滑动 |
| 快走 | 按住 Shift | 按住快走键 |
| 转身 | Q | 转身键 |
| 暂停 | Esc / P | 暂停按钮 |

设置保存在当前浏览器中；刷新页面会重新开始本次探索。语言切换即时生效，不会重置当前进度或异常。首次开启声音需要点击进入游戏。设备未提供所选语言的语音时，广播会保留对应字幕。

## 构建与部署

```sh
npm ci
npm run build
```

构建产物位于 `dist/`，可以由任意支持静态文件的 HTTP 服务托管。使用 `npm run dev` 在本地预览，不要直接用 `file://` 打开页面。

### Cloudflare Workers Static Assets

仓库提供通用示例配置，不包含作者的账户或域名绑定。

```sh
cp wrangler.example.jsonc wrangler.jsonc
# 将配置中的 name 改为你自己的 Worker 名称
npx wrangler@4 login
npx wrangler@4 deploy --dry-run
npx wrangler@4 deploy
```

部署后可使用返回的 `workers.dev` 地址，也可在自己的 Cloudflare 账户中绑定自定义域名。详见 [Cloudflare 静态资源部署文档](https://developers.cloudflare.com/workers/static-assets/get-started/)。仓库的 CI 只运行测试和构建，不会自动更新在线试玩。

## 源码结构

| 文件 | 职责 |
| --- | --- |
| `src/main.js` | 游戏循环、输入、界面和渲染调度 |
| `src/rules.js` | 异常列表、判断规则和通关状态 |
| `src/layout.js` | 回廊布局、碰撞、连接区预览和提交边界 |
| `src/scene.js` / `src/textures.js` | 三维场景、程序化材质和光影 |
| `src/quality.js` | 画质预设和自适应渲染分辨率 |
| `src/stairs.js` | 楼梯、行走坡面与扶手的共同尺寸 |
| `src/audio.js` | 合成配乐、环境音、脚步和广播 |
| `src/settings.js` | 设置校验与持久化 |
| `src/i18n.js` | 三语文案、语言匹配、设备语音选择与界面翻译 |

`npm test` 使用 Node.js 内置测试工具，覆盖解谜规则、连接区折返、场景朝向、碰撞、画质调节、扶手接合、翻译完整性、语言保存和语音回退。光影和帧率还需要浏览器验证。

在 `127.0.0.1` 上添加 `?qa=1` 可开启本地调试接口，例如 `window.__corridorQA.snapshot()`；`?qa=1&preview=eyes` 可在进入游戏后检查指定异常。线上域名不会开放这些接口。

## 贡献

欢迎通过 Issue 报告问题，或提交 Pull Request。报告画面与性能问题时，请注明浏览器、设备、画质档位，以及复现步骤。修改后运行 `npm test` 和 `npm run build`；涉及场景、输入或声音时，也请在浏览器中验证相应行为。

## 许可证与致谢

项目代码和原创程序化内容使用 [MIT License](LICENSE)，作者为 [Linsama](https://github.com/LoveOrange)。

- [Three.js](https://threejs.org/) 使用 MIT 许可证，副本见 [third_party/THREE-LICENSE.txt](third_party/THREE-LICENSE.txt)，构建时也会复制到 `dist/`。
- [esbuild](https://esbuild.github.io/) 是构建工具，使用 MIT 许可证。
- 游戏受到《8 号出口》所代表的异常观察玩法启发，未使用原作的模型、图片或音频素材，与原作开发者无关联。

## 异常画廊

结算页和暂停页支持回到首页，首页可打开 20 项异常画廊。正确通过异常并完成判定后立即收录；仅看见异常、在连接通道中途折返、判断失败、通过正常通道，都不会解锁。后续失误和重新挑战不会清空已收录内容。

未解锁项隐藏异常说明，已解锁项可进入原三维场景自由观察，浏览不会触发挑战计分。收录记录使用浏览器本地存储，刷新后保留；存储不可用时只在本次打开期间保留，并在画廊内提示。旧版本没有保存挑战历史，无法追溯解锁。
