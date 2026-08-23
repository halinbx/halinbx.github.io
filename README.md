# 测试工具大全

[![在线使用](https://img.shields.io/badge/在线使用-halinbx.github.io%2FTestGo-2ea44f?style=for-the-badge&logo=github)](https://halinbx.github.io/TestGo/)

纯前端测试工具集，零依赖，免登录、无广告，数据不出本地。双击 index.html 即可使用。

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

## 绑定自己的域名（可选）
1. **购买域名**
   - 国外注册商：Cloudflare / Namecheap / GoDaddy（无需实名，推荐 `.com` / `.dev`）
   - 国内注册商：阿里云 / 腾讯云（需实名认证；GitHub Pages 服务器在国外，**无需备案**）
2. **配置 DNS 解析**（在域名注册商的控制台）
   - 子域名（如 `www.example.com`）：添加 `CNAME` 记录 → `<你的用户名>.github.io`
   - 主域名（如 `example.com`）：添加 4 条 `A` 记录 → `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
3. **GitHub 仓库设置**
   - **Settings → Pages → Custom domain** 填入你的域名 → Save（GitHub 会自动提交 `CNAME` 文件）
   - 勾选 **Enforce HTTPS** 启用强制 HTTPS（DNS 生效后即可勾选，一般几分钟到几小时）
