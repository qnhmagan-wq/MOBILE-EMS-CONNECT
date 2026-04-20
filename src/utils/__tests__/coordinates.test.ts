/**
 * Tests for `applyJitterForOverlaps`.
 *
 * Regression context: the red incident pin vanished from route-map when
 * the jitter helper shipped, and the triage playbook in HANDOFF-2026-04-21
 * calls out "helper filtering the incident marker" as the first suspect.
 * These tests lock in the length + identity invariants so any future
 * implementation change that drops or reorders elements fails CI before
 * it ever reaches a responder's device.
 *
 * Execution: the project does not yet have a Jest runner wired in. Add
 * `jest-expo` (Expo's preset) to devDependencies and a `"test": "jest"`
 * script to run this file; the assertions use only standard Jest globals.
 */

import { applyJitterForOverlaps } from '../coordinates';

type Marker = { id: number; latitude: number; longitude: number; meta?: string };

describe('applyJitterForOverlaps', () => {
  describe('length + identity invariants', () => {
    it('returns an empty array unchanged', () => {
      expect(applyJitterForOverlaps<Marker>([])).toEqual([]);
    });

    it('returns a single-item array unchanged (no grouping possible)', () => {
      const items: Marker[] = [{ id: 1, latitude: 14.6, longitude: 120.98 }];
      expect(applyJitterForOverlaps(items)).toEqual(items);
    });

    it('preserves input length when coords are all distinct', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.61, longitude: 120.99 },
        { id: 3, latitude: 14.62, longitude: 121.0 },
      ];
      expect(applyJitterForOverlaps(items)).toHaveLength(items.length);
    });

    it('preserves input length when coords are all identical', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.6, longitude: 120.98 },
        { id: 3, latitude: 14.6, longitude: 120.98 },
      ];
      expect(applyJitterForOverlaps(items)).toHaveLength(items.length);
    });

    it('preserves input order (map → same indices)', () => {
      const items: Marker[] = [
        { id: 7, latitude: 14.6, longitude: 120.98, meta: 'a' },
        { id: 4, latitude: 14.6, longitude: 120.98, meta: 'b' },
        { id: 9, latitude: 14.6, longitude: 120.98, meta: 'c' },
      ];
      const out = applyJitterForOverlaps(items);
      expect(out.map((m) => m.id)).toEqual([7, 4, 9]);
      expect(out.map((m) => m.meta)).toEqual(['a', 'b', 'c']);
    });

    it('never filters — length invariant holds under randomised inputs', () => {
      for (let trial = 0; trial < 20; trial += 1) {
        const n = (trial % 7) + 1;
        const items: Marker[] = Array.from({ length: n }, (_, i) => ({
          id: i,
          // half of each batch share coords, other half are unique
          latitude: i < Math.ceil(n / 2) ? 14.6 : 14.6 + i * 0.01,
          longitude: i < Math.ceil(n / 2) ? 120.98 : 120.98 + i * 0.01,
        }));
        const out = applyJitterForOverlaps(items);
        expect(out).toHaveLength(items.length);
      }
    });
  });

  describe('offset behaviour', () => {
    it('does not move unique-coordinate markers', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.61, longitude: 120.99 },
      ];
      const out = applyJitterForOverlaps(items);
      expect(out[0]).toEqual(items[0]);
      expect(out[1]).toEqual(items[1]);
    });

    it('offsets markers that share identical coordinates', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.6, longitude: 120.98 },
      ];
      const out = applyJitterForOverlaps(items);

      // Both still present, neither sits on the original coordinate.
      expect(out).toHaveLength(2);
      const moved0 =
        out[0].latitude !== items[0].latitude ||
        out[0].longitude !== items[0].longitude;
      const moved1 =
        out[1].latitude !== items[1].latitude ||
        out[1].longitude !== items[1].longitude;
      expect(moved0).toBe(true);
      expect(moved1).toBe(true);
    });

    it('separates overlapping markers by roughly 6 metres (~5.4e-5 degrees)', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.6, longitude: 120.98 },
      ];
      const [a, b] = applyJitterForOverlaps(items);

      // Haversine overkill for this scale; use a flat-earth approximation
      // since the two points are within ~10 m.
      const metersPerLatDegree = 111_111;
      const dLat = (a.latitude - b.latitude) * metersPerLatDegree;
      const cosLat = Math.cos((14.6 * Math.PI) / 180);
      const dLon = (a.longitude - b.longitude) * metersPerLatDegree * cosLat;
      const separation = Math.sqrt(dLat * dLat + dLon * dLon);

      // Jitter places a 2-item group on opposite sides of a 6 m ring → 12 m apart.
      expect(separation).toBeGreaterThan(8);
      expect(separation).toBeLessThan(16);
    });

    it('is deterministic — same input produces same output across runs', () => {
      const items: Marker[] = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: 14.6, longitude: 120.98 },
        { id: 3, latitude: 14.6, longitude: 120.98 },
      ];
      const first = applyJitterForOverlaps(items);
      const second = applyJitterForOverlaps(items);
      expect(first).toEqual(second);
    });
  });

  describe('defensive handling of malformed inputs', () => {
    it('does not throw when an item has a non-numeric coord (Laravel DECIMAL as string)', () => {
      // Simulate a runtime-only shape mismatch with the declared type.
      const items = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: '14.6', longitude: '120.98' },
      ] as unknown as Marker[];
      expect(() => applyJitterForOverlaps(items)).not.toThrow();
    });

    it('passes through malformed items without dropping them', () => {
      const items = [
        { id: 1, latitude: 14.6, longitude: 120.98 },
        { id: 2, latitude: NaN, longitude: 120.98 },
        { id: 3, latitude: 14.6, longitude: null as unknown as number },
      ] as unknown as Marker[];
      const out = applyJitterForOverlaps(items);
      expect(out).toHaveLength(items.length);
      expect(out.map((m) => m.id)).toEqual([1, 2, 3]);
      // Malformed items are returned as-is — the original bad coord survives
      // so upstream validation (e.g. isValidCoordinate in route-map) still
      // fires instead of being masked by a silent jitter correction.
      expect(out[1].latitude).toBeNaN();
      expect(out[2].longitude).toBeNull();
    });
  });
});
