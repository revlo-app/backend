
import {Image, AppState, Platform, Modal, View, StyleSheet, Text, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, Linking} from 'react-native';
import Navigation from './Screens/Navigation';
import Login from './Components/Login';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react'
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ConfettiScreen from './Components/ConfettiScreen.js';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
const API_URL = config.app.api
import * as Location from 'expo-location';



import config from "./app.json"
const BASE_URL = config.app.api
import Purchases from 'react-native-purchases';



// Demo video url
const DEMO_URL = "https://youtu.be/udKK51jYs7M"

// RevCat API
const APPL_API = "appl_iymEcrjJXGyUyYLMNqGXZYiaKvP"
const GOOG_API = "goog_NxhhAZhHJkJSHDfsFAPtYIyEClP"

export default function App() {

  const getStateFromCoordinates = async (latitude, longitude) => {
    try {
      // Use reverse geocoding to get address details from coordinates
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
  
      // Extract the region/state information
      if (response.length > 0) {
        const { region } = response[0];
        
        // Map of full state names to their 2-character codes
        const stateMap = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
          'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
          'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
          'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
          'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
          'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
          'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
          'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
          'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
          'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
          'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
        };
        
        return stateMap[region] || region;
      }
      return 'NY';
    } catch (error) {
      console.error('Error getting state from coordinates:', error);
      return 'NY';
  
    }
  };

  useEffect(() => {
    (async () => {
      if (state) return;
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Location permission not granted');
        setState('NY');
  
        return;
      }
  
        // Get the current location
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // Get the state code from coordinates
        const code = await getStateFromCoordinates(latitude, longitude);
        
        if (code) {
          setState(code);
        }
        else {
          setState('NY');
        }
      
    })();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            Alert.alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;

        await fetch(`${API_URL}/notifications/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, token: token }),
        });
    } else {
        Alert.alert('Must use physical device for Push Notifications');
    }
};


  const [authenticated, setAuthenticated] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Booting state - while we try to connect to server.
  const [showSplash, setShowSplash] = useState(true)

  // Confetti effect
  const [triggerEffect, setTriggerEffect] = useState(false);
  


  const [tokens, setTokens] = useState(0)

  // user object we get from logging in
  const [user, setUser] = useState()
  const [rates, setRates] = useState()
  

  const [init, setInit] = useState(true)

  // is this the help modal?
  const [isModalVisible, setModalVisible] = useState(false)


  // Help modal text: Contact message
  const [textInputValue, setTextInputValue] = useState('');

  // My state
  const [state, setState] = useState()

  

  

  // Help modal
  const handleChangeText = (text) => {
    setTextInputValue(text);
  };

  // Submit help message
  const handleSubmit = () => {
    // Close modal
    closeModal();

    // Send the message
    axios.post(`${BASE_URL}/contact`, {msg: textInputValue, uid: user._id, email: user.email})
    .then(() => {
      alert("Your message was recieved!")
    })
    .catch(() => {
      alert(`We're sorry, there was an error.\nPlease email ${config.app.email}`)
    })
    setTextInputValue('');
  };



  const handleAppStateChange = newState => {
    if (newState === 'active') {
      // App opened. User is not dormat.
      // If we need this depends on if we reach /user when opening the app, even if it's in the background will it run /user again?
      // probably not... 
      if (user?._id)
        axios.post(`${BASE_URL}/appOpened`, {user_id: user._id})
    }
    

  };

  useEffect(() => {
    // Subscribe to AppState changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    //console.log("Opened")

    // Clean up subscription when component unmounts
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  
  

  // Hide / show the help modal
  const showHelpModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };


  // Log out through preference page
  function logOut()
  {
    AsyncStorage.removeItem('token')
    setAuthenticated(false)
  }

   // Delete account through preference page
   function deleteAccount(password)
   {
    AsyncStorage.getItem('token')
    .then((id) => {

      axios.post(`${BASE_URL}/deleteAccount`, {id: id, password: password})
      .then((res) => {
        // Deleted account successfully, logout now
        AsyncStorage.removeItem('token')
        setAuthenticated(false)

      })
      .catch((e) => {
        // could not delete, display error
        if (e.response.status == 400)
        {
          alert("Failed to delete your account. Your password was incorrect.")

        }
        else if (e.response.status == 404)
        {
          alert("Failed to delete your account: User not found")

        }
        else{
          alert("Failed to delete your account. Please try again later")

        }
        
        console.log("Error deleting account:", e.response.status)
      })
     

    })
    
   }

  

  

  // On first load, get values from storage and restore state
  if (init)
  {
    setInit(false)

    console.log('initializing')

    // Load user data from DB
    // if we have the token, we have their db content (todo)
    AsyncStorage.getItem('token').then(value => {
      if (value)
      {
        logIn(value)
      }
      else
      {
        // We are not log in, hide the splash screen (to present the login page)
        setShowSplash(false)
      }
    })
    

    // Initialize preferences
    // Prefs are to be saved after modifying one: set state variable and store
    AsyncStorage.getItem('preferences').then(value => {
      if(value)
        setPreferences(JSON.parse(value))
    })


  }

// middleware Login from login screen: Must set token because it definitely is not set
function loggedIn(token, isNewUser)
{
  AsyncStorage.setItem('token', token)
  registerForPushNotificationsAsync();
  logIn(token, isNewUser) // stores user data locally
}

// function to update a user's state to a new string in the mongo database for the user
function updateState(newState)
{
  axios.post(`${BASE_URL}/updateState`, {userId: user._id, state: newState})
  .then(() => {
    setState(newState)
  })
  .catch((e) => {
    console.log('Error updating state:', e)
  })
}
// Log in: load user data and authenticate
function logIn(token, isNewUser)
{
  setIsNewUser(isNewUser ?? false)
  
  // get user info from the database. This can load paid features, etc
  axios.post(`${BASE_URL}/user`, {user_id: token})
  .then(async (res) => {

    setRates(res.data.rates)

    setTokens(res.data.tokens)
    setSubscribed(res.data.user.subscribed)

    // bundle all above into single object
    setUser(res.data.user)
    setState(res.data.user.state)
    

    // Allow purchasing subscriptions
    // this can happen as soon as we get the user id
    try {
      if (Platform.OS === 'ios')
      {
        await Purchases.configure({apiKey: APPL_API, appUserID: token})
      }
      else
      {
        await Purchases.configure({apiKey: GOOG_API, appUserID: token})
      }
    }
    catch {
      console.log("RevenueCat failed to initialize")
    }
    
    
    setAuthenticated(true)
    setShowSplash(false) // we finished our attempt to login, so we can hide the splash screen
    
  })
  .catch((e) => {
    console.log('Error in logIn app.js: ', e)
    
  })
}

// Purchase subscription
const purchase = async () => {
  try {
      // Try to make the purchase
      //Purchases.getOfferings()
      products = await Purchases.getProducts(['cards']);
      product = products[0]
      //console.log(product)
      try {
        const {customerInfo, productIdentifier} = await Purchases.purchaseStoreProduct(product);
        if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
          // Successfull purchase, grant tokens
          axios.post(`${BASE_URL}/newSubscriber`, {user_id: user._id})
          .then((response) => {
            // Update tokens locally
            setTokens(response.data.tokens)
            setSubscribed(true)
            console.log("Subscribed!")

            // UI feedback here for subscription

          })
          .catch((e) => {
            // User was charged, but my server made an error
            // issue refund / log the error
            console.log(e)
          })
        }
        else
        {
          //console.log("LOCKED")
        }
      } catch (e) {
        if (!e.userCancelled) {
          console.log(e)
        }
      }

      
      
  }
  catch(e)
  { // User canceled, no wifi etc
      alert('Error Purchasing. You were not charged.')
  }
}




// show splash while we wait to connect to server

if (showSplash)
  {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('./assets/splash.png')}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      </View>
    )
  }

  if (authenticated)
  {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
          {/* Navigation is the actual Screen which gets displayed based on the tab cosen */}
          <Navigation rates = {rates} setTriggerEffect= {setTriggerEffect} setIsNewUser = {setIsNewUser} isNewUser = {isNewUser}state = {state} setState={updateState} uid = {user._id} help = {showHelpModal} deleteAccount = {deleteAccount} subscribed = {subscribed} purchase = {purchase} logout = {logOut} tokens = {tokens}></Navigation>
          
          <ConfettiScreen
            trigger={triggerEffect}
            onComplete={() => {setTriggerEffect(false)}}
            message="Instant Match!"
          />
          
          {/* Help Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.modalContent}>
                {/* Title and Close Button */}
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Help</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>

{/* Main Content view (Top / button) */}
              <View style = {{flex:1, justifyContent: 'space-between'}}>
{/* Message Content */}
              <View style ={{marginTop: '5%'}}>
              <Text style={styles.text}>Have a comment / concern?</Text>
                <TextInput
                  style={{
                    height: Platform.OS === 'ios' && Platform.isPad ? 300 : 190,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'gray',
                    padding: 10,
                    margin: 5,
                    fontSize: Platform.OS === 'ios' && Platform.isPad ? 25 : 14
                  }}
                  multiline={true}
                  numberOfLines={10}
                  value={textInputValue}
                  onChangeText={handleChangeText}
                />
                {(textInputValue && 
                <TouchableOpacity onPress={() => handleSubmit()} style={styles.demoButton}>
                  <Text style={styles.buttonText}>Send Message</Text>
                </TouchableOpacity>
                )}
              </View>

                    {/* Tutorial appears on the button  */}
              <View>
                <Text style={styles.text}>Or, watch a video app walkthrough</Text>

                <TouchableOpacity onPress={() => {Linking.openURL(DEMO_URL)
      .catch((err) => console.error('An error occurred', err))}} style={styles.demoButton}>
                  <Text style={styles.buttonText}>Watch Tutorial</Text>
                </TouchableOpacity>
              </View>

              </View>
              {/* Above ends the main content view (top and bottom) */}
                
              </View>
              </TouchableWithoutFeedback>
            </View>
          </Modal>
        </PaperProvider>
        </GestureHandlerRootView>
    );
  }
  return(
    <Login login = {loggedIn} api = {BASE_URL}></Login>
  )

  
}

const styles = StyleSheet.create({
  buttonText: {
    color: '#fff', // White color for text on the button
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  demoButton: {
    backgroundColor: '#2196F3', // Blue color for Subscribe button
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 40 : 18,
    textAlign: 'center',
  },
  text: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 25 : 18,
    textAlign: 'center',
  },
  
  closeButton: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'lightgray',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  
});
