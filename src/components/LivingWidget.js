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
      {/* Üst Başlık ve Aksiyon Rozetleri */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {isWaterTheme ? '🌱 Yasayan Çiçek' : '🧸 Şifa Maskotu'}
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

      {/* Alt Hızlı Aksiyon (Kanıt Ekle / Sula) */}
      {onQuickWater && (
        <TouchableOpacity
          style={styles.quickWaterBtn}
          onPress={onQuickWater}
          activeOpacity={0.8}
        >
          <Text style={styles.quickWaterText}>
            {isWaterTheme
              ? '⭐📸 su iç ve büyüt'
              : '⭐📸 ilaç al ve iyileştir'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#7ED957',
    borderRadius: 28,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  tierBadge: {
    backgroundColor: '#A8F368',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  shareToggleBtn: {
    backgroundColor: '#A8F368',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  shareToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  shopButton: {
    backgroundColor: '#A8F368',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  quickWaterBtn: {
    marginTop: 10,
    backgroundColor: '#FFD166',
    borderRadius: 9999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  quickWaterText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF8500',
    letterSpacing: 0.3,
  },
});
