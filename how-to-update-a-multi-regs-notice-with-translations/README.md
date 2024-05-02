# Update a Multi-Regulations Consent Notice with Translations

This guide demonstrates how to use a script to update the content of a multi-regulations consent notice by leveraging translation files. The script communicates with the Didomi API to retrieve and update configuration information. After updates are applied, you must publish the changes manually through the Didomi console or automate the process by creating a new deployment on `/widgets/notices/deployments` (more information can be found here: https://developers.didomi.io/api/widgets/consent-notices/tutorials/tutorial-1#publish-the-notice).

## Prerequisites

- You need to have Node.js installed on your system to run the script.

## Installation

1. Clone this repo or download the source code to your local machine.
2. Navigate to the project's root directory in your terminal.
3. Run `npm install` to install all dependencies required for the script to work.

## Configuration

To set up the script correctly, follow these steps:

1. Update the file named `config.js` with your specific settings in the folder `src` of the project root directory.

```javascript
module.exports = {
  baseUrl: "https://api.didomi.io/v1",
  token: "<YOUR_API_TOKEN>", // Replace with your actual API token received from Didomi

  noticeId: "<NOTICE_ID>", // ID of the notice you want to update
  organizationId: "<ORGANIZATION_ID>", // Your organization ID on Didomi
  regulationId: "<REGULATION_ID>", // e.g., 'gdpr', 'cpra', etc. The target regulation ID

  gdprFilePath: "<REG_CONTENT_FILE_PATH>",

  action: "<PULL_OR_PUSH>", // `pull` or `push`
};
```

3. Replace placeholder text such as `<YOUR_API_TOKEN>`, `<NOTICE_ID>`, and others with actual values relevant to your environment.

4. Create a new folder `translations` and first `pull` the content of the default regulation config specified.

5. Replace the content pulled with the translations you want to update and `push` the content (you will need to update the configuration and specify the regulation config keys to update in the script).

## Usage

Run the script with the following command line instruction while inside the project folder:

```sh
node index.js
```

When executed, the script will:

1. Fetch the draft configuration for your notice, as specified in the `config.js`.
2. Search within that configuration for the default regulation config of the `regulationId`.
3. Employ the translations provided in your `translations/<REGULATION_ID>.json` file to update the content where necessary.
4. Initiate a PATCH HTTP request to apply the updated configuration to the draft notice.
