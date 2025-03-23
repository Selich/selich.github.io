// Linguistic tree animation using D3.js
document.addEventListener('DOMContentLoaded', function() {
  // Define linguistic trees for different languages
  const trees = [
    // English: "Hello, I'm Nikola"
    {
      name: "S",
      language: "English",
      text: "Hello, I am Nikola",
      children: [
        {
          name: "Intj",
          children: [{ name: "Hello," }]
        },
        {
          name: "NP",
          children: [{ name: "Pro", children: [{ name: "I" }] }]
        },
        {
          name: "VP",
          children: [
            { name: "V", children: [{ name: "am" }] },
            { name: "NP", children: [{ name: "N", children: [{ name: "Nikola" }] }] }
          ]
        }
      ]
    },
    
    // Serbian: "Zdravo, ja sam Nikola"
    {
      name: "S",
      language: "Serbian",
      text: "Zdravo, ja sam Nikola",
      children: [
        {
          name: "Intj",
          children: [{ name: "Zdravo," }]
        },
        {
          name: "NP",
          children: [{ name: "Pro", children: [{ name: "ja" }] }]
        },
        {
          name: "VP",
          children: [
            { name: "V", children: [{ name: "sam" }] },
            { name: "NP", children: [{ name: "N", children: [{ name: "Nikola" }] }] }
          ]
        }
      ]
    },
    
    // German: "Hallo, ich bin Nikola"
    {
      name: "S",
      language: "German",
      text: "Hallo, ich bin Nikola",
      children: [
        {
          name: "Intj",
          children: [{ name: "Hallo," }]
        },
        {
          name: "NP",
          children: [{ name: "Pro", children: [{ name: "ich" }] }]
        },
        {
          name: "VP",
          children: [
            { name: "V", children: [{ name: "bin" }] },
            { name: "NP", children: [{ name: "N", children: [{ name: "Nikola" }] }] }
          ]
        }
      ]
    },
    
    // Chinese: "你好，我叫Nikola。"
    {
      name: "S",
      language: "Chinese",
      text: "你好，我叫Nikola",
      children: [
        {
          name: "Intj",
          children: [{ name: "你好，" }]
        },
        {
          name: "NP",
          children: [{ name: "Pro", children: [{ name: "我" }] }]
        },
        {
          name: "VP",
          children: [
            { name: "V", children: [{ name: "叫" }] },
            { name: "NP", children: [{ name: "N", children: [{ name: "Nikola" }] }] }
          ]
        },
      ]
    },
    
    // Russian: "Привет, я Никола"
    {
      name: "S",
      language: "Russian",
      text: "Привет, я Никола",
      children: [
        {
          name: "Intj",
          children: [{ name: "Привет," }]
        },
        {
          name: "NP",
          children: [{ name: "Pro", children: [{ name: "я" }] }]
        },
        {
          name: "NP", // Russian often omits the copula "am"
          children: [{ name: "N", children: [{ name: "Никола" }] }]
        }
      ]
    }
  ];

  // Set up dimensions
  const margin = {top: 30, right: 10, bottom: 100, left: 10};
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Create SVG container
  const svg = d3.select("#syntax-tree-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Title for current language
  const title = svg.append("text")
    .attr("class", "language-title")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold");
  
  // Sentence text display
  const sentenceText = svg.append("text")
    .attr("class", "sentence-text")
    .attr("x", width / 2)
    .attr("y", height + 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px");
  
  // Create tree layout
  const treeLayout = d3.tree().size([width, height - 60]);

  // Function to extract leaf nodes and their text from the data
  function extractLeafNodes(node, result = []) {
    if (!node.children) {
      result.push(node);
    } else {
      node.children.forEach(child => extractLeafNodes(child, result));
    }
    return result;
  }

  // Function to update the tree with sentence transformation animation
  function updateTree(data) {
    // Convert data to hierarchy
    const root = d3.hierarchy(data);
    
    // Layout the tree
    treeLayout(root);
    
    // Update the title - removing the language name display
    title.text(""); // No longer displaying the language name
    
    // Update the sentence text - removing it
    sentenceText.text(""); // No longer displaying the sentence text
    
    // Remove existing elements
    svg.selectAll(".node").remove();
    svg.selectAll(".link").remove();
    svg.selectAll(".temp-word").remove();
    svg.selectAll(".links-group").remove();
    svg.selectAll(".nodes-group").remove();
    
    // Create a links group that will go behind nodes
    const linksGroup = svg.append("g").attr("class", "links-group");
    
    // Create links
    const links = linksGroup.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("d", d => {
        // Custom path drawing to account for fixed leaf node positions
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        // If this is a link to a leaf node, use the fixed bottom position
        const targetY = d.target.children ? d.target.y : height - 20;
        
        return `M${sourceX},${sourceY}
                C${sourceX},${(sourceY + targetY) / 2}
                ${targetX},${(sourceY + targetY) / 2}
                ${targetX},${targetY}`;
      })
      .style("opacity", 0);
    
    // Create nodes group that will be on top of links
    const nodesGroup = svg.append("g").attr("class", "nodes-group");
    
    // Create nodes but keep them hidden initially
    const nodeGroups = nodesGroup.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("opacity", 0);
      
    // Add circles to nodes
    nodeGroups.append("circle")
      .attr("r", 0)
      .attr("fill", d => d.depth === 0 ? "#f0f4ff" : "#2d3748")  // Root node slightly different
      .attr("stroke", "transparent")
      .attr("stroke-width", 2);
    
    // Add labels to nodes
    nodeGroups.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "14px") // Bigger font size
      .text(d => d.data.name)
      .style("opacity", 0);
    
    // Find all leaf nodes that contain actual words
    const leafNodes = root.descendants().filter(d => !d.children);
    
    // Create temporary word elements for the animation
    // We'll position these at the bottom initially, then animate them to their tree positions
    const tempWords = svg.selectAll(".temp-word")
      .data(leafNodes)
      .enter()
      .append("g")
      .attr("class", "temp-word")
      .attr("transform", (d, i) => {
        // Evenly space words across a narrower width to make them closer together
        const totalWords = leafNodes.length;
        const usableWidth = width * 0.4; // Use 40% of width to keep words closer together
        const step = usableWidth / (totalWords - 1 || 1); // Avoid division by zero
        
        // For single word, center it
        const x = totalWords === 1 
          ? width / 2 
          : (width - usableWidth) / 2 + i * step;
          
        return `translate(${x}, ${height - 20})`;
      });
    
    // Add the word text to each temp element
    tempWords.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "28px")
      // .style("font-weight", "bold")
      .text(d => d.data.name)
      .style("fill", "#000");
    
    // Add background circles but keep them invisible initially
    tempWords.append("circle")
      .attr("r", 40) // Increased from 30 to 40 for leaf nodes
      .attr("fill", "white")
      .attr("stroke", "transparent")
      .attr("stroke-width", 2)
      .style("opacity", 0) // Hide initially
      .lower(); // Make sure circle is behind text
    
    // Function to group nodes by depth level
    function groupNodesByDepth(nodes) {
      const byDepth = {};
      nodes.each(function(d) {
        const depth = d.depth;
        if (!byDepth[depth]) {
          byDepth[depth] = [];
        }
        byDepth[depth].push(this);
      });
      return byDepth;
    }
    
    // Group nodes by depth level
    const nodesByDepth = groupNodesByDepth(nodeGroups);
    
    // Group links by source node depth
    const linksByDepth = {};
    links.each(function(d) {
      const depth = d.source.depth;
      if (!linksByDepth[depth]) {
        linksByDepth[depth] = [];
      }
      linksByDepth[depth].push(this);
    });
    
    // Calculate maximum depth
    const maxDepth = Math.max(...Object.keys(nodesByDepth).map(Number));
    
    // ANIMATION SEQUENCE
    
    // 1. First, show the temporary word elements (text only, no circles yet)
    tempWords.style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);
    
    // 2. After a short delay, animate the temporary words to their positions in the tree
    // But only change their horizontal position, keeping vertical position fixed
    tempWords.transition()
      .delay(1000)
      .duration(1200)
      .attr("transform", d => `translate(${d.x}, ${height - 20})`) // Keep y position fixed at height-20
      .on("end", function() {
        // After words have moved to position, fade in their circles
        tempWords.select("circle")
          .transition()
          .duration(400)
          .style("opacity", 1)
          .on("end", animateTreeStructure);
      });
    
    // 3. Next, build the rest of the tree structure from leaves to root
    function animateTreeStructure() {
      // First animate the nodes, starting from deepest levels
      let delay = 70;
      
      // Keep track of when all nodes are done animating
      let finalNodeDelay = delay;
      
      for (let depth = maxDepth - 1; depth >= 0; depth--) {
        if (nodesByDepth[depth]) {
          // Fade in nodes at this depth
          d3.selectAll(nodesByDepth[depth])
            .transition()
            .delay(delay)
            .duration(600)
            .style("opacity", 1)
            .select("circle")
            .attr("r", 20);
          
          d3.selectAll(nodesByDepth[depth])
            .select("text")
            .transition()
            .delay(delay)
            .duration(600)
            .style("opacity", 1);
          
          delay += 300;
          finalNodeDelay = delay + 600; // Update final delay time
        }
      }
      
      // Then animate the links AFTER all nodes are visible
      links.transition()
        .delay(finalNodeDelay)
        .duration(800)
        .style("opacity", 1);
    }
  }
  
  // Initialize with the first tree
  let currentTreeIndex = 0;
  updateTree(trees[currentTreeIndex]);
  
  // Function to cycle through trees
  function cycleTree() {
    // Fade out the entire tree
    svg.selectAll(".nodes-group, .links-group, .temp-word")
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .on("end", function() {
        // After fade out is complete, update to the next tree
        currentTreeIndex = (currentTreeIndex + 1) % trees.length;
        updateTree(trees[currentTreeIndex]);
      });
  }
  
  // Set timer to cycle trees every 8 seconds (give more time for complex animation)
  setInterval(cycleTree, 8000);
}); 