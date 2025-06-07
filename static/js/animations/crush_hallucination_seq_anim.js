function renderCrushHallucinationSeqAnim(containerSelector, replayButtonSelector) {
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
    const participantBoxStyle = { fill: "#fff9db", stroke: "#ffe082", strokeWidth: 1, rx: 4, width: 150, height: 40 };
    const textStyle = { fontSize: "12px", fill: "#333", anchor: "middle", baseline: "middle" };
    const messageTextStyle = { fontSize: "10px", fill: "#555", anchor: "middle", baseline: "auto" };
    const noteTextStyle = { fontSize: "10px", fill: "#6c757d", anchor: "start", baseline: "hanging", fontStyle: "italic" };
    const arrowStyle = { stroke: "#333", strokeWidth: 1.5, markerEnd: "url(#arrowhead-seq)" };
    const dashArrowStyle = { stroke: "#555", strokeWidth: 1, markerEnd: "url(#arrowhead-seq)", strokeDasharray: "5,3" };

    // --- Layout ---
    const participants = [
        { id: "UQ", name: "User Question", x: width * 0.15, y: height * 0.15 },
        { id: "LLM", name: "Large Language Model (LLM)", x: width * 0.4, y: height * 0.15 },
        { id: "HS", name: "Hallucinated Schema", x: width * 0.65, y: height * 0.15 },
        // { id: "EO", name: "Explanation Overlay", x: width * 0.9, y: height * 0.15 }, // Not directly used in messages
    ];
    const lifelineYEnd = height * 0.85;
    const messageY1 = height * 0.35;
    const messageY2 = height * 0.55;
    const messageY3 = height * 0.75;

    const participantMap = new Map(participants.map(p => [p.id, p]));

    // --- Elements ---
    // Arrowhead Marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-seq")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 9).attr("refY", 0).attr("orient", "auto")
        .attr("markerWidth", 5).attr("markerHeight", 5)
        .attr("xoverflow", "visible")
        .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", arrowStyle.stroke).style("stroke", "none");

    // Participants and Lifelines
    const participantGroup = svg.append("g");
    participants.forEach(p => {
        const g = participantGroup.append("g").attr("opacity", 0);
        g.append("rect")
            .attr("x", p.x - participantBoxStyle.width / 2)
            .attr("y", p.y - participantBoxStyle.height / 2)
            .attr("width", participantBoxStyle.width)
            .attr("height", participantBoxStyle.height)
            .attr("rx", participantBoxStyle.rx)
            .style("fill", participantBoxStyle.fill).style("stroke", participantBoxStyle.stroke);
        g.append("text")
            .attr("x", p.x).attr("y", p.y)
            .text(p.name)
            .attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).attr("dominant-baseline", textStyle.baseline);
        g.append("line") // Lifeline
            .attr("x1", p.x).attr("y1", p.y + participantBoxStyle.height / 2)
            .attr("x2", p.x).attr("y2", lifelineYEnd)
            .style("stroke", participantBoxStyle.stroke).style("stroke-dasharray", "3,3");
    });

    // Messages (created hidden)
    const messageGroup = svg.append("g");

    const msg1 = messageGroup.append("g").attr("opacity", 0);
    const uqPos = participantMap.get("UQ");
    const llmPos = participantMap.get("LLM");
    msg1.append("line")
        .attr("x1", uqPos.x).attr("y1", messageY1)
        .attr("x2", llmPos.x).attr("y2", messageY1)
        .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd);
    msg1.append("text")
        .attr("x", (uqPos.x + llmPos.x) / 2).attr("y", messageY1 - 5)
        .text('Question "Count members..." is input')
        .attr("text-anchor", messageTextStyle.anchor).style("font-size", messageTextStyle.fontSize).style("fill", messageTextStyle.fill);

    const msg2 = messageGroup.append("g").attr("opacity", 0);
    const hsPos = participantMap.get("HS");
    msg2.append("line")
        .attr("x1", llmPos.x).attr("y1", messageY2)
        .attr("x2", hsPos.x).attr("y2", messageY2)
        .style("stroke", dashArrowStyle.stroke).style("stroke-width", dashArrowStyle.strokeWidth)
        .style("stroke-dasharray", dashArrowStyle.strokeDasharray).attr("marker-end", dashArrowStyle.markerEnd);
    msg2.append("text")
        .attr("x", (llmPos.x + hsPos.x) / 2).attr("y", messageY2 - 5)
        .text('Generates: "Club(Name)", ...')
        .attr("text-anchor", messageTextStyle.anchor).style("font-size", messageTextStyle.fontSize).style("fill", messageTextStyle.fill);

    const note = messageGroup.append("g").attr("opacity", 0);
    note.append("rect") // Note box shape
        .attr("x", hsPos.x + 15)
        .attr("y", messageY3 - 15)
        .attr("width", 180)
        .attr("height", 30)
        .style("fill", "#fffef0").style("stroke", "#e0e0e0");
    note.append("text")
        .attr("x", hsPos.x + 20).attr("y", messageY3)
        .text("Text explains LLM generates hypothetical schema")
        .attr("text-anchor", noteTextStyle.anchor).style("font-size", noteTextStyle.fontSize)
        .style("fill", noteTextStyle.fill).style("font-style", noteTextStyle.fontStyle)
        .attr("dominant-baseline", noteTextStyle.baseline);

    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeOutExpo',
        duration: 800 // Default duration
    });

    tl
    .add({ // Show participants first
        targets: participantGroup.selectAll("g").nodes(),
        opacity: 1,
        delay: anime.stagger(100),
        duration: 500 // Faster fade-in for participants
    })
    .add({ // Animate Message 1 Arrow (UQ -> LLM)
        targets: msg1.select('line').node(),
        x2: llmPos.x, // Animate endpoint X
        opacity: 1,
        duration: 600,
        easing: 'easeOutQuad'
    }, '+=100') // Start slightly after participants are visible
    .add({ // Fade in Message 1 Text during arrow animation
        targets: msg1.select('text').node(),
        opacity: 1,
        duration: 400,
    }, '-=400') // Overlap with arrow animation
    .add({ // Animate Message 2 Arrow (LLM -->> HS)
        targets: msg2.select('line').node(),
        x2: hsPos.x, // Animate endpoint X
        opacity: 1,
        duration: 600,
        easing: 'easeOutQuad'
    }, '+=300') // Wait a bit after msg1 finishes
    .add({ // Fade in Message 2 Text during arrow animation
        targets: msg2.select('text').node(),
        opacity: 1,
        duration: 400,
    }, '-=400') // Overlap with arrow animation
    .add({ // Fade in the note
        targets: note.node(),
        opacity: 1,
        duration: 500
    }, '+=300'); // Wait a bit after msg2 finishes

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushHallucinationSeqAnim(containerSelector, replayButtonSelector);
    }
} 