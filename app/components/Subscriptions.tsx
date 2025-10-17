import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Subscription = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      {/* Add your component content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default Subscription;