import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WIDGET_THEMES } from '../data/widgetThemes';
import {
  getUserProfile,
  unlockWidget,
  setActiveWidget,
} from '../services/userService';

export default function WidgetShopScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const p = await getUserProfile();
      setProfile(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectOrUnlock = async (tier) => {
    const isUnlocked =
      tier.cost === 0 || (profile?.unlockedWidgets || []).includes(tier.id);
    const isActive = profile?.activeWidgetId === tier.id;

    if (isActive) return;

    if (isUnlocked) {
      const updated = await setActiveWidget(tier.id);
      setProfile(updated);
      Alert.alert('Başarılı', `"${tier.name}" aktif widget olarak ayarlandı!`);
    } else {
      Alert.alert(
        'Widget Kilidi Aç',
        `"${tier.name}" için ${tier.cost} puan harcamak istiyor musunuz? (Mevcut Puanınız: ${profile?.totalScore || 0})`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Kilidi Aç',
            onPress: async () => {
              try {
                const updated = await unlockWidget(tier.id, tier.cost);
                setProfile(updated);
                Alert.alert(
                  '🎉 Tebrikler!',
                  `"${tier.name}" kilidi açıldı ve aktif yapıldı!`
                );
              } catch (e) {
                Alert.alert('İşlem Başarısız', e.message);
              }
            },
          },
        ]
      );
    }
  };

  const renderTierCard = ({ item }) => {
    const isUnlocked =
      item.cost === 0 || (profile?.unlockedWidgets || []).includes(item.id);
    const isActive = profile?.activeWidgetId === item.id;

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <Text style={styles.tierName}>{item.name}</Text>
            <Text style={styles.tierType}>
              {item.themeType === 'water' ? '💧 Çiçek Sulama' : '🧸 Şifa Maskotu'}
            </Text>
          </View>

          {item.cost > 0 && !isUnlocked && (
            <View style={styles.costBadge}>
              <Text style={styles.costText}>🪙 {item.cost} Puan</Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{item.description}</Text>

        {/* Evreler Önizleme Şeridi */}
        <View style={styles.stagesStrip}>
          {item.stages.map((stage, idx) => (
            <View key={idx} style={styles.stagePreviewItem}>
              <Text style={styles.stageIcon}>{stage.icon}</Text>
              <Text style={styles.stageName} numberOfLines={1}>
                {stage.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Eylem Butonu */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isActive && styles.activeBtn,
            !isUnlocked && styles.unlockBtn,
          ]}
          onPress={() => handleSelectOrUnlock(item)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionBtnText,
              isActive && styles.activeBtnText,
              !isUnlocked && styles.unlockBtnText,
            ]}
          >
            {isActive
              ? '✓ Şu An Aktif'
              : isUnlocked
              ? 'Bu Maskotu Seç'
              : `🔓 ${item.cost} Puanla Kilidi Aç`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Üst Bakiye Başlığı */}
      <View style={styles.balanceHeader}>
        <View>
          <Text style={styles.balanceLabel}>Toplam Puanınız</Text>
          <Text style={styles.balanceAmount}>🪙 {profile?.totalScore || 0} Puan</Text>
        </View>
        <Text style={styles.balanceHint}>
          Doğrulanan her kanıt ve yarışma ile puan kazanırsınız.
        </Text>
      </View>

      <FlatList
        data={WIDGET_THEMES}
        keyExtractor={(item) => item.id}
        renderItem={renderTierCard}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  balanceHeader: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceHint: {
    color: '#E0E7FF',
    fontSize: 11,
    maxWidth: 160,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardActive: {
    borderColor: '#00C2CB',
    borderWidth: 2.5,
    backgroundColor: '#F0FDFA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleGroup: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  tierType: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00C2CB',
    marginTop: 2,
  },
  costBadge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  costText: {
    color: '#FF8500',
    fontSize: 12,
    fontWeight: '900',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  stagesStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 10,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  stagePreviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  stageName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: '#FFD166',
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FF8500',
    fontSize: 14,
    fontWeight: '900',
  },
  activeBtn: {
    backgroundColor: '#7ED957',
  },
  activeBtnText: {
    color: '#000000',
    fontWeight: '900',
  },
  unlockBtn: {
    backgroundColor: '#FFD166',
  },
  unlockBtnText: {
    color: '#FF8500',
    fontWeight: '900',
  },
});
