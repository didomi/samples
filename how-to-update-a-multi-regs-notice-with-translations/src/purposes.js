const fs = require("fs");
const axios = require("axios");
const { set } = require("lodash");
const config = require("./config");
const {
  fetchAPIToken,
  writeJSONFile,
  getDefaultLanguage,
} = require("./commons");

/**
 * Fetches all purposes from organization
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
const fetchAllPurposes = async (token) => {
  try {
    const {
      data: { data },
    } = await axios.get(
      `${config.baseUrl}/metadata/purposes?$translations=true&organization_id=${config.organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

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
  let purposesObject = {};

  for (const purpose of purposes) {
    let rootKey = `purposes.${purpose.id}`;
    const defaultPurpose = mapPurposeToTranslations(purpose);
    purposesObject[`${rootKey}.description`] = defaultPurpose.description;
    purposesObject[`${rootKey}.details`] = defaultPurpose.details;
  }

  return purposesObject;
};

/**
 * Fetch all purposes and write them to the input file
 */
const getPurposesTranslations = async () => {
  const token = await fetchAPIToken();
  const purposes = await fetchAllPurposes(token);

  const content = mapPurposesToTranslations(purposes);
  writeJSONFile("data/purposes_translations_input.json", content);
};

const parseTranslationsToPurposes = (translations) => {
  const purposesList = [];
  const purposesObject = {};

  // Parse all translations to an object
  for (const key of Object.keys(translations)) {
    set(purposesObject, key, translations[key]);
  }

  // Create a list of purposes from all the IDs created as an object
  for (const key of Object.keys(purposesObject.purposes)) {
    purposesList.push({
      id: key,
      ...purposesObject.purposes[key],
    });
  }

  return purposesList;
};

/**
 * Update a list of purposes from their translatable objects
 */
const updatePurposes = async (token, translations, language) => {
  const purposes = parseTranslationsToPurposes(translations || {}) || [];

  for (const purpose of purposes) {
    try {
      // Get the existing purpose from the API
      const existingPurpose = (
        await axios.get(
          `${config.baseUrl}/metadata/purposes/${purpose.id}?$translations=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
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
      console.error(
        `Purpose ${purpose.id} failed to update due to an error:`,
        error,
      );
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
