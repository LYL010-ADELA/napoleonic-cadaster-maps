// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, registryListToHTML } from "./common.js";

function getColor(d) {
    return d > 7 ? '#800026' :
           d > 6  ? '#BD0026' :
           d > 5  ? '#E31A1C' :
           d > 4  ? '#FC4E2A' :
           d > 3   ? '#FD8D3C' :
           d > 2   ? '#FEB24C' :
           d > 1   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.porzione_count),
        weight: 0,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function countPorzioneFromeQualityFieldInRegistryList(registryEntryList) {
    let porzioneCount = 0;
    if (!registryEntryList || registryEntryList.length === 0) {
        return porzioneCount;
    }
    for (const entry of registryEntryList) {
        const qualityField = entry["quality"];
        if (qualityField) {
            porzioneCount += (qualityField.toLowerCase().match(/porzion/g) || []).length;
        }
    }
    return porzioneCount;
}


// Create Map and Layer - Runs Once
export function createPorzioneHeatMap(mapContainer, geojsonData, registryData) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const cartoLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const sommarioniBoardLayer = L.tileLayer("https://geo-timemachine.epfl.ch/geoserver/www/tilesets/venice/sommarioni/{z}/{x}/{y}.png",{
         attribution: '&copy; <a href="https://timeatlas.eu/">Time Atlas@EPFL</a>'
    }).addTo(map);

    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);

    // Add the OSM and Carto layers to the control
    layerControl.addBaseLayer(osmLayer, "OSM");
    layerControl.addBaseLayer(cartoLayer, "Carto");
    layerControl.addBaseLayer(sommarioniBoardLayer, "Cadastral Board");

    let registryMap = geometryRegistryMap(registryData);
    //filtering the data to keep only geometries referenced in the registry (i.e. the ones having a geometry_id value)
    let feats = geojsonData.features.filter(feature => feature.properties.geometry_id)
    // then fetching the value of "ownership_types" from the registry and adding them to the properties of the features
    geojsonData.features = feats.map(feature => {
        const geometry_id = String(feature.properties.geometry_id);
        const registryEntries = registryMap.get(geometry_id);
        const porzioneCount = countPorzioneFromeQualityFieldInRegistryList(registryEntries);
        feature.properties["porzione_count"] = porzioneCount;
        return feature;
    });


    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#FFF',
            dashArray: '',
            fillOpacity: 0.7
        });

        layer.bringToFront();
    }

    // define the geoJsonLayer variable outside the function
    // so that it can be accessed in the resetHighlight function
    // and the resetHighlight function can be called from the onEachFeature function
    let geoJsonLayer = null;
    function resetHighlight(e) {
        geoJsonLayer.resetStyle(e.target);
    }

    geoJsonLayer = L.geoJSON(geojsonData, {style: style, onEachFeature: (feature, featureLayer) => {
        featureLayer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight
        })

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);
        let html = registryListToHTML(allRegistryEntries);
        // Add a popup to the feature layer
        let count = feature.properties.porzione_count;
        featureLayer.bindPopup(html, {'maxWidth':'500','maxHeight':'350','minWidth':'350'});
        featureLayer.bindTooltip("<div class='popup'>"+count+(count > 1?" porzioni": " porzione")+"</div>");
    }}).addTo(map);


    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1, 2, 3, 4, 5, 6, 7];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '<br>' : '+');
        }

        return div;
    };
    legend.addTo(map);

    function addStyle(styleString) {
        // Utility function to add CSS in multiple passes.
        const style = document.createElement('style');
        style.textContent = styleString;
        document.head.append(style);
    }
    
    addStyle(`
        .info {
            padding: 6px 8px;
            font: 14px/16px Arial, Helvetica, sans-serif;
            background: white;
            background: rgba(255,255,255,0.8);
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            border-radius: 5px;
        }
    `);
    
    addStyle(`
        .info h4 {
            margin: 0 0 5px;
            color: #777;
        }
    `);

    addStyle(`
        .legend {
        line-height: 18px;
        color: #555;
    }`);

    addStyle(`
        .legend i {
            width: 18px;
            height: 18px;
            float: left;
            margin-right: 8px;
            opacity: 0.7;
        }
    `);

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayer };
}
