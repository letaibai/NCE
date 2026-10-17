
# 新概念英语 · 全四册在线点读系统

[![Stars](https://img.shields.io/github/stars/ichochy/nce.svg?style=social)](https://github.com/ichochy/nce/stargazers)
[![License](https://img.shields.io/github/license/ichochy/nce)](https://github.com/ichochy/nce/blob/main/LICENSE)

**《New Concept English》** 全四册在线课文朗读、**单句点读**、中英对照，随时随地自学英语！

**在线体验**：👉 **[https://letaibai.github.io/NCE/](https://letaibai.github.io/NCE/)**

---

### ✨ 主要功能

- 🎧 **美音课文朗读**：流畅自然的原版音频
- 📍 **单句点读**：点击任意句子即可跟读练习
- 📖 **中英对照**：逐句显示中英文，便于理解
- 📱 **响应式设计**：手机、平板、电脑均可流畅使用
- 🚀 **无需安装**：浏览器直接访问，随时学习

### 📚 四册学习指南

#### 📕 第一册：《First Things First》
**目标**：打好语音与基础  
**课数**：144课 | **词汇量**：约 600 词  
适合 **零基础** 学习者，建立语感和正确发音。

#### 📘 第二册：《Practice and Progress》
**目标**：语法体系与听说读写同步提升  
**课数**：96课 | **词汇量**：约 1500 词  
适合有基础的学习者，系统梳理语法。

#### 📙 第三册：《Developing Skills》
**目标**：进阶阅读与复杂句型  
**课数**：60课 | **词汇量**：约 2500 词  
适合想提高综合能力、阅读原版材料的学习者。

#### 📗 第四册：《Fluency in English》
**目标**：接近流利表达与学术阅读  
**课数**：48课 | **词汇量**：约 3500–4000 词  
适合高阶学习者、考研/雅思/托福备考。

**推荐学习路径**：按册顺序学习 → 第一册打基础 → 第四册冲刺流利。

---

### 🛠️ 技术与资源

- **前端**：HTML + CSS + JavaScript（纯静态实现）
- **音频来源**：美音音频来自 [tangx/New-Concept-English](https://github.com/tangx/New-Concept-English)
- **中文字幕**：由 Gemini AI 生成（已尽力优化，但可能存在少量错误，欢迎大家指正与贡献）
- **翻译脚本**：作者自研 Python 工具 [iGSTT](https://ichochy.com/posts/shell/20251015.html)

---

## 📦 外挂资源

系统的核心设计：**播放器与资源完全解耦**。一份学习资源就是一个可静态托管的目录，包含 `book.json` 描述文件、每课的 MP3 音频与 LRC 歌词。

### 目录结构

```
your-book/
├── book.json          # 课本描述文件（必需）
├── cover.png          # 课本封面（可选）
├── unit1.mp3          # 课文音频
├── unit1.lrc          # 课文歌词（中英对照）
├── unit2.mp3
└── unit2.lrc
```

### book.json

```json
{
  "name": "新概念英语",
  "level": "1 st",
  "cover": "cover.png",
  "units": [
    { "title": "Unit 1 Hello", "filename": "unit1" },
    { "title": "Unit 2 Nice to meet you", "filename": "unit2" }
  ]
}
```

系统按 `${bookPath}/${filename}.mp3` 与 `${bookPath}/${filename}.lrc` 拼接资源地址。

### LRC 歌词格式

标准 LRC 时间标签，`|` 分隔英文与中文：

```
[00:12.34]Good morning, class. | 早上好，同学们。
[00:15.00]Stand up, please. | 请起立。
[00:18.50]Sit down, please. | 请坐。
```

- 时间标签支持 `[mm:ss.xx]` 或 `[mm:ss.xxx]`
- `|` 左侧为英文、右侧为中文（中文可省略）
- `#` 开头的行视为注释，空行自动忽略

### 接入自己的资源

1. **准备资源**：按上述结构生成 `book.json`、MP3 与 LRC 文件，托管到任意支持 CORS 的静态服务器（GitHub Pages、Vercel、OSS、Nginx 等）
2. **注册课本**：在 `data.json` 的 `books` 数组中添加一条记录：

   ```json
   {
     "key": "MYBOOK",
     "title": "My English Book",
     "path": "https://your-domain.com/your-book"
   }
   ```

3. **访问**：部署播放器后，通过 `https://your-player.com/#MYBOOK` 直达该课本

> ⚠️ 资源服务器需返回 CORS 头（如 `Access-Control-Allow-Origin: *`），否则浏览器会拦截跨域请求 `book.json` 与 LRC 文件。

---

### ⚠️ 说明与版权

- 本项目**仅供个人学习研究使用**，非商业用途。
- 所有内容来源于互联网，我们不拥有版权。
- **强烈建议**支持正版，购买官方教材与音频。

#### 内容来源与版权归属

| 内容 | 来源 | 版权 |
|------|------|------|
| 播放器代码 | [iChochy/nce](https://github.com/ichochy/nce)（本项目基于其修改） | 原作者 [iChochy](https://ichochy.com) |
| 课文音频（美音） | [letaibai/New-Concept-English](https://github.com/letaibai/New-Concept-English)，源自 [tangx/New-Concept-English](https://github.com/tangx/New-Concept-English) | 外语教学与研究出版社 |
| 课文文本与字幕 | 上游 mleo.site 资源站 | 外语教学与研究出版社 |
| 词汇数据（音标/释义） | [ECDICT](https://github.com/skywind3000/ECDICT) 开源词库 | 按 ECDICT 许可使用 |
| **语法讲解 / 句型 / 扩展知识 / 练习题** | [ncego.com 夸克英语笔记](https://www.ncego.com/)（站长 Kowk 原创教学笔记） | **版权归 ncego.com 及原作者所有，本项目仅作个人学习参考引用** |

- 语法讲解等教学笔记内容抓取自 [ncego.com](https://www.ncego.com/)，若原作者（Kowk）提出异议，将及时删除相关内容。联系：[letaibai@gmail.com](mailto:letaibai@gmail.com)。
- 《新概念英语》（New Concept English）教材及配套音频的版权归**外语教学与研究出版社**与**朗文出版公司**所有。

#### 原作者署名

- **播放器原作者**：iChochy  
  **Blog**：https://ichochy.com  
  **Email**：qim.dev@icloud.com  
  **GitHub**：https://github.com/ichochy/nce
- 如有侵权，请联系 [letaibai@gmail.com](mailto:letaibai@gmail.com) 及时处理。
