# 博客

用 Hugo 生成、GitHub Pages 托管。写文章、`git push`，站点会自动更新。

线上地址：https://yanleijava.github.io/

## 日常怎么用

```bash
# 新建文章（文件名即网址 slug）
hugo new content posts/my-article.md

# 本地预览
hugo server
```

编辑 `content/posts/my-article.md`，然后：

```bash
git add content/posts/my-article.md
git commit -m "发布：文章标题"
git push
```

## 常改的文件

| 文件 | 用途 |
| --- | --- |
| `hugo.toml` | 站点名、介绍、产品列表、联系方式 |
| `content/about.md` | 关于页 |
| `content/posts/*.md` | 文章。日报也放这里，并在 front matter 里写 `categories: [日报]`，见 [docs/daily-report.md](docs/daily-report.md) |

新增产品时，在 `hugo.toml` 里追加一段：

```toml
[[params.products]]
  name = '产品名'
  url = 'https://example.com/'
  summary = '一句话介绍。'
  note = '在线'
  logo = '/images/products/product.svg'
```

产品 logo 放到 `static/images/products/`，然后在配置里用 `/images/products/...` 引用。
