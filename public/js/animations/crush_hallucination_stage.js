function renderCrushHallucinationStage(containerSelector, replayButtonSelector) {
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
    const questionTextStyle = { fontSize: "14px", fill: "#212529", anchor: "middle", baseline: "middle", fontWeight: "bold" };
    const llmIconStyle = { baseFill: "#e7f5ff", baseStroke: "#90c0de", thinkFill: "#a5d8ff", thinkStroke: "#4dabf7", strokeWidth: 1.5 };
    const arrowStyle = { stroke: "#6c757d", strokeWidth: 1.5, markerEnd: "url(#arrowhead-hallucination)" };
    const schemaBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 };
    const schemaTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const schemaTableStyle = { fontWeight: "bold", fill: "#005073" };
    const explanationTextStyle = { fontSize: "10px", fill: "#495057", anchor: "start", baseline: "hanging" };

    // --- Layout & Data ---
    const questionText = "Count members in 'Bootup Baltimore Club' > 18";
    const questionPos = { x: width / 2, y: height * 0.1 };
    const llmPos = { x: width / 2, y: height * 0.35 };
    const schemaLayout = {
        startX: width * 0.15,
        startY: height * 0.7,
        width: width * 0.7,
        spacing: width * 0.05
    };
    const hallucinatedSchemaData = [
        { name: "Club", x: 0, y: 0, attrs: ["(Name, id, ...)"] },
        { name: "member_of_club", x: 0, y: 0, attrs: ["(club_id, student_id)"] },
        { name: "Student", x: 0, y: 0, attrs: ["(id, age)"] }
    ];
    const numSchemaBoxes = hallucinatedSchemaData.length;
    const schemaBoxWidth = (schemaLayout.width - (numSchemaBoxes - 1) * schemaLayout.spacing) / numSchemaBoxes;
    hallucinatedSchemaData.forEach((d, i) => {
        d.x = schemaLayout.startX + i * (schemaBoxWidth + schemaLayout.spacing) + schemaBoxWidth / 2;
        d.y = schemaLayout.startY;
        d.width = schemaBoxWidth;
        d.height = 50; // Fixed height for simplicity
    });

    // --- Elements ---
     // Arrowhead Marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-hallucination")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 5).attr("refY", 0).attr("orient", "auto")
        .attr("markerWidth", 4).attr("markerHeight", 4)
        .attr("xoverflow", "visible")
        .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", arrowStyle.stroke).style("stroke", "none");

    // Question Text
    const questionElement = svg.append("text")
        .attr("x", questionPos.x).attr("y", questionPos.y)
        .text(questionText)
        .attr("text-anchor", questionTextStyle.anchor).style("font-size", questionTextStyle.fontSize)
        .style("fill", questionTextStyle.fill).style("font-weight", questionTextStyle.fontWeight)
        .attr("dominant-baseline", questionTextStyle.baseline).attr("opacity", 0);

    // LLM Icon (Reusing network from previous example)
    const llmGroup = svg.append("g").attr("opacity", 0).attr("transform", `translate(${llmPos.x}, ${llmPos.y}) scale(1.2)`); // Slightly larger
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
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y)
        .style("stroke", llmIconStyle.baseStroke).style("stroke-width", 0.5);
    const llmNodes = llmGroup.selectAll(".node").data(nodes.flat()).join("circle")
        .attr("class", "node")
        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", nodeRadius)
        .style("fill", llmIconStyle.baseFill).style("stroke", llmIconStyle.baseStroke).style("stroke-width", 1);

    // Arrow: Question -> LLM
    const feedArrow = svg.append("line")
        .attr("x1", questionPos.x).attr("y1", questionPos.y + 15) // Below question
        .attr("x2", questionPos.x).attr("y2", questionPos.y + 15) // Start collapsed
        .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth)
        .attr("marker-end", arrowStyle.markerEnd).attr("opacity", 0);

    // Hallucinated Schema Elements
    const schemaGroup = svg.append("g");
    const schemaBoxes = schemaGroup.selectAll(".schema-box")
        .data(hallucinatedSchemaData)
        .join("g")
        .attr("class", "schema-box")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .attr("opacity", 0);

    schemaBoxes.append("rect")
        .attr("x", d => -d.width / 2)
        .attr("y", d => -d.height / 2)
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .attr("rx", schemaBoxStyle.rx)
        .style("fill", schemaBoxStyle.fill)
        .style("stroke", schemaBoxStyle.stroke)
        .style("stroke-width", schemaBoxStyle.strokeWidth);

    schemaBoxes.append("text")
        .attr("y", d => -d.height / 2 + 15) // Position name at top
        .text(d => d.name)
        .attr("text-anchor", schemaTableStyle.anchor || schemaTextStyle.anchor)
        .style("font-size", schemaTableStyle.fontSize || schemaTextStyle.fontSize)
        .style("fill", schemaTableStyle.fill || schemaTextStyle.fill)
        .style("font-weight", schemaTableStyle.fontWeight || 'normal')
        .attr("dominant-baseline", "middle");

    schemaBoxes.selectAll(".attr-text")
        .data(d => d.attrs.map(attr => ({ text: attr, parentY: d.height / 2 })))
        .join("text")
        .attr("class", "attr-text")
        .attr("y", (d, i) => 5 + i * 14) // Position attributes below name
        .text(d => d.text)
        .attr("text-anchor", schemaTextStyle.anchor)
        .style("font-size", schemaTextStyle.fontSize)
        .style("fill", schemaTextStyle.fill)
        .style("font-family", schemaTextStyle.fontFam)
        .attr("dominant-baseline", "middle");

    // Explanation Text
    const explanationGroup = svg.append("g")
        .attr("transform", `translate(${width * 0.05}, ${height * 0.9})`)
        .attr("opacity", 0);
     explanationGroup.append("rect")
        .attr("x", -5).attr("y", -5)
        .attr("width", width * 0.9 + 10).attr("height", 30)
        .attr("rx", 3).style("fill", "rgba(255, 255, 255, 0.8)");
    explanationGroup.append("text")
        .attr("x", 0).attr("y", 0)
        .text("LLM hallucinates a minimal schema based on the question, acting as a structural bridge.")
        .style("font-size", explanationTextStyle.fontSize).style("fill", explanationTextStyle.fill).attr("dominant-baseline", explanationTextStyle.baseline);


    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 1000 // Base duration for steps
    });

    tl
    // Timestamp 0:00 - 0:05: Show question and LLM
    .add({
        targets: questionElement.node(),
        opacity: 1,
        duration: 1000
    }, 0)
    .add({
        targets: llmGroup.node(),
        opacity: 1,
        scale: [0.8, 1.2], // Pop in effect
        duration: 1000
    }, 500) // Slightly after question
    // Timestamp 0:05 - 0:10: Feed question to LLM
    .add({
        targets: feedArrow.node(),
        y2: llmPos.y - 30, // Extend arrow to LLM
        opacity: 1,
        duration: 800
    }, 5000)
    .add({ // LLM Thinking animation
        targets: llmConnections.nodes(),
        stroke: llmIconStyle.thinkStroke,
        direction: 'alternate', loop: 3, duration: 300, delay: anime.stagger(5)
    }, 5500)
    .add({ // LLM Thinking animation
        targets: llmNodes.nodes(),
        fill: llmIconStyle.thinkFill,
        direction: 'alternate', loop: 3, duration: 300
    }, 5500)
    .add({ // Hide arrow after feeding
        targets: feedArrow.node(),
        opacity: 0,
        duration: 300
    }, 6000)
    // Timestamp 0:10 - 0:15: Emerge hallucinated schema
    .add({
        targets: schemaBoxes.nodes(),
        opacity: 1,
        translateY: [-20, 0], // Slide up
        scale: [0.9, 1],
        delay: anime.stagger(200),
        duration: 1000
    }, 10000) // Start at 10 seconds
    // Show Explanation
    .add({
        targets: explanationGroup.node(),
        opacity: 1,
        duration: 1000
    }, 11000); // After schema appears

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushHallucinationStage(containerSelector, replayButtonSelector);
    }
} 