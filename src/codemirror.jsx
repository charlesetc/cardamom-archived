import React, { useRef, useEffect } from 'react';
import { EditorView, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching, foldKeymap } from '@codemirror/language';
import { history, indentWithTab,defaultKeymap, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';


const controlEnter = (callback) => keymap.of([
  {
    key: 'Ctrl-Enter',
    run: callback
  }
]);

const basicSetup = [
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    // syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    // autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
    ])
];

export let editorView = null;

export const CodeMirror = ({ square, onChange, onControlEnter }) => {
  const ref = useRef(null);
  useEffect(() => {
    const value = square.code;
    console.log("value", ref.current, value)
    editorView = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          [ controlEnter(onControlEnter) ],
          EditorView.lineWrapping,
        ]  
      }),
      parent: ref.current
    });

    editorView.dom.addEventListener('keyup', () => {
      onChange(editorView.state.doc.toString());
    });

    return () => {
      editorView.destroy();
    } 
  }, [square]);
  return <div ref={ref}></div>
}
