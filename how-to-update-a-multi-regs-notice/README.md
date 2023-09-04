# Update vendor IDs for a multi regulations notice

This script updates the vendor IDs for a specific draft configuration (the latest saved configuration). Publication will need to be performed either programmatically afterwards or done directly from the console. The code is written in JavaScript and runs in a Node.js environment.

## Prerequisites

- Node.js installed on your system

## Installation

1. Clone this repository or download the source code.
2. In the project directory, run `npm install` to install the required dependencies.

## Configuration

1. Create a `config.js` file in the project root directory with the following structure:

```javascript
const config = {
  baseUrl: "https://api.didomi.io/v1",
  token: "<token>",

  noticeId: "<noticeId>",
  organizationId: "<organizationId>",
  regulationId: "gdpr",
};
```

2. Create a `vendorsIds.json` file in the project root directory with the following structure:

```json
{
  "ids": ["vendor_id_A", "vendor_id_B", "vendor_id_C"]
}
```

3. Replace `vendor_id_A`, `vendor_id_B`, and `vendor_id_C` and so on with your desired vendor IDs to add or remove them.

## Usage

In the project directory, run:

```sh
node index.js
```

The script will execute the following steps:

1. Fetch the latest draft configuration data.
2. Obtain the default GDPR regulation configuration from the fetched draft configuration.
3. Update the default GDPR configuration with new vendor IDs from the `vendorsIds.json` file.
4. Retrieve the updated draft configuration.
5. Validate that the GDPR regulation configuration has been successfully updated with the new vendor IDs.

If any errors occur during the script execution, they will be logged to the console.
