document.addEventListener('DOMContentLoaded', function() {
    // Initialize preview animations
    initializeSyntaxTreePreview();
});

function initializeSyntaxTreePreview() {
    // Set up dimensions for preview
    const width = 300;
    const height = 150;
    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    
    // Create SVG container
    const svg = d3.select("#syntax-tree-preview")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create a simplified tree data for preview
    const previewData = {
        name: "S",
        children: [
            {
                name: "NP",
                children: [{ name: "I" }]
            },
            {
                name: "VP",
                children: [
                    { name: "am" },
                    { name: "Nikola" }
                ]
            }
        ]
    };
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    
    // Convert data to hierarchy
    const root = d3.hierarchy(previewData);
    
    // Layout the tree
    treeLayout(root);
    
    // Create links
    svg.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    // Create nodes
    const nodes = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // Add circles to nodes
    nodes.append("circle")
        .attr("r", 4)
        .attr("fill", d => d.children ? "#2d3748" : "#f0f4ff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1);
    
    // Add labels to nodes
    nodes.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -8 : 8)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", "10px")
        .text(d => d.data.name);
    
    // Add a subtle animation to the preview
    function animatePreview() {
        svg.selectAll(".node")
            .transition()
            .duration(1000)
            .attr("transform", d => {
                const offset = Math.sin(Date.now() / 2000) * 2;
                return `translate(${d.y},${d.x + offset})`;
            });
    }
    
    // Start the animation loop
    setInterval(animatePreview, 2000);
} 