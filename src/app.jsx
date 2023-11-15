import React, { useEffect } from 'react'
import {atom, useAtom} from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { createRoot } from 'react-dom/client'
import { CodeMirror, editorView } from "./codemirror.jsx";
import { Wheel } from '@uiw/react-color';
import { hsvaToHex } from '@uiw/color-convert';
import { useLocalStorage } from './local-storage.jsx';
import { deepEqual } from './utils.js'
const { useState } = React;

export function range(n) {
  return [...Array(n).keys()];
}

const defaultSquareColor = { h: 0, s: 0, v: 93, a: 1 }
window.defaultSquareColor = defaultSquareColor

const squares = {}

const hueAtom = atomWithStorage('hue-atom-4', 220)

function Square({row, col, prefix}) {
  const id = `${prefix}-${row}-${col}`;
  const [hsva, setHsva] = useLocalStorage(`square-${id}-color`, defaultSquareColor);
  const [title, setTitle] = useLocalStorage(`square-${id}-title`, '');
  const [code, setCode] = useLocalStorage(`square-${id}-code`, '');
  const [hue, setHue] = useAtom(hueAtom)

  function newColorIfNeeded() {
    if (deepEqual(hsva, defaultSquareColor)) {
      const newColor = {
        h: hue,
        s: 40,
        v: 93,
        a: 1,
      }
      setHue((hue + 5) % 360)
      setHsva(newColor)
    }
  }

  const square = {
    id,
    row,
    col,
    hsva,
    setHsva,
    title,
    setTitle,
    code,
    inputRef: React.useRef(),
    updateCode(value) {
      newColorIfNeeded()
      setCode(value)
    },
    color() { return hsvaToHex(square.hsva) },
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
  const onClick = function() {
    if (selected) square.inputRef.current.focus()
    setSelectedSquare(square)
  } 

  if (selected) {
    return <td
      className={`square ${selected ? 'selected' : ''}`}
      style={style}
      onClick={onClick}
      id={square.id}>
      <input
        type='text'
        ref={square.inputRef}
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
            editorView.focus()
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
            const next = square.at(0, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && e.ctrlKey) {
            e.preventDefault()
            square.setHsva(defaultSquareColor)
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' && square.title.length === 0 && e.shiftKey) {
            e.preventDefault()
            const next = square.at(0, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Backspace' &&  square.title.length === 0) {
            e.preventDefault()
            const next = square.at(-1, 0) || square.at(numCols - 1, -1)
            if (next) setSelectedSquare(next)
          } else if (e.key === 'Escape') {
            setSelectedSquare(null)
          }
        }}
        onChange={(e) => { square.setTitle(e.target.value) }}/>
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

function SquareEditor({ square, setSelectedSquare}) {
  const [hue, setHue] = useAtom(hueAtom)

  if (!square) {
    return <div className="square-editor">
        <NavigationGrids selectedSquare={square} setSelectedSquare={setSelectedSquare} />
      </div>
  } else {
    return <div className="square-editor">
      <NavigationGrids selectedSquare={square} setSelectedSquare={setSelectedSquare} />
      {console.log('render square editor', square)}
      <CodeMirror
        square={square}
        onChange={(value) => square.updateCode(value)}
        onControlEnter={() => square.inputRef.current.focus() } />
      <Wheel color={defaultSquareColor} onChange={(color) => {
        setHue(color.hsva.h)
        square.setHsva(color.hsva) 
      }} width={50} height={50} />
    </div>
  }
}

function Main() {
    const [selectedSquare, setSelectedSquare] = useState(null);
  return <div className='main'>
    <Grid prefix='a' rows={numRows} cols={numCols} selectedSquare={selectedSquare} setSelectedSquare={setSelectedSquare} />
    <SquareEditor square={selectedSquare} setSelectedSquare={setSelectedSquare} />
  </div>
}


const targetDiv = document.getElementById('root'); // Replace 'root' with the ID of your target div
const root = createRoot(targetDiv);
root.render(<Main />);
