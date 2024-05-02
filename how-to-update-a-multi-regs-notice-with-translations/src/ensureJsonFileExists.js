const fs = require("fs");

// Utility function to ensure the json file exists
function ensureJsonFileExists(filePath, defaultContent = {}) {
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    // Create the file with default content, which is an empty object by default
    fs.writeFileSync(filePath, JSON.stringify(defaultContent), (err) => {
      if (err) {
        console.error(`An error occurred while creating ${filePath}:`, err);
        return;
      }
    });
  }
}

module.exports = {
  ensureJsonFileExists,
};
