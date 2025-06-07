function renderCrushCollectiveRetrievalAnimation(containerSelector, replayButtonSelector) {
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

    // --- Config --- Updated Styles
    const candidateCardStyle = { fill: "#d1c4e9", stroke: "#5e35b1", strokeWidth: 1, rx: 8, width: 130, height: 35 }; // Purple-ish cards
    const textStyle = { fontSize: "10px", fill: "#333", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const labelTextStyle = { fontSize: "9px", fill: "#6c757d", anchor: "middle", baseline: "middle", fontStyle: "italic" };
    const connectionLineStyle = { stroke: "#bdbdbd", strokeWidth: 1 };
    const selectedStyle = { fill: "#c8e6c9", stroke: "#2e7d32", strokeWidth: 2 }; // Greenish selected
    const selectedConnectionStyle = { stroke: "#2e7d32", strokeWidth: 1.5 };
    const dimmedOpacity = 0.35; // Slightly less dim
    const scoreScale = d3.scaleLinear().domain([0.6, 1.0]).range([0.9, 1.05]); // Adjusted scale range

    // Example candidate elements retrieved from probing
    const candidateData = [
        // Group 1 (from Club)
        { id: 1, text: "organizations.club_name", x: width * 0.2, y: height * 0.25, group: 1, score: 0.9, final: true },
        { id: 2, text: "community.club_title", x: width * 0.2, y: height * 0.5, group: 1, score: 0.8, final: false },
        { id: 3, text: "clubs.id", x: width * 0.2, y: height * 0.75, group: 1, score: 0.85, final: true },
        // Group 2 (from member_of_club)
        { id: 4, text: "club_membership.club_fk", x: width * 0.5, y: height * 0.25, group: 2, score: 0.7, final: true },
        { id: 5, text: "member_db.member_club_id", x: width * 0.5, y: height * 0.5, group: 2, score: 0.6, final: false },
        { id: 6, text: "club_membership.student_fk", x: width * 0.5, y: height * 0.75, group: 2, score: 0.75, final: true },
        // Group 3 (from Student)
        { id: 7, text: "persons.student_id", x: width * 0.8, y: height * 0.25, group: 3, score: 0.88, final: true },
        { id: 8, text: "users.age", x: width * 0.8, y: height * 0.5, group: 3, score: 0.92, final: true },
        { id: 9, text: "students.years_old", x: width * 0.8, y: height * 0.75, group: 3, score: 0.7, final: false },
        // { id: 10, text: "profiles.birth_year", x: width * 0.8, y: height * 0.8, group: 3, score: 0.65, final: false } // Removed one for layout
    ];

    // Define connections (example FK relationships)
    const connections = [
        { source: 3, target: 4 }, // clubs.id -> club_membership.club_fk
        { source: 6, target: 7 }  // club_membership.student_fk -> persons.student_id
    ];

    const nodeMap = new Map(candidateData.map(d => [d.id, d]));

    // --- Elements ---
    // Faint Hallucinated Labels (Positioned better)
    const groupLabels = svg.append("g").attr("opacity", 0);
    groupLabels.append("text").text("from: Club(*)").attr("x", width * 0.2).attr("y", height * 0.1).style("font-size", labelTextStyle.fontSize).attr("text-anchor", labelTextStyle.anchor).style("fill", labelTextStyle.fill);
    groupLabels.append("text").text("from: member_of_club(*)").attr("x", width * 0.5).attr("y", height * 0.1).style("font-size", labelTextStyle.fontSize).attr("text-anchor", labelTextStyle.anchor).style("fill", labelTextStyle.fill);
    groupLabels.append("text").text("from: Student(*)").attr("x", width * 0.8).attr("y", height * 0.1).style("font-size", labelTextStyle.fontSize).attr("text-anchor", labelTextStyle.anchor).style("fill", labelTextStyle.fill);

    // Connection Lines
    const connectionGroup = svg.append("g").lower(); // Draw lines behind nodes
    const connectionLines = connectionGroup.selectAll(".connection-line")
        .data(connections)
        .join("line")
        .attr("class", "connection-line")
        .attr("x1", d => nodeMap.get(d.source).x)
        .attr("y1", d => nodeMap.get(d.source).y)
        .attr("x2", d => nodeMap.get(d.target).x)
        .attr("y2", d => nodeMap.get(d.target).y)
        .style("stroke", connectionLineStyle.stroke)
        .style("stroke-width", connectionLineStyle.strokeWidth)
        .attr("opacity", 0);

    // Candidate Cards
    const candidateGroup = svg.append("g");
    const candidateNodes = candidateGroup.selectAll(".candidate-node")
        .data(candidateData)
        .join("g")
        .attr("class", "candidate-node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`) // Start at final position
        .attr("opacity", 0); // Start invisible

    candidateNodes.append("rect")
        .attr("x", -candidateCardStyle.width / 2)
        .attr("y", -candidateCardStyle.height / 2)
        .attr("width", candidateCardStyle.width)
        .attr("height", candidateCardStyle.height)
        .attr("rx", candidateCardStyle.rx)
        .style("fill", candidateCardStyle.fill)
        .style("stroke", candidateCardStyle.stroke)
        .style("stroke-width", candidateCardStyle.strokeWidth)
        .style("filter", d => `brightness(${90 + d.score * 15}%)`); // Adjusted brightness scale

    candidateNodes.append("text")
        .text(d => d.text)
        .attr("text-anchor", textStyle.anchor)
        .attr("dominant-baseline", textStyle.baseline)
        .style("font-size", textStyle.fontSize)
        .style("font-family", textStyle.fontFam)
        .style("fill", textStyle.fill);

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 800
    });

    tl
    // 1. Show group labels faintly
    .add({ targets: groupLabels.node(), opacity: 0.4, duration: 400 }, 0)
    // 2. Show candidates initially (fade in)
    .add({
        targets: candidateNodes.nodes(),
        opacity: 1,
        scale: d => scoreScale(d.__data__.score), // Scale based on score
        delay: anime.stagger(60, { start: 200 })
    })
    // 3. Fade in connection lines
    .add({
        targets: connectionLines.nodes(),
        opacity: 0.5,
        delay: anime.stagger(100)
    }, '-=600')
    // 4. Filter/Select - Dim non-final candidates (Target the whole group)
    .add({
        targets: candidateNodes.filter(d => !d.final).nodes(),
        opacity: dimmedOpacity, // Dim the entire group
        scale: function(el) { // Animate from current scale to 0.9
            const currentScale = el.transform.baseVal.consolidate().matrix.a; // Get current scale
            return [currentScale, 0.9];
        },
        duration: 600,
        delay: anime.stagger(30)
    }, '+=800')
    // Dim connections involving non-final nodes
    .add({
        targets: connectionLines.filter(d => !nodeMap.get(d.source).final || !nodeMap.get(d.target).final).nodes(),
        opacity: dimmedOpacity * 0.5,
        strokeWidth: 0.5,
        duration: 600
    }, '-=600')
    // 5. Highlight final selected candidates (Target the group for opacity/scale, rect for style)
    .add({
        targets: candidateNodes.filter(d => d.final).nodes(),
        opacity: 1, // Ensure full opacity
        scale: 1.05, // Slightly larger
        // Optional: Add slight movement
        // translateX: (el) => d3.select(el).datum().x + (Math.random() - 0.5) * 5,
        // translateY: (el) => d3.select(el).datum().y + 5,
        duration: 700
    }, '-=400')
    .add({
        targets: candidateNodes.filter(d => d.final).select("rect").nodes(),
        fill: selectedStyle.fill,
        stroke: selectedStyle.stroke,
        strokeWidth: selectedStyle.strokeWidth,
        filter: 'brightness(100%)',
        duration: 700
    }, '-=700')
    // 6. Highlight connections between selected nodes
    .add({
        targets: connectionLines.filter(d => nodeMap.get(d.source).final && nodeMap.get(d.target).final).nodes(),
        stroke: selectedConnectionStyle.stroke,
        strokeWidth: selectedConnectionStyle.strokeWidth,
        opacity: 1,
        duration: 700
    }, '-=700');

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushCollectiveRetrievalAnimation(containerSelector, replayButtonSelector);
    }
}
