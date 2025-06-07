function renderCrushVsR2d2Animation(containerSelector, replayButtonSelector) {
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

    // --- Shared Positions & Config ---
    const boxWidth = 180;
    const boxHeight = 40;
    const smallBoxHeight = 30;
    const llmWidth = 120;
    const verticalGap = 20;
    const arrowLength = 15;
    const sectionGap = 60; // Gap between CRUSH and R2D2 sections
    let currentY = 20;

    const styles = {
        label: { fontSize: "11px", fill: "#666", anchor: "middle" },
        stepLabel: { fontSize: "12px", fill: "#005073", anchor: "middle", weight: "normal", style: "italic" },
        titleLabel: { fontSize: "14px", fill: "#000", anchor: "middle", weight: "bold" },
        box: { fill: "#e0f7fa", stroke: "#00796b", strokeWidth: 1.5 }, // Query
        llmBox: { fill: "#ffecb3", stroke: "#ffa000", strokeWidth: 1.5 },
        hallucinationBox: { fill: "#ffebee", stroke: "#d32f2f", strokeWidth: 1.5, strokeDasharray: "4,2" }, // Dashed for imagined
        probeText: { fontSize: "12px", fill: "#d32f2f", anchor: "middle" },
        realDbBox: { fill: "#e8f5e9", stroke: "#2e7d32", strokeWidth: 1.5 },
        crushOutputBox: { fill: "#c8e6c9", stroke: "#1b5e20", strokeWidth: 2 },
        r2d2Box: { fill: "#e1f5fe", stroke: "#0277bd", strokeWidth: 1.5 }, // R2D2 specific color
        tileBox: { fill: "#fff", stroke: "#0277bd", strokeWidth: 1, strokeDasharray: "2,2" },
        retrievedTileBox: { fill: "#b3e5fc", stroke: "#0277bd", strokeWidth: 1.5 },
        constructedDbBox: { fill: "#a7ffeb", stroke: "#00695c", strokeWidth: 2 },
        arrow: { stroke: "#333", strokeWidth: 1.5, markerEnd: "url(#arrowhead-comp)" },
        retrievalArrow: { stroke: "#7b1fa2", strokeWidth: 1.5, markerEnd: "url(#arrowhead-comp)", strokeDasharray: "4,4" },
        text: { fontSize: "13px", fontWeight: "normal", fill: "#333", anchor: "middle" }
    };

    // --- SVG Definitions ---
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead-comp")
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
    for (let i = 0; i <= 15; i++) { // More steps needed
        t[i] = 250 + i * 450; // Slightly faster pace
    }
    const dur = 350;

    // --- Helper Functions (assuming similar structure to previous) ---
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
            .attr("dy", "0.35em") // Vertical centering
            .style("font-size", styles.text.fontSize)
            .style("font-weight", style.text.fontWeight)
            .style("fill", style.text.fill)
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
               .style("font-style", styles.stepLabel.style)
               .text(label);
       }
        return group;
    }

    // --- Animation Sequence ---

    // == Part 1: CRUSH4SQL Visualization ==
    const crushTitle = svg.append("text")
        .attr("x", centerX).attr("y", currentY)
        .attr("text-anchor", "middle").style("font-size", styles.titleLabel.fontSize).style("font-weight", styles.titleLabel.weight)
        .text("CRUSH4SQL Approach")
        .attr("opacity", 0);
    crushTitle.transition().duration(dur).delay(t[0]).attr("opacity", 1);
    currentY += 30;

    // 1. Question
    const questionPos = { x: centerX, y: currentY + boxHeight / 2 };
    const queryGroup = svg.append("g").attr("opacity", 0);
    drawBox(queryGroup, questionPos, boxWidth, boxHeight, styles.box, "NL Question");
    queryGroup.transition().duration(dur).delay(t[1]).attr("opacity", 1);
    currentY += boxHeight + verticalGap + arrowLength;

    // 2. LLM
    const llmPos = { x: centerX, y: currentY + boxHeight / 2 };
    const llmGroup = svg.append("g").attr("opacity", 0);
    drawArrow(llmGroup, { x: questionPos.x, y: questionPos.y + boxHeight / 2 }, { x: llmPos.x, y: llmPos.y - boxHeight / 2 }, styles.arrow, "Prompt", 10);
    drawBox(llmGroup, llmPos, llmWidth, boxHeight, styles.llmBox, "LLM");
    llmGroup.transition().duration(dur).delay(t[2]).attr("opacity", 1);
    currentY += boxHeight + verticalGap + arrowLength;

    // 3. Hallucinated Schema
    const hallucSchemaPos = { x: centerX, y: currentY + boxHeight / 2 };
    const hallucGroup = svg.append("g").attr("opacity", 0);
    drawArrow(hallucGroup, { x: llmPos.x, y: llmPos.y + boxHeight / 2 }, { x: hallucSchemaPos.x, y: hallucSchemaPos.y - boxHeight / 2 }, styles.arrow, "Generate", 10);
    drawBox(hallucGroup, hallucSchemaPos, boxWidth + 20, boxHeight, styles.hallucinationBox, "Hallucinated Schema");
    hallucGroup.transition().duration(dur).delay(t[3]).attr("opacity", 1);
    currentY += boxHeight + verticalGap + arrowLength;

    // 4. Probes & Retrieval
    const probesY = currentY + 5;
    const probesGroup = svg.append("g").attr("opacity", 0);
    probesGroup.append("text").attr("x", centerX).attr("y", probesY)
               .attr("text-anchor", "middle").style("font-size", styles.probeText.fontSize).style("fill", styles.probeText.fill)
               .text("probe1, probe2, ...");
    drawArrow(probesGroup, {x: hallucSchemaPos.x, y: hallucSchemaPos.y + boxHeight / 2}, {x: centerX, y: probesY - 10}, styles.arrow, "Use as Probes", 10);
    probesGroup.transition().duration(dur).delay(t[4]).attr("opacity", 1);
    currentY = probesY + 20 + arrowLength;

    // 5. Real DB Schema & Retrieval
    const realDbPosCrush = { x: centerX, y: currentY + 30 }; // Slightly lower
    const realDbGroupCrush = svg.append("g").attr("opacity", 0);
    drawBox(realDbGroupCrush, realDbPosCrush, boxWidth + 40, 60, styles.realDbBox, "Actual DB Schema");
    drawArrow(realDbGroupCrush, { x: centerX, y: probesY + 10 }, { x: realDbPosCrush.x, y: realDbPosCrush.y - 30 }, styles.retrievalArrow, "Dense Retrieval", 10);
    realDbGroupCrush.transition().duration(dur).delay(t[5]).attr("opacity", 1);
    currentY += 60 + verticalGap + arrowLength;

    // 6. CRUSH Output
    const crushOutputPos = { x: centerX, y: currentY + smallBoxHeight / 2 };
    const crushOutputGroup = svg.append("g").attr("opacity", 0);
    drawArrow(crushOutputGroup, {x: realDbPosCrush.x, y: realDbPosCrush.y + 30}, {x: crushOutputPos.x, y: crushOutputPos.y - smallBoxHeight/2}, styles.arrow);
    drawBox(crushOutputGroup, crushOutputPos, boxWidth, smallBoxHeight, styles.crushOutputBox, "Relevant Schema Subset");
    crushOutputGroup.transition().duration(dur).delay(t[6]).attr("opacity", 1);
    currentY += smallBoxHeight + sectionGap; // Add gap before R2D2

    // == Part 2: R2D2 Visualization ==
    const r2d2Title = svg.append("text")
        .attr("x", centerX).attr("y", currentY)
        .attr("text-anchor", "middle").style("font-size", styles.titleLabel.fontSize).style("font-weight", styles.titleLabel.weight)
        .text("R2D2 Approach")
        .attr("opacity", 0);
    r2d2Title.transition().duration(dur).delay(t[7]).attr("opacity", 1);
    currentY += 30;

    // 7. Question (reuse position concept, slightly adjusted Y)
    const questionPosR2D2 = { x: centerX, y: currentY + boxHeight / 2 };
    const queryGroupR2D2 = svg.append("g").attr("opacity", 0);
    drawBox(queryGroupR2D2, questionPosR2D2, boxWidth, boxHeight, styles.box, "NL Question");
    queryGroupR2D2.transition().duration(dur).delay(t[8]).attr("opacity", 1);
    currentY += boxHeight + verticalGap + arrowLength;

    // 8. Data Lake & Slicing
    const dataLakePos = { x: centerX, y: currentY + 50 }; // Make it taller
    const dataLakeGroup = svg.append("g").attr("opacity", 0);
    drawBox(dataLakeGroup, dataLakePos, boxWidth + 60, 100, styles.r2d2Box, "Data Lake (Tables)");
    // Indicate slicing visually (simple grid inside)
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            dataLakeGroup.append("rect")
                .attr("x", dataLakePos.x - (boxWidth + 60) / 2 + 5 + j * 50)
                .attr("y", dataLakePos.y - 100 / 2 + 5 + i * 30)
                .attr("width", 45)
                .attr("height", 25)
                .style("fill", styles.tileBox.fill)
                .style("stroke", styles.tileBox.stroke)
                .style("stroke-dasharray", styles.tileBox.strokeDasharray)
                .style("stroke-width", styles.tileBox.strokeWidth);
        }
    }
    drawArrow(dataLakeGroup, {x: questionPosR2D2.x, y: questionPosR2D2.y + boxHeight/2}, {x: dataLakePos.x, y: dataLakePos.y - 50}, styles.arrow, "Info Need", 10);
    dataLakeGroup.transition().duration(dur).delay(t[9]).attr("opacity", 1);
    // Add slicing label after box appears
    const slicingLabel = svg.append("text")
        .attr("x", centerX).attr("y", dataLakePos.y + 50 + 15)
        .attr("text-anchor", "middle").style("font-size", styles.stepLabel.fontSize).style("fill", styles.stepLabel.fill)
        .text("Tables Sliced into Tiles")
        .attr("opacity", 0);
    slicingLabel.transition().duration(dur).delay(t[10]).attr("opacity", 1);
    currentY += 100 + verticalGap + arrowLength;

    // 9. Tile Retrieval
    const retrievedTilesPos = { x: centerX, y: currentY + smallBoxHeight / 2 };
    const retrievedTilesGroup = svg.append("g").attr("opacity", 0);
    // Show a few representative retrieved tiles
    drawBox(retrievedTilesGroup, {x: retrievedTilesPos.x - 50, y: retrievedTilesPos.y}, 45, 25, styles.retrievedTileBox, "Tile");
    drawBox(retrievedTilesGroup, {x: retrievedTilesPos.x + 0, y: retrievedTilesPos.y}, 45, 25, styles.retrievedTileBox, "Tile");
    drawBox(retrievedTilesGroup, {x: retrievedTilesPos.x + 50, y: retrievedTilesPos.y}, 45, 25, styles.retrievedTileBox, "Tile");
    drawArrow(retrievedTilesGroup, {x: dataLakePos.x, y: dataLakePos.y + 50}, {x: retrievedTilesPos.x, y: retrievedTilesPos.y - smallBoxHeight / 2}, styles.retrievalArrow, "Retrieve Relevant Tiles", 10);
    retrievedTilesGroup.transition().duration(dur).delay(t[11]).attr("opacity", 1);
    currentY += smallBoxHeight + verticalGap + arrowLength;

    // 10. Structured Result Construction
    const constructedDbPos = { x: centerX, y: currentY + 30 }; // Make it slightly larger
    const constructedDbGroup = svg.append("g").attr("opacity", 0);
    drawArrow(constructedDbGroup, {x: retrievedTilesPos.x, y: retrievedTilesPos.y + smallBoxHeight / 2}, {x: constructedDbPos.x, y: constructedDbPos.y - 30}, styles.arrow, "Construct Structured Result", 10);
    drawBox(constructedDbGroup, constructedDbPos, boxWidth, 60, styles.constructedDbBox, "Structured Result (DB)");
    // Maybe add a small link icon inside to suggest relationships
    constructedDbGroup.append("text").attr("x", constructedDbPos.x).attr("y", constructedDbPos.y + 5).attr("font-family", "monospace").text("<-->");
    constructedDbGroup.transition().duration(dur).delay(t[12]).attr("opacity", 1);

    // Replay Logic
    const replayButton = d3.select(replayButtonSelector);
    if (!replayButton.empty()) {
        replayButton.on("click", null);
        replayButton.on("click", () => renderCrushVsR2d2Animation(containerSelector, replayButtonSelector));
    } else {
        console.warn("Replay button not found:", replayButtonSelector);
    }
} 