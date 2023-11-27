import * as React from 'react'
const { useState } = React;

export function useLocalStorage(key, defaultValue) {
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

