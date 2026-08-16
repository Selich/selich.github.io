const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";
const DEFAULT_ALPHA = 0.4;
const DEFAULT_K = 60;
const BM25_K1 = 1.5;
const BM25_B = 0.75;
const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "can", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "the", "this", "to", "with"]);

const roots = Array.from(document.querySelectorAll(".hybrid-explorer"));
const state = {
  documents: [],
  embeddingModel: null,
  rerankerModel: null,
  query: roots[0]?.dataset.defaultQuery || "How can I reduce LLM inference costs?",
  alpha: DEFAULT_ALPHA,
  k: DEFAULT_K,
  selectedMethod: "weighted",
  selectedDocument: null,
  bm25: [],
  dense: [],
  queryEmbedding: null,
  weighted: [],
  rrf: [],
  reranked: [],
  denseStatus: "idle",
  denseProgress: "",
  rerankStatus: "idle",
  rerankProgress: "",
  message: "Preparing the retrieval explorer.",
  queryRevision: 0
};

let transformersPromise;
let embeddingPipelinePromise;
let rerankerPromise;
let queryTimer;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tokenize(value) {
  const matches = value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return matches.filter((token) => !STOP_WORDS.has(token));
}

function calculateBm25(query, documents) {
  const queryTerms = tokenize(query);
  const tokenizedDocuments = documents.map((document) => tokenize(`${document.title} ${document.text}`));
  const averageLength = tokenizedDocuments.reduce((sum, tokens) => sum + tokens.length, 0) / Math.max(tokenizedDocuments.length, 1);
  const frequencies = new Map();

  tokenizedDocuments.forEach((tokens) => {
    new Set(tokens).forEach((term) => frequencies.set(term, (frequencies.get(term) || 0) + 1));
  });

  return documents.map((document, index) => {
    const tokens = tokenizedDocuments[index];
    const termCounts = new Map();
    tokens.forEach((term) => termCounts.set(term, (termCounts.get(term) || 0) + 1));

    const score = queryTerms.reduce((sum, term) => {
      const termFrequency = termCounts.get(term) || 0;
      if (!termFrequency) {
        return sum;
      }
      const documentFrequency = frequencies.get(term) || 0;
      const inverseDocumentFrequency = Math.log(1 + (documents.length - documentFrequency + 0.5) / (documentFrequency + 0.5));
      const lengthAdjustment = 1 - BM25_B + BM25_B * (tokens.length / Math.max(averageLength, 1));
      return sum + inverseDocumentFrequency * ((termFrequency * (BM25_K1 + 1)) / (termFrequency + BM25_K1 * lengthAdjustment));
    }, 0);

    return { id: document.id, score };
  });
}

function normalizeScores(rows) {
  if (!rows.length) {
    return [];
  }
  const values = rows.map((row) => row.score);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  return rows.map((row) => ({
    id: row.id,
    score: range === 0 ? 1 : (row.score - minimum) / range
  }));
}

function sortScores(rows) {
  return [...rows]
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function scoreMap(rows) {
  return new Map(rows.map((row) => [row.id, row.score]));
}

function rankMap(rows) {
  return new Map(rows.map((row) => [row.id, row.rank]));
}

function calculateWeighted() {
  if (!state.bm25.length || !state.dense.length) {
    state.weighted = [];
    return;
  }
  const sparse = scoreMap(normalizeScores(state.bm25));
  const semantic = scoreMap(normalizeScores(state.dense));
  state.weighted = sortScores(state.documents.map((document) => ({
    id: document.id,
    score: state.alpha * sparse.get(document.id) + (1 - state.alpha) * semantic.get(document.id)
  })));
}

function calculateRrf() {
  if (!state.bm25.length || !state.dense.length) {
    state.rrf = [];
    return;
  }
  const sparseRanks = rankMap(state.bm25);
  const denseRanks = rankMap(state.dense);
  state.rrf = sortScores(state.documents.map((document) => ({
    id: document.id,
    score: 1 / (state.k + sparseRanks.get(document.id)) + 1 / (state.k + denseRanks.get(document.id))
  })));
}

function recomputeDerivedResults() {
  calculateWeighted();
  calculateRrf();
}

function dotProduct(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function progressLabel(event, prefix) {
  if (typeof event?.progress === "number") {
    return `${prefix} ${Math.round(event.progress)}%`;
  }
  if (event?.file) {
    return `${prefix} ${event.file.split("/").pop()}`;
  }
  return prefix;
}

async function loadTransformers() {
  if (!transformersPromise) {
    transformersPromise = import(TRANSFORMERS_URL);
  }
  return transformersPromise;
}

async function loadEmbeddingPipeline() {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = (async () => {
      const { pipeline } = await loadTransformers();
      return pipeline("feature-extraction", state.embeddingModel.id, {
        dtype: state.embeddingModel.dtype,
        revision: state.embeddingModel.revision,
        progress_callback: (event) => {
          state.denseProgress = progressLabel(event, "Loading semantic model");
          renderAll();
        }
      });
    })();
  }
  return embeddingPipelinePromise;
}

async function calculateDenseForQuery(query, revision) {
  state.denseStatus = "loading";
  state.denseProgress = "Loading semantic model";
  state.message = "Computing semantic similarities.";
  renderAll();

  try {
    const extractor = await loadEmbeddingPipeline();
    const queryOutput = await extractor(query, { pooling: "mean", normalize: true });
    const queryEmbedding = queryOutput.tolist()[0];

    if (revision !== state.queryRevision) {
      return;
    }

    state.queryEmbedding = queryEmbedding;
    state.dense = sortScores(state.documents.map((document, index) => ({
      id: document.id,
      score: dotProduct(queryEmbedding, state.documents[index].embedding)
    })));
    state.denseStatus = "ready";
    state.denseProgress = "";
    state.message = "Sparse and semantic rankings updated.";
    recomputeDerivedResults();
    renderAll();
    observeReranker();
  } catch (error) {
    console.error("Dense retrieval could not be initialized.", error);
    state.dense = [];
    state.weighted = [];
    state.rrf = [];
    state.denseStatus = "error";
    state.denseProgress = "";
    state.message = "Semantic retrieval is unavailable. BM25 remains interactive.";
    renderAll();
  }
}

async function loadReranker() {
  if (!rerankerPromise) {
    rerankerPromise = (async () => {
      const { AutoTokenizer, AutoModelForSequenceClassification } = await loadTransformers();
      const options = {
        dtype: state.rerankerModel.dtype,
        revision: state.rerankerModel.revision,
        progress_callback: (event) => {
          state.rerankProgress = progressLabel(event, "Loading reranker");
          renderAll();
        }
      };
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(state.rerankerModel.id, options),
        AutoModelForSequenceClassification.from_pretrained(state.rerankerModel.id, options)
      ]);
      return { tokenizer, model };
    })();
  }
  return rerankerPromise;
}

function candidateDocuments() {
  const ids = new Set([
    ...state.bm25.slice(0, 3).map((row) => row.id),
    ...state.dense.slice(0, 3).map((row) => row.id)
  ]);
  return state.documents.filter((document) => ids.has(document.id));
}

async function calculateReranking(revision = state.queryRevision) {
  if (state.rerankStatus === "loading" || !state.dense.length) {
    return;
  }
  state.rerankStatus = "loading";
  state.rerankProgress = "Loading reranker";
  state.message = "Reranking the shared candidate pool.";
  renderAll();

  try {
    const { tokenizer, model } = await loadReranker();
    const candidates = candidateDocuments();
    const inputs = tokenizer(new Array(candidates.length).fill(state.query), {
      text_pair: candidates.map((document) => `${document.title}. ${document.text}`),
      padding: true,
      truncation: true,
      max_length: 256
    });
    const output = await model(inputs);
    const logits = output.logits || output;
    const values = Array.from(logits.data || logits);

    if (revision !== state.queryRevision) {
      state.rerankStatus = "idle";
      return;
    }

    state.reranked = sortScores(candidates.map((document, index) => ({
      id: document.id,
      score: values[index]
    })));
    state.rerankStatus = "ready";
    state.rerankProgress = "";
    state.message = "The candidate pool has been reranked.";
    renderAll();
  } catch (error) {
    console.error("Reranking could not be initialized.", error);
    state.reranked = [];
    state.rerankStatus = "error";
    state.rerankProgress = "";
    state.message = "The reranker is unavailable. First-stage rankings remain interactive.";
    renderAll();
  }
}

function getDocument(id) {
  return state.documents.find((document) => document.id === id);
}

function getRow(rows, id) {
  return rows.find((row) => row.id === id);
}

function formatScore(score, method) {
  if (!Number.isFinite(score)) {
    return "—";
  }
  if (method === "bm25") {
    return score.toFixed(2);
  }
  if (method === "rrf") {
    return score.toFixed(4);
  }
  if (method === "reranked") {
    return score.toFixed(2);
  }
  return score.toFixed(3);
}

function scoreWidth(rows, score) {
  const normalized = normalizeScores(rows);
  const matching = normalized.find((row) => Math.abs((getRow(rows, row.id)?.score || 0) - score) < Number.EPSILON);
  return Math.max(6, (matching?.score || 0) * 100);
}

function movementLabel(rank, comparisonRank) {
  if (!rank || !comparisonRank || rank === comparisonRank) {
    return "";
  }
  const difference = comparisonRank - rank;
  return `<span class="hybrid-movement ${difference > 0 ? "is-up" : "is-down"}" aria-label="${difference > 0 ? "up" : "down"} ${Math.abs(difference)} positions">${difference > 0 ? "↑" : "↓"}${Math.abs(difference)}</span>`;
}

function renderRanking(rows, method, options = {}) {
  if (!rows.length) {
    const label = options.loading || "Unavailable";
    return `<div class="hybrid-empty"><span class="hybrid-spinner" aria-hidden="true"></span>${escapeHtml(label)}</div>`;
  }
  const comparison = options.compareWith ? rankMap(options.compareWith) : new Map();
  return `<ol class="hybrid-ranking" aria-label="${escapeHtml(options.label || `${method} ranking`)}">
    ${rows.map((row) => {
      const document = getDocument(row.id);
      const width = scoreWidth(rows, row.score);
      return `<li class="hybrid-rank-row hybrid-document-${document.id.toLowerCase()}" data-doc-id="${document.id}" style="--hybrid-score-width:${width}%">
        <button type="button" class="hybrid-document-button" data-document-action="${document.id}" aria-label="Inspect document ${document.id}, ranked ${row.rank}">
          <span class="hybrid-rank-number">#${row.rank}</span>
          <span class="hybrid-document-id">${document.id}</span>
          <span class="hybrid-row-content">
            <span class="hybrid-row-title">${escapeHtml(document.title)}</span>
            <span class="hybrid-score-track"><span class="hybrid-score-fill"></span></span>
          </span>
          <span class="hybrid-score">${formatScore(row.score, method)}</span>
          ${movementLabel(row.rank, comparison.get(row.id))}
        </button>
      </li>`;
    }).join("")}
  </ol>`;
}

function denseLoadingText() {
  if (state.denseStatus === "error") {
    return "Semantic model unavailable";
  }
  return state.denseProgress || "Loading semantic model";
}

function calculateBm25Breakdown(documentId) {
  const queryTerms = [...new Set(tokenize(state.query))];
  const tokenizedDocuments = state.documents.map((document) => tokenize(`${document.title} ${document.text}`));
  const documentIndex = state.documents.findIndex((document) => document.id === documentId);
  const tokens = tokenizedDocuments[documentIndex] || [];
  const averageLength = tokenizedDocuments.reduce((sum, value) => sum + value.length, 0) / Math.max(tokenizedDocuments.length, 1);
  const termCounts = new Map();
  tokens.forEach((term) => termCounts.set(term, (termCounts.get(term) || 0) + 1));

  return queryTerms.map((term) => {
    const termFrequency = termCounts.get(term) || 0;
    const documentFrequency = tokenizedDocuments.filter((value) => value.includes(term)).length;
    const inverseDocumentFrequency = Math.log(1 + (state.documents.length - documentFrequency + 0.5) / (documentFrequency + 0.5));
    const lengthAdjustment = 1 - BM25_B + BM25_B * (tokens.length / Math.max(averageLength, 1));
    const contribution = termFrequency
      ? inverseDocumentFrequency * ((termFrequency * (BM25_K1 + 1)) / (termFrequency + BM25_K1 * lengthAdjustment))
      : 0;
    return { term, termFrequency, inverseDocumentFrequency, contribution };
  });
}

function renderTokenRow(tokens, matches, label) {
  return `<div class="hybrid-token-row">
    <span class="hybrid-token-label">${escapeHtml(label)}</span>
    <div>${tokens.map((token, index) => {
      const matchIndex = matches.indexOf(token);
      const matched = matchIndex >= 0;
      return `<span class="hybrid-token ${matched ? "is-match" : ""}" style="--token-order:${index};--match-order:${Math.max(matchIndex, 0)}">${escapeHtml(token)}</span>`;
    }).join("")}</div>
  </div>`;
}

function renderBm25Process(document) {
  const queryTokens = [...new Set(tokenize(state.query))];
  const documentTokens = tokenize(`${document.title} ${document.text}`).slice(0, 20);
  const matches = queryTokens.filter((term) => documentTokens.includes(term));
  const breakdown = calculateBm25Breakdown(document.id);
  const maximum = Math.max(...breakdown.map((item) => item.contribution), 0.001);
  const row = getRow(state.bm25, document.id);
  return `<section class="hybrid-process-card hybrid-sparse-process">
    <div class="hybrid-process-title"><span>1</span><div><small>Lexical path</small><strong>Match terms</strong></div><b>${formatScore(row?.score, "bm25")}</b></div>
    <div class="hybrid-token-stage">
      ${renderTokenRow(queryTokens, matches, "Query terms")}
      <div class="hybrid-match-beam" aria-hidden="true">${matches.map((term, index) => `<i style="--match-order:${index}">${escapeHtml(term)}</i>`).join("") || "<em>No exact terms cross this gap</em>"}</div>
      ${renderTokenRow(documentTokens, matches, `Document ${document.id}`)}
    </div>
    <div class="hybrid-term-contributions">
      ${breakdown.map((item) => `<div class="${item.contribution ? "is-active" : ""}">
        <span>${escapeHtml(item.term)}</span>
        <i><b style="width:${(item.contribution / maximum) * 100}%"></b></i>
        <code>${item.contribution.toFixed(2)}</code>
      </div>`).join("")}
    </div>
    <p>Exact matches contribute independently, then add up to the BM25 score.</p>
  </section>`;
}

function renderVector(values, label) {
  if (!values?.length) {
    return `<div class="hybrid-vector is-loading"><span class="hybrid-spinner" aria-hidden="true"></span>${escapeHtml(denseLoadingText())}</div>`;
  }
  const dimensions = values.slice(0, 32);
  return `<div class="hybrid-vector" aria-label="${escapeHtml(label)}">
    ${dimensions.map((value, index) => `<i class="${value < 0 ? "is-negative" : ""}" style="--vector-value:${Math.min(Math.abs(value) * 7, 1)};--vector-order:${index}"></i>`).join("")}
    <span>384 dimensions</span>
  </div>`;
}

function renderEncoderLane(label, text, vector) {
  const tokens = tokenize(text).slice(0, 6);
  return `<div class="hybrid-encoder-lane">
    <span class="hybrid-lane-label">${escapeHtml(label)}</span>
    <div class="hybrid-token-conveyor">${tokens.map((token, index) => `<i style="--token-order:${index}">${escapeHtml(token)}</i>`).join("")}</div>
    <span class="hybrid-flow-arrow" aria-hidden="true">→</span>
    <div class="hybrid-encoder-stack" aria-label="Transformer encoder"><i></i><i></i><i></i><b>Encoder</b></div>
    <span class="hybrid-flow-arrow" aria-hidden="true">→</span>
    <div class="hybrid-pooling">mean<br>pool</div>
    <span class="hybrid-flow-arrow" aria-hidden="true">→</span>
    ${renderVector(vector, `${label} embedding vector`)}
  </div>`;
}

function renderDenseProcess(document) {
  const row = getRow(state.dense, document.id);
  return `<section class="hybrid-process-card hybrid-dense-process">
    <div class="hybrid-process-title"><span>2</span><div><small>Semantic path</small><strong>Encode meaning</strong></div><b>${formatScore(row?.score, "dense")}</b></div>
    <div class="hybrid-embedding-stage">
      ${renderEncoderLane("Query", state.query, state.queryEmbedding)}
      ${renderEncoderLane(`Document ${document.id}`, `${document.title}. ${document.text}`, document.embedding)}
    </div>
    <div class="hybrid-cosine">
      <span>query vector</span>
      <i><b style="width:${Math.max(0, Math.min(1, row?.score || 0)) * 100}%"></b></i>
      <span>document vector</span>
      <strong>cosine ${formatScore(row?.score, "dense")}</strong>
    </div>
    <p>The same encoder maps both texts to vectors. Their angle becomes the dense score.</p>
  </section>`;
}

function renderProcessDocumentPicker(selected) {
  return `<div class="hybrid-process-picker" role="group" aria-label="Choose a document to inspect">
    <span>Inspect document</span>
    ${state.documents.map((document) => `<button type="button" class="hybrid-document-${document.id.toLowerCase()} ${selected === document.id ? "is-active" : ""}" data-document-action="${document.id}" aria-label="Inspect document ${document.id}: ${escapeHtml(document.title)}" aria-pressed="${selected === document.id}"><span class="hybrid-document-id">${document.id}</span></button>`).join("")}
  </div>`;
}

function renderQueryControl() {
  return `<div class="hybrid-query-panel">
    <label for="hybrid-query-input">Try a query</label>
    <div class="hybrid-query-row">
      <input id="hybrid-query-input" data-query-input type="search" value="${escapeHtml(state.query)}" autocomplete="off" spellcheck="false">
      <button type="button" data-query-reset>Reset</button>
    </div>
    <p class="hybrid-query-hint">The documents stay fixed while every retrieval method responds to your query.</p>
    <div class="hybrid-live-status" role="status" aria-live="polite">${escapeHtml(state.message)}</div>
  </div>`;
}

function renderDisagreement() {
  const selected = state.selectedDocument || "A";
  const document = getDocument(selected) || state.documents[0];
  return `${renderQueryControl()}
    <div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">The disagreement</span>
      <h3>Same query. Different evidence.</h3>
      <p>BM25 rewards matching terms. Dense retrieval can recover a semantic paraphrase.</p>
    </div>
    ${renderProcessDocumentPicker(selected)}
    <div class="hybrid-retriever-processes">
      ${renderBm25Process(document)}
      ${renderDenseProcess(document)}
    </div>
    <div class="hybrid-columns">
      <section class="hybrid-ranking-panel">
        <div class="hybrid-panel-label"><span>Lexical</span><strong>BM25</strong></div>
        ${renderRanking(state.bm25, "bm25", { label: "BM25 ranking" })}
      </section>
      <section class="hybrid-ranking-panel">
        <div class="hybrid-panel-label"><span>Semantic</span><strong>Dense</strong></div>
        ${renderRanking(state.dense, "dense", { label: "Dense ranking", loading: denseLoadingText() })}
      </section>
    </div>
    ${renderDetails()}`;
}

function renderWeighted() {
  const sparsePercent = Math.round(state.alpha * 100);
  const densePercent = 100 - sparsePercent;
  return `<div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">Weighted score fusion</span>
      <h3>Choose the balance of evidence</h3>
      <p>Each score list is min-max normalized before the two signals are combined.</p>
    </div>
    <div class="hybrid-control-panel">
      <div class="hybrid-weight-labels">
        <span><strong>${sparsePercent}%</strong> BM25</span>
        <span>Dense <strong>${densePercent}%</strong></span>
      </div>
      <input data-alpha-input type="range" min="0" max="100" value="${sparsePercent}" aria-label="BM25 weight in percent">
      <div class="hybrid-formula"><span>${(state.alpha).toFixed(2)} × sparse</span><b>+</b><span>${(1 - state.alpha).toFixed(2)} × dense</span></div>
    </div>
    <section class="hybrid-ranking-panel hybrid-ranking-panel-wide">
      <div class="hybrid-panel-label"><span>Normalized scores</span><strong>Hybrid</strong></div>
      ${renderRanking(state.weighted, "weighted", { label: "Weighted fusion ranking", compareWith: state.bm25, loading: denseLoadingText() })}
    </section>
    ${renderWeightedCalculation()}
    ${renderDetails()}`;
}

function renderWeightedCalculation() {
  const id = state.selectedDocument || "A";
  const sparse = scoreMap(normalizeScores(state.bm25));
  const semantic = scoreMap(normalizeScores(state.dense));
  const sparseScore = sparse.get(id);
  const semanticScore = semantic.get(id);
  if (!Number.isFinite(sparseScore) || !Number.isFinite(semanticScore)) {
    return "";
  }
  const hybridScore = state.alpha * sparseScore + (1 - state.alpha) * semanticScore;
  return `<div class="hybrid-calculation hybrid-document-${id.toLowerCase()}">
    <div><span class="hybrid-document-id">${id}</span><strong>Selected document calculation</strong></div>
    <dl>
      <div><dt>Normalized BM25</dt><dd>${sparseScore.toFixed(3)}</dd></div>
      <div><dt>Normalized dense</dt><dd>${semanticScore.toFixed(3)}</dd></div>
      <div><dt>α</dt><dd>${state.alpha.toFixed(2)}</dd></div>
      <div><dt>Hybrid</dt><dd>${hybridScore.toFixed(3)}</dd></div>
    </dl>
    <code>${state.alpha.toFixed(2)} × ${sparseScore.toFixed(3)} + ${(1 - state.alpha).toFixed(2)} × ${semanticScore.toFixed(3)} = ${hybridScore.toFixed(3)}</code>
  </div>`;
}

function renderRrf() {
  return `<div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">Reciprocal Rank Fusion</span>
      <h3>Keep the positions. Throw away the scores.</h3>
      <p>Each document contributes according to its place in both rankings.</p>
    </div>
    <div class="hybrid-rrf-layout">
      <div class="hybrid-source-ranks">
        <div><strong>BM25</strong>${renderCompactRanks(state.bm25)}</div>
        <div><strong>Dense</strong>${renderCompactRanks(state.dense)}</div>
      </div>
      <div class="hybrid-merge-arrow" aria-hidden="true"><span>rank positions</span><b>↓</b></div>
      <section class="hybrid-ranking-panel">
        <div class="hybrid-panel-label"><span>k = ${state.k}</span><strong>RRF</strong></div>
        ${renderRanking(state.rrf, "rrf", { label: "Reciprocal Rank Fusion ranking", compareWith: state.bm25, loading: denseLoadingText() })}
      </section>
    </div>
    <details class="hybrid-k-control">
      <summary>Advanced: adjust the rank constant <strong>k = ${state.k}</strong></summary>
      <label for="hybrid-k-input">Rank constant</label>
      <input id="hybrid-k-input" data-k-input type="range" min="1" max="100" value="${state.k}">
      <span>RRF normally uses k = 60. Smaller values reward the very top ranks more strongly.</span>
    </details>
    ${renderDetails()}`;
}

function renderCompactRanks(rows) {
  if (!rows.length) {
    return `<span class="hybrid-compact-empty">waiting</span>`;
  }
  return `<ol class="hybrid-compact-ranks">${rows.map((row) => `<li class="hybrid-document-${row.id.toLowerCase()}" data-doc-id="${row.id}"><span>#${row.rank}</span><b>${row.id}</b></li>`).join("")}</ol>`;
}

function sourceBadges(id) {
  const sparseIds = new Set(state.bm25.slice(0, 3).map((row) => row.id));
  const denseIds = new Set(state.dense.slice(0, 3).map((row) => row.id));
  return `${sparseIds.has(id) ? '<span class="hybrid-source-badge">BM25</span>' : ""}${denseIds.has(id) ? '<span class="hybrid-source-badge">Dense</span>' : ""}`;
}

function renderCandidatePool() {
  if (!state.dense.length) {
    return `<div class="hybrid-empty"><span class="hybrid-spinner" aria-hidden="true"></span>${escapeHtml(denseLoadingText())}</div>`;
  }
  return `<div class="hybrid-candidate-list">${candidateDocuments().map((document) => `<button type="button" class="hybrid-candidate hybrid-document-${document.id.toLowerCase()}" data-doc-id="${document.id}" data-document-action="${document.id}">
    <span class="hybrid-document-id">${document.id}</span>
    <span>${escapeHtml(document.title)}</span>
    <span class="hybrid-source-badges">${sourceBadges(document.id)}</span>
  </button>`).join("")}</div>`;
}

function rerankLoadingText() {
  if (state.rerankStatus === "error") {
    return "Reranker unavailable";
  }
  return state.rerankProgress || "Loading cross-encoder reranker";
}

function renderCrossEncoderProcess() {
  const candidates = candidateDocuments();
  const selected = candidates.find((document) => document.id === state.selectedDocument) || candidates[0];
  if (!selected) {
    return "";
  }
  const queryTokens = tokenize(state.query).slice(0, 6);
  const documentTokens = tokenize(`${selected.title} ${selected.text}`).slice(0, 8);
  const score = getRow(state.reranked, selected.id)?.score;
  return `<div class="hybrid-cross-encoder hybrid-document-${selected.id.toLowerCase()}">
    <div class="hybrid-pair-sequence">
      <span class="hybrid-sequence-label">one joint sequence</span>
      ${queryTokens.map((token, index) => `<i class="is-query" style="--token-order:${index}">${escapeHtml(token)}</i>`).join("")}
      <b>[SEP]</b>
      <span class="hybrid-document-id">${selected.id}</span>
      ${documentTokens.map((token, index) => `<i class="is-document" style="--token-order:${index}">${escapeHtml(token)}</i>`).join("")}
    </div>
    <span class="hybrid-flow-arrow" aria-hidden="true">→</span>
    <div class="hybrid-cross-stack"><i></i><i></i><i></i><strong>Cross-encoder</strong><small>query and document interact at every layer</small></div>
    <span class="hybrid-flow-arrow" aria-hidden="true">→</span>
    <div class="hybrid-relevance-score"><small>relevance</small><strong>${Number.isFinite(score) ? score.toFixed(2) : "…"}</strong></div>
  </div>`;
}

function renderReranking() {
  return `<div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">Retrieve, then rerank</span>
      <h3>Discovery first. Ordering second.</h3>
      <p>Both retrievers contribute candidates. A cross-encoder then reads each query-document pair.</p>
    </div>
    <div class="hybrid-pipeline" aria-label="Hybrid retrieval and reranking pipeline">
      <div class="hybrid-pipeline-sources"><span>BM25 · top 3</span><span>Dense · top 3</span></div>
      <div class="hybrid-pipeline-step">Union</div>
      <div class="hybrid-pipeline-step">Cross-encoder</div>
      <div class="hybrid-pipeline-step">Final order</div>
    </div>
    ${renderCrossEncoderProcess()}
    <div class="hybrid-rerank-layout">
      <section>
        <div class="hybrid-panel-label"><span>Candidate discovery</span><strong>Union</strong></div>
        ${renderCandidatePool()}
      </section>
      <div class="hybrid-rerank-arrow" aria-hidden="true">→</div>
      <section class="hybrid-ranking-panel">
        <div class="hybrid-panel-label"><span>Pairwise relevance</span><strong>Reranked</strong></div>
        ${renderRanking(state.reranked, "reranked", { label: "Cross-encoder reranked results", compareWith: state.weighted, loading: rerankLoadingText() })}
      </section>
    </div>
    ${renderDetails()}`;
}

function renderFollow() {
  const selected = state.selectedDocument || "C";
  return `<div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">Follow one document</span>
      <h3>One card. Five retrieval decisions.</h3>
      <p>Choose a document to trace its rank, evidence, and relevance through the complete system.</p>
    </div>
    <div class="hybrid-document-picker" role="group" aria-label="Choose a document to follow">
      ${state.documents.map((document) => `<button type="button" class="hybrid-document-${document.id.toLowerCase()} ${selected === document.id ? "is-active" : ""}" data-document-action="${document.id}" aria-pressed="${selected === document.id}"><span class="hybrid-document-id">${document.id}</span><span>${escapeHtml(document.title)}</span></button>`).join("")}
    </div>
    ${renderDetails(selected, true)}`;
}

function selectedRows() {
  const methods = {
    bm25: state.bm25,
    dense: state.dense,
    weighted: state.weighted,
    rrf: state.rrf,
    reranked: state.reranked
  };
  return methods[state.selectedMethod] || state.weighted;
}

function renderComparison() {
  const methods = [
    ["bm25", "BM25"],
    ["dense", "Dense"],
    ["weighted", "Weighted"],
    ["rrf", "RRF"],
    ["reranked", "Reranked"]
  ];
  return `<div class="hybrid-section-heading">
      <span class="hybrid-eyebrow">The complete journey</span>
      <h3>Watch the same documents move</h3>
      <p>Switch methods to see what each retrieval decision changes.</p>
    </div>
    <div class="hybrid-method-tabs" role="group" aria-label="Choose a retrieval method">
      ${methods.map(([id, label]) => `<button type="button" data-method="${id}" class="${state.selectedMethod === id ? "is-active" : ""}" aria-pressed="${state.selectedMethod === id}">${label}</button>`).join("")}
    </div>
    <section class="hybrid-ranking-panel hybrid-ranking-panel-wide">
      <div class="hybrid-panel-label"><span>Current method</span><strong>${escapeHtml(methods.find(([id]) => id === state.selectedMethod)?.[1] || "Weighted")}</strong></div>
      ${renderRanking(selectedRows(), state.selectedMethod, { label: `${state.selectedMethod} ranking`, compareWith: state.bm25, loading: state.selectedMethod === "reranked" ? rerankLoadingText() : denseLoadingText() })}
    </section>
    ${renderDetails()}`;
}

function documentExplanation(id) {
  const bm25 = getRow(state.bm25, id);
  const dense = getRow(state.dense, id);
  const reranked = getRow(state.reranked, id);
  if (!bm25 || !dense) {
    return "BM25 is ready. Semantic evidence will appear when the browser model finishes loading.";
  }
  if (dense.rank + 2 <= bm25.rank) {
    return "Low lexical overlap holds this document back in BM25, while semantic similarity lifts it in dense retrieval.";
  }
  if (bm25.rank + 2 <= dense.rank) {
    return "Exact query terms make this document strong for BM25, while dense retrieval finds it less distinctive.";
  }
  if (reranked && reranked.rank < Math.min(bm25.rank, dense.rank)) {
    return "The cross-encoder improves this document after reading the query and document together.";
  }
  return "Both retrievers find useful evidence here, so this document remains comparatively stable through fusion.";
}

function renderDetails(documentId = state.selectedDocument, alwaysShow = false) {
  if (!documentId && !alwaysShow) {
    return `<p class="hybrid-detail-prompt">Select any document card to inspect its full journey.</p>`;
  }
  const document = getDocument(documentId || "C");
  if (!document) {
    return "";
  }
  const methods = [
    ["BM25", state.bm25],
    ["Dense", state.dense],
    ["Weighted", state.weighted],
    ["RRF", state.rrf],
    ["Reranked", state.reranked]
  ];
  return `<aside class="hybrid-document-detail hybrid-document-${document.id.toLowerCase()}" aria-label="Document ${document.id} details">
    ${alwaysShow ? "" : '<button type="button" class="hybrid-detail-close" data-detail-close aria-label="Close document details">×</button>'}
    <div class="hybrid-detail-heading"><span class="hybrid-document-id">${document.id}</span><div><strong>${escapeHtml(document.title)}</strong><p>${escapeHtml(document.text)}</p></div></div>
    <div class="hybrid-relevance"><span>Canonical-query relevance</span><strong>${escapeHtml(document.relevance)}</strong></div>
    <div class="hybrid-history-flow">${methods.map(([label, rows], index) => {
      const row = getRow(rows, document.id);
      return `${index ? '<i aria-hidden="true">→</i>' : ""}<span><small>${label}</small><b>${row ? `#${row.rank}` : "—"}</b></span>`;
    }).join("")}</div>
    <p class="hybrid-why"><strong>Why did it move?</strong> ${escapeHtml(documentExplanation(document.id))}</p>
  </aside>`;
}

function renderRoot(root) {
  const mount = root.querySelector("[data-hybrid-mount]");
  if (!mount) {
    return;
  }
  const previousPositions = new Map(Array.from(root.querySelectorAll("[data-doc-id]")).map((element) => [element.dataset.docId, element.getBoundingClientRect()]));
  const view = root.dataset.hybridView;
  const renderers = {
    disagreement: renderDisagreement,
    weighted: renderWeighted,
    rrf: renderRrf,
    reranking: renderReranking,
    follow: renderFollow,
    comparison: renderComparison
  };
  mount.innerHTML = (renderers[view] || renderDisagreement)();
  animateRows(root, previousPositions);
}

function animateRows(root, previousPositions) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  root.querySelectorAll("[data-doc-id]").forEach((element) => {
    const previous = previousPositions.get(element.dataset.docId);
    if (!previous) {
      return;
    }
    const current = element.getBoundingClientRect();
    const deltaX = previous.left - current.left;
    const deltaY = previous.top - current.top;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return;
    }
    element.animate([
      { transform: `translate(${deltaX}px, ${deltaY}px)` },
      { transform: "translate(0, 0)" }
    ], {
      duration: 480,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    });
  });
}

function renderAll() {
  const active = document.activeElement;
  const preserveQuery = active?.matches?.("[data-query-input]");
  const selectionStart = preserveQuery ? active.selectionStart : null;
  const selectionEnd = preserveQuery ? active.selectionEnd : null;
  roots.forEach(renderRoot);
  if (preserveQuery) {
    const input = document.querySelector("[data-query-input]");
    if (input) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
  }
}

function scheduleQuery(query) {
  state.query = query.trim() || roots[0]?.dataset.defaultQuery || "";
  state.bm25 = sortScores(calculateBm25(state.query, state.documents));
  state.dense = [];
  state.queryEmbedding = null;
  state.weighted = [];
  state.rrf = [];
  state.reranked = [];
  state.rerankStatus = "idle";
  state.queryRevision += 1;
  const revision = state.queryRevision;
  state.message = "BM25 updated. Semantic retrieval is next.";
  renderAll();
  window.clearTimeout(queryTimer);
  queryTimer = window.setTimeout(() => calculateDenseForQuery(state.query, revision), 350);
}

function handleInput(event) {
  if (event.target.matches("[data-query-input]")) {
    scheduleQuery(event.target.value);
    return;
  }
  if (event.target.matches("[data-alpha-input]")) {
    state.alpha = Number(event.target.value) / 100;
    calculateWeighted();
    state.message = `Weighted fusion now uses ${event.target.value}% BM25 and ${100 - Number(event.target.value)}% dense retrieval.`;
    renderAll();
    return;
  }
  if (event.target.matches("[data-k-input]")) {
    state.k = Number(event.target.value);
    calculateRrf();
    state.message = `RRF rank constant set to ${state.k}.`;
    renderAll();
  }
}

function handleClick(event) {
  const documentButton = event.target.closest("[data-document-action]");
  if (documentButton) {
    state.selectedDocument = documentButton.dataset.documentAction;
    state.message = `Showing the journey of document ${state.selectedDocument}.`;
    renderAll();
    return;
  }
  if (event.target.closest("[data-detail-close]")) {
    state.selectedDocument = null;
    renderAll();
    return;
  }
  if (event.target.closest("[data-query-reset]")) {
    scheduleQuery(roots[0]?.dataset.defaultQuery || "");
    return;
  }
  const methodButton = event.target.closest("[data-method]");
  if (methodButton) {
    state.selectedMethod = methodButton.dataset.method;
    if (state.selectedMethod === "reranked" && state.rerankStatus === "idle") {
      calculateReranking();
    }
    state.message = `Showing the ${methodButton.textContent.trim()} ranking.`;
    renderAll();
  }
}

function observeReranker() {
  const targets = roots.filter((root) => ["reranking", "comparison"].includes(root.dataset.hybridView));
  if (!targets.length || state.rerankStatus !== "idle" || !state.dense.length) {
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      calculateReranking();
    }
  }, { rootMargin: "240px 0px", threshold: 0.01 });
  targets.forEach((target) => observer.observe(target));
}

async function initialize() {
  if (!roots.length) {
    return;
  }
  roots.forEach((root) => {
    root.addEventListener("input", handleInput);
    root.addEventListener("click", handleClick);
  });

  try {
    const response = await fetch(roots[0].dataset.corpusUrl);
    if (!response.ok) {
      throw new Error(`Corpus request failed with ${response.status}`);
    }
    const corpus = await response.json();
    state.documents = corpus.documents;
    state.embeddingModel = corpus.embeddingModel;
    state.rerankerModel = corpus.rerankerModel;
    state.query = corpus.canonicalQuery || state.query;
    state.bm25 = sortScores(calculateBm25(state.query, state.documents));
    state.message = "BM25 is ready. Loading semantic retrieval.";
    renderAll();
    state.queryRevision += 1;
    calculateDenseForQuery(state.query, state.queryRevision);
  } catch (error) {
    console.error("The hybrid retrieval corpus could not be loaded.", error);
    roots.forEach((root) => {
      const mount = root.querySelector("[data-hybrid-mount]");
      if (mount) {
        mount.innerHTML = `<p class="hybrid-error" role="alert">The retrieval demo could not load its document corpus.</p>`;
      }
    });
  }
}

window.HybridRetrievalMath = {
  tokenize,
  calculateBm25,
  normalizeScores,
  sortScores
};

initialize();
