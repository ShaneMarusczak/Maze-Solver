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
  let settingWalls = false;
  let leftMouseButtonOnlyDown = false;

  const gameBoard = [];

  const gameBoard_UI = document.getElementById("gameBoard_UI");
  const rowsInput = document.getElementById("rowsInput");
  const colsInput = document.getElementById("colsInput");

  class Cell {
    constructor(x, y, start, end) {
      this.x = x;
      this.y = y;
      this.neighbors = [];
      this.wall = false;
      this.path = false;
      this.start = start;
      this.end = end;
    }

    setNeighbors() {
      const dirs = [-1, 0, 1];
      for (let dirx of dirs) {
        for (let diry of dirs) {
          if (validPosition(this.x + dirx, this.y + diry)) {
            if (dirx === 0 && diry === 0) {
              continue;
            }
            this.neighbors.push([this.x + dirx, this.y + diry]);
          }
        }
      }
    }

    handleClick() {
      if (settingStart && !gameStarted) {
        this.start = true;
        getCellElem(this.x, this.y).classList.add("start");
        settingStart = false;
        settingEnd = true;
      } else if (settingEnd && !gameStarted) {
        this.end = true;
        getCellElem(this.x, this.y).classList.add("end");
        settingEnd = false;
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            getCellElem(x, y).addEventListener("mouseover", onMouseOver);
          }
        }
      }
    }
  }

  function onMouseOver(e) {
    if (leftMouseButtonOnlyDown) {
      let [x, y] = getXYFromCell(e.target);
      gameBoard[x][y].wall = true;
      getCellElem(x, y).classList.add("wall");
    }
  }

  function getCellId(x, y) {
    return "cell-" + x + "-" + y;
  }

  function getCellElem(x, y) {
    return document.getElementById(getCellId(x, y));
  }

  function validPosition(x, y) {
    return x >= 0 && x < cols + 10 && y >= 0 && y < rows + 10;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // function gameTick() {
  //   if (!paused && gameStarted) {
  //     // code here if loop needed
  //     if (!paused) {
  //       sleep(gameSpeed).then(() => gameTick());
  //     }
  //   }
  // }

  function start() {
    document.getElementById("start").removeEventListener("click", start);
    document.getElementById("start").disabled = true;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        getCellElem(x, y).removeEventListener("mouseover", onMouseOver);
      }
    }
    gameStarted = true;
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
      e.target.value != ""
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
      e.target.value != ""
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
      }
    }
  }

  (function () {
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("buildGrid").addEventListener("click", buildGrid);

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    rowsInput.addEventListener("input", testRowsInput);
    colsInput.addEventListener("input", testColsInput);
    colsInput.value = "30";
    rowsInput.value = "30";
    document.getElementById("start").disabled = true;
  })();
})();
