export function randomCssColor(seed) {
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

// merge the two list of objects using the "geometry_id" field:
export function geometryRegistryMap(registryData) {
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

let EXCLUDE_COLS = ["geometry_id", "unique_id"];

export function formatRegistryEntryToHTML(entry) {
    let html = "<div>";
    for (const [key, value] of Object.entries(entry)) {
        if (!EXCLUDE_COLS.includes(key) && value !== null) {    
            html += `<strong>${key}:</strong> ${value}<br>`;
        } 
    }
    html += "</div>";
    return html;
}

export function pythonListStringToList(pythonListString) {
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