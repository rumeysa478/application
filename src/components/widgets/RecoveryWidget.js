import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Share,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

/**
 * İlaç/Sağlık Alışkanlığına Bağlı Yaşayan İyileşme Widget'ı (RecoveryWidget)
 *
 * @param {Object} props
 * @param {number} props.dosesToday - Bugün alınan doz sayısı
 * @param {number} props.targetDoses - Hedef doz sayısı (örn: 2)
 * @param {number} [props.health=75] - Maskot genel sağlık puanı
 * @param {boolean} [props.showShareCard=false] - Paylaşım kartı modu
 * @param {boolean} [props.triggerBounce=false] - Doz kanıtı anında tepki efekti
 * @param {Function} [props.onPress] - Dokunma eylemi
 */
export default function RecoveryWidget({
  dosesToday = 0,
  targetDoses = 2,
  health = 75,
  showShareCard = false,
  triggerBounce = false,
  onPress,
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const runReactionAnimation = () => {
    // 1. Işıltı ve iyileşme artısı efekti
    sparkleAnim.setValue(0);
    Animated.timing(sparkleAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();

    // 2. Karakter sevinç yaylanması
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.15,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (triggerBounce) {
      runReactionAnimation();
    }
  }, [triggerBounce]);

  const target = Math.max(1, Number(targetDoses) || 1);
  const current = Math.max(0, Number(dosesToday) || 0);
  const progressPercent = Math.min(100, Math.round((current / target) * 100));

  // Aşamalar:
  // Aşama 1: Dinlenen / Halsiz (0 doz)
  // Aşama 2: Güç Toplayan / İyileşen (ara dozlar)
  // Aşama 3: Tamamen İyileşmiş / Zinde & Enerjik (tüm dozlar tamamlandı)
  let stage = 1;
  let stageTitle = '🛌 Dinlenme Vakti';
  let stageDescription = 'İlaç dozunu alarak gücünü topla.';

  if (current >= target) {
    stage = 3;
    stageTitle = '🌟 Tamamen İyileşti!';
    stageDescription = 'Bugünün tüm dozları alındı, enerji zirvede!';
  } else if (current > 0) {
    stage = 2;
    stageTitle = '🩹 Güç Topluyor';
    stageDescription = 'İlaçlar etkisini gösteriyor, morali yüksek!';
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `💊 Habitime İyileşme Takibim: Bugün ${current}/${target} doz ilacımı aldım! Maskot Sağlığım: %${health} 🌟 Sen de sağlığını ihmal etme!`,
      });
    } catch (e) {
      console.warn('Paylaşım hatası:', e);
    }
  };

  const sparkleTranslateY = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          runReactionAnimation();
          if (onPress) onPress();
        }}
      >
        <Animated.View
          style={[
            styles.widgetCard,
            { transform: [{ scale: bounceAnim }] },
          ]}
        >
          {/* İyileşme Işıltısı Katmanı */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sparkleLayer,
              {
                opacity: sparkleOpacity,
                transform: [{ translateY: sparkleTranslateY }],
              },
            ]}
          >
            <Svg width="28" height="28" viewBox="0 0 28 28">
              {/* Yeşil İlk Yardım Artısı */}
              <Rect x="11" y="2" width="6" height="24" rx="2" fill="#10B981" />
              <Rect x="2" y="11" width="24" height="6" rx="2" fill="#10B981" />
            </Svg>
          </Animated.View>

          {/* SVG Karakter Görünümü */}
          <View style={styles.svgWrapper}>
            <Svg width="120" height="130" viewBox="0 0 120 130">
              <Defs>
                <LinearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FED7AA" />
                  <Stop offset="1" stopColor="#FDBA74" />
                </LinearGradient>

                <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#818CF8" />
                  <Stop offset="1" stopColor="#4F46E5" />
                </LinearGradient>

                <LinearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#E0E7FF" />
                  <Stop offset="1" stopColor="#C7D2FE" />
                </LinearGradient>
              </Defs>

              {/* AŞAMA 1: Yatakta Dinlenen Halsiz Maskot */}
              {stage === 1 && (
                <G>
                  {/* Yastık & Yatak */}
                  <Rect x="15" y="75" width="90" height="40" rx="8" fill="url(#bedGrad)" />
                  <Rect x="20" y="55" width="40" height="25" rx="6" fill="#FFFFFF" />

                  {/* Kafa (Yastıkta) */}
                  <Circle cx="40" cy="62" r="18" fill="url(#skinGrad)" />
                  {/* Uyuyan Gözler */}
                  <Path d="M30 62 Q34 65 38 62" stroke="#451A03" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <Path d="M42 62 Q46 65 50 62" stroke="#451A03" strokeWidth="2" strokeLinecap="round" fill="none" />
                  {/* Ağız (hafif üzgün/yorgun) */}
                  <Path d="M36 71 Q40 68 44 71" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  {/* Alında Soğuk Kompres / Buz Torbası */}
                  <Rect x="30" y="44" width="20" height="8" rx="3" fill="#67E8F9" />
                  {/* Yorgan */}
                  <Path d="M45 75 L105 75 C107 75, 107 105, 105 105 L45 105 Z" fill="#93C5FD" />
                  {/* Zzz İfadesi */}
                  <Text style={{ fontSize: 12, fill: '#64748B', fontWeight: 'bold' }}>
                    Zzz
                  </Text>
                </G>
              )}

              {/* AŞAMA 2: Güç Toplayan & Gülümseyen Karakter */}
              {stage === 2 && (
                <G>
                  {/* Gövde */}
                  <Path d="M42 68 C42 55, 78 55, 78 68 L76 105 L44 105 Z" fill="#A5B4FC" />
                  {/* Kafa */}
                  <Circle cx="60" cy="46" r="22" fill="url(#skinGrad)" />
                  {/* Gözler (Açık ve Canlı) */}
                  <Circle cx="52" cy="45" r="3" fill="#1E1B4B" />
                  <Circle cx="68" cy="45" r="3" fill="#1E1B4B" />
                  {/* Gülümseme */}
                  <Path d="M53 54 Q60 61 67 54" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Yanaklar */}
                  <Circle cx="46" cy="51" r="4" fill="#F87171" opacity="0.6" />
                  <Circle cx="74" cy="51" r="4" fill="#F87171" opacity="0.6" />
                  {/* Alında Yara Bandı (İyileşme Simgesi) */}
                  <G transform="rotate(15 60 28)">
                    <Rect x="50" y="24" width="20" height="8" rx="2" fill="#FDE047" />
                    <Circle cx="60" cy="28" r="1.5" fill="#B45309" />
                  </G>
                  {/* Minik Kollar */}
                  <Path d="M44 75 Q32 80 38 90" stroke="url(#skinGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <Path d="M76 75 Q88 80 82 90" stroke="url(#skinGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
                </G>
              )}

              {/* AŞAMA 3: Tamamen İyileşmiş Süper Enerjik Karakter */}
              {stage === 3 && (
                <G>
                  {/* Pelerin (Süper Kahraman) */}
                  <Path d="M38 60 Q20 85 25 110 Q60 100 95 110 Q100 85 82 60 Z" fill="#EF4444" />
                  {/* Gövde */}
                  <Path d="M40 60 C40 48, 80 48, 80 60 L78 100 L42 100 Z" fill="url(#heroGrad)" />
                  {/* Göğüste Şimşek / Yıldız */}
                  <Path d="M60 68 L64 76 L58 76 L62 86 L54 78 L60 78 Z" fill="#FDE047" />

                  {/* Kafa */}
                  <Circle cx="60" cy="38" r="22" fill="url(#skinGrad)" />
                  {/* Mutlu Gözler (Kıvrımlı) */}
                  <Path d="M50 36 Q54 30 58 36" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <Path d="M62 36 Q66 30 70 36" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Kocaman Neşeli Gülümseme */}
                  <Path d="M52 44 Q60 55 68 44 Z" fill="#DC2626" />
                  <Circle cx="46" cy="43" r="4" fill="#F87171" opacity="0.6" />
                  <Circle cx="74" cy="43" r="4" fill="#F87171" opacity="0.6" />

                  {/* Havaya Kaldırılmış Kollar (Zafer) */}
                  <Path d="M40 62 Q25 45 28 30" stroke="url(#skinGrad)" strokeWidth="7" strokeLinecap="round" fill="none" />
                  <Path d="M80 62 Q95 45 92 30" stroke="url(#skinGrad)" strokeWidth="7" strokeLinecap="round" fill="none" />

                  {/* Şampiyonluk Tacı / Yıldızlar */}
                  <Path d="M52 14 L55 20 L60 14 L65 20 L68 14 L67 24 L53 24 Z" fill="#FACC15" />
                  {/* Işıltı Yıldızları */}
                  <Circle cx="18" cy="22" r="3" fill="#FACC15" />
                  <Circle cx="102" cy="22" r="3" fill="#FACC15" />
                </G>
              )}
            </Svg>
          </View>

          {/* İyileşme Detayları */}
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.stageTitle}>{stageTitle}</Text>
              <View style={styles.healthTag}>
                <Text style={styles.healthTagText}>❤️ %{health}</Text>
              </View>
            </View>

            <Text style={styles.stageDesc}>{stageDescription}</Text>

            {/* İlerleme Çubuğu */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: stage === 3 ? '#10B981' : '#6366F1',
                    },
                  ]}
                />
              </View>
              <Text style={styles.percentText}>%{progressPercent}</Text>
            </View>

            <Text style={styles.intakeSummaryText}>
              💊 Bugün:{' '}
              <Text style={styles.boldText}>
                {current} / {target} Doz
              </Text>{' '}
              Alındı
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Paylaşım Kartı / Özeti Modu */}
      {showShareCard && (
        <View style={styles.shareCardBox}>
          <Text style={styles.shareCardTitle}>💊 İyileşme Durumunu Paylaş!</Text>
          <Text style={styles.shareCardSubtitle}>
            Bugünkü ilaç disiplinini ve maskotunun sağlığını arkadaşlarına göster.
          </Text>
          <TouchableOpacity
            style={styles.shareBtn}
            activeOpacity={0.8}
            onPress={handleShare}
          >
            <Text style={styles.shareBtnText}>📢 Arkadaşlarınla Paylaş</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  widgetCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
    overflow: 'visible',
  },
  sparkleLayer: {
    position: 'absolute',
    top: 5,
    left: 55,
    zIndex: 10,
  },
  svgWrapper: {
    width: 120,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  healthTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  healthTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  stageDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  intakeSummaryText: {
    fontSize: 11,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  shareCardBox: {
    marginTop: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  shareCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 2,
  },
  shareCardSubtitle: {
    fontSize: 11,
    color: '#5B21B6',
    textAlign: 'center',
    marginBottom: 8,
  },
  shareBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
