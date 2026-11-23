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
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

/**
 * Su Alışkanlığına Bağlı Yaşayan Bitki Widget'ı (PlantWidget)
 *
 * @param {Object} props
 * @param {number} props.progressPercent - Bugünün su ilerleme yüzdesi (0-100)
 * @param {number} [props.health=80] - Maskot genel sağlık puanı (0-100)
 * @param {number} [props.totalIntake=1.5] - Bugün içilen litre
 * @param {number} [props.targetIntake=2.5] - Günlük hedef litre
 * @param {boolean} [props.showShareCard=false] - Paylaşım kartı modu
 * @param {boolean} [props.triggerBounce=false] - Kanıt anında tepki animasyonu
 * @param {Function} [props.onPress] - Dokunma eylemi
 */
export default function PlantWidget({
  progressPercent = 0,
  health = 80,
  totalIntake = 0,
  targetIntake = 2.5,
  showShareCard = false,
  triggerBounce = false,
  onPress,
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const dropletAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Tepki Animasyonu (Hafif esneme/parlama/damla efekti)
  const runReactionAnimation = () => {
    // 1. Damla düşüşü
    dropletAnim.setValue(0);
    Animated.timing(dropletAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();

    // 2. Bitki esneme ve yaylanma (bounce)
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.15,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Parlama (glow)
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (triggerBounce) {
      runReactionAnimation();
    }
  }, [triggerBounce]);

  // Kademeler:
  // Aşama 1 (0 - 25%): Tohum / Yeni Uyanan Filiz
  // Aşama 2 (26 - 60%): Büyüyen Taze Fidan
  // Aşama 3 (61 - 90%): Canlı ve Gür Yapraklı Bitki
  // Aşama 4 (91 - 100%): Rengarenk Çiçek Açmış Şampiyon Bitki
  const percent = Math.min(100, Math.max(0, Number(progressPercent) || 0));

  let stage = 1;
  let stageTitle = '🌱 Uyanan Tohum';
  let stageDescription = 'Günün ilk suyunu bekliyor...';

  if (percent >= 90) {
    stage = 4;
    stageTitle = '🌸 Çiçek Açmış Bitki';
    stageDescription = 'Günlük su hedefine ulaşıldı! Harikasın!';
  } else if (percent >= 55) {
    stage = 3;
    stageTitle = '🌿 Canlı ve Gür Fidan';
    stageDescription = 'Düzenli su içtikçe yaprakları parlıyor!';
  } else if (percent >= 25) {
    stage = 2;
    stageTitle = '🌱 Büyüyen Filiz';
    stageDescription = 'İlk yudumlarla birlikte filizlendi.';
  }

  // Arkadaşlarla Paylaşma Eylemi
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌱 Habitime Bitkim büyüyor! Bugün ${totalIntake}/${targetIntake} L su içtim ve bitkim %${percent} aşamasına ulaştı! Sağlık Puanı: %${health} 💧 Sen de bana katıl!`,
      });
    } catch (e) {
      console.warn('Paylaşım hatası:', e);
    }
  };

  const dropletTranslateY = dropletAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-35, 15],
  });

  const dropletOpacity = dropletAnim.interpolate({
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
            {
              transform: [{ scale: bounceAnim }],
            },
          ]}
        >
          {/* Su Damlası Reaksiyon Animasyonu Katmanı */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dropletLayer,
              {
                opacity: dropletOpacity,
                transform: [{ translateY: dropletTranslateY }],
              },
            ]}
          >
            <Svg width="24" height="28" viewBox="0 0 24 28">
              <Path
                d="M12 2 C12 2, 3 14, 3 20 C3 24.5 7 28 12 28 C17 28 21 24.5 21 20 C21 14, 12 2, 12 2 Z"
                fill="#38BDF8"
              />
            </Svg>
          </Animated.View>

          {/* SVG Bitki Çizimi */}
          <View style={styles.svgWrapper}>
            <Svg width="120" height="130" viewBox="0 0 120 130">
              <Defs>
                {/* Saksı Gradyanı */}
                <LinearGradient id="potGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#D97706" />
                  <Stop offset="0.5" stopColor="#F59E0B" />
                  <Stop offset="1" stopColor="#B45309" />
                </LinearGradient>

                {/* Yaprak Gradyanı */}
                <LinearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#4ADE80" />
                  <Stop offset="1" stopColor="#15803D" />
                </LinearGradient>

                {/* Çiçek Gradyanı */}
                <LinearGradient id="flowerGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#F43F5E" />
                  <Stop offset="1" stopColor="#BE123C" />
                </LinearGradient>

                {/* Toprak Gradyanı */}
                <LinearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#78350F" />
                  <Stop offset="1" stopColor="#451A03" />
                </LinearGradient>
              </Defs>

              {/* Toprak & Saksı Tabanı */}
              <G y="75">
                {/* Saksı Gövdesi */}
                <Path
                  d="M25 15 L35 50 C36 53, 40 54, 45 54 L75 54 C80 54, 84 53, 85 50 L95 15 Z"
                  fill="url(#potGrad)"
                />
                {/* Saksı Kenarı / Dudak */}
                <Rect
                  x="20"
                  y="8"
                  width="80"
                  height="10"
                  rx="4"
                  fill="#F59E0B"
                />
                {/* Toprak Yüzeyi */}
                <Ellipse cx="60" cy="9" rx="35" ry="5" fill="url(#soilGrad)" />
                {/* Saksı Üzeri İfade / Yüz */}
                <Circle cx="50" cy="32" r="3" fill="#451A03" />
                <Circle cx="70" cy="32" r="3" fill="#451A03" />
                <Path
                  d="M54 38 Q60 44 66 38"
                  stroke="#451A03"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Yanak Kızarıklıkları */}
                <Circle cx="44" cy="36" r="3.5" fill="#F87171" opacity="0.6" />
                <Circle cx="76" cy="36" r="3.5" fill="#F87171" opacity="0.6" />
              </G>

              {/* AŞAMA 1: Yeni Uyanan Filiz */}
              {stage === 1 && (
                <G>
                  {/* Minik Ana Dal */}
                  <Path
                    d="M60 80 Q60 62 60 55"
                    stroke="#16A34A"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Minik Sağ Yaprak */}
                  <Path
                    d="M60 65 Q75 60 70 50 Q60 54 60 65 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Minik Sol Yaprak */}
                  <Path
                    d="M60 70 Q45 66 50 56 Q58 60 60 70 Z"
                    fill="url(#leafGrad)"
                  />
                </G>
              )}

              {/* AŞAMA 2: Büyüyen Fidan */}
              {stage === 2 && (
                <G>
                  {/* Ana Gövde */}
                  <Path
                    d="M60 80 Q62 55 58 40"
                    stroke="#15803D"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Sol Büyük Yaprak */}
                  <Path
                    d="M59 62 Q35 52 40 38 Q55 45 59 62 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Sağ Büyük Yaprak */}
                  <Path
                    d="M59 55 Q85 45 80 30 Q65 38 59 55 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Tepe Yaprağı */}
                  <Path
                    d="M58 40 Q58 20 66 22 Q68 35 58 40 Z"
                    fill="#86EFAC"
                  />
                </G>
              )}

              {/* AŞAMA 3: Gür Yapraklı Canlı Bitki */}
              {stage === 3 && (
                <G>
                  <Path
                    d="M60 80 Q60 50 60 30"
                    stroke="#15803D"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Alt Sol Yaprak */}
                  <Path
                    d="M60 68 Q30 65 32 46 Q50 54 60 68 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Alt Sağ Yaprak */}
                  <Path
                    d="M60 62 Q90 58 88 40 Q70 50 60 62 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Üst Sol Yaprak */}
                  <Path
                    d="M60 48 Q35 32 46 20 Q56 32 60 48 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Üst Sağ Yaprak */}
                  <Path
                    d="M60 42 Q85 26 76 14 Q65 26 60 42 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Tepe Filizi */}
                  <Circle cx="60" cy="28" r="6" fill="#86EFAC" />
                </G>
              )}

              {/* AŞAMA 4: Çiçek Açmış Şampiyon Bitki */}
              {stage === 4 && (
                <G>
                  <Path
                    d="M60 80 Q60 50 60 35"
                    stroke="#15803D"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Sol Büyük Yaprak */}
                  <Path
                    d="M60 65 Q28 58 30 40 Q50 48 60 65 Z"
                    fill="url(#leafGrad)"
                  />
                  {/* Sağ Büyük Yaprak */}
                  <Path
                    d="M60 58 Q92 52 90 35 Q70 42 60 58 Z"
                    fill="url(#leafGrad)"
                  />

                  {/* Tepe Çiçeği Yaprakları */}
                  <Circle cx="60" cy="18" r="9" fill="url(#flowerGrad)" />
                  <Circle cx="48" cy="24" r="9" fill="url(#flowerGrad)" />
                  <Circle cx="72" cy="24" r="9" fill="url(#flowerGrad)" />
                  <Circle cx="52" cy="36" r="9" fill="url(#flowerGrad)" />
                  <Circle cx="68" cy="36" r="9" fill="url(#flowerGrad)" />

                  {/* Çiçek Göbeği */}
                  <Circle cx="60" cy="27" r="8" fill="#FDE047" />
                  <Circle cx="58" cy="25" r="2" fill="#78350F" />
                  <Circle cx="62" cy="25" r="2" fill="#78350F" />
                  <Path
                    d="M58 29 Q60 31 62 29"
                    stroke="#78350F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Parlama / Yıldız Efektleri */}
                  <Path
                    d="M25 22 L27 28 L33 30 L27 32 L25 38 L23 32 L17 30 L23 28 Z"
                    fill="#FACC15"
                  />
                  <Path
                    d="M95 18 L96.5 22 L101 23.5 L96.5 25 L95 29 L93.5 25 L89 23.5 L93.5 22 Z"
                    fill="#FACC15"
                  />
                </G>
              )}
            </Svg>
          </View>

          {/* İlerleme Bilgileri */}
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
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.percentText}>%{percent}</Text>
            </View>

            <Text style={styles.intakeSummaryText}>
              💧 Bugün: <Text style={styles.boldText}>{totalIntake} L</Text> / {targetIntake} L
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Paylaşım Kartı / Özeti Modu */}
      {showShareCard && (
        <View style={styles.shareCardBox}>
          <Text style={styles.shareCardTitle}>🌱 Bitkini Arkadaşlarınla Paylaş!</Text>
          <Text style={styles.shareCardSubtitle}>
            Bugünkü su tüketimin ve sağlıklı bitkinle arkadaşlarına meydan oku.
          </Text>
          <TouchableOpacity
            style={styles.shareBtn}
            activeOpacity={0.8}
            onPress={handleShare}
          >
            <Text style={styles.shareBtnText}>📢 Arkadaşlarına Gönder</Text>
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
    backgroundColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    paddingVertical: 4,
  },
  dropletLayer: {
    position: 'absolute',
    top: -5,
    left: 60,
    zIndex: 10,
  },
  svgWrapper: {
    width: 110,
    height: 120,
    backgroundColor: '#A8F368',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  healthTag: {
    backgroundColor: '#A8F368',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  healthTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  stageDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
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
    height: 16,
    backgroundColor: '#00BF63',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C7F974',
    borderRadius: 9999,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  intakeSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  boldText: {
    fontWeight: '900',
    color: '#000000',
  },
  shareCardBox: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  shareCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  shareCardSubtitle: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 8,
  },
  shareBtn: {
    backgroundColor: '#16A34A',
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
