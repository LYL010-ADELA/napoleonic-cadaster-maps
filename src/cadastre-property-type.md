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

<div id="map-container-ownership-type" class="map-component"></div>

```js
const ownMapComponents = createMapAndLayers("map-container-ownership-type", geojson, registre, 'ownership_types_en', true);
```


## Functions of parcel
<div id="map-container-func-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-func-type", geojson, registre, 'qualities_en', false);
```


## Class of standardized owner
<div id="map-container-own-class" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-class", geojson, registre, 'owner_standardised_class', true);
```


## Type of owner
<div id="map-container-own-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-type", geojson, registre, 'owner_type_en', true);
```


## Owner right of use
<div id="map-container-own-ros" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-ros", geojson, registre, 'owner_right_of_use_en', false);
```


## old entity religious type
<div id="map-container-old-ent-reg-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-old-ent-reg-type", geojson, registre, 'old_religious_entity_type_en', true);
```

# old owner type

<div id="map-container-old-own-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-old-own-type", geojson, registre, 'old_owner_type_en', true);
```