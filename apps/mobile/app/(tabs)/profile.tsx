import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/providers/AuthProvider';
import { Button, LoadingSpinner } from '@/components';
import { APP_VERSION } from '@/constants/config';

type IconName = keyof typeof Ionicons.glyphMap;

interface SettingsItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, destructive = false }: SettingsItemProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.settingsIcon, destructive && styles.settingsIconDestructive]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? '#ff3b30' : '#000'}
        />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, destructive && styles.settingsTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name={'chevron-forward' as IconName} size={20} color="#ccc" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile
    Alert.alert('Coming Soon', 'Profile editing will be available soon.');
  };

  const handlePrivacy = () => {
    // TODO: Open privacy policy
    Alert.alert('Privacy Policy', 'Privacy policy coming soon.');
  };

  const handleTerms = () => {
    // TODO: Open terms of service
    Alert.alert('Terms of Service', 'Terms of service coming soon.');
  };

  const handleSupport = () => {
    // TODO: Open support email
    Alert.alert('Support', 'Contact support@snack.app for help.');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {user?.profile_picture_url ? (
          <Image
            source={{ uri: user.profile_picture_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <Text style={styles.username}>@{user?.username || 'user'}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          variant="outline"
          size="small"
          style={styles.editButton}
        />
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon={'person-outline' as IconName}
            title="Edit Profile"
            onPress={handleEditProfile}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon={'document-text-outline' as IconName}
            title="Privacy Policy"
            onPress={handlePrivacy}
          />
          <SettingsItem
            icon={'document-outline' as IconName}
            title="Terms of Service"
            onPress={handleTerms}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon={'help-circle-outline' as IconName}
            title="Help & Support"
            onPress={handleSupport}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon={'log-out-outline' as IconName}
            title="Sign Out"
            onPress={handleSignOut}
          />
          <SettingsItem
            icon={'trash-outline' as IconName}
            title="Delete Account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>
      </View>

      {/* App Version */}
      <Text style={styles.version}>Version {APP_VERSION}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#666',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  editButton: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  settingsItemPressed: {
    backgroundColor: '#f8f8f8',
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsIconDestructive: {
    backgroundColor: '#fff0f0',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: '#000',
  },
  settingsTitleDestructive: {
    color: '#ff3b30',
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  version: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});
