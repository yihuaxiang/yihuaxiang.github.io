# yihuaxiang.github.io

移花香的 GitHub Pages 个人主页，基于 Vite + React 构建。

## 本地开发

```bash
npm install
npm run dev
```

`npm run dev` 会先同步项目数据，然后启动本地开发服务。

## 构建

```bash
npm run build
npm run preview
```

构建前会执行 `scripts/sync-projects.mjs`：

- 默认从 `https://playground2.z.wiki/api/projects` 拉取项目 JSON 并生成 `src/data/projects.generated.json`。
- 如果配置了 `PROJECTS_API_URL`，会覆盖默认接口地址。
- 如果接口失败，会自动回退到 seed 数据，避免发布中断。
- 构建结束会预渲染 `dist/index.html`，并生成 `robots.txt` 与 `sitemap.xml`。
- 构建结果也会导出到仓库根目录，兼容当前 GitHub Pages 的 `main / root` 分支发布模式。

`index.template.html` 是 Vite 源模板；根目录 `index.html` 是可直接被 GitHub Pages 托管的构建产物。

## 项目数据接口

推荐接口返回：

```json
{
  "projects": [
    {
      "id": "imgbed",
      "title": "项目名称",
      "url": "https://example.com",
      "description": "项目描述",
      "tagline": "短介绍",
      "image": "https://example.com/cover.png",
      "category": "网站能力 / 小服务",
      "categoryId": "service-projects",
      "tags": ["React", "Spring Boot"],
      "featured": true
    }
  ]
}
```

当前接口也兼容 `{ "success": true, "data": [...] }` 结构，其中 `name`、`preview`、`status` 会分别映射为项目标题、封面图和标签。可选返回 `profile` 和 `sections` 字段覆盖页面基础信息与分区说明。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`，推送到 `main` 或 `master` 后自动构建并发布 `dist/`。当前仓库也提交了根目录静态产物，因此即使 Pages 仍配置为 `main / root` 也能正常访问。

如果需要接入远程项目接口，在仓库 Settings → Secrets and variables → Actions 中添加：

- `PROJECTS_API_TOKEN`（可选）

## SEO

构建流程会写入：

- 预渲染后的首页 HTML，搜索引擎无需执行 JavaScript 也能看到项目列表。
- `canonical`、Open Graph、Twitter Card、robots 等元信息。
- WebSite、ItemList、BreadcrumbList 三组 JSON-LD 结构化数据。
- `robots.txt` 和 `sitemap.xml`。
