import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function TimePickerModal({
  visible,
  initialTime = '09:00',
  title = 'Alarm Saatini Seç',
  onConfirm,
  onClose,
}) {
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  useEffect(() => {
    if (initialTime && initialTime.includes(':')) {
      const [h, m] = initialTime.split(':');
      setSelectedHour(h.padStart(2, '0'));
      // En yakın 5'lik dakikaya yuvarla
      const roundedMin = Math.round(parseInt(m || '0', 10) / 5) * 5;
      const minStr = String(Math.min(55, roundedMin)).padStart(2, '0');
      setSelectedMinute(MINUTES.includes(minStr) ? minStr : '00');
    }
  }, [initialTime, visible]);

  const handleSave = () => {
    const formatted = `${selectedHour}:${selectedMinute}`;
    onConfirm(formatted);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Başlık */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.selectedDisplay}>
              ⏰ {selectedHour}:{selectedMinute}
            </Text>
          </View>

          {/* Saat ve Dakika Seçim Izgarası */}
          <View style={styles.pickersContainer}>
            {/* Saat Sütunu */}
            <View style={styles.column}>
              <Text style={styles.columnHeader}>SAAT (00 - 23)</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                  {HOURS.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                        onPress={() => setSelectedHour(h)}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            isSelected && styles.timeChipTextSelected,
                          ]}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Ayırıcı */}
            <View style={styles.divider} />

            {/* Dakika Sütunu */}
            <View style={styles.column}>
              <Text style={styles.columnHeader}>DAKİKA (00 - 55)</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                  {MINUTES.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                        onPress={() => setSelectedMinute(m)}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            isSelected && styles.timeChipTextSelected,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Eylem Butonları */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
              <Text style={styles.confirmText}>Saati Ayarla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  selectedDisplay: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 1,
  },
  pickersContainer: {
    flexDirection: 'row',
    height: 220,
    gap: 8,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollList: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  timeChip: {
    width: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
