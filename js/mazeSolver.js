(function () {
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

  const distance = (x1, y1, x2, y2) => Math.sqrt( ((x2 - x1) * (x2 - x1)) + ((y2 - y1)*(y2 - y1)));

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.neighbors = [];
      this.wall = false;
      this.path = false;
      this.start_cell = false;
      this.end_cell = false;
      this.distance = 0;
      this.visited = false;
    }

    setNeighbors() {
      const dirs = [-1, 0, 1];
      for (let dirx of dirs) {
        for (let diry of dirs) {
          if (validPosition(this.x + dirx, this.y + diry)) {
            if (dirx === 0 && diry === 0) {
              continue;
            }
            if (dirx === 0 || diry === 0) {
              this.neighbors.push([this.x + dirx, this.y + diry, 1]);
            }
            else{
              // this.neighbors.push([this.x + dirx, this.y + diry, 1]);
              this.neighbors.push([this.x + dirx, this.y + diry, Math.sqrt(2)]);

            }
          }
        }
      }
    }

    getCrowFlyDistance() {
      let end = getEnd();
      return distance(this.x, this.y, end.x, end.y);
    }

    getLowestDistanceNeighbors() {
      let low = Infinity;
      let rv = [];
      for (let n of this.neighbors) {
        let cell = getCell(n[0], n[1]);
        if (cell.distance < low && cell.visited){
          rv = [];
          rv.push(cell);
          low = cell.distance;
        } else if (cell.distance === low && cell.visited){
          rv.push(cell);
        }
      }
      return rv;
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
        this.end_cell = true;
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

    new_draw_path(getEnd());
    if (visualization_mode){
      sleep(rows * cols * 3).then(() => new_walk_path(getStart()));
    }
    else {
      new_walk_path(getStart());
    }

  }

  function new_walk_path(root) {
    if(root.distance === 0 && !root.start_cell) {
      return;
    }
    if(!root.start_cell){
      getCellElem(root.x, root.y).style.backgroundColor = "cadetblue";
    }
    let lowest_neighbors = root.getLowestDistanceNeighbors();

    let next_cell = null;
    let best_crow_distance = Infinity;
    for (let l_n of lowest_neighbors) {
      if(l_n.getCrowFlyDistance() < best_crow_distance) {
        next_cell = l_n;
        best_crow_distance = l_n.getCrowFlyDistance();
      }
    }

    if (visualization_mode){
      sleep(gameSpeed).then(() => new_walk_path(next_cell));
    }
    else {
      new_walk_path(lowest_neighbors[0]);
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

  function getEnd() {
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const cell = getCell(x, y);
        if (cell.end_cell) {
          return cell;
        }
      }
    }
  }

  function getStart() {
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const cell = getCell(x, y);
        if (cell.start_cell) {
          return cell;
        }
      }
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
