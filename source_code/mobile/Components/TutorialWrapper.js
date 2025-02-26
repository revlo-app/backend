import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

// Sample data for the tutorial job
const SAMPLE_JOB = {
    _id: 'tutorial-job',
    name: 'Tutorial Project',
    client: 'Learning Inc.',
    transactions: [
        {
            type: 'income',
            amount: 500,
            note: 'Deposit',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 12).toISOString()
        },
        {
            type: 'income',
            amount: 250,
            note: 'Milestone 1 payment',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 8).toISOString()
        },
        {
            type: 'income',
            amount: 750,
            note: 'Final',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2).toISOString()
        },
        {
            type: 'expense',
            amount: 120,
            note: 'Software',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 10).toISOString()
        },
        {
            type: 'expense',
            amount: 85,
            note: 'Materials for project',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 5).toISOString()
        }
    ]
};

const Tutorial = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [tutorialJob, setTutorialJob] = useState(SAMPLE_JOB);
    const [showSummaryExplanation, setShowSummaryExplanation] = useState(false);
    
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const highlightAnimation = useRef(new Animated.Value(0)).current;
    const fadeAnimation = useRef(new Animated.Value(1)).current;

    // Define all tutorial steps
    const tutorialSteps = [
        {
            title: "Welcome to Your Freelance Tracker!",
            content: "This quick tutorial will show you how to manage your jobs and track your finances. Let's get started!"
        },
        {
            title: "Job Management",
            content: "Each card represents a job you're working on. We've created a sample job to help you learn."
        },
        {
            title: "Swipe Actions",
            content: "You can quickly add transactions by swiping the job card. Swipe left to add expenses, or right to add income",
            animation: 'swipe'
        },
        {
            title: "Job Details",
            content: "Tap on a job card to view or modify transactions for that job.",
            animation: 'tap'
        },
        {
            title: "Financial Summary",
            content: "The summary card at the bottom shows your financial overview. It includes your income, expenses, and revenue.",
            animation: 'highlight-summary'
        },
        {
            title: "Summary Cycling",
            content: "Tap the summary card to cycle between viewing your total finances or quarterly breakdowns (Q1, Q2, Q3, Q4).",
            highlightElement: 'summary-card'
        },
        {
            title: "That's it!",
            content: "You're ready to start tracking your freelance work. Add your first real job by tapping the 'Add Job' button below."
        }
    ];

    // Reset animations when step changes
    useEffect(() => {
        swipeAnimation.setValue(0);
        highlightAnimation.setValue(0);
        fadeAnimation.setValue(1);
        
        if (step === 2) { // Swipe animation step
            animateSwipe();
        } else if (step === 5) { // Highlight summary step
            animateHighlight();
        }

        // Show job details modal when needed
        if (step === 4 && !showModal) {
            setShowModal(true);
        } else if (step !== 4 && showModal) {
            setShowModal(false);
        }
        
        // Show summary explanation when needed
        if (step === 5) {
            setShowSummaryExplanation(true);
        } else {
            setShowSummaryExplanation(false);
        }
    }, [step]);

    // Animation for swipe demonstration
    const animateSwipe = () => {
        Animated.sequence([
            // Wait a moment before starting
            Animated.delay(500),
            // Animate swipe left
            Animated.timing(swipeAnimation, {
                toValue: -80,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.delay(1000),
            // Return to center
            Animated.timing(swipeAnimation, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.delay(500),
            // Animate swipe right
            Animated.timing(swipeAnimation, {
                toValue: 80,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.delay(1000),
            // Return to center
            Animated.timing(swipeAnimation, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            })
        ]).start();
    };

    // Animation for highlighting elements
    const animateHighlight = () => {
        Animated.sequence([
            Animated.timing(highlightAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false
            }),
            Animated.delay(1000),
            Animated.timing(highlightAnimation, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: false
            })
        ]).start(() => {
            if (step === 5 || step === 4) {
                // Repeat the animation for emphasis
                setTimeout(animateHighlight, 500);
            }
        });
    };

    // Advance to next tutorial step
    const nextStep = () => {
        if (step < tutorialSteps.length - 1) {
            setStep(step + 1);
        } else {
            // Tutorial complete
            onComplete();
        }
    };

    // Handle job card press in tutorial
    const handleJobPress = () => {
        if (step === 3) {
            nextStep();
        }
    };

    // Format transaction date
    const formatDate = (date) => {
        const d = new Date(date);
        return `${(d.getMonth() + 1)}/${d.getDate().toString().padStart(2, '0')}`;
    };

    // Transaction list component
    const TransactionList = ({ transactions, type }) => {
        return (
        <View >
            
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: type === 'income' ? '#6750a4' : 'black', margin: 10, textAlign: "center" }}>
                {type === 'income' ? 'Income' : 'Expenses'}
            </Text>
            <ScrollView 
                nestedScrollEnabled 
                keyboardShouldPersistTaps='handled' 
                style={{ height: 200, borderRadius: 5 }}
            >
                {transactions
                    .filter(tx => tx.type === type)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((tx, index) => (
                        <Card key={index} style={{ margin: 3, padding: 10, backgroundColor: '#f8f8f8' }}>
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
                    ))}
            </ScrollView>
        </View>
    
    );
}

    return (
        <View style={styles.container}>
            {/* Tutorial job card with swipe animation */}
            <Animated.View 
                style={[
                    styles.tutorialCardContainer,
                    { transform: [{ translateX: swipeAnimation }] }
                ]}
            >
                <TouchableOpacity onPress={handleJobPress} activeOpacity={0.9}>
                    <Card style={styles.jobCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.jobTitle}>{tutorialJob.name}</Text>
                                <Text>{tutorialJob.client}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                                <Text style={{ color: 'black' }}>
                                    ${tutorialJob.transactions
                                        .filter(tx => tx.type === 'income')
                                        .reduce((sum, tx) => sum + (tx.amount), 0)
                                        .toFixed(2)}
                                </Text>
                                <Text style={{ color: 'gray' }}>
                                    ${Math.abs(tutorialJob.transactions
                                        .filter(tx => tx.type === 'expense')
                                        .reduce((sum, tx) => sum + (tx.amount), 0))
                                        .toFixed(2)}
                                </Text>
                                <Text style={{ color: '#6750a4' }}>
                                    ${(
                                        tutorialJob.transactions
                                            .filter(tx => tx.type === 'income')
                                            .reduce((sum, tx) => sum + (tx.amount), 0) +
                                        tutorialJob.transactions
                                            .filter(tx => tx.type === 'expense')
                                            .reduce((sum, tx) => sum + (tx.amount), 0)
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>

                {/* Swipe indicators that appear during the swipe tutorial */}
                {step === 2 && (
                    <>
                        <View style={styles.leftSwipeIndicator}>
                            <Text style={styles.swipeText}>Income</Text>
                        </View>
                        <View style={styles.rightSwipeIndicator}>
                            <Text style={styles.swipeText}>Expense</Text>
                        </View>
                    </>
                )}
            </Animated.View>

            {/* Job details modal */}
            <Modal transparent visible={showModal} animationType="fade">
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Job Details</Text>
                        <Text style={styles.jobTitle}>{tutorialJob.name}</Text>
                        <Text style={styles.clientName}>{tutorialJob.client}</Text>
                        
                        <View style={{ marginTop: 15 }}>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <TransactionList transactions={tutorialJob.transactions} type="expense" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <TransactionList transactions={tutorialJob.transactions} type="income" />
                                </View>
                            </View>
                        </View>
                        
                        <Button mode="contained" onPress={() => setShowModal(false)} style={{ marginTop: 20 }}>
                            Close
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Financial summary */}
            <Animated.View style={{
                borderWidth: step === 4 || step === 5 ? highlightAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 3]
                }) : 0,
                borderColor: step === 4 || step === 5 ? highlightAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', '#6750a4']
                }) : 'transparent',
                borderRadius: 10,
                margin: 10,
            }}>
                <Card style={styles.summaryCard}>
                <Text style={{color: "gray", alignSelf: "center", marginBottom: 10}}>Total</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={styles.summaryValue}>
                                ${tutorialJob.transactions
                                    .filter(tx => tx.type === 'income')
                                    .reduce((sum, tx) => sum + tx.amount, 0)
                                    .toFixed(2)}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={styles.summaryValue}>
                                ${Math.abs(tutorialJob.transactions
                                    .filter(tx => tx.type === 'expense')
                                    .reduce((sum, tx) => sum + tx.amount, 0))
                                    .toFixed(2)}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={styles.summaryLabel}>Revenue</Text>
                            <Text style={styles.summaryValue}>
                                ${(tutorialJob.transactions
                                    .filter(tx => tx.type === 'income')
                                    .reduce((sum, tx) => sum + tx.amount, 0) +
                                    tutorialJob.transactions
                                    .filter(tx => tx.type === 'expense')
                                    .reduce((sum, tx) => sum + tx.amount, 0))
                                    .toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    
                    {showSummaryExplanation && (
                        <View style={styles.cycleExplanation}>
                            <Text style={styles.cycleExplanationText}>
                                Tap here to cycle through:
                            </Text>
                            <View style={styles.cycleOptions}>
                                <Text style={styles.cycleOption}>Total</Text>
                                <Text style={styles.cycleOption}>Q1</Text>
                                <Text style={styles.cycleOption}>Q2</Text>
                                <Text style={styles.cycleOption}>Q3</Text>
                                <Text style={styles.cycleOption}>Q4</Text>
                            </View>
                        </View>
                    )}
                </Card>
            </Animated.View>

            {/* Tutorial instruction card */}
            <Card style={styles.tutorialCard}>
                <Text style={styles.tutorialTitle}>{tutorialSteps[step].title}</Text>
                <Text style={styles.tutorialContent}>{tutorialSteps[step].content}</Text>
                
                <View style={styles.buttonContainer}>
                    {step === 0 && (
                        <Button mode="outlined" onPress={onSkip} style={styles.skipButton}>
                            Skip Tutorial
                        </Button>
                    )}
                    <Button 
                        mode="contained" 
                        onPress={nextStep} 
                        style={styles.nextButton}
                    >
                        {step < tutorialSteps.length - 1 ? "Next" : "Finish"}
                    </Button>
                </View>
                
                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    {tutorialSteps.map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.progressDot,
                                index === step && styles.progressDotActive
                            ]} 
                        />
                    ))}
                </View>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // justifyContent: "space-between",
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.05)',
        zIndex: 1000
    },
    tutorialCardContainer: {
        position: 'relative',
        marginHorizontal: 10,
        marginTop: 10
    },
    jobCard: {
        padding: 15
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    leftSwipeIndicator: {
        position: 'absolute',
        left: -100,
        top: '50%',
        marginTop: -30,
        marginHorizontal: -10,
        backgroundColor: '#6750a4',
        padding: 20,
        borderRadius: 5,
        width: 100
    },
    rightSwipeIndicator: {
        position: 'absolute',
        right: -100,
        top: '50%',
        marginTop: -30,
        marginHorizontal: -10,
        backgroundColor: '#6750a4',
        padding: 20,
        borderRadius: 5,
        width: 100
    },
    swipeText: {
        color: 'white',
        textAlign: 'center'
    },
    summaryCard: {
        padding: 15,
        // marginBottom: 240,
        backgroundColor: '#f5f5f5'
    },
    summaryLabel: {
        fontSize: 16
    },
    summaryValue: {
        fontSize: 16,
        color: '#6750a4'
    },
    tutorialCard: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        padding: 15,
        backgroundColor: 'white'
    },
    tutorialTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    tutorialContent: {
        fontSize: 16,
        marginBottom: 20,
        lineHeight: 24
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    skipButton: {
        marginRight: 10
    },
    nextButton: {
        backgroundColor: '#6750a4'
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 3
    },
    progressDotActive: {
        backgroundColor: '#6750a4'
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#6750a4'
    },
    clientName: {
        color: '#666',
        marginBottom: 5
    },
    cycleExplanation: {
        backgroundColor: 'rgba(103, 80, 164, 0.1)',
        padding: 10,
        borderRadius: 5,
        marginTop: 10
    },
    cycleExplanationText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6750a4',
        fontWeight: 'bold'
    },
    cycleOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5
    },
    cycleOption: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        fontSize: 12,
        color: '#6750a4',
        overflow: 'hidden'
    }
});

// Main component that integrates the tutorial into the Jobs screen
const TutorialWrapper = ({ userId, state, isNewUser, children, setIsNewUser, setTriggerEffect }) => {
    const [showTutorial, setShowTutorial] = useState(!!isNewUser);
    const [tutorialComplete, setTutorialComplete] = useState(false);
    
    useFocusEffect(
        React.useCallback(() => {
            checkIfNewUser();
        }, [userId])
    );
    
    const checkIfNewUser = () => {
        return isNewUser
    };
    
    const handleTutorialComplete = () => {
        setTutorialComplete(true);
        setTriggerEffect(true)
        setIsNewUser(false);
    };
    
    const handleTutorialSkip = () => {

        setShowTutorial(false);
        setIsNewUser(false);

    };
    
    return (
        <View style={{ flex: 1 }}>
            {children}
            
            {showTutorial && (
                <Tutorial 
                    onComplete={handleTutorialComplete}
                    onSkip={handleTutorialSkip}
                />
            )}
            
            {tutorialComplete && (
                <Modal transparent visible animationType="fade" onRequestClose={() => setTutorialComplete(false)}>
                    <View style={styles.modalBackground}>
                        <View style={[styles.modalContainer, { padding: 20 }]}>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                                Tutorial Complete!
                            </Text>
                            <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                                You're all set to start tracking your freelance work. Add your first job to get started.
                            </Text>
                            <Button mode="contained" onPress={() => setTutorialComplete(false)}>
                                Start Using App
                            </Button>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default TutorialWrapper;