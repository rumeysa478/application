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
} from 'react-native';
import { getDailyLeaderboard } from '../services/leaderboardService';
import {
  getUserProfile,
  addFriend,
} from '../services/userService';
import {
  getTodayChallenge,
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

  const loadData = useCallback(async () => {
    try {
      const [board, prof, habits] = await Promise.all([
        getDailyLeaderboard(),
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

  const todayChallenge = getTodayChallenge();

  // Filtrelenmiş liste
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
        {/* Sıralama Numarası / Madalya */}
        <View style={styles.rankNumContainer}>
          <Text style={[styles.rankNumText, isTopThree && styles.medalText]}>
            {rankMedal}
          </Text>
        </View>

        {/* Profil Bilgisi */}
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
          {item.rank <= Math.ceil((leaderboardData?.totalCount || 10) * 0.1) && (
            <Text style={styles.top10Badge}>🔥 Üst %10 (2x Adayı)</Text>
          )}
        </View>

        {/* Skor */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
          <Text style={styles.scoreLabel}>Puan</Text>
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
        {/* Ortak Günlük Yarışma Kartı */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeBadge}>{todayChallenge.badge}</Text>
            <View style={styles.challengeTitleGroup}>
              <Text style={styles.challengeTitle}>{todayChallenge.title}</Text>
              <Text style={styles.challengeDesc}>{todayChallenge.description}</Text>
            </View>
          </View>

          {/* İlerleme Barı */}
          {challengeProgress && (
            <View style={styles.challengeProgressArea}>
              <View style={styles.challengeProgressLabelRow}>
                <Text style={styles.challengeProgressLabel}>
                  İlerlemeniz: {challengeProgress.current} / {challengeProgress.target}
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
              {challengeProgress.isCompleted && (
                <Text style={styles.challengeDoneText}>
                  ✓ Günün yarışması tamamlandı! +{todayChallenge.rewardPoints} bonus kazanıldı.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Kullanıcının Canlı Durumu ve %10 Ödül Rozeti */}
        <View style={styles.myStandingCard}>
          <View style={styles.standingRow}>
            <View>
              <Text style={styles.standingLabel}>GÜNLÜK SIRANIZ</Text>
              <Text style={styles.standingRank}>
                #{leaderboardData?.userRank || '-'} / {leaderboardData?.totalCount || '-'}
              </Text>
            </View>
            <View style={styles.standingScoreGroup}>
              <Text style={styles.standingLabel}>YARIŞMA PUANI</Text>
              <Text style={styles.standingScore}>
                🪙 {leaderboardData?.userEntry?.score || 0}
              </Text>
            </View>
          </View>

          {/* %10 Dilim Ödül Durumu */}
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
                ? `🏆 Tebrikler! Üst %${leaderboardData.percentile} dilimdesiniz. Yarın tüm puanlarınız 2x ile çarpılacak!`
                : `📊 Şu an üst %${leaderboardData?.percentile || 50} dilimdesiniz. İlk %10'a girip yarın 2x puan kazanmak için kanıt ekleyin!`}
            </Text>
          </View>

          {profile?.isDoublePointsActiveToday && (
            <View style={styles.doublePointsActiveBadge}>
              <Text style={styles.doublePointsActiveText}>
                🔥 2x PUAN BONUSU BUGÜN AKTİF! (Her görevden çift puan)
              </Text>
            </View>
          )}
        </View>

        {/* Arkadaş Ekleme ve Davet Kodu */}
        <View style={styles.socialCard}>
          <View style={styles.myCodeRow}>
            <Text style={styles.myCodeLabel}>Senin Arkadaş Kodun:</Text>
            <TouchableOpacity
              style={styles.codePill}
              onPress={() => {
                Alert.alert('Arkadaş Kodu', `Kodunuz: ${profile?.friendCode}\nBu kodu arkadaşlarınızla paylaşarak yarışabilirsiniz!`);
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
              🌍 Genel Sıralama ({leaderboardData?.totalCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              👥 Arkadaşlarım ({(profile?.friends || []).length + 1})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste */}
        <View style={styles.listSection}>
          <FlatList
            data={displayedList}
            keyExtractor={(item) => item.id}
            renderItem={renderRankItem}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
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
  challengeDoneText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
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
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '700',
    marginTop: 2,
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
});
