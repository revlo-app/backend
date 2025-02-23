// Navigation.js
import React from 'react';
import config from "../app.json"
import { NavigationContainer, DefaultTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Transactions from './Transactions';
import Jobs from './Jobs';
import Settings from './Settings';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: config.app.theme.red, // Tab icon tint
    background: config.app.theme.blue, // background color is what?
    card: config.app.theme.creme, // Creme: top and bottom theme
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
              iconName = focused ? 'cart' : 'cart-outline';
            } else if (route.name === 'Transactions') {
              iconName = focused ? 'list' : 'list-outline';
            }
            else if (route.name === 'Settings') {
              iconName = focused ? 'list' : 'list-outline';
            }
            
            return <Icon name={iconName} size={size} color={color} />;
          }
      
          //headerShown: false, // Hide the header if not needed
        })}
      >
        <Tab.Screen name="Transactions" children={()=>
            <Transactions userId = {props.uid}/>}/>
        <Tab.Screen name="Jobs" children={()=>
            <Jobs userId = {props.uid}/>}/>
        <Tab.Screen name="Settings" children={()=>
            <Settings userId = {props.uid}/>}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
