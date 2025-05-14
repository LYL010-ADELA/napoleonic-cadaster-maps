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
The heatmap display the amount of time "porzion" appeared in the registries associated to the parcels delimitation

```js
const parcelData = FileAttachment("./data/sommarioni_geometries_internal_20250318.geojson").json();
const parishData = FileAttachment("./data/1740_redrawn_parishes_cleaned_wikidata_standardised.geojson").json();
const registre = FileAttachment("./data/sommarioni_standardisation_pre_finished_20250508.json").json();
```

<!-- Create the map container -->
<div id="map-container-porzione-hm" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const porzioneMapComponents = createParishCasaAverageSurfaceHeatMap("map-container-porzione-hm", parcelData, registre, parishData);
```

### Ranking
TODO
