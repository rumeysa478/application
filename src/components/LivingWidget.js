import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { getWidgetStage } from '../data/widgetThemes';

export default function LivingWidget({
  activeWidgetId = 'flower_tier_1',
  healthPercent = 50,
  onOpenShop,
  onQuickWater,
}) {
  const { tier, stage, healthPercent: percent } = getWidgetStage(
    activeWidgetId,
    healthPercent
  );

  return (
    <View style={styles.card}>
      {/* Üst Başlık ve Pazar Butonu */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {tier.themeType === 'water' ? '🌱 Yaşayan Çiçek' : '🧸 Şifa Maskotu'}
          </Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tier.name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.shopButton}
          onPress={onOpenShop}
          activeOpacity={0.7}
        >
          <Text style={styles.shopButtonText}>🪴 Maskot Pazarı</Text>
        </TouchableOpacity>
      </View>

      {/* Widget Gövdesi: Büyük İkon ve Durum */}
      <View style={styles.bodyRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarIcon}>{stage.icon}</Text>
        </View>

        <View style={styles.statusInfo}>
          <View style={styles.stageLabelRow}>
            <Text style={styles.stageLabel}>{stage.label}</Text>
            <Text style={styles.percentText}>%{percent}</Text>
          </View>

          {/* İlerleme / Can Barı */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percent}%` },
                tier.themeType === 'water'
                  ? styles.waterFill
                  : styles.healthFill,
              ]}
            />
          </View>

          <Text style={styles.statusDescription} numberOfLines={2}>
            {stage.status}
          </Text>
        </View>
      </View>

      {/* Alt Hızlı Aksiyon */}
      {onQuickWater && (
        <TouchableOpacity
          style={styles.quickWaterBtn}
          onPress={onQuickWater}
          activeOpacity={0.8}
        >
          <Text style={styles.quickWaterText}>
            {tier.themeType === 'water'
              ? '💧 Sula & Büyüt (Kanıt Ekle)'
              : '💊 Şifa Ver & İyileştir (Kanıt Ekle)'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    marginBottom: 12,
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
  shopButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 34,
  },
  statusInfo: {
    flex: 1,
  },
  stageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterFill: {
    backgroundColor: '#3B82F6',
  },
  healthFill: {
    backgroundColor: '#EC4899',
  },
  statusDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  quickWaterBtn: {
    marginTop: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickWaterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});
