import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, ScrollView, Alert, Modal, TouchableOpacity, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import config from '../app.json';
import { Card, Button } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

const API_URL = config.app.api;

const Jobs = ({ userId }) => {
    const [jobs, setJobs] = useState([]);
    const [newJobName, setNewJobName] = useState('');
    const [newClient, setNewClient] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [isNegative, setIsNegative] = useState(false)
    const swipeableRefs = useRef({});

    useEffect(() => {
        fetchJobs();
    }, [userId]);

    function fetchJobs() {
        fetch(`${API_URL}/jobs?userId=${userId}`)
            .then(res => res.json())
            .then(data => setJobs(data))
            .catch(err => console.error('Failed to fetch jobs', err));
    }

    const addJob = () => {
        if (!newJobName) return;
        fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newJobName, client: newClient, userId }),
        })
            .then(() => {
                setNewJobName('');
                setNewClient('');
                fetchJobs();
                setShowModal(false);
            })
            .catch(err => {
                Alert.alert('Error', 'Failed to add job');
                console.log(err);
            });
    };

    const handleSwipeRelease = (type, jobId, swipeableKey) => {
        setModalType(type);
        setSelectedJob(jobs.find(job => job._id === jobId));
        setShowModal(true);
        if (swipeableRefs.current[swipeableKey]) {
            swipeableRefs.current[swipeableKey].close();
        }
    };

    const handleJobPress = (job) => {
        setSelectedJob(job);
        setModalType('editJob');
        setShowModal(true);
    };

    const handleConfirm = () => {
        const endpoint = modalType === 'income' ? 'add_income' : 'add_expense';
        const amount = modalType === 'income' ? income : expense;

        fetch(`${API_URL}/jobs/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: selectedJob._id, amount: amount, negative: isNegative }),
        })
            .then(() => {
                setIncome(0);
                setExpense(0);
                fetchJobs();
                setShowModal(false);
                setIsNegative(false)
            })
            .catch(err => Alert.alert('Error', 'Failed to add transaction'));
    };

    const handleUpdateJob = () => {
        fetch(`${API_URL}/jobs/${selectedJob._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: selectedJob.name, client: selectedJob.client })
        })
            .then(fetchJobs)
            .then(() => setShowModal(false))
            .catch(() => Alert.alert('Error', 'Failed to update job'));
    };

    const handleDeleteJob = () => {
        fetch(`${API_URL}/jobs/${selectedJob._id}`, { method: 'DELETE' })
            .then(fetchJobs)
            .then(() => setShowModal(false))
            .catch(() => Alert.alert('Error', 'Failed to delete job'));
    };

     // Calculate totals
     const totalIncome = jobs.reduce((sum, job) => sum + (job.income || 0), 0);
     const totalExpenses = jobs.reduce((sum, job) =>
         sum + (job.costs || 0) + job.expenses.reduce((expSum, tx) => expSum + tx.amount, 0), 0);
     const totalRevenue = totalIncome - totalExpenses;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps='handled'>
                

                {jobs.map(item => (
                    <Swipeable
                        key={item._id}
                        ref={ref => swipeableRefs.current[item._id] = ref}
                        renderLeftActions={() => <View style={{ justifyContent: 'center', alignItems: 'center', width: 80, margin: 10, borderRadius: 10, padding: 3, backgroundColor: config.app.theme.purple }}><Text style={{ color: 'white' }}>Income</Text></View>}
                        renderRightActions={() => <View style={{ justifyContent: 'center', alignItems: 'center', width: 80, margin: 10, borderRadius: 10, padding: 3, backgroundColor: config.app.theme.purple }}><Text style={{ color: 'white' }}>Expense</Text></View>}
                        onSwipeableOpen={(direction) =>
                            handleSwipeRelease(direction !== 'right' ? 'income' : 'expense', item._id, item._id)
                        }
                    >
                        <Card style={{ margin: 10, padding: 15 }} onPress={() => handleJobPress(item)}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
                                    <Text>{item.client}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: '#6750a4' }}>${item.income || 0}</Text>
                                    <Text style={{ color: 'black' }}>${(item.costs || 0) + item.expenses.reduce((sum, tx) => sum + tx.amount, 0)}</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
                                <Text style={{
                                    color: (item.income || 0) - ((item.costs || 0) + item.expenses.reduce((sum, tx) => sum + tx.amount, 0)) >= 0 ? '#6750a4' : 'black'
                                }}>
                                    ${ (item.income || 0) - (item.costs || 0) - item.expenses.reduce((sum, tx) => sum + tx.amount, 0)}
                                </Text>
                            </View>
                        </Card>
                    </Swipeable>
                ))}

{showModal && (
    <Modal transparent visible animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableWithoutFeedback onPress={() => { /* Prevent modal close when clicking inside */ }}>
                    <Card style={{ padding: 20, width: '80%' }}>
                        {modalType === 'addJob' ? (
                            <>
                                <TextInput
                                    placeholder="Job Name"
                                    value={newJobName}
                                    onChangeText={setNewJobName}
                                    autoFocus
                                    onBlur={Keyboard.dismiss}
                                />
                                <TextInput
                                    placeholder="Client"
                                    value={newClient}
                                    onChangeText={setNewClient}
                                    onBlur={Keyboard.dismiss}
                                />
                                <Button disabled={!newJobName} onPress={addJob}>
                                    Confirm
                                </Button>
                            </>
                        ) : modalType === 'editJob' ? (
                            <>
                                <TextInput
                                    placeholder="Job Name"
                                    value={selectedJob.name}
                                    onChangeText={(name) => setSelectedJob({ ...selectedJob, name })}
                                    autoFocus
                                    onBlur={Keyboard.dismiss}
                                />
                                <TextInput
                                    placeholder="Client"
                                    value={selectedJob.client}
                                    onChangeText={(client) => setSelectedJob({ ...selectedJob, client })}
                                    onBlur={Keyboard.dismiss}
                                />
                                <Button onPress={handleUpdateJob}>Update Job</Button>
                                <Button onPress={handleDeleteJob} color="red">
                                    Delete Job
                                </Button>
                            </>
                        ) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => setIsNegative(!isNegative)}>
                                        <Text
                                            style={{
                                                fontSize: 24,
                                                marginRight: 10,
                                                color: isNegative ? 'red' : 'green',
                                            }}
                                        >
                                            {isNegative ? '−' : '+'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TextInput
                                        placeholder={`Enter ${modalType === 'income' ? 'Income' : 'Expense'} Amount`}
                                        value={modalType === 'income' ? income : expense}
                                        onChangeText={modalType === 'income' ? setIncome : setExpense}
                                        keyboardType="numeric"
                                        autoFocus
                                        style={{ flex: 1 }}
                                        onBlur={Keyboard.dismiss}
                                    />
                                </View>
                                <Button onPress={handleConfirm}>Confirm</Button>
                            </>
                        )}
                    </Card>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
)}
            </ScrollView>

            <Card style={{ margin: 10, padding: 15, backgroundColor: '#f5f5f5' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16}}>Income</Text>
                            <Text style={{ fontSize: 16, color: config.app.theme.purple }}>${totalIncome.toFixed(2)}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16 }}>Expenses</Text>
                            <Text style={{ fontSize: 16, color: config.app.theme.purple  }}>${totalExpenses.toFixed(2)}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16 }}>Revenue</Text>
                            <Text style={{ fontSize: 16, color: totalRevenue >= 0 ? config.app.theme.purple  : 'black' }}>${totalRevenue.toFixed(2)}</Text>
                        </View>
                    </View>
                </Card>
            <Button style = {{margin: 5}}mode='contained' onPress={() => { setModalType('addJob'); setShowModal(true); }}>
                    Add Job
                </Button>
        </GestureHandlerRootView>
    );
};

export default Jobs;
