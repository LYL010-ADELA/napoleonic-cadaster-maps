// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";
import {geometryRegistryMap, formatRegistryEntryToHTML, pythonListStringToList} from "./common.js";

if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";


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
        if (allRegistryEntries && allRegistryEntries.length > 0) {
            // Doing it that way so the delimitation line is properly displayed.
            html += formatRegistryEntryToHTML(allRegistryEntries[0]);
            for (let i = 1; i < allRegistryEntries.length; i++) {
                html += "<hr>" + formatRegistryEntryToHTML(allRegistryEntries[i]);
            }
        }
        html += "</div>";
        // Add a popup to the feature layer
        featureLayer.bindPopup(html, {'maxWidth':'500','maxHeight':'350','minWidth':'350'});
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
