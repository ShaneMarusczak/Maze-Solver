(function () {
  //TODO: FIX THE DIAGONAL MOVE AT WALL CORNERS, CHECK FOR PAIRS OF NEIGHBORS BEING WALLS (i.e. North && East + 3 MORE),
  // IF PATTERN MET, TREAT DIAGONAL CELL BETWEEN THE DIRECTIONS (i.e NE from above) LIKE A WALL

  //TODO: MAKE WALLS BETTER, STOP ALL DRAG EVENTS, DOUBLE CLICK ON A CELL TO ERASE
  let gameStarted = false;

  let rowsValid = true;
  let colsValid = true;
  let gridBuilt = false;

  let gameSpeed = 200;

  let rows = 30;
  let cols = 30;

  let settingStart = true;
  let settingEnd = false;
  let startSet = false;
  let endSet = false;

  let leftMouseButtonOnlyDown = false;

  let visualization_mode = false;

  let startCell, endCell;

  const gameBoard = [];

  const gameBoard_UI = document.getElementById("gameBoard_UI");
  const rowsInput = document.getElementById("rowsInput");
  const colsInput = document.getElementById("colsInput");

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.neighbors = [];
      this.wall = false;
      this.path = false;
      this.start_cell = false;
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
            let cardinal_direction = getCellConnectionDirection(this.x, this.y, this.x + dir_x, this.y + dir_y);
            if (dir_x === 0 || dir_y === 0) {
              this.neighbors.push([this.x + dir_x, this.y + dir_y, 1, cardinal_direction]);
            }
            else{
              this.neighbors.push([this.x + dir_x, this.y + dir_y, Math.sqrt(2), cardinal_direction]);
            }
          }
        }
      }
    }

    getLowestDistanceNeighbor() {
      let low = Infinity;
      let lowCell = null
      for (let n of this.neighbors) {
        let cell = getCell(n[0], n[1]);
        if (cell.distance < low && cell.visited){
          low = cell.distance;
          lowCell = cell;
        }
      }
      return lowCell;
    }

    handleClick() {
      if (settingStart && !gameStarted) {
        this.start_cell = true;
        getCellElem(this.x, this.y).classList.add("start");
        startCell = this;
        settingStart = false;
        settingEnd = true;
        startSet = true;
      } else if (settingEnd && !gameStarted) {
        endCell = this;
        getCellElem(this.x, this.y).classList.add("end");
        settingEnd = false;
        endSet = true;
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            getCellElem(x, y).addEventListener("mouseover", onMouseOver);
          }
        }
      }
    }

    handleDoubleClick() {
      if(this.wall){
        this.wall = false;
        getCellElem(this.x, this.y).classList.remove("wall");
      }
    }
  }

  function getCellConnectionDirection(base_x, base_y, n_x, n_y) {
    if (n_x === base_x && n_y < base_y) {
      return 1;
    }
    else if (n_x > base_x && n_y < base_y) {
      return 2;
    }
    else if (n_x > base_x && n_y === base_y) {
      return 3;
    }
    else if (n_x > base_x && n_y > base_y) {
      return 4;
    }
    else if (n_x === base_x && n_y > base_y) {
      return 5;
    }
    else if (n_x < base_x && n_y > base_y) {
      return 6;
    }
    else if (n_x < base_x && n_y === base_y) {
      return 7;
    }
    else {
      return 8;
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function onMouseOver(e) {
    if (leftMouseButtonOnlyDown) {
      let [x, y] = getXYFromCell(e.target);
      gameBoard[x][y].wall = true;
      getCellElem(x, y).classList.add("wall");
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
    return x >= 0 && x < cols && y >= 0 && y < rows;
  }

  function start() {
    if (!startSet || !endSet) {
      return;
    }
    document.getElementById("start").removeEventListener("click", start);
    document.getElementById("start").disabled = true;
    document.getElementById("visualization_mode").disabled = true;
    document.getElementById("visualization_mode").classList.add("hidden");
    document.getElementById("vis_label").classList.add("hidden");
    gameStarted = true;

    new_draw_path(endCell);
    if (visualization_mode){
      sleep(rows * cols * 2.5).then(() => new_walk_path(startCell));
    }
    else {
      new_walk_path(startCell);
    }

  }

  function new_walk_path(root) {
    root.path = true;
    if(root.distance === 0 && !root.start_cell) {
      return;
    }
    if(!root.start_cell){
      getCellElem(root.x, root.y).style.backgroundColor = "cadetblue";
    }

    if (visualization_mode){
      sleep(gameSpeed).then(() => new_walk_path(root.getLowestDistanceNeighbor()));
    }
    else {
      new_walk_path(root.getLowestDistanceNeighbor());
    }

  }

  function new_draw_path(root) {
    let time = 1;
    let q = new Queue();
    root.visited = true;
    q.enqueue(root);
    while(!q.isEmpty()) {
      time++;
      let v = q.dequeue();
      for(let n of v.neighbors){
        let n_cell = getCell(n[0], n[1]);
        if (n[3] === 2 && checkCorner(1,3, v)) {
          continue;
        }
        else if (n[3] === 4 && checkCorner(3, 5, v)) {
          continue;
        }
        else if (n[3] === 6 && checkCorner(5, 7, v)) {
          continue;
        }
        else if (n[3] === 8 && checkCorner(7, 1, v)) {
          continue;
        }
        if(n_cell.start_cell){
          return;
        }
        if (n_cell.distance > v.distance + n[2] && n_cell.visited){
          n_cell.distance = v.distance + n[2];
          if (visualization_mode) {
            sleep(time * 3).then(() => {
              getCellElem(n_cell.x, n_cell.y).textContent = (v.distance + n[2]).toString().substr(0, 5);
            });
          }


        }
        if(!n_cell.visited && !n_cell.wall) {
          n_cell.visited = true;
          n_cell.distance_cache = n_cell.distance;
          n_cell.distance = v.distance + n[2];
          if (visualization_mode) {
            sleep(time * 2).then(() => {
              getCellElem(n_cell.x, n_cell.y).textContent = (v.distance + n[2]).toString().substr(0, 5);
              getCellElem(n_cell.x, n_cell.y).style.backgroundColor = "orange";
            });
          }
          getCellElem(n_cell.x, n_cell.y).style.fontSize = "8px";
          q.enqueue(n_cell);
        }
      }
    }
  }

  function  checkCorner(n_1, n_2, base) {
    let cell_1 = null;
    let cell_2 = null;
    for(let n of base.neighbors) {
      if (n[3] === n_1) {
        cell_1 = getCell(n[0], n[1]);
      }
      if (n[3] === n_2) {
        cell_2 = getCell(n[0], n[1]);
      }
    }
    if (cell_1 === null || cell_2 === null) {
      return false;
    }
    return !!(cell_1.wall || cell_2.wall);

  }

  function getXYFromCell(cell) {
    return [cell.id.split("-")[1], cell.id.split("-")[2]];
  }

  function buildGrid(e) {
    if (!gameStarted && rowsValid && colsValid && !gridBuilt) {
      rows = Number(rowsInput.value);
      cols = Number(colsInput.value);
      rowsInput.disabled = true;
      colsInput.disabled = true;
      e.target.classList.add("hidden");
      document.getElementById("start").disabled = false;
      document.getElementById("start").classList.remove("hidden");
      buildGridInternal();
      gridBuilt = true;
    }
  }

  function testRowsInput(e) {
    const regex = /^\d{0,2}$/;
    if (
      regex.test(e.target.value) &&
      Number(e.target.value) <= 75 &&
      Number(e.target.value) > 0 &&
      e.target.value !== ""
    ) {
      rowsValid = true;
      let elem = document.getElementById("invalidRows");
      if (typeof elem != "undefined" && elem != null) {
        elem.remove();
      }
    } else {
      if (rowsValid) {
        const message = document.createElement("p");
        message.id = "invalidRows";
        message.textContent = "Valid range is 1-75 rows";
        message.classList.add("bad");
        document
          .getElementById("messages")
          .insertBefore(
            message,
            document.getElementById("messages").firstChild
          );
      }
      rowsValid = false;
    }
  }

  function testColsInput(e) {
    const regex = /^\d{0,2}$/;
    if (
      regex.test(e.target.value) &&
      Number(e.target.value) <= 75 &&
      Number(e.target.value) > 0 &&
      e.target.value !== ""
    ) {
      colsValid = true;
      let elem = document.getElementById("invalidCols");
      if (typeof elem != "undefined" && elem != null) {
        elem.remove();
      }
    } else {
      if (colsValid) {
        const message = document.createElement("p");
        message.id = "invalidCols";
        message.textContent = "Valid range is 1-75 columns";
        message.classList.add("bad");
        document
          .getElementById("messages")
          .insertBefore(
            message,
            document.getElementById("messages").firstChild
          );
      }
      colsValid = false;
    }
  }

  function setLeftButtonState(e) {
    leftMouseButtonOnlyDown =
      e.buttons === undefined ? e.which === 1 : e.buttons === 1;
  }

  function buildGridInternal() {
    for (let x = 0; x < cols; x++) {
      gameBoard.push([]);
      const col = document.createElement("div");
      col.id = "col-" + x;
      col.classList.add("col");
      col.draggable = false;
      col.ondragstart = function () {
        return false;
      };
      gameBoard_UI.appendChild(col);
      for (let y = 0; y < rows; y++) {
        const newCell = new Cell(x, y);
        gameBoard[x].push(newCell);
        gameBoard[x][y].setNeighbors();
        const cell = document.createElement("div");
        cell.id = getCellId(x, y);
        cell.classList.add("cell");
        col.appendChild(cell);
        cell.addEventListener("click", () => newCell.handleClick());
        cell.addEventListener("dblclick", () => newCell.handleDoubleClick());
      }
    }
  }

  (function () {
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("buildGrid").addEventListener("click", buildGrid);

    document.getElementById("visualization_mode").addEventListener("input", () => {
      visualization_mode = !visualization_mode;
    });
    
    visualization_mode = document.getElementById("visualization_mode").checked;

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    rowsInput.addEventListener("input", testRowsInput);
    colsInput.addEventListener("input", testColsInput);
    colsInput.value = "30";
    rowsInput.value = "30";
    document.getElementById("start").disabled = true;
  })();

  class Queue {
    constructor() {
      this.elements = [];
    }
  }

  Queue.prototype.enqueue = function (e) {
    this.elements.push(e);
  };

  Queue.prototype.dequeue = function () {
    return this.elements.shift();
  };

  Queue.prototype.isEmpty = function () {
    return this.elements.length === 0;
  };

  Queue.prototype.length = function() {
    return this.elements.length;
  }

})();
