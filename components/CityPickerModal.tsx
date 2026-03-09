import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SectionList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, MapPin, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { City, COUNTRY_GROUPS } from '@/constants/cities';

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: City) => void;
  currentCityName?: string;
}

interface SectionData {
  title: string;
  data: City[];
}

export default function CityPickerModal({ visible, onClose, onSelectCity, currentCityName }: CityPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [search, setSearch] = useState<string>('');

  const sections = useMemo<SectionData[]>(() => {
    const query = search.trim().toLowerCase();
    const result: SectionData[] = [];

    for (const group of COUNTRY_GROUPS) {
      let filtered = group.cities;
      if (query) {
        filtered = group.cities.filter(
          c =>
            c.nameAr.includes(query) ||
            c.name.toLowerCase().includes(query) ||
            group.countryAr.includes(query) ||
            group.country.toLowerCase().includes(query)
        );
      }
      if (filtered.length > 0) {
        result.push({ title: group.countryAr, data: filtered });
      }
    }
    return result;
  }, [search]);

  const handleSelect = useCallback((city: City) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectCity(city);
    setSearch('');
  }, [onSelectCity]);

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const renderItem = useCallback(({ item }: { item: City }) => {
    const isSelected = currentCityName === item.nameAr;
    return (
      <TouchableOpacity
        style={[modalStyles.cityRow, isSelected && modalStyles.cityRowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
        testID={`city-${item.name}`}
      >
        <View style={modalStyles.cityInfo}>
          <Text style={[modalStyles.cityName, isSelected && modalStyles.cityNameSelected]}>
            {item.nameAr}
          </Text>
          <Text style={modalStyles.cityNameEn}>{item.name}</Text>
        </View>
        {isSelected && (
          <View style={modalStyles.checkWrap}>
            <Check size={16} color={Colors.accent} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [currentCityName, handleSelect]);

  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => (
    <View style={modalStyles.sectionHeader}>
      <Text style={modalStyles.sectionHeaderText}>{section.title}</Text>
      <View style={modalStyles.sectionLine} />
    </View>
  ), []);

  const keyExtractor = useCallback((item: City, index: number) => `${item.country}-${item.name}-${index}`, []);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={[modalStyles.overlay, { paddingTop: insets.top }]}>
        <View style={[modalStyles.container, { maxHeight: height * 0.88, paddingBottom: insets.bottom + 12 }]}>
          <View style={modalStyles.header}>
            <View style={modalStyles.headerLeft}>
              <MapPin size={20} color={Colors.accent} />
              <Text style={modalStyles.headerTitle}>اختيار المدينة</Text>
            </View>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              testID="close-city-picker"
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchWrap}>
            <Search size={16} color={Colors.textMuted} style={modalStyles.searchIcon} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="ابحث عن مدينة أو دولة..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              testID="city-search-input"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={modalStyles.clearButton}>
                <X size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {sections.length === 0 ? (
            <View style={modalStyles.emptyWrap}>
              <Text style={modalStyles.emptyText}>لا توجد نتائج</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled
              contentContainerStyle={modalStyles.listContent}
              initialNumToRender={20}
              maxToRenderPerBatch={15}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Dubai-Bold',
    color: Colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Dubai-Regular',
    color: Colors.text,
    paddingVertical: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.bg,
    gap: 10,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontFamily: 'Dubai-Bold',
    color: Colors.accent,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.separator,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  cityRowSelected: {
    backgroundColor: Colors.accentDim,
  },
  cityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityName: {
    fontSize: 15,
    fontFamily: 'Dubai-Medium',
    color: Colors.text,
  },
  cityNameSelected: {
    color: Colors.accent,
  },
  cityNameEn: {
    fontSize: 12,
    fontFamily: 'Dubai-Regular',
    color: Colors.textMuted,
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Dubai-Medium',
    color: Colors.textMuted,
  },
});
