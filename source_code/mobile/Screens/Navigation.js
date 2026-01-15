// Navigation.js
import React from 'react';
import config from "../config.json"
import { NavigationContainer, DefaultTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Changed this line
import Transactions from './Transactions';
import Jobs from './Jobs';
import Settings from './Settings';
import Preferences from './Preferences';
import JobsWithTutorial from '../Components/JobsWithTutorial';
import Clients from './Clients';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: config.app.theme.purple, // Tab icon tint
    // background: config.app.theme.blue,
    // card: config.app.theme.creme, // Creme: top and bottom theme
    text: 'black', 
    border: 'gray', // thin lines around creme 
  },
};

const Tab = createBottomTabNavigator();

const Navigation = (props) => {
  return (
    <NavigationContainer theme={MyTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Jobs') {
              iconName = focused ? 'construct' : 'construct-outline';
            } else if (route.name === 'Transactions') {
              iconName = focused ? 'card' : 'card-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Clients') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />; // Changed Icon to Ionicons
          }
          //headerShown: false, // Hide the header if not needed
        })}
      >
        {/* <Tab.Screen name="Transactions" children={()=>
            <Transactions userId = {props.uid}/>}/> */}
        <Tab.Screen name="Jobs" children={()=>
          <JobsWithTutorial rates = {props.rates} setTriggerEffect = {props.setTriggerEffect} setIsNewUser = {props.setIsNewUser} userId = {props.uid} state = {props.state} isNewUser = {props.isNewUser}/>}/>
        <Tab.Screen name="Clients" children={()=>
          <Clients userId = {props.uid} isNewUser={props.isNewUser}></Clients>}/>
        <Tab.Screen name="Settings" children={()=>
          <Preferences state = {props.state} setState = {props.setState} userId = {props.uid} deleteAccount = {props.deleteAccount} logout = {props.logout}/>}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;