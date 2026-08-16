---
title: "How Hybrid Retrieval Actually Works"
date: 2026-08-13
description: "A visual guide to combining lexical and semantic search, from score fusion to rank fusion and reranking."
tags: ["hybrid retrieval", "information retrieval", "bm25", "embeddings", "reranking"]
---

**A visual guide to combining lexical and semantic search, from score fusion to rank fusion and reranking.**

Search systems rarely agree. A lexical retriever can reward the exact words in a query while missing a strong paraphrase. A semantic retriever can recognize the paraphrase while giving less weight to a crucial keyword.

This article keeps one query and the same six documents in view:

> How can I reduce LLM inference costs?

You can edit the query. Every ranking, score, and transition will update from the text you enter.

## Two retrievers, two answers

BM25 works with terms extracted from the query and documents. It rewards exact overlap, adjusts for how rare a term is in the collection, and accounts for document length.

Dense retrieval takes a different route. It represents the query and every document as vectors, then ranks documents by their vector similarity. This allows a phrase such as “computational expense of neural text generation” to match “LLM inference costs” even when the words barely overlap.

Neither signal is sufficient in every case. The practical question is:

> BM25 and dense retrieval produce two different rankings. How do we turn them into one?

{{< hybrid-retrieval view="disagreement" >}}

## Weighted score fusion

The most direct answer is a weighted sum:

$$
\begin{aligned}
s_{\mathrm{hybrid}}(d)
&= \alpha\,\hat{s}_{\mathrm{BM25}}(d) \\
&\quad + (1-\alpha)\,\hat{s}_{\mathrm{dense}}(d)
\end{aligned}
$$

The weight `α` controls how much lexical evidence contributes. Move it toward BM25 when exact terminology matters; move it toward dense retrieval when paraphrases and related concepts matter more.

There is an important complication. A BM25 score such as `8.2` and a cosine similarity such as `0.87` are not measurements on the same scale. Adding the raw values would let the larger numeric range dominate for an arbitrary reason.

The explorer therefore applies min-max normalization to each score list before weighting it:

$$
\hat{x}_i = \frac{x_i-\min(x)}{\max(x)-\min(x)}
$$

Normalization makes the ranges comparable, but it also makes fusion relative to the candidate set. Change the candidates and the normalized values can change too.

{{< hybrid-retrieval view="weighted" >}}

## Reciprocal Rank Fusion

Reciprocal Rank Fusion takes a more scale-independent approach: discard the scores and combine only rank positions.

$$
\operatorname{RRF}(d)
= \sum_{r \in \{\mathrm{BM25},\,\mathrm{dense}\}}
\frac{1}{k+\operatorname{rank}_r(d)}
$$

A document receives a contribution from every ranking in which it appears. Documents that rank well in both lists tend to rise to the top. The constant `k` controls how quickly the contribution falls as rank gets worse.

RRF does not care whether BM25 assigned `8.2` or `82`. It only cares that the document ranked first. That makes it robust when retrievers produce scores with incompatible meanings, although it also throws away potentially useful information about the distance between documents.

{{< hybrid-retrieval view="rrf" >}}

## Retrieve broadly, then rerank

Another architecture often described as hybrid retrieval does not make fusion the final decision.

BM25 and dense retrieval each contribute their best candidates. The system takes their union, then a reranker reads the query and each candidate together. Unlike the first-stage retrievers, a cross-encoder can model detailed interactions between query and document terms. It is slower, so it is applied only to the small candidate pool.

This separates two jobs:

- **Retrieval optimizes candidate discovery.**
- **Reranking optimizes candidate ordering.**

A document can therefore be rescued by dense retrieval, enter the shared pool, and move again when the reranker examines it more carefully.

{{< hybrid-retrieval view="reranking" >}}

## Follow one document

Follow one persistent document across all methods. Document C begins with little lexical overlap but expresses the query semantically:

> Lowering the computational expense of neural text generation

Its movement tells the central story. BM25 can overlook it, dense retrieval can rescue it, fusion can balance it against exact matches, and a reranker can make a more detailed final judgment.

{{< hybrid-retrieval view="follow" >}}

## Compare everything

Switch among all five result lists to compare the complete journey. The letter identifiers and colors remain fixed, so a movement always belongs to the same document.

{{< hybrid-retrieval view="comparison" >}}

There is no universally best fusion method:

- **Weighted fusion** preserves score information and gives you direct control, but requires comparable scores.
- **RRF** is simple and robust across score scales, but only sees rank positions.
- **Reranking** can produce a stronger final order, but adds model cost and latency.

The right design depends on whether your system values exact matching, semantic recall, latency, interpretability, and available relevance data.

## Where to go deeper

BM25 operates over terms extracted from text. A separate visual guide to tokenization will unpack how those terms are produced.

Dense retrieval represents text as vectors. A separate visual guide to embeddings will show where those vectors come from and what similarity means geometrically.

Hybrid retrieval sits above both. Its job is not to declare one retriever correct. Its job is to preserve the useful disagreements between them and turn those disagreements into a better result.
