function renderCrushCollectiveEmphasis(containerSelector, replayButtonSelector) {
    if (typeof d3 === 'undefined' || typeof anime === 'undefined') {
      console.error("D3 or anime.js not loaded for:", containerSelector);
      const container = document.querySelector(containerSelector);
      if (container) container.innerHTML = `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='red'>Error: Lib not loaded.</text>`;
      return;
    }
  
    const svg = d3.select(containerSelector);
    svg.selectAll("*").remove(); 
  
    const viewBox = svg.attr("viewBox").split(" ").map(Number);
    const width = viewBox[2];
    const height = viewBox[3];
  
    // --- Styles ---
    const boxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 };
    const highlightBoxStyle = { fill: "#e7f5ff", stroke: "#90c0de", strokeWidth: 1.5, rx: 4 };
    const collectiveHighlightStyle = { fill: "none", stroke: "#dc3545", strokeWidth: 2, rx: 6, strokeDasharray: "4 4" }; // Dashed red highlight
    const textStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const smallTextStyle = { fontSize: "10px", fill: "#495057", anchor: "middle", baseline: "middle" };
    const schemaTextStyle = { fontSize: "11px", fill: "#005073", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const arrowStyle = { stroke: "#6c757d", strokeWidth: 1.5, markerEnd: "url(#arrowhead-collective)" };

    // --- Layout Positions ---
    const hallucinatedSchemaPos = { x: width * 0.25, y: height * 0.5 };
    const actualSchemaPos = { x: width * 0.75, y: height * 0.5 };

    // --- Arrowhead Marker ---
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-collective")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 5).attr("refY", 0).attr("orient", "auto")
      .attr("markerWidth", 5).attr("markerHeight", 5)
      .attr("xoverflow", "visible")
      .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", arrowStyle.stroke).style("stroke", "none");

    // --- Elements ---
    const animGroup = svg.append("g").attr("opacity", 0);

    // Hallucinated Schema
    const hallSchemaGroup = animGroup.append("g").attr("transform", `translate(${hallucinatedSchemaPos.x}, ${hallucinatedSchemaPos.y})`);
    hallSchemaGroup.append("rect")
        .attr("x", -70).attr("y", -30).attr("width", 140).attr("height", 60)
        .style("fill", highlightBoxStyle.fill).style("stroke", highlightBoxStyle.stroke).style("stroke-width", highlightBoxStyle.strokeWidth).attr("rx", highlightBoxStyle.rx);
    hallSchemaGroup.append("text").attr("y", -15).text("Hallucinated Schema").attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);
    hallSchemaGroup.append("text").attr("y", 5).text("TableA(col1, col2)") .style("font-family", schemaTextStyle.fontFam).attr("text-anchor", schemaTextStyle.anchor).style("font-size", schemaTextStyle.fontSize).style("fill", schemaTextStyle.fill).attr("dominant-baseline", schemaTextStyle.baseline);
    hallSchemaGroup.append("text").attr("y", 20).text("TableB(col3)") .style("font-family", schemaTextStyle.fontFam).attr("text-anchor", schemaTextStyle.anchor).style("font-size", schemaTextStyle.fontSize).style("fill", schemaTextStyle.fill).attr("dominant-baseline", schemaTextStyle.baseline);

    // Actual Schema Representation (Complex Grid)
    const actualSchemaGroup = animGroup.append("g").attr("transform", `translate(${actualSchemaPos.x}, ${actualSchemaPos.y})`);
    const gridCols = 5;
    const gridRows = 4;
    const cellWidth = 40;
    const cellHeight = 20;
    const gridWidth = gridCols * cellWidth;
    const gridHeight = gridRows * cellHeight;

    actualSchemaGroup.append("rect")
        .attr("x", -gridWidth / 2 - 10).attr("y", -gridHeight / 2 - 25)
        .attr("width", gridWidth + 20).attr("height", gridHeight + 40)
        .style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).style("stroke-width", boxStyle.strokeWidth).attr("rx", boxStyle.rx);
    actualSchemaGroup.append("text").attr("y", -gridHeight / 2 - 10).text("Actual Schema")
        .attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

    const gridData = d3.range(gridCols * gridRows).map(i => ({
        col: i % gridCols,
        row: Math.floor(i / gridCols),
        id: i
    }));

    const retrievedIndices = [1, 6, 7, 12]; // Example indices forming a "collective" subset
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    actualSchemaGroup.selectAll(".schema-cell")
        .data(gridData)
        .join("rect")
        .attr("class", "schema-cell")
        .attr("x", d => (d.col * cellWidth) - gridWidth / 2)
        .attr("y", d => (d.row * cellHeight) - gridHeight / 2)
        .attr("width", cellWidth - 2)
        .attr("height", cellHeight - 2)
        .style("fill", d => retrievedIndices.includes(d.id) ? highlightBoxStyle.fill : "#fff")
        .style("stroke", d => retrievedIndices.includes(d.id) ? highlightBoxStyle.stroke : boxStyle.stroke)
        .style("stroke-width", d => retrievedIndices.includes(d.id) ? 1 : 0.5)
        .attr("rx", 2)
        .each(function(d) { // Calculate bounds of the highlighted cells
            if (retrievedIndices.includes(d.id)) {
                const x = (d.col * cellWidth) - gridWidth / 2;
                const y = (d.row * cellHeight) - gridHeight / 2;
                if (x < minX) minX = x;
                if (x + cellWidth - 2 > maxX) maxX = x + cellWidth - 2;
                if (y < minY) minY = y;
                if (y + cellHeight - 2 > maxY) maxY = y + cellHeight - 2;
            }
        });

    // Collective Highlight (appears later)
    const collectiveBox = actualSchemaGroup.append("rect")
        .attr("x", minX - 5)
        .attr("y", minY - 5)
        .attr("width", maxX - minX + 10)
        .attr("height", maxY - minY + 10)
        .style("fill", collectiveHighlightStyle.fill)
        .style("stroke", collectiveHighlightStyle.stroke)
        .style("stroke-width", collectiveHighlightStyle.strokeWidth)
        .style("stroke-dasharray", collectiveHighlightStyle.strokeDasharray)
        .attr("rx", collectiveHighlightStyle.rx)
        .attr("opacity", 0);

    // Arrow (Hallucinated -> Collective Subset)
    animGroup.append("line")
        .attr("x1", hallucinatedSchemaPos.x + 70)
        .attr("y1", hallucinatedSchemaPos.y)
        .attr("x2", actualSchemaPos.x + minX - 5) // Point to the collective box edge
        .attr("y2", actualSchemaPos.y)
        .style("stroke", arrowStyle.stroke)
        .style("stroke-width", arrowStyle.strokeWidth)
        .attr("marker-end", arrowStyle.markerEnd);
    animGroup.append("text")
        .attr("x", (hallucinatedSchemaPos.x + actualSchemaPos.x) / 2)
        .attr("y", actualSchemaPos.y - 15)
        .text("Collective Retrieval")
        .attr("text-anchor", textStyle.anchor)
        .style("font-size", smallTextStyle.fontSize)
        .style("fill", arrowStyle.stroke);

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 800
    });

    tl.add({ targets: animGroup.node(), opacity: 1, delay: 100 })
      .add({ targets: collectiveBox.node(), opacity: 1, duration: 500 }, '+=300');

    // Replay
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushCollectiveEmphasis(containerSelector, replayButtonSelector);
    }
} 