---
title: Napoleonic Cadaster - Functions Histograms
toc: false
style: components/custom-style.css
---


# Napoleonic Cadaster - Functions Histograms (Absolute count).

For the 10 standardised owners possessing the most amount of parcel, we display the count of all the different functions
attributed to each of their possessed parcels.

<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container" class="block-component"></div>
<div id="barchart-legend"></div>
</div>

```js
import {cookData, cookDataInSurfaceArea} from "./components/function-data-cooking.js";
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
```

```js
const plotWidth = 1200;
const plotHeight = 750;
const marginLeft = 50;
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
        title: v => `${v.quality}: ${v.count}`,
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

document.getElementById('barchart-container').append(sBarChart)
```


# Napoleonic Cadaster - Functions Histograms (In m2 surface).

For the 10 standardised owners possessing the most amount of parcel, we display the total amount of surface each of the function attributed to each of their possessed parcel amount to.

<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-surface-container" class="block-component"></div>
<div id="barchart-surface-legend"></div>
</div>


```js
const cookedDataSurface = cookDataInSurfaceArea(registre, parcelData, 10);
const sBarChartSurface = Plot.plot({
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
    Plot.barY(cookedDataSurface, {
        x: "name",
        y: "surface",
        fill: "quality",
        title: v => `${v.quality}: ${v.surface.toFixed(1)}m2`,
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

document.getElementById('barchart-surface-container').append(sBarChartSurface);
```
