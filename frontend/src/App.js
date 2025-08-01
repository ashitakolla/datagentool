import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import DataGeneration from './pages/DataGeneration';
import DataPrediction from './pages/DataPrediction';
import DataPreprocessing from './pages/DataPreprocessing';

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar 
          mobileOpen={mobileOpen} 
          handleDrawerToggle={handleDrawerToggle} 
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<DataGeneration />} />
            <Route path="/predict" element={<DataPrediction />} />
            <Route path="/preprocess" element={<DataPreprocessing />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
