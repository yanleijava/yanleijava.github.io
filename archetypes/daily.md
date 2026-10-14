---
{{- $date := now.Format "2006-01-02" -}}
{{- if findRE `^\d{4}-\d{2}-\d{2}$` .Name -}}
{{- $date = .Name -}}
{{- end -}}
{{- $t := time.AsTime $date }}
title: "财经科技早报｜{{ $t.Format "1月2日" }}"
date: {{ $date }}
summary: ""
draft: false
---

## 💰 财经

-

## 🔬 科技

-

接下来最值得盯的是
