// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, genereateBaseSommarioniBgLayers } from "./common.js";

let gradePointsColors = [
    // [2000, '#800026'],
    [2, '#BD0026'],
    [1 , '#E31A1C'],
    // [4, '#FC4E2A'],
    // [3, '#FD8D3C'],
    // [2, '#FEB24C'],
    // [1, '#FED976'],
    [0,'#FFEDA0']
];


function getColor(d) {
    for (let i = 0; i < gradePointsColors.length; i++) {
        if (d > gradePointsColors[i][0]) {
            return gradePointsColors[i][1];
        }
    }
    return gradePointsColors[gradePointsColors.length - 1][1];
}


function style(feature) {
    return {
        fillColor: getColor(feature.properties.expropriations.length),
        weight: 0,
        opacity: 1,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.7
    };
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

    // then fetching the surface of all the geometries referenced in the registry and adding them to the properties of the features
    parcelData.features = feats.map(feature => {
        const geometry_id = String(feature.properties.geometry_id);
        const registryEntries = registryMap.get(geometry_id);
        let expropriations = [];
        if (registryEntries) {
            registryEntries.forEach(entry => {
                if (entry["owner_standardised"] && entry["old_entity_standardised"]) {
                    expropriations.push(entry);
                }
            });
            if (expropriations.length > 0) {
                feature.properties["expropriations"] = expropriations;
            }
        }
    });
    parcelData.features = feats.filter(feature => feature.properties.expropriations);

    console.log("parcelData.features", parcelData.features);

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
    let geoJsonLayer = null

    function resetHighlight(e) {
        geoJsonLayer.resetStyle(e.target);
    }

    geoJsonLayer = L.geoJSON(parcelData, {style: style, onEachFeature: (feature, featureLayer) => {
        featureLayer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight
        })
        // Add a popup to the feature layerr
        featureLayer.bindPopup("<div>"+feature.properties.expropriations+"</div>", {'maxWidth':'500','maxHeight':'350','minWidth':'50'});
        featureLayer.bindTooltip("<div class='popup'>"+feature.properties.expropriations.length+"</div>");
    }}).addTo(map);



    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = gradePointsColors.map(color => color[0]).reverse();

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
    return { map, layerControl, geoJsonLayer }
}
