import moment from 'moment';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { CONST, Transaction } from 'app/consts';
import { typography, palette } from 'app/styles';

const i18n = require('../../loc');

export const TransactionItem = ({ item, onPress }: { item: Transaction; onPress: (item: any) => void }) => {
  const confirmations = () => {
    return i18n.transactions.list.conf + ': ' + (item.confirmations < 7 ? item.confirmations : '6') + '/6 ';
  };
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)}>
      <View style={styles.leftColumn}>
        <Text style={[typography.headline5, {color: palette.textOrange}]} numberOfLines={1}>
          {item.walletLabel === CONST.allWallets ? i18n.transactions.details.noLabel : item.walletLabel}
        </Text>
        {!!item.note && <Text style={[typography.caption, {color: palette.textWhiteMuted}]}>{item.note}</Text>}
        <Text style={styles.label}>{confirmations()}</Text>
        <Text style={styles.label}>{moment(item.received).format('LT')}</Text>
      </View>
      <View style={styles.rightColumn}>
        <Text style={[typography.headline5, { color: item.value < 0 ? palette.textRed : palette.textGreen }]}>
          {i18n.formatBalanceWithoutSuffix(Number(item.value), item.walletPreferredBalanceUnit)}
        </Text>
        <Text style={[typography.headline5, { color: item.value < 0 ? palette.textRed : palette.textGreen }]}>
          {item.walletPreferredBalanceUnit}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    ...typography.caption,
    color: palette.white,
  },
  leftColumn: { justifyContent: 'space-between', maxWidth: '75%' },
  rightColumn: { alignItems: 'flex-end' },
});
