# 如何新增一篇日报

每天只加 **一个** Markdown 文件。导航、日报索引和文章页都会在下次构建时自动更新，不用改模板、菜单或索引。

## 文件路径

```text
content/daily/YYYY-MM-DD.md
```

文件名就是日期，也是网址末尾。例如 `content/daily/2026-10-15.md` 会发布到：

```text
https://yanleijava.github.io/daily/2026-10-15/
```

规则：

- 目录固定是 `content/daily/`。不要放进 `content/posts/`，否则会出现在「文章」而不是「日报」。
- 文件名用 `YYYY-MM-DD.md`（四位年、两位月、两位日）。
- 一天一篇。同一天不要放两个文件。
- 不要改 `content/daily/_index.md`，那是栏目页，不是某一天的日报。

## Front matter

```yaml
---
title: "财经科技早报｜10月15日"
date: 2026-10-15
summary: "一句话摘要，用于页面简介。可以不写。"
draft: false
---
```

| 字段 | 是否必填 | 作用 |
| --- | --- | --- |
| `title` | 必填 | 文章标题，显示在日报列表和文章页 |
| `date` | 建议写 | 发布日期，格式 `YYYY-MM-DD`。索引按它从新到旧排序。省略时，Hugo 会从文件名 `YYYY-MM-DD` 读取日期。晚于构建当天的日期默认不会发布 |
| `summary` | 可省略 | 页面简介。不写时用正文开头自动生成 |
| `draft` | 可省略 | `true` 时正式构建不发布。默认发布，和站点其他文章一样 |

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
git add content/daily/2026-10-15.md
git commit -m "日报：2026-10-15"
git push
```

推到 `main` 后，GitHub Actions（`.github/workflows/hugo.yaml`）会用 Hugo 构建并部署到 GitHub Pages。

也可以用脚手架生成同一路径的文件，然后再填正文：

```bash
hugo new content daily/2026-10-15.md
```
