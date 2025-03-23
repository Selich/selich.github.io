document.addEventListener('DOMContentLoaded', function() {
  // Apply syntax highlighting to Jupyter code blocks
  document.querySelectorAll('.jupyter-input code').forEach(block => {
    if (block.className.includes('language-')) {
      hljs.highlightElement(block);
    }
  });
  
  // Add click handlers for Run buttons (placeholders for now)
  document.querySelectorAll('.jupyter-btn').forEach(button => {
    if (button.textContent === 'Run') {
      button.addEventListener('click', function() {
        const cell = this.closest('.jupyter-notebook');
        const output = cell.querySelector('.jupyter-output');
        if (output) {
          // In a real implementation, this would execute the code
          // For now, just show a notification
          alert('This is a placeholder. For true interactivity, you would need to implement Pyodide or another solution.');
        }
      });
    } else if (button.textContent === 'Clear') {
      button.addEventListener('click', function() {
        const cell = this.closest('.jupyter-notebook');
        const output = cell.querySelector('.jupyter-output code');
        if (output) {
          output.textContent = '';
        }
      });
    }
  });
}); 