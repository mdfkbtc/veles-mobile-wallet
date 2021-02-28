/* global alert */
import AsyncStorage from '@react-native-community/async-storage';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  Alert,
  Text,
  LayoutAnimation,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
  TextInput,
} from 'react-native';
import { RadioGroup, RadioButton } from 'react-native-flexi-radio-button';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import {
  BlueTextCentered,
  BlueText,
  BitcoinButton,
  BlueFormLabel,
  BlueButton,
  SafeBlueArea,
  BlueFormInput,
  BlueNavigationStyle,
  BlueButtonLinkUrl,
  BlueSpacing20,
  BlueSpacing10,
} from '../../BlueComponents';
import { AppStorage, HDSegwitBech32Wallet, SegwitP2SHWallet } from '../../class';
import { HDLegacyP2PKHWallet } from '../../class/hd-legacy-p2pkh-wallet';
import { HDSegwitP2SHWallet } from '../../class/hd-segwit-p2sh-wallet';

const BlueApp = require('../../BlueApp');
const A = require('../../analytics');
const EV = require('../../events');
/** @type {AppStorage} */
const loc = require('../../loc');

export default class WalletsAdd extends Component {
  static navigationOptions = ({ navigation }) => ({
    ...BlueNavigationStyle(navigation, true),
    title: loc.wallets.list.add,
    headerLeft: null,
  });

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      walletBaseURI: '',
    };
  }

  async componentDidMount() {
    let walletBaseURI = await AsyncStorage.getItem(AppStorage.LNDHUB);
    const isAdvancedOptionsEnabled = !!(await AsyncStorage.getItem(AppStorage.ADVANCED_MODE_ENABLED));
    walletBaseURI = walletBaseURI || '';

    this.setState({
      isLoading: false,
      activeBitcoin: true,
      label: '',
      isAdvancedOptionsEnabled,
      walletBaseURI,
    });
  }

  setLabel(text) {
    this.setState({
      label: text,
    }); /* also, a hack to make screen update new typed text */
  }

  onSelect(index, value) {
    this.setState({
      selectedIndex: index,
      selectedValue: value,
    });
  }

  showAdvancedOptions = () => {
    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({ isAdvancedOptionsEnabled: true });
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{ flex: 1, paddingTop: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <SafeBlueArea forceInset={{ horizontal: 'always' }} style={{ flex: 1, paddingTop: 40 }}>
        <KeyboardAvoidingView enabled behavior={Platform.OS === 'ios' ? 'position' : null} keyboardVerticalOffset={20}>
          <BlueFormLabel>
            {loc.wallets.add.wallet_name.slice(0, 1).toUpperCase() +
              loc.wallets.add.wallet_name.slice(1, loc.wallets.add.wallet_name.length)}
          </BlueFormLabel>
          <View
            style={{
              flexDirection: 'row',
              borderColor: BlueApp.settings.inputBorderColor,
              borderWidth: 1.0,
              borderBottomWidth: 0.5,
              backgroundColor: BlueApp.settings.inputBackgroundColor,
              minHeight: 44,
              height: 44,
              marginHorizontal: 20,
              alignItems: 'center',
              marginVertical: 16,
              borderRadius: 4,
            }}>
            <TextInput
              value={this.state.label}
              placeholderTextColor={BlueApp.settings.alternativeTextColor}
              placeholder="My first wallet"
              onChangeText={text => {
                this.setLabel(text);
              }}
              style={{ flex: 1, marginHorizontal: 8, color: BlueApp.settings.foregroundColor }}
              editable={!this.state.isLoading}
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={{ marginHorizontal: 20 }}>
            {(() => {
              if (this.state.activeBitcoin && this.state.isAdvancedOptionsEnabled) {
                return (
                  <View
                    style={{
                      height: 140,
                    }}>
                    <BlueSpacing20 />
                    <Text style={{ color: '#ffffff', fontWeight: '500' }}>{loc.settings.advanced_options}</Text>
                    <RadioGroup
                      color={'#e4b99c'}
                      onSelect={(index, value) => this.onSelect(index, value)}
                      selectedIndex={0}>
                      <RadioButton value={HDLegacyP2PKHWallet.type}>
                        <BlueText>{HDLegacyP2PKHWallet.typeReadable}</BlueText>
                      </RadioButton>
                      <RadioButton value={HDSegwitP2SHWallet.type}>
                        <BlueText>{HDSegwitP2SHWallet.typeReadable}</BlueText>
                      </RadioButton>
                      <RadioButton value={HDSegwitBech32Wallet.type}>
                        <BlueText>{HDSegwitBech32Wallet.typeReadable}</BlueText>
                      </RadioButton>
                    </RadioGroup>
                  </View>
                );
              } else if (this.state.activeBitcoin === undefined && this.state.isAdvancedOptionsEnabled) {
                return <View />;
              }
            })()}
            <View
              style={{
                alignItems: 'center',
                flex: 1,
                marginVertical: 50,
              }}>
              {!this.state.isLoading ? (
                <BlueButton
                  title={loc.wallets.add.create}
                  disabled={this.state.activeBitcoin === undefined}
                  onPress={() => {
                    this.setState(
                      { isLoading: true },
                      async () => {
                        let w;
                        if (this.state.selectedIndex === 2) {
                          // btc was selected
                          // index 2 radio - hd bip84
                          w = new HDSegwitBech32Wallet();
                          w.setLabel(this.state.label || loc.wallets.details.title);
                        } else if (this.state.selectedIndex === 1) {
                          // btc was selected
                          // index 1 radio - segwit single address
                          w = new HDSegwitP2SHWallet();
                          w.setLabel(this.state.label || loc.wallets.details.title);
                        } else {
                          // zero index radio - HD segwit
                          w = new HDLegacyP2PKHWallet();
                          w.setLabel(this.state.label || loc.wallets.details.title);
                        }
                        if (this.state.activeBitcoin) {
                          await w.generate();
                          BlueApp.wallets.push(w);
                          await BlueApp.saveToDisk();
                          EV(EV.enum.WALLETS_COUNT_CHANGED);
                          ReactNativeHapticFeedback.trigger('notificationSuccess', {
                            ignoreAndroidSystemSettings: false,
                          });
                          if (
                            w.type === HDSegwitP2SHWallet.type ||
                            w.type === HDSegwitBech32Wallet.type ||
                            w.type === HDLegacyP2PKHWallet.type
                          ) {
                            this.props.navigation.navigate('PleaseBackup', {
                              secret: w.getSecret(),
                            });
                          } else {
                            this.props.navigation.dismiss();
                          }
                        }
                      },
                      1,
                    );
                  }}
                />
              ) : (
                <ActivityIndicator />
              )}
            </View>
            <BlueButtonLinkUrl
              title={loc.wallets.add.import_wallet}
              onPress={() => {
                this.props.navigation.navigate('ImportWallet');
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeBlueArea>
    );
  }
}

WalletsAdd.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
    dismiss: PropTypes.func,
  }),
};
