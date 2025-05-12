---
title: Napoleonic Cadaster - property type
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
import {createMapAndLayers} from "./components/map1.js";
```

# Napoleonic Cadaster - Map of ownership types and parcels functions.
To toggle the parcel according to their types, use the layer control button on the top left corner of each map. All ownership types layer are enabled by default while the parcel functions are disabled.

## Type of ownership

```js
const geojson = FileAttachment("./data/sommarioni_geometries_internal_20250318.geojson").json();
const registre = FileAttachment("./data/sommarioni_standardisation_pre_finished_20250508.json").json();
// merge the two list of objects using the "geometry_id" field:

```
<!-- Create the map container -->
<div id="map-container-own-type" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const ownMapComponents = createMapAndLayers("map-container-own-type", geojson, registre, 'ownership_types', true);
```


## Functions of parcel
<!-- Create the map container -->
<div id="map-container-func-type" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
// Call the creation function and store the results
const funMapComponents = createMapAndLayers("map-container-func-type", geojson, registre, 'qualities', false);
```
