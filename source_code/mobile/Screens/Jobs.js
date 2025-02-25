import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, ScrollView, Alert, Modal, TouchableOpacity, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import config from '../app.json';
import { Card, Button, Divider, Menu, Provider } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

const API_URL = config.app.api;

const Jobs = ({ userId }) => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [newJobName, setNewJobName] = useState('');
    const [newClient, setNewClient] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [isNegative, setIsNegative] = useState(false);
    const [summaryMode, setSummaryMode] = useState('total'); // 'q1', 'q2', 'q3', 'q4', 'total'
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [yearMenuVisible, setYearMenuVisible] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isJob, setIsJob] = useState(false); // Are we deleting a job or a transaction
    const swipeableRefs = useRef({});

    // Year should default to current year if not provided
    const displayYear = selectedYear || new Date().getFullYear();

    useEffect(() => {
        fetchJobs();
    }, [userId]);

    // Filter jobs whenever the jobs array or year changes
    useEffect(() => {
        filterJobsByYear();
    }, [jobs, displayYear]);

    // Generate available years based on transaction data
    useEffect(() => {
        if (jobs.length > 0) {
            const years = new Set();
            const currentYear = new Date().getFullYear();
            
            // Add current year
            years.add(currentYear);
            
            // Add years from transaction history
            jobs.forEach(job => {
                job.transactions.forEach(tx => {
                    const txYear = new Date(tx.date).getFullYear();
                    years.add(txYear);
                });
            });
            
            // Sort years in descending order
            const sortedYears = Array.from(years).sort((a, b) => b - a);
            setAvailableYears(sortedYears);
            
            // Set selected year if not already set
            if (!selectedYear) {
                setSelectedYear(currentYear);
            }
        }
    }, [jobs]);

    function fetchJobs() {
        fetch(`${API_URL}/jobs?userId=${userId}`)
            .then(res => res.json())
            .then(data => setJobs(data))
            .catch(err => console.error('Failed to fetch jobs', err));
    }

    // Filter jobs and their transactions by year
    function filterJobsByYear() {
        const startOfYear = new Date(displayYear, 0, 1);
        const endOfYear = new Date(displayYear, 11, 31, 23, 59, 59);

        const filtered = jobs.map(job => {
            // Filter transactions for the specified year
            const yearTransactions = job.transactions.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= startOfYear && txDate <= endOfYear;
            });

            // Return a new job object with filtered transactions
            return {
                ...job,
                transactions: yearTransactions
            };
        });

        setFilteredJobs(filtered);
    }

    const formatDate = (date) => {
        const d = new Date(date);
        return `${(d.getMonth() + 1)}/${d.getDate().toString().padStart(2, '0')}`;
    };

    const addJob = () => {
        if (!newJobName) return;
        fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: newJobName, 
                client: newClient, 
                userId,
                transactions: [] 
            }),
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
        setAmount('');
        setNote('');
        if (swipeableRefs.current[swipeableKey]) {
            swipeableRefs.current[swipeableKey].close();
        }
    };

    const handleJobPress = (job) => {
        // Use the non-filtered job for editing to include all transactions
        const originalJob = jobs.find(j => j._id === job._id);
        setSelectedJob(originalJob);
        setModalType('editJob');
        setShowModal(true);
    };

    const handleTransactionPress = (transaction, job) => {
        setSelectedJob(job);
        setSelectedTransaction(transaction);
        setAmount(transaction.amount.toString());
        setNote(transaction.note || '');
        setIsNegative(transaction.amount < 0);
        setModalType('editTransaction');
        setShowModal(true);
    };

    const handleConfirm = () => {
        const transaction = {
            type: modalType,
            amount: parseFloat(amount) * (isNegative ? -1 : 1),
            note: note || '',
            date: new Date().toISOString()
        };

        fetch(`${API_URL}/jobs/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                jobId: selectedJob._id, 
                transaction 
            }),
        })
            .then(() => {
                setAmount('');
                setNote('');
                fetchJobs();
                setShowModal(false);
                setIsNegative(false);
            })
            .catch(err => Alert.alert('Error', 'Failed to add transaction'));
    };

    const handleUpdateTransaction = () => {
        // Create updated transaction object
        const updatedTransaction = {
            ...selectedTransaction,
            amount: Math.abs(parseFloat(amount)) * (isNegative ? -1 : 1),
            note: note || ''
        };
        
        // Find the transaction index in the job's transactions array
        const transactionIndex = selectedJob.transactions.findIndex(
            tx => tx.date === selectedTransaction.date && 
                 tx.amount === selectedTransaction.amount && 
                 tx.type === selectedTransaction.type
        );
        
        if (transactionIndex === -1) {
            Alert.alert('Error', 'Transaction not found');
            return;
        }
        
        // Create a copy of the job's transactions
        const updatedTransactions = [...selectedJob.transactions];
        // Replace the transaction at the found index
        updatedTransactions[transactionIndex] = updatedTransaction;

        
        fetch(`${API_URL}/jobs/${selectedJob._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...selectedJob,
                transactions: updatedTransactions 
            })
        })
            .then(() => {
                fetchJobs();
                setShowModal(false);
                setSelectedTransaction(null);
            })
            .catch(() => Alert.alert('Error', 'Failed to update transaction'));
    };

    const handleDeleteTransaction = () => {
        // Find the transaction index in the job's transactions array
        const transactionIndex = selectedJob.transactions.findIndex(
            tx => tx.date === selectedTransaction.date && 
                 tx.amount === selectedTransaction.amount && 
                 tx.type === selectedTransaction.type
        );
        
        if (transactionIndex === -1) {
            Alert.alert('Error', 'Transaction not found');
            return;
        }
        
        // Create a copy of the job's transactions without the deleted transaction
        const updatedTransactions = selectedJob.transactions.filter((_, index) => index !== transactionIndex);
        
        fetch(`${API_URL}/jobs/${selectedJob._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...selectedJob,
                transactions: updatedTransactions 
            })
        })
            .then(() => {
                fetchJobs();
                setShowModal(false);
                setShowDeleteConfirm(false);
                setSelectedTransaction(null);
            })
            .catch(() => Alert.alert('Error', 'Failed to delete transaction'));
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

    const getQuarterBounds = (quarter) => {
        switch (quarter) {
            case 'q1':
                return {
                    start: new Date(displayYear, 0, 1),  // Jan 1
                    end: new Date(displayYear, 2, 31, 23, 59, 59)  // March 31
                };
            case 'q2':
                return {
                    start: new Date(displayYear, 3, 1),  // April 1
                    end: new Date(displayYear, 4, 31, 23, 59, 59)  // May 31
                };
            case 'q3':
                return {
                    start: new Date(displayYear, 5, 1),  // June 1
                    end: new Date(displayYear, 7, 31, 23, 59, 59)  // Aug 31
                };
            case 'q4':
                return {
                    start: new Date(displayYear, 8, 1),  // Sept 1
                    end: new Date(displayYear, 11, 31, 23, 59, 59)  // Dec 31
                };
            default:
                return {
                    start: new Date(displayYear, 0, 1),  // Jan 1
                    end: new Date(displayYear, 11, 31, 23, 59, 59)  // Dec 31
                };
        }
    };

    const calculateTotals = (mode) => {
        const { start, end } = getQuarterBounds(mode);
        
        return filteredJobs.reduce((totals, job) => {
            job.transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate >= start && txDate <= end) {
                    if (tx.type === 'income') {
                        totals.income += tx.amount;
                    } else {
                        totals.expenses += tx.amount;
                    }
                }
            });
            return totals;
        }, { income: 0, expenses: 0 });
    };

    const { income: totalIncome, expenses: totalExpenses } = calculateTotals(summaryMode);
    const totalRevenue = totalIncome - totalExpenses;

    const cycleSummaryMode = () => {
        const modes = ['total', 'q1', 'q2', 'q3', 'q4'];
        const currentIndex = modes.indexOf(summaryMode);
        setSummaryMode(modes[(currentIndex + 1) % modes.length]);
    };

    const getSummaryTitle = () => {
        switch (summaryMode) {
            case 'q1': return `Q1 (Jan 1-Mar 31) ${displayYear}`;
            case 'q2': return `Q2 (Apr 1-May 31) ${displayYear}`;
            case 'q3': return `Q3 (Jun 1-Aug 31) ${displayYear}`;
            case 'q4': return `Q4 (Sep 1-Dec 31) ${displayYear}`;
            default: return `Total ${displayYear}`;
        }
    };

    const TransactionList = ({ transactions, type, job }) => (
        <View style={{ flex: 1, marginTop: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: type === 'income' ? '#6750a4' : 'black', margin: 10, textAlign: "center" }}>
                {type === 'income' ? 'Income' : 'Expenses'}
            </Text>
            {/* Fixed: Made the ScrollView properly scrollable with a fixed height */}
            <ScrollView 
                nestedScrollEnabled 
                keyboardShouldPersistTaps='handled' 
                style={{ height: 200,  borderRadius: 5 }}
            >
                {transactions
                    .filter(tx => {
                        const txDate = new Date(tx.date);
                        return tx.type === type && 
                               txDate.getFullYear() === displayYear;
                    })
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((tx, index) => (
                        <TouchableOpacity 
                            key={index}
                            onPress={() => handleTransactionPress(tx, job)}
                        >
                            <Card style={{ margin: 3, padding: 10, backgroundColor: '#f8f8f8' }}>
                                <View style={{ flex: 1}}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 14 }}>{formatDate(tx.date)}</Text>

                                        <Text style={{ 
                                            fontSize: 14, 
                                            color: '#6750a4'
                                        }}>
                                            {tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                        </Text>
                                    </View>

                                    <Text style={{ fontSize: 12, color: '#666' }}>{tx.note}</Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))}
            </ScrollView>
        </View>
    );

    // Delete Transaction Confirmation Modal
    const DeleteConfirmationModal = () => (
        <Modal transparent visible={showDeleteConfirm} animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={{ 
                            padding: 20, 
                            width: '80%',
                            borderRadius: 10,
                            backgroundColor: 'white',
                            elevation: 5
                        }}>
                            <Text style={{ fontSize: 18, marginBottom: 15, textAlign: 'center' }}>
                                Delete {isJob? 'Job': 'Transaction'}?
                            </Text>
                            <Text style={{ marginBottom: 20, textAlign: 'center' }}>
                                This action cannot be undone.
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Button 
                                    mode="outlined" 
                                    onPress={() => setShowDeleteConfirm(false)}
                                    style={{ flex: 1, marginRight: 5 }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    mode="contained" 
                                    onPress={(e) => {e.preventDefault(); setShowDeleteConfirm(false); isJob? handleDeleteJob() : handleDeleteTransaction()}}
                                    style={{ flex: 1, marginLeft: 5 }}
                                    color="red"
                                >
                                    Delete
                                </Button>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    return (
        <Provider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && <DeleteConfirmationModal />}
                
                {/* Year Dropdown Header */}
                <View style={{ padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' }}>
                    <Menu
                        visible={yearMenuVisible}
                        onDismiss={() => setYearMenuVisible(false)}
                        anchor={
                            <Button 
                                mode="outlined" 
                                onPress={() => setYearMenuVisible(true)}
                                style={{ marginBottom: 5 }}
                            >
                                {displayYear} Financial Overview
                            </Button>
                        }
                    >
                        <ScrollView style={{ maxHeight: 200 }}>
                            {availableYears.map(year => (
                                <Menu.Item
                                    key={year}
                                    title={year.toString()}
                                    onPress={() => {
                                        setSelectedYear(year);
                                        setYearMenuVisible(false);
                                    }}
                                />
                            ))}
                        </ScrollView>
                    </Menu>
                </View>

                <ScrollView keyboardShouldPersistTaps='handled'>
                    {filteredJobs.map(item => (
                        <Swipeable
                            key={item._id}
                            ref={ref => swipeableRefs.current[item._id] = ref}
                            renderLeftActions={() => (
                                <View style={{ 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    width: 80, 
                                    margin: 10, 
                                    borderRadius: 10, 
                                    padding: 3, 
                                    backgroundColor: config.app.theme.purple 
                                }}>
                                    <Text style={{ color: 'white' }}>Income</Text>
                                </View>
                            )}
                            renderRightActions={() => (
                                <View style={{ 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    width: 80, 
                                    margin: 10, 
                                    borderRadius: 10, 
                                    padding: 3, 
                                    backgroundColor: config.app.theme.purple 
                                }}>
                                    <Text style={{ color: 'white' }}>Expense</Text>
                                </View>
                            )}
                            onSwipeableOpen={(direction) =>
                                handleSwipeRelease(direction !== 'right' ? 'income' : 'expense', item._id, item._id)
                            }
                        >
                            <Card style={{ margin: 10, padding: 15 }} onPress={() => handleJobPress(item)}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
                                        <Text>{item.client}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                                        <Text style={{ color: 'black' }}>
                                            ${item.transactions
                                                .filter(tx => tx.type === 'income')
                                                .reduce((sum, tx) => sum + (tx.amount), 0)
                                                .toFixed(2)}
                                        </Text>
                                        <Text style={{ color: 'gray' }}>
                                            ${item.transactions
                                                .filter(tx => tx.type === 'expense')
                                                .reduce((sum, tx) => sum + (tx.amount), 0)
                                                .toFixed(2)}
                                        </Text>
                                        <Text style={{ color: '#6750a4' }}>
                                            ${(
                                                item.transactions
                                                    .filter(tx => tx.type === 'income')
                                                    .reduce((sum, tx) => sum + (tx.amount), 0) -
                                                item.transactions
                                                    .filter(tx => tx.type === 'expense')
                                                    .reduce((sum, tx) => sum + (tx.amount), 0)
                                            ).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </Swipeable>
                    ))}

                    {showModal && (
                        <Modal transparent visible animationType="fade">
                            <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
                                <View style={{ 
                                    flex: 1, 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    backgroundColor: 'rgba(0,0,0,0.5)'
                                }}>
                                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                        <View style={{ 
                                            padding: 20, 
                                            width: '90%', 
                                            maxHeight: '80%',
                                            borderRadius: 10,
                                            backgroundColor: 'white',
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                            elevation: 5
                                        }}>
                                            {modalType === 'addJob' ? (
                                                <>
                                                    <TextInput
                                                        placeholder="Job Name"
                                                        value={newJobName}
                                                        onChangeText={setNewJobName}
                                                        style={{ marginBottom: 10 }}
                                                        autoFocus
                                                    />
                                                    <TextInput
                                                        placeholder="Client"
                                                        value={newClient}
                                                        onChangeText={setNewClient}
                                                        style={{ marginBottom: 20 }}
                                                    />
                                                    <Button mode="contained" disabled={!newJobName} onPress={addJob}>
                                                        Add Job
                                                    </Button>
                                                </>
                                            ) : modalType === 'editJob' ? (
                                                <ScrollView 
                                                    keyboardShouldPersistTaps='handled'
                                                    nestedScrollEnabled
                                                >
                                                    <TextInput
                                                        placeholder="Job Name"
                                                        value={selectedJob.name}
                                                        onChangeText={(name) => setSelectedJob({ ...selectedJob, name })}
                                                        style={{ marginBottom: 10 }}
                                                    />
                                                    <TextInput
                                                        placeholder="Client"
                                                        value={selectedJob.client}
                                                        onChangeText={(client) => setSelectedJob({ ...selectedJob, client })}
                                                        style={{ marginBottom: 20 }}
                                                    />
                                                    <Button mode="contained" onPress={handleUpdateJob} style={{ marginBottom: 10 }}>
                                                        Update Job
                                                    </Button>
                                                    <Button mode="outlined" onPress={() => {setShowModal(false); setShowDeleteConfirm(true) ;setIsJob(true)}} color="red" style={{ marginBottom: 20 }}>
                                                        Delete Job
                                                    </Button>
                                                    
                                                    <Divider style={{ marginVertical: 10 }} />
                                                    
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <View style={{ flex: 1, marginRight: 5 }}>
                                                            <TransactionList 
                                                                transactions={selectedJob.transactions} 
                                                                type="expense"
                                                                job={selectedJob}
                                                            />
                                                        </View>
                                                        <View style={{ flex: 1, marginLeft: 5 }}>
                                                            <TransactionList 
                                                                transactions={selectedJob.transactions} 
                                                                type="income"
                                                                job={selectedJob}
                                                            />
                                                        </View>
                                                    </View>
                                                </ScrollView>
                                            ) : modalType === 'editTransaction' ? (
                                                <>
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
                                                        Edit Transaction
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                                        <TouchableOpacity onPress={() => setIsNegative(!isNegative)}>
                                                            <Text style={{
                                                                fontSize: 24,
                                                                marginRight: 10,
                                                                color: isNegative ? 'red' : 'green',
                                                                textAlign: "center"
                                                            }}>
                                                                {isNegative ? '−' : '+'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TextInput
                                                            placeholder="Amount"
                                                            value={Math.abs(amount).toString()}
                                                            onChangeText={setAmount}
                                                            keyboardType="numeric"
                                                            style={{ flex: 1, marginBottom: 10 }}
                                                            autoFocus
                                                        />
                                                    </View>
                                                    <TextInput
                                                        placeholder="Add a note (optional)"
                                                        value={note}
                                                        onChangeText={setNote}
                                                        style={{ marginBottom: 20 }}
                                                        multiline
                                                    />
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Button 
                                                            mode="outlined" 
                                                            color="red"
                                                            onPress={() => {setShowModal(false); setShowDeleteConfirm(true); setIsJob(false)}}
                                                            style={{ flex: 1, marginRight: 5 }}
                                                        >
                                                            Delete
                                                        </Button>
                                                        <Button 
                                                            mode="contained" 
                                                            onPress={handleUpdateTransaction}
                                                            disabled={!amount || isNaN(parseFloat(amount))}
                                                            style={{ flex: 1, marginLeft: 5 }}
                                                        >
                                                            Save
                                                        </Button>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                                        <TouchableOpacity onPress={() => setIsNegative(!isNegative)}>
                                                            <Text style={{
                                                                fontSize: 24,
                                                                marginRight: 10,
                                                                color: isNegative ? 'red' : 'green',
                                                                textAlign: "center"
                                                            }}>
                                                                {isNegative ? '−' : '+'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TextInput
                                                            placeholder={`Enter ${modalType === 'income' ? 'Income' : 'Expense'} Amount`}
                                                            value={Math.abs(amount).toString()}
                                                            onChangeText={setAmount}
                                                            keyboardType="numeric"
                                                            style={{ flex: 1, marginBottom: 10 }}
                                                            autoFocus
                                                        />
                                                    </View>
                                                    <TextInput
                                                        placeholder="Add a note (optional)"
                                                        value={note}
                                                        onChangeText={setNote}
                                                        style={{ marginBottom: 20 }}
                                                        multiline
                                                    />
                                                    <Button 
                                                        mode="contained" 
                                                        onPress={handleConfirm}
                                                        disabled={!amount || isNaN(parseFloat(amount))}
                                                    >
                                                        Confirm
                                                    </Button>
                                                </>
                                            )}
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                    )}
                </ScrollView>

                <TouchableOpacity onPress={cycleSummaryMode}>
                    <Card style={{ 
                        margin: 10, 
                        padding: 15, 
                        backgroundColor: '#f5f5f5',
                        elevation: 4
                    }}>
                        <Text style={{ 
                            textAlign: 'center', 
                            fontSize: 12, 
                            color: '#666',
                            marginBottom: 5 
                        }}>
                            {getSummaryTitle()}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 16 }}>Income</Text>
                                <Text style={{ 
                                    fontSize: 16, 
                                    color: config.app.theme.purple 
                                }}>
                                    ${totalIncome.toFixed(2)}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 16 }}>Expenses</Text>
                                <Text style={{ 
                                    fontSize: 16, 
                                    color: config.app.theme.purple 
                                }}>
                                    ${totalExpenses.toFixed(2)}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 16 }}>Revenue</Text>
                                <Text style={{ 
                                    fontSize: 16, 
                                    color: totalRevenue >= 0 ? config.app.theme.purple : 'black' 
                                }}>
                                    ${totalRevenue.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>

                <Button 
                    style={{ margin: 5 }}
                    mode="contained" 
                    onPress={() => { 
                        setModalType('addJob'); 
                        setShowModal(true); 
                    }}
                >
                    Add Job
                </Button>
            </GestureHandlerRootView>
        </Provider>
    );
};

export default Jobs;