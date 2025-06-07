---
title: "AI Dreams Up Databases: Can Hallucinations Solve SQL Chaos?"
date: 2025-04-14
draft: false
tags: ["text-to-sql", "llm", "hallucination", "retrieval", "crush4sql", "experiment", "database", "vector search"]
---

Talking to massive, complex databases in plain English? It's a dream for many, but it highlights a fundamental challenge: translating messy, ambiguous human thought into the rigid logic required by SQL. User questions carry intent and context, while databases demand precision. When databases swell to thousands of tables, simply feeding the entire structure to a Language Model (LLM) becomes impractical, making this translation even harder.

What if, instead of just translating keywords to code, the AI engaged in a more *linguistic* act, a kind of storytelling? A fascinating paper from EMNLP 2023, [CRUSH4SQL](https://aclanthology.org/2023.emnlp-main.868/) [1], explores such an approach. It tackles the scaling problem with a counter-intuitive twist: letting the LLM *dream* up a simplified schema—a metaphor spun from the query itself—to bridge the gap between fluid user questions and the database's complex reality.

## How the Dream Works: The CRUSH4SQL Method

The core idea behind CRUSH4SQL is pretty neat, turning hallucination—often seen as a bug—into a deliberate linguistic strategy, a form of guided dreaming:

1.  **Ask the LLM to Dream:**
    *   Given the user's question and a few examples (few-shot prompting), the LLM is asked to *imagine* and narrate the *simplest possible* database story (schema) that could answer it.
    *   Crucially, the LLM performs this task *without* accessing the actual database structure.
    *   **Example:**
        *   User Question: `"Count the number of members in the Bootup Baltimore Club older than 18"`
        *   LLM Hallucinates: `Club(Name, id, description, location), member_of_club(club id, student id), Student(id, age)`
    *   The AI crafts this fictional schema, a concise narrative of what the relevant data *might* look like.

{{< mermaid >}}
sequenceDiagram
    participant UQ as User Question
    participant LDS as Large Database Schema
    participant VH as Visual Highlighting
    participant EO as Explanation Overlay

    UQ->>LDS: Appears with text "Count members..."
    LDS-->>VH: Highlighting sweeps across schema
    VH-->>LDS: Difficulty pinpointing elements
    LDS-->>VH: Briefly dims/fades
    VH->>LDS: Highlights Relevant Subset: "club(...)", ...
    Note right of LDS: Text explains difficulty
    %% Explanation Overlay interaction needs clarification, using Note for now
    %% EO-->>LDS: Text appears explaining difficulty...
{{< /mermaid >}}

2.  **Use the Dream as a Map:** Take this "hallucinated" story—the schema—and turn its key elements (like `Club.Name`, `Student.age`) into [vector embeddings](https://www.elastic.co/what-is/vector-embedding), capturing their semantic essence.

{{< mermaid >}}
sequenceDiagram
    participant UQ as User Question
    participant LLM as Large Language Model
    participant HS as Hallucinated Schema
    participant EO as Explanation Overlay

    UQ->>LLM: Question "Count members..." is input
    LLM-->>HS: Generates: "Club(Name)", ...
    Note right of HS: Text explains LLM generates hypothetical schema
    %% EO-->>HS: Text explains LLM generates...
{{< /mermaid >}}

3.  **Find Matching Reality:** Use these dream-vectors as probes in a [vector similarity search](https://www.pinecone.io/learn/what-is-similarity-search/) against an index of your *real* database schema elements. The goal is to retrieve a small *subset* of actual tables and columns that best *collectively match* the structure the LLM dreamed up, using a specific objective function (detailed as Eqn. 6 in the paper) that balances coverage and schema graph connectivity within a budget B.

{{< mermaid >}}
graph TD
    A["Hallucinated Schema<br/>(Club.Name, member_of_club.id, ...)"] --> B{Iterate through Elements};
    B -- "For each element" --> C[Generate Embedding];
    C --> D[Dense Retrieval vs Actual Schema Embeddings];
    D --> E{Matches Found?};
    E -- Yes --> F[Highlight Matching Elements];
    F --> G[Form Candidate Set];
    E -- No --> B;
    G --> H[Explanation: Embeddings used for dense retrieval];
{{< /mermaid >}}

{{< figure src="/images/blog/crush4sql/image.png" caption="Figure 1 from Kothyari et al. (2023): Illustration of the CRUSH4SQL workflow, showing the prompt, hallucinated schema K(x), real schema D, collective objective, retrieved subset R(x), and downstream Text2SQL system." >}}

**Putting it Together:** The retrieved subset then enables the final step:

{{< mermaid >}}
graph TD
    A[Candidate Set] --> B{Evaluate Relevance & Connectivity};
    B -- "Score & Link Elements" --> C[Prioritize Relevant & Connected];
    C --> D["Final Subset<br/>(High Recall, Connected)"];
    D --> E[Explanation: Collective retrieval uses relationships];
{{< /mermaid >}}

In essence, the hallucinated schema acts as a linguistic bridge or a focused metaphor. It translates the user's potentially vague question into a simplified, hypothetical structure. This structure, born from the LLM's guided imagination (illustrated in Figure 1 above), provides a pragmatic map—even if not initially "true"—for navigating the complex reality of the actual data. It flips the script, harnessing the LLM's narrative tendency to find the right data needles in a giant haystack. (While the paper provides examples of retrieved schema elements, it's worth noting that visualizing the final generated SQL query would further clarify the end-to-end impact.)

## The Dream's Potential: What the Paper Reported

The CRUSH4SQL paper doesn't just propose a quirky idea; it demonstrates how this controlled dreaming yields significant results through its specific two-stage process:

*   **The Initial Dream (Hallucination):** First, the LLM acts like a rapid prototyper, dreaming up a minimal, idealized database schema based *only* on the user's question (guided by a few examples). This isn't random hallucination; it's a focused imaginative leap to capture the core structure needed, creating a semantic blueprint.
*   **Connecting Dream to Reality (Collective Retrieval):** Second, this dream-schema isn't the final answer, but a *guide*. Its elements become semantic probes used to collectively retrieve a small, relevant subset of the *actual* database schema. This retrieval aims to find real tables and columns that best "fulfill" the dream's structure, overcoming the challenge of feeding enormous, unwieldy schemas to downstream models.
*   **Testing Grounds for Big Dreams (New Benchmarks):** To prove this worked on truly complex data landscapes, the authors created new benchmarks with thousands of schema elements: **SpiderUnion** (4,502 elements), **BirdUnion** (798), and the real-world **SocialDB** (a massive 17,844 elements).

**Reported Performance Boosts:**

The core promise is that this dream-guided retrieval is more effective. On their new benchmarks, CRUSH4SQL significantly outperformed prior methods in recalling the necessary "gold" schema elements, especially when aiming for small, efficient schema subsets:

*   On **SpiderUnion**, the dream-guided approach recalled **83%** of needed columns (vs. 77% for the best alternative) with a budget of just ten columns.
*   On **BirdUnion**, it hit **76%** recall (vs. 56%) under similar constraints.
*   On the massive, real-world **SocialDB**, it recalled **58%** of the necessary *tables* (vs. 49%).

**Downstream Impact and Prompting:**

*   **Better Dreams, Better SQL:** This improved ability to find the right schema pieces reportedly led directly to more accurate SQL generation when the retrieved subset was passed to a Text-to-SQL model like RESDSQL.
*   **The Right Kind of Dream:** Crucially, experiments showed that prompting the LLM to specifically dream up a *schema* worked better than asking it to break down the question in other ways (like identifying variables or relations). The *structural* nature of the dream was key.

These compelling results, especially the measured improvements in finding the right data within vast schemas, painted a picture of AI's "dreams" as a potentially powerful tool. This striking potential motivated an attempt to replicate this linguistic strategy.

## An Experiment: Putting the Dream to the Test

Intrigued by the paper's findings, an experiment was conducted to try this dream-like approach. The baseline system took the user's query, embedded it directly using vectors, and searched for similar table embeddings in the schema index. This direct approach was then swapped with the CRUSH4SQL-inspired hallucination process.
image.png
Here's a look at the two approaches compared:

**1. Direct Query Embedding:** The user's query is directly converted into a vector to find relevant tables.

{{< d3-animation script="direct_retrieval_animation.js" title="Direct Query Embedding Approach" viewBoxWidth="900" >}}

<!-- {{< d3-animation script="example_animation.js" title="Example Anime.js Animation" viewBoxWidth="200" >}} -->

**2. Schema Hallucination:** The LLM first generates its *imagined*, potential schema from the query (guided by few-shot examples), and *that* schema is embedded to retrieve a relevant subset of real tables.

{{< d3-animation script="hallucination_retrieval_animation.js" title="Schema Hallucination Approach" viewBoxHeight="800" >}}

**The Setup:**

*   **Embedding Model:** `msmarco-distilbert-base-v4` (SentenceTransformer) for both query and schema/table embeddings.
*   **Hallucination Engine:** A locally hosted `llama3.1:latest` via Ollama, prompted with few-shot examples inspired by the original paper.
*   **Test Data:** First 50 examples from the [Spider 1.0](https://yale-lily.github.io/spider) dev set.
*   **Metrics:** Precision@5 and Recall@10.

## Waking Up: Unexpected Results

Connecting to the local LLM to generate the dreams was smooth, but the retrieval results? Not quite the dream that might be expected based on the paper.

```
--- Evaluation Summary (50 examples processed) ---
Average Metrics:
       Method  QueryID   DB_ID     P@1     P@3     P@5    R@5     R@10    R@20   CR@10   CR@20  ReciprocalRank
 Direct Query    24.50  107.22  0.4000  0.5533  0.5880 0.5880  0.7478  0.8740  0.5800  0.7600          0.5313
Hallucinated Schema    24.50  107.22  0.1400  0.2867  0.3240 0.3240  0.4489  0.5900  0.2800  0.4400          0.2295
```
*(Results from running dense_retrieval.py on first 50 dev examples)*

The straightforward, direct query embedding method actually performed much better in this setup than the schema hallucination approach inspired by CRUSH4SQL.

## Why the Disappointing Results? Verbose Dreams

A quick look at the LLM's output quickly revealed the likely culprit. The LLM was prompted to dream up a clean, minimal schema structure (like `Customer(id, name, address)`). Instead, the `llama3.1` instance provided the entire backstory of its imagined database, complete with lengthy narrative explanations:

```
# Example Hallucinated Output from llama3.1:latest for "find customer names and addresses"

Hallucinated Schema: Here is a minimal schema for a relational database that can answer the given natural language questions:

**Database Schema:**

```sql
CREATE TABLE Customer (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(255)
);
```

This schema has two tables:
* `Customer`: stores information about customers...
* `Instructor`: stores information about instructors...
...

Embedding this entire rambling explanation, complete with `CREATE TABLE` statements and descriptive paragraphs, likely muddied the waters. The resulting vector ended up representing the surrounding textual narrative more than the core schema structure needed for effective similarity search.

## Next Steps: Refining the Dream

This little experiment serves as a great reminder that a compelling theoretical idea like CRUSH4SQL needs careful implementation. Getting the LLM to dream *productively*—outputting just the concise, structural metaphor—is key. It also highlights a fascinating aspect of modern LLMs: their internal 'guesses' or 'dreams', even if not perfectly formed, *can* be useful tools for navigating complexity, but they need to be channeled correctly. The challenge lies in harnessing this mechanistic creativity: guiding the AI to provide the useful schema structure rather than the full, rambling story.

Where to go from here? Potential next steps for refining this dream-based approach include:

1.  **Better Prompting:** The prompts used in the paper (see examples in its Appendix) could be modified. Can prompts be crafted that more strictly enforce the desired output format (e.g., `Table(Col1, Col2)`) across different query types or LLMs? Experimenting with the number and style of in-context examples seems crucial.
2.  **Smarter Parsing:** The LLM output (even if prompted for structure) might still contain extra text. Developing robust parsing logic (e.g., using regular expressions or structured parsing libraries) to reliably extract *only* the schema definition (`t.c1` format elements) before embedding is essential for implementation.
3.  **Model Tinkering & Parameters:** Different LLMs might have different hallucination tendencies. Beyond model choice, adjusting generation parameters could be key. For instance, using a lower `temperature` (the paper mentions temp=0 for some experiments for reproducibility) might yield cleaner, more focused, and deterministic dreams.

It's all part of the fun (and sometimes frustration) of experimenting with LLMs. The potential of the dream-based approach remains intriguing, but unlocking it requires persistence and refinement. Further visualizations, like comparing effective vs. verbose hallucinations or mapping the embedding space, could also aid understanding.

## CRUSH4SQL in the Broader Landscape

It's helpful to place CRUSH4SQL in the context of other Text-to-SQL techniques:

*   **vs. Dense Passage Retrieval (DPR):** Unlike methods that directly retrieve schema elements or documentation based on the query embedding alone, CRUSH uses the *hallucinated schema* as an intermediate representation for retrieval probes.
*   **vs. Question Decomposition:** Some methods break the user question into sub-questions for retrieval. CRUSH differs by generating a holistic target *schema structure* first.
*   **vs. Fine-Tuning:** Approaches involving fine-tuning large models on specific schemas can be powerful but may require significant training data and struggle with adapting to new or rapidly changing databases. CRUSH, being retrieval-based, could potentially offer more adaptability.
*   **vs. Other Retrieval Augmentation:** Methods like MURRE explore multi-hop retrieval and iterative refinement. CRUSH offers a unique take by using hallucination to define the initial target for a collective retrieval step, rather than solely relying on iterative query-based steps.
*   **Relation to Chain-of-Thought (CoT):** While CRUSH doesn't explicitly generate a step-by-step reasoning chain like typical CoT prompting, the hallucination phase *implicitly* involves the LLM reasoning about the necessary schema structure. The subsequent collective retrieval step then acts upon this implicitly reasoned structure.

Understanding these distinctions highlights CRUSH4SQL's novel contribution: using controlled hallucination as a specific mechanism to guide schema subset retrieval for large databases.

## Conclusion: The Dream Needs Careful Guidance

Ultimately, the experiment served as a practical reality check on an exciting theoretical concept. While the idea of leveraging LLM hallucination as a linguistic bridge to navigate complex schemas remains compelling, the results highlight a critical bottleneck: **controlling the nature of the dream.** The CRUSH4SQL approach, as reported in the paper, hinges on the LLM generating a clean, concise, structural metaphor—not a verbose narrative.

The local Llama 3.1 model used in this specific setup acted more like an over-enthusiastic storyteller than a precise architect, drowning the useful signal (the dream schema) in noise (explanatory text). This doesn't invalidate the core CRUSH4SQL idea, but it underscores the crucial role of implementation details: prompt engineering, output parsing, and potentially model selection or fine-tuning are paramount.

Looking ahead, the path involves figuring out how to refine this process. Can the LLM be forced to dream more productively with stricter prompts? Can the essential structure be reliably extracted from its output? Or is a different kind of model needed altogether? Text-to-SQL over large databases remains a significant challenge. While harnessing AI's "dreams" offers a tantalizing path, it's clear that significant engineering and refinement are needed to turn those dreams into consistently reliable results.

## References

[1] Kothyari, Mayank, et al. "CRUSH4SQL: Collective Retrieval Using Schema Hallucination For Text2SQL." _Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing_. Association for Computational Linguistics, 2023. ([ACL Anthology](https://aclanthology.org/2023.emnlp-main.868/), [arXiv](https://arxiv.org/abs/2311.01173)) 