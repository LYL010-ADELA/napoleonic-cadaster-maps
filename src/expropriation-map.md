---
title: Napoleonic Cadaster - Expropriation Map
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
import {createExpropriationParcelMap, createExpropriationParishMap, formatNameGeometryIdStringIntoHref, returnBoundExtentOfGeometryList} from "./components/map-expropriation.js";
```

# Napoleonic Cadaster - Expropriations from private institutions.
Display all parcels whose ownerhsip has been transfered to the public state of Venice by 1808. Clicking on each reveal from which institution the parcel used to belong, and to which state-controlled institution it was transferred. The control on the top right allows to select layer according to which group of type of institution has been expropriated.

```js
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
const parishData = FileAttachment("./data/1740_redrawn_parishes_cleaned_wikidata_standardised.geojson").json();
```

<!-- Create the map container -->
<div id="map-container-expropriations" class="map-component" style="height: 750px;"></div>

```js
// Call the creation function and store the results
const expropriationMap = createExpropriationParcelMap("map-container-expropriations", parcelData, registre);

// affecting values to the window is the easiest way to break the observable sandbox and make code available in the plain JS context of the webpage.
window.highlightExpropriationFeatures = (geometryIdList) => {
    expropriationMap.geoJsonLayer.resetStyle();
    expropriationMap.map.flyTo(returnBoundExtentOfGeometryList(geometryIdList.map(a => expropriationMap.geometryIdFeatureMap.get(String(a)))), 15.4); 
    for (const id of geometryIdList) {
        expropriationMap.geometryIdFeatureMap.get(String(id)).setStyle({
            weight: 5,
            color: '#FF0000',
            dashArray: '',
            fillOpacity: 0.7
        });
    }
};

window.geometryIdFeatureMap = expropriationMap.geometryIdFeatureMap;
```

### Most expropriated institution

<!-- Create the table container -->

<div class="block-container">
<div id="table-container-expropriation-ranking"></div>
</div>

```js
const table = Inputs.table(expropriationMap.tableDataStolen, {
    header: {
        name: "Expropriated instituion name",
        surface: "Expropriation size (m2)"
    },
    format: {
       surface: x => x.toFixed(1),
       name: y => formatNameGeometryIdStringIntoHref(y)
    }, 
    select: false
});
document.getElementById("table-container-expropriation-ranking").append(table)
```


<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container-expropriation-ranking" style="width: 1000px; margin: 1em 0 2em 0;"></div>
</div>

```js
const chart = Plot.barY(expropriationMap.tableGroupStolen, {x: "name", y: "surface"}, Plot.axisX({label: null, lineWidth: 8, marginBottom: 40})).plot({marginLeft: 160, width:1000});
document.getElementById("barchart-container-expropriation-ranking").append(chart);
```


### [[Most expropriated institutions Analysis]]

### Ranking of the institution receiving the most surface

<!-- Create the tanble container -->
<div class="block-container">
<div id="table-container-receive-ranking" style="width: 700px; margin: 1em 0 2em 0;"></div>
</div>

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
document.getElementById("table-container-receive-ranking").append(table);
```


<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container-received-propriety"></div>
</div>

```js
const chartReceived = Plot.barX(expropriationMap.tableDataReceived, {y: "name", x: "surface"}, Plot.axisY({label: null})).plot({marginLeft: 230, width:1000});
document.getElementById("barchart-container-received-propriety").append(chartReceived);
```

### [[ Institutions receiving most surface Analysis]]

# Percentage of expropriated surface per parish delimitations:


<div id="map-container-parish-expropriation-size-hm" class="map-component"></div>

```js
// Call the creation function and store the results
const parishMapComponents = createExpropriationParishMap("map-container-parish-expropriation-size-hm", parcelData, registre, parishData);

// affecting values to the window is the easiest way to break the observable sandbox and make code available in the plain JS context of the webpage.
window.highlightFeature = (name) => {
    parishMapComponents.geoJsonLayerParish.resetStyle();
    // for some reason, observable does not let me set intermediat variable, so all action on layer has to call the layer from the hashMap again.
    parishMapComponents.map.flyTo(parishMapComponents.parishNameLayerMap.get(name).getBounds().getCenter(), 15.4);
    parishMapComponents.parishNameLayerMap.get(name).setStyle({
        weight: 5,
        color: '#FFF',
        dashArray: '',
        fillOpacity: 0.7
    });
    parishMapComponents.parishNameLayerMap.get(name).bringToFront();
    parishMapComponents.parishNameLayerMap.get(name).openPopup();
};
```
<!-- Create the tanble container -->
<div class="block-container">
<div id="table-container-parish-expropriation-surface-ranking"></div>
</div>

```js
const table = Inputs.table(parishMapComponents.tableData, {
    header: {
        name: "Parish Name",
        expropriation_percentage: "Percentage of expropriated surface",
    },
    format: {
        name: id => htl.html`<a class="hover-line table-row-padding" onclick=window.highlightFeature("${id}");>${id}</a>`,
       expropriation_percentage: x => String((x*100.0).toFixed(2))+'%'
    }, 
    select: false
});
document.getElementById("table-container-parish-expropriation-surface-ranking").append(table)
```


### [[Expropriation density per parish Analysis]]