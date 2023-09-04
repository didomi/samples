// Import the bent package for making HTTP requests
const bent = require("bent");

// Import configuration values from the config file (e.g., API token, base URL, etc.)
const config = require("./config");

// Load vendors' IAB IDs from the JSON file (format: {"ids": ["vendor_id_A", "vendor_id_B"]})
const vendorsIds = require("./vendorsIds.json");

// Define headers to use for API requests, including the Authorization token
const headers = {
  Authorization: `Bearer ${config.token}`,
};

// Create a client object with GET method using the bent package
const client = {
  get: bent("GET", config.baseUrl, "json", headers),
};

/**
 * This function retrieves API IDs that correspond to the IAB IDs provided in the vendorsIds JSON file.
 * If an IAB ID is not found in the API response, an error message will be logged.
 * @returns {Promise<Array>} - Array of API IDs
 */
const getApiIds = async () => {
  try {
    // Fetch partners metadata from the API with the provided limit
    const data = await client.get(`/metadata/partners?$limit=${config.limit}`);

    // Extract API IDs related to the IAB IDs listed in the vendorsIds JSON file
    const ApiIds = vendorsIds.ids.reduce((ids, vendorId) => {
      const partner = data.data.find((partner) => partner.namespaces && partner.namespaces.iab2 && partner.namespaces.iab2 === vendorId);

      if (partner) {
        ids.push(partner.id);
      } else {
        console.error(`❌ Error: Vendor with ID ${vendorId} not found in the API and therefore not added.`);
      }

      return ids;
    }, []);

    return ApiIds;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

module.exports = getApiIds;
