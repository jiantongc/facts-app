import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import formateDate from 'date-fns/format';
import {formatDistance} from 'date-fns';
import * as FileSystem from 'expo-file-system';

const VideoListItem = ({id, uri, handlePlay, handleExport, handleDelete}) => {
  const date = new Date(Number(id));
  const [size, setSize] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const details = await FileSystem.getInfoAsync(uri);
        setSize(getFileSizeString(details.size));
      } catch (e) {
        /*  */
      }
    })();
  }, [uri]);

  return (
    <View style={styles.videoListItemContainer}>
      <TouchableOpacity onPress={() => handlePlay(uri)}>
        <View style={styles.videoListItemText}>
          <Text style={styles.videoListItem}>
            {formateDate(date, 'dd MMM h:mm a')} <Text style={styles.size}>{size}</Text>
          </Text>
          <Text style={styles.videoListDetails}>{formatDistance(date, new Date())} ago</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.videoListItemActions}>
        <Button onPress={() => handleExport(uri)} title="Out" />
        <Button onPress={() => handleDelete(uri)} title="Delete" />
      </View>
    </View>
  );
};

export function getFileSizeString(bytes = 0, si = true, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
}

const styles = StyleSheet.create({
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
  size: {
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default VideoListItem;
