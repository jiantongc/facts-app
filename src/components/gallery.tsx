import React, {useState, useEffect, useRef} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {Video} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {parse as parseDate} from 'date-fns';

import VideoListItem, {getFileSizeString} from './video-list-item';
import FooterButton from './footer-button';

import {FILE_DATE_FORMAT} from '../constants';

export default function Gallery({onClose, setSnackBarText, diskDir}) {
  const [galleryVideos, setGalleryVideos] = useState<object[]>([]);
  const [activeVideoURI, setActiveVideoURI] = useState<string | null>(null);
  const [size, setSize] = useState('');

  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      await MediaLibrary.requestPermissionsAsync();
      const videos = await FileSystem.readDirectoryAsync(diskDir);
      const d = new Date();
      setGalleryVideos(
        videos
          .map(v => {
            const fileNameDate = parseDate(v.replace('.mov', ''), FILE_DATE_FORMAT, d);
            const id = isNaN(fileNameDate.valueOf()) ? v : fileNameDate.getTime().toString();
            return {
              uri: `${diskDir}${v}`,
              id,
            };
          })
          .sort(({id: idA}, {id: idB}) => (idB < idA ? -1 : 1)),
      );

      const size = (await FileSystem.getInfoAsync(diskDir)).size || 0;
      setSize(getFileSizeString(size));
    })();
  }, [galleryVideos.length]);

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

  const handleExportAllClick = async () => {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    const neededSpace = (await FileSystem.getInfoAsync(diskDir)).size || 0;

    // Check if its enough space, with 200MB threshold
    if (freeSpace - neededSpace < 200000000) {
      return setSnackBarText('Not enough space');
    }

    Alert.alert('Export all', 'Confirm?', [
      {
        text: 'No',
      },
      {
        text: 'Export',
        onPress: async () => {
          const exportPromises = galleryVideos.map(({uri}) => MediaLibrary.createAssetAsync(uri));
          try {
            await Promise.all(exportPromises);
            setSnackBarText('All out');
          } catch (e) {
            setSnackBarText('Error, some might already out');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
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
          shouldPlay
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
      <View style={styles.footer}>
        <FooterButton disabled={!galleryVideos.length} onPress={handleExportAllClick} label={`Out All (${size})`} />
        <FooterButton onPress={onClose} label="X" />
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
});
