const { updatePurposesTranslations } = require("../src/purposes");

(async () => {
  try {
    await updatePurposesTranslations();
  } catch (error) {
    if (error.statusCode === 401) {
      console.error("⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication");
    } else {
      console.error(error);
    }
  }
})();
