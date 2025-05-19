---
title: Napoleonic Cadaster - Porzione Heatmap
toc: false
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
import {createParishCasaAverageSurfaceHeatMap} from "./components/map3.js";
```

# Napoleonic Cadaster - Amount of portioned parcels.
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
```

### Ranking

<!-- Create the tanble container -->
<div id="map-container-porzione-hm" style="height: 1200px; margin: 1em 0 2em 0;"></div>

```js
const table = Inputs.table(porzioneMapComponents.tableData, {
    header: {
        name: "Parish Name",
        average_surface: "Average parcel area (m2)",
        median_surface: "Median parcel area (m2)"
    },
    format: {
       average_surface: (x) => x.toFixed(1),
       median_surface: (x) => x.toFixed(1),
    }, 
    select: false
});
document.getElementById("map-container-porzione-hm").append(table)
```
