function renderCrush4sqlStepsAnimation(containerSelector, replayButtonSelector) {
    if (typeof d3 === 'undefined') {
        console.error("D3 library is not loaded. Cannot render animation for:", containerSelector);
        const container = document.querySelector(containerSelector);
        if (container) {
            container.innerHTML = `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='red'>Error: D3 library not loaded.</text>`;
        }
        return;
    }

    const svg = d3.select(containerSelector);
    if (svg.empty()) {
        console.error("Container element not found:", containerSelector);
        return;
    }

    svg.selectAll("*").remove(); // Clear previous elements

    const viewBox = svg.attr("viewBox").split(" ").map(Number);
    const width = viewBox[2];
    const height = viewBox[3];

    // --- Positions & Configuration ---
    const boxSize = { width: 140, height: 40 };
    const smallBoxSize = { width: 100, height: 35 }; // For LLM & Embeddings
    const dbSize = { width: 180, height: 80 }; // For Real DB
    const arrowSpace = 25;
    const verticalSpace = 50;

    const row1Y = 60;
    const queryPos = { x: 80, y: row1Y };
    const llmPos = { x: queryPos.x + boxSize.width / 2 + arrowSpace + smallBoxSize.width / 2, y: row1Y };
    const dreamSchemaPos = { x: llmPos.x + smallBoxSize.width / 2 + arrowSpace + boxSize.width / 2, y: row1Y };
    const dreamEmbedPos = { x: dreamSchemaPos.x + boxSize.width / 2 + arrowSpace + smallBoxSize.width / 2, y: row1Y };

    const row2Y = row1Y + verticalSpace + dbSize.height / 2 + 20;
    const realDbPos = { x: width / 2, y: row2Y }; // Centered horizontally

    const styles = {
        label: { fontSize: "12px", fill: "#555", anchor: "middle" },
        stepLabel: { fontSize: "14px", fill: "#005073", anchor: "middle", weight: "bold" },
        box: { fill: "#e0f7fa", stroke: "#00796b", strokeWidth: 1.5 }, // Query
        llmBox: { fill: "#ffecb3", stroke: "#ffa000", strokeWidth: 1.5 },
        dreamSchemaBox: { fill: "#ffebee", stroke: "#d32f2f", strokeWidth: 1.5, strokeDasharray: "4,2" }, // Dashed for imagined
        dreamEmbedBox: { fill: "#d1c4e9", stroke: "#512da8", strokeWidth: 1.5 },
        realDbBox: { fill: "#e8f5e9", stroke: "#2e7d32", strokeWidth: 1.5 },
        realDbSubsetBox: { fill: "#c8e6c9", stroke: "#1b5e20", strokeWidth: 2 },
        arrow: { stroke: "#333", strokeWidth: 2, markerEnd: "url(#arrowhead-crush)" },
        text: { fontSize: "13px", fontWeight: "bold", fill: "#333", anchor: "middle" },
        similarityLine: { stroke: "#7b1fa2", strokeDasharray: "5,5", opacity: 0.8 },
        highlighted: { stroke: "#c2185b", strokeWidth: 3 }
    };

    // --- SVG Definitions ---
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead-crush")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#333");

    // --- Animation Functions (reuse) ---
    const t0=250, t1=750, t2=1500, t3=2250, t4=3000, t5=3750, t6=4500;
    const dur = 600;

    function drawBox(group, pos, size, style, text) {
        group.append("rect")
            .attr("x", pos.x - size.width / 2)
            .attr("y", pos.y - size.height / 2)
            .attr("width", size.width)
            .attr("height", size.height)
            .attr("rx", 3)
            .style("fill", style.fill)
            .style("stroke", style.stroke)
            .style("stroke-width", style.strokeWidth)
            .style("stroke-dasharray", style.strokeDasharray || "none");
        group.append("text")
            .attr("x", pos.x)
            .attr("y", pos.y)
            .attr("dy", "0.35em")
            .style("font-size", styles.text.fontSize)
            .style("font-weight", styles.text.fontWeight)
            .style("fill", styles.text.fill)
            .attr("text-anchor", styles.text.anchor)
            .text(text);
        return group;
    }

    function drawArrow(group, startPos, endPos, style) {
        group.append("line")
            .attr("x1", startPos.x)
            .attr("y1", startPos.y)
            .attr("x2", endPos.x)
            .attr("y2", endPos.y)
            .style("stroke", style.stroke)
            .style("stroke-width", style.strokeWidth)
            .attr("marker-end", style.markerEnd);
        return group;
    }

    function showStepLabel(text, x, y, delay) {
        svg.append("text")
            .attr("class", "step-label")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", styles.stepLabel.anchor)
            .style("font-size", styles.stepLabel.fontSize)
            .style("fill", styles.stepLabel.fill)
            .style("font-weight", styles.stepLabel.weight)
            .text(text)
            .attr("opacity", 0)
            .transition().duration(dur).delay(delay)
            .attr("opacity", 1);
    }

    // --- Animation Sequence ---

    // Step 1: Query -> LLM -> Dream Schema
    const queryGroup = svg.append("g").attr("class", "query-group").attr("opacity", 0);
    drawBox(queryGroup, queryPos, boxSize, styles.box, "User Query");
    queryGroup.transition().duration(dur).delay(t0).attr("opacity", 1);

    const llmGroup = svg.append("g").attr("class", "llm-group").attr("opacity", 0);
    drawArrow(llmGroup, { x: queryPos.x + boxSize.width / 2, y: queryPos.y }, { x: llmPos.x - smallBoxSize.width / 2, y: llmPos.y }, styles.arrow);
    drawBox(llmGroup, llmPos, smallBoxSize, styles.llmBox, "LLM");
    llmGroup.transition().duration(dur).delay(t1).attr("opacity", 1);
    showStepLabel("Ask LLM", (queryPos.x + llmPos.x) / 2 , queryPos.y + boxSize.height / 2 + 10, t1);

    const dreamSchemaGroup = svg.append("g").attr("class", "dream-schema-group").attr("opacity", 0);
    drawArrow(dreamSchemaGroup, { x: llmPos.x + smallBoxSize.width / 2, y: llmPos.y }, { x: dreamSchemaPos.x - boxSize.width / 2, y: dreamSchemaPos.y }, styles.arrow);
    drawBox(dreamSchemaGroup, dreamSchemaPos, boxSize, styles.dreamSchemaBox, "Dream Schema");
    dreamSchemaGroup.transition().duration(dur).delay(t2).attr("opacity", 1);
    showStepLabel("Generate Hallucination", (llmPos.x + dreamSchemaPos.x) / 2, llmPos.y + boxSize.height / 2 + 10, t2);

    // Step 2: Dream Schema -> Embeddings
    const dreamEmbedGroup = svg.append("g").attr("class", "dream-embed-group").attr("opacity", 0);
    drawArrow(dreamEmbedGroup, { x: dreamSchemaPos.x + boxSize.width / 2, y: dreamSchemaPos.y }, { x: dreamEmbedPos.x - smallBoxSize.width / 2, y: dreamEmbedPos.y }, styles.arrow);
    drawBox(dreamEmbedGroup, dreamEmbedPos, smallBoxSize, styles.dreamEmbedBox, "[#,#,#]"); // Simple vector viz
    dreamEmbedGroup.transition().duration(dur).delay(t3).attr("opacity", 1);
    showStepLabel("Embed Dream", (dreamSchemaPos.x + dreamEmbedPos.x) / 2, dreamSchemaPos.y + boxSize.height / 2 + 10, t3);

    // Step 3a: Show Real DB Index
    const realDbGroup = svg.append("g").attr("class", "real-db-group").attr("opacity", 0);
    // Draw a larger box representing the whole DB index
    const dbRect = drawBox(realDbGroup, realDbPos, dbSize, styles.realDbBox, "Real DB Index");
    // Add some simple inner shapes to suggest complexity
    realDbGroup.append("rect")
        .attr("x", realDbPos.x - dbSize.width / 2 + 10)
        .attr("y", realDbPos.y - dbSize.height / 2 + 10)
        .attr("width", dbSize.width / 2 - 15)
        .attr("height", dbSize.height - 20)
        .style("fill", "white")
        .style("stroke", styles.realDbBox.stroke)
        .style("stroke-width", 1);
    realDbGroup.append("rect")
        .attr("x", realDbPos.x + 5)
        .attr("y", realDbPos.y - dbSize.height / 2 + 10)
        .attr("width", dbSize.width / 2 - 15)
        .attr("height", dbSize.height / 2 - 15)
        .style("fill", "white")
        .style("stroke", styles.realDbBox.stroke)
        .style("stroke-width", 1);
     realDbGroup.append("rect")
        .attr("x", realDbPos.x + 5)
        .attr("y", realDbPos.y + 5)
        .attr("width", dbSize.width / 2 - 15)
        .attr("height", dbSize.height / 2 - 15)
        .style("fill", "white")
        .style("stroke", styles.realDbBox.stroke)
        .style("stroke-width", 1);

    realDbGroup.transition().duration(dur).delay(t4).attr("opacity", 1);

    // Step 3b: Similarity Search (Lines)
    const searchLinesGroup = svg.append("g").attr("class", "search-lines").attr("opacity", 0);
    searchLinesGroup.append("line")
        .attr("x1", dreamEmbedPos.x)
        .attr("y1", dreamEmbedPos.y + smallBoxSize.height / 2)
        .attr("x2", realDbPos.x - dbSize.width / 4) // Point towards DB
        .attr("y2", realDbPos.y - dbSize.height / 4)
        .style("stroke", styles.similarityLine.stroke)
        .style("stroke-dasharray", styles.similarityLine.strokeDasharray)
        .style("stroke-width", 2);
    searchLinesGroup.append("line")
        .attr("x1", dreamEmbedPos.x)
        .attr("y1", dreamEmbedPos.y + smallBoxSize.height / 2)
        .attr("x2", realDbPos.x + dbSize.width / 4)
        .attr("y2", realDbPos.y + dbSize.height / 4)
        .style("stroke", styles.similarityLine.stroke)
        .style("stroke-dasharray", styles.similarityLine.strokeDasharray)
        .style("stroke-width", 2);
    searchLinesGroup.transition().duration(dur).delay(t5).attr("opacity", styles.similarityLine.opacity);
    showStepLabel("Vector Search", width / 2, realDbPos.y - dbSize.height / 2 - 15, t5);

    // Step 3c: Highlight Subset
    const subsetHighlight = realDbGroup.append("rect")
        .attr("id", "highlighted-subset") // Give it an ID for potential reuse/selection
        .attr("x", realDbPos.x - dbSize.width / 2 + 10) // Target the first inner rect area
        .attr("y", realDbPos.y - dbSize.height / 2 + 10)
        .attr("width", dbSize.width / 2 - 15)
        .attr("height", dbSize.height - 20)
        .style("fill", "none")
        .style("stroke", styles.highlighted.stroke)
        .style("stroke-width", 0) // Start invisible
        .attr("opacity", 0);

    subsetHighlight.transition().duration(dur).delay(t6)
        .style("stroke-width", styles.highlighted.strokeWidth)
        .attr("opacity", 1);
    showStepLabel("Relevant Subset Retrieved", width / 2, realDbPos.y + dbSize.height / 2 + 20, t6);

    // Replay Logic
    const replayButton = d3.select(replayButtonSelector);
    if (!replayButton.empty()) {
        replayButton.on("click", null);
        replayButton.on("click", () => renderCrush4sqlStepsAnimation(containerSelector, replayButtonSelector));
    } else {
        console.warn("Replay button not found:", replayButtonSelector);
    }
} 