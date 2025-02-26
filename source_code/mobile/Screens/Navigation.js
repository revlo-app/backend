// Navigation.js
import React from 'react';
import config from "../app.json"
import { NavigationContainer, DefaultTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Transactions from './Transactions';
import Jobs from './Jobs';
import Settings from './Settings';
import Preferences from './Preferences';
import JobsWithTutorial from '../Components/JobsWithTutorial';

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
            }
            else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            
            return <Icon name={iconName} size={size} color={color} />;
          }
      
          //headerShown: false, // Hide the header if not needed
        })}
      >
        {/* <Tab.Screen name="Transactions" children={()=>
            <Transactions userId = {props.uid}/>}/> */}
        <Tab.Screen name="Jobs" children={()=>
            <JobsWithTutorial setTriggerEffect = {props.setTriggerEffect} setIsNewUser = {props.setIsNewUser} userId = {props.uid} state = {props.state} isNewUser = {props.isNewUser}/>}/>
        <Tab.Screen name="Settings" children={()=>
            <Preferences state = {props.state} setState = {props.setState} userId = {props.uid} deleteAccount = {props.deleteAccount} logout = {props.logout}/>}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
