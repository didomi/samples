const fs = require("fs");
const axios = require("axios");
const config = require("./config");
const { get, set } = require("lodash");
const { fetchAPIToken, writeJSONFile, getDefaultLanguage } = require("./commons");

/**
 * Fetches GDPR notice configuration data.
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
const fetchGDPRNotice = async (token) => {
  try {
    const {
      data: {
        data: [data],
      },
    } = await axios.get(`${config.baseUrl}/widgets/notices/configs/?notice_id=${config.noticeId}&deployed_at=null&organization_id=${config.organizationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        v: 2,
      },
    });

    return {
      ...data,
      regulation_configurations: data.regulation_configurations.filter((config) => config.regulation_id === "gdpr"), // Filtering GDPR only
    };
  } catch (error) {
    console.error(error);
  }
};

/**
 * Returns category translatable fields.
 * @param {*} categories
 * @returns
 */
const getCategoryTranslations = (categories = []) =>
  categories
    .filter((item) => item.type === "category")
    .map((category) => ({
      id: category.id,
      name: getDefaultLanguage(category.name),
      description: getDefaultLanguage(category.description),
    }));

const extractAndFormatTranslatableTexts = (notice) => ({
  // Identifiers and general information
  notice_id: notice.id,
  organization_id: notice.organization_id,
  created_at: notice.created_at,
  updated_at: notice.updated_at,

  // Language settings
  default_language: notice.config?.languages?.default,
  enabled_languages: notice.config?.languages?.enabled,

  // Top level translatable texts
  translations: {
    notice_content_popup: getDefaultLanguage(notice.config?.notice?.content?.popup),
    notice_preferences_content_text: getDefaultLanguage(notice.config?.preferences?.content?.text),
    notice_preferences_content_title: getDefaultLanguage(notice.config?.preferences?.content?.title),
    notice_preferences_content_textVendors: getDefaultLanguage(notice.config?.preferences?.content?.textVendors),
    notice_preferences_categories: getCategoryTranslations(notice.config?.preferences?.categories),
    // How do we handle i18n for privacy policy URLs
    notice_privacy_policy_url: notice.config?.app?.privacyPolicyURL,
  },

  // Regulation level configuration
  regulation_configurations: notice.regulation_configurations.map((regulation) => {
    return {
      // Identifiers and general information
      id: regulation.id,
      regulation_id: regulation.regulation_id,
      created_at: regulation.created_at,
      updated_at: regulation.updated_at,

      // Language and geolocation settings
      is_default_regulation_config: regulation.is_default_regulation_config,
      geo_locations: regulation.geo_locations,

      // Translatable texts
      translations: {
        notice_content_popup: getDefaultLanguage(regulation.config.notice?.content?.popup),
        notice_content_deny: getDefaultLanguage(regulation.config.notice?.content?.deny),
        notice_content_dismiss: getDefaultLanguage(regulation.config.notice?.content?.dismiss),
        notice_content_learnMore: getDefaultLanguage(regulation.config.notice?.content?.learnMore),

        notice_preferences_content_title: getDefaultLanguage(regulation.config.preferences?.content?.title),
        notice_preferences_content_text: getDefaultLanguage(regulation.config.preferences?.content?.text),
        notice_preferences_content_agree: getDefaultLanguage(regulation.config.preferences?.content?.agree),
        notice_preferences_content_disagree: getDefaultLanguage(regulation.config.preferences?.content?.disagree),
        notice_preferences_content_agreeToAll: getDefaultLanguage(regulation.config.preferences?.content?.agreeToAll),
        notice_preferences_content_disagreeToAll: getDefaultLanguage(regulation.config.preferences?.content?.disagreeToAll),
        notice_preferences_content_viewAllPartners: getDefaultLanguage(regulation.config.preferences?.content?.viewAllPartners),
        notice_preferences_content_textVendors: getDefaultLanguage(regulation.config.preferences?.content?.textVendors),

        notice_preferences_categories: getCategoryTranslations(regulation.config.preferences?.categories),

        notice_preferences_content_save: getDefaultLanguage(regulation.config.preferences?.content?.save),
        notice_preferences_content_subtitle: getDefaultLanguage(regulation.config.preferences?.content?.subtitle),
        notice_preferences_content_blockVendors: getDefaultLanguage(regulation.config.preferences?.content?.blockVendors),
        notice_preferences_content_authorizeVendors: getDefaultLanguage(regulation.config.preferences?.content?.authorizeVendors),
        notice_preferences_content_subText: getDefaultLanguage(regulation.config.preferences?.content?.subText),
        notice_preferences_content_subTextVendors: getDefaultLanguage(regulation.config.preferences?.content?.subTextVendors),
      },
    };
  }),
});

// Patching notice configurations supports patching associated notice regulation configurations.
const updateNoticeConfigTranslations = async (token, data, language) => {
  const notice = await fetchGDPRNotice(token);
  if (notice.id !== data.notice_id) throw new Error("The notice ID does not match the configured notice ID.");

  set(notice, `config.notice.content.popup.${language}`, data.translations.notice_content_popup);
  set(notice, `config.preferences.content.text.${language}`, data.translations.notice_preferences_content_text);
  set(notice, `config.preferences.content.title.${language}`, data.translations.notice_preferences_content_title);
  set(notice, `config.preferences.content.textVendors.${language}`, data.translations.notice_preferences_content_textVendors);

  for (const category of get(notice, "config.preferences.categories", [])) {
    const categoryTranslation = data.translations.notice_preferences_categories.filter((item) => item.id === category.id)[0];
    if (categoryTranslation) {
      set(category, `name.${language}`, categoryTranslation.name);
      set(category, `description.${language}`, categoryTranslation.description);
    }
  }

  for (const regulation of notice.regulation_configurations) {
    const regulationTranslation = data.regulation_configurations.find((reg) => reg.id === regulation.id)?.translations;

    if (regulationTranslation && regulation.config && Object.keys(regulation.config).length > 0) {
      set(regulation, `config.notice.content.popup.${language}`, regulationTranslation.notice_content_popup);
      set(regulation, `config.notice.content.deny.${language}`, regulationTranslation.notice_content_deny);
      set(regulation, `config.notice.content.dismiss.${language}`, regulationTranslation.notice_content_dismiss);
      set(regulation, `config.notice.content.learnMore.${language}`, regulationTranslation.notice_content_learnMore);

      set(regulation, `config.preferences.content.title.${language}`, regulationTranslation.notice_preferences_content_title);
      set(regulation, `config.preferences.content.text.${language}`, regulationTranslation.notice_preferences_content_text);
      set(regulation, `config.preferences.content.agree.${language}`, regulationTranslation.notice_preferences_content_agree);
      set(regulation, `config.preferences.content.disagree.${language}`, regulationTranslation.notice_preferences_content_disagree);
      set(regulation, `config.preferences.content.agreeToAll.${language}`, regulationTranslation.notice_preferences_content_agreeToAll);
      set(regulation, `config.preferences.content.disagreeToAll.${language}`, regulationTranslation.notice_preferences_content_disagreeToAll);
      set(regulation, `config.preferences.content.viewAllPartners.${language}`, regulationTranslation.notice_preferences_content_viewAllPartners);
      set(regulation, `config.preferences.content.textVendors.${language}`, regulationTranslation.notice_preferences_content_textVendors);

      set(regulation, `config.preferences.content.save.${language}`, regulationTranslation.notice_preferences_content_save);
      set(regulation, `config.preferences.content.subtitle.${language}`, regulationTranslation.notice_preferences_content_subtitle);
      set(regulation, `config.preferences.content.blockVendors.${language}`, regulationTranslation.notice_preferences_content_blockVendors);
      set(regulation, `config.preferences.content.authorizeVendors.${language}`, regulationTranslation.notice_preferences_content_authorizeVendors);
      set(regulation, `config.preferences.content.subText.${language}`, regulationTranslation.notice_preferences_content_subText);
      set(regulation, `config.preferences.content.subTextVendors.${language}`, regulationTranslation.notice_preferences_content_subTextVendors);

      for (const category of get(regulation, "config.preferences.categories", [])) {
        const categoryTranslation = regulationTranslation.notice_preferences_categories.find((item) => item.id === category.id);

        if (categoryTranslation) {
          set(category, `name.${language}`, categoryTranslation.name);
          set(category, `description.${language}`, categoryTranslation.description);
        }
      }
    }
  }

  await axios.patch(`${config.baseUrl}/widgets/notices/configs/${data.notice_id}`, notice, {
    headers: {
      Authorization: `Bearer ${token}`,
      v: 2,
    },
  });
};

const getNoticeTranslations = async () => {
  const token = await fetchAPIToken();
  const config = await fetchGDPRNotice(token);
  const translatableText = extractAndFormatTranslatableTexts(config);

  writeJSONFile("./data/notice_translations_input.json", translatableText);
};

const updateNoticeTranslations = async ({ filename, language }) => {
  const token = await fetchAPIToken();
  const translations = JSON.parse(fs.readFileSync(filename, "utf8"));

  // Update the notice configuration
  await updateNoticeConfigTranslations(token, translations, language);
};

module.exports = {
  getNoticeTranslations,
  updateNoticeTranslations,
};
