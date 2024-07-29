/**
 * Imports the configuration file and extracts the API URL.
 * @returns {Promise<string>} A Promise that returns the API URL from the configuration file.
 */
export async function loadConfig() {
    const response = await fetch('/config.json');
    const config = await response.json();
    return config;
}