export const createBoard = (rows, cols, mines) => {
  const board = [];
  for (let x = 0; x < rows; x++) {
    const row = [];
    for (let y = 0; y < cols; y++) {
      row.push({
        x,
        y,
        isMine: false,
        isOpen: false,
        isFlagged: false,
        neighborCount: 0,
      });
    }
    board.push(row);
  }

  // Plant mines
  let minesPlanted = 0;
  while (minesPlanted < mines) {
    const x = Math.floor(Math.random() * rows);
    const y = Math.floor(Math.random() * cols);
    if (!board[x][y].isMine) {
      board[x][y].isMine = true;
      minesPlanted++;
    }
  }

  // Calculate numbers
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      if (!board[x][y].isMine) {
        let count = 0;
        // Check 8 neighbors
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
              if (board[nx][ny].isMine) count++;
            }
          }
        }
        board[x][y].neighborCount = count;
      }
    }
  }

  return board;
};

// Helper to reveal cell and flood fill (mutates board)
const revealLogic = (board, x, y) => {
  const width = board[0].length;
  const height = board.length;
  let hitMine = false;

  if (board[x][y].isOpen || board[x][y].isFlagged) return { hitMine };

  if (board[x][y].isMine) {
    board[x][y].isOpen = true;
    return { hitMine: true };
  }

  const stack = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();

    if (board[cx][cy].isOpen) continue;
    board[cx][cy].isOpen = true;

    if (board[cx][cy].neighborCount === 0) {
       for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < height && ny >= 0 && ny < width) {
            if (!board[nx][ny].isOpen && !board[nx][ny].isFlagged) {
               stack.push([nx, ny]);
            }
          }
        }
      }
    }
  }
  return { hitMine: false };
};

export const reveal = (board, x, y) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const { hitMine } = revealLogic(newBoard, x, y);
  return { board: newBoard, gameOver: hitMine };
};

export const chord = (board, x, y) => {
  const cell = board[x][y];
  if (!cell.isOpen) return { board, gameOver: false };

  const rows = board.length;
  const cols = board[0].length;
  let flaggedNeighbors = 0;

  // Count flags
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
        if (board[nx][ny].isFlagged) flaggedNeighbors++;
      }
    }
  }

  if (flaggedNeighbors !== cell.neighborCount) {
    return { board, gameOver: false };
  }

  // Execute chord
  const newBoard = board.map(row => row.map(c => ({ ...c })));
  let gameOver = false;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
        const neighbor = newBoard[nx][ny];
        if (!neighbor.isOpen && !neighbor.isFlagged) {
           const result = revealLogic(newBoard, nx, ny);
           if (result.hitMine) gameOver = true;
        }
      }
    }
  }

  return { board: newBoard, gameOver };
};

export const toggleFlag = (board, x, y) => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  if (!newBoard[x][y].isOpen) {
    newBoard[x][y].isFlagged = !newBoard[x][y].isFlagged;
  }
  return newBoard;
};

export const checkWin = (board) => {
  for (let row of board) {
    for (let cell of row) {
      if (!cell.isMine && !cell.isOpen) return false;
    }
  }
  return true;
};
