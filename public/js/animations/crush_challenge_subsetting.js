function renderCrushChallengeSubsetting(containerSelector, replayButtonSelector) {
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
    const schemaBoxStyle = { fill: "#e9ecef", stroke: "#ced4da", strokeWidth: 0.3, rx: 1, size: 6 };
    const schemaConnectStyle = { stroke: "#adb5bd", strokeWidth: 0.2 };
    const questionTextStyle = { fontSize: "14px", fill: "#212529", anchor: "middle", baseline: "middle", fontWeight: "bold" };
    const explanationTextStyle = { fontSize: "10px", fill: "#495057", anchor: "start", baseline: "hanging" };
    const highlightStyle = { stroke: "#dc3545", strokeWidth: 1.5 }; // Red highlight for relevant subset
    const dimOpacity = 0.15;

    // --- Layout & Data ---
    const questionText = "Count members in 'Bootup Baltimore Club' > 18";
    const questionPos = { x: width / 2, y: height * 0.1 };
    const schemaArea = { x: width * 0.05, y: height * 0.2, w: width * 0.9, h: height * 0.75 };
    const grid = { rows: 15, cols: 25, spacing: 10 }; // Densely packed grid

    const numBoxes = grid.rows * grid.cols;
    const schemaNodesData = d3.range(numBoxes).map(i => ({
        id: i,
        x: schemaArea.x + (Math.random() * schemaArea.w), // Random scatter within area
        y: schemaArea.y + (Math.random() * schemaArea.h),
        isRelevant: false
    }));

    // Define the relevant subset indices (example)
    const relevantIndices = [55, 56, 57, 90, 91, 125, 126, 127, 160, 161];
    relevantIndices.forEach(idx => {
        if (schemaNodesData[idx]) schemaNodesData[idx].isRelevant = true;
    });

    // Create some random connections for visual density
    const connectionsData = [];
    for(let i = 0; i < numBoxes * 0.8; i++) { // Fewer connections than nodes
        const sourceIndex = Math.floor(Math.random() * numBoxes);
        const targetIndex = Math.floor(Math.random() * numBoxes);
        if (sourceIndex !== targetIndex) {
            connectionsData.push({
                source: schemaNodesData[sourceIndex],
                target: schemaNodesData[targetIndex]
            });
        }
    }

    // --- Elements ---
    // Schema Connections (drawn first, appear faint)
    const connectionGroup = svg.append("g");
    const schemaConnections = connectionGroup.selectAll(".schema-conn")
        .data(connectionsData)
        .join("line")
        .attr("class", "schema-conn")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", schemaConnectStyle.stroke)
        .style("stroke-width", schemaConnectStyle.strokeWidth)
        .attr("opacity", 0); // Start hidden

    // Schema Boxes
    const schemaGroup = svg.append("g");
    const schemaBoxes = schemaGroup.selectAll(".schema-box")
        .data(schemaNodesData)
        .join("rect")
        .attr("class", d => d.isRelevant ? "schema-box relevant" : "schema-box")
        .attr("x", d => d.x - schemaBoxStyle.size / 2)
        .attr("y", d => d.y - schemaBoxStyle.size / 2)
        .attr("width", schemaBoxStyle.size)
        .attr("height", schemaBoxStyle.size)
        .attr("rx", schemaBoxStyle.rx)
        .style("fill", schemaBoxStyle.fill)
        .style("stroke", schemaBoxStyle.stroke)
        .style("stroke-width", schemaBoxStyle.strokeWidth)
        .attr("opacity", 0); // Start hidden

    // Question Text
    const questionElement = svg.append("text")
        .attr("x", questionPos.x)
        .attr("y", questionPos.y)
        .text(questionText)
        .attr("text-anchor", questionTextStyle.anchor)
        .style("font-size", questionTextStyle.fontSize)
        .style("fill", questionTextStyle.fill)
        .style("font-weight", questionTextStyle.fontWeight)
        .attr("dominant-baseline", questionTextStyle.baseline)
        .attr("opacity", 0); // Start hidden

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
        .text("Challenge: Finding the few relevant tables/columns (")
        .style("font-size", explanationTextStyle.fontSize).style("fill", explanationTextStyle.fill).attr("dominant-baseline", explanationTextStyle.baseline);
    explanationGroup.append("tspan")
        .text("highlighted")
        .style("fill", highlightStyle.stroke).style("font-weight", "bold");
     explanationGroup.append("tspan")
        .text(") in a vast, complex database schema is difficult.")
        .style("fill", explanationTextStyle.fill);


    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 1000 // Base duration for steps
    });

    tl
    // Timestamp 0:00 - 0:05: Show large schema
    .add({
        targets: schemaBoxes.nodes(),
        opacity: [0, 0.6], // Fade in slightly transparently
        delay: anime.stagger(1), // Stagger appearance slightly
        duration: 5000 // 5 seconds
    }, 0)
    .add({
        targets: schemaConnections.nodes(),
        opacity: [0, 0.3], // Fade in connections even fainter
        delay: anime.stagger(0.5),
        duration: 5000
    }, 500) // Start slightly after boxes start appearing
    // Timestamp 0:05 - 0:10: Show question
    .add({
        targets: questionElement.node(),
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 1000
    }, 5000) // Start at 5 seconds
    // Timestamp 0:10 - 0:15: Dim schema, highlight subset
    .add({
        targets: schemaBoxes.filter(":not(.relevant)").nodes(), // Dim non-relevant
        opacity: dimOpacity,
        duration: 1500,
        delay: anime.stagger(0.5)
    }, 10000) // Start at 10 seconds
     .add({
        targets: schemaConnections.nodes(), // Dim connections further
        opacity: dimOpacity * 0.5,
        duration: 1500
    }, 10000)
    .add({
        targets: schemaBoxes.filter(".relevant").nodes(), // Highlight relevant
        stroke: highlightStyle.stroke,
        strokeWidth: highlightStyle.strokeWidth,
        opacity: 1, // Make fully opaque
        scale: [1, 1.5, 1], // Pulse scale
        duration: 1500,
        delay: anime.stagger(50)
    }, 10500) // Slightly after dimming starts
    // Show Explanation Overlay (appears gradually during 0:05 - 0:15)
    .add({
        targets: explanationGroup.node(),
        opacity: [0, 1],
        duration: 5000 // Fade in over 5 seconds
    }, 7500); // Start fade in around 7.5 seconds

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushChallengeSubsetting(containerSelector, replayButtonSelector);
    }
} 