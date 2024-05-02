const bent = require("bent");
const fs = require("fs").promises;

const config = require("./src/config");
const { ensureJsonFileExists } = require("./src/ensureJsonFileExists");

// Ensure the gdpr.json file exists
ensureJsonFileExists(config.gdprFilePath);

// Load GDPR-specific translations from a JSON file
const gdprTranslations = require(config.gdprFilePath);

// Prepare headers for API requests, including the Authorization header
// and versioning support for handling different regulation types
const headers = {
  Authorization: `Bearer ${config.token}`,
  V: 2,
};

// Define a client to interact with the API
const client = {
  get: bent("GET", config.baseUrl, "json", headers),
  patch: bent("PATCH", config.baseUrl, "json", headers),
};

(async () => {
  try {
    console.log(`🚀 Fetching draft configuration for organization id ${config.organizationId}...`);

    // Retrieve the draft configuration data
    let {
      data: [draftConfiguration],
    } = await client.get(`/widgets/notices/configs?notice_id=${config.noticeId}&deployed_at=null&organization_id=${config.organizationId}`);

    console.log(`✅ Draft configuration with id ${draftConfiguration.id} fetched.`);

    // Search for the relevant regulation configuration within the draft based on default status and ID
    let regulationConfiguration = draftConfiguration.regulation_configurations.find((reg_config) => reg_config.is_default_regulation_config && reg_config.regulation_id === config.regulationId);

    if (config.action === "pull") {
      console.log(`⏳ Pulling regulation configuration for ${config.regulationId}...`);

      const filePath = `./translations/${config.regulationId}.json`;
      await fs.writeFile(filePath, JSON.stringify(regulationConfiguration, null, 2));

      console.log(`✅ Regulation configuration saved to ${filePath}`);
    } else if (config.action === "push") {
      // Check the latest pulled regulation ID against the latest ID on the API.
      if (regulationConfiguration.id !== gdprTranslations.id) {
        console.error(
          "❌ The pulled regulation configuration ID differs from the last existing one. You may override the latest saved and published content. Please `pull` the latest content first before attempting to `push`.",
        );
        process.exit(1);
      }

      // Apply new content for each items below according to the provided translations in `./translations/${config.regulationId}.json`
      regulationConfiguration.config.notice.content.deny = gdprTranslations.config.notice.content.deny;

      // If you need to update one specific language
      regulationConfiguration.config.notice.content.popup["en"] = gdprTranslations.config.notice.content.popup["en"];

      console.log(`⏳ Updating draft configuration...`);

      // Execute the update operation by sending the modified draft configuration
      await client.patch(`/widgets/notices/configs/${draftConfiguration.id}`, draftConfiguration);

      console.log(`✅ ${config.regulationId.toUpperCase()} default configuration with id ${regulationConfiguration.id} updated.`);

      console.log("🎉 Update complete!");
    } else {
      console.error("❌ Please update your configuration action with either `pull` or `push`.");
    }
  } catch (error) {
    // Identify authentication errors and provide guidance for resolution
    if (error.statusCode === 401) {
      console.error("⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication");
    } else {
      console.error(error);
    }
  }
})();
