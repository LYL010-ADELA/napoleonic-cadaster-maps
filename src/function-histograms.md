---
title: Napoleonic Cadaster - Functions Histograms
toc: false
style: components/custom-style.css
---


# Napoleonic Cadaster - Functions Histograms.

<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container" class="block-component"></div>
<div id="barchart-legend"></div>
</div>

```js
import {cookData} from "./components/map-expropriation.js";
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

```js
const plotWidth = 1200;
const plotHeight = 750;
const marginLeft = 1;
const cookedData = cookData(registre, 10);
const sBarChart = Plot.plot({
  width: plotWidth,
  height: plotHeight,
  y: {tickFormat: "s", tickSpacing: 50},
  marginLeft: marginLeft,
  color: {
    scheme: "Spectral",
    type: "categorical", 
    columns: 3,
    legend: true,
    width: plotWidth - 400,
    marginLeft: marginLeft
  },
  marks: [
    Plot.barY(cookedData, {
        x: "name",
        y: "count",
        fill: "quality",
        title: v => `${v.quality}:${v.count}`,
        sort: {x: "-y"},
        tip: true
      }
    ),
    Plot.axisX({label: null, lineWidth: 8, marginBottom: 40}),
  ],
  tooltip: {
    fill: "white",
    stroke: "blue",
    r: 8
  }
});

// const legend = Plot.legend({})

document.getElementById('barchart-container').append(sBarChart)
```
