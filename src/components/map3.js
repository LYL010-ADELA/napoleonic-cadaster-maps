// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, registryListToHTML, genereateBaseSommarioniBgLayers, pythonListStringToList } from "./common.js";

function getColor(d) {
    return d > 15000 ? '#800026' :
           d > 10000  ? '#BD0026' :
           d > 8000  ? '#E31A1C' :
           d > 5000  ? '#FC4E2A' :
           d > 3000   ? '#FD8D3C' :
           d > 2000   ? '#FEB24C' :
           d > 1000   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.average_surface),
        weight: 0,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function average(l) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < l.length; i++) {
        if (l[i] > 0) {
            sum += l[i];
            count++;
        }
    }
    return count > 0 ? sum / count : 0;
}

function displyOnlyOneValueAftreComma(value) {
    if (value) {
        let str = value.toString();
        let index = str.indexOf(".");
        if (index !== -1) {
            return str.substring(0, index + 2);
        }
    }
    return value;
}

// Create Map and Layer - Runs Once
export function createParishCasaAverageSurfaceHeatMap(mapContainer, parcelData, registryData, parishData) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);
    const bgLayerList = genereateBaseSommarioniBgLayers();
    for( let [key, value] of Object.entries(bgLayerList)){
        layerControl.addBaseLayer(value, key);
    } 
    bgLayerList["Cadastral Board"].addTo(map);

    let registryMap = geometryRegistryMap(registryData);
    //filtering the data to keep only geometries referenced in the registry (i.e. the ones having a geometry_id value)
    let feats = parcelData.features.filter(feature => feature.properties.geometry_id)
    // then fetching the surface of all the geometries referenced in the registry and adding them to the properties of the features
    parcelData.features = feats.map(feature => {
        const geometry_id = String(feature.properties.geometry_id);
        const registryEntries = registryMap.get(geometry_id);
        feature.properties['surface'] = 0;
        if (registryEntries) {
            let areas = [];
            registryEntries.forEach(entry => {
                if (entry["qualities"]) {
                    let converted_vals = pythonListStringToList(entry["qualities"]);
                    for (let i = 0; i < converted_vals.length; i++) {
                        let value = converted_vals[i];
                        if (value == 'CASA') {
                            areas.push(entry["area"]);
                        }
                    }
                    if (areas.length > 0) {
                        feature.properties['surface'] = average(areas);
                    }
                }
            });
        }
        return feature;
    }).filter(feature => feature.properties.surface > 0);

    parishData.features = parishData.features.map(feature => {
        const parishName = feature.properties.NAME;
        const parcelWithParish = parcelData.features.filter(parcel => parcel.properties.parish_standardized === parishName);
        const averageSurface = average(parcelWithParish.map(parcel => parcel.properties.surface));
        feature.properties['average_surface'] = averageSurface;
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

    geoJsonLayer = L.geoJSON(parishData, {style: style, onEachFeature: (feature, featureLayer) => {
        featureLayer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight
        })

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);
        let html = registryListToHTML(allRegistryEntries);
        // Add a popup to the feature layerr
        featureLayer.bindPopup("<div>"+feature.properties.NAME+"</div>", {'maxWidth':'500','maxHeight':'350','minWidth':'50'});
        featureLayer.bindTooltip("<div class='popup'>"+displyOnlyOneValueAftreComma(feature.properties.average_surface)+"m2</div>");
    }}).addTo(map);


    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1000, 2000, 3000, 5000, 8000, 10000, 15000];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
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
