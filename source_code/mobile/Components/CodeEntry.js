import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import config from "../config.json";

const CELL_COUNT = 5;

const CodeEntry = ({ fulfilled, status, back }) => {
  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  // Handle code completion
  React.useEffect(() => {
    if (value.length === CELL_COUNT) {
      fulfilled(value);
    }
  }, [value, fulfilled]);

  // Return to login
  function handlePress() {
    // back button
    back();
  }

  return (
    <View style={styles.containerView} behavior="padding">
      <View style={styles.loginScreenContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          style={{ margin: Platform.OS === 'ios' && Platform.isPad ? 50 : 25, padding: 15 }} 
          onPress={handlePress}
        >
          <Text style={styles.button}>{'<'}</Text>
        </TouchableOpacity>
        
        <View style={styles.loginFormView}>
          <Text style={styles.logoText}>{config.expo.name}</Text>
          <Text style={styles.errorText}>{status}</Text>
          
          <CodeField
            ref={ref}
            {...props}
            value={value}
            onChangeText={setValue}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'number-pad'}
            textContentType="oneTimeCode"
            autoFocus={true}
            renderCell={({ index, symbol, isFocused }) => (
              <Text
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}
              >
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            )}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    alignItems: "center"
  },
  loginScreenContainer: {
    flex: 1,
    width: "100%",
    top: -100
  },
  logoText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 65 : 40,
    fontWeight: "100",
    marginTop: 150,
    marginBottom: 30,
    textAlign: "center",
  },
  errorText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 25 : 18,
    fontWeight: "200",
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 40,
    textAlign: "center",
  },
  loginFormView: {
    flex: 1,
  },
  loginFormTextInput: {
    height: Platform.OS === 'ios' && Platform.isPad ? 76 : 43,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 24 : 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fafafa",
    paddingLeft: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  loginButton: {
    backgroundColor: "#3897f1",
    borderRadius: 5,
    height: Platform.OS === 'ios' && Platform.isPad ? 65 : 45,
    marginTop: 10,
    width: 350,
    alignItems: "center"
  },
  container: {
    marginTop: 50,
    marginBottom: -50,
  },
  button: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 38 : 24,
  },
  // New styles for code field
  codeFieldRoot: {
    marginTop: 20,
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'center',
  },
  cell: {
    width: Platform.OS === 'ios' && Platform.isPad ? 60 : 50,
    height: Platform.OS === 'ios' && Platform.isPad ? 60 : 50,
    lineHeight: Platform.OS === 'ios' && Platform.isPad ? 58 : 48,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 32 : 24,
    borderWidth: 1.5,
    borderColor: 'rgba(67, 121, 209, 1.3)',
    textAlign: 'center',
    borderRadius: 5,
    marginHorizontal: 4,
  },
  focusCell: {
    borderColor: 'rgba(67, 121, 209, 1)',
    borderWidth: 2,
  },
});

export default CodeEntry;