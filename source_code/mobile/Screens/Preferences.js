import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { 
  Button, 
  Modal, 
  Portal, 
  Provider, 
  Title, 
  Paragraph,
  Searchbar,
  List,
  Divider
} from 'react-native-paper';

const Preferences = (props) => {
  // Keyboard open, then hide stuff to fix android bug    
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  // Update this line to use props.state
const [selectedStateCode, setSelectedStateCode] = useState(props.state);



  // State selection
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [stateModalVisible, setStateModalVisible] = useState(false);
  
  // Map of state names to their two-letter codes
  const US_STATES = [
    { name: 'Alabama', code: 'AL' },
    { name: 'Alaska', code: 'AK' },
    { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' },
    { name: 'California', code: 'CA' },
    { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' },
    { name: 'Delaware', code: 'DE' },
    { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' },
    { name: 'Hawaii', code: 'HI' },
    { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' },
    { name: 'Kentucky', code: 'KY' },
    { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' },
    { name: 'Maryland', code: 'MD' },
    { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' },
    { name: 'Minnesota', code: 'MN' },
    { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' },
    { name: 'Montana', code: 'MT' },
    { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' },
    { name: 'New Hampshire', code: 'NH' },
    { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' },
    { name: 'New York', code: 'NY' },
    { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' },
    { name: 'Ohio', code: 'OH' },
    { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' },
    { name: 'Pennsylvania', code: 'PA' },
    { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' },
    { name: 'South Dakota', code: 'SD' },
    { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' },
    { name: 'Utah', code: 'UT' },
    { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' },
    { name: 'Washington', code: 'WA' },
    { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' },
    { name: 'Wyoming', code: 'WY' }
  ];

  // Get state name from code for display
  const getStateNameFromCode = (code) => {
    if (!code) return 'Select your state';
    const state = US_STATES.find(state => state.code === code);
    return state ? state.name : 'Select your state';
  };

  const selectedStateName = getStateNameFromCode(selectedStateCode);

  const filteredStates = US_STATES.filter(state => 
    state.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
    state.code.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardOpen(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardOpen(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const navigation = useNavigation();

  const handleLogout = () => {
    setLogoutModalVisible(false);
    props.logout();
  };

  const handleDeletion = () => {
    setDeleteModalVisible(false);
    props.deleteAccount(password);
  };

const handleStateSelect = (stateCode) => {
  setSelectedStateCode(stateCode);
  setStateModalVisible(false);
  // Make sure your setState prop function is called with the new value
  props.setState(stateCode);
};



  const showLogoutModal = () => setLogoutModalVisible(true);
  const hideLogoutModal = () => setLogoutModalVisible(false);
  
  const showDeleteModal = () => setDeleteModalVisible(true);
  const hideDeleteModal = () => setDeleteModalVisible(false);
  
  const showStateModal = () => setStateModalVisible(true);
  const hideStateModal = () => setStateModalVisible(false);

  return (
    <Provider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.preferencesContainer}>
            <Title style={styles.title}>Your Preferences</Title>
            
            {/* State Selection Section */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Location Settings</Text>
              <Button 
                mode="outlined" 
                onPress={showStateModal} 
                style={styles.stateButton}
                icon="map-marker"
              >
                {selectedStateName} {selectedStateCode ? `(${selectedStateCode})` : ''}
              </Button>
            </View>

            <Divider style={styles.divider} />
            
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>Account Management</Text>
            </View>
          </View>
          
          <View style = {{display: 'flex', flexDirection: "column", alignItems: 'center', justifyContent: "center"}}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/9f57b526-c58a-44e0-b64a-2c1073ffcd8d')}>
    <Text style={{ color: 'gray', textDecorationLine: 'underline' }}>
      Privacy Policy
    </Text>
  </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={showLogoutModal} 
              icon="logout"
              style={styles.actionButton}
            >
              Logout
            </Button>
            <Button 
              mode="contained" 
              onPress={showDeleteModal} 
              icon="delete"
              style={[styles.actionButton, styles.dangerButton]}
              contentStyle={{backgroundColor: '#d32f2f'}}
            >
              Delete Account
            </Button>
          </View>
          </View>


          {/* Logout Confirmation Modal */}
          <Portal>
            <Modal 
              visible={logoutModalVisible} 
              onDismiss={hideLogoutModal}
              contentContainerStyle={styles.modalContainer}
            >
              <Title style={styles.modalTitle}>Confirm Logout</Title>
              <Paragraph style={styles.modalText}>
                Are you sure you want to log out?
              </Paragraph>
              <View style={styles.modalButtons}>
                <Button 
                  mode="text" 
                  onPress={hideLogoutModal}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleLogout}
                  style={styles.modalButton}
                >
                  Logout
                </Button>
              </View>
            </Modal>
          </Portal>

          {/* Delete Account Modal */}
          <Portal>
            <Modal 
              visible={deleteModalVisible} 
              onDismiss={hideDeleteModal}
              contentContainerStyle={styles.modalContainer}
            >
              <Title style={styles.modalTitle}>Delete Your Account</Title>
              <Paragraph style={styles.modalText}>
                This action cannot be undone.
              </Paragraph>
              <TextInput
                placeholder="Please confirm your password"
                placeholderColor="#c4c3cb"
                style={styles.passwordInput}
                autoCapitalize="none"
                secureTextEntry={true}
                autoCorrect={false}
                onChangeText={(text) => setPassword(text)}
              />
              <View style={styles.modalButtons}>
                <Button 
                  mode="text" 
                  onPress={hideDeleteModal}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleDeletion}
                  style={[styles.modalButton, styles.dangerButtonText]}
                  contentStyle={{backgroundColor: '#d32f2f'}}
                >
                  Delete
                </Button>
              </View>
            </Modal>
          </Portal>

          {/* State Selection Modal */}
{stateModalVisible && (
  <Portal>
    <TouchableWithoutFeedback onPress={hideStateModal}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.centeredStateModalContainer}>
            <Title style={styles.modalTitle}>Select Your State</Title>
            <Searchbar
              placeholder="Search states..."
              onChangeText={text => setStateSearchQuery(text)}
              value={stateSearchQuery}
              style={styles.searchBar}
            />
            <ScrollView style={styles.stateList}>
              {filteredStates.map((state) => (
                <List.Item
                  key={state.code}
                  title={`${state.name} (${state.code})`}
                  onPress={() => handleStateSelect(state.code)}
                  style={state.code === selectedStateCode ? styles.selectedStateItem : null}
                  left={props => state.code === selectedStateCode ? <List.Icon {...props} icon="check" /> : null}
                />
              ))}
            </ScrollView>
            <Button 
              mode="text" 
              onPress={hideStateModal}
              style={styles.closeStateButton}
            >
              Cancel
            </Button>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Portal>
)}
        </View>
      </TouchableWithoutFeedback>
    </Provider>
  );
};

const styles = StyleSheet.create({
  // Add these new styles to your StyleSheet
modalOverlay: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
centeredStateModalContainer: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 12,
  elevation: 5,
  width: '90%',
  maxHeight: '80%',
  maxWidth: 500,
},
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
  },
  preferencesContainer: {
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 28 : 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  preferenceSection: {
    marginBottom: 24,
  },
  accountSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 20 : 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  stateButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  dangerButtonText: {
    color: 'white',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    elevation: 5,
    height: '50%',

  },
  stateModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordInput: {
    height: 50,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 18 : 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalButton: {
    marginLeft: 8,
  },
  searchBar: {
    marginVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  stateList: {
    maxHeight: 400,
    marginVertical: 8,
  },
  selectedStateItem: {
    backgroundColor: '#f0f9ff',
  },
  closeStateButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
});

export default Preferences;