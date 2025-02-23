import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import config from "../app.json"
const API_URL = config.app.api

const Jobs = ({ userId }) => {
    const [jobs, setJobs] = useState([]);
    const [newJobName, setNewJobName] = useState('');
    const [newClient, setNewClient] = useState('');
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [income, setIncome] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/jobs?userId=${userId}`)
            .then(res => res.json())
            .then(data => setJobs(data))
            .catch(err => console.error('Failed to fetch jobs', err));
    }, [userId]);

    const addJob = () => {
        fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newJobName, client: newClient, userId }),
        })
            .then(() => {
                setNewJobName('');
                setNewClient('');
                fetchJobs();
            })
            .catch(err => Alert.alert('Error', 'Failed to add job'));
    };

    const addIncome = (jobId) => {
        fetch(`${API_URL}/jobs/add_income`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, income: parseFloat(income) }),
        })
            .then(() => {
                setIncome('');
                fetchJobs();
            })
            .catch(err => Alert.alert('Error', 'Failed to add income'));
    };

    const toggleJobDropdown = (jobId) => {
        setSelectedJobId(selectedJobId === jobId ? null : jobId);
    };

    const unassociateTransaction = (transactionId) => {
        fetch(`${API_URL}/transactions/unassociate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        })
            .then(fetchJobs)
            .catch(err => Alert.alert('Error', 'Failed to unassociate transaction'));
    };

    return (
        <View>
            <Text>Jobs</Text>
            <TextInput placeholder="Job Name" value={newJobName} onChangeText={setNewJobName} />
            <TextInput placeholder="Client" value={newClient} onChangeText={setNewClient} />
            <Button title="Add Job" onPress={addJob} />
            <FlatList
                data={jobs}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View>
                        <TouchableOpacity onPress={() => toggleJobDropdown(item._id)}>
                            <Text>{item.name}</Text>
                            <Text>{item.client}</Text>
                            <Text>
                                Revenue: {(item.income || 0) - item.expenses.reduce((sum, tx) => sum + tx.amount, 0)}
                            </Text>
                        </TouchableOpacity>
                        {selectedJobId === item._id && (
                            <View>
                                <TextInput
                                    placeholder="Income Amount"
                                    value={income}
                                    onChangeText={setIncome}
                                    keyboardType="numeric"
                                />
                                <Button title="Add Income" onPress={() => addIncome(item._id)} />
                                {item.expenses.map(tx => (
                                    <View key={tx._id}>
                                        <Text>{tx.merchant} - {tx.date} - {tx.amount}</Text>
                                        <Button
                                            title="Unassociate"
                                            onPress={() => unassociateTransaction(tx._id)}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

export default Jobs;
