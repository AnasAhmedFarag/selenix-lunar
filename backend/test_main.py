"""Regression tests for supplied Sun+Earth+LOLA sampling; run: python -m unittest backend.test_main -v"""
import unittest
from datetime import datetime, timezone
from fastapi import HTTPException
from .main import compare, health, load_data, horizon_at, SITE_META


class VisibilityTests(unittest.TestCase):
    def test_all_site_source_tables_align(self):
        sun, earth, horizon = load_data()
        self.assertEqual(len(SITE_META), 4)
        for key in SITE_META:
            self.assertEqual(len(sun[key]), 2016)
            self.assertEqual(set(sun[key]), set(earth[key]))
            self.assertEqual(len(horizon[key]), 36)

    def test_health(self):
        info = health()
        self.assertTrue(info['earthVisibilityAvailable'])
        self.assertEqual(info['earthRecordsPerSite'], 2016)

    def test_joint_visibility_is_binary_intersection(self):
        result = compare(start=datetime(2028, 9, 1, tzinfo=timezone.utc), days=7, step_hours=1)
        self.assertTrue(result['earthDataAvailable'])
        for site in result['sites']:
            self.assertEqual(len(site['points']), 168)
            self.assertIsNone(site['score'])  # Not a mission suitability score.
            for p in site['points']:
                self.assertEqual(p['combinedVisible'], p['solarVisible'] and p['earthVisible'])
                self.assertIsNotNone(p['earthAzimuth'])
                self.assertIsNotNone(p['earthTerrainHorizon'])
            self.assertEqual(site['earth'], round(100*sum(p['earthVisible'] for p in site['points'])/168, 1))
            self.assertEqual(site['combined'], round(100*sum(p['combinedVisible'] for p in site['points'])/168, 1))
            self.assertLessEqual(site['combined'], min(site['solar'], site['earth']))

    def test_site_and_period_difference(self):
        jan = compare(start=datetime(2028, 1, 1, tzinfo=timezone.utc), days=7, step_hours=1)
        sep = compare(start=datetime(2028, 9, 1, tzinfo=timezone.utc), days=7, step_hours=1)
        j = {s['id']: s for s in jan['sites']}
        s = {s['id']: s for s in sep['sites']}
        self.assertEqual(j['haworth']['solar'], 0)
        self.assertEqual(s['gerlache']['combined'], 96.4)
        self.assertEqual(s['haworth']['earth'], 96.4)
        self.assertEqual(s['malapert']['combined'], 100)
        self.assertNotEqual(j['malapert']['combined'], s['malapert']['combined'])

    def test_selected_days_and_subsampling(self):
        r = compare(start=datetime(2028, 9, 3, tzinfo=timezone.utc), days=2, step_hours=2)
        self.assertEqual(len(r['sites'][0]['points']), 24)
        self.assertTrue(r['sites'][0]['points'][0]['time'].startswith('2028-09-03T'))
        self.assertTrue(r['sites'][0]['points'][-1]['time'].startswith('2028-09-04T'))

    def test_reject_missing_sun_earth_period(self):
        with self.assertRaises(HTTPException):
            compare(start=datetime(2028, 9, 8, tzinfo=timezone.utc), days=1, step_hours=1)

    def test_horizon_wrap(self):
        seq = list(range(36))
        self.assertEqual(horizon_at(0, seq), 0)
        self.assertAlmostEqual(horizon_at(355, seq), 17.5)
        self.assertAlmostEqual(horizon_at(360, seq), 0)


if __name__ == '__main__':
    unittest.main()
