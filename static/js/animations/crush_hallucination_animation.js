function renderCrushHallucinationAnimation(containerSelector, replayButtonSelector) {
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

  // --- Updated Styles based on new description ---
  const questionBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4, widthScale: 0.8, height: 50 };
  const llmIconStyle = { baseFill: "#e7f5ff", baseStroke: "#90c0de", thinkFill: "#a5d8ff", thinkStroke: "#4dabf7", strokeWidth: 1.5 }; // Distinct blue shades
  const promptBoxStyle = { fill: "#fff9db", stroke: "#ffe082", strokeWidth: 0.5, rx: 2, opacity: 0.8 }; // Pale yellow
  const schemaBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4, initialOpacity: 0.7, finalOpacity: 1, widthScale: 0.8, height: 60 };
  const textStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
  const schemaTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "middle", baseline: "middle" };
  const schemaTableStyle = { fontWeight: "bold", fill: "#005073" }; // Darker blue for table names
  const promptTextStyle = { fontSize: "9px", fill: "#6c757d", anchor: "start", baseline: "middle", fontFam: "monospace" };

  const questionText = "Count members in 'Bootup Baltimore Club' > 18";
  const hallucinatedSchemaParts = [
    { text: "Club", style: schemaTableStyle },
    { text: "(Name, id, ...)", style: schemaTextStyle },
    { text: " ", style: schemaTextStyle },
    { text: "member_of_club", style: schemaTableStyle },
    { text: "(club_id, student_id)", style: schemaTextStyle },
    { text: " ", style: schemaTextStyle },
    { text: "Student", style: schemaTableStyle },
    { text: "(id, age)", style: schemaTextStyle },
  ];
  const promptExamples = [
    "Q: Find flights -> Schema: Flight(...)",
    "Q: List artists -> Schema: Artist(...)"
  ];

  // --- Layout Positions ---
  const questionPos = { x: width / 2, y: height * 0.15 }; // Top center
  const llmPos = { x: width / 2, y: height * 0.45 };      // Below question
  const schemaPos = { x: width / 2, y: height * 0.8 };      // Below LLM
  const promptOffset = { x: 90, y: 0 }; // Relative to LLM center

  // --- Elements ---
  // 1. Question Box
  const questionGroup = svg.append("g").attr("opacity", 0);
  const qBoxWidth = width * questionBoxStyle.widthScale;
  questionGroup.append("rect")
    .attr("x", (width - qBoxWidth) / 2)
    .attr("y", questionPos.y - questionBoxStyle.height / 2)
    .attr("width", qBoxWidth)
    .attr("height", questionBoxStyle.height)
    .style("fill", questionBoxStyle.fill).style("stroke", questionBoxStyle.stroke).style("stroke-width", questionBoxStyle.strokeWidth).attr("rx", questionBoxStyle.rx);
  questionGroup.append("text")
    .attr("x", questionPos.x).attr("y", questionPos.y)
    .text(questionText)
    .attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

  // 2. LLM Icon (Neural Network Style)
  const llmGroup = svg.append("g").attr("opacity", 0).attr("transform", `translate(${llmPos.x}, ${llmPos.y})`);
  const nodeRadius = 5;
  const layerDist = 20;
  const nodes = [
    [{ x: -layerDist, y: -10 }, { x: -layerDist, y: 10 }],
    [{ x: 0, y: -15 }, { x: 0, y: 0 }, { x: 0, y: 15 }],
    [{ x: layerDist, y: 0 }]
  ];
  const connections = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].forEach(source => nodes[i + 1].forEach(target => connections.push({ source, target })));
  }
  const llmConnections = llmGroup.selectAll(".conn").data(connections).join("line")
    .attr("class", "conn")
    .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
    .style("stroke", llmIconStyle.baseStroke).style("stroke-width", 0.5);
  const llmNodes = llmGroup.selectAll(".node").data(nodes.flat()).join("circle")
    .attr("class", "node")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", nodeRadius)
    .style("fill", llmIconStyle.baseFill).style("stroke", llmIconStyle.baseStroke).style("stroke-width", 1);

  // 3. Few-Shot Prompt Examples (Semi-transparent, fade in/out)
  const promptsGroup = svg.append("g").attr("transform", `translate(${llmPos.x}, ${llmPos.y})`); // Position relative to LLM
  const promptElements = promptsGroup.selectAll(".prompt-example")
    .data(promptExamples)
    .join("g")
    .attr("class", "prompt-example")
    .attr("opacity", 0); // Start hidden

  promptElements.each(function(d, i) {
    const group = d3.select(this);
    const textElement = group.append("text")
      .text(d)
      .attr("text-anchor", promptTextStyle.anchor)
      .style("font-size", promptTextStyle.fontSize)
      .style("fill", promptTextStyle.fill)
      .attr("dominant-baseline", promptTextStyle.baseline)
      .style("font-family", promptTextStyle.fontFam);

    // Get text bounds *after* rendering
    const bbox = textElement.node().getBBox();
    const pBoxWidth = bbox.width;
    const pBoxHeight = bbox.height;
    const pBoxX = promptOffset.x + (i % 2 === 0 ? 0 : -pBoxWidth - 15); // Position left/right
    const pBoxY = promptOffset.y + Math.floor(i / 2) * (pBoxHeight + 15) - pBoxHeight / 2;

    textElement.attr("x", pBoxX).attr("y", pBoxY + pBoxHeight / 2);

    group.insert("rect", "text") // Insert rect behind text
      .attr("x", pBoxX - 5)
      .attr("y", pBoxY - 2)
      .attr("width", pBoxWidth + 10)
      .attr("height", pBoxHeight + 4)
      .style("fill", promptBoxStyle.fill)
      .style("stroke", promptBoxStyle.stroke)
      .style("stroke-width", promptBoxStyle.strokeWidth)
      .attr("rx", promptBoxStyle.rx)
      .attr("opacity", promptBoxStyle.opacity);
  });


  // 4. Hallucinated Schema Box
  const schemaGroup = svg.append("g").attr("opacity", 0);
  const sBoxWidth = width * schemaBoxStyle.widthScale;
  schemaGroup.append("rect")
    .attr("x", (width - sBoxWidth) / 2)
    .attr("y", schemaPos.y - schemaBoxStyle.height / 2)
    .attr("width", sBoxWidth)
    .attr("height", schemaBoxStyle.height)
    .style("fill", schemaBoxStyle.fill)
    .style("stroke", schemaBoxStyle.stroke)
    .style("stroke-width", schemaBoxStyle.strokeWidth)
    .attr("rx", schemaBoxStyle.rx)
    .style("opacity", schemaBoxStyle.initialOpacity); // Initial slightly transparent feel

  const schemaTextElement = schemaGroup.append("text")
    .attr("x", schemaPos.x)
    .attr("y", schemaPos.y)
    .attr("text-anchor", textStyle.anchor)
    .attr("dominant-baseline", textStyle.baseline);

  const spans = hallucinatedSchemaParts.map(part => {
    return schemaTextElement.append("tspan")
      .style("font-family", part.style.fontFam || schemaTextStyle.fontFam)
      .style("font-size", part.style.fontSize || schemaTextStyle.fontSize)
      .style("fill", part.style.fill || schemaTextStyle.fill)
      .style("font-weight", part.style.fontWeight || 'normal')
      .text("") // Start empty
      .datum({ fullText: part.text })
      .node();
  });

  // --- Animation Timeline ---
  const tl = anime.timeline({
    easing: 'easeOutExpo', // Smoother easing
    duration: 700 // Slightly longer default duration
  });

  tl
    .add({ // Step 1: Show Question
      targets: questionGroup.node(),
      opacity: 1,
      translateY: [ -20, 0 ], // Slight slide in
      duration: 500
    })
    .add({ // Step 2: Show LLM
      targets: llmGroup.node(),
      opacity: 1,
      scale: [0.8, 1], // Scale in
      duration: 500
    }, '-=300') // Overlap slightly
    // Step 3: LLM Thinking Animation & Prompt Flashing
    .add({
      targets: llmConnections.nodes(),
      stroke: llmIconStyle.thinkStroke, // Use think color
      strokeWidth: 1,
      direction: 'alternate',
      loop: 3, // Loop thinking animation
      duration: 350,
      delay: anime.stagger(10)
    }, '+=100') // Start after LLM appears
    .add({
      targets: llmNodes.nodes(),
      fill: llmIconStyle.thinkFill, // Use think color
      direction: 'alternate',
      loop: 3,
      duration: 350,
    }, '-=1050') // Sync with connection thinking
    .add({
      targets: promptElements.nodes(),
      opacity: [0, 1, 0], // Fade in and out
      duration: 700, // Duration for one fade in/out cycle
      delay: anime.stagger(200, { start: 150 }), // Stagger the appearance, start slightly after thinking begins
      easing: 'linear'
    }, '-=1000') // Overlap with thinking
    // Step 4: Show Hallucinated Schema Box
    .add({
      targets: schemaGroup.node(),
      opacity: 1,
      translateY: [ 20, 0 ], // Slide in from bottom
      duration: 500
    }, '-=200') // Start showing schema box towards end of thinking
    .add({
        targets: schemaGroup.select('rect').node(),
        opacity: schemaBoxStyle.finalOpacity, // Fade to fully opaque
        duration: 400
    }, '-=400')
    // Animate text writing (typewriter for each span)
    .add({
      targets: spans,
      text: function(el) { return d3.select(el).datum().fullText; },
      duration: function(el) { return d3.select(el).datum().fullText.length * 35; }, // Adjust speed
      delay: anime.stagger(100), // Adjust stagger
      easing: 'linear',
      begin: function(anim) {
        anim.animatables.forEach(animatable => { animatable.target.textContent = ''; });
      },
      update: function(anim) { // Custom update for typewriter
        anim.animatables.forEach(animatable => {
          const targetNode = animatable.target;
          const fullText = d3.select(targetNode).datum().fullText;
          // Ensure progress doesn't exceed 100 for calculation
          const currentProgress = Math.min(anim.progress, 100);
          const progress = Math.floor(currentProgress * fullText.length / 100);
          targetNode.textContent = fullText.substring(0, progress);
        });
      }
    }, '-=300'); // Start typewriter slightly before box fully appears

  // --- Replay Logic ---
  const replayButton = document.querySelector(replayButtonSelector);
  if (replayButton) {
    replayButton.onclick = () => renderCrushHallucinationAnimation(containerSelector, replayButtonSelector);
  }
} 