import React, {useState, useEffect, useRef} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {TextInput, TouchableOpacity} from 'react-native-gesture-handler';
import {Camera} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {Snackbar} from 'react-native-paper';
import {format} from 'date-fns';
import Gallery from './components/gallery';
import FooterButton from './components/footer-button';
import {FILE_DATE_FORMAT} from './constants';
import {useKeepAwake} from 'expo-keep-awake';
import Constants from 'expo-constants';
import Counter from './components/counter';

const RANDOM_FACTS = [
  'McDonald’s once made bubblegum-flavored broccoli.',
  'Some fungi create zombies, then control their minds.',
  'The first oranges weren’t orange.',
  'There’s only one letter that doesn’t appear in any U.S. state name.',
  'The world wastes about 1 billion metric tons of food each year.',
  'Hair and nails grow faster during pregnancy.',
];
const RANDOM_FACTS_LEN = RANDOM_FACTS.length;

const DISK_DIR = `${FileSystem.documentDirectory}_secret/`;

const ACCESS_KEY = '55510';
const DELETE_KEY = '78910';

export default function App() {
  const [_hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [factIndex, setFactIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [isGalleryMode, setIsGalleryMode] = useState(false);
  const [isShowViewFinder, setIsShowViewFinder] = useState(false);

  const [snackbarText, setSnackBarText] = useState<string | null>(null);
  const cameraRef = useRef(null);

  useKeepAwake();

  useEffect(() => {
    (async () => {
      await createDirectory(); // Ensure directory exists

      const {status} = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      MediaLibrary.requestPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    setIsPasswordMode(false);
  }, [isRecording, factIndex]);

  const createDirectory = async () => {
    // Ensure directory exists
    if (!FileSystem.documentDirectory) {
      setSnackBarText('error');
      return;
    }

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
      setSnackBarText('makeDirectoryAsync FAILED');
    }
  };

  const handleFactClick = () => {
    isPasswordMode && setIsPasswordMode(false);
    isRecording && setIsShowViewFinder(!isShowViewFinder);
  };
  const handleChangeFactClick = () => setFactIndex(factIndex >= RANDOM_FACTS_LEN - 1 ? 0 : factIndex + 1);

  const handleActionToggle = async () => {
    if (isRecording) {
      if (!cameraRef.current) {
        return setSnackBarText('No ref!');
      }
      return setIsRecording(false); // TODO: Stop recording
    }

    setIsRecording(true);
  };

  const startRecording = async () => {
    if (!cameraRef.current) {
      return setSnackBarText('No ref!');
    }
    try {
      const video = await cameraRef.current.recordAsync({
        quality: '2160p',
      });
      await FileSystem.moveAsync({
        from: video.uri,
        to: `${DISK_DIR}${format(new Date(), FILE_DATE_FORMAT)}.mov`,
      });
      setSnackBarText('Nice');
    } catch (e) {
      setSnackBarText('SHTF');
    } finally {
      setIsRecording(false);
      setIsShowViewFinder(false);
    }
  };

  const handlePasswordChange = async (v: string) => {
    if (v.length > 5) {
      setIsPasswordMode(false);
      return;
    }

    if (v === ACCESS_KEY) {
      setIsPasswordMode(false);
      accessGallery();
    } else if (v === DELETE_KEY) {
      Alert.alert('Open surprise', 'Leggo?', [
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
            // const i = await FileSystem.readDirectoryAsync(`${FileSystem.cacheDirectory}Camera`);
            // i.forEach(io => FileSystem.deleteAsync(`${FileSystem.cacheDirectory}Camera/${io}`));
            await FileSystem.deleteAsync(DISK_DIR);
            await createDirectory();
          },
        },
      ]);
    }
  };

  const handleImportAssets = async () => {
    const result = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    });
    const latestMedia = result.assets[0];

    if (!latestMedia) {
      return;
    }
    Alert.alert('Hungry', 'Eat last item?', [
      {text: 'No'},
      {
        text: 'Yes',
        onPress: () => importAndDeleteLastAsset(latestMedia),
      },
    ]);
  };

  const importAndDeleteLastAsset = async asset => {
    const {uri, filename, creationTime} = asset;
    try {
      await FileSystem.copyAsync({
        from: uri,
        to: `${DISK_DIR}${format(creationTime, FILE_DATE_FORMAT)}__${filename}`,
      });
      await MediaLibrary.deleteAssetsAsync([asset]);
    } catch (e) {
      setSnackBarText('Error while eating');
    }
  };

  const accessGallery = async () => setIsGalleryMode(true);

  function renderMain() {
    return (
      <>
        <View style={{...styles.main, backgroundColor: isRecording ? 'black' : 'green'}}>
          <Text style={styles.version}>V{Constants.manifest.version}</Text>
          <Counter />
          <View style={styles.content}>
            <TouchableOpacity onPress={handleFactClick}>
              <View style={styles.factContainer}>
                <Text style={styles.title}>Fun Fact #{factIndex + 1}</Text>
                <Text style={styles.fact}>{RANDOM_FACTS[factIndex]}</Text>
              </View>
            </TouchableOpacity>
            {isPasswordMode && (
              <TextInput style={styles.input} keyboardType="number-pad" onChangeText={handlePasswordChange} autoFocus />
            )}

            {isRecording && (
              <Camera
                type={Camera.Constants.Type.back}
                style={[styles.viewFinder, isShowViewFinder ? styles.visibleViewFinder : styles.hiddenViewFinder]}
                ref={cameraRef}
                autoFocus={Camera.Constants.AutoFocus.on}
                videoStabilizationMode={Camera.Constants.VideoStabilization.cinematic}
                onCameraReady={startRecording}
                onMountError={() => alert('NOT WORKING')}
              />
            )}
          </View>
        </View>
        <View style={styles.footer}>
          <FooterButton
            label="<"
            onPress={handleChangeFactClick}
            onLongPress={() => setIsPasswordMode(!isPasswordMode)}
          />
          <TouchableOpacity
            onLongPress={handleActionToggle}
            style={styles.actionButton}
            onPress={handleChangeFactClick}
          >
            <Text style={styles.action}>GO</Text>
          </TouchableOpacity>
          <FooterButton label=">" onPress={handleChangeFactClick} onLongPress={handleImportAssets} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {isGalleryMode && (
        <Gallery diskDir={DISK_DIR} setSnackBarText={setSnackBarText} onClose={() => setIsGalleryMode(false)} />
      )}
      {!isGalleryMode && renderMain()}
      <Snackbar
        visible={!!snackbarText}
        onDismiss={() => setSnackBarText(null)}
        duration={1000}
        style={styles.snackbar}
      >
        {snackbarText}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    flex: 1,
    flexShrink: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: 60,
  },
  version: {
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    color: 'white',
    fontSize: 40,
    backgroundColor: '#999',
    width: '100%',
    textAlign: 'center',
    marginBottom: 200,
  },
  factContainer: {
    textAlign: 'left',
    marginBottom: 240,
  },

  title: {
    color: 'white',
    fontSize: 20,
  },
  fact: {
    color: 'white',
    fontSize: 30,
  },
  viewFinder: {
    backgroundColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: -1,
    height: 16 * 21,
    width: 9 * 21,
  },
  hiddenViewFinder: {
    opacity: 0,
  },
  visibleViewFinder: {
    opacity: 1,
  },
  footer: {
    flexShrink: 1,
    height: 110,
    width: '100%',
    backgroundColor: '#dddddd',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    alignContent: 'center',
  },
  snackbar: {
    marginBottom: 100,
  },

  actionButton: {
    // alignContent: 'ce'
    alignItems: 'flex-start',
  },
  action: {
    fontSize: 70,
    lineHeight: 78,
    fontWeight: 'bold',
  },
});
