import React, { useEffect } from 'react'
import {atom, useAtom} from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { createRoot } from 'react-dom/client'
import { CodeMirror, editorView } from "./codemirror.jsx";
import { Wheel } from '@uiw/react-color';
import { hsvaToHex } from '@uiw/color-convert';
import { useLocalStorage } from './local-storage.jsx';
import { deepEqual } from './utils.js'
import { keymap } from '@codemirror/view';

export function range(n) {
  return [...Array(n).keys()];
}

const defaultSquareColor = { h: 0, s: 0, v: 93, a: 1 }
window.defaultSquareColor = defaultSquareColor

const squares = {}

const hueAtom = atomWithStorage('hue-atom-4', 220)
const selectedAtom = atom(null)

const aPageAtom = atom("a0.0")
const bPageAtom = atom("b0.0")

function Square({row, col, prefix}) {
  function makeId(row, col) {
    return `${prefix}${row}.${col}`;
  }
  const id = makeId(row, col);
  // TODO: are these breaking the Rules of Hooks?
  const [hsva, setHsva] = useLocalStorage(`${id}-color`, defaultSquareColor);
  const [title, setTitle] = useLocalStorage(`${id}-title`, '');
  const [code, setCode] = useLocalStorage(`${id}-code`, '');
  const [hue, setHue] = useAtom(hueAtom)

  function newColorIfNeeded({code}) {
    if (deepEqual(hsva, defaultSquareColor) && code !== "") {
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
      newColorIfNeeded({code: value})
      setCode(value)
    },
    color() { return hsvaToHex(square.hsva) },
    at(x, y) { return squares[makeId(row + y, col + x)] }
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


// Are you seriously not able to edit an atom from a funtion?
function MoveUp(square, setSelected) {
  // const [_, setSelected] = useAtom(selectedAtom)
  const next = square.at(0, -1);
  if (next) setSelected(next)
}

function MoveDown(square, setSelected) {
  // const [_, setSelected] = useAtom(selectedAtom)
  const next = square.at(0, 1);
  if (next) setSelected(next)
}

function MoveLeft(square, setSelected) {
  // const [_, setSelected] = useAtom(selectedAtom)
  const next = square.at(-1, 0) || square.at(numCols - 1, -1)
  if (next) setSelected(next)
}

function MoveRight(square, setSelected) {
  // const [_, setSelected] = useAtom(selectedAtom)
  const next = square.at(1, 0) || square.at(-1 * numCols + 1, 1)
  if (next) setSelected(next)
}

function RenderSquare({aPage, square, pageAtom}) {
  const [selectedSquare, setSelectedSquare] = useAtom(selectedAtom)

  useEffect(() => {
    console.log('here in square', square, aPage)
  }, [aPage])


  let setPage;
  if (pageAtom) {
    setPage = useAtom(pageAtom)[1]
  }

  const isSelected = square.id === (selectedSquare || {}).id
  const z = 1000 - square.row * numCols - square.col
  const style = {backgroundColor: square.color(), zIndex: z}
  const onClick = function() {
    if (isSelected) square.inputRef.current.focus()
    if (pageAtom) {
      console.log('setting page atom to id', pageAtom, square.id)
      setPage(square.id)
    }
    setSelectedSquare(square)
  } 

  if (isSelected) {
    return <td
      className={`square ${isSelected ? 'selected' : ''}`}
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
            MoveUp(square, setSelectedSquare)
          } else if (e.key === 'ArrowDown' && !(e.shiftKey || e.ctrlKey)) {
            MoveDown(square, setSelectedSquare)
          } else if (e.key === 'ArrowLeft' && !(e.shiftKey || e.ctrlKey)) {
            const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
            if (atStart) {
              e.preventDefault()
              MoveLeft(square, setSelectedSquare)
            }
          } else if (e.key === 'ArrowRight' && !(e.shiftKey || e.ctrlKey)) { 
            const atEnd = e.target.selectionStart === e.target.value.length && e.target.selectionEnd === e.target.value.length;
            if (atEnd) {
              e.preventDefault()
              MoveRight(square, setSelectedSquare)
            }
          } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            MoveLeft(square, setSelectedSquare)
          } else if (e.key === 'Tab') {
            e.preventDefault()
            MoveRight(square, setSelectedSquare)
          } else if (e.key === 'Backspace' && e.ctrlKey && e.shiftKey) {
            e.preventDefault()
            square.updateCode('')
            square.setTitle('')
            square.setHsva(defaultSquareColor)
            MoveUp(square, setSelectedSquare)
          } else if (e.key === 'Backspace' && e.ctrlKey) {
            e.preventDefault()
            square.updateCode('')
            square.setTitle('')
            square.setHsva(defaultSquareColor)
            MoveLeft(square, setSelectedSquare)
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

function Grid({pageAtom, aPage, bPage, prefix, rows, cols}) {

  useEffect(() => {
    console.log('here', aPage)
  }, [aPage])

  if (!pageAtom) { // then it is the main grid
    prefix = `${aPage}:${bPage}:${prefix}`
  }

  return <table className="grid">
  <tbody>
    {range(rows).map((i) => 
      <tr key={i} className="row">
        {range(cols).map((j) => {
          const square = Square({row:i , col: j, prefix: prefix});
          return (
            <RenderSquare aPage={aPage} bPage={bPage} pageAtom={pageAtom} key={square.id} square={square} />
          )
        })}
      </tr>
    )}
  </tbody>
  </table>
}

function NavigationGrids() {
  return <div className='navigation-grid'>
    <Grid prefix='a' pageAtom={aPageAtom} rows={2} cols={numCols} />
    <Grid prefix='b' pageAtom={bPageAtom} rows={3} cols={numCols} />
  </div>;
}


function movementKeymaps(selected, setSelected) {
  return keymap.of([
    {
      key: "Ctrl-ArrowLeft",
      run: () => {
        MoveLeft(selected, setSelected)
        setTimeout(() => editorView.focus(), 0)
      }
    },
    {
      key: "Ctrl-ArrowRight",
      run: () => {
        MoveRight(selected, setSelected)
        setTimeout(() => editorView.focus(), 0)
      }
    },
    {
      key: "Ctrl-ArrowUp",
      run: () => {
        MoveUp(selected, setSelected)
        setTimeout(() => editorView.focus(), 0)
      }
    },
    {
      key: "Ctrl-ArrowDown",
      run: () => {
        MoveDown(selected, setSelected)
        setTimeout(() => editorView.focus(), 0)
      }
    },
  ])
}


function SquareEditor({square}) {
  const [_, setHue] = useAtom(hueAtom)
  const [selected, setSelected] = useAtom(selectedAtom)

  if (!square) {
    return <div className="square-editor">
        <NavigationGrids />
      </div>
  } else {
    return <div className="square-editor">
      <NavigationGrids />
      <CodeMirror
        square={square}
        setSelected={setSelected}
        onChange={(value) => square.updateCode(value)}
        onControlEnter={() => square.inputRef.current.focus() }
        keymaps={movementKeymaps(selected, setSelected)}
      />
      <Wheel color={defaultSquareColor} onChange={(color) => {
        setHue(color.hsva.h)
        square.setHsva(color.hsva) 
      }} width={50} height={50} />
    </div>
  }
}

function Main() {
  const [selected] = useAtom(selectedAtom)

  const [bPage] = useAtom(bPageAtom)
  const [aPage] = useAtom(aPageAtom)
  return <div className='main'>
    <Grid isMain={true} prefix='c' rows={numRows} cols={numCols} aPage={aPage} bPage={bPage} />
    <SquareEditor square={selected} />
    <p>
      aPage {aPage}
    </p>
    <p>
      bPage {bPage}
    </p>
  </div>
}


const targetDiv = document.getElementById('root'); // Replace 'root' with the ID of your target div
const root = createRoot(targetDiv);
root.render(<Main />);
