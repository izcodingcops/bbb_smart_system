import React from 'react';
import {ActivityIndicator, View, Modal, Text} from 'react-native';

interface Props {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<Props> = ({visible, message = 'Loading…'}) => (
  <Modal transparent animationType="fade" visible={visible}>
    <View className="flex-1 bg-black/50 justify-center items-center">
      <View className="bg-white rounded-2xl py-8 px-10 items-center">
        <ActivityIndicator size="large" color="#1D4889" />
        <Text className="text-[15px] text-gray-700 mt-4">{message}</Text>
      </View>
    </View>
  </Modal>
);

export default LoadingOverlay;
