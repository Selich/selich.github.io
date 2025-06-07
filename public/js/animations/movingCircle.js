// static/js/animations/movingCircle.js
function renderMovingCircleAnimation(containerId) {
  if (typeof d3 === 'undefined') {
    console.error("D3 library is not loaded. Cannot render animation for:", containerId);
    const container = document.querySelector(containerId);
    if (container) {
        container.textContent = "Error: D3 library not loaded.";
    }
    return;
  }

  const width = 200;
  const height = 100;
  const duration = 1500; // Duration for one way

  const svg = d3.select(containerId)
    .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("display", "inline-block");

  const circle = svg.append("circle")
    .attr("cx", 50)
    .attr("cy", height / 2)
    .attr("r", 40)
    .style("fill", "steelblue");

  function loopAnimation() {
    circle
      .transition()
        .duration(duration)
        .attr("cx", 150)
        .style("fill", "firebrick")
      .transition() // Chain the return transition
        .duration(duration)
        .attr("cx", 50)
        .style("fill", "steelblue")
      .on("end", loopAnimation); // Restart the loop when the return is finished
  }

  loopAnimation(); // Start the animation loop
} 