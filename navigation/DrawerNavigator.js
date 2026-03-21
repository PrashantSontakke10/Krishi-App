import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from '../screens/HomeScreen';
import CropRecommendation from '../screens/CropRecommendation';
import FertilizerRecommendation from '../screens/FertilizerRecommendation';
import DiseaseDetection from '../screens/DiseaseDetection';
import YieldPrediction from '../screens/YieldPrediction';
import MarketPrice from '../screens/MarketPrice';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard">

      <Drawer.Screen name="Dashboard" component={HomeScreen} />
      <Drawer.Screen name="Crop Recommendation" component={CropRecommendation} />
      <Drawer.Screen name="Fertilizer Recommendation" component={FertilizerRecommendation} />
      <Drawer.Screen name="Plant Disease Detection" component={DiseaseDetection} />
      <Drawer.Screen name="Yield Prediction" component={YieldPrediction} />
      <Drawer.Screen name="Market Price Prediction" component={MarketPrice} />

    </Drawer.Navigator>
  );
}