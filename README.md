# 测试工具大全

纯前端测试工具集，零依赖，双击 index.html 即可使用。

## 工具列表
1. JSON 格式化 / 校验（格式化、压缩）
2. Unix 时间戳转换（实时时钟、双向转换）
3. Base64 编解码（支持中文 UTF-8）
4. URL 编解码
5. UUID v4 批量生成
6. 随机密码生成（含熵值强度预估）
7. 正则表达式测试（实时高亮）
8. 文本对比（LCS 逐行 diff）
9. 哈希计算（SHA-1 / SHA-256 / SHA-512）
10. 颜色转换（HEX / RGB / HSL + 取色器）

## 说明
- 所有处理均在浏览器本地完成，数据不出本地
- 推荐 Chrome / Edge 浏览器
- 结构：index.html + css/style.css + js/app.js

## 在线访问
网站已通过 GitHub Pages 部署，推送 `main` 分支后自动发布：
`https://<你的用户名>.github.io/<仓库名>/`

## 本地部署到互联网（GitHub Pages）
1. 在 GitHub 上新建一个仓库（例如 `test-tools`），不要勾选初始化 README
2. 在项目目录执行：
   ```bash
   git add .
   git commit -m "feat: 发布测试工具大全"
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 打开仓库 **Settings → Pages**，Source 选择 **GitHub Actions**
4. 等待 Actions 运行完成，即可通过上面的在线地址访问

> 首次推送后若 Actions 未自动触发，可在 **Actions** 页面手动运行 `Deploy to GitHub Pages` 工作流。
