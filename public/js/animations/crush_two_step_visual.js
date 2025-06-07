function renderCrushTwoStepVisual(containerSelector, replayButtonSelector) {
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
  const llmIconStyle = { fill: "#fff", stroke: "#adb5bd", strokeWidth: 1.5, radius: 25 };
  const textStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
  const smallTextStyle = { fontSize: "10px", fill: "#495057", anchor: "middle", baseline: "middle" };
  const schemaTextStyle = { fontSize: "11px", fill: "#005073", anchor: "middle", baseline: "middle", fontFam: "monospace" };
  const arrowStyle = { stroke: "#6c757d", strokeWidth: 1.5, markerEnd: "url(#arrowhead)" };

  // --- Layout Positions ---
  const questionPos = { x: width * 0.2, y: height * 0.15 };
  const llmPos = { x: width * 0.2, y: height * 0.4 };
  const hallucinatedSchemaPos = { x: width * 0.2, y: height * 0.75 };
  const actualSchemaPos = { x: width * 0.7, y: height * 0.5 };

  // --- Arrowhead Marker ---
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", arrowStyle.stroke)
    .style("stroke", "none");

  // --- Elements ---
  // Step 1 Group
  const step1Group = svg.append("g").attr("opacity", 0);

  // Question
  step1Group.append("rect")
    .attr("x", questionPos.x - 60).attr("y", questionPos.y - 20)
    .attr("width", 120).attr("height", 40)
    .style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).style("stroke-width", boxStyle.strokeWidth).attr("rx", boxStyle.rx);
  step1Group.append("text")
    .attr("x", questionPos.x).attr("y", questionPos.y)
    .text("User Question")
    .attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

  // LLM Icon (Simplified Brain/Gears)
  const llmGroup = step1Group.append("g").attr("transform", `translate(${llmPos.x}, ${llmPos.y})`);
  llmGroup.append("circle").attr("r", llmIconStyle.radius).style("fill", llmIconStyle.fill).style("stroke", llmIconStyle.stroke).style("stroke-width", llmIconStyle.strokeWidth);
  // Simple gears
  llmGroup.append("circle").attr("r", llmIconStyle.radius * 0.4).attr("cx", -5).attr("cy", -5).style("fill", "none").style("stroke", llmIconStyle.stroke).style("stroke-width", 1).style("stroke-dasharray", "2 2");
  llmGroup.append("circle").attr("r", llmIconStyle.radius * 0.3).attr("cx", 8).attr("cy", 8).style("fill", "none").style("stroke", llmIconStyle.stroke).style("stroke-width", 1).style("stroke-dasharray", "2 2");
  llmGroup.append("text").attr("y", 3).text("LLM").attr("text-anchor", textStyle.anchor).style("font-size", "10px").style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

  // Hallucinated Schema
  const hallSchemaGroup = step1Group.append("g").attr("transform", `translate(${hallucinatedSchemaPos.x}, ${hallucinatedSchemaPos.y})`);
  hallSchemaGroup.append("rect")
    .attr("x", -70).attr("y", -30)
    .attr("width", 140).attr("height", 60)
    .style("fill", highlightBoxStyle.fill).style("stroke", highlightBoxStyle.stroke).style("stroke-width", highlightBoxStyle.strokeWidth).attr("rx", highlightBoxStyle.rx);
  hallSchemaGroup.append("text").attr("y", -15).text("Hallucinated Schema").attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);
  hallSchemaGroup.append("text").attr("y", 5).text("TableA(col1, col2)") .style("font-family", schemaTextStyle.fontFam).attr("text-anchor", schemaTextStyle.anchor).style("font-size", schemaTextStyle.fontSize).style("fill", schemaTextStyle.fill).attr("dominant-baseline", schemaTextStyle.baseline);
  hallSchemaGroup.append("text").attr("y", 20).text("TableB(col3)") .style("font-family", schemaTextStyle.fontFam).attr("text-anchor", schemaTextStyle.anchor).style("font-size", schemaTextStyle.fontSize).style("fill", schemaTextStyle.fill).attr("dominant-baseline", schemaTextStyle.baseline);

  // Arrows for Step 1
  step1Group.append("line") // Question -> LLM
    .attr("x1", questionPos.x).attr("y1", questionPos.y + 20)
    .attr("x2", llmPos.x).attr("y2", llmPos.y - llmIconStyle.radius)
    .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);
  step1Group.append("line") // LLM -> Hallucinated Schema
    .attr("x1", llmPos.x).attr("y1", llmPos.y + llmIconStyle.radius)
    .attr("x2", hallucinatedSchemaPos.x).attr("y2", hallucinatedSchemaPos.y - 30)
    .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);

  // Step 2 Group
  const step2Group = svg.append("g").attr("opacity", 0);

  // Actual Schema Representation (Complex Grid)
  const actualSchemaGroup = step2Group.append("g").attr("transform", `translate(${actualSchemaPos.x}, ${actualSchemaPos.y})`);
  const gridCols = 5;
  const gridRows = 4;
  const cellWidth = 40;
  const cellHeight = 20;
  const gridWidth = gridCols * cellWidth;
  const gridHeight = gridRows * cellHeight;

  actualSchemaGroup.append("rect") // Bounding box for actual schema
      .attr("x", -gridWidth / 2 - 10).attr("y", -gridHeight / 2 - 25)
      .attr("width", gridWidth + 20).attr("height", gridHeight + 40)
      .style("fill", boxStyle.fill).style("stroke", boxStyle.stroke).style("stroke-width", boxStyle.strokeWidth).attr("rx", boxStyle.rx);
  actualSchemaGroup.append("text").attr("y", -gridHeight / 2 - 10).text("Actual Schema (Subset Retrieved)")
      .attr("text-anchor", textStyle.anchor).style("font-size", smallTextStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

  const gridData = d3.range(gridCols * gridRows).map(i => ({
      col: i % gridCols,
      row: Math.floor(i / gridCols),
      id: i
  }));

  // Highlight specific cells representing the retrieved subset
  const retrievedIndices = [1, 6, 7, 12]; // Example indices

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
      .attr("rx", 2);

  // Arrow for Step 2 (Hallucinated -> Actual Subset)
  step2Group.append("line")
      .attr("x1", hallucinatedSchemaPos.x + 70) // from right edge of hallucinated schema
      .attr("y1", hallucinatedSchemaPos.y)
      .attr("x2", actualSchemaPos.x - gridWidth / 2 - 10) // to left edge of actual schema box
      .attr("y2", actualSchemaPos.y)
      .style("stroke", arrowStyle.stroke)
      .style("stroke-width", arrowStyle.strokeWidth)
      .attr("marker-end", arrowStyle.markerEnd);
  step2Group.append("text")
      .attr("x", (hallucinatedSchemaPos.x + 70 + actualSchemaPos.x - gridWidth / 2 - 10) / 2)
      .attr("y", actualSchemaPos.y - 10)
      .text("Probes")
      .attr("text-anchor", textStyle.anchor)
      .style("font-size", "10px")
      .style("fill", arrowStyle.stroke);

  // --- Animation ---
  const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 800
  });

  tl.add({
      targets: step1Group.node(),
      opacity: 1,
      delay: 100
  })
  .add({
      targets: step2Group.node(),
      opacity: 1,
      delay: 500
  }, '=-300'); // Overlap slightly

  // Replay
  const replayButton = document.querySelector(replayButtonSelector);
  if (replayButton) {
      replayButton.onclick = () => renderCrushTwoStepVisual(containerSelector, replayButtonSelector);
  }
} 