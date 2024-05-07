const fs = require("fs");
const axios = require("axios");
const config = require("./config");
const { get, set } = require("lodash");
const { fetchAPIToken, writeJSONFile } = require("./commons");

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
      name: category.name,
      description: category.description,
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
    notice_content_popup: notice.config?.notice?.content?.popup,
    notice_preferences_content_text: notice.config?.preferences?.content?.text,
    notice_preferences_content_title: notice.config?.preferences?.content?.title,
    notice_preferences_content_textVendors: notice.config?.preferences?.content?.textVendors,
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
        notice_content_popup: regulation.config.notice?.content?.popup,
        notice_content_deny: regulation.config.notice?.content?.deny,
        notice_content_dismiss: regulation.config.notice?.content?.dismiss,
        notice_content_learnMore: regulation.config.notice?.content?.learnMore,

        notice_preferences_content_title: regulation.config.preferences?.content?.title,
        notice_preferences_content_text: regulation.config.preferences?.content?.text,
        notice_preferences_content_agree: regulation.config.preferences?.content?.agree,
        notice_preferences_content_disagree: regulation.config.preferences?.content?.disagree,
        notice_preferences_content_agreeToAll: regulation.config.preferences?.content?.agreeToAll,
        notice_preferences_content_disagreeToAll: regulation.config.preferences?.content?.disagreeToAll,
        notice_preferences_content_viewAllPartners: regulation.config.preferences?.content?.viewAllPartners,
        notice_preferences_content_textVendors: regulation.config.preferences?.content?.textVendors,

        notice_preferences_categories: getCategoryTranslations(regulation.config.preferences?.categories),

        notice_preferences_content_save: regulation.config.preferences?.content?.save,
        notice_preferences_content_subtitle: regulation.config.preferences?.content?.subtitle,
        notice_preferences_content_blockVendors: regulation.config.preferences?.content?.blockVendors,
        notice_preferences_content_authorizeVendors: regulation.config.preferences?.content?.authorizeVendors,
        notice_preferences_content_subText: regulation.config.preferences?.content?.subText,
        notice_preferences_content_subTextVendors: regulation.config.preferences?.content?.subTextVendors,
      },
    };
  }),
});

// Patching notice configurations supports patching associated notice regulation configurations.
const updateNoticeConfigTranslations = async (token, data) => {
  const notice = await fetchGDPRNotice(token);
  if (notice.id !== data.notice_id) throw new Error("The notice ID does not match the configured notice ID.");

  set(notice, "config.notice.content.popup", data.translations.notice_content_popup);
  set(notice, "config.preferences.content.text", data.translations.notice_preferences_content_text);
  set(notice, "config.preferences.content.title", data.translations.notice_preferences_content_title);
  set(notice, "config.preferences.content.textVendors", data.translations.notice_preferences_content_textVendors);

  for (const category of get(notice, "config.preferences.categories", [])) {
    const categoryTranslation = data.translations.notice_preferences_categories.filter((item) => item.id === category.id)[0];
    if (categoryTranslation) {
      category.name = categoryTranslation.name;
      category.description = categoryTranslation.description;
    }
  }

  for (const regulation of notice.regulation_configurations) {
    const regulationTranslation = data.regulation_configurations.find((reg) => reg.id === regulation.id)?.translations;

    if (regulationTranslation && regulation.config && Object.keys(regulation.config).length > 0) {
      set(regulation, "config.notice.content.popup", regulationTranslation.notice_content_popup);
      set(regulation, "config.notice.content.deny", regulationTranslation.notice_content_deny);
      set(regulation, "config.notice.content.dismiss", regulationTranslation.notice_content_dismiss);
      set(regulation, "config.notice.content.learnMore", regulationTranslation.notice_content_learnMore);

      set(regulation, "config.preferences.content.title", regulationTranslation.notice_preferences_content_title);
      set(regulation, "config.preferences.content.text", regulationTranslation.notice_preferences_content_text);
      set(regulation, "config.preferences.content.agree", regulationTranslation.notice_preferences_content_agree);
      set(regulation, "config.preferences.content.disagree", regulationTranslation.notice_preferences_content_disagree);
      set(regulation, "config.preferences.content.agreeToAll", regulationTranslation.notice_preferences_content_agreeToAll);
      set(regulation, "config.preferences.content.disagreeToAll", regulationTranslation.notice_preferences_content_disagreeToAll);
      set(regulation, "config.preferences.content.viewAllPartners", regulationTranslation.notice_preferences_content_viewAllPartners);
      set(regulation, "config.preferences.content.textVendors", regulationTranslation.notice_preferences_content_textVendors);

      set(regulation, "config.preferences.content.save", regulationTranslation.notice_preferences_content_save);
      set(regulation, "config.preferences.content.subtitle", regulationTranslation.notice_preferences_content_subtitle);
      set(regulation, "config.preferences.content.blockVendors", regulationTranslation.notice_preferences_content_blockVendors);
      set(regulation, "config.preferences.content.authorizeVendors", regulationTranslation.notice_preferences_content_authorizeVendors);
      set(regulation, "config.preferences.content.subText", regulationTranslation.notice_preferences_content_subText);
      set(regulation, "config.preferences.content.subTextVendors", regulationTranslation.notice_preferences_content_subTextVendors);

      for (const category of get(regulation, "config.preferences.categories", [])) {
        const categoryTranslation = regulationTranslation.notice_preferences_categories.find((item) => item.id === category.id);

        if (categoryTranslation) {
          category.name = categoryTranslation.name;
          category.description = categoryTranslation.description;
        }
      }
    }
  }

  const response = await axios.patch(`${config.baseUrl}/widgets/notices/configs/${data.notice_id}`, notice, {
    headers: {
      Authorization: `Bearer ${token}`,
      v: 2,
    },
  });

  console.log(response.data);
};

const getNoticeTranslations = async () => {
  const token = await fetchAPIToken();
  const config = await fetchGDPRNotice(token);
  const translatableText = extractAndFormatTranslatableTexts(config);

  writeJSONFile("./data/notice_translations_input.json", translatableText);
};

const updateNoticeTranslations = async () => {
  const token = await fetchAPIToken();
  const translations = JSON.parse(fs.readFileSync("./data/notice_translations_output.json", "utf8"));
  // Update the notice configuration
  await updateNoticeConfigTranslations(token, translations);
};

module.exports = {
  getNoticeTranslations,
  updateNoticeTranslations,
};
