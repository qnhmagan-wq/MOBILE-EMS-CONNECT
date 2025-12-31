import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useIncomingCall } from '@/src/contexts/IncomingCallContext';

export const IncomingCallDebugOverlay = () => {
  const { incomingCall, callState, isPolling, error } = useIncomingCall();
  const [logs, setLogs] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Log state changes
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      `[${timestamp}] Polling: ${isPolling}, State: ${callState}, HasCall: ${!!incomingCall}`,
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  }, [isPolling, callState, incomingCall]);

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.minimized}
        onPress={() => setIsExpanded(true)}
      >
        <Text style={styles.minimizedText}>
          🐛 Debug: {callState} | {isPolling ? '🔄' : '⏸️'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐛 Incoming Call Debug</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Text style={styles.minimizeButton}>−</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={styles.label}>Polling:</Text>
          <Text style={[styles.value, isPolling && styles.active]}>
            {isPolling ? '✅ ACTIVE' : '❌ STOPPED'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.label}>Call State:</Text>
          <Text style={styles.value}>{callState.toUpperCase()}</Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.label}>Has Call:</Text>
          <Text style={[styles.value, incomingCall && styles.active]}>
            {incomingCall ? `✅ ID: ${incomingCall.id}` : '❌ NO'}
          </Text>
        </View>

        {incomingCall && (
          <View style={styles.statusItem}>
            <Text style={styles.label}>Caller:</Text>
            <Text style={styles.value}>{incomingCall.admin_caller.name}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.statusItem, styles.errorItem]}>
            <Text style={styles.label}>Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Recent Activity:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
    zIndex: 9999,
    maxHeight: '60%',
  },
  minimized: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 9999,
  },
  minimizedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  minimizeButton: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  statusGrid: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  active: {
    color: '#4ADE80',
  },
  errorItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  logsContainer: {
    marginTop: 12,
    maxHeight: 150,
  },
  logsTitle: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logsScroll: {
    maxHeight: 120,
  },
  logText: {
    color: '#CCC',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
