---
title: Napoleonic Cadaster - Average casa size
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
import {createParishCasaAverageSurfaceHeatMap } from "./components/map-parish.js";
```

# Napoleonic Cadaster - Average size of "CASA" parcel per parish.
The heatmap display per parish the average area of all parcels that have the "casa" (house) function. Smaller average values may denote a higher density of living, as is the case with the redest spot on the map, corresponding to the "Ghetto Nuovo", known for it relative high population density.

```js
const parishData = FileAttachment("./data/1740_redrawn_parishes_cleaned_wikidata_standardised.geojson").json();
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<!-- Create the map container -->
<div id="map-container-casa-average-size-hm" class="map-component"></div>

```js
// Call the creation function and store the results
const porzioneMapComponents = createParishCasaAverageSurfaceHeatMap("map-container-casa-average-size-hm", parcelData, registre, parishData);

// affecting values to the window is the easiest way to break the observable sandbox and make code available in the plain JS context of the webpage.
window.highlightFeature = (name) => {
    porzioneMapComponents.geoJsonLayerAverage.resetStyle();
    // for some reason, observable does not let me set intermediat variable, so all action on layer has to call the layer from the hashMap again.
    porzioneMapComponents.map.flyTo(porzioneMapComponents.parishNameLayerMap.get(name).getBounds().getCenter(), 15.4);
    porzioneMapComponents.parishNameLayerMap.get(name).setStyle({
        weight: 5,
        color: '#FFF',
        dashArray: '',
        fillOpacity: 0.7
    });
    porzioneMapComponents.parishNameLayerMap.get(name).bringToFront();
    porzioneMapComponents.parishNameLayerMap.get(name).openPopup() 
    // document.getElementById('map-container-casa-average-size-hm').scrollIntoView({"behavior":"smooth"});
};
```
<!-- Create the tanble container -->
<div class="block-container">
<div id="table-container-casa-surface-ranking"></div>
</div>

```js
const table = Inputs.table(porzioneMapComponents.tableData, {
    header: {
        name: "Parish Name",
        average_surface: "Average parcel area (m2)",
        median_surface: "Median parcel area (m2)"
    },
    format: {
        name: id => htl.html`<a class="hover-line table-row-padding" onclick=window.highlightFeature("${id}");>${id}</a>`,
       average_surface: x => x.toFixed(1),
       median_surface: x => x.toFixed(1),
    }, 
    select: false
});
document.getElementById("table-container-casa-surface-ranking").append(table)
```
