import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Modal, 
    TouchableWithoutFeedback, FlatList
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import config from '../config.json';
import { useFocusEffect } from '@react-navigation/native';

const Clients = ({ userId, isNewUser}) => {
    if (isNewUser) {
        return null;
    }

    useFocusEffect(
        useCallback(() => {
          fetchJobs()
      
          return () => {
          };
        }, [])
      );

    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    

    // Generate available years based on job data
    useEffect(() => {
        if (clients.length > 0) {
            const years = new Set();
            const currentYear = new Date().getFullYear();
            
            // Add current year
            years.add(currentYear);
            
            // Add years from job transactions
            clients.forEach(client => {
                client.jobs.forEach(job => {
                    job.transactions.forEach(tx => {
                        const txYear = new Date(tx.date).getFullYear();
                        years.add(txYear);
                    });
                });
            });
            
            // Sort years in descending order
            const sortedYears = Array.from(years).sort((a, b) => b - a);
            setAvailableYears(sortedYears);
        }
    }, [clients]);

    function fetchJobs() {
        fetch(`${config.app.api}/jobs?userId=${userId}`)
            .then(res => res.json())
            .then(jobs => {
                // Group jobs by client
                const clientMap = {};
                
                jobs.forEach(job => {
                    if (!clientMap[job.client]) {
                        clientMap[job.client] = {
                            name: job.client,
                            jobs: [],
                            totalIncome: 0,
                            totalExpenses: 0
                        };
                    }
                    clientMap[job.client].jobs.push(job);
                });

                // Convert clientMap to array and calculate totals
                const processedClients = Object.values(clientMap)
                    .map(client => {
                        // Calculate total income and expenses for the client
                        client.totalIncome = client.jobs.reduce((total, job) => 
                            total + job.transactions
                                .filter(tx => tx.type === 'income')
                                .reduce((sum, tx) => sum + tx.amount, 0)
                        , 0);

                        client.totalExpenses = client.jobs.reduce((total, job) => 
                            total + job.transactions
                                .filter(tx => tx.type === 'expense')
                                .reduce((sum, tx) => sum + tx.amount, 0)
                        , 0);

                        return client;
                    })
                    // Sort clients - those with negative revenue first
                    .sort((a, b) => {
                        const aRevenue = a.totalIncome - a.totalExpenses;
                        const bRevenue = b.totalIncome - b.totalExpenses;
                        return aRevenue - bRevenue;
                    });

                setClients(processedClients);
            })
            .catch(err => console.error('Failed to fetch jobs', err));
    }

    // Calculate job totals for a specific year
    const calculateJobTotals = (jobs, year) => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        return jobs.reduce((totals, job) => {
            const yearTransactions = job.transactions.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= startOfYear && txDate <= endOfYear;
            });

            totals.income += yearTransactions
                .filter(tx => tx.type === 'income')
                .reduce((sum, tx) => sum + tx.amount, 0);

            totals.expenses += yearTransactions
                .filter(tx => tx.type === 'expense')
                .reduce((sum, tx) => sum + tx.amount, 0);

            return totals;
        }, { income: 0, expenses: 0 });
    };

    // Format date to MM/DD
    const formatDate = (date) => {
        const d = new Date(date);
        return `${(d.getMonth() + 1)}/${d.getDate().toString().padStart(2, '0')}`;
    };

    // Render individual job transactions
    const JobTransactionList = ({ job, year }) => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const yearTransactions = job.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startOfYear && txDate <= endOfYear;
        });

        return (
            <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{job.name}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                        <Text style={{ fontWeight: 'bold', color: '#6750a4' }}>Income</Text>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                            {yearTransactions
                                .filter(tx => tx.type === 'income')
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((tx, index) => (
                                    <Card key={index} style={{ margin: 3, padding: 10, backgroundColor: '#f8f8f8' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14 }}>{formatDate(tx.date)}</Text>
                                            <Text style={{ 
                                                fontSize: 14, 
                                                color: '#6750a4'
                                            }}>
                                                ${tx.amount.toFixed(2)}
                                            </Text>
                                        </View>
                                        {tx.note ? (
                                            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                                                {tx.note}
                                            </Text>
                                        ) : null}
                                    </Card>
                                ))}
                        </ScrollView>
                    </View>
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ fontWeight: 'bold', color: 'black' }}>Expenses</Text>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                            {yearTransactions
                                .filter(tx => tx.type === 'expense')
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((tx, index) => (
                                    <Card key={index} style={{ margin: 3, padding: 10, backgroundColor: '#f8f8f8' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14 }}>{formatDate(tx.date)}</Text>
                                            <Text style={{ 
                                                fontSize: 14, 
                                                color: 'black'
                                            }}>
                                                ${Math.abs(tx.amount).toFixed(2)}
                                            </Text>
                                        </View>
                                        {tx.note ? (
                                            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                                                {tx.note}
                                            </Text>
                                        ) : null}
                                    </Card>
                                ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        );
    };

    // Cycle through available years
    const cycleYear = () => {
        const currentIndex = availableYears.indexOf(selectedYear);
        const nextIndex = (currentIndex + 1) % availableYears.length;
        setSelectedYear(availableYears[nextIndex]);
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Year Selection */}
            <View style={{ padding: 10, backgroundColor: '#f0f0f0', alignItems: 'center' }}>
                <Button 
                    mode="outlined" 
                    onPress={cycleYear}
                    style={{ marginBottom: 5 }}
                >
                    {selectedYear} Clients Overview
                </Button>
            </View>

            {/* Clients List */}
            <ScrollView>
                {clients.map((client, index) => {
                    const yearTotals = calculateJobTotals(client.jobs, selectedYear);
                    const revenue = yearTotals.income - yearTotals.expenses;
                    
                    return (
                        <TouchableOpacity 
                            key={index} 
                            onPress={() => setSelectedClient(client)}
                        >
                            <Card 
                                style={{ 
                                    margin: 10, 
                                    padding: 15,
                                    backgroundColor: revenue < 0 ? '#FFE5E5' : '#FFFFFF'
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{client.name}</Text>
                                        <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                                            {client.jobs.length} Job{client.jobs.length !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', minWidth: 100 }}>
                                        <Text style={{ color: '#6750a4' }}>
                                            Income: ${yearTotals.income.toFixed(2)}
                                        </Text>
                                        <Text style={{ color: 'black' }}>
                                            Expenses: ${yearTotals.expenses.toFixed(2)}
                                        </Text>
                                        <Text style={{ 
                                            color: '#6750a4' ,
                                            fontWeight: 'bold' 
                                        }}>
                                            Revenue: ${revenue.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Client Details Modal */}
            {selectedClient && (
                <Modal transparent visible animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setSelectedClient(null)}>
                        <View style={{ 
                            flex: 1, 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            backgroundColor: 'rgba(0,0,0,0.5)'
                        }}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <View style={{ 
                                    width: '90%', 
                                    maxHeight: '80%',
                                    backgroundColor: 'white',
                                    borderRadius: 10,
                                    padding: 20
                                }}>
                                    <Text style={{ 
                                        fontSize: 20, 
                                        fontWeight: 'bold', 
                                        marginBottom: 15,
                                        textAlign: 'center'
                                    }}>
                                        {selectedClient.name}
                                    </Text>

                                    {/* Client Totals */}
                                    <Card style={{ 
                                        marginBottom: 15, 
                                        padding: 15, 
                                        backgroundColor: '#f5f5f5' 
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ alignItems: 'center', flex: 1 }}>
                                                <Text style={{ fontSize: 16 }}>Income</Text>
                                                <Text style={{ 
                                                    fontSize: 16, 
                                                    color: '#6750a4' 
                                                }}>
                                                    ${calculateJobTotals(selectedClient.jobs, selectedYear).income.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'center', flex: 1 }}>
                                                <Text style={{ fontSize: 16 }}>Expenses</Text>
                                                <Text style={{ 
                                                    fontSize: 16, 
                                                    color: 'black' 
                                                }}>
                                                    ${calculateJobTotals(selectedClient.jobs, selectedYear).expenses.toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'center', flex: 1 }}>
                                                <Text style={{ fontSize: 16 }}>Revenue</Text>
                                                <Text style={{ 
                                                    fontSize: 16, 
                                                    color: calculateJobTotals(selectedClient.jobs, selectedYear).income - 
                                                           calculateJobTotals(selectedClient.jobs, selectedYear).expenses >= 0 
                                                        ? '#6750a4' 
                                                        : 'red' 
                                                }}>
                                                    ${(calculateJobTotals(selectedClient.jobs, selectedYear).income - 
                                                       calculateJobTotals(selectedClient.jobs, selectedYear).expenses).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    </Card>

                                    {/* Jobs List */}
                                    <ScrollView>
                                        {selectedClient.jobs.map((job, index) => (
                                            <JobTransactionList 
                                                key={index} 
                                                job={job} 
                                                year={selectedYear} 
                                            />
                                        ))}
                                    </ScrollView>

                                    <Button 
                                        mode="contained" 
                                        onPress={() => setSelectedClient(null)}
                                        style={{ marginTop: 15 }}
                                    >
                                        Close
                                    </Button>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
};

export default Clients;