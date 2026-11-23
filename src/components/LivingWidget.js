import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { getWidgetStage } from '../data/widgetThemes';
import PlantWidget from './widgets/PlantWidget';
import RecoveryWidget from './widgets/RecoveryWidget';

export default function LivingWidget({
  activeWidgetId = 'flower_tier_1',
  healthPercent = 50,
  progressPercent = 0,
  totalIntake = 0,
  targetIntake = 2.5,
  dosesToday = 0,
  targetDoses = 2,
  triggerReaction = false,
  onOpenShop,
  onQuickWater,
}) {
  const { tier, stage, healthPercent: percent } = getWidgetStage(
    activeWidgetId,
    healthPercent
  );

  const isWaterTheme = tier?.themeType === 'water';
  const [showShare, setShowShare] = useState(false);

  return (
    <View style={styles.card}>
      {/* Üst Başlık ve Pazar / Paylaşım Butonları */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {isWaterTheme ? '🌱 Yaşayan Çiçek' : '🧸 İyileşme Maskotu'}
          </Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tier.name}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.shareToggleBtn}
            onPress={() => setShowShare(!showShare)}
            activeOpacity={0.7}
          >
            <Text style={styles.shareToggleBtnText}>
              {showShare ? '✕ Kapat' : '📢 Paylaş'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={onOpenShop}
            activeOpacity={0.7}
          >
            <Text style={styles.shopButtonText}>🪴 Pazar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Özel Tasarım Canlı SVG Widget */}
      {isWaterTheme ? (
        <PlantWidget
          progressPercent={progressPercent}
          health={percent}
          totalIntake={totalIntake}
          targetIntake={targetIntake}
          showShareCard={showShare}
          triggerBounce={triggerReaction}
          onPress={onQuickWater}
        />
      ) : (
        <RecoveryWidget
          dosesToday={dosesToday}
          targetDoses={targetDoses}
          health={percent}
          showShareCard={showShare}
          triggerBounce={triggerReaction}
          onPress={onQuickWater}
        />
      )}

      {/* Alt Hızlı Aksiyon */}
      {onQuickWater && (
        <TouchableOpacity
          style={styles.quickWaterBtn}
          onPress={onQuickWater}
          activeOpacity={0.8}
        >
          <Text style={styles.quickWaterText}>
            {isWaterTheme
              ? '💧 Sula & Büyüt (Kanıt Ekle)'
              : '💊 Şifa Ver & İyileştir (Doz Ekle)'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  tierBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  shareToggleBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shareToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  shopButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickWaterBtn: {
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  quickWaterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});
