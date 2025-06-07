function renderCrushContrastDiagram(containerSelector, replayButtonSelector) {
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
    const panelWidth = width / 2;

    // --- Styles ---
    const boxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 };
    const highlightBoxStyle = { fill: "#e7f5ff", stroke: "#90c0de", strokeWidth: 1.5, rx: 4 };
    const collectiveHighlightStyle = { fill: "none", stroke: "#dc3545", strokeWidth: 2, rx: 6, strokeDasharray: "4 4" };
    const textStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const smallTextStyle = { fontSize: "10px", fill: "#495057", anchor: "middle", baseline: "middle" };
    const schemaTextStyle = { fontSize: "11px", fill: "#005073", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const arrowStyle = { stroke: "#6c757d", strokeWidth: 1.5, markerEnd: "url(#arrowhead-contrast)" };

    // --- Arrowhead Marker ---
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-contrast")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 5).attr("refY", 0).attr("orient", "auto")
      .attr("markerWidth", 5).attr("markerHeight", 5)
      .attr("xoverflow", "visible")
      .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", arrowStyle.stroke).style("stroke", "none");

    // --- Common Elements ---
    const queryText = "User Query";
    const actualSchemaLabel = "Actual Schema";
    const gridCols = 4;
    const gridRows = 3;
    const cellWidth = 35;
    const cellHeight = 18;
    const gridWidth = gridCols * cellWidth;
    const gridHeight = gridRows * cellHeight;

    // --- Panel 1: Standard Dense Retrieval ---
    const panel1 = svg.append("g").attr("transform", `translate(0, 0)`).attr("opacity", 0);
    const p1QueryPos = { x: panelWidth * 0.5, y: height * 0.15 };
    const p1SchemaPos = { x: panelWidth * 0.5, y: height * 0.65 };

    panel1.append("text").attr("x", panelWidth * 0.5).attr("y", height * 0.05).text("Standard Dense Retrieval").attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("font-weight", "bold");

    // Query
    panel1.append("rect").attr("x", p1QueryPos.x - 50).attr("y", p1QueryPos.y - 15).attr("width", 100).attr("height", 30).style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).attr("rx", boxStyle.rx);
    panel1.append("text").attr("x", p1QueryPos.x).attr("y", p1QueryPos.y).text(queryText).attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

    // Actual Schema
    const p1SchemaGroup = panel1.append("g").attr("transform", `translate(${p1SchemaPos.x}, ${p1SchemaPos.y})`);
    p1SchemaGroup.append("rect").attr("x", -gridWidth / 2 - 10).attr("y", -gridHeight / 2 - 25).attr("width", gridWidth + 20).attr("height", gridHeight + 40).style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).attr("rx", boxStyle.rx);
    p1SchemaGroup.append("text").attr("y", -gridHeight / 2 - 10).text(actualSchemaLabel).attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);
    const p1GridData = d3.range(gridCols * gridRows).map(i => ({ col: i % gridCols, row: Math.floor(i / gridCols), id: i }));
    const p1RetrievedIndices = [1, 5, 9]; // Example individual retrievals
    const p1Cells = p1SchemaGroup.selectAll(".schema-cell").data(p1GridData).join("rect")
        .attr("class", "schema-cell")
        .attr("x", d => (d.col * cellWidth) - gridWidth / 2).attr("y", d => (d.row * cellHeight) - gridHeight / 2)
        .attr("width", cellWidth - 2).attr("height", cellHeight - 2)
        .style("fill", d => p1RetrievedIndices.includes(d.id) ? highlightBoxStyle.fill : "#fff")
        .style("stroke", d => p1RetrievedIndices.includes(d.id) ? highlightBoxStyle.stroke : boxStyle.stroke)
        .style("stroke-width", 1).attr("rx", 2);

    // Arrows (Query -> Individual Cells)
    p1RetrievedIndices.forEach(index => {
        const cellNode = p1Cells.filter(d => d.id === index).node();
        if (cellNode) {
            const bbox = cellNode.getBBox();
            panel1.append("line")
                .attr("x1", p1QueryPos.x).attr("y1", p1QueryPos.y + 15)
                .attr("x2", p1SchemaPos.x + bbox.x + bbox.width / 2).attr("y2", p1SchemaPos.y + bbox.y)
                .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);
        }
    });
    panel1.append("text").attr("x", p1QueryPos.x).attr("y", height * 0.9).text("Ranks individual elements").attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill);

    // --- Panel 2: CRUSH Collective Retrieval ---
    const panel2 = svg.append("g").attr("transform", `translate(${panelWidth}, 0)`).attr("opacity", 0);
    const p2QueryPos = { x: panelWidth * 0.5, y: height * 0.15 };
    const p2HallucinatedPos = { x: panelWidth * 0.5, y: height * 0.4 };
    const p2SchemaPos = { x: panelWidth * 0.5, y: height * 0.75 };

    panel2.append("text").attr("x", panelWidth * 0.5).attr("y", height * 0.05).text("CRUSH Collective Retrieval").attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("font-weight", "bold");

    // Query
    panel2.append("rect").attr("x", p2QueryPos.x - 50).attr("y", p2QueryPos.y - 15).attr("width", 100).attr("height", 30).style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).attr("rx", boxStyle.rx);
    panel2.append("text").attr("x", p2QueryPos.x).attr("y", p2QueryPos.y).text(queryText).attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

    // Hallucinated Schema (Intermediate)
    const p2HallGroup = panel2.append("g").attr("transform", `translate(${p2HallucinatedPos.x}, ${p2HallucinatedPos.y})`);
    p2HallGroup.append("rect").attr("x", -60).attr("y", -25).attr("width", 120).attr("height", 50).style("fill", highlightBoxStyle.fill).style("stroke", highlightBoxStyle.stroke).attr("rx", highlightBoxStyle.rx);
    p2HallGroup.append("text").attr("y", -8).text("Hallucinated").attr("text-anchor", textStyle.anchor).style("font-size", "9px").style("fill", textStyle.fill);
    p2HallGroup.append("text").attr("y", 8).text("Schema (Probe)").attr("text-anchor", textStyle.anchor).style("font-size", "9px").style("fill", textStyle.fill);

    // Actual Schema
    const p2SchemaGroup = panel2.append("g").attr("transform", `translate(${p2SchemaPos.x}, ${p2SchemaPos.y})`);
    p2SchemaGroup.append("rect").attr("x", -gridWidth / 2 - 10).attr("y", -gridHeight / 2 - 25).attr("width", gridWidth + 20).attr("height", gridHeight + 40).style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).attr("rx", boxStyle.rx);
    p2SchemaGroup.append("text").attr("y", -gridHeight / 2 - 10).text(actualSchemaLabel).attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);
    const p2GridData = d3.range(gridCols * gridRows).map(i => ({ col: i % gridCols, row: Math.floor(i / gridCols), id: i }));
    const p2RetrievedIndices = [1, 5, 6]; // Example collective set
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    p2SchemaGroup.selectAll(".schema-cell").data(p2GridData).join("rect")
        .attr("class", "schema-cell")
        .attr("x", d => (d.col * cellWidth) - gridWidth / 2).attr("y", d => (d.row * cellHeight) - gridHeight / 2)
        .attr("width", cellWidth - 2).attr("height", cellHeight - 2)
        .style("fill", d => p2RetrievedIndices.includes(d.id) ? highlightBoxStyle.fill : "#fff")
        .style("stroke", d => p2RetrievedIndices.includes(d.id) ? highlightBoxStyle.stroke : boxStyle.stroke)
        .style("stroke-width", 1).attr("rx", 2)
        .each(function(d) {
            if (p2RetrievedIndices.includes(d.id)) {
                const x = (d.col * cellWidth) - gridWidth / 2;
                const y = (d.row * cellHeight) - gridHeight / 2;
                if (x < minX) minX = x;
                if (x + cellWidth - 2 > maxX) maxX = x + cellWidth - 2;
                if (y < minY) minY = y;
                if (y + cellHeight - 2 > maxY) maxY = y + cellHeight - 2;
            }
        });

    // Collective Highlight Box
    const collectiveBox = p2SchemaGroup.append("rect")
        .attr("x", minX - 4).attr("y", minY - 4)
        .attr("width", maxX - minX + 8).attr("height", maxY - minY + 8)
        .style("fill", collectiveHighlightStyle.fill).style("stroke", collectiveHighlightStyle.stroke)
        .style("stroke-width", collectiveHighlightStyle.strokeWidth).style("stroke-dasharray", collectiveHighlightStyle.strokeDasharray)
        .attr("rx", collectiveHighlightStyle.rx).attr("opacity", 1); // Keep visible

    // Arrows
    panel2.append("line") // Query -> Hallucinated
        .attr("x1", p2QueryPos.x).attr("y1", p2QueryPos.y + 15)
        .attr("x2", p2HallucinatedPos.x).attr("y2", p2HallucinatedPos.y - 25)
        .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);
    panel2.append("line") // Hallucinated -> Collective Box
        .attr("x1", p2HallucinatedPos.x).attr("y1", p2HallucinatedPos.y + 25)
        .attr("x2", p2SchemaPos.x).attr("y2", p2SchemaPos.y + minY - 4) // Point to top edge of collective box
        .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);

    panel2.append("text").attr("x", panelWidth * 0.5).attr("y", height * 0.9).text("Ranks collective sets").attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill);

    // Divider
    svg.append("line")
        .attr("x1", panelWidth).attr("y1", height * 0.02)
        .attr("x2", panelWidth).attr("y2", height * 0.95)
        .style("stroke", "#ced4da").style("stroke-width", 1).style("stroke-dasharray", "4 4");

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeOutExpo',
        duration: 800
    });

    tl.add({ targets: panel1.node(), opacity: 1, delay: 100 })
      .add({ targets: panel2.node(), opacity: 1, delay: 100 }, '-=500'); // Show panels near simultaneously

    // Replay
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushContrastDiagram(containerSelector, replayButtonSelector);
    }
} 