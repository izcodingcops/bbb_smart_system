import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {useAppDispatch} from '../redux/store';
import {
  GetPrograms,
  GetSelectedProgram,
  GetProgramLoading,
} from '../redux/program/selectors';
import {requestProgramList, selectProgram} from '../redux/program/actions';
import {logout} from '../redux/auth/actions';
import {Program} from '../types/program';

const SelectProgramScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const programs = GetPrograms();
  const selectedProgram = GetSelectedProgram();
  const isLoading = GetProgramLoading();

  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(requestProgramList());
  }, [dispatch]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(p => p.program_name.toLowerCase().includes(q));
  }, [programs, search]);

  const handleSelect = (program: Program) => {
    dispatch(selectProgram(program));
  };

  const renderItem = ({item}: {item: Program}) => {
    const isSelected = selectedProgram?.id === item.id;
    return (
      <TouchableOpacity
        className={`mx-4 mb-2.5 rounded-xl px-4 py-4 flex-row justify-between items-center border ${
          isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}>
        <Text
          className={`flex-1 text-[15px] ${
            isSelected ? 'text-primary font-semibold' : 'text-gray-900'
          }`}
          numberOfLines={1}>
          {item.program_name}
        </Text>
        {isSelected && (
          <Text className="text-primary font-bold text-lg ml-3">✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">
          Select A Program
        </Text>
        <TouchableOpacity
          className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
          onPress={() => dispatch(logout())}>
          <Text className="text-gray-500 text-base font-bold">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="mx-4 mt-3 mb-2 flex-row items-center bg-gray-100 rounded-xl px-4">
        <Text className="text-gray-400 mr-2 text-base">⌕</Text>
        <TextInput
          className="flex-1 py-3 text-[15px] text-gray-900"
          placeholder="Search by Program Name"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text className="text-gray-400 text-base">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Program Banner */}
      {selectedProgram && !search && (
        <View className="mx-4 mt-2 mb-1 bg-blue-50 border border-primary rounded-xl px-4 py-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
              Selected Program
            </Text>
            <Text className="text-[15px] text-gray-900 font-medium" numberOfLines={1}>
              {selectedProgram.program_name}
            </Text>
          </View>
          <Text className="text-primary font-bold text-xl ml-3">✓</Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D4889" />
          <Text className="text-gray-400 mt-3 text-sm">Loading programs…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrograms}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={() => (
            <View className="px-4 py-3 flex-row items-center">
              <Text className="text-gray-500 text-sm font-medium">
                {filteredPrograms.length} Available Program
                {filteredPrograms.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-400 text-base">No programs found</Text>
            </View>
          )}
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default SelectProgramScreen;
