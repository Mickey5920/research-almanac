---
type: skill-reference
status: active
created: 2026-09-18
updated: 2026-09-18
tags: [zhouyi, bagua, sources]
---

# 八卦原文与解读 / Trigram reference

Read this when explaining a window's trigram or a user asks for 八卦, classical wording, or the meaning behind a direction.

## Selection and evidence

Use [the curated library](../data/bagua.json) and `baguaForDirection` in [the local adapter](../scripts/bagua.js). The eight three-line trigrams are distinct from six-line hexagrams. `lines_top_down` stores display order, not bottom-to-top casting order.

Map the **already saved direction** using the Later Heaven convention: north Kan, northeast Gen, east Zhen, southeast Xun, south Li, southwest Kun, west Dui, northwest Qian. Normalize 正北/正东/正南/正西. Unknown directions have no window-specific trigram. Do not invent a chart or a new facing direction to fill a gap.

This layer explains a direction; it neither casts a divination nor changes timing scores. Practical and academic priorities remain unchanged. When exporting existing records, attach the reference in the presentation payload and preserve the original records.

## Explain in four parts

1. Name, three-line symbol, natural image and the matched direction.
2. Exact Chinese quotation, text title and chapter. Keep quoted text unchanged in the English UI.
3. A plain-language paraphrase of the original meaning, using the library's Chinese or original English explanation.
4. A separately labelled modern submission reflection: concrete checks or preparation tasks, not an ancient claim about journals or acceptance.

Preserve meaningful distinctions: 坎“陷” refers to a pit/difficulty; 离“丽” here is attachment/clinging, not simply beauty; 兑“说” here means delight. Present useful preparation advice without rewriting the original meaning as guaranteed good fortune. Do not attach 《说卦传》 quotations to day officers, exact minutes, zodiac rules or academic statistics: those require their own sources.

For other classical explanations, also quote the relevant verified passage and explain it before applying it to the manuscript. Use existing [curated excerpts](../data/excerpts.json); do not manufacture classical wording for unsupported methods.

## Verified sources — 2026-09-18

- [《说卦传》固定版本](https://zh.wikisource.org/w/index.php?title=易傳/說卦&oldid=2614055): chapter 7 for the eight qualities, chapter 11 for natural images, chapter 5 for directional discussion. Excerpts retain traditional characters; explanatory prose is original to this project.
- [《周易正义》说卦卷九之五](https://zh.wikisource.org/w/index.php?title=周易正義/09.05&oldid=2000784): the commentary explicitly describes Dui as western.
- [《周易总义》卷二十](https://zh.wikisource.org/zh-hant/周易總義_(四庫全書本)/卷20): its commentary describes Kun as retreating to the southwest in the directional sequence. It also discusses an earlier arrangement; do not mix the two.

Classical Chinese passages are public-domain texts. Modern paraphrases and English explanations here are newly written, not copied translations. The eight-trigram atlas is collapsible and provides all eight entries without assigning absent directions to any candidate.
