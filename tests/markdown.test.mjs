import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

test("GFM task markdown renders a semantic table", () => {
  const markdown = `| タスクID | タイトル | ステータス | プロジェクト |
|---|---|---|---|
| 8 | test | doing | 3 |`;
  const html = renderToStaticMarkup(
    React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], children: markdown }),
  );
  assert.match(html, /<table>/);
  assert.match(html, /<th>タスクID<\/th>/);
  assert.match(html, /<td>doing<\/td>/);
});

