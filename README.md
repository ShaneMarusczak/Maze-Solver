# Maze-Solver

Maze-Solver is a web-based maze creation and solving application. It allows users to design custom grid layouts, set start and end points, place walls interactively, and then visualize a pathfinding algorithm that finds a solution to the maze. With additional features like inflection point detection and multiple visualization modes, Maze-Solver offers an engaging way to explore algorithmic problem solving.

---

## Features

• Customizable grid dimensions (1–75 rows and columns)  
• Interactive placement of start and end cells  
• Click-and-drag wall creation with right-click removal  
• Toggleable Visualization and Mouse modes for dynamic interaction  
• Inflection point detection to highlight maze turns  
• Responsive and lightweight design optimized for browser use

---

## Installation

1. **Clone the Repository**  
   Open your terminal and run:  
   git clone https://github.com/ShaneMarusczak/Maze-Solver.git

2. **Open the Application**  
   Navigate to the project directory and open the `index.html` file in your preferred web browser.

*Note:* Maze-Solver is built with standard HTML, CSS, and JavaScript. No additional dependencies or build processes are required.

---

## Usage Guide

1. **Setup Grid Dimensions:**  
   Use the input fields at the top to set the desired number of rows and columns (valid range: 1–75). The default value is 30 for both.

2. **Build the Grid:**  
   Click the **Build Grid** button to generate the maze board.

3. **Place Start and End Points:**  
   - Click any cell to set the **starting cell**.  
   - Then click another cell to set the **ending cell**.  
   The interface will guide you by displaying messages (e.g., "Click to place your starting cell").

4. **Customize Maze Walls:**  
   Once start and end points are set, use a click-and-drag gesture over cells to add walls. Right-click on a wall to remove it.  
   Toggle **Mouse Mode** if you prefer dynamic updates.

5. **Solve the Maze:**  
   Click the **Start** button to launch the pathfinding algorithm. Depending on the mode selected, the algorithm will visualize the search process and highlight the solution path.

6. **Additional Options:**  
   - Use the **Visualization Mode** checkbox to see a gradual exploration of the maze.  
   - Click on **Inflection** (if available) to highlight key turning points within the solution path.  
   - Press **Reload** to reset the board and start over.

---

## File and Structure Overview

• **index.html**  
 – Main HTML file that defines the page structure and includes links to stylesheets and scripts.

• **css/**  
 – *style.css*: Unminified CSS file that defines the UI styling and layout.  
 – *style.min.css*: Minified CSS version for optimized performance.

• **js/**  
 – *mazeSolver.js*: Primary JavaScript file containing the maze grid logic, pathfinding algorithm, and user interaction management.  
 – *mazeSolver.min.js*: Minified version of the core JavaScript logic for faster load times in production.

• **images/**  
 – Contains assets such as icons (e.g., house-icon.png and github-icon.png).

• **Manifest and Favicon Files:**  
 – Includes `site.webmanifest` and various favicon images for device compatibility.

---

## Configuration Details

• **Grid Dimensions:**  
 – Configured via the `rowsInput` and `colsInput` fields in `index.html` (default: 30 rows and 30 columns).

• **Cell Styling:**  
 – Cells adapt in size based on the overall grid area using CSS classes (.large_cell, .medium_cell, .small_cell, .x-small_cell).

• **Algorithm Settings:**  
 – The pathfinding speed and visualization delay are adjustable (see the `gameSpeed` variable in mazeSolver.js).

• **Mode Toggles:**  
 – **Visualization Mode:** Activates step-by-step drawing of the solution path.  
 – **Mouse Mode:** Allows dynamic repositioning of the end cell by moving the mouse.

---

## Contribution Guidelines

Contributions are welcome! Please review our contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md) (if available) before submitting pull requests or issues. Your feedback and improvements help make Maze-Solver even better.

---

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

Happy maze solving!
