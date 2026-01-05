(function() {
  // Centralized state object
  const state = {
    phase: 'init', // 'init' | 'gridBuilt' | 'settingStart' | 'settingEnd' | 'settingWalls' | 'solving' | 'complete'
    rows: 30,
    cols: 30,
    rowsValid: true,
    colsValid: true,
    visualizationMode: false,
    mouseMode: false,
    leftMouseButtonDown: false,
    startLocated: false,
    foundInflectionPoints: false,
    startCell: null,
    endCell: null,
    gameSpeed: 200
  };

  // Direction offset map for O(1) neighbor lookups
  const DIRECTION_OFFSETS = {
    N:  { x:  0, y: -1 },
    NE: { x:  1, y: -1 },
    E:  { x:  1, y:  0 },
    SE: { x:  1, y:  1 },
    S:  { x:  0, y:  1 },
    SW: { x: -1, y:  1 },
    W:  { x: -1, y:  0 },
    NW: { x: -1, y: -1 }
  };

  const gameBoard = [];

  const gameBoard_UI = document.getElementById("gameBoard_UI");
  const rowsInput = document.getElementById("rowsInput");
  const colsInput = document.getElementById("colsInput");

  // O(1) Queue implementation using head pointer
  class Queue {
    constructor() {
      this.elements = [];
      this.head = 0;
    }

    enqueue(e) {
      this.elements.push(e);
    }

    dequeue() {
      if (this.isEmpty()) return undefined;
      const item = this.elements[this.head];
      this.head++;

      // Periodically clean up to prevent memory bloat
      if (this.head > 1000 && this.head > this.elements.length / 2) {
        this.elements = this.elements.slice(this.head);
        this.head = 0;
      }
      return item;
    }

    isEmpty() {
      return this.head >= this.elements.length;
    }

    length() {
      return this.elements.length - this.head;
    }
  }

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.neighbors = [];
      this.cardinal_neighbors = [];
      this.wall = false;
      this.path = false;
      this.start_cell = false;
      this.end_cell = false;
      this.distance = 0;
      this.visited = false;
    }

    setNeighbors() {
      const dirs = [-1, 0, 1];
      for (let dir_x of dirs) {
        for (let dir_y of dirs) {
          if (validPosition(this.x + dir_x, this.y + dir_y)) {
            if (dir_x === 0 && dir_y === 0) {
              continue;
            }
            let cardinal_direction = getCellConnectionDirection(dir_x, dir_y);
            if (dir_x === 0 || dir_y === 0) {
              this.neighbors.push(build_neighbor(this.x + dir_x, this.y + dir_y, 1, cardinal_direction));
              this.cardinal_neighbors.push(build_neighbor(this.x + dir_x, this.y + dir_y, 1, cardinal_direction));
            } else {
              this.neighbors.push(build_neighbor(this.x + dir_x, this.y + dir_y, Math.sqrt(2), cardinal_direction));
            }
          }
        }
      }
    }

    getLowestDistanceNeighbor() {
      let low = Infinity;
      let lowCell = null;
      for (let n of this.neighbors) {
        let cell = getCell(n.x, n.y);
        if (cell.distance < low && cell.visited && !cell.wall) {
          low = cell.distance;
          lowCell = cell;
        }
      }
      return lowCell;
    }

    handleClick(e) {
      if (state.phase === 'settingStart' && e.button === 0) {
        this.start_cell = true;
        getCellElem(this.x, this.y).classList.add("start");
        state.startCell = this;
        state.phase = 'settingEnd';
        document.getElementById("startMessage").classList.add("hidden");
        document.getElementById("endMessage").classList.remove("hidden");
      } else if (state.phase === 'settingEnd' && e.button === 0) {
        state.endCell = this;
        this.end_cell = true;
        getCellElem(this.x, this.y).classList.add("end");
        state.phase = 'settingWalls';
        document.getElementById("endMessage").classList.add("hidden");
        document.getElementById("wallMessage").classList.remove("hidden");
        for (let x = 0; x < state.cols; x++) {
          for (let y = 0; y < state.rows; y++) {
            getCellElem(x, y).addEventListener("mouseover", onMouseOver);
          }
        }
      } else if (state.phase === 'settingWalls' && e.button === 2) {
        this.wall = false;
        getCellElem(this.x, this.y).classList.remove("wall");
      }
    }
  }

  function build_neighbor(x, y, connection_cost, direction) {
    return {
      x,
      y,
      connection_cost,
      direction
    };
  }

  function getCellConnectionDirection(dir_x, dir_y) {
    if (dir_x === 0 && dir_y === -1) {
      return "N";
    } else if (dir_x === 1 && dir_y === -1) {
      return "NE";
    } else if (dir_x === 1 && dir_y === 0) {
      return "E";
    } else if (dir_x === 1 && dir_y === 1) {
      return "SE";
    } else if (dir_x === 0 && dir_y === 1) {
      return "S";
    } else if (dir_x === -1 && dir_y === 1) {
      return "SW";
    } else if (dir_x === -1 && dir_y === 0) {
      return "W";
    } else {
      return "NW";
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function onMouseOver(e) {
    clearSelection();
    if (state.leftMouseButtonDown && state.phase === 'settingWalls') {
      let [x, y] = getXYFromCell(e.target);
      let cell = getCell(x, y);
      if (cell.start_cell || cell.end_cell || cell.wall) {
        return;
      }
      cell.wall = true;
      e.target.classList.add("wall");
    }
  }

  function getCell(x, y) {
    return gameBoard[x][y];
  }

  function getCellId(x, y) {
    return "cell-" + x + "-" + y;
  }

  function getCellElem(x, y) {
    return document.getElementById(getCellId(x, y));
  }

  function validPosition(x, y) {
    return x >= 0 && x < state.cols && y >= 0 && y < state.rows;
  }

  function resetSignal() {
    for (let x = 0; x < state.rows; x++) {
      for (let y = 0; y < state.cols; y++) {
        let to_check = getCell(x, y);
        let to_check_elem = getCellElem(x, y);
        to_check.path = false;
        if (to_check.wall) {
          continue;
        }
        to_check.end_cell = false;
        to_check_elem.classList.remove("end");
        to_check_elem.classList.remove("path");
        to_check.visited = false;
        to_check.distance = 0;
        to_check_elem.textContent = "";
      }
    }
  }

  function moveEndCellToMouse(e) {
    let cell_elem = e.target;
    let [x, y] = getXYFromCell(cell_elem);
    let cell = getCell(x, y);
    if (cell.wall || cell.start_cell) {
      return;
    }
    resetSignal();
    cell.end_cell = true;
    cell_elem.classList.add("end");

    state.endCell = cell;

    draw_path(state.endCell);
    if (state.startLocated) {
      walk_path(state.startCell);
    }
  }

  // O(n) inflection point detection - analyzes the solved path directly
  function findInflectionPoints() {
    if (state.phase !== 'solving' && state.phase !== 'complete') return;
    if (state.foundInflectionPoints) return;

    // Collect path cells in order from start to end
    const pathCells = [];
    let current = state.startCell;

    while (current && current.distance > 0) {
      pathCells.push(current);
      current = current.getLowestDistanceNeighbor();
    }
    if (current) pathCells.push(current); // end cell

    // Need at least 3 cells to detect direction changes
    if (pathCells.length < 3) {
      state.foundInflectionPoints = true;
      return;
    }

    // Walk the path and detect direction changes
    for (let i = 1; i < pathCells.length - 1; i++) {
      const prev = pathCells[i - 1];
      const curr = pathCells[i];
      const next = pathCells[i + 1];

      // Calculate direction vectors
      const dir1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const dir2 = { x: next.x - curr.x, y: next.y - curr.y };

      // If direction changed, it's an inflection point
      if (dir1.x !== dir2.x || dir1.y !== dir2.y) {
        getCellElem(curr.x, curr.y).classList.add("inflection_point");
      }
    }

    state.foundInflectionPoints = true;
  }

  function uiChangesOnStart() {
    document.getElementById("start").removeEventListener("click", start);
    document.getElementById("start").disabled = true;
    document.getElementById("visualization_mode").disabled = true;
    document.getElementById("visualization_mode").classList.add("hidden");
    document.getElementById("vis_label").classList.add("hidden");
    document.getElementById("mouse_mode").disabled = true;
    document.getElementById("mouse_mode").classList.add("hidden");
    document.getElementById("mouse_label").classList.add("hidden");
    document.getElementById("wallMessage").classList.add("notShown");
  }

  function clearSelection() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
  }

  function start() {
    if (state.phase !== 'settingWalls') {
      return;
    }

    clearSelection();
    uiChangesOnStart();

    if (state.mouseMode) {
      Array.from(document.querySelectorAll(".cell")).forEach(cell_elem => {
        cell_elem.addEventListener("mouseover", moveEndCellToMouse);
      });
      document.getElementById("inflection").classList.remove("hidden");
    }

    state.phase = 'solving';

    draw_path(state.endCell);
    if (!state.visualizationMode && !state.mouseMode && state.startLocated) {
      fillInGaps();
    }
    disableHover();
    if (state.startLocated) {
      if (state.visualizationMode) {
        sleep(state.rows * state.cols).then(() => walk_path(state.startCell));
      } else {
        walk_path(state.startCell);
      }
    } else if (!state.startLocated && !state.mouseMode) {
      document.getElementById("wallMessage").classList.add("hidden");
      document.getElementById("noPathMessage").classList.remove("hidden");
    }
  }

  function disableHover() {
    for (let x = 0; x < state.rows; x++) {
      for (let y = 0; y < state.cols; y++) {
        getCellElem(x, y).classList.remove("cell_hover");
      }
    }
  }

  function fillInGaps() {
    for (let x = 0; x < state.rows; x++) {
      for (let y = 0; y < state.cols; y++) {
        let to_check = getCell(x, y);
        if (!to_check.visited) {
          to_check.wall = true;
          getCellElem(x, y).classList.add("wall");
        }
      }
    }
  }

  function walk_path(root) {
    root.path = true;
    if (root.distance === 0) {
      state.phase = 'complete';
      return;
    }
    if (!root.start_cell) {
      getCellElem(root.x, root.y).classList.remove("visited");
      getCellElem(root.x, root.y).classList.add("path");
    }

    if (state.visualizationMode && !state.mouseMode) {
      sleep(state.gameSpeed).then(() => walk_path(root.getLowestDistanceNeighbor()));
    } else {
      walk_path(root.getLowestDistanceNeighbor());
    }
  }

  function draw_path(root) {
    let time = 1;
    let q = new Queue();
    root.visited = true;
    q.enqueue(root);
    while (!q.isEmpty()) {
      time++;
      let cell = q.dequeue();
      for (let n of cell.neighbors.slice().reverse()) {
        let n_cell = getCell(n.x, n.y);
        if (n.direction === "NE" && checkCorner("N", "E", cell, "NE")) {
          cell.neighbors.splice(cell.neighbors.indexOf(n), 1);
          continue;
        } else if (n.direction === "SE" && checkCorner("S", "E", cell, "SE")) {
          cell.neighbors.splice(cell.neighbors.indexOf(n), 1);
          continue;
        } else if (n.direction === "SW" && checkCorner("S", "W", cell, "SW")) {
          cell.neighbors.splice(cell.neighbors.indexOf(n), 1);
          continue;
        } else if (n.direction === "NW" && checkCorner("N", "W", cell, "NW")) {
          cell.neighbors.splice(cell.neighbors.indexOf(n), 1);
          continue;
        }
        if (n_cell.start_cell) {
          state.startLocated = true;
        }
        if (n_cell.distance > cell.distance + n.connection_cost && n_cell.visited) {
          n_cell.distance = cell.distance + n.connection_cost;
          if (state.visualizationMode) {
            sleep(time + 30).then(() => {
              getCellElem(n_cell.x, n_cell.y).textContent = (cell.distance + n.connection_cost).toString().substring(0, 4);
            });
          } else if (n_cell.start_cell && state.mouseMode) {
            getCellElem(n_cell.x, n_cell.y).textContent = (cell.distance + n.connection_cost).toString().substring(0, 4);
          }
        }
        if (!n_cell.visited && !n_cell.wall) {
          n_cell.visited = true;
          n_cell.distance = cell.distance + n.connection_cost;
          let elem = getCellElem(n_cell.x, n_cell.y);
          if (state.visualizationMode) {
            sleep(time + 30).then(() => {
              elem.textContent = (cell.distance + n.connection_cost).toString().substring(0, 4);
              if (!n_cell.start_cell) {
                elem.classList.add("visited");
              }
            });
          } else if (n_cell.start_cell && state.mouseMode) {
            elem.textContent = (cell.distance + n.connection_cost).toString().substring(0, 4);
          }
          if (!n_cell.wall) {
            q.enqueue(n_cell);
          }
        }
      }
    }
  }

  // Simplified checkCorner using DIRECTION_OFFSETS for O(1) lookups
  function checkCorner(perpDir1, perpDir2, cell, diagDir) {
    const off1 = DIRECTION_OFFSETS[perpDir1];
    const off2 = DIRECTION_OFFSETS[perpDir2];
    const offD = DIRECTION_OFFSETS[diagDir];

    // Check bounds
    if (!validPosition(cell.x + off1.x, cell.y + off1.y) ||
        !validPosition(cell.x + off2.x, cell.y + off2.y) ||
        !validPosition(cell.x + offD.x, cell.y + offD.y)) {
      return false;
    }

    const cell1 = getCell(cell.x + off1.x, cell.y + off1.y);
    const cell2 = getCell(cell.x + off2.x, cell.y + off2.y);
    const cellD = getCell(cell.x + offD.x, cell.y + offD.y);

    // Block diagonal if both perpendicular cells are walls (and diagonal isn't)
    return cell1.wall && cell2.wall && !cellD.wall;
  }

  function getXYFromCell(cell) {
    return [cell.id.split("-")[1], cell.id.split("-")[2]];
  }

  function buildGrid(e) {
    if (state.phase === 'init' && state.rowsValid && state.colsValid) {
      state.rows = Number(rowsInput.value);
      state.cols = Number(colsInput.value);
      rowsInput.disabled = true;
      colsInput.disabled = true;
      e.target.classList.add("hidden");
      document.getElementById("start").disabled = false;
      document.getElementById("start").classList.remove("hidden");
      buildGridInternal();
      state.phase = 'settingStart';
      document.getElementById("startMessage").classList.remove("hidden");
    }
  }

  // Generic input validator factory
  function createInputValidator(fieldName, validFlag, errorId) {
    return function(e) {
      const regex = /^\d{0,2}$/;
      const value = e.target.value;
      const num = Number(value);
      const isValid = regex.test(value) && num > 0 && num <= 75 && value !== "";

      if (isValid) {
        state[validFlag] = true;
        const elem = document.getElementById(errorId);
        if (elem) elem.remove();
      } else {
        if (state[validFlag]) {
          const message = document.createElement("p");
          message.id = errorId;
          message.textContent = `Valid range is 1-75 ${fieldName}`;
          message.classList.add("bad");
          document.getElementById("messages").prepend(message);
        }
        state[validFlag] = false;
      }
    };
  }

  const testRowsInput = createInputValidator("rows", "rowsValid", "invalidRows");
  const testColsInput = createInputValidator("columns", "colsValid", "invalidCols");

  function setLeftButtonState(e) {
    state.leftMouseButtonDown = e.buttons === undefined ? e.which === 1 : e.buttons === 1;
  }

  function buildGridInternal() {
    for (let x = 0; x < state.cols; x++) {
      gameBoard.push([]);
      const col = document.createElement("div");
      col.id = "col-" + x;
      col.classList.add("col");
      col.draggable = false;
      col.ondragstart = function() {
        return false;
      };
      gameBoard_UI.appendChild(col);
      for (let y = 0; y < state.rows; y++) {
        const newCell = new Cell(x, y);
        gameBoard[x].push(newCell);
        gameBoard[x][y].setNeighbors();
        const cell = document.createElement("div");
        cell.id = getCellId(x, y);
        cell.classList.add("cell");
        cell.classList.add("cell_hover");
        if (state.cols * state.rows < 25 * 25) {
          cell.classList.add("large_cell");
        } else if (state.cols * state.rows < 40 * 40) {
          cell.classList.add("medium_cell");
        } else if (state.cols * state.rows < 60 * 60) {
          cell.classList.add("small_cell");
        } else {
          cell.classList.add("x-small_cell");
        }

        col.appendChild(cell);
        cell.addEventListener("mouseup", (e) => newCell.handleClick(e));
        cell.draggable = false;
        cell.ondragstart = function() {
          return false;
        };
      }
    }
  }

  (function() {
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("buildGrid").addEventListener("click", buildGrid);
    document.getElementById("inflection").addEventListener("click", findInflectionPoints);

    document.getElementById("visualization_mode").addEventListener("input", () => {
      state.visualizationMode = !state.visualizationMode;

      if (state.visualizationMode) {
        document.getElementById("mouse_mode").checked = false;
        state.mouseMode = false;
      }
    });

    document.getElementById("visualization_mode").checked = false;

    document.getElementById("mouse_mode").addEventListener("input", () => {
      state.mouseMode = !state.mouseMode;
      if (state.mouseMode) {
        document.getElementById("visualization_mode").checked = false;
        state.visualizationMode = false;
      }
    });

    document.getElementById("mouse_mode").checked = false;

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    rowsInput.addEventListener("input", testRowsInput);
    colsInput.addEventListener("input", testColsInput);
    colsInput.value = "30";
    rowsInput.value = "30";
    document.getElementById("start").disabled = true;
    document.oncontextmenu = () => false;
    document.draggable = false;
    document.ondragstart = function() {
      return false;
    };

    gameBoard_UI.draggable = false;
    gameBoard_UI.ondragstart = function() {
      return false;
    };
  })();

})();
