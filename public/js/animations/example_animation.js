function renderExampleAnimation(containerSelector, replayButtonSelector) {
  // Ensure anime is available (assuming it is loaded globally or via the theme)
  if (typeof anime === 'undefined') {
    console.error('anime.js is not loaded.');
    return; // Stop if anime is not available
  }

  const svg = d3.select(containerSelector);

  // Clear previous contents if replaying
  svg.selectAll('*').remove();

  // Get viewBox dimensions from the SVG element itself (set by the shortcode)
  const viewBox = svg.attr('viewBox');
  const viewBoxParts = viewBox ? viewBox.split(' ') : ['0', '0', '200', '100']; // Default if somehow missing
  const viewBoxWidth = parseFloat(viewBoxParts[2]);
  const viewBoxHeight = parseFloat(viewBoxParts[3]);

  // Create a circle element
  const circle = svg.append('circle')
    .attr('cx', viewBoxWidth * 0.25)
    .attr('cy', viewBoxHeight / 2)
    .attr('r', 20)
    .attr('fill', 'cornflowerblue');

  // Use anime.js to animate the circle
  const animation = anime({
    targets: circle.node(), // Target the DOM node of the D3 selection
    cx: viewBoxWidth * 0.75,
    duration: 1500,
    easing: 'easeInOutQuad',
    direction: 'alternate',
    loop: true,
    autoplay: true // Start automatically
  });

  // Handle replay button
  const replayButton = document.querySelector(replayButtonSelector);
  if (replayButton) {
    replayButton.onclick = () => {
      // Stop existing animation if it's running
      if (animation) {
        anime.remove(circle.node()); // Remove target from anime's ticker
      }
      renderExampleAnimation(containerSelector, replayButtonSelector); // Re-render
    };
  }
} 