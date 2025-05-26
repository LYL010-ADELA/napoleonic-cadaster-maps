---
title: Napoleonic Cadaster - Functions Histograms
toc: false
---


# Napoleonic Cadaster - Functions Histograms.


<!-- Create the tanble container -->
<div id="barchart-container" style="width: 1000px; margin: 1em 0 2em 0;"></div>


```js
import {cookData} from "./components/map4.js";
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

```js
const cookedData = cookData(registre, 10);
console.log(cookedData);
```
