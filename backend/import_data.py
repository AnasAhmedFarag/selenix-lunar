"""Import supplied CSV Sun/Earth/LOLA data to SQLite, preserving saved analyses.

Usage:
  python -m backend.import_data
  python -m backend.import_data --force  # only after taking a DB backup
"""
import argparse
import json
from pathlib import Path
from .database import DB_PATH, import_sources, dataset_info


def main() -> None:
    parser = argparse.ArgumentParser(description='Import NASA-source lunar observations into SIGHTLINE SQLite')
    parser.add_argument('--force', action='store_true', help='Reimport changed CSVs; clears derived result cache, retains saved records')
    args = parser.parse_args()
    if args.force and DB_PATH.exists():
        backup = DB_PATH.with_name(f'{DB_PATH.stem}.before-reimport.sqlite3')
        import shutil
        shutil.copy2(DB_PATH, backup)
        print(f'Backup before reimport: {backup}')
    result = import_sources(force=args.force)
    print('Import result:', json.dumps(result, indent=2))
    print('Database status:', json.dumps(dataset_info(), indent=2))


if __name__ == '__main__':
    main()
