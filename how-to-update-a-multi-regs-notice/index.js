// Import the bent package for making HTTP requests
const bent = require("bent");

// Import configuration values from the config file (e.g., API token, base URL, etc.)
const config = require("./config");
const getApiIds = require("./getPartnersApiIds");

// Define headers for API requests, including the Authorization token and version 2 for multi-regulations support
const headers = {
  Authorization: `Bearer ${config.token}`,
  V: 2,
};

// Create a client object with GET and PATCH methods using the bent package
const client = {
  get: bent("GET", config.baseUrl, "json", headers),
  patch: bent("PATCH", config.baseUrl, "json", headers),
};

// Main async function for fetching draft configuration, updating the regulation configuration,
// and retrieving the updated draft configuration
(async () => {
  try {
    // Log the start of fetching draft configuration process
    console.log(`🚀 Fetching draft configuration for organization id ${config.organizationId}...`);

    // Get the latest draft configuration data by making an API request using the 'client.get' method
    let {
      data: [draftConfiguration],
    } = await client.get(`/widgets/notices/configs?notice_id=${config.noticeId}&deployed_at=null&organization_id=${config.organizationId}`);

    // Log the successful fetching of draft configuration data
    console.log(`✅ Draft configuration with id ${draftConfiguration.id} fetched.`);

    // Find the regulation configuration in the fetched draft configuration using the 'find' method
    let regulationConfiguration = draftConfiguration.regulation_configurations.find((reg_config) => reg_config.is_default_regulation_config && reg_config.regulation_id === config.regulationId);

    // Log the current vendors IDs in the regulation configuration
    console.log(`\n🗒️  Current configuration has the following vendors IDs: ${regulationConfiguration.config.app.vendors.include.join(", ")}.`);

    // Get the vendors IDs from the API
    const vendorsIds = await getApiIds();

    // Update the regulation configuration with new vendor IDs from the 'vendorsIds' JSON file
    // Please make sure you have enabled the IAB TCF integration before patching the configuration
    regulationConfiguration.config.app.vendors.include = vendorsIds;

    // Log the start of updating draft configuration process
    console.log(`⏳ Updating draft configuration with vendors IDs: ${vendorsIds.join(", ")}...`);

    // Update the draft configuration on the server by sending a PATCH request using the 'client.patch' method
    await client.patch(`/widgets/notices/configs/${draftConfiguration.id}`, draftConfiguration);

    // Log the successful updating of regulation default configuration
    console.log(`✅ ${config.regulationId.toUpperCase()} default configuration with id ${regulationConfiguration.id} updated.`);

    // Retrieve the updated draft configuration by making an API request using the 'client.get' method
    const {
      data: [draftConfigurationNew],
    } = await client.get(`/widgets/notices/configs?notice_id=${config.noticeId}&deployed_at=null&organization_id=${config.organizationId}`);

    // Find the updated regulation configuration in the new draft using the 'find' method
    regulationConfiguration = draftConfigurationNew.regulation_configurations.find((reg_conf) => reg_conf.is_default_regulation_config && reg_conf.regulation_id === config.regulationId);

    // Log the updated vendors IDs in the regulation configuration
    console.log(`\n🗒️  Updated configuration now includes the following vendors IDs: ${regulationConfiguration.config.app.vendors.include.join(", ")}.`);

    // Log the completion of the update process
    console.log("🎉 Update complete!");
  } catch (error) {
    // Handling authentication error and providing information to get a valid token
    if (error.statusCode === 401) {
      console.error("⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication");
    } else {
      // If an error occurs during the execution, log it to the console
      console.error(error);
    }
  }
})();
