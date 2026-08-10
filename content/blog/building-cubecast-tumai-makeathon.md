---
title: "Building Cubecast at the TUM.ai Makeathon"
date: 2026-04-19
description: "How our team built a supply-chain disruption copilot for the Spherecast challenge at the TUM.ai Makeathon 2026."
image: "/images/tumai-makeathon/cubecast.webp"
draft: false
tags: ["AI", "hackathon", "supply chain", "LLM", "knowledge graphs", "TUM.ai"]
---

I had a great time at the [TUM.ai Makeathon 2026](https://makeathon.tum-ai.com/) working on the [Spherecast](https://spherecast.ai/) ([YC S24](https://www.ycombinator.com/companies/spherecast)) challenge.

## The challenge

The challenge focused on disruption analysis for consumer packaged goods sourcing. Supplier delays can propagate through raw materials, products, and sourcing plans, making it difficult to understand the impact and evaluate alternatives quickly.

## What we built

Our team built **Cubecast**, a copilot for supply-chain disruption analysis. It:

1. ingests a supplier delay email;
2. extracts the disruption signal with an LLM;
3. links it to supplier and product entities using a cognee knowledge graph and SQLite data;
4. identifies the affected raw material;
5. simulates the disruption; and
6. suggests alternative suppliers and rerouting options.

<img src="/images/tumai-makeathon/cubecast.webp" alt="Cubecast graph view showing a supplier disruption and its effect on a raw material" width="900" height="960" loading="lazy" decoding="async">

## Result

We placed **6th out of approximately 45 teams** in the Spherecast challenge.

Many thanks to [TUM.ai](https://tum-ai.com/) for organizing the event and to [Spherecast](https://spherecast.ai/) for the challenge. I also want to thank my teammates **Demyan Kurbatov, Anton Komar, and Vranda Agarwal** for an intense and rewarding weekend of building.

Cubecast also connected closely with my broader interest in [retrieval over structured data](/research/#trl-lab).

<div class="post-image-grid">
  <figure>
    <img src="/images/tumai-makeathon/team.webp" alt="The Cubecast team outside the TUM.ai Makeathon venue" width="576" height="1024" loading="lazy" decoding="async">
    <figcaption>The Cubecast team</figcaption>
  </figure>
  <figure>
    <img src="/images/tumai-makeathon/venue.webp" alt="Opening presentation at the TUM.ai Makeathon 2026" width="768" height="1024" loading="lazy" decoding="async">
    <figcaption>TUM.ai Makeathon 2026</figcaption>
  </figure>
</div>
