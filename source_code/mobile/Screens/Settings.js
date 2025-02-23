import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import config from "../app.json"
const API_URL = config.app.api
import * as Linking from 'expo-linking';

const Settings = ({ userId }) => {
    const [authUrl, setAuthUrl] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/create_link`)
            .then(res => res.json())
            .then(data => setAuthUrl(data.authUrl))
            .catch(err => console.error('Failed to fetch auth link', err));
    }, []);

    const handleConnectCard = () => {
        if (authUrl) {
            Linking.openURL(authUrl);
        } else {
            Alert.alert('Error', 'Failed to load authorization link.');
        }
    };

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
                body: JSON.stringify({ userId, token }),
            });
        } else {
            Alert.alert('Must use physical device for Push Notifications');
        }
    };

    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    return (
        <View>
            <Text>Settings</Text>
            <Button title="Connect/Update Card" onPress={handleConnectCard} />
        </View>
    );
};

export default Settings;
