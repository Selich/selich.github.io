---
title: "Math Rendering Example"
date: 2023-05-10
draft: true
---

# Math Rendering Example

This post demonstrates how mathematical formulas are rendered on the blog.

## Inline Math

We can include inline math like this: $E = mc^2$ which should render nicely within the flow of text.

## Block Math

For more complex formulas, we can use block math:

$$
\begin{aligned}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} & = \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0
\end{aligned}
$$

## The Knapsack Problem

The knapsack problem can be formulated as: given a set of $n$ items numbered from 1 up to $n$, each with a weight $w_i$ and a value $v_i$, along with a maximum weight capacity $W$, and $x_i$ being the number of copies of $i$,

$$\text{maximize} \sum_{i=1}^{n} v_i x_i$$

$$\text{subject to} \sum_{i=1}^{n} w_i x_i \leq W$$

Here we restrict the problem to $x_i \in \{0, 1\}$, ie we can only select one copy of each element $i$. This simple problem is known to be NP-complete, which means no algorithm solves it fast (where fast means in polynomial time).

## Code Example

```python
def solve_knapsack(values, weights, capacity):
    n = len(values)
    # Initialize the DP table
    dp = [[0 for _ in range(capacity + 1)] for _ in range(n + 1)]
    
    # Fill the DP table
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    values[i-1] + dp[i-1][w-weights[i-1]],
                    dp[i-1][w]
                )
            else:
                dp[i][w] = dp[i-1][w]
    
    return dp[n][capacity]
```

This approach uses dynamic programming to solve the 0-1 knapsack problem in pseudo-polynomial time. 