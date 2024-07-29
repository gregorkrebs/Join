/**
 * Imports the configuration file and extracts the API URL.
 * @returns {Promise<string>} A Promise that returns the API URL from the configuration file.
 */
async function importConfig() {
    let response = await fetch('./config.xml');
    let url = await response.json();
    return url.apiUrl;
}

/**
 * Retrieves specific configuration data based on the requested key.
 * @param {string} requestedData - The key for the data to be retrieved from the configuration file (e.g., "apiUrl", "guestEmail", "guestPassword").
 * @returns {Promise<string|undefined>} A promise that resolves to the requested value, or undefined if the key is not found.
 */
async function getConfigData(requestedData) {
    let response = await fetch('./config.xml');
    let data = await response.json();
    if (requestedData === "apiUrl") {
        return data.apiUrl
    } else if (requestedData === "guestEmail") {
        return data.guestEmail;
    } else if (requestedData === "guestPassword") {
        return data.guestPassword;
    } else {
        console.error('No parameter recieved.')
    }
}