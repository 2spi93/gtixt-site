#!/usr/bin/env python3
"""Validate all locale JSON files for syntax errors."""

import json
import os
import sys

locales_dir = "/opt/gpti/gpti-site/public/locales"
languages = ["en", "fr", "es", "de", "pt", "it"]

total_errors = 0

for lang in languages:
    file_path = os.path.join(locales_dir, lang, "common.json")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            json.load(f)
        print(f"✅ {lang}/common.json - Valid JSON")
    except json.JSONDecodeError as e:
        print(f"❌ {lang}/common.json - JSON Error: {e}")
        total_errors += 1
    except FileNotFoundError:
        print(f"⚠️  {lang}/common.json - File not found")
        total_errors += 1

print(f"\n📊 Validation Summary:")
print(f"   Total errors: {total_errors}")

if total_errors == 0:
    print("\n✅ All locale files are valid JSON!")
    sys.exit(0)
else:
    print(f"\n❌ {total_errors} file(s) have errors")
    sys.exit(1)
