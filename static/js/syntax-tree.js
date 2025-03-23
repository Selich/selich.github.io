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
          children: [{ name: "Hello" }]
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
          children: [{ name: "Zdravo" }]
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
          children: [{ name: "Hallo" }]
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
          children: [{ name: "你好" }]
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
          children: [{ name: "Привет" }]
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

  // Helper function to generate Wiktionary URL
  function generateWiktionaryUrl(word) {
    // Remove commas, periods, etc. that might be in the word
    const cleanWord = word.replace(/[,\.]/g, '');
    return `https://en.wiktionary.org/wiki/${encodeURIComponent(cleanWord.toLowerCase())}`;
  }

  // Helper function to generate Wikipedia URL for grammar labels
  function generateWikipediaUrl(label) {
    // Map common grammar labels to their Wikipedia article names
    const labelMap = {
      "S": "Sentence_(linguistics)",
      "NP": "Noun_phrase",
      "VP": "Verb_phrase",
      "V": "Verb",
      "N": "Noun",
      "Pro": "Pronoun",
      "Intj": "Interjection",
      "Punc": "Punctuation"
    };
    
    // Use the mapping if available, otherwise just use the label
    const articleName = labelMap[label] || label;
    return `https://en.wikipedia.org/wiki/${articleName}`;
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
    
    // Helper function to determine part of speech class
    function getPartOfSpeechClass(d) {
      const nodeName = d.data.name;
      
      // Check if this is a specific part of speech node
      if (nodeName === 'N') return 'pos-N';
      if (nodeName === 'V') return 'pos-V';
      if (nodeName === 'ADV' || nodeName === 'Adv') return 'pos-ADV';
      if (nodeName === 'Pro' || nodeName === 'PRO') return 'pos-PRO';
      if (nodeName === 'NP') return 'pos-NP';
      if (nodeName === 'VP') return 'pos-VP';
      if (nodeName === 'Intj' || nodeName === 'INTJ') return 'pos-Intj';
      if (nodeName === 'S') return 'pos-S';
      
      // For leaf nodes, try to determine by parent
      if (!d.children && d.parent) {
        const parentName = d.parent.data.name;
        if (parentName === 'N') return 'pos-N';
        if (parentName === 'V') return 'pos-V';
        if (parentName === 'ADV' || parentName === 'Adv') return 'pos-ADV';
        if (parentName === 'Pro' || parentName === 'PRO') return 'pos-PRO';
        if (parentName === 'NP') return 'pos-NP';
        if (parentName === 'VP') return 'pos-VP';
        if (parentName === 'Intj' || parentName === 'INTJ') return 'pos-Intj';
        if (parentName === 'S') return 'pos-S';
      }
      
      return '';
    }
    
    // Create nodes but keep them hidden initially
    const nodeGroups = nodesGroup.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", d => {
        const posClass = getPartOfSpeechClass(d);
        return `node ${!d.children ? 'leaf-node' : ''} ${posClass}`;
      })
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("opacity", 0);
      
    // Add circles to nodes
    nodeGroups.append("circle")
      .attr("r", 0)
      .attr("fill", d => d.depth === 0 ? "#f0f4ff" : "#2d3748")  // Root node slightly different
      .attr("stroke", "transparent")
      .attr("stroke-width", 2);
    
    // Helper function to get background color based on part of speech
    function getBackgroundColor(d) {
      const nodeName = d.data.name;
      const isLeaf = !d.children;
      
      // Determine color based on the part of speech
      if (nodeName === 'N' || (isLeaf && d.parent && d.parent.data.name === 'N')) {
        return isLeaf ? "#FFE0B2" : "#FFE0B2"; // Orange for nouns
      }
      if (nodeName === 'NP' || (isLeaf && d.parent && d.parent.data.name === 'NP')) {
        return isLeaf ? "#FFE0B2" : "#FFE0B2"; // Same orange for noun phrases
      }
      if (nodeName === 'V' || (isLeaf && d.parent && d.parent.data.name === 'V')) {
        return isLeaf ? "#BBDEFB" : "#BBDEFB"; // Blue for verbs
      }
      if (nodeName === 'VP' || (isLeaf && d.parent && d.parent.data.name === 'VP')) {
        return isLeaf ? "#C8E6C9" : "#C8E6C9"; // Green for verb phrases
      }
      if (nodeName === 'ADV' || nodeName === 'Adv' || 
          (isLeaf && d.parent && (d.parent.data.name === 'ADV' || d.parent.data.name === 'Adv'))) {
        return isLeaf ? "#FFCDD2" : "#FFCDD2"; // Red for adverbs
      }
      if (nodeName === 'Pro' || nodeName === 'PRO' || 
          (isLeaf && d.parent && (d.parent.data.name === 'Pro' || d.parent.data.name === 'PRO'))) {
        return isLeaf ? "#FFF9C4" : "#FFF9C4"; // Yellow for pronouns
      }
      if (nodeName === 'Intj' || nodeName === 'INTJ' || 
          (isLeaf && d.parent && (d.parent.data.name === 'Intj' || d.parent.data.name === 'INTJ'))) {
        return isLeaf ? "#FFCCE6" : "#FFCCE6"; // Pink for interjections
      }
      if (nodeName === 'S') {
        return isLeaf ? "#EF5350" : "#B2EBF2"; // Cyan for sentences
      }
      
      // No specific background for other parts of speech
      return "transparent";
    }
    
    // Text background rectangles for POS highlighting
    const textBgs = nodeGroups.append("rect")
      .attr("class", "text-bg")
      .attr("rx", 3) // Rounded corners
      .attr("ry", 3)
      .attr("fill", d => getBackgroundColor(d))
      .attr("opacity", 0.9)
      .attr("height", 0) // Will be set based on text dimensions
      .attr("width", 0)  // Will be set based on text dimensions
      .attr("x", 0)      // Will be adjusted based on text
      .attr("y", 0);     // Will be adjusted based on text
    
    // Add labels to nodes
    const textNodes = nodeGroups.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "14px") // Bigger font size
      .attr("dominant-baseline", "middle") // Center text vertically
      .style("padding", "2px 5px") // Add padding inside the text
      .text(d => d.data.name)
      .style("opacity", 0)
      .on("click", function(event, d) {
        // Use Wikipedia for grammar nodes (non-leaf nodes) and Wiktionary for leaf nodes
        const url = d.children 
          ? generateWikipediaUrl(d.data.name) 
          : generateWiktionaryUrl(d.data.name);
        window.open(url, '_blank');
      });
    
    // Update rectangle dimensions based on text
    textNodes.each(function(d) {
      const textElement = this;
      const bbox = textElement.getBBox();
      const padding = 4; // Padding around text
      
      // Only show background if there's a specific POS background color
      if (getBackgroundColor(d) !== "transparent") {
        d3.select(this.parentNode).select("rect.text-bg")
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2);
      }
    });
    
    // Find all leaf nodes that contain actual words
    const leafNodes = root.descendants().filter(d => !d.children);
    
    // Create temporary word elements for the animation
    // We'll position these at the bottom initially, then animate them to their tree positions
    const tempWords = svg.selectAll(".temp-word")
      .data(leafNodes)
      .enter()
      .append("g")
      .attr("class", d => {
        const posClass = getPartOfSpeechClass(d);
        return `temp-word ${posClass}`;
      })
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
    
    // Add background rectangles for POS highlighting in temp words
    tempWords.append("rect")
      .attr("class", "text-bg")
      .attr("rx", 3) // Rounded corners
      .attr("ry", 3)
      .attr("fill", d => getBackgroundColor(d))
      .attr("opacity", 0.9)
      .attr("height", 0) // Will be set based on text dimensions
      .attr("width", 0)  // Will be set based on text dimensions
      .attr("x", 0)      // Will be adjusted based on text
      .attr("y", 0);     // Will be adjusted based on text
    
    // Add the word text to each temp element
    const tempTextNodes = tempWords.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "28px")
      .text(d => d.data.name)
      .style("fill", "#000")
      .on("click", function(event, d) {
        const url = generateWiktionaryUrl(d.data.name);
        window.open(url, '_blank');
      });
      
    // Update rectangle dimensions based on text
    tempTextNodes.each(function(d) {
      const textElement = this;
      const bbox = textElement.getBBox();
      const padding = 6; // Slightly more padding for temp words since they're larger
      
      // Only show background if there's a specific POS background color
      if (getBackgroundColor(d) !== "transparent") {
        d3.select(this.parentNode).select("rect.text-bg")
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2);
      }
    });
    
    // Add background circles but keep them invisible initially
    tempWords.append("circle")
      .attr("r", 40) // Increased from 30 to 40 for leaf nodes
      .attr("fill", "white")
      .attr("stroke", "transparent")
      .attr("stroke-width", 2)
      .style("opacity", 0) // Hide initially
      .lower(); // Make sure circle is behind text
    
    // Move the rectangles behind the text but in front of the circles
    tempWords.selectAll("rect.text-bg").lower();
    tempWords.selectAll("circle").lower();
    
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
    
    // 1. First, fade in the text of temporary word elements smoothly
    tempWords.style("opacity", 0); // Start invisible
    tempWords.select("text").style("opacity", 0); // Start invisible
    tempWords.select("rect.text-bg").style("opacity", 0); // Keep backgrounds invisible
    
    // Fade in the words smoothly
    tempWords.transition()
      .duration(800)
      .style("opacity", 1);
      
    tempWords.select("text")
      .transition()
      .duration(800)
      .style("opacity", 1);
    
    // 2. After a short delay, animate the temporary words to their positions in the tree
    tempWords.transition()
      .delay(1500) // Delay a bit longer to allow the fade-in to complete
      .duration(1200)
      .attr("transform", d => `translate(${d.x}, ${height - 20})`) // Keep y position fixed at height-20
      .on("end", function() {
        // After words have moved to position, NOW show the color backgrounds
        tempWords.select("rect.text-bg")
          .transition()
          .duration(600)
          .style("opacity", 0.6) // Reduced opacity to make them less overwhelming
          .on("end", function() {
            // Then fade in the circles
            tempWords.select("circle")
              .transition()
              .duration(600)
              .style("opacity", 1)
              .on("end", animateTreeStructure);
          });
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
          
          // Fade in the text
          d3.selectAll(nodesByDepth[depth])
            .select("text")
            .transition()
            .delay(delay)
            .duration(600)
            .style("opacity", 1);
          
          // Fade in the background rectangles
          d3.selectAll(nodesByDepth[depth])
            .select("rect.text-bg")
            .transition()
            .delay(delay)
            .duration(600)
            .style("opacity", 0.9);
          
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
  let cycleInterval = null; // Store interval reference
  
  // Start with the first tree
  updateTree(trees[currentTreeIndex]);
  
  // Function to cycle through trees
  function cycleTree() {
    // Clear any existing intervals to prevent multiple intervals
    if (cycleInterval) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }
    
    // Fade out the entire tree with a slightly longer duration
    svg.selectAll(".nodes-group, .links-group, .temp-word")
      .transition()
      .duration(1500)
      .style("opacity", 0)
      .on("end", function() {
        // Remove old elements completely before building new tree
        svg.selectAll(".nodes-group, .links-group, .temp-word").remove();
        
        // After fade out is complete, update to the next tree
        currentTreeIndex = (currentTreeIndex + 1) % trees.length;
        
        // Show a brief "Loading next language" message
        languageIndicator
          .text(`Loading ${trees[currentTreeIndex].language}...`)
          .transition()
          .duration(800)
          .attr("opacity", 1)
          .transition()
          .delay(1000)
          .duration(800)
          .attr("opacity", 0)
          .on("end", function() {
            // Start building the new tree
            updateTree(trees[currentTreeIndex]);
            
            // Set timer for the next language (only after current animation completes)
            cycleInterval = setTimeout(cycleTree, 9000);
          });
      });
  }
  
  // Start the first cycle after initial tree is shown (wait longer for the first cycle)
  cycleInterval = setTimeout(cycleTree, 10000);
  
  // Add safety check - if no cycling happens within 20 seconds, force a cycle
  setInterval(function() {
    const allElements = svg.selectAll(".nodes-group, .links-group, .temp-word").nodes();
    if (allElements.length === 0) {
      // If no elements exist, animation might be stuck
      console.log("Animation appears stuck, restarting cycle");
      if (cycleInterval) {
        clearTimeout(cycleInterval);
      }
      cycleInterval = setTimeout(cycleTree, 1000);
    }
  }, 20000);
}); 