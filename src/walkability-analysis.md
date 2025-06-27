---
title: Venice 5-Minute Walking Accessibility Analysis
toc: false
style: components/custom-style.css
---

```js
import L from "npm:leaflet";
import * as Plot from "npm:@observablehq/plot";
import { createEnhancedWalkabilityMap } from "./components/map-walkability-enhanced.js";
import * as ss from "npm:simple-statistics";
import jStat from "npm:jstat";
```

# Venice 5-Minute Walking Accessibility Analysis

```js
const walkabilityData = FileAttachment("./data/5min_walkability_results.geojson").json();
```

<!-- Create map container -->
<div id="map-container-enhanced" class="map-component"></div>

```js
// Create enhanced map with multiple indicator layers
const enhancedMapComponents = createEnhancedWalkabilityMap("map-container-enhanced", walkabilityData);
```

## Visualization and Analysis Overview

### Project Overview

This project presents a comprehensive spatial analysis of **5-minute walking accessibility** in Venice's historic center, combining historical urban data from the 1740s and 1808 to understand the spatial distribution of economic and social activities in early 19th-century Venice. By analyzing walking accessibility patterns overlaid on the historic 1808 Napoleonic cadastral map, this study reveals how urban form, commercial activity, property ownership, and daily life intersected in one of Europe's most unique urban environments.

The analysis employs advanced computational methods including optimized pathfinding algorithms and multi-dimensional spatial indicators to quantify accessibility patterns across different aspects of urban life - from commercial establishments and rental markets to property ownership structures and functional diversity.

### Available Indicators

#### **Basic POI Metrics**
- **POI Count**: Total number of points of interest (commercial, residential, and public establishments) reachable within a 5-minute walk from each building location
- **POI Diversity**: Number of different POI functional types accessible, measuring the functional variety of the immediate urban environment

#### **Commercial (Bottega) Analysis**
- **Bottega Types**: Detailed count of different commercial establishment subtypes (e.g., bakeries, taverns, shops) accessible within the walking radius
- **Bottega Metacategories**: Broader commercial categories (food, retail, services, etc.) available in the accessible area
- **Bottega Diversity**: Total number of distinct bottega subtypes reachable, indicating commercial variety
- **Shannon Bottega Index**: Shannon entropy measure of commercial diversity, providing a standardized measure of how evenly distributed different commercial types are (higher values indicate more balanced commercial diversity)

#### **Economic (Rent) Analysis**
- **Total Rent (rent_sum)**: Sum of all annual rental values (`an_rendi`) within the accessible area, indicating the total economic value of accessible properties
- **Average Rent (rent_mean)**: Mean rental value per property, showing the typical property value in the accessible area
- **Median Rent (rent_median)**: Median rental value, providing a measure less affected by extreme outliers and representing typical property values

#### **Property Ownership Analysis**
- **Owner Entity Counts**: Number and types of different property owners (individuals, institutions, religious organizations) with properties in the accessible area
- **Owner Title Counts**: Distribution of ownership by social titles and ranks, revealing the social stratification of property ownership
- **Multi-Owner Count**: Number of properties with multiple owners, indicating shared ownership patterns
- **Gini Coefficient (gini_owner)**: Measure of ownership inequality within the accessible area (0 = completely equal ownership, 1 = completely unequal ownership)

#### **Functional and Geometric Analysis**
- **Function Top Counts**: Distribution of primary functional categories of accessible buildings
- **Geometry Type Counts**: Architectural and spatial characteristics of accessible structures

### Interactive Visualization Features

The interactive map provides multiple layers of analysis through an intuitive interface:

- **🎛️ Multi-Indicator Layer Control**: Top-right panel allows seamless switching between different analytical indicators, each with optimized color schemes and scaling
- **📊 Dynamic Legend System**: Bottom-right legend automatically updates with appropriate scales, colors, and statistical distributions for the selected indicator
- **📈 Real-Time Statistics Panel**: Top-left panel displays live statistical summaries (min, max, mean, median, standard deviation) for the currently selected indicator across all analyzed locations
- **💬 Comprehensive Information Popups**: Click any point to access detailed information across all available indicators, providing a complete profile of that location's accessibility characteristics
- **🖱️ Smart Hover Tooltips**: Quick value display for the current indicator without overwhelming the interface
- **🎨 Optimized Color Schemes**: Each indicator uses carefully designed color palettes - warm colors for commercial/ownership indicators, cool colors for diversity measures, sequential schemes for continuous variables, and diverging schemes for inequality measures

### Analytical Insights

This multi-dimensional accessibility analysis reveals several key patterns in historical Venice:

1. **🏪 Commercial Accessibility Patterns**: Identifies areas with high commercial density and diversity, revealing the spatial structure of Venice's historic commercial districts and how residents' access to different types of shops and services varied across the city

2. **💰 Economic Geography of Accessibility**: Demonstrates the relationship between walking accessibility and rental values, showing how property values related to proximity to commercial and social amenities

3. **🏠 Property Ownership Distribution**: Maps the concentration versus dispersion of property ownership, identifying areas dominated by single large owners versus areas with more distributed ownership patterns

4. **🏛️ Functional Urban Integration**: Shows how different urban functions (commercial, residential, institutional) were spatially integrated, revealing the mixed-use character of different neighborhoods

5. **📜 Historical Social-Spatial Patterns**: Provides insights into how the social stratification visible in property ownership and rental values manifested spatially, and how this related to daily accessibility patterns

6. **🚶‍♂️ Pedestrian Urban Experience**: Reconstructs the lived experience of historical residents by quantifying what amenities and social environments were accessible within a short walk from their homes

## Methodology

### Data Preparation and Preprocessing

The analysis integrates two primary historical datasets to create a comprehensive spatial analysis framework:

**Historical Data Sources:**
- **1740 POI Dataset**: Detailed points of interest including commercial establishments (botteghe), residential properties, and institutional buildings with functional classifications, ownership information, and rental values
- **1808 Napoleonic Cadastral Maps**: Geometric representations of buildings, streets, and urban infrastructure providing the spatial framework for analysis

**Spatial Processing Workflow:**
1. **Grid-Based Spatial Framework**: The entire study area was rasterized into a uniform 1m × 1m grid system to enable precise spatial calculations and consistent geometric operations across all datasets

2. **POI-to-Street Assignment**: All points of interest were snapped to their nearest street segments to ensure realistic pedestrian accessibility. This process accounts for the fact that historical buildings had their primary access points oriented toward streets rather than at geometric centroids

3. **Building Door Assignment**: For each building polygon, the centroid coordinates were calculated and then assigned to the nearest street segment, creating realistic "door" locations that serve as origin points for accessibility calculations

4. **Coordinate System Harmonization**: All spatial datasets were transformed to a consistent coordinate reference system (EPSG:32633 - WGS 84 / UTM zone 33N) to ensure accurate distance calculations and spatial relationships

### Shortest Path Search Algorithm

**Walkable Area Definition:**
The analysis uses the street network layer to create a binary walkable mask (`create_walkable_mask`), where each grid cell is classified as walkable (streets, squares, bridges) or non-walkable (buildings, water, walls).

**Optimized Pathfinding Algorithm:**
Traditional A* or BFS algorithms can produce unrealistic zigzag paths when applied to rasterized street networks, especially on wide roads or open spaces. To address this limitation, the analysis employs a **Theta* optimized BFS algorithm** that includes:

- **Straight-Line Path Optimization**: Quick checks for direct line-of-sight paths on wide roads and open spaces
- **Realistic Path Generation**: Produces pedestrian paths that follow natural walking patterns rather than rigid grid-based movements
- **5-Minute Walking Distance**: Uses a standard walking speed to define the maximum reachable distance (approximately 300-400 meters depending on path complexity)

**Sample Analysis Coverage:**
The analysis was performed on 2000 randomly selected buildings across Venice's historic center to ensure representative coverage while maintaining computational efficiency.

```js
const boundariesImage = FileAttachment("./data/5min_reachable_boundaries.png").image();
```

${boundariesImage}

*Example visualization showing reachable boundaries for 10 sample buildings, demonstrating how the algorithm accounts for Venice's complex street network, bridges, and urban morphology.*

### Accessibility Indicator Calculation

**Spatial Analysis Process:**
For each building's 5-minute reachable area (represented as `reachable_mask`), the system calculates comprehensive accessibility indicators by:

1. **POI Intersection Analysis**: Identifying all 1740 POIs that fall within each building's reachable area
2. **Multi-Dimensional Counting**: For each reachable POI, extracting and aggregating information across multiple dimensions:
   - **Functional classifications** (residential, commercial, institutional)
   - **Commercial subtypes** (bottega categories and metacategories)
   - **Economic data** (rental values from `an_rendi` field)
   - **Ownership information** (owner entities, titles, shared ownership patterns)
   - **Geometric characteristics** (building types and spatial configurations)

3. **Statistical Calculation**: Computing derived metrics including:
   - **Diversity indices** (Shannon entropy for commercial variety)
   - **Economic aggregations** (sum, mean, median rental values)
   - **Inequality measures** (Gini coefficient for ownership distribution)
   - **Spatial distributions** (functional and geometric type counts)

This methodology provides a robust framework for understanding how historical urban accessibility patterns shaped the daily experience of Venice's residents and the spatial organization of economic and social activities in early 19th-century Venice.

## Statistical Analysis and Interactive Charts

Based on the comprehensive accessibility analysis of 2000 sample buildings, the following interactive charts provide detailed insights into the distribution and patterns of walkability indicators across Venice's historic center.

```js
// Load and process the walkability data for statistics
const rawData = walkabilityData;
const stats = rawData.features.map(d => d.properties);

// Calculate summary statistics for each indicator
function calculateStats(data, field) {
  const values = data.map(d => d[field]).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (values.length === 0) return {count: 0, min: 0, max: 0, mean: 0, median: 0, q1: 0, q3: 0, std: 0};
  
  values.sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: mean,
    median: values[Math.floor(values.length / 2)],
    q1: values[Math.floor(values.length * 0.25)],
    q3: values[Math.floor(values.length * 0.75)],
    std: Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length)
  };
}

// Key indicators for analysis
const indicators = [
  {key: 'poi_count', label: 'POI Count', description: 'Total accessible points of interest'},
  {key: 'poi_diversity', label: 'POI Diversity', description: 'Number of different POI types'},
  {key: 'bottega_diversity', label: 'Bottega Diversity', description: 'Number of commercial types'},
  {key: 'shannon_bottega', label: 'Shannon Bottega Index', description: 'Commercial diversity entropy'},
  {key: 'rent_sum', label: 'Total Rent', description: 'Sum of rental values (ducats)'},
  {key: 'rent_mean', label: 'Average Rent', description: 'Mean rental value per property'},
  {key: 'rent_median', label: 'Median Rent', description: 'Median rental value'},
  {key: 'multi_owner_count', label: 'Multi-Owner Properties', description: 'Properties with multiple owners'},
  {key: 'gini_owner', label: 'Gini Coefficient', description: 'Ownership inequality measure'},
  {key: 'reachable_area_m2', label: 'Reachable Area', description: 'Total accessible area (m²)'}
];

// Calculate statistics for all indicators
const indicatorStats = indicators.map(ind => ({
  ...ind,
  stats: calculateStats(stats, ind.key)
}));
```

### 1. Distribution Overview: Key Accessibility Metrics

#### POI Count Distribution
<div id="hist-poi-count"></div>

```js
const valuesPoi = stats.map(d => d.poi_count).filter(v => v !== null && !isNaN(v));
const histPoi = Plot.plot({
  width: 800,
  height: 150,
  title: "POI Count",
  marginLeft: 40,
  x: {label: "Count"},
  y: {label: "Frequency"},
  marks: [
    Plot.rectY(valuesPoi, Plot.binX({y: "count"}, {x: d => d, fill: "#e31a1c", stroke: "white"}))
  ]
});
document.getElementById("hist-poi-count").append(histPoi);
```

#### POI Diversity Distribution
<div id="hist-poi-div"></div>

```js
const valuesDiv = stats.map(d => d.poi_diversity).filter(v => v !== null && !isNaN(v));
const histDiv = Plot.plot({
  width: 800,
  height: 150,
  title: "POI Diversity",
  marginLeft: 40,
  x: {label: "Diversity"},
  y: {label: "Frequency"},
  marks: [
    Plot.rectY(valuesDiv, Plot.binX({y: "count"}, {x: d => d, fill: "#ff7f00", stroke: "white"}))
  ]
});
document.getElementById("hist-poi-div").append(histDiv);
```

#### Bottega Diversity Distribution
<div id="hist-bottega"></div>

```js
const valuesBott = stats.map(d => d.bottega_diversity).filter(v => v !== null && !isNaN(v));
const histBott = Plot.plot({
  width: 800,
  height: 150,
  title: "Bottega Diversity",
  marginLeft: 40,
  x: {label: "Diversity"},
  y: {label: "Frequency"},
  marks: [
    Plot.rectY(valuesBott, Plot.binX({y: "count"}, {x: d => d, fill: "#1f78b4", stroke: "white"}))
  ]
});
document.getElementById("hist-bottega").append(histBott);
```

#### Shannon Index Distribution
<div id="hist-shannon"></div>

```js
const valuesShan = stats.map(d => d.shannon_bottega).filter(v => v !== null && !isNaN(v));
const histShan = Plot.plot({
  width: 800,
  height: 150,
  title: "Shannon Bottega Index",
  marginLeft: 40,
  x: {label: "Entropy"},
  y: {label: "Frequency"},
  marks: [
    Plot.rectY(valuesShan, Plot.binX({y: "count"}, {x: d => d, fill: "#33a02c", stroke: "white"}))
  ]
});
document.getElementById("hist-shannon").append(histShan);
```

### 2. Economic Accessibility Analysis
<div id="econ-analysis"></div>

```js
// Filter data with valid rent information
const rentData = stats.filter(d => d.rent_sum > 0 && d.rent_mean > 0 && d.poi_count > 0);

// Calculate linear regression and statistical tests
const xValues = rentData.map(d => d.poi_count);
const yValues = rentData.map(d => d.rent_mean);
const dataPairs = rentData.map(d => [d.poi_count, d.rent_mean]);
const lr = ss.linearRegression(dataPairs); // {m: slope, b: intercept}
const slope = lr.m;
const intercept = lr.b;

// 回归预测函数
const regressionLine = ss.linearRegressionLine(lr);

// R²
const rSquared = ss.rSquared(dataPairs, regressionLine);

// Standard error of the slope & t-statistic
const n = xValues.length;
const xMean = ss.mean(xValues);
const sse = dataPairs.reduce((acc, [x, y]) => {
  const yPred = slope * x + intercept;
  return acc + Math.pow(y - yPred, 2);
}, 0);
const sumSqXdiff = xValues.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0);
// 如果分母为0，说明所有 x 值相同，无法进行回归
let pValue = NaN;
if (sumSqXdiff > 0 && n > 2) {
  const seSlope = Math.sqrt(sse / (n - 2)) / Math.sqrt(sumSqXdiff);
  const tStat = slope / seSlope;
  pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), n - 2));
}

// Plot chart
const econChart = Plot.plot({
  title: "Economic Accessibility: Rent vs POI Access",
  subtitle: "Relationship between rental values and accessibility to points of interest",
  width: 700,
  height: 500,
  marginLeft: 80,
  x: {label: "POI Count (accessible within 5 minutes)", grid: true},
  y: {label: "Average Rent (ducats)", grid: true},
  color: {label: "Total Rent", scheme: "viridis", legend: true},
  marks: [
    Plot.dot(rentData, {
      x: "poi_count",
      y: "rent_mean",
      fill: "rent_sum",
      stroke: "white",
      strokeWidth: 0.5,
      r: 4,
      fillOpacity: 0.7,
      title: d =>
        `POI Count: ${d.poi_count}\nAvg Rent: ${d.rent_mean.toFixed(1)} ducats\nTotal Rent: ${d.rent_sum.toFixed(0)} ducats`
    }),
    Plot.linearRegressionY(rentData, {x: "poi_count", y: "rent_mean", stroke: "red", strokeWidth: 2})
  ]
});

// Append p-value to chart
document.getElementById("econ-analysis").append(econChart);
const pValueElement = document.createElement("div");
pValueElement.textContent = `p-value: ${Number.isFinite(pValue) ? pValue.toExponential(3) : "n/a"}   (R² = ${rSquared.toFixed(3)})`;
document.getElementById("econ-analysis").append(pValueElement);
```

> **Statistical interpretation**
> • The *p-value* measures the probability of obtaining a slope as extreme as the observed one if there were truly no relationship between the number of reachable POIs and the average rent. **A value close to 0 indicates a statistically significant relationship.**  
> • *R²* (coefficient of determination) quantifies how much of the variation in average rent is explained by POI count. **Here an R² of roughly 0.22 means about 22 % of rent variation can be attributed to POI accessibility, while the remaining 78 % is driven by other factors (e.g., location, building quality, social status).**

### 3. Commercial Diversity Patterns
<div id="commercial-diversity"></div>

```js
const commercialData = stats.filter(d => d.bottega_diversity > 0 && d.shannon_bottega > 0);

const commChart = Plot.plot({
  title: "Commercial Accessibility Patterns",
  subtitle: "Bottega diversity and Shannon entropy across sample locations",
  width: 800,
  height: 400,
  marginLeft: 60,
  x: {label: "Bottega Diversity (number of types)", grid: true},
  y: {label: "Shannon Bottega Index (entropy)", grid: true},
  color: {label: "POI Count", scheme: "blues", legend: true},
  marks: [
    Plot.dot(commercialData, {
      x: "bottega_diversity",
      y: "shannon_bottega",
      fill: "poi_count",
      stroke: "white",
      strokeWidth: 0.5,
      r: 5,
      fillOpacity: 0.8,
      title: d =>
        `Bottega Types: ${d.bottega_diversity}\nShannon Index: ${d.shannon_bottega.toFixed(2)}\nTotal POIs: ${d.poi_count}`
    })
  ]
});

document.getElementById("commercial-diversity").append(commChart);
```
---

### 4. Ownership Inequality Distribution
<div id="ownership-inequality"></div>

```js
const ownershipData = stats.filter(d => d.gini_owner >= 0 && !isNaN(d.gini_owner));
const giniStats = calculateStats(stats, "gini_owner");

const ownerChart = Plot.plot({
  title: "Property Ownership Inequality (Gini Coefficient)",
  subtitle: "Distribution of ownership concentration across accessible areas",
  width: 700,
  height: 300,
  marginLeft: 60,
  x: {label: "Gini Coefficient (0 = equal, 1 = unequal)", domain: [0, 1]},
  y: {label: "Frequency"},
  marks: [
    Plot.rectY(ownershipData, Plot.binX({y: "count"}, {x: "gini_owner", fill: "#2ca02c", stroke: "white"})),
    Plot.ruleX([giniStats.mean], {stroke: "red", strokeWidth: 2}),
    Plot.text([{mean: giniStats.mean}], {
      x: d => d.mean + 0.05,
      y: 20,
      text: d => `Mean: ${d.mean.toFixed(3)}`,
      fill: "red",
      fontSize: 12
    })
  ]
});

document.getElementById("ownership-inequality").append(ownerChart);
```
---

### 5. Spatial Coverage Analysis
<div id="spatial-coverage"></div>

```js
const spatialData = stats.flatMap(d => [
  {metric: "POI Count", area: d.reachable_area_m2, value: d.poi_count},
  {metric: "POI Diversity", area: d.reachable_area_m2, value: d.poi_diversity},
  {metric: "Bottega Diversity", area: d.reachable_area_m2, value: d.bottega_diversity}
]).filter(d => d.value > 0 && d.area > 0);

const spatialChart = Plot.plot({
  title: "Reachable Area vs Accessibility Indicators",
  subtitle: "How much area can be reached within 5 minutes vs what's accessible there",
  width: 900,
  height: 600,
  facet: {
    data: spatialData,
    y: "metric",
    marginRight: 100
  },
  x: {label: "Reachable Area (m²)"},
  y: {label: null},
  color: {label: "Value", scheme: "plasma"},
  marks: [
    Plot.dot(spatialData, {
      x: "area",
      y: () => Math.random() * 0.8 + 0.1, // jitter
      fill: "value",
      r: 3,
      fillOpacity: 0.7,
      title: d => `Area: ${d.area.toLocaleString()} m²\n${d.metric}: ${d.value}`,
      facet: "exclude"
    })
  ]
});

document.getElementById("spatial-coverage").append(spatialChart);
```
---

### 6. Summary Statistics Table
<div id="summary-table"></div>

```js
// Build statistics table
const summaryTable = indicatorStats.map(ind => ({
  Indicator: ind.label,
  Description: ind.description,
  Count: ind.stats.count.toLocaleString(),
  Mean: ind.stats.mean.toFixed(2),
  Median: ind.stats.median.toFixed(2),
  Min: ind.stats.min.toFixed(2),
  Max: ind.stats.max.toFixed(2),
  "Std Dev": ind.stats.std.toFixed(2)
}));

import { table as InputsTable } from "npm:@observablehq/inputs";

const summaryElement = InputsTable(summaryTable, {
  columns: ["Indicator", "Description", "Count", "Mean", "Median", "Min", "Max", "Std Dev"],
  header: {
    Indicator: "Accessibility Indicator",
    Description: "Description",
    Count: "Sample Size",
    Mean: "Mean",
    Median: "Median",
    Min: "Minimum",
    Max: "Maximum",
    "Std Dev": "Standard Deviation"
  }
});

document.getElementById("summary-table").append(summaryElement);
```


These interactive statistical visualizations reveal the complex relationships between spatial accessibility, economic patterns, and social structures in historical Venice, providing quantitative insights into how urban form shaped daily life in the early 19th century.
