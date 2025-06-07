function renderDirectRetrievalAnimation(containerSelector, replayButtonSelector) {
  if (typeof d3 === 'undefined' || typeof anime === 'undefined') {
    console.error("D3 or anime.js library is not loaded. Cannot render animation for:", containerSelector);
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='red'>Error: Required library not loaded.</text>`;
    }
    return;
  }

  const svg = d3.select(containerSelector);
  if (svg.empty()) {
    console.error("Container element not found:", containerSelector);
    return;
  }

  svg.selectAll("*").remove(); // Clear previous elements

  // Use viewBox dimensions for internal calculations
  const viewBox = svg.attr("viewBox").split(" ").map(Number);
  const width = viewBox[2];
  const height = viewBox[3];

  // --- Positions & Configuration ---
  const boxSize = { width: 150, height: 40 };
  const vectorSize = { width: 100, height: 30 };
  const arrowSpace = 50;
  const verticalSpacing = 80;

  const queryPos = { x: 50, y: height / 2 };
  const queryVectorPos = { x: queryPos.x + boxSize.width + arrowSpace, y: queryPos.y };
  const tablesStartX = queryVectorPos.x + vectorSize.width + arrowSpace + 50;
  const tablePositions = [
    { x: tablesStartX, y: height / 2 - verticalSpacing },
    { x: tablesStartX, y: height / 2 },
    { x: tablesStartX, y: height / 2 + verticalSpacing }
  ];
  const tableVectorPositions = tablePositions.map(d => ({ x: d.x + boxSize.width + arrowSpace, y: d.y }));

  const tableLabels = ["Table A (Relevant)", "Table B", "Table C"];
  const similarities = [0.9, 0.3, 0.5]; // Higher is better

  const styles = {
    label: { fontSize: "12px", fill: "#555", anchor: "middle" },
    stepLabel: { fontSize: "14px", fill: "#005073", anchor: "middle", weight: "bold" },
    box: { fill: "#e0f7fa", stroke: "#00796b", strokeWidth: 1.5 },
    tableBox: { fill: "#fff9c4", stroke: "#f57f17", strokeWidth: 1.5 },
    vectorBox: { fill: "#d1c4e9", stroke: "#512da8", strokeWidth: 1.5 },
    arrow: { stroke: "#333", strokeWidth: 2, markerEnd: "url(#arrowhead-direct)" }, // Unique ID for marker
    text: { fontSize: "13px", fontWeight: "bold", fill: "#333", anchor: "middle" },
    similarityLine: { stroke: "#7b1fa2", strokeDasharray: "5,5", opacity: 0.8 },
    highlighted: { stroke: "#c2185b", strokeWidth: 3 }
  };

  // --- SVG Definitions ---
  const defs = svg.append("defs");
  defs.append("marker")
    .attr("id", "arrowhead-direct") // Use unique ID
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#333");

  // --- Helper Functions (using D3 for element creation) ---

  // Function to draw a box with text
  function drawBox(group, pos, size, style, text) {
    const box = group.append("rect")
      .attr("x", pos.x)
      .attr("y", pos.y - size.height / 2)
      .attr("width", size.width)
      .attr("height", size.height)
      .attr("rx", 3)
      .style("fill", style.fill)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth);
    const txt = group.append("text")
      .attr("x", pos.x + size.width / 2)
      .attr("y", pos.y)
      .attr("dy", "0.35em")
      .style("font-size", styles.text.fontSize)
      .style("font-weight", styles.text.fontWeight)
      .style("fill", styles.text.fill)
      .attr("text-anchor", styles.text.anchor)
      .text(text);
    return group; // Return the group for chaining if needed
  }

  // Function to draw an arrow
  function drawArrow(group, startPos, endPos, style) {
    const arrow = group.append("line")
      .attr("x1", startPos.x)
      .attr("y1", startPos.y)
      .attr("x2", endPos.x)
      .attr("y2", endPos.y)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .attr("marker-end", style.markerEnd);
    return group;
  }

  // Function to create step label (initially hidden)
  function createStepLabel(text, x, y) {
    return svg.append("text")
      .attr("class", "step-label")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", styles.stepLabel.anchor)
      .style("font-size", styles.stepLabel.fontSize)
      .style("fill", styles.stepLabel.fill)
      .style("font-weight", styles.stepLabel.weight)
      .text(text)
      .attr("opacity", 0); // Start hidden
  }

  // --- Create Elements (initially hidden or at start state) ---

  // 1. Query Box
  const queryGroup = svg.append("g").attr("class", "query-group").attr("opacity", 0);
  drawBox(queryGroup, queryPos, boxSize, styles.box, "User Query");

  // 2. Query Embedding Arrow and Vector Box
  const queryEmbedGroup = svg.append("g").attr("class", "query-embed-group").attr("opacity", 0);
  drawArrow(queryEmbedGroup, { x: queryPos.x + boxSize.width, y: queryPos.y }, { x: queryVectorPos.x, y: queryVectorPos.y }, styles.arrow);
  drawBox(queryEmbedGroup, queryVectorPos, vectorSize, styles.vectorBox, "Query Vector");
  const queryEmbedLabel = createStepLabel("Embed Query", queryPos.x + boxSize.width + arrowSpace / 2, queryPos.y + boxSize.height);

  // 3. Table Boxes
  const tableGroups = svg.selectAll(".tableG")
    .data(tablePositions)
    .join("g")
    .attr("class", "tableG")
    .attr("opacity", 0);
  tableGroups.each(function (d, i) {
    drawBox(d3.select(this), d, boxSize, styles.tableBox, tableLabels[i]);
  });

  // 4. Table Embedding Arrows and Vector Boxes
  const tableEmbedGroups = svg.selectAll(".tableEmbedG")
    .data(tableVectorPositions)
    .join("g")
    .attr("class", "tableEmbedG")
    .attr("opacity", 0);
  tableEmbedGroups.each(function (d, i) {
    drawArrow(d3.select(this), { x: tablePositions[i].x + boxSize.width, y: d.y }, { x: d.x, y: d.y }, styles.arrow);
    drawBox(d3.select(this), d, vectorSize, styles.vectorBox, "Table Vector");
  });
  const tableEmbedLabel = createStepLabel("Embed Tables", tablePositions[0].x + boxSize.width + arrowSpace / 2, height - 20);

  // 5. Similarity Lines
  const lines = svg.selectAll(".simLine")
    .data(tableVectorPositions)
    .join("line")
    .attr("class", "simLine")
    .attr("x1", queryVectorPos.x + vectorSize.width)
    .attr("y1", queryVectorPos.y)
    .attr("x2", d => d.x)
    .attr("y2", d => d.y)
    .style("stroke", styles.similarityLine.stroke)
    .style("stroke-dasharray", styles.similarityLine.strokeDasharray)
    .style("stroke-width", (d, i) => 1 + similarities[i] * 5)
    .attr("opacity", 0);
  const similarityLabel = createStepLabel("Compare Similarity", queryVectorPos.x + vectorSize.width + (tablesStartX - (queryVectorPos.x + vectorSize.width)) / 2, height - 20);

  // --- Anime.js Timeline --- 
  const tl = anime.timeline({
    easing: 'easeOutExpo',
    duration: 750
  });

  tl
    .add({
      targets: queryGroup.node(),
      opacity: 1,
      offset: 500 // Start after 500ms
    })
    .add({
      targets: queryEmbedGroup.node(),
      opacity: 1
    })
    .add({
      targets: queryEmbedLabel.node(),
      opacity: 1
    }, '-=500') // Overlap previous animation
    .add({
      targets: tableGroups.nodes(), // Target all table group nodes
      opacity: 1,
      delay: anime.stagger(100) // Stagger appearance slightly
    })
    .add({
      targets: tableEmbedGroups.nodes(), // Target all table embed group nodes
      opacity: 1,
      delay: anime.stagger(100)
    })
    .add({
      targets: tableEmbedLabel.node(),
      opacity: 1
    }, '-=500')
    .add({
      targets: lines.nodes(), // Target all similarity lines
      opacity: styles.similarityLine.opacity,
      delay: anime.stagger(100)
    })
    .add({
      targets: similarityLabel.node(),
      opacity: 1
    }, '-=500')
    .add({
      targets: tableEmbedGroups.filter((d, i) => i === 0).select("rect").node(),
      stroke: styles.highlighted.stroke,
      strokeWidth: styles.highlighted.strokeWidth,
      duration: 500
    })
    .add({
      targets: tableEmbedGroups.filter((d, i) => i === 0).select("text").node(),
      fill: styles.highlighted.stroke,
      fontWeight: 'bold',
      duration: 500
    }, '-=500');

  // --- Replay Logic ---
  const replayButton = document.querySelector(replayButtonSelector);
  if (replayButton) {
    replayButton.onclick = () => {
      // Simply re-run the function to clear and restart
      renderDirectRetrievalAnimation(containerSelector, replayButtonSelector);
    };
  } else {
    console.warn("Replay button not found:", replayButtonSelector);
  }
} 