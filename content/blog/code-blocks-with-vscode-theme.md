---
title: "Code Blocks with VSCode Theme"
date: 2023-03-24
description: "How to use the new VSCode-themed code blocks in your blog posts"
draft: true
---

# Beautiful Code Blocks with VSCode Theme

This post demonstrates how to use the new VSCode-themed code blocks in your blog posts. These code blocks replicate the familiar VS Code dark theme, making your code examples more readable and visually appealing.

## Basic Usage

To use the VSCode theme in your code blocks, use the `vscode` shortcode:

```
{{</* vscode lang="javascript" */>}}
function greeting(name) {
  return `Hello, ${name}!`;
}

console.log(greeting('World'));
{{</* /vscode */>}}
```

This will render as:

{{< vscode lang="javascript" >}}
function greeting(name) {
  return `Hello, ${name}!`;
}

console.log(greeting('World'));
{{< /vscode >}}

## With Line Numbers

You can also enable line numbers for better readability, especially for longer code blocks:

```
{{</* vscode lang="python" lineNumbers="true" */>}}
def fibonacci(n):
    """Generate Fibonacci sequence up to n"""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

# Print the first 10 Fibonacci numbers
for num in fibonacci(100):
    print(num)
{{</* /vscode */>}}
```

This will render as:

{{< vscode lang="python" lineNumbers="true" >}}
def fibonacci(n):
    """Generate Fibonacci sequence up to n"""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

# Print the first 10 Fibonacci numbers
for num in fibonacci(100):
    print(num)
{{< /vscode >}}

## Supported Languages

The VSCode theme currently supports syntax highlighting for:

- JavaScript
- Python
- Go
- HTML
- CSS

Here's an example with CSS:

{{< vscode lang="css" >}}
.container {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Hover effect */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}
{{< /vscode >}}

## Go Example

And here's a Go example with line numbers:

{{< vscode lang="go" lineNumbers="true" >}}
package main

import (
	"fmt"
	"time"
)

func main() {
	// Print current time
	fmt.Println("The time is now:", time.Now())
	
	// Create a channel
	ch := make(chan string)
	
	// Start a goroutine
	go func() {
		time.Sleep(2 * time.Second)
		ch <- "Goroutine completed!"
	}()
	
	// Wait for the goroutine to finish
	msg := <-ch
	fmt.Println(msg)
}
{{< /vscode >}}

## How It Works

The VSCode theme styling is achieved through CSS variables that match VS Code's default dark theme colors. These variables define colors for different code elements like:

- Keywords
- Functions
- Comments
- Strings
- Numbers
- Class names
- Variables
- Properties
- Operators and punctuation

The syntax highlighting is powered by Hugo's built-in syntax highlighter, while the VSCode-like appearance is provided by our custom CSS.

## Conclusion

Using the VSCode theme for your code blocks makes your technical blog posts look more professional and improves readability. Feel free to use this in your own posts!

Remember to set `draft: false` when you're ready to publish this post. 