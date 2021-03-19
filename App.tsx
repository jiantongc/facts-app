import React, {useState, useEffect, useRef} from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {FlatList, TextInput, TouchableOpacity} from 'react-native-gesture-handler';
import {Camera} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import formateDate from 'date-fns/format';
import {formatDistance} from 'date-fns';
import * as MediaLibrary from 'expo-media-library';
import {Snackbar} from 'react-native-paper';
import {Video} from 'expo-av';

const RANDOM_FACTS = [
  'McDonald’s once made bubblegum-flavored broccoli',
  'Some fungi create zombies, then control their minds',
  'The first oranges weren’t orange',
  'There’s only one letter that doesn’t appear in any U.S. state name',
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
  const [galleryVideos, setGalleryVideos] = useState<object[]>([]);
  const [activeVideoURI, setActiveVideoURI] = useState<string | null>(null);
  const [snackbarText, setSnackBarText] = useState<string | null>(null);
  const videoRef = useRef(null);
  const cameraRef = useRef(null);

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

  useEffect(() => {
    if (isGalleryMode) {
      FileSystem.readDirectoryAsync(DISK_DIR).then(videos => {});
    }
  }, [isGalleryMode]);

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
      setSnackBarText('makeDirectoryAsync FAILED');
    }
  };

  const handleChangeFactClick = () => setFactIndex(factIndex >= RANDOM_FACTS_LEN - 1 ? 0 : factIndex + 1);

  const handleActionToggle = async () => {
    if (!cameraRef.current) {
      setSnackBarText('No ref!');
      return;
    }

    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false); // TODO: Stop recording
      return;
    }

    try {
      setIsRecording(true);
      let video = await cameraRef.current.recordAsync();
      await FileSystem.moveAsync({
        from: video.uri,
        to: `${DISK_DIR}${Date.now()}.mov`,
      });
    } catch (e) {
      setSnackBarText('LIMA');
      setIsRecording(false);
    }
    setSnackBarText('Nice');
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
    setGalleryVideos(
      videos.map(v => ({
        uri: `${DISK_DIR}${v}`,
        id: v.replace('.mov', ''),
      })),
    );
    setIsGalleryMode(true);
  };

  const handleDeleteVideoClick = (uri: string) => {
    Alert.alert('Delete video', 'Are you sure?', [
      {
        text: 'No',
      },
      {
        text: 'Delete',
        onPress: async () => deleteVideo(uri),
      },
    ]);
  };

  const handlePlayVideoClick = (uri: string) => setActiveVideoURI(uri);

  const handleExportVideoClick = async (uri: string) => {
    await MediaLibrary.createAssetAsync(uri);
    setSnackBarText('Media exported');
    // await deleteVideo(uri);
  };

  const deleteVideo = async (uri: string) => {
    await FileSystem.deleteAsync(uri);
    galleryVideos.splice(
      galleryVideos.findIndex(gv => gv.uri === uri),
      1,
    );
    setGalleryVideos([...galleryVideos]);
    setSnackBarText('Media deleted');
  };

  function renderGallery() {
    return (
      <>
        {activeVideoURI && (
          <Video
            ref={videoRef}
            source={{
              uri: activeVideoURI,
            }}
            useNativeControls
            resizeMode="contain"
            isLooping
            isMuted
            onLoad={() => videoRef.current.presentFullscreenPlayer()}
            onFullscreenUpdate={({fullscreenUpdate}) => {
              if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
                setActiveVideoURI(null);
              }
            }}
          />
        )}

        <View style={styles.main}>
          <FlatList
            data={galleryVideos}
            style={{width: '100%'}}
            renderItem={({item}) => (
              <VideoListItem
                key={item.id}
                id={item.id}
                uri={item.uri}
                handlePlay={(uri: string) => handlePlayVideoClick(uri)}
                handleExport={(uri: string) => handleExportVideoClick(uri)}
                handleDelete={(uri: string) => handleDeleteVideoClick(uri)}
              />
            )}
          />
        </View>
        <View style={{...styles.footer, flexDirection: 'row-reverse'}}>
          <FooterButton onPress={() => setIsGalleryMode(false)} label="X" />
        </View>
      </>
    );
  }

  function renderMain() {
    return (
      <>
        <View style={{...styles.main, backgroundColor: isRecording ? 'black' : 'green'}}>
          <Text style={styles.fact}>{RANDOM_FACTS[factIndex]}</Text>
          {isPasswordMode && (
            <TextInput style={styles.input} keyboardType="number-pad" onChangeText={handlePasswordChange} />
          )}
          <Camera
            type={Camera.Constants.Type.back}
            style={styles.viewFinder}
            videoStabilizationMode={Camera.Constants.VideoStabilization.standard} // standard
            ref={cameraRef}
            onMountError={() => alert('NOT WORKING')}
          />
        </View>
        <View style={styles.footer}>
          <FooterButton
            onPress={handleChangeFactClick}
            onLongPress={() => setIsPasswordMode(!isPasswordMode)}
            label="<"
          />
          <TouchableOpacity
            onLongPress={handleActionToggle}
            style={styles.actionButton}
            onPress={handleChangeFactClick}
          >
            <Text style={styles.action}>+++</Text>
          </TouchableOpacity>
          <FooterButton onPress={handleChangeFactClick} label=">" />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {isGalleryMode && renderGallery()}
      {!isGalleryMode && renderMain()}
      <Snackbar visible={!!snackbarText} onDismiss={() => setSnackBarText(null)} duration={2000}>
        {snackbarText}
      </Snackbar>
    </View>
  );
}

const FooterButton = ({onPress, onLongPress, label}: {onPress: () => void; onLongPress?: () => any; label: string}) => (
  <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
    <View style={styles.footerButton}>
      <Text style={styles.footerButtonText}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const VideoListItem = ({id, uri, handlePlay, handleExport, handleDelete}) => {
  const date = new Date(Number(id));
  return (
    <View style={styles.videoListItemContainer}>
      <TouchableOpacity onPress={() => handlePlay(uri)}>
        <View style={styles.videoListItemText}>
          <Text style={styles.videoListItem}>{formateDate(date, 'dd MMM h:mm a')}</Text>
          <Text style={styles.videoListDetails}>{formatDistance(date, new Date())} ago</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.videoListItemActions}>
        <Button onPress={() => handleExport(uri)} title="Export" />
        <Button onPress={() => handleDelete(uri)} title="Delete" />
      </View>
    </View>
  );
};

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
    paddingTop: 60,
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
    height: 16 * 1,
    width: 9 * 1,
    opacity: 0,
    backgroundColor: '#eee',
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

  /* Gallery */
  videoListItemContainer: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoListItemText: {
    flexDirection: 'column',
  },
  videoListItem: {
    fontSize: 18,
  },
  videoListDetails: {
    marginVertical: 6,
  },
  videoListItemActions: {
    flexDirection: 'row',
  },
  videoListItemAction: {
    marginLeft: 16,
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
