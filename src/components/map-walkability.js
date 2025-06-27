import L from "npm:leaflet";
import proj4 from "npm:proj4";
import { genereateBaseSommarioniBgLayers } from "./common.js";

// Define UTM Zone 33N projection
proj4.defs("EPSG:32633", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");

// Convert UTM coordinates to WGS84
function convertUTMToWGS84(x, y) {
    try {
        const [lng, lat] = proj4("EPSG:32633", "EPSG:4326", [x, y]);
        return [lat, lng]; // Leaflet expects [lat, lng]
    } catch (error) {
        console.error("Coordinate conversion failed:", error);
        return null;
    }
}

// Transform GeoJSON data from UTM to WGS84
function transformGeoJSON(geojsonData) {
    const transformedData = {
        ...geojsonData,
        features: geojsonData.features.map(feature => {
            if (feature.geometry.type === "Point") {
                const [x, y] = feature.geometry.coordinates;
                const converted = convertUTMToWGS84(x, y);
                
                if (converted) {
                    return {
                        ...feature,
                        geometry: {
                            ...feature.geometry,
                            coordinates: [converted[1], converted[0]] // GeoJSON expects [lng, lat]
                        }
                    };
                }
            }
            return feature;
        }).filter(feature => {
            // Filter out features where conversion failed
            return feature.geometry.coordinates[0] !== null && feature.geometry.coordinates[1] !== null;
        })
    };
    
    return transformedData;
}

// Define color scheme based on walkability data
function getWalkabilityColor(poiCount) {
    return poiCount > 2000 ? '#800026' :
           poiCount > 1500 ? '#BD0026' :
           poiCount > 1000 ? '#E31A1C' :
           poiCount > 500  ? '#FC4E2A' :
           poiCount > 200  ? '#FD8D3C' :
           poiCount > 100  ? '#FEB24C' :
           poiCount > 50   ? '#FED976' :
                            '#FFEDA0';
}

function getWalkabilityStyle(feature) {
    return {
        fillColor: getWalkabilityColor(feature.properties.poi_count),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7,
        radius: 6 // For point data
    };
}

export function createWalkabilityMap(mapContainer, walkabilityData) {
    // Transform the data first
    const transformedData = transformGeoJSON(walkabilityData);
    
    console.log("Original features:", walkabilityData.features.length);
    console.log("Transformed features:", transformedData.features.length);
    console.log("Sample transformed coordinates:", transformedData.features[0]?.geometry.coordinates);
    
    const map = L.map(mapContainer, {minZoom: 0, maxZoom: 18}).setView([45.4382745, 12.3433387], 14);

    // Add background layer control
    const layerControl = L.control.layers().addTo(map);
    const bgLayerList = genereateBaseSommarioniBgLayers();
    for (let [key, value] of Object.entries(bgLayerList)) {
        layerControl.addBaseLayer(value, key);
    }
    bgLayerList["Cadastral Board"].addTo(map);

    // Create walkability layer
    const walkabilityLayer = L.geoJSON(transformedData, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, getWalkabilityStyle(feature));
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties;
            
            // Create popup content
            let popupContent = `
                <div class="walkability-popup">
                    <h4>5-Minute Walking Accessibility</h4>
                    <p><strong>POI Count:</strong> ${props.poi_count}</p>
                    <p><strong>POI Diversity:</strong> ${props.poi_diversity}</p>
                    <p><strong>Reachable Area:</strong> ${Math.round(props.reachable_area_m2)} m²</p>
                    <p><strong>Building Index:</strong> ${props.building_idx}</p>
                    <p><strong>Position:</strong> Row ${props.row}, Col ${props.col}</p>
                    <h5>POI Type Distribution:</h5>
                    <ul>
            `;
            
            if (props.poi_types) {
                for (const [type, count] of Object.entries(props.poi_types)) {
                    popupContent += `<li><strong>${type}:</strong> ${count}</li>`;
                }
            }
            
            popupContent += `
                    </ul>
                </div>
            `;
            
            layer.bindPopup(popupContent, {
                maxWidth: 400,
                maxHeight: 350,
                minWidth: 300
            });
            
            // Simple tooltip
            layer.bindTooltip(`POI: ${props.poi_count} | Diversity: ${props.poi_diversity}`);
            
            // Add hover effects
            layer.on({
                mouseover: function(e) {
                    const layer = e.target;
                    layer.setStyle({
                        weight: 3,
                        color: '#666',
                        fillOpacity: 0.9
                    });
                },
                mouseout: function(e) {
                    walkabilityLayer.resetStyle(e.target);
                }
            });
        }
    });

    // Add the layer to map and fit bounds
    walkabilityLayer.addTo(map);
    
    // Auto-fit map to data bounds
    if (transformedData.features.length > 0) {
        try {
            map.fitBounds(walkabilityLayer.getBounds(), {padding: [20, 20]});
        } catch (error) {
            console.warn("Could not fit bounds, using default view");
        }
    }

    // Add legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 50, 100, 200, 500, 1000, 1500, 2000];
        
        div.innerHTML = '<h4>POI Count</h4>';
        
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getWalkabilityColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };
    legend.addTo(map);

    // Add statistics panel
    const statsControl = L.control({position: 'topleft'});
    statsControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info stats-panel');
        
        // Calculate statistics
        const features = transformedData.features;
        const poiCounts = features.map(f => f.properties.poi_count);
        const diversities = features.map(f => f.properties.poi_diversity);
        const areas = features.map(f => f.properties.reachable_area_m2);
        
        const avgPOI = Math.round(poiCounts.reduce((a, b) => a + b, 0) / poiCounts.length);
        const maxPOI = Math.max(...poiCounts);
        const avgDiversity = Math.round(diversities.reduce((a, b) => a + b, 0) / diversities.length * 10) / 10;
        const avgArea = Math.round(areas.reduce((a, b) => a + b, 0) / areas.length);
        
        div.innerHTML = `
            <h4>Dataset Statistics</h4>
            <p><strong>Total Points:</strong> ${features.length}</p>
            <p><strong>Avg POI Count:</strong> ${avgPOI}</p>
            <p><strong>Max POI Count:</strong> ${maxPOI}</p>
            <p><strong>Avg Diversity:</strong> ${avgDiversity}</p>
            <p><strong>Avg Area:</strong> ${avgArea} m²</p>
        `;
        
        return div;
    };
    statsControl.addTo(map);

    return { map, layerControl, walkabilityLayer, legend, statsControl };
} 