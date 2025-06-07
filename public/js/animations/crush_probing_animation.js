function renderCrushProbingAnimation(containerSelector, replayButtonSelector) {
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
    const schemaBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 };
    const schemaTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const schemaTableStyle = { fontWeight: "bold", fill: "#005073" };
    const probeHighlightStyle = { color: "#fd7e14", // Orange text color
                                  outlineColor: "#ffc107", // Yellow outline
                                  outlineWidth: 1.5 };
    const indexBoxStyle = { fill: "#e9ecef", stroke: "#ced4da", strokeWidth: 0.5, rx: 1, width: 10, height: 7 }; // Lighter grid
    const arrowStyle = { stroke: "#6c757d", strokeWidth: 1, markerEnd: "url(#arrowhead-probing)" }; // Grey arrow
    const indexIlluminateStyle = { fill: "#cfe9fc", // Light blue fill
                                   stroke: "#90c0de", // Blue stroke
                                   strokeWidth: 1 };
    const connectionLineStyle = { stroke: arrowStyle.stroke, strokeWidth: 0.8, strokeDasharray: "3,3" }; // Dashed arrow color

    // Define schema parts with styles for highlighting
    const hallucinatedSchemaParts = [
      { text: "Club", style: schemaTableStyle, isTable: true },
      { text: "(Name, id, ...)", style: schemaTextStyle, isTable: false },
      { text: "member_of_club", style: schemaTableStyle, isTable: true },
      { text: "(club_id, student_id)", style: schemaTextStyle, isTable: false },
      { text: "Student", style: schemaTableStyle, isTable: true },
      { text: "(id, age)", style: schemaTextStyle, isTable: false },
    ];

    const schemaPos = { x: width * 0.25, y: height * 0.3 }; // Upper part
    const indexPos = { x: width * 0.65, y: height * 0.6 }; // Lower part
    const indexGrid = { rows: 12, cols: 18, spacing: 2 }; // Make grid look extensive

    // --- Elements ---
    // Unique marker ID
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-probing")
        .attr("viewBox", "0 -5 10 10").attr("refX", 5).attr("refY", 0)
        .attr("markerWidth", 4).attr("markerHeight", 4).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", arrowStyle.stroke);

    // 1. Hallucinated Schema Box (Assume visible or fade in)
    const schemaGroup = svg.append("g").attr("transform", `translate(${schemaPos.x}, ${schemaPos.y})`).attr("opacity", 1);
    const sBoxWidth = width * 0.4; // Adjust width as needed
    const sBoxHeight = 70;
    schemaGroup.append("rect")
        .attr("x", -sBoxWidth / 2)
        .attr("y", -sBoxHeight / 2)
        .attr("width", sBoxWidth)
        .attr("height", sBoxHeight)
        .style("fill", schemaBoxStyle.fill).style("stroke", schemaBoxStyle.stroke).style("stroke-width", schemaBoxStyle.strokeWidth).attr("rx", schemaBoxStyle.rx);

    const schemaTextElement = schemaGroup.append("text")
        .attr("x", 0) // Centered in the group
        .attr("y", 0) // Vertically center later
        .attr("text-anchor", schemaTextStyle.anchor)
        .attr("dominant-baseline", "middle");

    const spans = [];
    let yOffset = -(hallucinatedSchemaParts.length - 1) * 10 / 2; // Calculate starting Y offset for vertical centering

    hallucinatedSchemaParts.forEach((part, i) => {
        const span = schemaTextElement.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? yOffset : 15) // Adjust line spacing
            .style("font-family", part.style.fontFam || schemaTextStyle.fontFam)
            .style("font-size", part.style.fontSize || schemaTextStyle.fontSize)
            .style("fill", part.style.fill || schemaTextStyle.fill)
            .style("font-weight", part.style.fontWeight || 'normal')
            .text(part.text)
            .datum(part); // Store original data
        spans.push(span);
    });

    // 2. Database Index Representation (Large Grid)
    const indexGroup = svg.append("g").attr("transform", `translate(${indexPos.x}, ${indexPos.y})`).attr("opacity", 0);
    const indexBoxes = [];
    const totalIndexWidth = indexGrid.cols * (indexBoxStyle.width + indexGrid.spacing) - indexGrid.spacing;
    const totalIndexHeight = indexGrid.rows * (indexBoxStyle.height + indexGrid.spacing) - indexGrid.spacing;
    const indexStartX = -totalIndexWidth / 2;
    const indexStartY = -totalIndexHeight / 2;

    for (let r = 0; r < indexGrid.rows; r++) {
        for (let c = 0; c < indexGrid.cols; c++) {
            const x = indexStartX + c * (indexBoxStyle.width + indexGrid.spacing);
            const y = indexStartY + r * (indexBoxStyle.height + indexGrid.spacing);
            const box = indexGroup.append("rect")
                .attr("x", x).attr("y", y)
                .attr("width", indexBoxStyle.width).attr("height", indexBoxStyle.height)
                .style("fill", indexBoxStyle.fill).style("stroke", indexBoxStyle.stroke).style("stroke-width", indexBoxStyle.strokeWidth).attr("rx", indexBoxStyle.rx)
                .datum({ id: r * indexGrid.cols + c, x: x + indexBoxStyle.width / 2, y: y + indexBoxStyle.height / 2}); // Store id and center coords
            indexBoxes.push(box);
        }
    }
    // Add overall bounding box for the index grid for visual clarity
    indexGroup.insert("rect", ":first-child")
        .attr("x", indexStartX - 5)
        .attr("y", indexStartY - 5)
        .attr("width", totalIndexWidth + 10)
        .attr("height", totalIndexHeight + 10)
        .attr("rx", 3)
        .style("fill", "none")
        .style("stroke", "#e0e0e0")
        .style("stroke-width", 1);

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 600
    });

    // Mapping schema SPANS to target index boxes (example)
    // Indices should correspond to the box datum ids
    const probeTargetsMap = new Map();
    probeTargetsMap.set(spans[0].node(), [5, 20, 35, 50]); // Club -> targets indices
    probeTargetsMap.set(spans[1].node(), [6, 21, 36, 51]); // (Name, id, ...) -> ...
    probeTargetsMap.set(spans[2].node(), [63, 78, 93, 108, 123]); // member_of_club -> ...
    probeTargetsMap.set(spans[3].node(), [64, 79, 94, 109, 124]); // (club_id, student_id) -> ...
    probeTargetsMap.set(spans[4].node(), [140, 155, 170]); // Student -> ...
    probeTargetsMap.set(spans[5].node(), [141, 156, 171]); // (id, age) -> ...

    tl.add({ // Fade in index grid
        targets: indexGroup.node(),
        opacity: 1,
        duration: 500
    });

    let offset = 500; // Start time after grid fades in

    spans.forEach((span) => {
        const spanNode = span.node();
        const targetIndices = probeTargetsMap.get(spanNode) || [];
        const targetBoxes = targetIndices.map(index => indexBoxes[index]).filter(Boolean); // Get box nodes

        // Calculate start point from the span's bounding box (approx)
        const spanBBox = spanNode.getBBox();
        const startX = schemaPos.x + spanBBox.x + spanBBox.width / 2; // Center of the span
        const startY = schemaPos.y + spanBBox.y + spanBBox.height / 2;

        // Highlight the probe text (pulsing color)
        tl.add({
            targets: spanNode,
            fill: [anime.get(spanNode, 'fill'), probeHighlightStyle.color, anime.get(spanNode, 'fill')], // Pulse text color
            // Optionally add outline pulse:
            // stroke: [null, probeHighlightStyle.outlineColor, null],
            // strokeWidth: [0, probeHighlightStyle.outlineWidth, 0],
            duration: 800, // Slightly longer pulse
            easing: 'easeInOutQuad',
            offset: offset
        });

        // Animate arrows, illumination, and connection lines
        targetBoxes.forEach((targetBox) => {
            const targetData = targetBox.datum();
            const endX = indexPos.x + targetData.x - indexBoxStyle.width / 2; // Target left edge
            const endY = indexPos.y + targetData.y;

            // Create arrow (initially invisible and collapsed at span center)
            const arrow = svg.append("line")
                .attr("x1", startX).attr("y1", startY)
                .attr("x2", startX).attr("y2", startY)
                .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth)
                .attr("marker-end", arrowStyle.markerEnd)
                .attr("opacity", 0);

            // Animate arrow extension
            tl.add({
                targets: arrow.node(),
                x2: endX,
                y2: endY,
                opacity: 1,
                duration: 400,
                easing: 'easeOutQuad',
                offset: offset + 150 // Start arrow shortly after highlight begins
            });

            // Briefly illuminate the target box in the index
            tl.add({
                targets: targetBox.node(),
                fill: [indexBoxStyle.fill, indexIlluminateStyle.fill, indexBoxStyle.fill],
                stroke: [indexBoxStyle.stroke, indexIlluminateStyle.stroke, indexBoxStyle.stroke],
                strokeWidth: [indexBoxStyle.strokeWidth, indexIlluminateStyle.strokeWidth, indexBoxStyle.strokeWidth],
                duration: 600,
                easing: 'easeInQuad',
                offset: offset + 450 // Illuminate after arrow lands
            });

            // Draw dashed connecting line (fade in/out)
            const connLine = svg.append("line")
                 .attr("x1", startX).attr("y1", startY)
                 .attr("x2", endX).attr("y2", endY)
                 .style("stroke", connectionLineStyle.stroke).style("stroke-width", connectionLineStyle.strokeWidth)
                 .style("stroke-dasharray", connectionLineStyle.strokeDasharray)
                 .attr("opacity", 0);

            tl.add({
                 targets: connLine.node(),
                 opacity: [0, 0.6, 0], // Fade in/out
                 duration: 700,
                 easing: 'linear',
                 offset: offset + 500 // Show line during target highlight
             });
        });
        offset += 900; // Time for next probe sequence
    });


    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushProbingAnimation(containerSelector, replayButtonSelector);
    }
} 