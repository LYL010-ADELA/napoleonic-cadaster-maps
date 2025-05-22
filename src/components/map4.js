// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, genereateBaseSommarioniBgLayers, registryListToHTML } from "./common.js";


// Create Map and Layer - Runs Once
export function createExpropriationMap(mapContainer, parcelData, registryData) {
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
    let feats = parcelData.features.filter(feature => feature.properties.geometry_id);

    let publicEntity = "venezia_entities";
    // then fetching the surface of all the geometries referenced in the registry and adding them to the properties of the features
    parcelData.features = feats.map(feature => {
        const geometry_id = String(feature.properties.geometry_id);
        const registryEntries = registryMap.get(geometry_id);
        let expropriations = [];
        if (registryEntries) {
            registryEntries.forEach(entry => {
                if (entry["owner_standardised_class"] === publicEntity 
                    && entry["old_entity_standardised_class"] !== publicEntity 
                    && entry["old_entity_standardised_class"] !== ""
                    && entry["old_entity_standardised_class"] !== null) {
                    expropriations.push(entry);
                }
            });
        }
        feature.properties["expropriations"] = expropriations;
        return feature;
    }).filter(feature => feature.properties.expropriations.length > 0);

    let mapLayerGroups = {};
    function onEachFeature(feature, featureLayer) {
        let values = feature.properties["expropriations"];
        for (let i = 0; i < values.length; i++) {
            let value = values[i].old_entity_standardised_class;
            var lg = mapLayerGroups[value];
            if (lg === undefined) {
                lg = new L.layerGroup();
                mapLayerGroups[value] = lg;
            }

            lg.addTo(map);
            lg.addLayer(featureLayer);
        }    

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);

        let html = "<div>";
        html += allRegistryEntries.map(entry =>  
            {return `<strong>Previous owner:</strong> ${entry.old_entity_standardised}<br><strong>Owner in 1808:</strong> ${entry.owner_standardised}<br>`;}
        ).reduce((acc, curr) => acc + curr, "");
        html += "</div>";
        // Add a popup to the feature layer
        featureLayer.bindPopup(html, {'maxWidth':'500','maxHeight':'350','minWidth':'350'});
    }

    
    let expropriationStats = structuredClone(parcelData).features.map(feature => {
        return feature.properties.expropriations.map(expropriation => {
            return {
                previous_owner_name: expropriation.old_entity_standardised.trim(),
                owner_name: expropriation.owner_standardised.trim(),
                surface: feature.properties.area,
            };
        });
    }).flat();

    let tableDataStolen = Object.groupBy(expropriationStats, v => v.previous_owner_name);
    tableDataStolen = Object.entries(tableDataStolen).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        return {
            name: key,
            surface: totalSurface
        };
    });
    tableDataStolen = tableDataStolen.sort((a, b) => b.surface - a.surface);



    let tableDataReceived = Object.groupBy(expropriationStats, v => v.owner_name);
    tableDataReceived = Object.entries(tableDataReceived).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        return {
            name: key,
            surface: totalSurface
        };
    });
    tableDataReceived = tableDataReceived.sort((a, b) => b.surface - a.surface);
    console.log(tableDataReceived);

    let geoJsonLayer = L.geoJSON(parcelData, {onEachFeature: onEachFeature}).addTo(map);    
    for (const [key, value] of Object.entries(mapLayerGroups).sort((a, b) => a[0].localeCompare(b[0]))) {
        layerControl.addOverlay(value, key);
    }
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
    return { map, layerControl, geoJsonLayer, tableDataStolen, tableDataReceived }
}
