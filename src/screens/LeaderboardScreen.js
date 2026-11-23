import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { getWeeklyLeaderboard } from '../services/leaderboardService';
import {
  getUserProfile,
  addFriend,
  sendPointsToFriend,
} from '../services/userService';
import {
  getWeeklyChallenge,
  calculateChallengeProgress,
} from '../data/dailyChallenges';
import { getHabits } from '../services/storage';

export default function LeaderboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'friends'
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(null);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Puan Gönderme Modalı
  const [sendPointModalVisible, setSendPointModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [pointAmount, setPointAmount] = useState('25');

  // Arkadaş Widget Görüntüleme Modalı
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);
  const [viewedFriendWidget, setViewedFriendWidget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [board, prof, habits] = await Promise.all([
        getWeeklyLeaderboard(),
        getUserProfile(),
        getHabits(),
      ]);
      setLeaderboardData(board);
      setProfile(prof);
      setChallengeProgress(calculateChallengeProgress(habits, prof));
    } catch (e) {
      console.error('Skor tablosu yükleme hatası:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddFriend = async () => {
    const code = friendCodeInput.trim();
    if (!code) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir arkadaş davet kodu girin.');
      return;
    }

    try {
      const friend = await addFriend(code);
      setFriendCodeInput('');
      Alert.alert('Eklendi!', `"${friend.username}" (${friend.friendCode}) arkadaş listenize eklendi!`);
      await loadData();
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleSendPoints = async () => {
    if (!selectedFriend) return;
    try {
      const result = await sendPointsToFriend(selectedFriend.id, pointAmount);
      setSendPointModalVisible(false);
      Alert.alert(
        '🎁 Puan Gönderildi!',
        `"${result.friendName}" kullanıcısına ${result.sentAmount} puan gönderildi!\nKalan Puanınız: ${result.newTotalScore}`
      );
      await loadData();
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const weeklyChallenge = getWeeklyChallenge();

  const displayedList = (leaderboardData?.leaderboard || []).filter((item) => {
    if (activeTab === 'friends') {
      return item.isUser || item.isFriend;
    }
    return true;
  });

  const renderRankItem = ({ item }) => {
    const isTopThree = item.rank <= 3;
    const rankMedal =
      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`;

    return (
      <View style={[styles.rankCard, item.isUser && styles.userRankCard]}>
        <View style={styles.rankNumContainer}>
          <Text style={[styles.rankNumText, isTopThree && styles.medalText]}>
            {rankMedal}
          </Text>
        </View>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.avatar || '👤'}</Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.usernameText, item.isUser && styles.boldUsername]}>
              {item.username} {item.isUser ? '(Sen)' : ''}
            </Text>
            {item.isFriend && <Text style={styles.friendBadge}>Dost</Text>}
          </View>

          {item.isTop10 && (
            <Text style={styles.top10Badge}>🔥 Üst %10 (Eşit Puan Dahil • 2x)</Text>
          )}

          {/* Arkadaş Eylemleri: Puan Gönder & Maskotunu Gör */}
          {item.isFriend && (
            <View style={styles.friendActionsRow}>
              <TouchableOpacity
                style={styles.friendActionBtn}
                onPress={() => {
                  setSelectedFriend(item);
                  setSendPointModalVisible(true);
                }}
              >
                <Text style={styles.friendActionBtnText}>🎁 Puan Gönder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.friendActionBtn, styles.widgetSeeBtn]}
                onPress={() => {
                  setViewedFriendWidget(item);
                  setWidgetModalVisible(true);
                }}
              >
                <Text style={styles.widgetSeeBtnText}>🪴 Maskotu Gör</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
          <Text style={styles.scoreLabel}>Haftalık Puan</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Ortak Haftalık Yarışma Kartı */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeBadge}>{weeklyChallenge.badge}</Text>
            <View style={styles.challengeTitleGroup}>
              <Text style={styles.challengeTitle}>{weeklyChallenge.title}</Text>
              <Text style={styles.challengeDesc}>{weeklyChallenge.description}</Text>
            </View>
          </View>

          {challengeProgress && (
            <View style={styles.challengeProgressArea}>
              <View style={styles.challengeProgressLabelRow}>
                <Text style={styles.challengeProgressLabel}>
                  Haftalık İlerlemeniz: {challengeProgress.current} / {challengeProgress.target}
                </Text>
                <Text style={styles.challengePercentText}>
                  %{challengeProgress.percentage}
                </Text>
              </View>
              <View style={styles.challengeProgressBg}>
                <View
                  style={[
                    styles.challengeProgressFill,
                    { width: `${challengeProgress.percentage}%` },
                    challengeProgress.isCompleted && styles.challengeProgressFillDone,
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Kullanıcının Canlı Durumu ve Kural 4 Eşit Puanlı %10 Ödülü */}
        <View style={styles.myStandingCard}>
          <View style={styles.standingRow}>
            <View>
              <Text style={styles.standingLabel}>HAFTALIK SIRANIZ</Text>
              <Text style={styles.standingRank}>
                #{leaderboardData?.userRank || '-'} / {leaderboardData?.totalCount || '-'}
              </Text>
            </View>
            <View style={styles.standingScoreGroup}>
              <Text style={styles.standingLabel}>HAFTALIK PUAN</Text>
              <Text style={styles.standingScore}>
                🪙 {leaderboardData?.userEntry?.score || 0}
              </Text>
            </View>
          </View>

          {/* Kural 4: Eşit Puan Durumunda %10 Bilgisi */}
          <View
            style={[
              styles.rewardBanner,
              leaderboardData?.isTop10Percent
                ? styles.rewardBannerSuccess
                : styles.rewardBannerNormal,
            ]}
          >
            <Text style={styles.rewardBannerText}>
              {leaderboardData?.isTop10Percent
                ? `🏆 Tebrikler! Üst %10 dilimdesiniz (Eşik Puan: ${leaderboardData.cutoffScore}). Eşit puan kuralı gereğince yarın tüm zorunlu görevlerde 2x Puan avantajınız aktiftir!`
                : `📊 Üst %10 eşiği şu an ${leaderboardData?.cutoffScore || 0} puandır. Eşit puan alan herkes 2x kazanır! Kanıt ekleyip puanınızı yükseltin.`}
            </Text>
          </View>

          {profile?.isDoublePointsActiveToday && (
            <View style={styles.doublePointsActiveBadge}>
              <Text style={styles.doublePointsActiveText}>
                🔥 2x PUAN ÇARPANI BUGÜN AKTİF! (Zorunlu kanıtlar çift puan kazandırır)
              </Text>
            </View>
          )}
        </View>

        {/* Arkadaş Bağlantısı ve Davet Kodu */}
        <View style={styles.socialCard}>
          <View style={styles.myCodeRow}>
            <Text style={styles.myCodeLabel}>Senin Arkadaş Kodun:</Text>
            <TouchableOpacity
              style={styles.codePill}
              onPress={() => {
                Alert.alert(
                  'Arkadaş Kodu',
                  `Kodunuz: ${profile?.friendCode}\nBu kodu arkadaşlarınızla paylaşarak yarışabilirsiniz!`
                );
              }}
            >
              <Text style={styles.codePillText}>{profile?.friendCode || 'HAB-1234'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addFriendRow}>
            <TextInput
              style={styles.friendInput}
              placeholder="Arkadaş kodu gir (örn: HAB-DNZ1)..."
              placeholderTextColor="#94A3B8"
              value={friendCodeInput}
              onChangeText={setFriendCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.addFriendBtn} onPress={handleAddFriend}>
              <Text style={styles.addFriendBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sekme Seçici: Genel vs Arkadaşlar */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'global' && styles.tabButtonActive]}
            onPress={() => setActiveTab('global')}
          >
            <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
              🌍 Genel ({leaderboardData?.totalCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              👥 Arkadaşlar ({(profile?.friends || []).length + 1})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sıralama Listesi */}
        <View style={styles.listSection}>
          <FlatList
            data={displayedList}
            keyExtractor={(item) => item.id}
            renderItem={renderRankItem}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Puan Gönderme Modalı */}
      <Modal
        visible={sendPointModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSendPointModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎁 Puan Hediye Et</Text>
            <Text style={styles.modalSubtitle}>
              "{selectedFriend?.username}" adlı arkadaşınızı motive etmek için puan gönderin:
            </Text>

            <View style={styles.pointPresetsRow}>
              {['10', '25', '50', '100'].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetChip, pointAmount === val && styles.presetChipActive]}
                  onPress={() => setPointAmount(val)}
                >
                  <Text
                    style={[styles.presetChipText, pointAmount === val && styles.presetChipTextActive]}
                  >
                    +{val} Puan
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.balanceNote}>
              Mevcut Puanınız: 🪙 {profile?.totalScore || 0}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSendPointModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSendPoints}>
                <Text style={styles.modalSaveText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Arkadaş Maskotu Görüntüleme Modalı */}
      <Modal
        visible={widgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWidgetModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              🪴 {viewedFriendWidget?.username}'in Maskotu
            </Text>

            <View style={styles.friendWidgetCenter}>
              <Text style={styles.friendWidgetAvatar}>
                {viewedFriendWidget?.avatar === '🌊' ? '🌷' : '🪴'}
              </Text>
              <Text style={styles.friendWidgetStage}>
                {viewedFriendWidget?.widgetStatus?.label || 'Gelişiyor 🌿'}
              </Text>
              <Text style={styles.friendWidgetHealth}>
                Can Seviyesi: %{viewedFriendWidget?.widgetStatus?.health || 50}
              </Text>
              <Text style={styles.friendWidgetHint}>
                Arkadaşınız düzenli su içerek maskotunu gün be gün büyütüyor!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => setWidgetModalVisible(false)}
            >
              <Text style={styles.modalSaveText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  challengeCard: {
    backgroundColor: '#312E81',
    margin: 16,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeBadge: {
    fontSize: 32,
  },
  challengeTitleGroup: {
    flex: 1,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  challengeDesc: {
    color: '#C7D2FE',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  challengeProgressArea: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  challengeProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  challengeProgressLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  challengePercentText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  challengeProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  challengeProgressFillDone: {
    backgroundColor: '#10B981',
  },
  myStandingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  standingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  standingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  standingRank: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4F46E5',
    marginTop: 2,
  },
  standingScoreGroup: {
    alignItems: 'flex-end',
  },
  standingScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  rewardBanner: {
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  rewardBannerSuccess: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rewardBannerNormal: {
    backgroundColor: '#F1F5F9',
  },
  rewardBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  doublePointsActiveBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  doublePointsActiveText: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 12,
  },
  socialCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  myCodeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  codePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  codePillText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  addFriendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  friendInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  addFriendBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  listSection: {
    marginHorizontal: 16,
    paddingBottom: 40,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userRankCard: {
    borderColor: '#4F46E5',
    borderWidth: 2,
    backgroundColor: '#F5F3FF',
  },
  rankNumContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  medalText: {
    fontSize: 18,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  boldUsername: {
    fontWeight: '800',
    color: '#4F46E5',
  },
  friendBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  top10Badge: {
    fontSize: 10,
    color: '#EA580C',
    fontWeight: '700',
    marginTop: 2,
  },
  friendActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  friendActionBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  friendActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  widgetSeeBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  widgetSeeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  pointPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  balanceNote: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  friendWidgetCenter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  friendWidgetAvatar: {
    fontSize: 54,
    marginBottom: 8,
  },
  friendWidgetStage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  friendWidgetHealth: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  friendWidgetHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
