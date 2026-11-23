import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHabits, deleteHabit } from '../services/storage';

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Ekran her odaklandığında listeyi güncelle
  const loadHabits = useCallback(async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch (error) {
      console.error('Alışkanlıklar yüklenemedi:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const handleDelete = (id, title) => {
    Alert.alert(
      'Alışkanlığı Sil',
      `"${title}" alışkanlığını silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteHabit(id);
            setHabits(updated);
          },
        },
      ]
    );
  };

  const renderHabitCard = ({ item }) => {
    const maxSnooze = item.maxSnooze || 3;
    const currentSnooze = item.snoozeCount || 0;
    const remainingSnooze = Math.max(0, maxSnooze - currentSnooze);

    // Erteleme durumuna göre renk rozeti
    const snoozeBadgeColor =
      remainingSnooze === 0
        ? '#EF4444' // Kırmızı (Hak kalmadı!)
        : remainingSnooze === 1
        ? '#F59E0B' // Turuncu
        : '#10B981'; // Yeşil

    return (
      <View style={styles.card}>
        {/* Kart Başlığı ve Silme Butonu */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.intervalText}>
              ⏱️ Her {item.intervalMinutes} dakikada bir
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Bilgilendirme Rozetleri */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: snoozeBadgeColor + '20', borderColor: snoozeBadgeColor },
            ]}
          >
            <Text style={[styles.badgeText, { color: snoozeBadgeColor }]}>
              ⏳ Erteleme: {currentSnooze}/{maxSnooze} (Kalan: {remainingSnooze})
            </Text>
          </View>

          {item.isCompleted && (
            <View style={[styles.badge, styles.completedBadge]}>
              <Text style={styles.completedBadgeText}>✓ Tamamlandı</Text>
            </View>
          )}
        </View>

        {/* Görsel Aksiyon Butonları (Kamera & Erteleme aşaması için şablon) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.kanitlaButton]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                '📸 Kanıt Doğrulama',
                'Kamera ile kanıt doğrulama özelliği bir sonraki aşamada aktif olacaktır!'
              );
            }}
          >
            <Text style={styles.kanitlaButtonText}>📸 Kanıtla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.erteleButton]}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                '⏳ Erteleme (Snooze)',
                '30 dakikalık erteleme mekanizması bir sonraki aşamada bildirim servisiyle entegre edilecektir!'
              );
            }}
          >
            <Text style={styles.erteleButtonText}>⏳ Ertele (30 dk)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Alışkanlık Listesi */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyTitle}>Henüz alışkanlık eklemediniz</Text>
            <Text style={styles.emptySubtitle}>
              Su içme, ilaç alma veya egzersiz gibi rutinlerinizi eklemek için aşağıdaki "+" butonuna dokunun.
            </Text>
          </View>
        }
      />

      {/* Sağ alttaki Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddHabit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  intervalText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  completedBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kanitlaButton: {
    backgroundColor: '#4F46E5',
  },
  kanitlaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  erteleButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  erteleButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
  },
});
