import * as React from 'react'

export function Crosshairs() { 
  return <>
    <div id="vline"></div>
    <div id="hline"></div>
  </>
} 

document.addEventListener("DOMContentLoaded", function() {
  document.onmousemove = (e) => {
    const vline = document.getElementById('vline');
    const hline = document.getElementById('hline');
    if (vline) vline.style.left = `${e.clientX-4}px`;
    if (hline) hline.style.top = `${e.clientY-4}px`;
  }
})
