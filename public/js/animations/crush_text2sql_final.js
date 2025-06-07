function renderCrushText2sqlFinal(containerSelector, replayButtonSelector) {
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
    const questionBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4, widthScale: 0.7, height: 40 };
    const questionTextStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const schemaCardStyle = { fill: "#d1e7dd", stroke: "#198754", strokeWidth: 1.5, rx: 6, width: 130, height: 28 }; // Green selected cards
    const cardTextStyle = { fontSize: "10px", fill: "#333", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const text2SqlIconStyle = { fill: "#f8d7da", stroke: "#dc3545", strokeWidth: 1.5, radius: 30 }; // Reddish cylinder/processor
    const sqlBoxStyle = { fill: "#e9ecef", stroke: "#adb5bd", strokeWidth: 1, rx: 4, widthScale: 0.9, height: 100 };
    const sqlTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "start", baseline: "hanging" };
    const sqlKeywordStyle = { fill: "#0d6efd", fontWeight: "bold" }; // Blue keywords
    const arrowStyle = { stroke: "#6c757d", strokeWidth: 1.5, markerEnd: "url(#arrowhead-text2sql)" };
    const flowArrowStyle = { stroke: "#ffc107", strokeWidth: 2 }; // Yellow flow arrows

    // --- Layout & Data ---
    const questionText = "Count members in 'Bootup Baltimore Club' > 18";
    const questionPos = { x: width / 2, y: height * 0.1 };
    const schemaSubsetData = [
        { id: 1, text: "clubs.club_name", x: width * 0.3, y: height * 0.3 },
        { id: 3, text: "clubs.club_id", x: width * 0.3, y: height * 0.4 },
        { id: 4, text: "club_membership.club_fk", x: width * 0.5, y: height * 0.3 },
        { id: 6, text: "club_membership.student_fk", x: width * 0.5, y: height * 0.4 },
        { id: 7, text: "students.student_id", x: width * 0.7, y: height * 0.3 },
        { id: 8, text: "students.age", x: width * 0.7, y: height * 0.4 },
    ];
    const nodeMap = new Map(schemaSubsetData.map(d => [d.id, d]));
    const text2SqlPos = { x: width / 2, y: height * 0.55 };
    const sqlPos = { x: width / 2, y: height * 0.8 };
    const sqlQueryParts = [
        { text: "SELECT", style: sqlKeywordStyle }, { text: " count(*) " },
        { text: "FROM", style: sqlKeywordStyle }, { text: " clubs " },
        { text: "JOIN", style: sqlKeywordStyle }, { text: " club_membership " }, { text: "ON", style: sqlKeywordStyle }, { text: " clubs.club_id = club_membership.club_fk " },
        { text: "JOIN", style: sqlKeywordStyle }, { text: " students " }, { text: "ON", style: sqlKeywordStyle }, { text: " club_membership.student_fk = students.student_id " },
        { text: "WHERE", style: sqlKeywordStyle }, { text: " clubs.club_name = 'Bootup Baltimore Club' " },
        { text: "AND", style: sqlKeywordStyle }, { text: " students.age > 18" }
    ];

    // --- Elements ---
     // Arrowhead Marker
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-text2sql")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 5).attr("refY", 0).attr("orient", "auto")
        .attr("markerWidth", 4).attr("markerHeight", 4)
        .attr("xoverflow", "visible")
        .append("svg:path").attr("d", "M 0,-5 L 10 ,0 L 0,5").attr("fill", arrowStyle.stroke).style("stroke", "none");

    // 1. Question Box
    const questionGroup = svg.append("g").attr("opacity", 0);
    const qBoxWidth = width * questionBoxStyle.widthScale;
    questionGroup.append("rect")
        .attr("x", (width - qBoxWidth) / 2).attr("y", questionPos.y - questionBoxStyle.height / 2)
        .attr("width", qBoxWidth).attr("height", questionBoxStyle.height)
        .style("fill", questionBoxStyle.fill).style("stroke", questionBoxStyle.stroke).attr("rx", questionBoxStyle.rx);
    questionGroup.append("text")
        .attr("x", questionPos.x).attr("y", questionPos.y)
        .text(questionText)
        .attr("text-anchor", questionTextStyle.anchor).style("font-size", questionTextStyle.fontSize).attr("dominant-baseline", questionTextStyle.baseline);

    // Selected Schema Subset Cards
    const schemaGroup = svg.append("g");
    const schemaNodes = schemaGroup.selectAll(".schema-node")
        .data(schemaSubsetData).join("g")
        .attr("class", "schema-node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .attr("opacity", 0);
    schemaNodes.append("rect")
        .attr("x", -schemaCardStyle.width / 2).attr("y", -schemaCardStyle.height / 2)
        .attr("width", schemaCardStyle.width).attr("height", schemaCardStyle.height)
        .attr("rx", schemaCardStyle.rx)
        .style("fill", schemaCardStyle.fill).style("stroke", schemaCardStyle.stroke).style("stroke-width", schemaCardStyle.strokeWidth);
    schemaNodes.append("text")
        .text(d => d.text)
        .attr("text-anchor", cardTextStyle.anchor).attr("dominant-baseline", cardTextStyle.baseline)
        .style("font-size", cardTextStyle.fontSize).style("font-family", cardTextStyle.fontFam).style("fill", cardTextStyle.fill);

    // 2. Text-to-SQL System Icon
    const text2SqlGroup = svg.append("g")
        .attr("transform", `translate(${text2SqlPos.x}, ${text2SqlPos.y})`)
        .attr("opacity", 0);
    // Cylinder shape
    text2SqlGroup.append("ellipse")
        .attr("cx", 0).attr("cy", -text2SqlIconStyle.radius * 0.7)
        .attr("rx", text2SqlIconStyle.radius).attr("ry", text2SqlIconStyle.radius * 0.3)
        .style("fill", text2SqlIconStyle.fill).style("stroke", text2SqlIconStyle.stroke).style("stroke-width", text2SqlIconStyle.strokeWidth);
    text2SqlGroup.append("rect")
        .attr("x", -text2SqlIconStyle.radius).attr("y", -text2SqlIconStyle.radius * 0.7)
        .attr("width", text2SqlIconStyle.radius * 2).attr("height", text2SqlIconStyle.radius * 1.4)
        .style("fill", text2SqlIconStyle.fill).style("stroke", text2SqlIconStyle.stroke).style("stroke-width", text2SqlIconStyle.strokeWidth);
    text2SqlGroup.append("ellipse")
        .attr("cx", 0).attr("cy", text2SqlIconStyle.radius * 0.7)
        .attr("rx", text2SqlIconStyle.radius).attr("ry", text2SqlIconStyle.radius * 0.3)
        .style("fill", text2SqlIconStyle.fill).style("stroke", text2SqlIconStyle.stroke).style("stroke-width", text2SqlIconStyle.strokeWidth);
    // Processing symbol (e.g., gears)
    text2SqlGroup.append("path") // Simple gear shape
        .attr("d", "M0,-8 L2,-6 L6,-6 L8,-8 L8,-10 L6,-12 L2,-12 L0,-10 Z M0,8 L2,6 L6,6 L8,8 L8,10 L6,12 L2,12 L0,10 Z")
        .style("fill", text2SqlIconStyle.stroke).attr("transform", "scale(0.8)");
    text2SqlGroup.append("text").text("Text2SQL").attr("y", text2SqlIconStyle.radius + 15).attr("text-anchor", "middle").style("font-size", "10px");

    // 4. SQL Query Box
    const sqlGroup = svg.append("g")
        .attr("transform", `translate(${sqlPos.x}, ${sqlPos.y})`)
        .attr("opacity", 0);
    const sqlBoxWidth = width * sqlBoxStyle.widthScale;
    sqlGroup.append("rect")
        .attr("x", -sqlBoxWidth / 2).attr("y", -sqlBoxStyle.height / 2)
        .attr("width", sqlBoxWidth).attr("height", sqlBoxStyle.height)
        .style("fill", sqlBoxStyle.fill).style("stroke", sqlBoxStyle.stroke).attr("rx", sqlBoxStyle.rx);
    const sqlTextElement = sqlGroup.append("text")
        .attr("x", -sqlBoxWidth / 2 + 10) // Padding
        .attr("y", -sqlBoxStyle.height / 2 + 15)
        .style("font-family", sqlTextStyle.fontFam).style("font-size", sqlTextStyle.fontSize)
        .attr("dominant-baseline", sqlTextStyle.baseline);

    const sqlSpans = [];
    sqlQueryParts.forEach((part, i) => {
        const span = sqlTextElement.append("tspan")
            .text("") // Start empty for typewriter
            .style("fill", part.style?.fill || sqlTextStyle.fill)
            .style("font-weight", part.style?.fontWeight || 'normal')
             // Add line breaks logically (e.g., before JOIN, WHERE, AND)
            .attr("x", part.text.trim().match(/^(JOIN|WHERE|AND)$/) ? -sqlBoxWidth / 2 + 20 : null) // Indent slightly
            .attr("dy", part.text.trim().match(/^(JOIN|WHERE|AND)$/) ? "1.2em" : null)
            .datum({ fullText: part.text });
        sqlSpans.push(span);
    });

    // 3. Flow Arrows (Created last, animated)
    const flowArrowsGroup = svg.append("g");
    const questionFlowArrow = flowArrowsGroup.append("line")
         .attr("x1", questionPos.x).attr("y1", questionPos.y + questionBoxStyle.height / 2)
         .attr("x2", questionPos.x).attr("y2", questionPos.y + questionBoxStyle.height / 2) // Start collapsed
         .style("stroke", flowArrowStyle.stroke).style("stroke-width", flowArrowStyle.strokeWidth)
         .attr("marker-end", "url(#arrowhead-text2sql)").attr("opacity", 0);

    const schemaFlowArrows = schemaSubsetData.map(d => {
        return flowArrowsGroup.append("line")
            .attr("x1", d.x).attr("y1", d.y + schemaCardStyle.height / 2)
            .attr("x2", d.x).attr("y2", d.y + schemaCardStyle.height / 2) // Start collapsed
            .style("stroke", flowArrowStyle.stroke).style("stroke-width", flowArrowStyle.strokeWidth)
            .attr("marker-end", "url(#arrowhead-text2sql)").attr("opacity", 0);
    });

    // --- Animation Timeline ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 800
    });

    let offset = 0;
    // Step 1: Show Question and Schema Subset
    tl.add({
        targets: [questionGroup.node(), ...schemaNodes.nodes()],
        opacity: 1,
        duration: 600,
        delay: anime.stagger(50)
    }, offset);
    offset += 800;

    // Step 2: Show Text-to-SQL System
    tl.add({
        targets: text2SqlGroup.node(),
        opacity: 1,
        scale: [0.7, 1],
        duration: 500
    }, offset);
    offset += 600;

    // Step 3: Animate Flow Arrows
    tl.add({
        targets: questionFlowArrow.node(),
        opacity: 1,
        y2: text2SqlPos.y - text2SqlIconStyle.radius,
        duration: 700
    }, offset);
    tl.add({
        targets: schemaFlowArrows.map(a => a.node()),
        opacity: 1,
        x2: text2SqlPos.x,
        y2: text2SqlPos.y - text2SqlIconStyle.radius,
        duration: 700,
        delay: anime.stagger(80)
    }, offset + 100); // Stagger schema arrows slightly
    offset += 900;

    // Step 4: Generate SQL Query (Typewriter)
    tl.add({
        targets: sqlGroup.node(),
        opacity: 1,
        duration: 300
    }, offset);
    tl.add({
        targets: sqlSpans.map(s => s.node()),
        text: function(el) { return d3.select(el).datum().fullText; },
        duration: function(el) { return d3.select(el).datum().fullText.length * 20; }, // Faster typing
        delay: anime.stagger(30),
        easing: 'linear',
        begin: function(anim) {
            anim.animatables.forEach(animatable => { animatable.target.textContent = ''; });
        },
        update: function(anim) { // Custom update for typewriter
            anim.animatables.forEach(animatable => {
                const targetNode = animatable.target;
                const fullText = d3.select(targetNode).datum().fullText;
                const currentProgress = Math.min(anim.progress, 100);
                const progress = Math.floor(currentProgress * fullText.length / 100);
                targetNode.textContent = fullText.substring(0, progress);
            });
        }
    }, offset + 200); // Start typing shortly after box appears

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushText2sqlFinal(containerSelector, replayButtonSelector);
    }
} 