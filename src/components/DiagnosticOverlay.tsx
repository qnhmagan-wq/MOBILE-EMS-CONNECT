/**
 * DiagnosticOverlay
 *
 * Field-test overlay pinned to the top-right. Rendered only when both
 * `ENV.DIAG_TOGGLE_ENABLED` and the persisted visibility flag are true.
 * Tests verify auto-arrival end-to-end from the device without having to
 * pull server logs: ping freshness + accuracy, live server distance, the
 * exact moment auto_arrived fires, and the most recent error.
 */

import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import ENV from '@/src/config/env';
import {
  useDiagnosticsSnapshot,
  useOverlayVisible,
} from '@/src/services/diagnostics.service';

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;

const formatSecondsAgo = (ts: number | null): string => {
  if (ts == null) return '—';
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 1) return 'just now';
  return `${seconds}s ago`;
};

const formatTime = (ts: number | null): string => {
  if (ts == null) return '—';
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const DiagnosticOverlay: React.FC = () => {
  const visible = useOverlayVisible();
  const snap = useDiagnosticsSnapshot();

  // Tick once a second so "Xs ago" stays current even when no ping fires.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  if (!ENV.DIAG_TOGGLE_ENABLED || !visible) return null;

  const pingStatusLabel = (() => {
    if (!snap.lastPingStatus) return '—';
    if (snap.lastPingStatus === 'OK') return 'OK';
    if (snap.lastPingStatus === 'HTTP') return String(snap.lastPingHttpCode ?? 'ERR');
    return 'NET';
  })();

  const pingStatusColor = (() => {
    if (!snap.lastPingStatus) return '#9CA3AF';
    if (snap.lastPingStatus === 'OK') return '#10B981';
    return '#EF4444';
  })();

  const accPresent = snap.lastPingAccuracyPresent ? '✓' : '✗';
  const accPresentColor = snap.lastPingAccuracyPresent ? '#10B981' : '#EF4444';
  const accValue =
    snap.lastPingAccuracy != null ? `${snap.lastPingAccuracy.toFixed(1)} m` : '—';

  const dispatchLabel =
    snap.dispatchId != null
      ? `#${snap.dispatchId} ${snap.dispatchStatus ?? '?'}`
      : '—';

  const distLabel =
    snap.serverDistanceMeters != null
      ? `${snap.serverDistanceMeters.toFixed(1)} m`
      : '—';

  const etaLabel = snap.etaSeconds != null ? `${Math.round(snap.etaSeconds)} s` : '—';

  const autoArrived = snap.autoArrivedAt != null;
  const autoArrivedLabel = autoArrived
    ? `YES @ ${formatTime(snap.autoArrivedAt)}`
    : '—';

  const lastErrLabel = snap.lastErrorShort
    ? `${snap.lastErrorShort} at ${formatTime(snap.lastErrorAt)}`
    : 'none';

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>EMS DIAG</Text>
        </View>
        <Row label="Ping">
          <Text style={styles.value}>
            {formatSecondsAgo(snap.lastPingAt)}
            <Text style={styles.dim}>  ·  </Text>
            <Text style={[styles.value, { color: pingStatusColor }]}>
              {pingStatusLabel}
            </Text>
          </Text>
        </Row>
        <Row label="Acc">
          <Text style={styles.value}>
            {accValue}
            <Text style={styles.dim}>  (present: </Text>
            <Text style={[styles.value, { color: accPresentColor }]}>
              {accPresent}
            </Text>
            <Text style={styles.dim}>)</Text>
          </Text>
        </Row>
        <Row label="Dispatch">
          <Text style={styles.value}>{dispatchLabel}</Text>
        </Row>
        <Row label="Dist (server)">
          <Text style={styles.value}>{distLabel}</Text>
        </Row>
        <Row label="ETA">
          <Text style={styles.value}>{etaLabel}</Text>
        </Row>
        <Row label="Auto-arrived">
          <Text style={[styles.value, autoArrived && styles.autoArrivedValue]}>
            {autoArrivedLabel}
          </Text>
        </Row>
        <Row label="Last err">
          <Text style={[styles.value, snap.lastErrorShort ? styles.errValue : null]}>
            {lastErrLabel}
          </Text>
        </Row>
      </View>
    </View>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: Platform.OS === 'android' ? ANDROID_STATUS_BAR + 4 : 48,
    right: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 220,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 4,
    marginBottom: 6,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    width: 92,
  },
  value: {
    color: '#F9FAFB',
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    flex: 1,
    flexWrap: 'wrap',
  },
  dim: {
    color: '#6B7280',
  },
  autoArrivedValue: {
    color: '#10B981',
    fontWeight: '700',
  },
  errValue: {
    color: '#F87171',
  },
});
