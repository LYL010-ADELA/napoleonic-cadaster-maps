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

// Color schemes for different indicators
const colorSchemes = {
    // Original POI indicators
    poi_count: {
        name: "POI Count",
        grades: [0, 50, 100, 200, 500, 1000, 1500, 2000],
        colors: ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'],
        getValue: (props) => props.poi_count || 0
    },
    poi_diversity: {
        name: "POI Diversity",
        grades: [0, 1, 2, 3, 4, 5, 6, 7],
        colors: ['#F7FBFF', '#DEEBF7', '#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6', '#2171B5', '#08519C'],
        getValue: (props) => props.poi_diversity || 0
    },
    
    // Bottega indicators
    bottega_count: {
        name: "Bottega Count",
        grades: [0, 5, 10, 20, 50, 100, 200, 500],
        colors: ['#FFF5F0', '#FEE0D2', '#FCBBA1', '#FC9272', '#FB6A4A', '#EF3B2C', '#CB181D', '#A50F15'],
        getValue: (props) => {
            if (props.poi_types && typeof props.poi_types === 'object') {
                return props.poi_types.BOTTEGA || 0;
            }
            return 0;
        }
    },
    bottega_diversity: {
        name: "Bottega Diversity",
        grades: [0, 1, 2, 3, 4, 5, 6, 7],
        colors: ['#F7FCF0', '#E0F3DB', '#CCEBC5', '#A8DDB5', '#7BCCC4', '#4EB3D3', '#2B8CBE', '#0868AC'],
        getValue: (props) => props.bottega_diversity || 0
    },
    shannon_bottega: {
        name: "Shannon Bottega Entropy",
        grades: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
        colors: ['#FCFBFD', '#EFEDF5', '#DADAEB', '#BCBDDC', '#9E9AC8', '#807DBA', '#6A51A3', '#54278F'],
        getValue: (props) => props.shannon_bottega || 0
    },
    
    // Rent indicators
    rent_sum: {
        name: "Total Rent Value",
        grades: [0, 100, 500, 1000, 2000, 5000, 10000, 20000],
        colors: ['#FFFFD9', '#EDF8B1', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#253494'],
        getValue: (props) => props.rent_sum || 0
    },
    rent_mean: {
        name: "Average Rent",
        grades: [0, 10, 25, 50, 100, 200, 500, 1000],
        colors: ['#FFFFD9', '#EDF8B1', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#253494'],
        getValue: (props) => props.rent_mean || 0
    },
    rent_median: {
        name: "Median Rent",
        grades: [0, 10, 25, 50, 100, 200, 500, 1000],
        colors: ['#FFFFD9', '#EDF8B1', '#C7E9B4', '#7FCDBB', '#41B6C4', '#1D91C0', '#225EA8', '#253494'],
        getValue: (props) => props.rent_median || 0
    },
    
    // Owner indicators
    owner_entity_counts: {
        name: "Owner Entity Count",
        grades: [0, 1, 2, 3, 5, 10, 20, 50],
        colors: ['#FFF7EC', '#FEE8C8', '#FDD49E', '#FDBB84', '#FC8D59', '#EF6548', '#D7301F', '#B30000'],
        getValue: (props) => {
            if (props.owner_entity_counts && typeof props.owner_entity_counts === 'object') {
                return Object.keys(props.owner_entity_counts).length;
            }
            return 0;
        }
    },
    multi_owner_count: {
        name: "Multi-Owner Properties",
        grades: [0, 1, 2, 5, 10, 20, 50, 100],
        colors: ['#F7F4F9', '#E7E1EF', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
        getValue: (props) => props.multi_owner_count || 0
    },
    gini_owner: {
        name: "Owner Gini Coefficient",
        grades: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8],
        colors: ['#F7FCF5', '#E5F5E0', '#C7E9C0', '#A1D99B', '#74C476', '#41AB5D', '#238B45', '#006D2C'],
        getValue: (props) => props.gini_owner || 0
    }
};

// Get color based on value and scheme
function getColor(value, scheme) {
    const grades = scheme.grades;
    const colors = scheme.colors;
    
    for (let i = grades.length - 1; i >= 0; i--) {
        if (value >= grades[i]) {
            return colors[i];
        }
    }
    return colors[0];
}

// Generate style function for a given indicator
function getStyleForIndicator(indicator) {
    return function(feature) {
        const scheme = colorSchemes[indicator];
        const value = scheme.getValue(feature.properties);
        
        return {
            fillColor: getColor(value, scheme),
            weight: 0.5,
            opacity: 0.8,
            color: 'white',
            fillOpacity: 0.7,
            radius: 3
        };
    };
}

// Create comprehensive popup content
function createPopupContent(props) {
    let content = `
        <div class="enhanced-walkability-popup">
            <h4>5-Minute Walking Accessibility Analysis</h4>
            <div class="popup-section">
                <h5>Basic Metrics</h5>
                <p><strong>POI Count:</strong> ${props.poi_count || 0}</p>
                <p><strong>POI Diversity:</strong> ${props.poi_diversity || 0}</p>
                <p><strong>Reachable Area:</strong> ${Math.round(props.reachable_area_m2 || 0)} m²</p>
                <p><strong>Building Index:</strong> ${props.building_idx || 'N/A'}</p>
                <p><strong>Coordinates:</strong> X: ${props.x || 'N/A'}, Y: ${props.y || 'N/A'}</p>
            </div>
    `;
    
    // Add POI type distribution
    if (props.poi_types) {
        content += `
            <div class="popup-section">
                <h5>POI Type Distribution</h5>
                <ul>
        `;
        for (const [type, count] of Object.entries(props.poi_types)) {
            content += `<li><strong>${type}:</strong> ${count}</li>`;
        }
        content += `</ul></div>`;
    }
    
    // Add Bottega indicators if available
    if (props.bottega_diversity !== undefined || props.shannon_bottega !== undefined) {
        content += `
            <div class="popup-section">
                <h5>Bottega Analysis</h5>
                <p><strong>Bottega Diversity:</strong> ${props.bottega_diversity || 0}</p>
                <p><strong>Shannon Bottega:</strong> ${(props.shannon_bottega || 0).toFixed(2)}</p>
        `;
        
        if (props.bottega_types && typeof props.bottega_types === 'object') {
            content += `<p><strong>Bottega Types:</strong></p><ul>`;
            for (const [type, count] of Object.entries(props.bottega_types)) {
                content += `<li>${type}: ${count}</li>`;
            }
            content += `</ul>`;
        }
        
        if (props.bottega_meta && typeof props.bottega_meta === 'object') {
            content += `<p><strong>Bottega Meta:</strong></p><ul>`;
            for (const [meta, count] of Object.entries(props.bottega_meta)) {
                content += `<li>${meta}: ${count}</li>`;
            }
            content += `</ul>`;
        }
        content += `</div>`;
    }
    
    // Add Rent indicators if available
    if (props.rent_sum !== undefined || props.rent_mean !== undefined || props.rent_median !== undefined) {
        content += `
            <div class="popup-section">
                <h5>Rent Analysis</h5>
                <p><strong>Total Rent:</strong> ${props.rent_sum || 0}</p>
                <p><strong>Average Rent:</strong> ${(props.rent_mean || 0).toFixed(2)}</p>
                <p><strong>Median Rent:</strong> ${(props.rent_median || 0).toFixed(2)}</p>
            </div>
        `;
    }
    
    // Add Owner indicators if available
    if (props.owner_entity_counts !== undefined || props.multi_owner_count !== undefined || props.gini_owner !== undefined) {
        content += `
            <div class="popup-section">
                <h5>Ownership Analysis</h5>
        `;
        
        if (props.owner_entity_counts && typeof props.owner_entity_counts === 'object') {
            const entityCount = Object.keys(props.owner_entity_counts).length;
            content += `<p><strong>Owner Entities (${entityCount}):</strong></p><ul>`;
            for (const [entity, count] of Object.entries(props.owner_entity_counts)) {
                content += `<li>${entity}: ${count}</li>`;
            }
            content += `</ul>`;
        }
        
        content += `<p><strong>Multi-Owner Properties:</strong> ${props.multi_owner_count || 0}</p>`;
        content += `<p><strong>Gini Coefficient:</strong> ${(props.gini_owner || 0).toFixed(3)}</p>`;
        
        if (props.owner_title_counts && typeof props.owner_title_counts === 'object') {
            content += `<p><strong>Owner Title Counts:</strong></p><ul>`;
            for (const [title, count] of Object.entries(props.owner_title_counts)) {
                const displayTitle = title === '' ? '(No Title)' : title;
                content += `<li>${displayTitle}: ${count}</li>`;
            }
            content += `</ul>`;
        }
        content += `</div>`;
    }
    
    content += `</div>`;
    return content;
}

// Create legend for current indicator
function createLegend(indicator) {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        const scheme = colorSchemes[indicator];
        const grades = scheme.grades;
        const colors = scheme.colors;
        
        div.innerHTML = `<h4>${scheme.name}</h4>`;
        
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        
        return div;
    };
    return legend;
}

// Create statistics panel for current indicator
function createStatsPanel(data, indicator) {
    const statsControl = L.control({position: 'bottomleft'});
    statsControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info stats-panel');
        
        const features = data.features;
        const scheme = colorSchemes[indicator];
        const values = features.map(f => scheme.getValue(f.properties));
        const validValues = values.filter(v => v > 0);
        
        if (validValues.length === 0) {
            div.innerHTML = `
                <h4>${scheme.name} Statistics</h4>
                <p><strong>No data available</strong></p>
            `;
            return div;
        }
        
        const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        const min = Math.min(...validValues);
        const max = Math.max(...validValues);
        const median = validValues.sort((a, b) => a - b)[Math.floor(validValues.length / 2)];
        
        div.innerHTML = `
            <h4>${scheme.name} Statistics</h4>
            <p><strong>Total Points:</strong> ${features.length}</p>
            <p><strong>Valid Values:</strong> ${validValues.length}</p>
            <p><strong>Average:</strong> ${avg.toFixed(2)}</p>
            <p><strong>Median:</strong> ${median.toFixed(2)}</p>
            <p><strong>Min:</strong> ${min.toFixed(2)}</p>
            <p><strong>Max:</strong> ${max.toFixed(2)}</p>
        `;
        
        return div;
    };
    return statsControl;
}

// 简化版热力图实现，不依赖外部插件
function createSimpleHeatmap(data, indicator) {
    const scheme = colorSchemes[indicator];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 这里我们先返回一个占位的图层组
    // 如果需要真正的热力图功能，建议使用 Observable Plot 或其他内置的可视化工具
    return L.layerGroup();
}

export function createEnhancedWalkabilityMap(mapContainer, walkabilityData) {
    // Transform the data first
    const transformedData = transformGeoJSON(walkabilityData);
    
    console.log("Enhanced Map - Original features:", walkabilityData.features.length);
    console.log("Enhanced Map - Transformed features:", transformedData.features.length);
    
    const map = L.map(mapContainer, {minZoom: 0, maxZoom: 18}).setView([45.4382745, 12.3433387], 14);

    // Add background layer control - 设置为折叠状态
    const layerControl = L.control.layers(null, null, {
        collapsed: true,  // 改为折叠状态
        position: 'topleft'
    }).addTo(map);
    const bgLayerList = genereateBaseSommarioniBgLayers();
    for (let [key, value] of Object.entries(bgLayerList)) {
        layerControl.addBaseLayer(value, key);
    }
    bgLayerList["Cadastral Board"].addTo(map);

    // State management
    let currentIndicator = 'poi_count';
    let currentLayer = null;
    let currentLegend = null;
    let currentStats = null;

    // Function to update the map with new indicator
    function updateMapLayer(indicator) {
        console.log(`Switching to indicator: ${indicator}`);
        
        // Remove current layer, legend, and stats
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        if (currentLegend) {
            map.removeControl(currentLegend);
        }
        if (currentStats) {
            map.removeControl(currentStats);
        }

        // Create new layer with updated styling
        currentLayer = L.geoJSON(transformedData, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, getStyleForIndicator(indicator)(feature));
            },
            onEachFeature: function(feature, layer) {
                // Create comprehensive popup
                const popupContent = createPopupContent(feature.properties);
                layer.bindPopup(popupContent, {
                    maxWidth: 500,
                    maxHeight: 400,
                    minWidth: 350
                });
                
                // Create tooltip for current indicator
                const scheme = colorSchemes[indicator];
                const value = scheme.getValue(feature.properties);
                layer.bindTooltip(`${scheme.name}: ${value.toFixed(2)}`);
                
                // Add hover effects
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 2,
                            color: '#666',
                            fillOpacity: 0.9
                        });
                    },
                    mouseout: function(e) {
                        currentLayer.resetStyle(e.target);
                    }
                });
            }
        });

        // Add new layer to map
        currentLayer.addTo(map);
        
        // Auto-fit map to data bounds on first load
        if (indicator === 'poi_count' && transformedData.features.length > 0) {
            try {
                map.fitBounds(currentLayer.getBounds(), {padding: [20, 20]});
            } catch (error) {
                console.warn("Could not fit bounds, using default view");
            }
        }

        // Create new legend and stats
        currentLegend = createLegend(indicator);
        currentLegend.addTo(map);
        
        currentStats = createStatsPanel(transformedData, indicator);
        currentStats.addTo(map);
        
        currentIndicator = indicator;
    }

    // Create indicator control panel with collapsible functionality
    const indicatorControl = L.control({position: 'topright'});
    indicatorControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'indicator-control');
        div.innerHTML = `
            <div class="indicator-header" style="cursor: pointer;">
                <h4 style="margin: 0; display: inline-block;">Select Indicator</h4>
                <span class="toggle-icon" style="float: right; font-size: 14px;">▼</span>
            </div>
            <div class="indicator-content" style="display: none;">
                <div class="indicator-groups">
                    <div class="indicator-group">
                        <h5>Basic POI</h5>
                        <label><input type="radio" name="indicator" value="poi_count" checked> POI Count</label><br>
                        <label><input type="radio" name="indicator" value="poi_diversity"> POI Diversity</label><br>
                    </div>
                    
                    <div class="indicator-group">
                        <h5>Bottega</h5>
                        <label><input type="radio" name="indicator" value="bottega_count"> Count</label><br>
                        <label><input type="radio" name="indicator" value="bottega_diversity"> Diversity</label><br>
                        <label><input type="radio" name="indicator" value="shannon_bottega"> Shannon</label><br>
                    </div>
                    
                    <div class="indicator-group">
                        <h5>Rent</h5>
                        <label><input type="radio" name="indicator" value="rent_sum"> Total</label><br>
                        <label><input type="radio" name="indicator" value="rent_mean"> Average</label><br>
                        <label><input type="radio" name="indicator" value="rent_median"> Median</label><br>
                    </div>
                    
                    <div class="indicator-group">
                        <h5>Ownership</h5>
                        <label><input type="radio" name="indicator" value="owner_entity_counts"> Entities</label><br>
                        <label><input type="radio" name="indicator" value="multi_owner_count"> Multi-Owner</label><br>
                        <label><input type="radio" name="indicator" value="gini_owner"> Gini Coef.</label><br>
                    </div>
                </div>
            </div>
        `;
        
        // 添加折叠/展开功能
        const header = div.querySelector('.indicator-header');
        const content = div.querySelector('.indicator-content');
        const toggleIcon = div.querySelector('.toggle-icon');
        
        header.addEventListener('click', function() {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggleIcon.textContent = '▲';
            } else {
                content.style.display = 'none';
                toggleIcon.textContent = '▼';
            }
        });
        
        // Add event listeners for radio buttons
        div.addEventListener('change', function(e) {
            if (e.target.type === 'radio') {
                updateMapLayer(e.target.value);
                // 选择后自动折叠
                content.style.display = 'none';
                toggleIcon.textContent = '▼';
            }
        });
        
        // Prevent map events when interacting with control
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        
        return div;
    };
    indicatorControl.addTo(map);

    // Initialize with POI count
    updateMapLayer('poi_count');

    return { 
        map, 
        layerControl, 
        indicatorControl,
        updateIndicator: updateMapLayer,
        currentIndicator: () => currentIndicator
    };
}