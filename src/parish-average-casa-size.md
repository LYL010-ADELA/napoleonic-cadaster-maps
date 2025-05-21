---
title: Napoleonic Cadaster - Porzione Heatmap
toc: false
style: components/custom-style.css
---


```js
// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";
```

```js
// Wait for L to be defined before importing the Leaflet.heat plugin
// This is necessary because Leaflet.heat depends on the L variable being defined
if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "./plugins/leaflet-heat.js";
import {createParishCasaAverageSurfaceHeatMap, highlightFeature } from "./components/map3.js";
```

# Napoleonic Cadaster - Average size of "CASA" parcel per parish.
The heatmap display the average area of parcels that have the "casa" function per parish delimitation.

```js
const parishData = FileAttachment("./data/1740_redrawn_parishes_cleaned_wikidata_standardised.geojson").json();
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<!-- Create the map container -->
<div id="map-container-casa-average-size-hm" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const porzioneMapComponents = createParishCasaAverageSurfaceHeatMap("map-container-casa-average-size-hm", parcelData, registre, parishData);

// for debugging purpose, keep in mind to remove it after dev
window.highlightFeature = (name) => {
    porzioneMapComponents.geoJsonLayerAverage.resetStyle();
    porzioneMapComponents.map.flyTo(porzioneMapComponents.parishNameLayerMap.get(name).getBounds().getCenter(), 15.4);
    highlightFeature(porzioneMapComponents.parishNameLayerMap.get(name));
};

window.messageChat = porzioneMapComponents.geoJsonLayerAverage;
// can be useful: .openPopup() 
```

### Ranking

<!-- Create the tanble container -->
<div id="table-container-casa-surface-ranking" style="height: 1200px; margin: 1em 0 2em 0;"></div>

```js
const table = Inputs.table(porzioneMapComponents.tableData, {
    header: {
        name: "Parish Name",
        average_surface: "Average parcel area (m2)",
        median_surface: "Median parcel area (m2)"
    },
    format: {
        name: id => htl.html`<a class="table-row-highlighting" onclick=window.highlightFeature("${id}");>${id}</a>`,
       average_surface: x => x.toFixed(1),
       median_surface: x => x.toFixed(1),
    }, 
    select: false
});
document.getElementById("table-container-casa-surface-ranking").append(table)
```
