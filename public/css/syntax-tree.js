    // Create links
    const links = linksGroup.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#000") // Black links visible against white background
      .attr("stroke-width", 2)
      .attr("d", d => {
        // Custom path drawing to account for fixed leaf node positions
      }); 