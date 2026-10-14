# 如何新增一篇日报

日报是普通文章，同时属于分类「日报」。每天只加 **一个** Markdown 文件。首页、文章列表和「日报」菜单都会在下次构建时自动更新。

## 文件路径

```text
content/posts/YYYY-MM-DD.md
```

文件名就是日期。例如 `content/posts/2026-10-15.md` 会发布到：

```text
https://yanleijava.github.io/posts/2026-10-15/
```

「日报」菜单页只列出这个分类里的文章，地址是：

```text
https://yanleijava.github.io/categories/日报/
```

规则：

- 放在 `content/posts/`，和其它文章同一个目录。
- 文件名用 `YYYY-MM-DD.md`（四位年、两位月、两位日）。
- 一天一篇。同一天不要放两个文件。
- Front matter 里必须有 `categories: [日报]`，否则不会出现在「日报」菜单页。
- 不要新建 `content/daily/`。旧地址 `/daily/` 和 `/daily/YYYY-MM-DD/` 会跳转到新地址。

## Front matter

```yaml
---
title: "财经科技早报｜10月15日"
date: 2026-10-15
summary: "一句话摘要，用于页面简介。可以不写。"
categories:
  - 日报
aliases:
  - /daily/2026-10-15/
---
```

| 字段 | 是否必填 | 作用 |
| --- | --- | --- |
| `title` | 必填 | 文章标题，显示在首页、文章列表和日报列表 |
| `date` | 建议写 | 发布日期，格式 `YYYY-MM-DD`。列表按它从新到旧排序。省略时，Hugo 会从文件名 `YYYY-MM-DD` 读取日期。晚于构建当天的日期默认不会发布 |
| `summary` | 可省略 | 页面简介。不写时用正文开头自动生成 |
| `categories` | 必填 | 固定写成上面的 `日报`。这样文章会进入「日报」菜单页，同时仍出现在首页和文章列表 |
| `aliases` | 建议写 | 旧日报地址。写成 `/daily/` 加上文件名里的日期，构建时生成跳转 |
| `draft` | 可省略 | `true` 时正式构建不发布。默认发布 |

正文用 Markdown。两个栏目用二级标题，条目用列表，最后单独一段写收束句：

```markdown
## 💰 财经

- 第一条
- 第二条

## 🔬 科技

- 第一条

接下来最值得盯的是……
```

## 发布

```bash
git add content/posts/2026-10-15.md
git commit -m "日报：2026-10-15"
git push
```

推到 `main` 后，GitHub Actions（`.github/workflows/hugo.yaml`）会用 Hugo 构建并部署到 GitHub Pages。
