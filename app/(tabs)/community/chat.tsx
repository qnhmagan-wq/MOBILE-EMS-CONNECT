import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { useMessagePolling } from '@/src/hooks/useMessagePolling';
import { Message } from '@/src/types/message.types';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const { user } = useAuth();

  const {
    messages,
    isPolling,
    isSending,
    error,
    startPolling,
    stopPolling,
    sendMessage,
    markMessagesAsRead,
    clearError,
  } = useMessagePolling();

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [viewableMessageIds, setViewableMessageIds] = useState<Set<number>>(new Set());

  // Start polling on mount
  useEffect(() => {
    if (incidentId) {
      startPolling(incidentId);
    }

    return () => {
      stopPolling();
    };
  }, [incidentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessageIds = Array.from(viewableMessageIds).filter((id) => {
      const message = messages.find((m) => m.id === id);
      return message && !message.is_read && message.sender_id !== user?.id;
    });

    if (unreadMessageIds.length > 0) {
      markMessagesAsRead(unreadMessageIds);
    }
  }, [viewableMessageIds, messages, user]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const ids = new Set(viewableItems.map((item: any) => item.item.id));
    setViewableMessageIds(ids);
  }).current;

  const handleSend = async () => {
    if (!incidentId) return;
    if (!inputText.trim() && !selectedImage) return;

    try {
      await sendMessage(incidentId, inputText.trim() || undefined, selectedImage || undefined);
      setInputText('');
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Images must be under 5MB.');
        return;
      }

      setSelectedImage(asset.uri);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.messageImage} />
        )}

        {item.message && (
          <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
            {item.message}
          </Text>
        )}

        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (!incidentId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>Invalid incident ID</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
            <Text style={styles.backButtonErrorText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImage}>
            <Ionicons name="close-circle" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <Ionicons name="image" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator color={Colors.textWhite} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={Colors.textWhite} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  senderName: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.textWhite,
  },
  otherMessageText: {
    color: Colors.textPrimary,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  messageTime: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  imagePreview: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  removeImage: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imageButton: {
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.circle,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButtonError: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonErrorText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
