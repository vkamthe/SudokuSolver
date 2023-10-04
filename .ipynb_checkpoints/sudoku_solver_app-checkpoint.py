import streamlit as st
import numpy as np

def main():
    st.title("Sudoku Solver")

    # Create an input field for users to input the Sudoku puzzle as a comma-separated string
    puzzle_str = st.text_area("Enter Sudoku Puzzle (Use 0 for empty cells):", "")

    if st.button("Solve"):
        try:
            puzzle = [[int(num) for num in row.split(",")] for row in puzzle_str.split("\n")]
            if len(puzzle) != 9 or any(len(row) != 9 for row in puzzle):
                st.error("Invalid Sudoku puzzle format. Please enter a 9x9 grid.")
            else:
                solved = solve_sudoku(puzzle.copy())
                if solved:
                    st.success("Sudoku Puzzle Solved:")
                    st.text_area("Solved Puzzle:", value="\n".join([",".join(map(str, row)) for row in puzzle]), height=200)
                else:
                    st.error("Unable to solve Sudoku puzzle.")
        except ValueError:
            st.error("Invalid characters in the input. Please use numbers and commas.")

if __name__ == "__main__":
    main()
