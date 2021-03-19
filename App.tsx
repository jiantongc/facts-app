import React, {useState, useEffect} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {TextInput, TouchableOpacity} from 'react-native-gesture-handler';
import {Camera} from 'expo-camera';
import * as FileSystem from 'expo-file-system';

const RANDOM_FACTS = [
  'McDonald’s once made bubblegum-flavored broccoli',
  'Some fungi create zombies, then control their minds',
  'The first oranges weren’t orange',
  'There’s only one letter that doesn’t appear in any U.S. state name',
];
const RANDOM_FACTS_LEN = RANDOM_FACTS.length;

const getRandomFactIndex = () => Math.floor(Math.random() * RANDOM_FACTS_LEN);

const DISK_DIR = `${FileSystem.documentDirectory}_secret/`;

const ACCESS_KEY = '55511';
const DELETE_KEY = '78910';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [factIndex, setFactIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  useEffect(() => {
    (async () => {
      await createDirectory(); // Ensure directory exists

      const {status} = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    setIsPasswordMode(false);
  }, [isRecording, factIndex]);

  const createDirectory = async () => {
    // Ensure directory exists
    try {
      const docDir = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      if (!docDir.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory);
      }
      const dir = await FileSystem.getInfoAsync(DISK_DIR);
      if (!dir.exists) {
        await FileSystem.makeDirectoryAsync(DISK_DIR);
      }
    } catch (e) {
      console.log('makeDirectoryAsync FAILED');
    }
  };

  const handleChangeFactClick = () => setFactIndex(factIndex >= RANDOM_FACTS_LEN - 1 ? 0 : factIndex + 1);

  const handleActionToggle = async () => {
    if (!cameraRef) {
      console.log('No cameraRef');
      return;
    }

    if (isRecording) {
      console.log('STOP RECORDING');
      cameraRef.stopRecording();
      setIsRecording(false); // TODO: Stop recording
      return;
    }

    console.log('START RECORDING');
    setIsRecording(true);
    let video = await cameraRef.recordAsync();
    await FileSystem.moveAsync({
      from: video.uri,
      to: `${DISK_DIR}${Date.now()}.mov`,
    });
    console.log('MOVED!');
  };

  const handlePasswordChange = async (v: string) => {
    if (v.length > 5) {
      setIsPasswordMode(false);
      return;
    }

    if (v === ACCESS_KEY) {
      accessGallery();
      setIsPasswordMode(false);
    } else if (v === DELETE_KEY) {
      Alert.alert('Test', 'Leggo?', [
        {
          text: 'Nei',
          onPress: () => {
            setIsPasswordMode(false);
          },
        },
        {
          text: 'Yes',
          onPress: async () => {
            setIsPasswordMode(false);
            console.log('DELETING ALL FILES!');
            // const i = await FileSystem.readDirectoryAsync(`${FileSystem.cacheDirectory}Camera`);
            // i.forEach(io => FileSystem.deleteAsync(`${FileSystem.cacheDirectory}Camera/${io}`));
            await FileSystem.deleteAsync(DISK_DIR);
            await createDirectory();
          },
        },
      ]);
    }
  };

  const accessGallery = async () => {
    const videos = await FileSystem.readDirectoryAsync(DISK_DIR);
    console.log(videos);
  };

  return (
    <View style={styles.container}>
      <View style={{...styles.main, backgroundColor: isRecording ? 'black' : 'green'}}>
        <Text style={styles.fact}>{RANDOM_FACTS[factIndex]}</Text>
        {isPasswordMode && (
          <TextInput style={styles.input} keyboardType="number-pad" onChangeText={handlePasswordChange} />
        )}
        {/* <Camera
          type={Camera.Constants.Type.back}
          style={styles.viewFinder}
          videoStabilizationMode={Camera.Constants.VideoStabilization.cinematic} // standard
          ref={ref => setCameraRef(ref)}
          onMountError={() => alert('NOT WORKING')}
        /> */}
      </View>
      <View style={styles.footer}>
        <FooterButton onPress={() => setIsPasswordMode(!isPasswordMode)} label="<" />
        <TouchableOpacity onLongPress={handleActionToggle} style={styles.actionButton} onPress={handleChangeFactClick}>
          <Text style={styles.action}>+++</Text>
        </TouchableOpacity>
        <FooterButton onPress={handleChangeFactClick} label=">" />
      </View>
    </View>
  );
}

const FooterButton = ({onPress, label}: {onPress: () => void; label: string}) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.footerButton}>
      <Text style={styles.footerButtonText}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    flex: 1,
    flexShrink: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    color: 'white',
    fontSize: 40,
    backgroundColor: '#999',
    width: '100%',
    textAlign: 'center',
  },
  fact: {
    color: 'white',
  },
  viewFinder: {
    height: 16 * 18,
    width: 9 * 18,
    backgroundColor: '#eee',
    margin: 10,
    opacity: 1,
    position: 'absolute',
    zIndex: -1,
  },
  footer: {
    flexShrink: 1,
    height: 120,
    width: '100%',
    backgroundColor: '#dddddd',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    alignContent: 'center',
  },

  actionButton: {
    // alignContent: 'ce'
    alignItems: 'flex-start',
  },
  action: {
    fontSize: 80,
    lineHeight: 80,
    fontWeight: 'bold',
  },

  /* Footer button */
  footerButton: {
    padding: 10,
  },
  footerButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
