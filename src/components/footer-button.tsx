import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

const FooterButton = ({
  onPress,
  onLongPress,
  label,
  disabled,
}: {
  onPress: () => void;
  onLongPress?: () => any;
  label: string;
  disabled?: boolean;
}) => (
  <TouchableOpacity onPress={onPress} onLongPress={onLongPress} disabled={disabled}>
    <View style={styles.footerButton}>
      <Text style={styles.footerButtonText}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  footerButton: {
    padding: 10,
  },
  footerButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default FooterButton;
