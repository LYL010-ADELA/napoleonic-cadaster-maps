---
title: Napoleonic Cadaster - property type
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
import {createMapAndLayers} from "./components/map-standard-types.js";
```

# Napoleonic Cadaster - Map of ownership types and parcels functions.
To toggle the parcel according to their types, use the layer control button on the top left corner of each map. All ownership types layer are enabled by default while the parcel functions are disabled.

## Type of ownership

```js
const geojson = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<div id="map-container-ownership-type" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
const ownMapComponents = createMapAndLayers("map-container-ownership-type", geojson, registre, 'ownership_types', true);
```


## Functions of parcel
<div id="map-container-func-type" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
const funMapComponents = createMapAndLayers("map-container-func-type", geojson, registre, 'qualities', false);
```


## Class of standardized owner
<div id="map-container-own-class" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-class", geojson, registre, 'owner_standardised_class', true);
```


## Type of owner
<div id="map-container-own-type" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-type", geojson, registre, 'owner_type', true);
```


## Owner right of use
<div id="map-container-own-ros" style="height: 750px; margin: 1em 0 2em 0;"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-ros", geojson, registre, 'owner_right_of_use', false);
```
