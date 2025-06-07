function renderCrushText2sqlAnimation(containerSelector, replayButtonSelector) {
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
    const questionBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 }; // Question Box
    const schemaCardStyle = { fill: "#c8e6c9", stroke: "#2e7d32", strokeWidth: 1.5, rx: 8, width: 120, height: 25 }; // Selected Schema Card
    const schemaCardTextStyle = { fontSize: "9px", fill: "#1e4620", anchor: "middle", baseline: "middle", fontFam: "monospace" };
    const systemStyle = { fill: "#fce4ec", stroke: "#d81b60", strokeWidth: 1.5 }; // Pink/Red System Icon
    const sqlBoxStyle = { fill: "#f8f9fa", stroke: "#dee2e6", strokeWidth: 1, rx: 4 }; // SQL Output Box
    const sqlTextStyle = { fontFam: "monospace", fontSize: "11px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const sqlKeywordStyle = { fill: "#005073", fontWeight: "bold" }; // Blue SQL Keywords
    const textStyle = { fontSize: "13px", fill: "#212529", anchor: "middle", baseline: "middle" };
    const arrowStyle = { stroke: "#adb5bd", strokeWidth: 1.5, markerEnd: "url(#arrowhead-text2sql)" }; // Lighter grey arrows

    const questionText = "Count members in 'Bootup Baltimore Club' > 18";
    const selectedSchemaData = [
        { text: "organizations.club_name", x: width * 0.75, y: height * 0.25 - 40 },
        { text: "clubs.id", x: width * 0.75, y: height * 0.25 - 10 },
        { text: "club_membership.club_fk", x: width * 0.75, y: height * 0.25 + 20 },
        { text: "club_membership.student_fk", x: width * 0.75, y: height * 0.25 + 50 },
        { text: "persons.student_id", x: width * 0.75, y: height * 0.25 + 80 },
        { text: "users.age", x: width * 0.75, y: height * 0.25 + 110 }
    ];
    const sqlQueryLines = [
        [{ text: "SELECT", style: sqlKeywordStyle }, { text: " count(*) ", style: sqlTextStyle }, { text: "FROM", style: sqlKeywordStyle }, { text: " organizations", style: sqlTextStyle }],
        [{ text: "JOIN", style: sqlKeywordStyle }, { text: " club_membership ", style: sqlTextStyle }, { text: "ON", style: sqlKeywordStyle }, { text: " ...", style: sqlTextStyle }],
        [{ text: "JOIN", style: sqlKeywordStyle }, { text: " persons ", style: sqlTextStyle }, { text: "ON", style: sqlKeywordStyle }, { text: " ... ", style: sqlTextStyle }, { text: "JOIN", style: sqlKeywordStyle }, { text: " users ", style: sqlTextStyle }, { text: "ON", style: sqlKeywordStyle }, { text: " ...", style: sqlTextStyle }],
        [{ text: "WHERE", style: sqlKeywordStyle }, { text: " organizations.club_name = 'Bootup Baltimore Club'", style: sqlTextStyle }],
        [{ text: "AND", style: sqlKeywordStyle }, { text: " users.age > 18", style: sqlTextStyle }]
    ];

    const questionPos = { x: width * 0.25, y: height * 0.25 };
    const schemaOrigin = { x: width * 0.75, y: height * 0.25 };
    const systemPos = { x: width / 2, y: height * 0.55 };
    const sqlPos = { x: width / 2, y: height * 0.85 };

    // --- Elements ---
    // Unique marker ID
    svg.append("defs").append("marker")
        .attr("id", "arrowhead-text2sql")
        .attr("viewBox", "0 -5 10 10").attr("refX", 5).attr("refY", 0)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", arrowStyle.stroke);

    // 1. Question Box
    const questionGroup = svg.append("g").attr("opacity", 0);
    questionGroup.append("rect")
        .attr("x", questionPos.x - width * 0.2)
        .attr("y", questionPos.y - 25)
        .attr("width", width * 0.4)
        .attr("height", 50)
        .style("fill", questionBoxStyle.fill).style("stroke", questionBoxStyle.stroke).style("stroke-width", questionBoxStyle.strokeWidth).attr("rx", questionBoxStyle.rx);
    questionGroup.append("text")
        .attr("x", questionPos.x).attr("y", questionPos.y)
        .text(questionText)
        .attr("text-anchor", textStyle.anchor).style("font-size", textStyle.fontSize).style("fill", textStyle.fill).attr("dominant-baseline", textStyle.baseline);

    // 2. Selected Schema Subset (Cards)
    const schemaGroup = svg.append("g").attr("opacity", 0);
    const schemaCards = schemaGroup.selectAll(".schema-card")
        .data(selectedSchemaData)
        .join("g")
        .attr("class", "schema-card")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    schemaCards.append("rect")
        .attr("x", -schemaCardStyle.width / 2)
        .attr("y", -schemaCardStyle.height / 2)
        .attr("width", schemaCardStyle.width)
        .attr("height", schemaCardStyle.height)
        .attr("rx", schemaCardStyle.rx)
        .style("fill", schemaCardStyle.fill).style("stroke", schemaCardStyle.stroke).style("stroke-width", schemaCardStyle.strokeWidth);

    schemaCards.append("text")
        .text(d => d.text)
        .attr("text-anchor", schemaCardTextStyle.anchor)
        .attr("dominant-baseline", schemaCardTextStyle.baseline)
        .style("font-size", schemaCardTextStyle.fontSize)
        .style("font-family", schemaCardTextStyle.fontFam)
        .style("fill", schemaCardTextStyle.fill);

    // Arrows to System (Define paths first)
    const arrowToSystem1 = svg.append("line")
        .attr("x1", questionPos.x + width * 0.2).attr("y1", questionPos.y)
        .attr("x2", systemPos.x - 40).attr("y2", systemPos.y)
        .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd)
        .attr("opacity", 0);
    const arrowsToSystem2 = selectedSchemaData.map(d => {
        return svg.append("line")
            .attr("x1", d.x - schemaCardStyle.width / 2).attr("y1", d.y)
            .attr("x2", systemPos.x + 40).attr("y2", systemPos.y)
            .style("stroke", arrowStyle.stroke).style("stroke-width", arrowStyle.strokeWidth).attr("marker-end", arrowStyle.markerEnd)
            .attr("opacity", 0);
    });

    // 3. Text-to-SQL System Icon (Ensure this is appended AFTER arrows)
    const systemGroup = svg.append("g")
        .attr("transform", `translate(${systemPos.x}, ${systemPos.y}) scale(0)`) // Start scaled at 0
        .attr("opacity", 0); // Start invisible
    systemGroup.append("ellipse").attr("cx", 0).attr("cy", -20).attr("rx", 30).attr("ry", 10).style("fill", systemStyle.fill).style("stroke", systemStyle.stroke).style("stroke-width", systemStyle.strokeWidth);
    systemGroup.append("rect").attr("x", -30).attr("y", -20).attr("width", 60).attr("height", 40).style("fill", systemStyle.fill).style("stroke", systemStyle.stroke).style("stroke-width", systemStyle.strokeWidth);
    systemGroup.append("ellipse").attr("cx", 0).attr("cy", 20).attr("rx", 30).attr("ry", 10).style("fill", systemStyle.fill).style("stroke", systemStyle.stroke).style("stroke-width", systemStyle.strokeWidth);
    systemGroup.append("text").attr("x", 0).attr("y", 0).text("SQL").attr("text-anchor", "middle").style("font-size", "18px").style("fill", systemStyle.stroke).attr("dominant-baseline", "middle").style("font-weight", "bold");

    // 4. SQL Query Box (Append last to be potentially on top if needed, though unlikely)
    const sqlGroup = svg.append("g").attr("opacity", 0);
    const sqlBoxHeight = sqlQueryLines.length * 20 + 15;
    sqlGroup.append("rect")
        .attr("x", sqlPos.x - width * 0.4)
        .attr("y", sqlPos.y - sqlBoxHeight / 2)
        .attr("width", width * 0.8)
        .attr("height", sqlBoxHeight)
        .style("fill", sqlBoxStyle.fill).style("stroke", sqlBoxStyle.stroke).style("stroke-width", sqlBoxStyle.strokeWidth).attr("rx", sqlBoxStyle.rx);

    const sqlTextElement = sqlGroup.append("text")
        .attr("x", sqlPos.x)
        .attr("y", sqlPos.y - sqlBoxHeight / 2 + 15)
        .attr("text-anchor", "middle");

    sqlQueryLines.forEach((lineParts, lineIndex) => {
        const textLine = sqlTextElement.append("tspan")
            .attr("x", sqlPos.x)
            .attr("dy", lineIndex === 0 ? 0 : "1.4em");
        lineParts.forEach(part => {
            textLine.append("tspan")
                .style("font-family", part.style.fontFam || sqlTextStyle.fontFam)
                .style("font-size", part.style.fontSize || sqlTextStyle.fontSize)
                .style("fill", part.style.fill || sqlTextStyle.fill)
                .style("font-weight", part.style.fontWeight || 'normal')
                .text(part.text);
        });
    });

    // --- Animation ---
    const tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: 700
    });

    tl
        .add({ targets: questionGroup.node(), opacity: 1 }, 0)
        .add({ targets: schemaGroup.node(), opacity: 1 }, 200)
        // Animate arrows first
        .add({ targets: arrowToSystem1.node(), opacity: 1 }, 500)
        .add({ targets: arrowsToSystem2.map(a => a.node()), opacity: 1, delay: anime.stagger(50) }, 550)
        // Then animate system icon scaling up
        .add({
            targets: systemGroup.node(), // Target the group
            opacity: 1,
            scale: 0.8, // Target scale
            duration: 500 // Give it some time
        }, '-=300') // Overlap slightly with end of arrow animation
        // Then show SQL box
        .add({
            targets: sqlGroup.node(),
            opacity: 1,
            translateY: [-20, 0]
        }, '+=200'); // Start after system icon is mostly visible

    // --- Replay Logic ---
    const replayButton = document.querySelector(replayButtonSelector);
    if (replayButton) {
        replayButton.onclick = () => renderCrushText2sqlAnimation(containerSelector, replayButtonSelector);
    }
} 