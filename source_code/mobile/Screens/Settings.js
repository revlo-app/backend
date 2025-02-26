import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';


import config from "../app.json"
import * as Linking from 'expo-linking';

const Settings = ({ userId }) => {
    const [authUrl, setAuthUrl] = useState(`https://auth.truelayer.com/?response_type=code&client_id=expenseapp-3634f9&scope=info%20accounts%20transactions&redirect_uri=https://console.truelayer.com/redirect-page`);

    // useEffect(() => {
    //     fetch(`${API_URL}/create_link`)
    //         .then(res => res.json())
    //         .then(data => setAuthUrl(data.authUrl))
    //         .catch(err => console.error('Failed to fetch auth link', err));
    // }, []);

    const handleConnectCard = () => {
        if (authUrl) {
            console.log(authUrl)
            Linking.openURL(authUrl);
        } else {
            Alert.alert('Error', 'Failed to load authorization link.');
        }
    };

    

    return (
        <View>
            <Text>Settings</Text>
            <Button title="Connect/Update Card" onPress={handleConnectCard} />
        </View>
    );
};

export default Settings;
