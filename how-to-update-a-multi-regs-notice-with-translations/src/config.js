const config = {
  baseUrl: "https://api.didomi.io/v1",
  token: "<YOUR_API_TOKEN>",

  noticeId: "<NOTICE_ID>",
  organizationId: "<ORGANIZATION_ID>",
  regulationId: "<REGULATION_ID>", // `gdpr`, `cpra`, etc.

  gdprFilePath: "./translations/gdpr.json",

  action: "pull", // `pull` or `push`
};

module.exports = config;
