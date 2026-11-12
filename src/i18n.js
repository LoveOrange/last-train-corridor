export const LANGUAGES = ['zh-CN', 'en', 'ja'];

// Keep each message together so changes cannot silently omit a supported language.
// The column order is Chinese, English, Japanese. No remote translation requests.
const copy = {
  title: ['末班回廊', 'The Last Passage', '終電回廊'],
  titleFirst: ['末班', 'The Last', '終電'],
  titleLast: ['回廊', 'Passage', '回廊'],
  description: ['末班车已经离开。观察地下通道的异常，找到出口。一个可探索的第一人称回廊游戏。', 'The last train has gone. Watch for anomalies in an underground passage and find your way out. A first-person exploration game.', '終電はもう出た。地下通路の異変を見つけ、出口を目指す一人称探索ゲーム。'],
  world: ['可探索的三维地铁回廊', 'Explore the 3D underground passage', '探索できる3D地下通路'],
  passage: ['地下联络通道', 'Underground passage', '地下連絡通路'],
  stationLine: ['北川地下铁 / 南口联络通道', 'KITAGAWA METRO / SOUTH PASSAGE', '北川地下鉄 / 南口連絡通路'],
  time: ['末班车后 · 00:08', 'AFTER THE LAST TRAIN · 00:08', '終電のあと · 00:08'],
  eyebrow: ['城市之下，某处', 'SOMEWHERE BELOW THE CITY', '街の下、どこかで'],
  introCopy: ['你记得，这条通道没有这么长。', 'You remember this passage being shorter.', 'この通路、こんなに長かっただろうか。'],
  loading: ['正在亮灯', 'Turning on the lights', '照明を点灯中'],
  start: ['进入回廊', 'Enter the passage', '回廊に入る'],
  introMeta: ['20 种异常 / 约 5–10 分钟', '20 anomalies / about 5–10 minutes', '20種類の異変 / 約5〜10分'],
  settingsLink: ['画面、操作与声音设置', 'Display, controls & sound', '画面・操作・音声設定'],
  mobileRule: ['发现异常就折返，无异常就前进。', 'Turn back if anything is wrong. Otherwise, go on.', '異変があれば引き返す。なければ進む。'],
  goal: ['留意出口编号，抵达 08 号出口。', 'Follow the numbers. Reach Exit 08.', '出口番号を確かめ、08番出口を目指す。'],
  notice: ['通行须知 / NOTICE', 'PASSAGE RULES', '通行の心得 / NOTICE'],
  rule1: ['记住这条通道的样子。', 'Remember how this passage looks.', '通路の様子をよく覚える。'],
  rule2: ['发现异常，立即折返。', 'If anything is wrong, turn back.', '異変を見つけたら、引き返す。'],
  rule3: ['没有异常，继续前进。', 'If all is normal, keep going.', '異変がなければ、そのまま進む。'],
  desktopControls: ['WASD 移动 · 鼠标观察 · Q 转身', 'WASD move · Mouse look · Q turn around', 'WASD 移動 · マウスで視点操作 · Q 振り向く'],
  mobileControls: ['左手移动 · 右侧滑动观察 · 点按转身', 'Move on the left · Look on the right · Tap to turn', '左手で移動 · 右側をスワイプして見回す · タップで振り向く'],
  personalLink: ['Linsama 个站 ↗', 'Linsama’s website ↗', 'Linsama のサイト ↗'],
  githubLink: ['GitHub 源码 ↗', 'Source on GitHub ↗', 'GitHub ソースコード ↗'],
  linksLabel: ['项目链接', 'Project links', '関連リンク'],
  language: ['语言', 'Language', '言語'],
  languageAuto: ['跟随浏览器', 'Browser language', 'ブラウザーに合わせる'],
  settings: ['设置 ⚙', 'Settings ⚙', '設定 ⚙'],
  openSettings: ['打开设置', 'Open settings', '設定を開く'],
  pause: ['暂停 Ⅱ', 'Pause Ⅱ', '一時停止 Ⅱ'],
  pauseTitle: ['暂停 (Esc)', 'Pause (Esc)', '一時停止 (Esc)'],
  soundOn: ['声音 开', 'Sound on', '音声 オン'],
  soundOff: ['声音 关', 'Sound off', '音声 オフ'],
  mute: ['关闭声音', 'Mute sound', '音声をオフにする'],
  unmute: ['开启声音', 'Unmute sound', '音声をオンにする'],
  soundTitle: ['配乐、环境音与广播', 'Music, ambience and announcements', '音楽・環境音・構内放送'],
  pausedEyebrow: ['暂时停留', 'A MOMENT OF STILLNESS', 'ひと休み'],
  pausedTitle: ['通道还在那里。', 'The passage is still there.', '通路は、まだそこにある。'],
  pausedCopy: ['发现异常就原路返回，正常就走向尽头。\n出口标号记录你的进度。判断失误会回到 00。', 'Turn back if you find an anomaly. Otherwise, walk to the end.\nExit numbers mark your progress. A mistake sends you back to 00.', '異変があれば来た道を戻り、なければ奥へ進む。\n出口番号が進捗を示す。判断を誤ると00に戻る。'],
  resume: ['继续探索', 'Keep exploring', '探索を続ける'],
  restart: ['重新开始', 'Start over', '最初からやり直す'],
  controlDetails: ['WASD 移动 · Shift 快走 · Q 转身\n鼠标观察，或按住画面拖动 · 方向键转向', 'WASD move · Shift walk faster · Q turn around\nMouse or drag to look · Arrow keys to steer', 'WASD 移動 · Shift 早歩き · Q 振り向く\nマウスかドラッグで視点操作 · 矢印キーで向きを変える'],
  endingEyebrow: ['08 / 找到出口', '08 / EXIT FOUND', '08 / 出口に到着'],
  endingTitle: ['你终于走了出来。', 'You made it outside.', 'ようやく、外に出られた。'],
  endingCopy: ['地面上的城市，已经醒了。\n下次，还是赶上末班车吧。', 'Above ground, the city is waking up.\nNext time, catch the last train.', '地上の街は、もう目を覚ましていた。\n次は、終電に間に合うように。'],
  replay: ['再走一次', 'Walk it again', 'もう一度歩く'],
  runStats: ['经过 {passages} 段通道 · 遇见 {anomalies} 次异常', 'Passages explored: {passages} · Anomalies encountered: {anomalies}', '通った区間：{passages} · 遭遇した異変：{anomalies}'],
  walkHint: ['WASD 移动 · Q 转身 · Esc 暂停', 'WASD move · Q turn around · Esc pause', 'WASD 移動 · Q 振り向く · Esc 一時停止'],
  broadcast: ['站内广播', 'STATION ANNOUNCEMENT', '構内放送'],
  move: ['移动', 'Move', '移動'],
  dragMove: ['拖动移动', 'Drag to move', 'ドラッグして移動'],
  virtualKeys: ['虚拟方向键', 'On-screen movement keys', '画面上の移動キー'],
  forward: ['前进', 'Forward', '前進'],
  left: ['左移', 'Left', '左へ'],
  back: ['后退', 'Back', '後退'],
  right: ['右移', 'Right', '右へ'],
  lookLeft: ['左看', 'Look left', '左を見る'],
  lookRight: ['右看', 'Look right', '右を見る'],
  fast: ['快走', 'Faster', '早歩き'],
  holdFast: ['按住快走', 'Hold to walk faster', '長押しで早歩き'],
  turn: ['转身', 'Turn', '振り向く'],
  turnAround: ['转身一百八十度', 'Turn around 180 degrees', '180度振り向く'],
  settingsEyebrow: ['调整到舒适的状态', 'MAKE YOURSELF COMFORTABLE', '心地よい設定で'],
  settingsTitle: ['画面、操作与声音', 'Display, controls & sound', '画面・操作・音声'],
  closeSettings: ['关闭设置', 'Close settings', '設定を閉じる'],
  settingsNote: ['设置自动保存。探索中打开设置会暂停游戏。', 'Settings save automatically. Opening this menu pauses exploration.', '設定は自動保存されます。探索中に開くと一時停止します。'],
  exploration: ['探索方式', 'Exploration', '探索'],
  difficulty: ['游戏难度', 'Difficulty', '難易度'],
  normal: ['普通 · 只看出口标号', 'Normal · Exit numbers only', '普通 · 出口番号のみ'],
  easy: ['简单 · 失败后给提示', 'Easy · Hints after mistakes', 'かんたん · 失敗後にヒント'],
  difficultyHelp: ['普通模式不提示判断结果。简单模式仅在失败归零后，解释上一段通道的异常。', 'Normal mode leaves you to read the exit numbers. Easy mode explains the previous passage only after a mistake resets your progress.', '普通モードでは判断結果を表示しません。かんたんモードでは、失敗して00に戻ったときだけ直前の通路について説明します。'],
  display: ['画面与性能', 'Display & performance', '画面とパフォーマンス'],
  quality: ['画质', 'Quality', '画質'],
  smooth: ['流畅', 'Smooth', '軽量'],
  balanced: ['均衡 · 推荐', 'Balanced · Recommended', 'バランス · おすすめ'],
  high: ['高画质', 'High', '高画質'],
  'quality.smooth': ['优先流畅与续航，保留基础光照和阴影，关闭地面实时反射与泛光。', 'Prioritizes smooth play and battery life. Keeps lighting and shadows; disables live floor reflections and bloom.', '動作の軽さと省電力を優先。照明と影を保ち、床のリアルタイム反射とブルームを無効にします。'],
  'quality.balanced': ['推荐：保留柔和泛光与地面实时反射，兼顾画面和流畅度。', 'Recommended. Soft bloom and live floor reflections, balanced with smooth play.', 'おすすめ。柔らかな光のにじみと床のリアルタイム反射を保ち、画質と軽さを両立します。'],
  'quality.high': ['更清晰的画面、阴影与地面反射，适合性能充足的设备。', 'Sharper detail, shadows and floor reflections for more powerful devices.', '映像・影・床の反射をより鮮明に。高性能な端末向けです。'],
  qualityTarget: ['以 60 帧为目标，性能不足时自动降低渲染分辨率，稳定后逐步恢复。暂停或切到后台时停止绘制。', 'Targets 60 fps. Resolution adapts to performance and recovers when stable. Rendering stops while paused or in the background.', '60fpsを目標に、負荷に応じて解像度を自動調整します。一時停止中やバックグラウンドでは描画を停止します。'],
  controls: ['移动与观察', 'Movement & view', '移動と視点'],
  screenControls: ['屏幕控制', 'On-screen controls', '画面上の操作'],
  controlsAuto: ['自动 · 手机显示摇杆', 'Auto · Joystick on mobile', '自動 · スマホはスティック'],
  controlsStick: ['虚拟摇杆', 'Virtual joystick', '仮想スティック'],
  controlsKeys: ['虚拟键盘 · WASD', 'Virtual keyboard · WASD', '仮想キーボード · WASD'],
  controlsOff: ['隐藏屏幕按键', 'Hide on-screen controls', '画面上のボタンを非表示'],
  controlsHelp: ['左手移动，右侧空白处滑动观察。按住快走，点按转身。电脑也可以开启屏幕按键。', 'Move on the left; drag empty space on the right to look. Hold Faster or tap Turn. Desktop players can enable these controls too.', '左手で移動し、右側の何もない場所をスワイプして見回します。長押しで早歩き、タップで振り向きます。PCでも有効にできます。'],
  controlSize: ['按键大小', 'Button size', 'ボタンの大きさ'],
  sensitivity: ['观察灵敏度', 'Look sensitivity', '視点感度'],
  reducedMotion: ['减少晃动与转身动画', 'Reduce sway and turn animation', '揺れと振り向きのアニメーションを抑える'],
  audio: ['回廊的声音', 'Sounds of the passage', '回廊の音'],
  muted: ['静音', 'Mute', 'ミュート'],
  volume: ['总音量', 'Master volume', '全体の音量'],
  music: ['氛围配乐', 'Ambient music', '環境音楽'],
  sfx: ['脚步与环境声', 'Footsteps & ambience', '足音と環境音'],
  voice: ['站内广播', 'Announcements', '構内放送'],
  testVoice: ['试听站内广播 ↗', 'Test announcement ↗', '構内放送を試聴 ↗'],
  voiceHelp: ['广播使用当前语言的设备语音；没有可用语音时显示字幕。首次播放需要点击进入回廊。配乐与环境声实时合成。', 'Announcements use a device voice in your selected language, with subtitles if none is available. Click to enter before audio can play. Music and ambience are synthesized live.', '選択した言語の端末音声を使用します。対応する音声がなければ字幕を表示します。音声の再生には最初のクリックが必要です。音楽と環境音はリアルタイムで合成されます。'],
  voiceReady: ['中文广播已就绪', 'English announcements ready', '日本語の放送音声を使用できます'],
  voiceMissing: ['未发现中文语音，将显示字幕', 'No English voice available; subtitles will be shown', '日本語の音声がないため、字幕を表示します'],
  voiceUnavailable: ['此设备仅显示广播字幕', 'This device supports subtitles only', 'この端末では放送は字幕のみです'],
  voiceError: ['广播语音暂不可用，已显示字幕', 'Voice is unavailable; subtitles are shown', '音声を再生できないため、字幕を表示しています'],
  voiceMuted: ['已静音，仅显示广播字幕', 'Muted; subtitles only', 'ミュート中のため、字幕のみ表示します'],
  done: ['完成设置', 'Done', '設定を完了'],
  error: ['此浏览器暂时无法启动三维画面。请使用支持 WebGL 2 的浏览器重新打开。', 'The 3D scene could not start. Please reopen this game in a browser that supports WebGL 2.', '3D画面を起動できません。WebGL 2に対応したブラウザーで開き直してください。'],
  audioError: ['声音暂时无法开启。', 'Audio could not be started.', '音声を再生できません。'],
  audioErrorDetail: ['字幕与画面仍然可以正常游玩。', 'You can still play with subtitles.', '字幕付きでそのままプレイできます。'],
  announceTest: ['旅客您好。末班列车已经离站，请确认通道，前往南口。', 'Attention, passengers. The last train has departed. Please check the passage and proceed to the south exit.', 'お客様にご案内いたします。終電は発車しました。通路を確認し、南口へお進みください。'],
  announceStart: ['末班列车已经离站。请记住这条通道。发现异常，请原路返回。', 'The last train has departed. Remember this passage. If you notice anything unusual, turn back.', '終電は発車しました。この通路の様子を覚えてください。異変に気づいたら、来た道をお戻りください。'],
  announceEnd: ['南口已到达。谢谢您的配合，愿您平安到家。', 'You have reached the south exit. Thank you, and have a safe journey home.', '南口に到着しました。ご協力ありがとうございました。お気をつけてお帰りください。'],
  resetTitle: ['已回到 00 号通道', 'Back at passage 00', '00番の通路に戻りました'],
  failureAnomaly: ['刚才，{anomaly}。发现异常时应原路返回。', 'In the previous passage, {anomaly}. Turn back when you notice an anomaly.', '直前の通路では、{anomaly}。異変があれば来た道を戻りましょう。'],
  failureNormal: ['刚才的通道没有异常，应继续前进。', 'The previous passage was normal. You should have continued forward.', '直前の通路に異変はありませんでした。そのまま進むのが正解です。'],
  'scene.exit': ['南口 / 出口 {number}', 'SOUTH EXIT {number}', '南口 / 出口 {number}'],
  'scene.stay': ['请勿离开', 'PLEASE STAY HERE', 'ここを離れないで'],
  'scene.moving': ['请勿停留', 'KEEP MOVING', '立ち止まらないで'],
  'scene.station': ['北川站', 'KITAGAWA STATION', '北川駅'],
  'scene.staff': ['设备室 {number}', 'STAFF ROOM {number}', '機械室 {number}'],
  'scene.fire': ['消火栓', 'FIRE HYDRANT', '消火栓'],
  'scene.closed': ['封闭 / CLOSED', 'CLOSED', '通行止め'],
  'scene.noExit': ['此处没有出口', 'NO EXIT HERE', 'ここに出口はない'],
  'scene.wall': ['你已经来过这里', 'YOU HAVE BEEN HERE BEFORE', 'あなたは前にもここに来た'],
  'scene.finalExit': ['↑ 出口 08', '↑ EXIT 08', '↑ 出口 08'],
  'poster.0.header': ['北川市立美术馆', 'KITAGAWA ART MUSEUM', '北川市立美術館'],
  'poster.0.title': ['山间来信', 'Mountain Letters', '山からの便り'],
  'poster.0.copy': ['在城市里，留一片安静。', 'A quiet place within the city.', '街の中に、静けさを。'],
  'poster.1.header': ['北川地下铁 · 文明出行', 'KITAGAWA METRO · TRAVEL WITH CARE', '北川地下鉄 · マナーを大切に'],
  'poster.1.title': ['下一站，晴天。', 'Next stop, sunshine.', '次は、晴れ。'],
  'poster.1.copy': ['准时抵达每一个平凡的日子', 'On time for the everyday.', 'いつもの毎日に、時間どおり。'],
  'poster.2.header': ['城市慢行计划', 'THE SLOW CITY PROJECT', '街をゆっくり歩く計画'],
  'poster.2.title': ['慢一点', 'Take your time', '少し、ゆっくり'],
  'poster.2.copy': ['生活，不只有下一班车。', 'Life is more than the next train.', '暮らしは、次の電車だけじゃない。'],
  'anomaly.wrong-sign': ['出口指示牌的方向反了', 'the exit arrows pointed the wrong way', '出口の矢印が逆を向いていました'],
  'anomaly.eyes': ['海报里的图案变成了一只眼睛', 'a poster showed a giant eye', 'ポスターの絵が大きな目に変わっていました'],
  'anomaly.red-water': ['地面上出现了暗红色的水迹', 'dark red water appeared on the floor', '床に暗赤色の水たまりがありました'],
  'anomaly.extra-door': ['墙上多了一扇设备门', 'an extra staff door appeared', '機械室の扉が一つ増えていました'],
  'anomaly.ceiling': ['前方的天花板异常降低', 'the ceiling ahead was unusually low', '奥の天井が異常に低くなっていました'],
  'anomaly.double-clock': ['墙上的时钟变成了两个', 'there were two wall clocks', '壁の時計が二つになっていました'],
  'anomaly.dark-end': ['通道尽头的灯全都熄灭了', 'all the lights at the far end went out', '通路の奥の照明がすべて消えていました'],
  'anomaly.watcher': ['尽头出现了一个一直站着的人影', 'a motionless figure stood at the far end', '奥に人影が立ち続けていました'],
  'anomaly.red-sign': ['出口牌变成了红色的「请勿离开」', 'the exit signs turned red and read “PLEASE STAY HERE”', '出口標識が赤い「ここを離れないで」に変わっていました'],
  'anomaly.missing-door': ['第一扇设备门消失了', 'the first staff door was missing', '最初の機械室の扉が消えていました'],
  'anomaly.inverted-poster': ['第一张海报整个倒了过来', 'the first poster was upside down', '最初のポスターが上下逆さまになっていました'],
  'anomaly.floating-cone': ['维修路锥悬浮在半空中', 'the maintenance cone floated in the air', '工事用コーンが宙に浮いていました'],
  'anomaly.giant-clock': ['墙上的时钟变得异常巨大', 'the wall clock was abnormally large', '壁の時計が異常に大きくなっていました'],
  'anomaly.missing-guide': ['贯穿地面的盲道消失了', 'the tactile paving was missing', '床の点字ブロックが消えていました'],
  'anomaly.red-lights': ['通道里的照明全都变成了红色', 'all the passage lights turned red', '通路の照明がすべて赤くなっていました'],
  'anomaly.extra-cameras': ['墙上多出了一整排监控摄像头', 'a whole row of security cameras appeared', '監視カメラが一列増えていました'],
  'anomaly.blocked-exit': ['出口前出现了一道卷帘门', 'a shutter appeared in front of the exit', '出口の手前にシャッターが現れていました'],
  'anomaly.wall-message': ['墙上出现了「你已经来过这里」', 'the wall read “YOU HAVE BEEN HERE BEFORE”', '壁に「あなたは前にもここに来た」と書かれていました'],
  'anomaly.footprints': ['地面上多出了一串深色脚印', 'a trail of dark footprints appeared', '床に黒い足跡が続いていました'],
  'anomaly.handprints': ['墙面上多出了一排手印', 'handprints appeared along the wall', '壁に手形が並んでいました'],
};

export const messages = Object.fromEntries(LANGUAGES.map((language, i) =>
  [language, Object.fromEntries(Object.entries(copy).map(([key, values]) => [key, values[i]]))]));

export function resolveLanguage(setting = 'auto', preferred = globalThis.navigator?.languages || []) {
  if (LANGUAGES.includes(setting)) return setting;
  for (const candidate of preferred) {
    const base = String(candidate).toLowerCase().split(/[-_]/)[0];
    if (base === 'zh') return 'zh-CN';
    if (base === 'en' || base === 'ja') return base;
  }
  return 'en';
}

export function translate(language, key, values = {}) {
  const template = messages[language]?.[key] ?? messages.en[key];
  if (template === undefined) throw new Error(`Missing translation: ${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function selectVoice(voices, language) {
  const tag = language.toLowerCase();
  const normalized = voice => voice.lang.toLowerCase().replaceAll('_', '-');
  return voices.find(voice => normalized(voice) === tag) ||
    voices.find(voice => normalized(voice).split('-')[0] === tag.split('-')[0]);
}

export function translateDocument(root, language) {
  for (const [attribute, target] of [['data-i18n', null], ['data-i18n-aria', 'aria-label'], ['data-i18n-title', 'title']]) {
    for (const element of root.querySelectorAll(`[${attribute}]`)) {
      const text = translate(language, element.getAttribute(attribute));
      if (target) element.setAttribute(target, text); else element.textContent = text;
    }
  }
}
