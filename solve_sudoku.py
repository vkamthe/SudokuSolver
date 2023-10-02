def solve_sudoku(board):
    """
    Solves a Sudoku puzzle using backtracking.

    :param board: 2D list representing the Sudoku puzzle
    :return: True if the puzzle is solved, False otherwise
    """
    empty_cell = find_empty_cell(board)
    
    if not empty_cell:
        # If there are no empty cells, the puzzle is solved
        return True
    
    row, col = empty_cell
    
    for num in range(1, 10):
        if is_valid_move(board, num, (row, col)):
            # Try placing the number in the empty cell
            board[row][col] = num
            
            # Recursively attempt to solve the puzzle
            if solve_sudoku(board):
                return True
            
            # If the recursive call fails, backtrack and try the next number
            board[row][col] = 0
    
    # If no number can be placed in this cell, backtrack further
    return False

def find_empty_cell(board):
    """
    Find the first empty cell (cell with value 0) in the Sudoku puzzle.

    :param board: 2D list representing the Sudoku puzzle
    :return: (row, col) tuple of the first empty cell, or None if no empty cells are found
    """
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                return (row, col)
    return None

def is_valid_move(board, num, position):
    """
    Check if placing a number in a given position is a valid move in the Sudoku puzzle.

    :param board: 2D list representing the Sudoku puzzle
    :param num: The number to be placed
    :param position: (row, col) tuple representing the position to be checked
    :return: True if the move is valid, False otherwise
    """
    row, col = position
    
    # Check row
    if num in board[row]:
        return False
    
    # Check column
    if num in [board[i][col] for i in range(9)]:
        return False
    
    # Check 3x3 box
    box_row, box_col = row // 3 * 3, col // 3 * 3
    for i in range(box_row, box_row + 3):
        for j in range(box_col, box_col + 3):
            if board[i][j] == num:
                return False
    
    return True
