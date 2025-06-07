function renderCrushHallucinationProbingAnimation(containerSelector, replayButtonSelector) {
  if (typeof d3 === 'undefined' || typeof anime === 'undefined') {
    console.error("D3 or anime.js library not loaded for:", containerSelector);
    const container = document.querySelector(containerSelector);
    if (container) container.innerHTML = `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='red'>Error: Lib not loaded.</text>`;
    return;
  }

  const svg = d3.select(containerSelector);
  svg.selectAll("*").remove();

  const viewBox = svg.attr("viewBox").split(" ").map(Number);
  const width = viewBox[2];
  const height = viewBox[3];
  const centerX = width / 2;

  // --- Config ---
  const colors = {
    question: "#f8f9fa", stroke: "#dee2e6", text: "#212529",
    llm: "#e7f5ff", llmStroke: "#90c0de",
    hallucinated: "#fff9db", hallucinatedStroke: "#ffe082",
    actualSchema: "#e9ecef", actualStroke: "#ced4da",
    retrievedSubset: "#d1ecf1", retrievedStroke: "#bee5eb",
    probe: "#28a745", probeHighlight: "#20c997",
    connection: "#6c757d",
    highlight: "#007bff"
  };
  const textStyle = { fontSize: "13px", fill: colors.text, anchor: "middle", baseline: "middle" };
  const schemaTextStyle = { fontFam: "monospace", fontSize: "11px", fill: colors.text, anchor: "middle", baseline: "middle" };

  // --- STEP 1 Elements ---
  const questionPos = { x: centerX, y: 50 };
  const llmPos = { x: centerX, y: 130 };
  const hallucinatedSchemaPos = { x: centerX, y: 210 };

  // 1a. Question
  const questionGroup = svg.append("g").attr("opacity", 0);
  questionGroup.append("rect")
    .attr("x", centerX - 150).attr("y", questionPos.y - 20)
    .attr("width", 300).attr("height", 40)
    .attr("rx", 5).style("fill", colors.question).style("stroke", colors.stroke);
  questionGroup.append("text")
    .attr("x", questionPos.x).attr("y", questionPos.y)
    .text("NL Question: 'Find oldest user'")
    .attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

  // 1b. LLM Icon (Simple Brain)
  const llmGroup = svg.append("g").attr("opacity", 0).attr("transform", `translate(${llmPos.x}, ${llmPos.y}) scale(0.6)`);
  llmGroup.append("path") // Simplified brain outline
      .attr("d", "M50 10 C 20 10, 10 30, 10 50 C 10 80, 30 100, 50 100 C 70 100, 90 80, 90 50 C 90 30, 80 10, 50 10 Z M 50 15 C 75 15, 85 35, 85 50 C 85 70, 75 95, 50 95 C 25 95, 15 70, 15 50 C 15 35, 25 15, 50 15 Z M 50 30 C 40 30, 35 40, 35 50 C 35 60, 40 70, 50 70 C 60 70, 65 60, 65 50 C 65 40, 60 30, 50 30 Z")
      .style("fill", colors.llm).style("stroke", colors.llmStroke).style("stroke-width", 2);

  // 1c. Hallucinated Schema
  const hallucinatedGroup = svg.append("g").attr("opacity", 0);
  hallucinatedGroup.append("rect")
    .attr("x", centerX - 80).attr("y", hallucinatedSchemaPos.y - 15)
    .attr("width", 160).attr("height", 30)
    .attr("rx", 3).style("fill", colors.hallucinated).style("stroke", colors.hallucinatedStroke);
  hallucinatedGroup.append("text")
    .attr("x", hallucinatedSchemaPos.x).attr("y", hallucinatedSchemaPos.y)
    .text("User(user_id, name, age)")
    .attr("text-anchor", schemaTextStyle.anchor).style("font-size", schemaTextStyle.fontSize).style("fill", schemaTextStyle.fill).attr("dominant-baseline", schemaTextStyle.baseline).style("font-family", schemaTextStyle.fontFam);
  hallucinatedGroup.append("text")
    .attr("x", hallucinatedSchemaPos.x).attr("y", hallucinatedSchemaPos.y - 25)
    .text("Hallucinated Schema")
    .attr("text-anchor", textStyle.anchor).style("font-size", "10px").style("fill", "#6c757d");

  // 1d. Arrow Question -> LLM -> Hallucinated
   const arrow1 = svg.append("line").attr("opacity", 0)
        .attr("x1", llmPos.x).attr("y1", questionPos.y + 20)
        .attr("x2", llmPos.x).attr("y2", llmPos.y - 30)
        .attr("stroke", colors.connection).attr("stroke-width", 1.5).attr("marker-end", "url(#arrowhead)");
   const arrow2 = svg.append("line").attr("opacity", 0)
        .attr("x1", llmPos.x).attr("y1", llmPos.y + 30)
        .attr("x2", hallucinatedSchemaPos.x).attr("y2", hallucinatedSchemaPos.y - 15)
        .attr("stroke", colors.connection).attr("stroke-width", 1.5).attr("marker-end", "url(#arrowhead)");

  // --- STEP 2 Elements ---
  const actualSchemaPos = { x: centerX, y: 330 };
  const subsetPos = { x: centerX, y: 330 }; // Retrieved subset will overlay/highlight actual

  // 2a. Actual Schema (Simplified representation)
  const actualSchemaGroup = svg.append("g").attr("opacity", 0);
  actualSchemaGroup.append("text")
    .attr("x", actualSchemaPos.x).attr("y", actualSchemaPos.y - 50)
    .text("Actual Database Schema (Many Tables)")
    .attr("text-anchor", textStyle.anchor).style("font-size", "10px").style("fill", "#6c757d");

  const tableData = [
    { name: "Customers", cols: ["cust_id", "name", "join_date"], x: centerX - 200, y: actualSchemaPos.y - 20, w: 100, h: 60 },
    { name: "Profiles", cols: ["prof_id", "cust_id", "dob", "address"], x: centerX - 50, y: actualSchemaPos.y - 20, w: 100, h: 60, relevant: true }, // Relevant
    { name: "Orders", cols: ["order_id", "cust_id", "product", "date"], x: centerX + 100, y: actualSchemaPos.y - 20, w: 100, h: 60 },
    { name: "Logins", cols: ["log_id", "cust_id", "timestamp"], x: centerX - 200, y: actualSchemaPos.y + 50, w: 100, h: 60 },
    { name: "People", cols: ["person_id", "full_name", "age"], x: centerX - 50, y: actualSchemaPos.y + 50, w: 100, h: 60, relevant: true }, // Relevant (but maybe 'Profiles' is better match due to 'dob')
    { name: "Products", cols: ["prod_id", "name", "price"], x: centerX + 100, y: actualSchemaPos.y + 50, w: 100, h: 60 },
  ];

  actualSchemaGroup.selectAll("rect.table-bg")
    .data(tableData)
    .join("rect")
    .attr("class", "table-bg")
    .attr("x", d => d.x).attr("y", d => d.y)
    .attr("width", d => d.w).attr("height", d => d.h)
    .attr("rx", 3).style("fill", colors.actualSchema).style("stroke", colors.actualStroke);

  actualSchemaGroup.selectAll("text.table-name")
    .data(tableData)
    .join("text")
    .attr("class", "table-name")
    .attr("x", d => d.x + d.w / 2).attr("y", d => d.y + 15)
    .text(d => d.name)
    .attr("text-anchor", textStyle.anchor).style("font-size", "12px").style("fill", textStyle.fill).style("font-weight", "bold");

  actualSchemaGroup.selectAll("text.table-cols")
    .data(tableData)
    .join("text")
    .attr("class", "table-cols")
    .attr("x", d => d.x + d.w / 2).attr("y", d => d.y + 35)
    .selectAll("tspan")
    .data(d => d.cols)
    .join("tspan")
    .attr("x", d => d3.select(this.parentNode).datum().x + d3.select(this.parentNode).datum().w / 2)
    .attr("dy", "1.2em")
    .text(d => d)
    .attr("text-anchor", schemaTextStyle.anchor).style("font-size", "9px").style("fill", schemaTextStyle.fill).style("font-family", schemaTextStyle.fontFam);


  // 2b. Probes (originating from hallucinated schema)
  const probesGroup = svg.append("g");
  const probeTargets = ["User", "user_id", "age"]; // Simplified from User(user_id, name, age)
  const probeLines = [];
  probeTargets.forEach((target, i) => {
    const line = probesGroup.append("line")
      .attr("x1", hallucinatedSchemaPos.x)
      .attr("y1", hallucinatedSchemaPos.y + 15)
      .attr("x2", hallucinatedSchemaPos.x)
      .attr("y2", hallucinatedSchemaPos.y + 15) // Start collapsed
      .attr("stroke", colors.probe)
      .attr("stroke-width", 2)
      .attr("opacity", 0);
      // .attr("marker-end", "url(#arrowhead-probe)"); // Optional: arrowhead for probes
    probeLines.push(line);
  });

  // 2c. Retrieved Subset Highlight
  const retrievedGroup = svg.append("g").attr("opacity", 0);
  const retrievedTables = tableData.filter(d => d.relevant);
  retrievedGroup.selectAll("rect.retrieved-highlight")
    .data(retrievedTables)
    .join("rect")
    .attr("class", "retrieved-highlight")
    .attr("x", d => d.x - 2).attr("y", d => d.y - 2)
    .attr("width", d => d.w + 4).attr("height", d => d.h + 4)
    .attr("rx", 5)
    .style("fill", "none")
    .style("stroke", colors.highlight)
    .style("stroke-width", 3)
    .style("stroke-dasharray", "6 3");

  // --- Arrowheads ---
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", colors.connection)
    .style("stroke", "none");

  // --- Animation Timeline ---
  const tl = anime.timeline({
    easing: 'easeInOutSine',
    duration: 700
  });

  tl
    // Step 1: Hallucination
    .add({ targets: questionGroup.node(), opacity: 1, duration: 500 })
    .add({ targets: llmGroup.node(), opacity: 1, scale: [0.5, 0.6], translateY: [llmPos.y + 10, llmPos.y], duration: 400 }, '-=200')
    .add({ targets: arrow1.node(), opacity: 1 }, '-=400')
    .add({ // LLM Thinking pulse
      targets: llmGroup.select("path").node(),
      scale: [0.6, 0.65, 0.6],
      opacity: [1, 0.7, 1],
      duration: 800,
      easing: 'easeInOutQuad',
      loop: 1,
    }, '-=300')
    .add({ targets: arrow2.node(), opacity: 1 }, '-=600')
    .add({ targets: hallucinatedGroup.node(), opacity: 1, translateY: [hallucinatedSchemaPos.y + 10, hallucinatedSchemaPos.y], duration: 500 }, '-=500')

    // Step 2: Probing & Retrieval
    .add({ targets: actualSchemaGroup.node(), opacity: 1, duration: 600 }, '+=200') // Show actual schema
    .add({ // Animate probes reaching out
      targets: probeLines.map(l => l.node()),
      x2: (el, i) => {
          // Aim probes towards the center of the relevant tables area
          const targetX = centerX - 50 + 50; // Approx center of relevant tables
          const targetY = actualSchemaPos.y + 15;
          const spreadFactor = 40; // Spread probes slightly horizontally
          return targetX + (i - (probeTargets.length-1)/2) * spreadFactor;
      },
      y2: (el, i) => actualSchemaPos.y - 25, // Aim above the tables
      opacity: 0.7,
      duration: 800,
      delay: anime.stagger(100),
      easing: 'easeOutCubic'
    }, '-=300')
    .add({ // Highlight probes briefly
        targets: probeLines.map(l => l.node()),
        stroke: colors.probeHighlight,
        strokeWidth: 3,
        opacity: 1,
        direction: 'alternate',
        duration: 400,
        easing: 'easeInOutQuad'
    }, '-=400')
    .add({ // Show retrieved subset highlight
      targets: retrievedGroup.node(),
      opacity: 1,
      duration: 500
    }, '-=200')
    .add({ // Fade probes slightly after retrieval shown
        targets: probeLines.map(l => l.node()),
        opacity: 0.4,
        strokeWidth: 1.5,
        duration: 300
    }, '-=300');


  // --- Replay Logic ---
  const replayButton = document.querySelector(replayButtonSelector);
  if (replayButton) {
    replayButton.onclick = () => renderCrushHallucinationProbingAnimation(containerSelector, replayButtonSelector);
  }
} 