import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { CodeMirror } from "./codemirror.jsx";
import { Wheel } from '@uiw/react-color';
import { hsvaToHex } from '@uiw/color-convert';
const { useState } = React;

export function range(n) {
  return [...Array(n).keys()];
}

function useLocalStorage(key, defaultValue) {
  let startingValue;
  if (localStorage[key]) {
    startingValue = JSON.parse(localStorage[key]);
  } else {
    startingValue = defaultValue;
  }

  const [value, setReactValue] = useState(startingValue);
  const setValue = (newValue) => {
    setReactValue(newValue);
    localStorage[key] = JSON.stringify(newValue);
  }
  return [value, setValue];
}

const defaultSquareColor = { h: 0, s: 0, v: 93, a: 1 }

const codeMirrorRef = React.createRef()

const squares = {}
window.squares = squares

function Square({row, col, prefix}) {
  const id = `${prefix}-${row}-${col}`;
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
    color() { return hsvaToHex(square.hsva)},
    at(x, y) { return squares[`${prefix}-${row + y}-${col + x}`] }
  };
  squares[id] = square;
  return square;
}

function Button({square}) {
  const name = square.title.slice(1, -1)
  return <button
    onClick={(e) => {
      if (!e.shiftKey) {
        e.stopPropagation()
      }
    }}
    >{name}</button>
}

function RenderSquare({square, setSelectedSquare, selectedSquare}) {
  const selected = square.id === (selectedSquare || {}).id
  const z = 1000 - square.row * numCols - square.col
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
        style={{
          width: `${square.title.length + 1}ch`,
        }}
        onFocus={(e) => { e.target.select()}}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            const next = square.at(0, -1);
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault()
            codeMirrorRef.current.view.focus()
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const next = square.at(0, 1);
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowUp' && !(e.shiftKey || e.ctrlKey)) { 
            e.preventDefault()
            const next = square.at(0, -1);
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowDown' && !(e.shiftKey || e.ctrlKey)) {
            e.preventDefault()
            const next = square.at(0, 1);
            if (next) setSelectedSquare(next)
          } else if (e.key === 'ArrowLeft' && !(e.shiftKey || e.ctrlKey)) {
            const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
            if (atStart) {
              e.preventDefault()
              const next = square.at(-1, 0);
              if (next) setSelectedSquare(next)
            }
          } else if (e.key === 'ArrowRight' && !(e.shiftKey || e.ctrlKey)) { 
            const atEnd = e.target.selectionStart === e.target.value.length && e.target.selectionEnd === e.target.value.length;
            if (atEnd) {
              e.preventDefault()
              const next = square.at(1, 0);
              if (next) setSelectedSquare(next)
            }
          } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Tab') {
            e.preventDefault()
            const next = square.at(1, 0) || square.at(-1 * numCols + 1, 1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && e.ctrlKey && e.shiftKey) {
            e.preventDefault()
            square.setHsva(defaultSquareColor)
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && e.ctrlKey) {
            e.preventDefault()
            square.setHsva(defaultSquareColor)
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && square.title.length === 0 && e.shiftKey) {
            e.preventDefault()
            const next = square.at(1, 0) || square.at(-1 * numCols + 1, 1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' &&  square.title.length === 0) {
            e.preventDefault()
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
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

    return <td
      className={`square ${isButton ? 'button' : ''} ${square.title.length <= 2 ? 'short' : ''}`}
      style={style}
      onClick={onClick}
      id={square.id}>
      <pre>
        {isButton ? <Button square={square} /> : <pre className='title'>{square.title}</pre>}
      </pre>
    </td>
  }
}

const numRows = 30;
const numCols = 22;

function Grid({prefix, rows, cols, setSelectedSquare, selectedSquare}) {
  return <table className="grid">
  <tbody>
    {range(rows).map((i) => 
      <tr key={i} className="row">
        {range(cols).map((j) => {
          const square = Square({row:i , col: j, prefix: prefix});
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

function NavigationGrids({setSelectedSquare, selectedSquare}) {
  return <div className='navigation-grid'>
    <Grid prefix='b' rows={2} cols={numCols} selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
    <Grid prefix='c' rows={3} cols={numCols} selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
  </div>;
}

function SquareEditor({square, selectedSquare, setSelectedSquare}) {
  if (!square) {
    return <div className="square-editor">
        <NavigationGrids selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
      </div>
  } else {
    return <div className="square-editor">
      <NavigationGrids selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
      <CodeMirror ref={codeMirrorRef} value={square.code.toString()} onChange={(value) => square.setCode(value)}
      />
      <Wheel color={square.hsva} onChange={(color) => square.setHsva({ ...square.hsva, ...color.hsva })} width={50} height={50} />
    </div>
  }
}

function Main() {
  const [selectedSquare, setSelectedSquare] = useState(null);
  return <div className='main'>
    <Grid prefix='a' rows={numRows} cols={numCols} selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
    <SquareEditor square={selectedSquare} selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
  </div>
}


const targetDiv = document.getElementById('root'); // Replace 'root' with the ID of your target div
const root = createRoot(targetDiv);
root.render(<Main />);
