import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert } from 'react-native';
import config from "../app.json"
const API_URL = config.app.api

const Transactions = ({ userId }) => {
    const [transactions, setTransactions] = useState([]);
    const [collapsed, setCollapsed] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/transactions?userId=${userId}`)
            .then(res => res.json())
            .then(data => setTransactions(data))
            .catch(err => console.error('Failed to fetch transactions', err));
    }, [userId]);

    const associateTransaction = (transactionId, jobId) => {
        fetch(`${API_URL}/transactions/associate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, jobId }),
        })
            .then(() => fetchTransactions())
            .catch(err => Alert.alert('Error', 'Failed to associate transaction'));
    };

    return (
        <View>
            <Text>Transactions</Text>
            <Button title={collapsed ? 'Show Old Transactions' : 'Hide Old Transactions'} onPress={() => setCollapsed(!collapsed)} />
            <FlatList
                data={transactions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.merchant} - {item.date} - {item.amount}</Text>
                        <Button title="Associate with Job" onPress={() => associateTransaction(item._id)} />
                    </View>
                )}
            />
        </View>
    );
};

export default Transactions;
