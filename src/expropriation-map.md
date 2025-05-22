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
import {createExpropriationMap} from "./components/map4.js";
```

# Napoleonic Cadaster - Expropriations from private institutions.
Display all parcels whose ownerhsip has been transfered the public state of venice by 1808. Clicking on each reveal from which institution the parcel used to belong, and to which public controlled new institution it was transferred. The control on the top right allows to select layer according to which group of institution type has been expropriated.

```js
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<!-- Create the map container -->
<div id="map-container-expropriations" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const expropriationMap = createExpropriationMap("map-container-expropriations", parcelData, registre);
```

### Ranking of most expropriated institution

<!-- Create the tanble container -->
<div id="table-container-expropriation-ranking" style="width: 700px; margin: 1em 0 2em 0;"></div>


```js
const table = Inputs.table(expropriationMap.tableDataStolen, {
    header: {
        name: "Expropriated instituion name",
        surface: "Expropriation size (m2)"
    },
    format: {
       surface: x => x.toFixed(1)
    }, 
    select: false
});
document.getElementById("table-container-expropriation-ranking").append(table)
```


### Ranking of the institution receiving the most surface

<!-- Create the tanble container -->
<div id="table-container-receive-ranking" style="width: 700px; margin: 1em 0 2em 0;"></div>


```js
const table = Inputs.table(expropriationMap.tableDataReceived, {
    header: {
        name: "Receiving instituion name",
        surface: "Received area size (m2)"
    },
    format: {
       surface: x => x.toFixed(1)
    }, 
    select: false
});
document.getElementById("table-container-receive-ranking").append(table)
```