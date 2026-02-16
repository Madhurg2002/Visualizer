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

// Reveal cell and flood fill if zero
export const reveal = (board, x, y) => {
  if (board[x][y].isOpen || board[x][y].isFlagged) return { board, gameOver: false, win: false };

  // Deep copy to avoid mutation issues in React state (though simplistic copy for 2D array of objects)
  // Ideally, use structuredClone or careful mapping. Here we'll do row-by-row mapping for the parts we change or a full clone.
  // For simplicity and performance in this demo, let's clone the whole board structure.
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  const width = newBoard[0].length;
  const height = newBoard.length;
  let gameOver = false;

  if (newBoard[x][y].isMine) {
    newBoard[x][y].isOpen = true;
    gameOver = true;
    // Reveal all mines? handled in UI usually or here
    return { board: newBoard, gameOver, win: false };
  }

  const stack = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    
    if (newBoard[cx][cy].isOpen) continue;
    newBoard[cx][cy].isOpen = true;

    if (newBoard[cx][cy].neighborCount === 0) {
       for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < height && ny >= 0 && ny < width) {
            if (!newBoard[nx][ny].isOpen && !newBoard[nx][ny].isFlagged) {
               stack.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  return { board: newBoard, gameOver, win: false };
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
