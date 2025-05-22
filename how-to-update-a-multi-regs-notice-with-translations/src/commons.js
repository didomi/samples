const { writeFileSync } = require("fs");
const axios = require("axios");
const config = require("./config");

/**
 * Asynchronously fetches an API token from a server.
 *
 * @returns {Promise<string>} A promise that resolves to the API token as a string.
 */
const fetchAPIToken = async () => {
  try {
    const response = await axios.post(`${config.baseUrl}/sessions`, {
      type: "api-key",
      key: config.secrets.id,
      secret: config.secrets.secret,
    });

    return response.data.access_token;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * If the environment variable `SPECIFIC_LANGUAGE` is set to "true", the function
 * attempts to retrieve the translation for the language defined in `npm_config_language`, otherwise falls back to "en".
 * The language specific option is used when replacing macros.
 *
 */
const getDefaultLanguage = (object, language) => {
  const lang = process.env.SPECIFIC_LANGUAGE === "true" ? language : null;

  return object?.[lang] ?? object?.en ?? "";
};

const writeJSONFile = (path, data) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ Translations input file created successfully!");
  } catch (err) {
    console.error("❌ Failed to write translations file:", err);
    throw err;
  }
};

module.exports = {
  fetchAPIToken,
  getDefaultLanguage,
  writeJSONFile,
};
