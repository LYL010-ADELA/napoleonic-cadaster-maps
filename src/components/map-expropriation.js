// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, genereateBaseSommarioniBgLayers } from "./common.js";

function countFunctionOccurences(acc, curr) {
    // the accumulator is a map of the function's name, and the key the number of time it occurs
    for(let i = 0; i < curr.qualities.length; ++i){
        let curr_quality = curr.qualities[i];
        if (acc[curr_quality]) {
            acc[curr_quality] += 1;
        } else {
            acc[curr_quality] = 1;
        }
    } 
    return acc;
}

function fetchAllQualitiesIntoDict(registryData) {
    let allQualities = [];
    registryData.forEach(entry => {
        if (entry.qualities) {
            allQualities = allQualities.concat(entry.qualities);
        }
    });
    let finalDict = {};
    let setQualities = [...new Set(allQualities)];
    for (const key in setQualities) {
        finalDict[key] = 0
      }
    return finalDict;
}

export function cookData(registryData, N) {
    let groupedInstitutions = Object.groupBy(registryData, v => v.owner_standardised);

    let baseDict = fetchAllQualitiesIntoDict(registryData);
    let NMostRepresentedInstitutions = Object.entries(groupedInstitutions)
        .map(([key, value]) => {
            return {
                name: key,
                count: value.length,
                qualities: value.reduce(countFunctionOccurences,{})
            };
        })
        .sort((a, b) => b.count - a.count)
        .filter(v => v.name !== 'possessore ignoto')
        .slice(0, N);
    let vs = NMostRepresentedInstitutions.flatMap(v => {
        return Object.entries(v.qualities).map(k => {
            return {
                "name": v.name,
                "count": k[1],
                "quality": k[0],
            }
        })
    });
    return vs.filter(v => v.count > 2 && v.quality !== "");
}

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
                group: expropriation.old_entity_standardised_class.trim()
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

    let tableGroupStolen = Object.groupBy(expropriationStats, v => v.group);
    tableGroupStolen = Object.entries(tableGroupStolen).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        return {
            name: key,
            surface: totalSurface
        };
    });
    tableGroupStolen = tableGroupStolen.sort((a, b) => b.surface - a.surface);


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

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayer, tableDataStolen, tableDataReceived, tableGroupStolen }
}
