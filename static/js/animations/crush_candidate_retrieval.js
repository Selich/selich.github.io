function renderCrushCandidateRetrieval(containerSelector, replayButtonSelector) {
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
    const schemaBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 };
    const schemaTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const schemaTableStyle = { fontWeight: "bold", fill: "#005073" };
    const probeHighlightStyle = { color: "#fd7e14" }; // Orange text color
    const actualSchemaBoxStyle = { fill: "#e9ecef", stroke: "#ced4da", strokeWidth: 0.3, rx: 1, size: 6 };
    const actualSchemaConnectStyle = { stroke: "#adb5bd", strokeWidth: 0.2 };
    const rayStyle = { stroke: "#ffc107", strokeWidth: 1, opacity: 0.7 }; // Yellow search rays
    const candidateHighlightStyle = { fill: "#cfe9fc", stroke: "#90c0de", strokeWidth: 1 }; // Blue highlight for candidates
    const candidateGroupHighlight = { stroke: "#0d6efd", strokeWidth: 2, strokeDasharray: "5,3" }; // Dashed blue outline for group
    const explanationTextStyle = { fontSize: "10px", fill: "#495057", anchor: "start", baseline: "hanging" };
    const indexIlluminateStyle = { fill: "#cfe9fc", // Light blue fill
                                   stroke: "#90c0de", // Blue stroke
                                   strokeWidth: 1.5 }; // Make highlight thicker
    const connectionLineStyle = { stroke: arrowStyle.stroke, strokeWidth: 0.8, strokeDasharray: "3,3", opacity: 0.6 }; // Ensure opacity is set

    // --- Layout & Data ---
    const hallucinatedSchemaData = [
        { name: "Club", x: 0, y: 0, attrs: ["(Name, id, ...)"] },
        { name: "member_of_club", x: 0, y: 0, attrs: ["(club_id, student_id)"] },
        { name: "Student", x: 0, y: 0, attrs: ["(id, age)"] }
    ];
    const schemaLayout = {
        startX: width * 0.1,
        startY: height * 0.15,
        width: width * 0.8,
        spacing: width * 0.05
    };
    const numSchemaBoxes = hallucinatedSchemaData.length;
    const schemaBoxWidth = (schemaLayout.width - (numSchemaBoxes - 1) * schemaLayout.spacing) / numSchemaBoxes;
    hallucinatedSchemaData.forEach((d, i) => {
        d.x = schemaLayout.startX + i * (schemaBoxWidth + schemaLayout.spacing) + schemaBoxWidth / 2;
        d.y = schemaLayout.startY;
        d.width = schemaBoxWidth;
        d.height = 50; // Fixed height
        d.probePoints = [{ text: d.name, yOffset: -d.height / 2 + 15 }, ...d.attrs.map((attr, idx) => ({ text: attr, yOffset: 5 + idx * 14 }))];
    });

    const actualSchemaArea = { x: width * 0.05, y: height * 0.4, w: width * 0.9, h: height * 0.5 };
    const numActualBoxes = 250; // Dense actual schema representation
    const actualSchemaNodesData = d3.range(numActualBoxes).map(i => ({
        id: i,
        x: actualSchemaArea.x + (Math.random() * actualSchemaArea.w),
        y: actualSchemaArea.y + (Math.random() * actualSchemaArea.h),
        isCandidate: false
    }));

    // Create random connections for actual schema
    const actualConnectionsData = [];
    for(let i = 0; i < numActualBoxes * 0.8; i++) {
        const sourceIndex = Math.floor(Math.random() * numActualBoxes);
        const targetIndex = Math.floor(Math.random() * numActualBoxes);
        if (sourceIndex !== targetIndex) {
            actualConnectionsData.push({ source: actualSchemaNodesData[sourceIndex], target: actualSchemaNodesData[targetIndex] });
        }
    }

    // Map probes to candidate indices (example)
    const probeToCandidatesMap = new Map();
    probeToCandidatesMap.set("Club", [10, 25, 30]);
    probeToCandidatesMap.set("(Name, id, ...)", [11, 26, 31, 45]);
    probeToCandidatesMap.set("member_of_club", [80, 95, 110]);
    probeToCandidatesMap.set("(club_id, student_id)", [81, 96, 111, 130]);
    probeToCandidatesMap.set("Student", [180, 195, 210]);
    probeToCandidatesMap.set("(id, age)", [181, 196, 211, 230]);

    let allCandidateIndices = new Set();
    probeToCandidatesMap.forEach(indices => indices.forEach(idx => allCandidateIndices.add(idx)));
    allCandidateIndices.forEach(idx => {
        if(actualSchemaNodesData[idx]) actualSchemaNodesData[idx].isCandidate = true;
    });

    // --- Elements ---
    // Actual Schema Connections (faint background)
    svg.append("g").selectAll(".actual-conn")
        .data(actualConnectionsData).join("line")
        .attr("class", "actual-conn")
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
        .style("stroke", actualSchemaConnectStyle.stroke).style("stroke-width", actualSchemaConnectStyle.strokeWidth)
        .attr("opacity", 0.3);

    // Actual Schema Boxes
    const actualSchemaGroup = svg.append("g");
    const actualSchemaBoxes = actualSchemaGroup.selectAll(".actual-schema-box")
        .data(actualSchemaNodesData).join("rect")
        .attr("class", d => d.isCandidate ? "actual-schema-box candidate" : "actual-schema-box")
        .attr("x", d => d.x - actualSchemaBoxStyle.size / 2).attr("y", d => d.y - actualSchemaBoxStyle.size / 2)
        .attr("width", actualSchemaBoxStyle.size).attr("height", actualSchemaBoxStyle.size)
        .attr("rx", actualSchemaBoxStyle.rx)
        .style("fill", actualSchemaBoxStyle.fill).style("stroke", actualSchemaBoxStyle.stroke)
        .style("stroke-width", actualSchemaBoxStyle.strokeWidth).attr("opacity", 0.8);

    // Hallucinated Schema Elements
    const hallucinatedSchemaGroup = svg.append("g");
    const hallucinatedBoxes = [];
    hallucinatedSchemaData.forEach(d => {
        const boxGroup = hallucinatedSchemaGroup.append("g")
            .attr("transform", `translate(${d.x}, ${d.y})`);
        boxGroup.append("rect") // Background rect
            .attr("x", -d.width / 2).attr("y", -d.height / 2)
            .attr("width", d.width).attr("height", d.height)
            .attr("rx", schemaBoxStyle.rx)
            .style("fill", schemaBoxStyle.fill).style("stroke", schemaBoxStyle.stroke);

        const probeTextElements = [];
        d.probePoints.forEach(p => {
           const textEl = boxGroup.append("text") // Ensure text is appended to boxGroup
               .attr("y", p.yOffset)
               .text(p.text)
               .attr("text-anchor", schemaTextStyle.anchor)
               .style("font-size", schemaTextStyle.fontSize)
               .style("fill", schemaTextStyle.fill)
               .style("font-family", schemaTextStyle.fontFam)
               .style("font-weight", p.text === d.name ? schemaTableStyle.fontWeight : 'normal')
               .attr("dominant-baseline", "middle")
               .datum(p);
            probeTextElements.push(textEl);
        });
        hallucinatedBoxes.push({ group: boxGroup, probes: probeTextElements });
    });

    // Candidate Group Outline (initially hidden)
    const candidateOutline = svg.append("rect")
        .attr("rx", 10)
        .style("fill", "none")
        .style("stroke", candidateGroupHighlight.stroke)
        .style("stroke-width", candidateGroupHighlight.strokeWidth)
        .style("stroke-dasharray", candidateGroupHighlight.strokeDasharray)
        .attr("opacity", 0);

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
        .text("Hallucinated elements probe the actual schema via dense retrieval, highlighting a candidate set.")
        .style("font-size", explanationTextStyle.fontSize).style("fill", explanationTextStyle.fill).attr("dominant-baseline", explanationTextStyle.baseline);

    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 1000 // Default duration, overridden below
    });

    let globalOffset = 500; // Start after a small delay

    // Ensure base elements are visible (Add fade-in if needed)
    tl.add({ targets: [hallucinatedSchemaGroup.node(), actualSchemaGroup.node()], opacity: 1, duration: 300, offset: 0 });

    hallucinatedBoxes.forEach(boxData => {
        boxData.probes.forEach(probeText => {
            const probeNode = probeText.node();
            const probeDatum = probeText.datum();
            const probeBBox = probeNode.getBBox();
            // Get coordinates relative to the SVG, not just the group
            const probeMatrix = probeNode.getCTM();
            const startX = probeMatrix.e + probeBBox.x + probeBBox.width / 2;
            const startY = probeMatrix.f + probeBBox.y + probeBBox.height / 2;

            const candidateIndices = probeToCandidatesMap.get(probeDatum.text) || [];
            const targetNodes = candidateIndices.map(idx => actualSchemaBoxes.nodes()[idx]).filter(Boolean);

            if (targetNodes.length > 0) {
                // Highlight probe text
                tl.add({
                    targets: probeNode,
                    fill: [anime.get(probeNode, 'fill'), probeHighlightStyle.color, anime.get(probeNode, 'fill')],
                    duration: 800,
                    offset: globalOffset
                }, globalOffset);

                // Group animations for rays, highlights, and dashed lines per probe
                targetNodes.forEach(targetNode => {
                    const targetDatum = d3.select(targetNode).datum();
                    const endX = targetDatum.x; // Use stored coords
                    const endY = targetDatum.y;

                    // Search Ray Line
                    const ray = svg.append("line")
                        .attr("x1", startX).attr("y1", startY)
                        .attr("x2", startX).attr("y2", startY)
                        .style("stroke", rayStyle.stroke).style("stroke-width", rayStyle.strokeWidth)
                        .attr("opacity", 0).lower(); // Draw behind other elements if needed

                    // Dashed Connecting Line (create upfront, hide)
                    const connLine = svg.append("line")
                         .attr("x1", startX).attr("y1", startY)
                         .attr("x2", endX).attr("y2", endY)
                         .style("stroke", connectionLineStyle.stroke)
                         .style("stroke-width", connectionLineStyle.strokeWidth)
                         .style("stroke-dasharray", connectionLineStyle.strokeDasharray)
                         .attr("opacity", 0).lower();

                    // Animate ray extension
                    tl.add({
                        targets: ray.node(),
                        x2: endX, y2: endY,
                        opacity: [0, rayStyle.opacity, 0],
                        duration: 600,
                        easing: 'easeOutQuad'
                    }, globalOffset + 100);

                    // Highlight target node briefly
                    tl.add({
                        targets: targetNode,
                        fill: [actualSchemaBoxStyle.fill, candidateHighlightStyle.fill, actualSchemaBoxStyle.fill],
                        stroke: [actualSchemaBoxStyle.stroke, candidateHighlightStyle.stroke, actualSchemaBoxStyle.stroke],
                        strokeWidth: [actualSchemaBoxStyle.strokeWidth, candidateHighlightStyle.strokeWidth, actualSchemaBoxStyle.strokeWidth],
                        duration: 700,
                        easing: 'linear'
                        // Offset slightly later to ensure visibility
                    }, globalOffset + 400);

                    // Animate dashed connecting line (fade in/out during highlight)
                    tl.add({
                         targets: connLine.node(),
                         opacity: [0, connectionLineStyle.opacity, 0],
                         duration: 700,
                         easing: 'linear'
                     }, globalOffset + 400); // Sync with target highlight
                });
                globalOffset += 500; // Stagger probes
            }
        });
    });

    // Calculate bounding box AFTER main timeline part starts
    let minX = width, maxX = 0, minY = height, maxY = 0;
    actualSchemaBoxes.filter(".candidate").each(function() {
        const bbox = this.getBBox();
        // Use getBoundingClientRect for position relative to viewport if needed, or CTM
        const ct = this.getCTM();
        const x = ct.e + bbox.x;
        const y = ct.f + bbox.y;

        if (x < minX) minX = x;
        if (x + bbox.width > maxX) maxX = x + bbox.width;
        if (y < minY) minY = y;
        if (y + bbox.height > maxY) maxY = y + bbox.height;
    });

     // Add candidate outline animation
    tl.add({
        targets: candidateOutline.node(),
        // Use function-based value setting for attributes if calculated dynamically
        x: minX - 10,
        y: minY - 10,
        width: maxX - minX + 20,
        height: maxY - minY + 20,
        opacity: [0, 1],
        duration: 800
    }, globalOffset + 500); // After all probes

    // Show Explanation
    tl.add({
        targets: explanationGroup.node(),
        opacity: 1,
        duration: 1000
    }, globalOffset + 100); // During probing

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushCandidateRetrieval(containerSelector, replayButtonSelector);
    }
} 