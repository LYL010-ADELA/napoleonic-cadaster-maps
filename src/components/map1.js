// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";

if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";

// merge the two list of objects using the "geometry_id" field:
function geometryRegistryMap(registryData) {
    const geometryRegistryMap = new Map();
    registryData.forEach(entry => {
        const geometry_id = String(entry.geometry_id);
        if (!geometryRegistryMap.has(geometry_id)) {
            geometryRegistryMap.set(geometry_id, []);
        }
        geometryRegistryMap.get(geometry_id).push(entry);
    });
    return geometryRegistryMap;
}


let exclude_cols = ["geometry_id", "unique_id"];

function formatRegistryEntryToHTML(entry) {
    let html = "<div>";
    for (const [key, value] of Object.entries(entry)) {
        if (!exclude_cols.includes(key) && value !== null) {    
            html += `<strong>${key}:</strong> ${value}<br>`;
        } 
    }
    html += "</div>";
    return html;
}

function pythonListStringToList(pythonListString) {
    if (typeof pythonListString !== 'string') {
        return [];
    }
    // Remove the leading and trailing brackets
    pythonListString = pythonListString.trim().slice(1, -1);
    // Split the string by commas, but only if they are not inside quotes
    const regex = /,(?=(?:(?:[^'"]*['"][^'"]*['"])*[^'"]*$)(?:(?:[^"']*["'][^"']*["'])*[^"']*$))/g;
    const items = pythonListString.split(regex);
    // Remove leading and trailing whitespace from each item
    const cleanedItems = items.map(item => item.trim());
    // Remove leading and trailing quotes from each item
    const finalItems = cleanedItems.map(item => {
        if (item.startsWith("'") && item.endsWith("'")) {
            return item.slice(1, -1);
        } else if (item.startsWith('"') && item.endsWith('"')) {
            return item.slice(1, -1);
        }
        return item;
    });
    return finalItems;
}


function randomCssColor(seed) {
    // get numeric hash from the seed
    const hash = seed.split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    // Use the hash to generate a random number
    const randomNum = Math.abs(Math.sin(hash)) * 1000;
    // Generate a random color based on the seed
    const r = Math.floor((Math.sin(randomNum) + 1) * 127.5);
    const g = Math.floor((Math.sin(randomNum + 1) + 1) * 127.5);
    const b = Math.floor((Math.sin(randomNum + 2) + 1) * 127.5);
    return `rgb(${r}, ${g}, ${b})`;
}

// Create Map and Layer - Runs Once
export function createMapAndLayers(mapContainer, geojsonData, registryData, registryField, enabledLayer) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:25}).setView([45.4382745, 12.3433387 ], 14);

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
        if (registryEntries) {
            let values = [];
            registryEntries.forEach(entry => {
                if (entry[registryField]) {
                    let converted_vals = pythonListStringToList(entry[registryField]);
                    for (let i = 0; i < converted_vals.length; i++) {
                        let value = converted_vals[i];
                        if (value.length > 0) {
                            values.push(value);
                        }
                    }
                }
            });
            // Remove duplicates
            values = [...new Set(values)];
            // Add the ownership_types to the feature properties
            feature.properties[registryField] = values;
        }
        return feature;
    }).filter(feature => feature.properties[registryField])
    
    let mapLayerGroups = {};
    function onEachFeature(feature, featureLayer) {

        //does layerGroup already exist? if not create it and add to map
        let values = feature.properties[registryField];
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            var lg = mapLayerGroups[value];

            if (lg === undefined) {
                lg = new L.layerGroup();
                //add the layer to the map
                if (enabledLayer){
                    lg.addTo(map);
                }
                //store layer
                mapLayerGroups[value] = lg;
            }

            //add the feature to the layer
            // lg.addLayer(featureLayer.setStyle({
            //     color: randomCssColor(value)
            // }));  
            lg.addLayer(featureLayer);
        }    

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);
        let html = "<div>";
        if (allRegistryEntries){
            if(allRegistryEntries.length > 1) {
                allRegistryEntries.forEach(entry => {
                    html += formatRegistryEntryToHTML(entry) + "<hr>"; 
                });
            }
            else {
                html += formatRegistryEntryToHTML(allRegistryEntries[0]);
            }
        }
        html += "</div>";
        // Add a popup to the feature layer
        featureLayer.bindPopup(html);
    }
    // Store map from geom_id -> leaflet layer instance
    const featureLayersMap = new Map();
    const geoJsonLayer = L.geoJSON(geojsonData, {onEachFeature: onEachFeature});
    for (const [key, value] of Object.entries(mapLayerGroups)) {    
        layerControl.addOverlay(value, key);
    }
    // layerControl.addOverlay(geoJsonLayer, "Cadastral");

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayer, featureLayersMap, mapLayerGroups };
}

// Call the creation function and store the results
