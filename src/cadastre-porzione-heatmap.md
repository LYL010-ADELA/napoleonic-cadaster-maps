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
import {createPorzioneHeatMap} from "./components/map-porzione.js";
```

# Napoleonic Cadaster - Amount of portioned parcels.
The heatmap display the amount of time "porzion" appeared in the registries associated to the parcels delimitation

```js
const geojson = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<!-- Create the map container -->
<div id="map-container-porzione-hm" class="map-component"></div>

```js
// Call the creation function and store the results
const porzioneMapComponents = createPorzioneHeatMap("map-container-porzione-hm", geojson, registre);
```
