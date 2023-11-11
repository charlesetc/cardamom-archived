import * as React from 'react'
import { createRoot } from 'react-dom/client'
import CodeMirror from '@uiw/react-codemirror';
import { Wheel } from '@uiw/react-color';
import { hsvaToHex } from '@uiw/color-convert';
import { useLocalStorage } from '@rehooks/local-storage';

const { useState } = React;

export function range(n) {
  return [...Array(n).keys()];
}

const defaultSquareColor = { h: 0, s: 0, v: 93, a: 1 }

const codeMirrorRef = React.createRef()

const squares = {}

function Square({row, col}) {
  const id = `${row}-${col}`;
  const [hsva, setHsva] = useLocalStorage(`square-${id}-color`, defaultSquareColor);
  const [title, setTitle] = useLocalStorage(`square-${id}-title`, '');
  const [code, setCode] = useLocalStorage(`square-${id}-code`, '');
  const square = {
    id,
    row,
    col,
    hsva,
    setHsva,
    title,
    setTitle,
    code,
    setCode,
    color() { return hsvaToHex(square.hsva)}
  };
  squares[id] = square;
  return square;
}

const numRows = 30;
const numCols = 20;

function Button({square}) {
  const name = square.title.slice(1, -1)
  return <button>{name}</button>
}

function RenderSquare({square, setSelectedSquare, selectedSquare}) {
  const selected = square.id === (selectedSquare || {}).id
  const z =  square.row * numCols + square.col
  const style = {backgroundColor: square.color(), zIndex: z}
  const onClick = () => setSelectedSquare(square)

  if (selected) {
    return <td
      className={`square ${selected ? 'selected' : ''}`}
      style={style}
      onClick={onClick}
      id={square.id}>
      <input
        type='text'
        autoFocus
        value={square.title}
        onFocus={(e) => { console.log("focus", e);  e.target.select()}}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            const next = squares[`${square.row - 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault()
            codeMirrorRef.current.view.focus()
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const next = squares[`${square.row + 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const next = squares[`${square.row - 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = squares[`${square.row + 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            const next = squares[`${square.row}-${square.col - 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            const next = squares[`${square.row}-${square.col + 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            const next = squares[`${square.row}-${square.col - 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Tab') {
            e.preventDefault()
            const next = squares[`${square.row}-${square.col + 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && e.ctrlKey && e.shiftKey) {
            e.preventDefault()
            square.setHsva(defaultSquareColor)
            const next = squares[`${square.row - 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && e.ctrlKey) {
            e.preventDefault()
            square.setHsva(defaultSquareColor)
            const next = squares[`${square.row}-${square.col - 1}`] || squares[`${square.row - 1}-${numCols - 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && square.title.length === 0 && e.shiftKey) {
            e.preventDefault()
            const next = squares[`${square.row - 1}-${square.col}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' &&  square.title.length === 0) {
            e.preventDefault()
            const next = squares[`${square.row}-${square.col - 1}`] || squares[`${square.row - 1}-${numCols - 1}`]
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Escape') {
            setSelectedSquare(null)
          }
        }}
        onChange={(e) => {
          square.setTitle(e.target.value)
        }}/>
    </td>
  } else {

    const isButton = square.title.startsWith && square.title.startsWith('[') && square.title.endsWith(']')
    const isHeading = square.title.startsWith && square.title.startsWith('#')

    return <td
      className={`square ${isButton ? 'button' : ''} ${isHeading ? 'heading' : ''}`}
      style={style}
      onClick={onClick}
      id={square.id}>
      <pre>
        {isButton ? <Button square={square} /> : <pre className='title'>{square.title}</pre>}
      </pre>
    </td>
  }
}

function Grid({setSelectedSquare, selectedSquare}) {
  const rows = range(numRows);
  const cols = range(numCols);
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
      {console.log(square.code)}
      <CodeMirror value={square.code.toString()} onChange={(value) => square.setCode(value)} ref={codeMirrorRef} className="cm" basicSetup={{lineNumbers: false, foldGutter: false}} />
      <Wheel color={square.hsva} onChange={(color) => square.setHsva({ ...square.hsva, ...color.hsva })} width={50} height={50} />
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
