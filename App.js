import React, { useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import Sidebar from './components/Sidebar';
import CropRecommendation from './screens/CropRecommendation';
import FertilizerRecommendation from './screens/FertilizerRecommendation';
import DiseaseDetection from './screens/DiseaseDetection';
import YieldPrediction from './screens/YieldPrediction';
import MarketPrice from './screens/MarketPrice';
import RcControl from './screens/RcControl';

export default function App() {

  const [screen, setScreen] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (menuOpen) {
        setMenuOpen(false);
        return true;
      }
      if (screen !== "home") {
        setScreen("home");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [screen, menuOpen]);

  const renderScreen = () => {
    switch (screen) {
      case "crop": return <CropRecommendation openMenu={() => setMenuOpen(true)} />;
      case "fertilizer": return <FertilizerRecommendation openMenu={() => setMenuOpen(true)} />;
      case "disease": return <DiseaseDetection openMenu={() => setMenuOpen(true)} />;
      case "yield": return <YieldPrediction openMenu={() => setMenuOpen(true)} />;
      case "market": return <MarketPrice openMenu={() => setMenuOpen(true)} />;
      case "rcControl": return <RcControl openMenu={() => setMenuOpen(true)} />;
      default:
        return <HomeScreen openMenu={() => setMenuOpen(true)} />;
    }
  };

  return (
    <>
      {renderScreen()}

      {menuOpen && (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          navigate={(scr) => {
            setScreen(scr);
            setMenuOpen(false);
          }}
        />
      )}
    </>
  );
}