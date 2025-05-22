const {
  fetchAPIToken,
  writeJSONFile,
  getDefaultLanguage,
} = require("./commons");
const { get, set } = require("lodash");
const { readFileSync } = require("fs");
const axios = require("axios");
const config = require("./config");

/**
 * Fetches GDPR notice config data.
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
const fetchGDPRNoticeConfig = async (token, noticeId = config.noticeId) => {
  try {
    const {
      data: {
        data: [data],
      },
    } = await axios.get(
      `${config.baseUrl}/widgets/notices/configs/?notice_id=${noticeId}&deployed_at=null&organization_id=${config.organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          v: 2,
        },
      },
    );

    return {
      ...data,
      regulation_configurations: data.regulation_configurations.filter(
        (config) =>
          config.regulation_id === "gdpr" &&
          config.is_default_regulation_config,
      ), // Filtering GDPR only
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Returns category translatable fields.
 * @param {*} categories
 * @returns
 */
const getCategoryTranslations = (rootKey, categories = [], language) => {
  const filteredCategories = categories.filter(
    (item) => item.type === "category",
  );
  const categoriesObject = {};

  for (const category of filteredCategories) {
    categoriesObject[`${rootKey}.categories.${category.id}.name`] =
      getDefaultLanguage(category.name, language);
    categoriesObject[`${rootKey}.categories.${category.id}.description`] =
      getDefaultLanguage(category.description, language);
  }

  return categoriesObject;
};

const getRegulationsTranslations = (rootKey, regulations = [], language) => {
  let regulationsObject = {};

  for (const regulation of regulations) {
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.notice.content.popup`
    ] = getDefaultLanguage(regulation.config.notice?.content?.popup, language);
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.notice.content.deny`
    ] = getDefaultLanguage(regulation.config.notice?.content?.deny, language);
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.notice.content.dismiss`
    ] = getDefaultLanguage(
      regulation.config.notice?.content?.dismiss,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.notice.content.learnMore`
    ] = getDefaultLanguage(
      regulation.config.notice?.content?.learnMore,
      language,
    );

    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.title`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.title,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.text`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.text,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.agree`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.agree,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.disagree`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.disagree,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.agreeToAll`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.agreeToAll,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.disagreeToAll`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.disagreeToAll,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.viewAllPartners`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.viewAllPartners,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.textVendors`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.textVendors,
      language,
    );

    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.save`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.save,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.subtitle`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.subtitle,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.blockVendors`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.blockVendors,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.authorizeVendors`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.authorizeVendors,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.subText`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.subText,
      language,
    );
    regulationsObject[
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences.content.subTextVendors`
    ] = getDefaultLanguage(
      regulation.config.preferences?.content?.subTextVendors,
      language,
    );

    const categoriesObject = getCategoryTranslations(
      `${rootKey}.regulation_configurations.${regulation.regulation_id}.config.preferences`,
      regulation.config.preferences?.categories,
      language,
    );
    regulationsObject = { ...regulationsObject, ...categoriesObject };
  }

  return regulationsObject;
};

const extractAndFormatTranslatableTexts = (notice, language) => {
  let noticeObject = {};
  let rootKey = `notice.${notice.notice_id}`;

  console.log("Notice ID: ", notice.notice_id);
  console.log("NoticeConfig ID: ", notice.id);
  console.log("Default Language: ", notice.config?.languages?.default);
  console.log("Enabled Languages: ", notice.config?.languages?.enabled, "\n");

  noticeObject[`${rootKey}.config.notice.content.popup`] = getDefaultLanguage(
    notice.config?.notice?.content?.popup,
    language,
  );
  noticeObject[`${rootKey}.config.preferences.content.text`] =
    getDefaultLanguage(notice.config?.preferences?.content?.text, language);
  noticeObject[`${rootKey}.config.preferences.content.title`] =
    getDefaultLanguage(notice.config?.preferences?.content?.title, language);
  noticeObject[`${rootKey}.config.preferences.content.textVendors`] =
    getDefaultLanguage(
      notice.config?.preferences?.content?.textVendors,
      language,
    );
  noticeObject[`${rootKey}.config.app.privacyPolicyURL`] =
    notice.config?.app?.privacyPolicyURL;

  const categoriesTranslations = getCategoryTranslations(
    `${rootKey}.config.preferences`,
    notice.config?.preferences?.categories,
    language,
  );
  const regulationsTranslations = getRegulationsTranslations(
    rootKey,
    notice.regulation_configurations,
    language,
  );

  return {
    ...noticeObject,
    ...categoriesTranslations,
    ...regulationsTranslations,
  };
};

// Patching notice configurations supports patching associated notice regulation configurations.
const updateNoticeConfigTranslations = async (
  token,
  data,
  language,
  childNoticeId,
  dryRun = false,
) => {
  const apiConfig = await fetchGDPRNoticeConfig(token, childNoticeId);

  if (apiConfig.notice_id !== data.notice_id) {
    throw new Error(
      `The notice ID "${apiConfig.notice_id}" does not match the configured notice ID: "${data.notice_id}".`,
    );
  }

  if (!apiConfig.config?.languages?.enabled.includes(language)) {
    throw new Error(
      `The language "${language}" is not enabled for the notice.`,
    );
  }

  set(
    apiConfig,
    `config.notice.content.popup.${language}`,
    data.config?.notice?.content?.popup,
  );
  set(
    apiConfig,
    `config.preferences.content.text.${language}`,
    data.config?.preferences?.content?.text,
  );
  set(
    apiConfig,
    `config.preferences.content.title.${language}`,
    data.config?.preferences?.content?.title,
  );
  set(
    apiConfig,
    `config.preferences.content.textVendors.${language}`,
    data.config?.preferences?.content?.textVendors,
  );

  for (const category of get(apiConfig, "config.preferences.categories", [])) {
    const categoryTranslation = data.config?.preferences?.categories?.filter(
      (item) => item.id === category.id,
    )[0];
    if (categoryTranslation) {
      set(category, `name.${language}`, categoryTranslation.name);
      set(category, `description.${language}`, categoryTranslation.description);
    }
  }

  for (const regulation of apiConfig.regulation_configurations) {
    const regulationTranslation = data.regulation_configurations.find(
      (reg) =>
        reg.regulation_id === regulation.regulation_id &&
        regulation.is_default_regulation_config,
    );

    if (
      regulationTranslation &&
      regulation.config &&
      Object.keys(regulation.config).length > 0
    ) {
      set(
        regulation,
        `config.notice.content.popup.${language}`,
        regulationTranslation.config?.notice?.content?.popup,
      );
      set(
        regulation,
        `config.notice.content.deny.${language}`,
        regulationTranslation.config?.notice?.content?.deny,
      );
      set(
        regulation,
        `config.notice.content.dismiss.${language}`,
        regulationTranslation.config?.notice?.content?.dismiss,
      );
      set(
        regulation,
        `config.notice.content.learnMore.${language}`,
        regulationTranslation.config?.notice?.content?.learnMore,
      );

      set(
        regulation,
        `config.preferences.content.title.${language}`,
        regulationTranslation.config?.preferences?.content?.title,
      );
      set(
        regulation,
        `config.preferences.content.text.${language}`,
        regulationTranslation.config?.preferences?.content?.text,
      );
      set(
        regulation,
        `config.preferences.content.agree.${language}`,
        regulationTranslation.config?.preferences?.content?.agree,
      );
      set(
        regulation,
        `config.preferences.content.disagree.${language}`,
        regulationTranslation.config?.preferences?.content?.disagree,
      );
      set(
        regulation,
        `config.preferences.content.agreeToAll.${language}`,
        regulationTranslation.config?.preferences?.content?.agreeToAll,
      );
      set(
        regulation,
        `config.preferences.content.disagreeToAll.${language}`,
        regulationTranslation.config?.preferences?.content?.disagreeToAll,
      );
      set(
        regulation,
        `config.preferences.content.viewAllPartners.${language}`,
        regulationTranslation.config?.preferences?.content?.viewAllPartners,
      );
      set(
        regulation,
        `config.preferences.content.textVendors.${language}`,
        regulationTranslation.config?.preferences?.content?.textVendors,
      );

      set(
        regulation,
        `config.preferences.content.save.${language}`,
        regulationTranslation.config?.preferences?.content?.save,
      );
      set(
        regulation,
        `config.preferences.content.subtitle.${language}`,
        regulationTranslation.config?.preferences?.content?.subtitle,
      );
      set(
        regulation,
        `config.preferences.content.blockVendors.${language}`,
        regulationTranslation.config?.preferences?.content?.blockVendors,
      );
      set(
        regulation,
        `config.preferences.content.authorizeVendors.${language}`,
        regulationTranslation.config?.preferences?.content?.authorizeVendors,
      );
      set(
        regulation,
        `config.preferences.content.subText.${language}`,
        regulationTranslation.config?.preferences?.content?.subText,
      );
      set(
        regulation,
        `config.preferences.content.subTextVendors.${language}`,
        regulationTranslation.config?.preferences?.content?.subTextVendors,
      );

      for (const category of get(
        regulation,
        "config.preferences.categories",
        [],
      )) {
        const categoryTranslation =
          regulationTranslation.config?.preferences?.categories?.find(
            (item) => item.id === category.id,
          );

        if (categoryTranslation) {
          set(category, `name.${language}`, categoryTranslation.name);
          set(
            category,
            `description.${language}`,
            categoryTranslation.description,
          );
        }
      }
    }
  }

  if (dryRun) {
    console.log(
      `✅ Dry run mode: skipping update for notice "${childNoticeId}" in language "${language}".`,
    );
    console.log("Config preview:", JSON.stringify(apiConfig, null, 2));
    return;
  }

  await axios.patch(
    `${config.baseUrl}/widgets/notices/configs/${apiConfig.id}`,
    apiConfig,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        v: 2,
      },
    },
  );
};

const parseTranslationsToCategories = (translations) => {
  let categoriesList = [];

  for (const key of Object.keys(translations)) {
    categoriesList.push({
      id: key,
      ...translations[key],
    });
  }

  return categoriesList;
};

const parseTranslationsToRegulations = (translations) => {
  let regulationsList = [];

  for (const key of Object.keys(translations)) {
    let regulation = translations[key];

    // Parse categories from regulation
    let regulationCategories = regulation.config?.preferences?.categories || [];
    set(
      regulation,
      "config.preferences.categories",
      parseTranslationsToCategories(regulationCategories),
    );

    regulationsList.push({
      regulation_id: key,
      ...regulation,
    });
  }

  return regulationsList;
};

const parseTranslationsToNoticeConfig = (translations) => {
  let noticeObject = {};

  // Parse all translations to an object
  for (const key of Object.keys(translations)) {
    set(noticeObject, key, translations[key]);
  }

  noticeObject = noticeObject.notice;

  // Extract the notice ID
  for (const key of Object.keys(noticeObject)) {
    noticeObject = {
      notice_id: key,
      ...noticeObject[key],
    };
  }

  // Parse root categories
  let categories = noticeObject.config?.preferences?.categories || [];
  set(
    noticeObject,
    "config.preferences.categories",
    parseTranslationsToCategories(categories),
  );

  // Parse regulations
  let regulations = noticeObject.regulation_configurations || [];
  set(
    noticeObject,
    "regulation_configurations",
    parseTranslationsToRegulations(regulations),
  );

  return noticeObject;
};

const getNoticeTranslations = async (language) => {
  const token = await fetchAPIToken();
  const noticeConfig = await fetchGDPRNoticeConfig(token);

  const translatableText = extractAndFormatTranslatableTexts(
    noticeConfig,
    language,
  );

  writeJSONFile(config.translationsPath, translatableText);
};

const updateNoticeTranslations = async ({ filename, language }) => {
  const token = await fetchAPIToken();

  let translations;
  try {
    translations = JSON.parse(readFileSync(filename, "utf8"));
  } catch (err) {
    console.error("Failed to read or parse the translation file:", err);
    throw err;
  }

  let noticeConfig = parseTranslationsToNoticeConfig(translations);

  // Update the notice configuration
  await updateNoticeConfigTranslations(token, noticeConfig, language);
};

module.exports = {
  fetchGDPRNoticeConfig,
  getNoticeTranslations,
  parseTranslationsToNoticeConfig,
  updateNoticeConfigTranslations,
  updateNoticeTranslations,
};
