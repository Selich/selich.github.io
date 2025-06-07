function renderCrushChallengeVisual(containerSelector, replayButtonSelector) {
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
    const schemaBoxStyle = { fill: "#e9ecef", stroke: "#ced4da", strokeWidth: 0.5, rx: 2 };
    const schemaLineStyle = { stroke: "#adb5bd", strokeWidth: 0.5 };
    const highlightStyle = { color: "#ffc107", strokeWidth: 2 }; // Yellow highlight
    const textStyle = { fontSize: "14px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const smallTextStyle = { fontSize: "10px", fill: "#495057", anchor: "start", baseline: "middle" };
    const overlayTextStyle = { fontSize: "12px", fill: "#343a40", anchor: "middle", baseline: "middle", bgColor: "rgba(255, 255, 255, 0.8)", padding: 5 };

    // --- Data ---
    const numBoxes = 80; // Simulate large schema
    const schemaData = d3.range(numBoxes).map(i => ({
        id: i,
        x: Math.random() * (width * 0.8) + (width * 0.1),
        y: Math.random() * (height * 0.7) + (height * 0.15), // Avoid top/bottom edges initially
        width: 30 + Math.random() * 40,
        height: 15 + Math.random() * 10,
        label: `table_${i}`
    }));
    const connections = d3.range(numBoxes / 2).map(() => ({
        source: Math.floor(Math.random() * numBoxes),
        target: Math.floor(Math.random() * numBoxes)
    }));
    // Define the relevant subset coordinates/ids (example)
    const relevantIndices = [5, 15, 30, 45, 60]; // Example IDs that form the relevant subset
    const relevantSubsetCoords = {
        x: width * 0.6, y: height * 0.6,
        width: width * 0.3, height: height * 0.2 // Rough area
    };

    const questionText = "Count members in 'Bootup Baltimore Club' > 18";
    const explanationText = "Traditional methods struggle to find the small relevant schema subset within large, complex databases.";

    // --- Elements ---
    // Large Schema Group
    const schemaGroup = svg.append("g").attr("class", "large-schema");

    // Connections (draw first)
    const schemaLines = schemaGroup.selectAll(".schema-line")
        .data(connections.filter(d => d.source !== d.target))
        .join("line")
        .attr("class", "schema-line")
        .attr("x1", d => schemaData[d.source].x + schemaData[d.source].width / 2)
        .attr("y1", d => schemaData[d.source].y + schemaData[d.source].height / 2)
        .attr("x2", d => schemaData[d.target].x + schemaData[d.target].width / 2)
        .attr("y2", d => schemaData[d.target].y + schemaData[d.target].height / 2)
        .style("stroke", schemaLineStyle.stroke)
        .style("stroke-width", schemaLineStyle.strokeWidth)
        .attr("opacity", 0.6);

    // Schema Boxes
    const schemaBoxes = schemaGroup.selectAll(".schema-box")
        .data(schemaData)
        .join("rect")
        .attr("class", "schema-box")
        .attr("id", d => `box-${d.id}`)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .attr("rx", schemaBoxStyle.rx)
        .style("fill", schemaBoxStyle.fill)
        .style("stroke", schemaBoxStyle.stroke)
        .style("stroke-width", schemaBoxStyle.strokeWidth)
        .attr("opacity", 0.9);

    // Question Text
    const questionElement = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height * 0.07) // Adjusted y position
        .attr("text-anchor", textStyle.anchor)
        .style("font-size", textStyle.fontSize)
        .style("fill", textStyle.fill)
        .text(questionText)
        .attr("opacity", 0);

    // Highlight Sweep element (initially hidden)
    const highlightSweep = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 50)
        .attr("height", height)
        .style("fill", highlightStyle.color)
        .attr("opacity", 0.2)
        .attr("visibility", "hidden");

     // Explanation Text Overlay
    const explanationGroup = svg.append("g").attr("opacity", 0);
    const explanationRect = explanationGroup.append("rect")
         .attr("rx", 5).attr("ry", 5)
         .style("fill", overlayTextStyle.bgColor);
    const explanationTextElement = explanationGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height * 0.9)
        .attr("text-anchor", overlayTextStyle.anchor)
        .style("font-size", overlayTextStyle.fontSize)
        .style("fill", overlayTextStyle.fill)
        .text(explanationText);
    // Adjust rect size based on text
    const explanationBBox = explanationTextElement.node().getBBox();
    explanationRect
        .attr("x", explanationBBox.x - overlayTextStyle.padding)
        .attr("y", explanationBBox.y - overlayTextStyle.padding)
        .attr("width", explanationBBox.width + 2 * overlayTextStyle.padding)
        .attr("height", explanationBBox.height + 2 * overlayTextStyle.padding);

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 1000 // Adjust base duration as needed for 15-20s total
    });

    // Timestamp 0:00 - 0:05: Show large schema
    tl.add({
        targets: schemaGroup.node(),
        opacity: [0, 1],
        duration: 1000 // 1 second fade in
    }, 0);

    // Timestamp 0:05 - 0:10: Show question & Highlight sweep
    tl.add({
        targets: questionElement.node(),
        opacity: [0, 1],
        duration: 500
    }, 1000); // Start after 1 second (relative to start)

    tl.add({
        targets: highlightSweep.node(),
        visibility: 'visible',
        translateX: [0, width - 50],
        opacity: [0.2, 0.2, 0], // Sweep and fade out
        duration: 3000,
        easing: 'linear'
    }, 1500); // Start 0.5s after question appears

    // Timestamp 0:10 - 0:15: Dim all, highlight subset
    tl.add({
        targets: '.large-schema .schema-box, .large-schema .schema-line',
        opacity: 0.15,
        duration: 1000,
        delay: anime.stagger(5) // Stagger dimming slightly
    }, 4000); // Start after sweep finishes

    tl.add({
        targets: relevantIndices.map(id => `#box-${id}`),
        opacity: 1,
        stroke: highlightStyle.color,
        strokeWidth: highlightStyle.strokeWidth,
        duration: 800,
        delay: anime.stagger(50)
    }, 4500); // Start highlighting subset shortly after dimming starts
    // Highlight relevant connections too (optional)
    // tl.add({...}, 4500);

    // Explanation Overlay (appears gradually during 0:05 - 0:15)
    tl.add({
        targets: explanationGroup.node(),
        opacity: [0, 1],
        duration: 3000 // Appear slowly over the relevant period
    }, 1500); // Start when sweep starts

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushChallengeVisual(containerSelector, replayButtonSelector);
    }
} 