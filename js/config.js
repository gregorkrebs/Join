/**
 * Imports the configuration from a JSON file and extracts the API URL.
 * @returns {Promise<string>} A Promise that resolves with the API URL from the configuration file.
 */
async function importConfig() {
    let response = await fetch('./config.json');
    let url = await response.json();
    return url.apiUrl;
}

/**
 * Retrieves specific configuration data from a JSON file based on the requested key.
 * @param {string} requestedData - The key for the data to be retrieved from the configuration file. Valid keys include "apiUrl", "guestEmail", "guestPassword".
 * @returns {Promise<string|undefined>} A promise that resolves to the requested value, or undefined if the key is not found. Logs an error if the key is not recognized.
 */
async function getConfigData(requestedData) {
    let response = await fetch('./config.json');
    let data = await response.json();
    
    return (requestedData === "apiUrl") ? data.apiUrl :
           (requestedData === "guestEmail") ? data.guestEmail :
           (requestedData === "guestPassword") ? data.guestPassword :
           (console.error('No parameter received'), undefined);
}