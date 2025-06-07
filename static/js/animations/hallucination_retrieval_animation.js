function renderHallucinationRetrievalAnimation(containerSelector, replayButtonSelector) {
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
    const centerX = width / 2;

    // --- Positions & Configuration (Top-to-Bottom Flow) ---
    const boxWidth = 200;
    const boxHeight = 45;
    const smallBoxHeight = 35;
    const llmWidth = 150;
    const verticalGap = 25;
    const arrowLength = 20;
    let currentY = 25;

    const questionPos = { x: centerX, y: currentY + boxHeight / 2 };
    currentY += boxHeight + verticalGap + arrowLength;
    const llmPos = { x: centerX, y: currentY + boxHeight / 2 };
    currentY += boxHeight + verticalGap + arrowLength;
    const hallucSchemaPos = { x: centerX, y: currentY + boxHeight / 2 };
    currentY += boxHeight + verticalGap + arrowLength;
    const probesY = currentY + 15; // Y position for probe text
    currentY = probesY + 30 + arrowLength; // Space for probes and arrow
    const realDbPos = { x: centerX, y: currentY + boxHeight }; // Larger box for DB
    const dbWidth = 300;
    const dbHeight = 100;
    currentY += dbHeight + verticalGap + arrowLength;
    const candidatePos = { x: centerX, y: currentY + boxHeight / 2 };
    currentY += boxHeight + verticalGap + arrowLength;
    const finalSubsetPos = { x: centerX, y: currentY + smallBoxHeight / 2 };

    const styles = {
        label: { fontSize: "11px", fill: "#666", anchor: "middle" },
        stepLabel: { fontSize: "12px", fill: "#005073", anchor: "middle", weight: "normal", style: "italic" },
        box: { fill: "#e0f7fa", stroke: "#00796b", strokeWidth: 1.5 }, // Query
        llmBox: { fill: "#ffecb3", stroke: "#ffa000", strokeWidth: 1.5 },
        hallucinationBox: { fill: "#ffebee", stroke: "#d32f2f", strokeWidth: 1.5, strokeDasharray: "4,2" }, // Dashed for imagined
        probeText: { fontSize: "12px", fill: "#d32f2f", anchor: "middle" },
        realDbBox: { fill: "#e8f5e9", stroke: "#2e7d32", strokeWidth: 1.5 },
        candidateBox: { fill: "#dcedc8", stroke: "#558b2f", strokeWidth: 1.5 },
        finalSubsetBox: { fill: "#c8e6c9", stroke: "#1b5e20", strokeWidth: 2 },
        arrow: { stroke: "#333", strokeWidth: 1.5, markerEnd: "url(#arrowhead-halluc)" },
        retrievalArrow: { stroke: "#7b1fa2", strokeWidth: 1.5, markerEnd: "url(#arrowhead-halluc)", strokeDasharray: "4,4" },
        text: { fontSize: "13px", fontWeight: "bold", fill: "#333", anchor: "middle" }
    };

    // --- SVG Definitions ---
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead-halluc")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#333");

    // --- Animation Timings ---
    const t = [];
    for (let i = 0; i <= 10; i++) { // Define timings for multiple steps
        t[i] = 250 + i * 500;
    }
    const dur = 400;

    // --- Helper Functions ---
    function drawBox(group, pos, width, height, style, text) {
        group.append("rect")
            .attr("x", pos.x - width / 2)
            .attr("y", pos.y - height / 2)
            .attr("width", width)
            .attr("height", height)
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

    function drawArrow(group, startPos, endPos, style, label = "", labelYOffset = 15) {
        group.append("line")
            .attr("x1", startPos.x)
            .attr("y1", startPos.y)
            .attr("x2", endPos.x)
            .attr("y2", endPos.y)
            .style("stroke", style.stroke)
            .style("stroke-width", style.strokeWidth)
            .style("stroke-dasharray", style.strokeDasharray || "none")
            .attr("marker-end", style.markerEnd);

        if (label) {
             group.append("text")
                .attr("x", (startPos.x + endPos.x) / 2)
                .attr("y", endPos.y - labelYOffset)
                .attr("text-anchor", styles.stepLabel.anchor)
                .style("font-size", styles.stepLabel.fontSize)
                .style("fill", styles.stepLabel.fill)
                .style("font-weight", styles.stepLabel.weight)
                .style("font-style", styles.stepLabel.style)
                .text(label);
        }
        return group;
    }

    // --- Animation Sequence ---

    // 1. Show Question
    const queryGroup = svg.append("g").attr("opacity", 0);
    drawBox(queryGroup, questionPos, boxWidth, boxHeight, styles.box, "Natural Language Question");
    queryGroup.transition().duration(dur).delay(t[0]).attr("opacity", 1);

    // 2. Arrow to LLM + LLM Box
    const llmGroup = svg.append("g").attr("opacity", 0);
    drawArrow(llmGroup, { x: questionPos.x, y: questionPos.y + boxHeight / 2 }, { x: llmPos.x, y: llmPos.y - boxHeight / 2 }, styles.arrow, "Prompt with Examples", 10);
    drawBox(llmGroup, llmPos, llmWidth, boxHeight, styles.llmBox, "LLM (Few-Shot)");
    llmGroup.transition().duration(dur).delay(t[1]).attr("opacity", 1);

    // 3. Arrow to Hallucinated Schema + Box
    const hallucGroup = svg.append("g").attr("opacity", 0);
    drawArrow(hallucGroup, { x: llmPos.x, y: llmPos.y + boxHeight / 2 }, { x: hallucSchemaPos.x, y: hallucSchemaPos.y - boxHeight / 2 }, styles.arrow, "Generate Hallucination", 10);
    drawBox(hallucGroup, hallucSchemaPos, boxWidth + 20, boxHeight, styles.hallucinationBox, "Hallucinated Minimal Schema");
    hallucGroup.transition().duration(dur).delay(t[2]).attr("opacity", 1);

    // 4. Show Probes
    const probesGroup = svg.append("g").attr("opacity", 0);
    drawArrow(probesGroup, { x: hallucSchemaPos.x, y: hallucSchemaPos.y + boxHeight / 2 }, { x: hallucSchemaPos.x, y: probesY - 10 }, styles.arrow, "Extract Probes", 10);
    probesGroup.append("text")
        .attr("x", hallucSchemaPos.x - 60).attr("y", probesY).attr("text-anchor", "end")
        .style("font-size", styles.probeText.fontSize).style("fill", styles.probeText.fill).text("club.name");
    probesGroup.append("text")
        .attr("x", hallucSchemaPos.x).attr("y", probesY).attr("text-anchor", "middle")
        .style("font-size", styles.probeText.fontSize).style("fill", styles.probeText.fill).text("member.club_id");
    probesGroup.append("text")
        .attr("x", hallucSchemaPos.x + 60).attr("y", probesY).attr("text-anchor", "start")
        .style("font-size", styles.probeText.fontSize).style("fill", styles.probeText.fill).text("student.age");
    probesGroup.transition().duration(dur).delay(t[3]).attr("opacity", 1);

    // 5. Show Real DB Index
    const realDbGroup = svg.append("g").attr("opacity", 0);
    drawBox(realDbGroup, realDbPos, dbWidth, dbHeight, styles.realDbBox, "Actual DB Schema Index");
     // Add simple inner shapes
    realDbGroup.append("rect")
        .attr("x", realDbPos.x - dbWidth/2 + 10).attr("y", realDbPos.y - dbHeight/2 + 10)
        .attr("width", dbWidth/3 - 15).attr("height", dbHeight - 20).style("fill", "#fff").style("stroke", "#ccc");
    realDbGroup.append("rect")
        .attr("x", realDbPos.x - dbWidth/6 + 5).attr("y", realDbPos.y - dbHeight/2 + 10)
        .attr("width", dbWidth/3 - 15).attr("height", dbHeight - 20).style("fill", "#fff").style("stroke", "#ccc");
     realDbGroup.append("rect")
        .attr("x", realDbPos.x + dbWidth/6 + 5).attr("y", realDbPos.y - dbHeight/2 + 10)
        .attr("width", dbWidth/3 - 15).attr("height", dbHeight - 20).style("fill", "#fff").style("stroke", "#ccc");
    realDbGroup.transition().duration(dur).delay(t[4]).attr("opacity", 1);

    // 6. Retrieval Arrows
    const retrievalGroup = svg.append("g").attr("opacity", 0);
    drawArrow(retrievalGroup, { x: hallucSchemaPos.x - 50, y: probesY + 10 }, { x: realDbPos.x - dbWidth / 4, y: realDbPos.y - dbHeight / 2 }, styles.retrievalArrow);
    drawArrow(retrievalGroup, { x: hallucSchemaPos.x, y: probesY + 10 }, { x: realDbPos.x, y: realDbPos.y - dbHeight / 2 }, styles.retrievalArrow);
    drawArrow(retrievalGroup, { x: hallucSchemaPos.x + 50, y: probesY + 10 }, { x: realDbPos.x + dbWidth / 4, y: realDbPos.y - dbHeight / 2 }, styles.retrievalArrow);
    retrievalGroup.append("text")
        .attr("x", centerX).attr("y", realDbPos.y - dbHeight/2 - 10).text("Dense Retrieval").attr("text-anchor", "middle")
        .style("font-size", styles.stepLabel.fontSize).style("fill", styles.stepLabel.fill).style("font-style", styles.stepLabel.style);
    retrievalGroup.transition().duration(dur).delay(t[5]).attr("opacity", 1);

    // 7. Show Candidate Subset Highlight
    const candidateHighlight = realDbGroup.append("rect")
        .attr("x", realDbPos.x - dbWidth/6 + 5)
        .attr("y", realDbPos.y - dbHeight/2 + 10)
        .attr("width", dbWidth/3 - 15)
        .attr("height", dbHeight - 20)
        .style("fill", "none")
        .style("stroke", styles.candidateBox.stroke)
        .style("stroke-width", 0)
        .attr("opacity", 0);
    candidateHighlight.transition().duration(dur).delay(t[6])
        .style("stroke-width", 3)
        .attr("opacity", 1);
    // Add label for candidates retrieved
     svg.append("text")
        .attr("class", "step-label")
        .attr("x", centerX)
        .attr("y", realDbPos.y + dbHeight / 2 + 15)
        .attr("text-anchor", styles.stepLabel.anchor)
        .style("font-size", styles.stepLabel.fontSize)
        .style("fill", styles.stepLabel.fill)
        .style("font-weight", styles.stepLabel.weight)
        .text("Candidate Elements Retrieved")
        .attr("opacity", 0)
        .transition().duration(dur).delay(t[6])
        .attr("opacity", 1);

    // 8. Arrow to Final Subset Box + Box
    const finalSubsetGroup = svg.append("g").attr("opacity", 0);
    drawArrow(finalSubsetGroup, { x: realDbPos.x, y: realDbPos.y + dbHeight / 2 }, { x: finalSubsetPos.x, y: finalSubsetPos.y - smallBoxHeight / 2 }, styles.arrow, "(Optional: Collective Optimization)", 10);
    drawBox(finalSubsetGroup, finalSubsetPos, boxWidth, smallBoxHeight, styles.finalSubsetBox, "Relevant Real Schema Subset");
    finalSubsetGroup.transition().duration(dur).delay(t[7]).attr("opacity", 1);

    // Replay Logic
    const replayButton = d3.select(replayButtonSelector);
    if (!replayButton.empty()) {
        replayButton.on("click", null);
        replayButton.on("click", () => renderHallucinationRetrievalAnimation(containerSelector, replayButtonSelector));
    } else {
        console.warn("Replay button not found:", replayButtonSelector);
    }
} 