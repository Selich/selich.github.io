function renderCrushCollectiveSelection(containerSelector, replayButtonSelector) {
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

    // --- Styles ---
    const candidateCardStyle = { fill: "#cfe9fc", stroke: "#90c0de", strokeWidth: 1, rx: 6, width: 120, height: 30 }; // Blueish candidates
    const cardTextStyle = { fontSize: "10px", fill: "#333", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const scoreTextStyle = { fontSize: "8px", fill: "#6c757d", anchor: "end", baseline: "middle" };
    const faintConnectionStyle = { stroke: "#adb5bd", strokeWidth: 0.5, strokeDasharray: "2,2", opacity: 0.4 };
    const strongConnectionStyle = { stroke: "#0d6efd", strokeWidth: 1.5 }; // Strong blue for selected connections
    const selectedStyle = { fill: "#d1e7dd", stroke: "#198754", strokeWidth: 1.5 }; // Green selected (Applied LATER)
    const finalSubsetPos = { x: width / 2, y: height * 0.8 }; // Position for final subset
    const dimOpacity = 0.2;
    const explanationTextStyle = { fontSize: "10px", fill: "#495057", anchor: "start", baseline: "hanging" };

    // Example candidate data (more detailed than previous)
    const candidateData = [
        { id: 1, text: "clubs.club_name", x: width * 0.2, y: height * 0.2, score: 0.9, connected: true, final: true },
        { id: 2, text: "teams.team_name", x: width * 0.2, y: height * 0.4, score: 0.7, connected: false, final: false },
        { id: 3, text: "clubs.club_id", x: width * 0.2, y: height * 0.6, score: 0.85, connected: true, final: true },
        { id: 4, text: "club_membership.club_fk", x: width * 0.5, y: height * 0.2, score: 0.8, connected: true, final: true },
        { id: 5, text: "joins.club_reference", x: width * 0.5, y: height * 0.4, score: 0.6, connected: false, final: false },
        { id: 6, text: "club_membership.student_fk", x: width * 0.5, y: height * 0.6, score: 0.78, connected: true, final: true },
        { id: 7, text: "students.student_id", x: width * 0.8, y: height * 0.2, score: 0.88, connected: true, final: true },
        { id: 8, text: "students.age", x: width * 0.8, y: height * 0.4, score: 0.92, connected: true, final: true }, // Assume age is in students table
        { id: 9, text: "persons.years_old", x: width * 0.8, y: height * 0.6, score: 0.7, connected: false, final: false },
    ];
    const nodeMap = new Map(candidateData.map(d => [d.id, d]));
    const connections = [
        { source: 1, target: 3 }, // Within clubs table
        { source: 3, target: 4 }, // FK: clubs.club_id -> club_membership.club_fk
        { source: 4, target: 6 }, // Within club_membership table
        { source: 6, target: 7 }, // FK: club_membership.student_fk -> students.student_id
        { source: 7, target: 8 }, // Within students table
        // Add some irrelevant connections for visual clutter
        { source: 2, target: 5 },
        { source: 5, target: 9 }
    ];

    // --- Elements ---
    // Faint background connections
    const faintConnectionGroup = svg.append("g").lower();
    const faintConnections = faintConnectionGroup.selectAll(".faint-conn")
        .data(connections).join("line")
        .attr("class", "faint-conn")
        .attr("x1", d => nodeMap.get(d.source).x).attr("y1", d => nodeMap.get(d.source).y)
        .attr("x2", d => nodeMap.get(d.target).x).attr("y2", d => nodeMap.get(d.target).y)
        .style("stroke", faintConnectionStyle.stroke).style("stroke-width", faintConnectionStyle.strokeWidth)
        .style("stroke-dasharray", faintConnectionStyle.strokeDasharray).attr("opacity", 0);

    // Candidate Cards
    const candidateGroup = svg.append("g");
    const candidateNodes = candidateGroup.selectAll(".candidate-node")
        .data(candidateData).join("g")
        .attr("class", d => d.final ? "candidate-node final" : "candidate-node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .attr("opacity", 0);

    candidateNodes.append("rect")
        .attr("x", -candidateCardStyle.width / 2).attr("y", -candidateCardStyle.height / 2)
        .attr("width", candidateCardStyle.width).attr("height", candidateCardStyle.height)
        .attr("rx", candidateCardStyle.rx)
        .style("fill", candidateCardStyle.fill)
        .style("stroke", candidateCardStyle.stroke)
        .style("stroke-width", candidateCardStyle.strokeWidth);

    candidateNodes.append("text") // Main text
        .attr("y", -2)
        .text(d => d.text)
        .attr("text-anchor", cardTextStyle.anchor).attr("dominant-baseline", cardTextStyle.baseline)
        .style("font-size", cardTextStyle.fontSize).style("font-family", cardTextStyle.fontFam).style("fill", cardTextStyle.fill);

    candidateNodes.append("text") // Score text
        .attr("y", 10)
        .attr("x", candidateCardStyle.width / 2 - 5)
        .text(d => `(Score: ${d.score.toFixed(2)})`)
        .attr("text-anchor", scoreTextStyle.anchor).attr("dominant-baseline", scoreTextStyle.baseline)
        .style("font-size", scoreTextStyle.fontSize).style("fill", scoreTextStyle.fill)
        .attr("opacity", 0);

    // Stronger connection lines (drawn but hidden)
    const strongConnectionGroup = svg.append("g").lower();
    const strongConnections = strongConnectionGroup.selectAll(".strong-conn")
       .data(connections.filter(d => nodeMap.get(d.source).final && nodeMap.get(d.target).final))
       .join("line")
       .attr("class", "strong-conn")
       .attr("x1", d => nodeMap.get(d.source).x).attr("y1", d => nodeMap.get(d.source).y)
       .attr("x2", d => nodeMap.get(d.target).x).attr("y2", d => nodeMap.get(d.target).y)
       .style("stroke", strongConnectionStyle.stroke).style("stroke-width", strongConnectionStyle.strokeWidth)
       .attr("opacity", 0);

    // Explanation Text
    const explanationGroup = svg.append("g")
        .attr("transform", `translate(${width * 0.05}, ${height * 0.95})`)
        .attr("opacity", 0);
     explanationGroup.append("rect")
        .attr("x", -5).attr("y", -5)
        .attr("width", width * 0.9 + 10).attr("height", 30)
        .attr("rx", 3).style("fill", "rgba(255, 255, 255, 0.8)");
    explanationGroup.append("text")
        .attr("x", 0).attr("y", 0)
        .text("Collective retrieval selects a connected, high-recall subset based on relevance and relationships.")
        .style("font-size", explanationTextStyle.fontSize).style("fill", explanationTextStyle.fill).attr("dominant-baseline", explanationTextStyle.baseline);

    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 1000
    });

    let offset = 0;

    // Timestamp 0:00 - 0:05: Show candidates and faint connections
    tl.add({
        targets: candidateNodes.nodes(),
        opacity: 1,
        scale: [0.8, 1],
        delay: anime.stagger(50),
        duration: 800,
        offset: offset
    }, offset);
    tl.add({
        targets: faintConnections.nodes(),
        opacity: faintConnectionStyle.opacity,
        duration: 500
    }, offset + 300);
    offset += 1000;

    // Timestamp 0:05 - 0:15: Evaluation and Filtering
    // Show scores
    tl.add({
        targets: candidateNodes.selectAll(".score-text").nodes(),
        opacity: [0, 1],
        duration: 500
    }, offset);
    // Highlight pulse based on score/connected
    tl.add({
        targets: candidateNodes.nodes(),
        scale: function(el) {
            const d = d3.select(el).datum();
            return nodeMap.get(d.id).connected ? [1, 1.1, 1] : [1, 1, 1];
        },
        duration: 800,
        delay: anime.stagger(30),
        offset: offset + 500
    }, offset + 500);
    tl.add({
         targets: candidateNodes.select("rect").nodes(),
         strokeWidth: function(el) {
            const d = d3.select(el.parentNode).datum();
            return nodeMap.get(d.id).connected ? [candidateCardStyle.strokeWidth, 2, candidateCardStyle.strokeWidth] : candidateCardStyle.strokeWidth;
         },
         stroke: function(el) {
            const d = d3.select(el.parentNode).datum();
            return nodeMap.get(d.id).connected ? [candidateCardStyle.stroke, strongConnectionStyle.stroke, candidateCardStyle.stroke] : candidateCardStyle.stroke;
         },
         duration: 800,
         delay: anime.stagger(30),
         offset: offset + 500
    }, offset + 500);

    offset += 1500;

    // Filter - Dim non-final
    tl.add({
        targets: candidateNodes.filter(":not(.final)").nodes(),
        opacity: dimOpacity,
        scale: 0.9,
        duration: 800
    }, offset);
    // Dim faint connections connected to non-final nodes
    tl.add({
        targets: faintConnections.filter(d => !nodeMap.get(d.source).final || !nodeMap.get(d.target).final).nodes(),
        opacity: dimOpacity * 0.5,
        duration: 800
    }, offset);
    offset += 1000;

    // Timestamp 0:15 - 0:20: Highlight final subset and connections
    tl.add({
        targets: candidateNodes.filter(".final").nodes(),
        opacity: 1,
        scale: 1.05,
        duration: 600
    }, offset);
    tl.add({
        targets: candidateNodes.filter(".final").select("rect").nodes(),
        fill: selectedStyle.fill,
        stroke: selectedStyle.stroke,
        strokeWidth: selectedStyle.strokeWidth,
        duration: 600
    }, offset);
    // Hide irrelevant faint connections completely
     tl.add({
        targets: faintConnections.filter(d => !nodeMap.get(d.source).final || !nodeMap.get(d.target).final).nodes(),
        opacity: 0,
        duration: 300
    }, offset);
    // Show strong connections for final subset
    tl.add({
        targets: strongConnections.nodes(),
        opacity: 1,
        duration: 600
    }, offset + 200);
    offset += 1000;

     // Show Explanation
    tl.add({
        targets: explanationGroup.node(),
        opacity: 1,
        duration: 1000
    }, offset - 2000);

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushCollectiveSelection(containerSelector, replayButtonSelector);
    }
} 