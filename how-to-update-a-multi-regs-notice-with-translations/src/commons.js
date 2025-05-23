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
 * Returns a language-specific value from the given object.
 *
 * If the environment variable `SPECIFIC_LANGUAGE` is set to "true", it will first
 * attempt to retrieve `object[language]`. If not found, or if `SPECIFIC_LANGUAGE` is not "true",
 * it returns `object.en` as the fallback.
 *
 * The language specific option is used when replacing macros.
 *
 */
const getDefaultLanguage = (object, language) =>
  object?.[process.env.SPECIFIC_LANGUAGE === "true" ? language : "en"] ??
  object?.en;

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
