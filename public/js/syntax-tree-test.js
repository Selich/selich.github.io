// Simple test script
document.addEventListener('DOMContentLoaded', function() {
  console.log("Syntax tree test script loaded");
  
  // Check if D3 is available
  if (typeof d3 !== 'undefined') {
    console.log("D3.js is loaded correctly");
    
    // Create a simple circle to test D3
    const svg = d3.select("#syntax-tree-container")
      .append("svg")
      .attr("width", 500)
      .attr("height", 200);
    
    svg.append("circle")
      .attr("cx", 250)
      .attr("cy", 100)
      .attr("r", 50)
      .attr("fill", "red");
    
    console.log("Test circle created");
  } else {
    console.error("D3.js is not loaded!");
  }
}); 