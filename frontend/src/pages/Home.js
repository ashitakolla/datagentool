import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Divider,
} from '@mui/material';
import {
  AddBox as GenerateIcon,
  Timeline as PredictIcon,
  Build as PreprocessIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const features = [
  {
    title: '📊 Data Generation',
    description: 'Generate synthetic datasets for various use cases including tabular and time-series data.',
    icon: <GenerateIcon fontSize="large" color="primary" />,
    buttonText: 'Generate Data',
    path: '/generate',
  },
  {
    title: '📈 Data Prediction',
    description: 'Upload your data and get AI-powered predictions for your numeric columns.',
    icon: <PredictIcon fontSize="large" color="primary" />,
    buttonText: 'Make Predictions',
    path: '/predict',
  },
  {
    title: '🧹 Data Preprocessing',
    description: 'Clean, transform, and prepare your data for analysis (Coming Soon).',
    icon: <PreprocessIcon fontSize="large" color="primary" />,
    buttonText: 'Preprocess Data',
    path: '/preprocess',
    disabled: true,
  },
];

function Home() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to DataGen AI Tool
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          paragraph
          sx={{ maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}
        >
          A comprehensive data generation and analysis suite powered by AI to help you create, predict, 
          and preprocess your datasets with ease.
        </Typography>
      </Box>

      <Divider sx={{ mb: 6 }} />

      <Grid container spacing={4} justifyContent="center">
        {features.map((feature, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box mb={2}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3, px: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  fullWidth
                  onClick={() => navigate(feature.path)}
                  disabled={feature.disabled}
                >
                  {feature.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={8} textAlign="center">
        <Typography variant="h5" gutterBottom>
          Getting Started
        </Typography>
        <Box maxWidth="600px" mx="auto">
          <ol style={{ textAlign: 'left', lineHeight: '2.5' }}>
            <li>Select a tool from the sidebar or the cards above</li>
            <li>Follow the on-screen instructions to generate, predict, or preprocess your data</li>
            <li>Download or export your results for further analysis</li>
          </ol>
        </Box>
      </Box>
    </Container>
  );
}

export default Home;
