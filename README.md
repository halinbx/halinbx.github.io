# 工具大全 · owntools.cn

[![在线使用](https://img.shields.io/badge/在线使用-owntools.cn-2ea44f?style=for-the-badge&logo=github)](https://owntools.cn/)

**史上最干净的工具类网站** —— 10 个免费在线开发/测试工具,无广告 · 免登录,9/10 纯前端本地运行(仅二维码生成需联网,页面有明示),打开就用。

> 在线地址:**https://owntools.cn**
> JSON 格式化 · 时间戳转换 · 正则测试 · 文本 Diff · JWT 解码 · 哈希计算 · 二维码 …… 一个网址全搞定。
> 每个工具均有 hash 直达链接(如 `https://owntools.cn/#jwt`),可收藏、可分享。

## ✨ 工具列表(10 个,与线上 KEEP_IDS 一致)

| # | 工具 | hash 直达 | 说明 |
|---|------|----------|------|
| 1 | JSON 格式化 / 校验 | `#json` | 格式化、压缩,报错定位到行 |
| 2 | Unix 时间戳转换 | `#ts` | 实时时钟、秒/毫秒双向转换 |
| 3 | Base64 编解码 | `#b64` | 支持中文 UTF-8 |
| 4 | URL 编解码 | `#url` | 百分号编码/解码 |
| 5 | UUID v4 生成 | `#uuid` | 批量生成 |
| 6 | JWT 解析 | `#jwt` | Header/Payload 解码 |
| 7 | 正则表达式测试 | `#re` | 实时高亮匹配 |
| 8 | 文本对比 | `#diff` | LCS 逐行 diff |
| 9 | 哈希计算 | `#hash` | MD5 / SHA-1 / SHA-256 / SHA-512 |
| 10 | 二维码生成 🌐 | `#qr` | 需联网(api.qrserver.com) |

> 🌐 标记的 1 个工具需调用第三方接口,工具页面顶部有联网提示;**其余 9 个纯前端实现,输入数据不会上传任何服务器,隐私零风险**。

## 🔍 站内导航
- 顶栏平铺 10 个工具直达按钮(9/9 精简:删除「更多」下拉)
- 搜索框输入关键词(支持拼音/英文/中文),回车打开第一个匹配项
- hash 路由,每个工具的 URL 可收藏、可分享(如 `#jwt`)

## 📊 查看网站访问量
- **今日访问计数**(已内置):网站左下角自动显示「今日访问 N 次 · 今日访客 M 人」(Abacus 免费计数,零配置)
- **完整统计后台**(可选):`index.html` 底部预留了 GA4 / 百度统计模板,取消注释填入 ID 即可看趋势/来源/地区报表

## 🚀 本地使用
双击 `index.html` 即可,推荐 Chrome / Edge。

## 🔧 部署(GitHub Pages)
1. Fork 或推送到 GitHub 仓库,Source 选 **GitHub Actions**(工作流已内置)
2. 自定义域名:DNS 添加 4 条 A 记录 `185.199.108~111.153`,仓库 Settings → Pages → Custom domain 填入域名
3. 勾选 **Enforce HTTPS** 启用强制 HTTPS

## 📄 License
MIT