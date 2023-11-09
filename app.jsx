import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { HexColorPicker } from "react-colorful";
const { useState } = React;

export function range(n) {
  return [...Array(n).keys()];
}

function Square({row, col}) {
  const [color, setColor] = useState("#ececec");
  const id = `${row}-${col}`;
  return {id, row, col, color, setColor};
}

function RenderSquare({square, setSelectedSquare, selectedSquare}) {
  return <td
    className={`square ${square.id == (selectedSquare || {}).id ? 'selected' : ''}`}
    style={{backgroundColor: square.color}}
    onClick={() => setSelectedSquare(square)}
    id={square.id}></td>
}

function Grid({setSelectedSquare, selectedSquare}) {
  const rows = range(30);
  const cols = range(20);
  return <table className="grid">
  <tbody>
    {rows.map((i) => 
      <tr key={i} className="row">
        {cols.map((j) => {
          const square = Square({row: i, col: j});
          return (
            <RenderSquare
            key={square.id}
            selectedSquare={selectedSquare}
            setSelectedSquare={setSelectedSquare}
            square={square} />
          )
        })}
      </tr>
    )}
  </tbody>
  </table>
}

function SquareEditor({square}) {
  if (!square) {
    return <div className="square-editor"></div>
  } else {
    return <div className="square-editor">
      <HexColorPicker color={square.color} onChange={square.setColor} />
    </div>
  }
}

function Main() {
  const [selectedSquare, setSelectedSquare] = useState(null);
  return <>
    <Grid selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
    <SquareEditor square={selectedSquare} />

  </>
}

const targetDiv = document.getElementById('root'); // Replace 'root' with the ID of your target div
const root = createRoot(targetDiv);
root.render(<Main />);
