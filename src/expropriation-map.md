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
TODO

```js
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<!-- Create the map container -->
<div id="map-container-expropriations" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const porzioneMapComponents = createExpropriationMap("map-container-expropriations", parcelData, registre);
```

### Barchart

<!-- Create the tanble container -->
<div id="chart-container-expropriation-bar" style="height: 1200px; margin: 1em 0 2em 0;"></div>

```js
```
