const fs = require("fs");
const axios = require("axios");
const { set } = require("lodash");
const config = require("./config");
const { fetchAPIToken, writeJSONFile, getDefaultLanguage } = require("./commons");

/**
 * Fetches all purposes from organization
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
const fetchAllPurposes = async (token) => {
  try {
    const {
      data: { data },
    } = await axios.get(`${config.baseUrl}/metadata/purposes?$translations=true&organization_id=${config.organizationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Map a purpose to a translatable object
 */
const mapPurposeToTranslations = (purpose) => ({
  description: getDefaultLanguage(purpose.description),
  details: getDefaultLanguage(purpose.details),
});

/**
 * Map a list of purposes to translatable objects
 */
const mapPurposesToTranslations = (purposes) => {
  return purposes.map((purpose) => ({
    id: purpose.id,
    ...mapPurposeToTranslations(purpose),
  }));
};

/**
 * Fetch all purposes and write them to the input file
 */
const getPurposesTranslations = async () => {
  const token = await fetchAPIToken();
  const purposes = await fetchAllPurposes(token);

  const translations = mapPurposesToTranslations(purposes);
  const content = {
    translations: {
      purposes: translations,
    },
  };
  writeJSONFile("data/purposes_translations_input.json", content);
};

/**
 * Update a list of purposes from their translatable objects
 */
const updatePurposes = async (token, translations, language) => {
  const purposes = translations?.translations?.purposes || [];

  for (const purpose of purposes) {
    try {
      // Get the existing purpose from the API
      const existingPurpose = (
        await axios.get(`${config.baseUrl}/metadata/purposes/${purpose.id}?$translations=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ).data;

      // Override the values for the specified language
      set(existingPurpose, `description.${language}`, purpose.description);
      set(existingPurpose, `details.${language}`, purpose.details);

      // Patch the purpose with the new language values
      await axios.patch(
        `${config.baseUrl}/metadata/purposes/${purpose.id}`,
        {
          description: existingPurpose.description,
          details: existingPurpose.details,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(`Purpose ${purpose.id} updated`);
    } catch (error) {
      console.error(`Purpose ${purpose.id} failed to update due to an error:`, error);
      throw error;
    }
  }
};

/**
 * Update all purposes from the output file
 */
const updatePurposesTranslations = async ({ filename, language }) => {
  const token = await fetchAPIToken();
  const translations = JSON.parse(fs.readFileSync(filename, "utf8"));

  // Update the purposes
  await updatePurposes(token, translations, language);
};

module.exports = {
  getPurposesTranslations,
  updatePurposesTranslations,
};
