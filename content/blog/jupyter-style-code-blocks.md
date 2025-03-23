---
title: "Jupyter-Style Code Blocks"
date: 2023-03-25
description: "How to use Jupyter notebook-style code blocks in your blog posts"
draft: true
---

# Jupyter-Style Code Blocks

This post demonstrates how to use Jupyter notebook-style code blocks in your blog posts, which make your code examples look more like interactive Jupyter notebooks.

## Basic Python Example

Here's a simple Python example showing both input and output:

{{< jupyter lang="python" output_content="Hello, World!" >}}
print("Hello, World!")
{{< /jupyter >}}

## Data Analysis Example

Here's a more complex example that resembles a typical data analysis workflow:

{{< jupyter id="2" lang="python" output_content="   Age  Height  Weight\n0   28     172      68\n1   35     168      75\n2   42     180      85\n3   30     175      70\n4   25     165      58" >}}
import pandas as pd
import numpy as np

# Create a sample dataset
data = {
    'Age': [28, 35, 42, 30, 25],
    'Height': [172, 168, 180, 175, 165],
    'Weight': [68, 75, 85, 70, 58]
}

# Create a DataFrame
df = pd.DataFrame(data)

# Display the DataFrame
df
{{< /jupyter >}}

## Visualization Example

For visualizations, you would typically see a plot as output:

{{< jupyter id="3" lang="python" output="true" >}}
import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create a plot
plt.figure(figsize=(8, 4))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.show()
{{< /jupyter >}}

The actual output would display an image of a sine wave plot.

## Machine Learning Example

Here's an example of a machine learning code block:

{{< jupyter id="4" lang="python" output_content="Training accuracy: 0.9666666666666667" >}}
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Load the Iris dataset
iris = load_iris()
X, y = iris.data, iris.target

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

# Train a random forest classifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Print the training accuracy
print(f"Training accuracy: {clf.score(X_train, y_train)}")
{{< /jupyter >}}

## Interactive Elements

You can also add interactive elements to your code blocks (note that these are currently just visual placeholders):

{{< jupyter id="5" lang="python" interactive="true" output_content="Type something to see it here!" >}}
# This is an interactive cell
# Type your code here and click "Run"
user_input = input("Enter something: ")
print(f"You entered: {user_input}")
{{< /jupyter >}}

## How to Use These Code Blocks

To use a Jupyter-style code block in your posts, use the `jupyter` shortcode:

```
{{</* jupyter lang="python" output_content="Hello, World!" */>}}
print("Hello, World!")
{{</* /jupyter */>}}
```

### Parameters

- `id`: Cell number (default: "1")
- `lang`: Programming language (default: "python")
- `input`: Show input cell (default: true)
- `output`: Show output cell (default: true)
- `output_content`: Content to display in the output cell
- `interactive`: Show interactive buttons (default: false)

## Making Truly Interactive Code Blocks

To enable truly interactive code execution, you would need to integrate one of these solutions:

1. **Pyodide**: Run Python code directly in the browser using WebAssembly
2. **JupyterLite**: A lightweight version of Jupyter that runs entirely in the browser
3. **Observable**: Interactive JavaScript notebooks that can be embedded
4. **CodePen or JSFiddle**: For HTML/CSS/JavaScript examples

For a full implementation, you'd need to add JavaScript that handles code execution and displaying results. This would be a more complex enhancement requiring additional development.

## Conclusion

These Jupyter-style code blocks enhance the appearance of your code examples, making them more familiar to data scientists and developers who work with notebooks. While they don't provide actual execution capabilities without additional JavaScript, they provide a clean, notebook-like presentation for your code examples.

If you're interested in making them truly interactive, consider embedding JupyterLite or using Pyodide for browser-based Python execution. 