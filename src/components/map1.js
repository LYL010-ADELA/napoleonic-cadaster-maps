// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";
import {geometryRegistryMap, registryListToHTML, pythonListStringToList, genereateBaseSommarioniBgLayers} from "./common.js";

if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";


// Create Map and Layer - Runs Once
export function createMapAndLayers(mapContainer, geojsonData, registryData, registryField, enabledLayer) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);

    // Add all default layers to the map.
    const bgLayerList = genereateBaseSommarioniBgLayers();
    for( let [key, value] of Object.entries(bgLayerList)){
        layerControl.addBaseLayer(value, key);
    } 
    bgLayerList["Cadastral Board"].addTo(map);
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

            lg.addLayer(featureLayer);
        }    

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);
        let html = registryListToHTML(allRegistryEntries);
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
