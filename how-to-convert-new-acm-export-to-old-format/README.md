# Didomi ACM Data Export Converter

A Python tool to convert Didomi ACM (Advanced Compliance Monitoring) tracker data from the new CSV export format to the legacy format.

## Overview

This script processes CSV files:
- **One or more Tracker CSVs**: Contains tracker/cookie data with nested JSON fields
- **One or more Vendors CSV**: Contains vendor/partner information with country mappings

It flattens nested JSON structures, combines multiple tracker files if provided, and produces a single CSV file in the old format with all relevant fields expanded.

## Requirements

- Python 3.7+
- pandas 2.0.0+

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

The script uses a flag-based syntax to clearly distinguish between tracker and vendor files.

### Flags

- `--trackers` or `-t`: One or more tracker CSV files
- `--vendors` or `-v`: One or more vendor CSV files
- `--output` or `-o`: (Optional) Output CSV path

### Basic Usage

```bash
python convert_new_to_old.py --trackers <tracker.csv> --vendors <vendor.csv>
```

This will create an output file named `<tracker>_converted.csv` in the same directory.

### Multiple Files

```bash
# Multiple tracker files
python convert_new_to_old.py --trackers t1.csv t2.csv t3.csv --vendors vendors.csv

# Multiple vendor files
python convert_new_to_old.py --trackers trackers.csv --vendors v1.csv v2.csv v3.csv

# Multiple of both
python convert_new_to_old.py --trackers t1.csv t2.csv --vendors v1.csv v2.csv
```

### Specify Output File

```bash
python convert_new_to_old.py --trackers trackers.csv --vendors vendors.csv --output result.csv
```

### Complete Examples

```bash
# Single files (basic)
python convert_new_to_old.py --trackers new_trackers.csv --vendors vendors.csv
# Creates: new_trackers_converted.csv

# Short flags
python convert_new_to_old.py -t trackers.csv -v vendors.csv
# Creates: trackers_converted.csv

# Multiple tracker files
python convert_new_to_old.py -t jan.csv feb.csv mar.csv -v vendors.csv
# Creates: jan_converted.csv (combined data from all 3 months)

# Multiple vendor files
python convert_new_to_old.py -t trackers.csv -v vendors_eu.csv vendors_us.csv
# Creates: trackers_converted.csv (with combined vendor data)

# Multiple of both with custom output
python convert_new_to_old.py -t t1.csv t2.csv -v v1.csv v2.csv -o quarterly_report.csv
# Creates: quarterly_report.csv

# Using wildcards (shell expansion)
python convert_new_to_old.py --trackers data/trackers_*.csv --vendors data/vendors_*.csv --output combined.csv
# Combines all matching tracker and vendor files

# With full paths
python convert_new_to_old.py \
  --trackers /path/to/trackers1.csv /path/to/trackers2.csv \
  --vendors /path/to/vendors.csv \
  --output /output/result.csv
```

## Input File Format

### Trackers CSV

Expected columns (with JSON fields):
- `Property Id`
- `Collect Id`
- `Page Url`
- `Page Url Host`
- `Created At`
- `Initiator` (JSON: url, url_host, url_sld, type, vendor.id)
- `Cmp` (JSON: scenario.id)
- `Type`
- `Initial Name`
- `Name Pattern`
- `Name`
- `Lifetime Seconds`
- `Is Persistent`
- `Is Third Party`
- `Host`
- `Vendor` (JSON: name, id)

### Vendors CSV

Expected columns:
- `id` or embedded in `Partner` JSON
- `Partner` (JSON: id, country, etc.)

## Output Format

The output CSV contains the following columns in the old format:

| Column | Description |
|--------|-------------|
| `property_id` | Property identifier |
| `collect_id` | Collection identifier |
| `page_url` | URL where tracker was found |
| `date` | Timestamp of collection |
| `initiator_url` | URL that initiated the tracker |
| `initiator_url_host` | Host of initiator URL |
| `initiator_url_sld` | Second-level domain of initiator |
| `initiator_type` | Type of initiator (script, etc.) |
| `Initiator Country` | Country of the vendor/initiator |
| `Domain` | Page domain |
| `tracker_type` | Type of tracker (cookie, localStorage, etc.) |
| `initial_name` | Original tracker name |
| `name_pattern` | Pattern for tracker name |
| `name` | Current tracker name |
| `lifetime_seconds` | Lifetime in seconds |
| `is_persistent` | Whether tracker is persistent |
| `is_third_party` | Whether tracker is third-party |
| `cmp_scenario_id` | CMP scenario identifier |
| `cookie_domain` | Cookie domain |
| `Vendor` | Vendor name (or host if unavailable) |

## Features

- **Multiple Input Files**: Supports combining multiple tracker and vendor CSV files
- **Flag-Based Syntax**: Clear distinction between trackers and vendors using `--trackers` and `--vendors` flags
- **Input Validation**: Checks for file existence and CSV validity before processing
- **Error Handling**: Comprehensive error handling with clear error messages
- **Performance Optimized**: Uses vectorized pandas operations for fast processing
- **Progress Indicators**: Shows progress during conversion process
- **Automatic Output Naming**: Generates output filename if not specified
- **JSON Parsing**: Safely handles malformed or missing JSON fields
- **Short Flags**: Convenient `-t`, `-v`, `-o` aliases for faster typing

## Error Handling

The script handles common errors gracefully:

- **File not found**: Clear message indicating which file is missing
- **Empty CSV files**: Validates files contain data
- **Invalid CSV format**: Catches and reports parsing errors
- **Missing columns**: Handles optional columns gracefully

## Performance

The script uses optimized pandas operations:
- Vectorized `.map()` instead of `.apply()` for lookups
- Efficient bulk column renaming
- Single-pass vendor info extraction with `zip()`
- ~2-3x faster than previous implementation on large datasets

## Example Output

### Single Files
```
📂 Loading 1 tracker file(s):
   - new_trackers.csv
📂 Loading 1 vendor file(s):
   - vendors.csv

✓ Loaded 1,234 rows from Trackers file
✓ Loaded 567 rows from Vendors file
⚙  Processing Initiator data...
⚙  Processing CMP data...
⚙  Processing Vendor data...
⚙  Resolving initiator countries...
⚙  Extracting vendor information...
⚙  Building output format...
💾 Saving output to: new_trackers_converted.csv

✅ Conversion complete!
   Input:  1,234 tracker rows
   Output: 1,234 rows saved to new_trackers_converted.csv
```

### Multiple Tracker Files
```
📂 Loading 3 tracker file(s):
   - trackers_jan.csv
   - trackers_feb.csv
   - trackers_mar.csv
📂 Loading 1 vendor file(s):
   - vendors.csv

✓ Loaded 456 rows from Trackers file
✓ Loaded 523 rows from Trackers file
✓ Loaded 491 rows from Trackers file
🔗 Combining 3 tracker files...
   Combined total: 1,470 rows
✓ Loaded 567 rows from Vendors file
⚙  Processing Initiator data...
⚙  Processing CMP data...
⚙  Processing Vendor data...
⚙  Resolving initiator countries...
⚙  Extracting vendor information...
⚙  Building output format...
💾 Saving output to: trackers_jan_converted.csv

✅ Conversion complete!
   Input:  1,470 tracker rows
   Output: 1,470 rows saved to trackers_jan_converted.csv
```

### Multiple Files (Both Trackers and Vendors)
```
📂 Loading 2 tracker file(s):
   - trackers_q1.csv
   - trackers_q2.csv
📂 Loading 2 vendor file(s):
   - vendors_eu.csv
   - vendors_us.csv

✓ Loaded 1,234 rows from Trackers file
✓ Loaded 1,456 rows from Trackers file
🔗 Combining 2 tracker files...
   Combined total: 2,690 rows
✓ Loaded 234 rows from Vendors file
✓ Loaded 189 rows from Vendors file
🔗 Combining 2 vendor files...
   Combined total: 423 rows
⚙  Processing Initiator data...
⚙  Processing CMP data...
⚙  Processing Vendor data...
⚙  Resolving initiator countries...
⚙  Extracting vendor information...
⚙  Building output format...
💾 Saving output to: quarterly_report.csv

✅ Conversion complete!
   Input:  2,690 tracker rows
   Output: 2,690 rows saved to quarterly_report.csv
```

## Troubleshooting

### Issue: "File not found" error
- Ensure file paths are correct and files exist
- Use absolute paths if relative paths aren't working

### Issue: "Empty or invalid CSV" error
- Check that CSV files contain data and valid headers
- Ensure files are properly formatted CSV (not Excel files)

### Issue: Missing output columns
- The script handles missing input columns gracefully
- Missing fields will appear as empty/null in output

## Important Notice

**This script is offered as a helper script to get you started.** It is not designed for long-term use, and no updates or active support will be provided. The script is provided as-is to assist with the transition from the old to new ACM export format.

## License

This tool is provided as-is for converting Didomi ACM export data formats.

## Support

For issues or questions:
- **Didomi ACM Export Format**: Contact [support@didomi.io](mailto:support@didomi.io)
- **This Script**: This is a helper script provided as-is with no active support or maintenance
