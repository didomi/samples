#!/usr/bin/env python3
"""
New → Old CSV Converter for Didomi ACM Data Export

Usage:
    python convert_new_to_old.py --trackers tracker1.csv [tracker2.csv ...] --vendors vendor1.csv [vendor2.csv ...] [--output output.csv]

Flags:
    --trackers: One or more tracker CSV files
    --vendors: One or more vendor CSV files
    --output: (Optional) Output CSV path

If output is omitted, the script saves: <first_trackers_file>_converted.csv
"""

import sys
import json
import os
import pandas as pd
from pandas import json_normalize


# ============================================================
# Helper functions
# ============================================================

def validate_file(file_path, file_type):
    """Validate that a file exists and is readable."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ {file_type} file not found: {file_path}")
    if not os.path.isfile(file_path):
        raise ValueError(f"❌ {file_type} path is not a file: {file_path}")
    return True


def safe_json_load(val):
    """Safely parse JSON or return None."""
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return json.loads(val)
    except Exception:
        return None


def extract_vendor_info(value):
    """Return (vendor_name, vendor_id)."""
    parsed = safe_json_load(value)
    if isinstance(parsed, dict):
        return parsed.get("name"), parsed.get("id")
    return None, None


# ============================================================
# Main converter
# ============================================================

def load_csv_with_validation(file_path, file_type):
    """Load CSV file with proper error handling and validation."""
    try:
        df = pd.read_csv(file_path)
        if df.empty:
            raise ValueError(f"❌ {file_type} file is empty")
        print(f"✓ Loaded {len(df):,} rows from {file_type} file")
        return df
    except pd.errors.EmptyDataError:
        raise ValueError(f"❌ {file_type} file is empty or invalid")
    except pd.errors.ParserError as e:
        raise ValueError(f"❌ Failed to parse {file_type} CSV: {e}")


def main(trackers_paths, vendors_paths, output_path):

    print(f"\n📂 Loading {len(trackers_paths)} tracker file(s):")
    for path in trackers_paths:
        print(f"   - {path}")
    print(f"📂 Loading {len(vendors_paths)} vendor file(s):")
    for path in vendors_paths:
        print(f"   - {path}")
    print()

    # Validate files exist
    for trackers_path in trackers_paths:
        validate_file(trackers_path, "Trackers")
    for vendors_path in vendors_paths:
        validate_file(vendors_path, "Vendors")

    # Load and combine tracker CSVs
    tracker_dfs = []
    for trackers_path in trackers_paths:
        df = load_csv_with_validation(trackers_path, "Trackers")
        tracker_dfs.append(df)

    if len(tracker_dfs) > 1:
        print(f"🔗 Combining {len(tracker_dfs)} tracker files...")
        tracker_df = pd.concat(tracker_dfs, ignore_index=True)
        print(f"   Combined total: {len(tracker_df):,} rows")
    else:
        tracker_df = tracker_dfs[0]

    # Load and combine vendor CSVs
    vendor_dfs = []
    for vendors_path in vendors_paths:
        df = load_csv_with_validation(vendors_path, "Vendors")
        vendor_dfs.append(df)

    if len(vendor_dfs) > 1:
        print(f"🔗 Combining {len(vendor_dfs)} vendor files...")
        vendor_df = pd.concat(vendor_dfs, ignore_index=True)
        print(f"   Combined total: {len(vendor_df):,} rows")
    else:
        vendor_df = vendor_dfs[0]

    # ============================================================
    # 1) Flatten Initiator JSON
    # ============================================================
    print("⚙  Processing Initiator data...")
    if "Initiator" in tracker_df.columns:
        mask = tracker_df["Initiator"].notna()
        if mask.any():
            parsed = tracker_df.loc[mask, "Initiator"].apply(safe_json_load)
            flat = json_normalize(parsed)

            rename_map = {
                "url": "initiator_url",
                "url_host": "initiator_url_host",
                "url_sld": "initiator_url_sld",
                "type": "initiator_type",
                "vendor.id": "initiator_vendor_id",
            }

            # Rename columns efficiently (all at once)
            cols_to_rename = {old: new for old, new in rename_map.items() if old in flat.columns}
            flat = flat.rename(columns=cols_to_rename)

            # Assign all renamed columns at once
            for new_col in flat.columns:
                if new_col in rename_map.values():
                    tracker_df.loc[mask, new_col] = flat[new_col].values

    # ============================================================
    # 2) Flatten Cmp JSON
    # ============================================================
    print("⚙  Processing CMP data...")
    tracker_df["cmp_scenario_id"] = None

    if "Cmp" in tracker_df.columns:
        mask = tracker_df["Cmp"].notna()
        if mask.any():
            parsed = tracker_df.loc[mask, "Cmp"].apply(safe_json_load)
            flat = json_normalize(parsed)

            if "scenario.id" in flat.columns:
                tracker_df.loc[mask, "cmp_scenario_id"] = flat["scenario.id"].values

    # ============================================================
    # 3) Flatten Vendor JSON (from vendors CSV)
    # ============================================================
    print("⚙  Processing Vendor data...")
    if "Partner" in vendor_df.columns:
        mask = vendor_df["Partner"].notna()
        if mask.any():
            parsed_vendor = vendor_df.loc[mask, "Partner"].apply(safe_json_load)
            flat = json_normalize(parsed_vendor)
            flat.columns = [f"vendor.{c}" for c in flat.columns]
            vendor_df = vendor_df.join(flat)

    vendor_df["vendor.id"] = vendor_df.get("vendor.id", vendor_df.get("id"))
    vendor_df["vendor.country"] = vendor_df.get("vendor.country")

    # Build lookup: vendor.id → country
    country_lookup = (
        vendor_df.set_index("vendor.id")["vendor.country"]
        .dropna()
        .to_dict()
    )

    # ============================================================
    # 4) Resolve Initiator Country using initiator.vendor.id
    # ============================================================
    print("⚙  Resolving initiator countries...")
    if "initiator_vendor_id" in tracker_df.columns:
        tracker_df["Initiator Country"] = tracker_df["initiator_vendor_id"].map(country_lookup)
    else:
        tracker_df["Initiator Country"] = None

    # ============================================================
    # 5) Vendor name extraction (optimized)
    # ============================================================
    print("⚙  Extracting vendor information...")
    if "Vendor" in tracker_df.columns:
        # Extract vendor info more efficiently using zip
        vendor_info = tracker_df["Vendor"].apply(extract_vendor_info)
        tracker_df["vendor_name"], tracker_df["vendor_id"] = zip(*vendor_info)

        # Use vectorized operation for vendor output
        tracker_df["Vendor_out"] = tracker_df["vendor_name"].fillna("")
        mask = tracker_df["Vendor_out"].str.strip() == ""
        tracker_df.loc[mask, "Vendor_out"] = tracker_df.loc[mask, "Host"]
    else:
        tracker_df["vendor_name"] = None
        tracker_df["vendor_id"] = None
        tracker_df["Vendor_out"] = tracker_df.get("Host")

    # ============================================================
    # 6) Build final OLD-format output
    # ============================================================
    print("⚙  Building output format...")
    output = pd.DataFrame({
        "property_id":        tracker_df.get("Property Id"),
        "collect_id":         tracker_df.get("Collect Id"),
        "page_url":           tracker_df.get("Page Url"),
        "date":               tracker_df.get("Created At"),
        "initiator_url":      tracker_df.get("initiator_url"),
        "initiator_url_host": tracker_df.get("initiator_url_host"),
        "initiator_url_sld":  tracker_df.get("initiator_url_sld"),
        "initiator_type":     tracker_df.get("initiator_type"),
        "Initiator Country":  tracker_df.get("Initiator Country"),
        "Domain":             tracker_df.get("Page Url Host"),
        "tracker_type":       tracker_df.get("Type"),
        "initial_name":       tracker_df.get("Initial Name"),
        "name_pattern":       tracker_df.get("Name Pattern"),
        "name":               tracker_df.get("Name"),
        "lifetime_seconds":   tracker_df.get("Lifetime Seconds"),
        "is_persistent":      tracker_df.get("Is Persistent"),
        "is_third_party":     tracker_df.get("Is Third Party"),
        "cmp_scenario_id":    tracker_df.get("cmp_scenario_id"),
        "cookie_domain":      tracker_df.get("Host"),
        "Vendor":             tracker_df.get("Vendor_out"),
    })

    final_cols = [
        "property_id", "collect_id", "page_url", "date",
        "initiator_url", "initiator_url_host", "initiator_url_sld", "initiator_type",
        "Initiator Country", "Domain", "tracker_type", "initial_name", "name_pattern", "name",
        "lifetime_seconds", "is_persistent", "is_third_party", "cmp_scenario_id", "cookie_domain", "Vendor"
    ]

    output = output[final_cols]

    # ============================================================
    # 7) Save file
    # ============================================================
    print(f"💾 Saving output to: {output_path}")
    output.to_csv(output_path, index=False, encoding="utf-8")

    print(f"\n✅ Conversion complete!")
    print(f"   Input:  {len(tracker_df):,} tracker rows")
    print(f"   Output: {len(output):,} rows saved to {output_path}")

# ============================================================
# Script entry point
# ============================================================

def parse_arguments():
    """Parse command line arguments with flag-based syntax."""
    args = sys.argv[1:]

    if len(args) == 0 or "--help" in args or "-h" in args:
        print("❌ Usage:")
        print("  python convert_new_to_old.py --trackers <file1.csv> [file2.csv ...] --vendors <file1.csv> [file2.csv ...] [--output <output.csv>]")
        print("\nFlags:")
        print("  --trackers, -t : One or more tracker CSV files")
        print("  --vendors, -v  : One or more vendor CSV files")
        print("  --output, -o   : (Optional) Output CSV path")
        print("\nDescription:")
        print("  Converts Didomi ACM tracker data from new format to old format.")
        print("  - Provide one or more tracker CSV files after --trackers")
        print("  - Provide one or more vendor CSV files after --vendors")
        print("  - Optionally specify output path with --output")
        print("  - If output is not specified, creates <first_tracker>_converted.csv")
        print("\nExamples:")
        print("  python convert_new_to_old.py --trackers trackers.csv --vendors vendors.csv")
        print("  python convert_new_to_old.py -t t1.csv t2.csv -v v1.csv v2.csv -o output.csv")
        print("  python convert_new_to_old.py --trackers data/t*.csv --vendors vendors.csv --output combined.csv")
        sys.exit(1)

    trackers_paths = []
    vendors_paths = []
    output_path = None

    current_flag = None
    i = 0

    while i < len(args):
        arg = args[i]

        if arg in ("--trackers", "-t"):
            current_flag = "trackers"
            i += 1
            continue
        elif arg in ("--vendors", "-v"):
            current_flag = "vendors"
            i += 1
            continue
        elif arg in ("--output", "-o"):
            current_flag = "output"
            i += 1
            continue

        # It's a file path
        if current_flag == "trackers":
            trackers_paths.append(arg)
        elif current_flag == "vendors":
            vendors_paths.append(arg)
        elif current_flag == "output":
            output_path = arg
            current_flag = None  # Only one output file
        else:
            print(f"❌ Error: Unexpected argument '{arg}'. Use --trackers, --vendors, or --output flags.")
            sys.exit(1)

        i += 1

    # Validate we have required arguments
    if len(trackers_paths) == 0:
        print("❌ Error: At least one tracker CSV file is required (use --trackers)")
        sys.exit(1)

    if len(vendors_paths) == 0:
        print("❌ Error: At least one vendor CSV file is required (use --vendors)")
        sys.exit(1)

    # Auto-generate output name if not provided
    if output_path is None:
        base = trackers_paths[0].rsplit(".", 1)[0]
        output_path = f"{base}_converted.csv"

    return trackers_paths, vendors_paths, output_path


if __name__ == "__main__":
    try:
        trackers_paths, vendors_paths, output_path = parse_arguments()
        main(trackers_paths, vendors_paths, output_path)
    except FileNotFoundError as e:
        print(f"\n{e}")
        sys.exit(1)
    except ValueError as e:
        print(f"\n{e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
