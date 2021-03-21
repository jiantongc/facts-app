import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';

const COUNTER_STORAGE_KEY = '@counter';

const Counter = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    (async () => {
      setCounter(Number((await AsyncStorage.getItem(COUNTER_STORAGE_KEY)) || 0));
    })();
  }, []);

  useEffect(() => {
    try {
      AsyncStorage.setItem(COUNTER_STORAGE_KEY, `${counter}`);
    } catch (e) {
      alert('Something went wrong while updating counter');
    }
  }, [counter]);

  return (
    <View style={styles.container}>
      <ActionButton onPress={() => counter > 0 && setCounter(counter - 1)} label="-" />
      <View style={styles.display}>
        <Text style={styles.displayTitle}>Counter</Text>
        <Text style={styles.displayValue}>{counter}</Text>
      </View>
      <ActionButton onPress={() => setCounter(counter + 1)} label="+" />
    </View>
  );
};

const ActionButton = ({onPress, label}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.action}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  action: {
    color: 'white',
    fontSize: 40,
    padding: 10,
  },
  display: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayTitle: {
    color: 'white',
  },
  displayValue: {
    color: 'white',
    fontSize: 40,
  },
});

export default Counter;
