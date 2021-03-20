import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

const FooterButton = ({onPress, onLongPress, label}: {onPress: () => void; onLongPress?: () => any; label: string}) => (
  <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
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
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default FooterButton;
