---
title: Napoleonic Cadaster - Functions Histograms
toc: false
style: components/custom-style.css
---


# Napoleonic Cadaster - Functions Histograms.

<!-- Create the tanble container -->
<div id="barchart-container" style="width: 1000px; margin: 1em 0 2em 0;"></div>

```js
import {cookData} from "./components/map-expropriation.js";
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

```js
const cookedData = cookData(registre, 10);
console.log(cookedData);
const sBarChart = Plot.plot({
  width: 928,
  height: 500,
  x: {label: null},
  y: {tickFormat: "s", tickSpacing: 50},
  color: {scheme: "Spectral", legend: "ramp", width: 1000, label: "function"},
  marks: [
    Plot.barY(cookedData, {
      x: "name",
      y: "count",
      fill: "quality",
      title: v => `${v.quality}:${v.count}`
    //   sort: {color: null, x: "-y"}
    }
    )
  ]
});

document.getElementById('barchart-container').append(sBarChart)
```
