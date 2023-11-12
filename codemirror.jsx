import React, { useRef, useEffect } from 'react';
import { EditorView, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';


// const myKeymap = keymap.of([
//   {
//     key: 'Enter',
//     run: () => {
//       console.log('Enter pressed');
//       return true;
//     }
//   }
// ]);

const setup = /*@__PURE__*/(() => [
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
        ...lintKeymap
    ])
])();

export const CodeMirror = React.forwardRef(({ value, onChange }, ref) => {
  useEffect(() => {
    const editorView = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          setup,
          EditorView.lineWrapping,
        ]  
      }),
      parent: ref.current
    });

    editorView.dom.addEventListener('input', () => {
      onChange(editorView.state.doc.toString());
    });


    return () => {
      editorView.destroy();
    } 
  }, [value]);

  return <div ref={ref}></div>
})
