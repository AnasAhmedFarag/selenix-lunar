"""SQLite integration tests; run: python -m unittest backend.test_database -v"""
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from . import database
from .main import app, compare


class SQLiteTests(unittest.TestCase):
    def test_import_and_source_counts_are_idempotent(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'unit.sqlite3'
            first = database.import_sources(path)
            self.assertTrue(first['imported'])
            self.assertEqual(first['observations'], 8064)
            second = database.import_sources(path)
            self.assertFalse(second['imported'])
            details = database.dataset_info(path)
            self.assertEqual(details['counts']['sites'], 4)
            self.assertEqual(details['counts']['horizon_samples'], 144)
            sun, earth, horizons = database.read_data(path)
            self.assertEqual(len(sun['haworth']), 2016)
            self.assertEqual(len(earth['gerlache']), 2016)
            self.assertEqual(len(horizons['malapert']), 36)

    def test_persisted_api_save_read_delete_and_cache(self):
        with TestClient(app) as client:
            before = client.get('/api/database/status').json()
            result = client.get('/api/compare?start=2028-09-01T00:00:00Z&days=7')
            self.assertEqual(result.status_code, 200)
            compare_record = next(s for s in result.json()['sites'] if s['id']=='gerlache')
            saved = client.post('/api/saved-analyses', json={
                'title': 'Sep Gerlache','siteId':'gerlache','startDate':'2028-09-01','days':7})
            self.assertEqual(saved.status_code, 201, saved.text)
            record = saved.json()
            try:
                self.assertEqual(record['solar_percent'], compare_record['solar'])
                self.assertEqual(record['earth_percent'], compare_record['earth'])
                self.assertIn(record, client.get('/api/saved-analyses').json()['items'])
                self.assertEqual(client.get(f'/api/saved-analyses/{record["id"]}').json()['id'], record['id'])
                after = client.get('/api/database/status').json()
                self.assertGreaterEqual(after['counts']['analysis_cache'], before['counts']['analysis_cache'])
                self.assertEqual(client.post('/api/saved-analyses',json={
                    'title':'invalid','siteId':'gerlache','startDate':'2028-09-08','days':1}).status_code, 422)
            finally:
                self.assertEqual(client.delete(f'/api/saved-analyses/{record["id"]}').status_code, 200)
                self.assertEqual(client.get(f'/api/saved-analyses/{record["id"]}').status_code, 404)


if __name__ == '__main__':
    unittest.main()
