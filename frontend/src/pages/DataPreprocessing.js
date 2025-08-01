import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import {
  Build as PreprocessIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  TableChart as TableIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';

function DataPreprocessing() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Box display="flex" alignItems="center" mb={2}>
          <PreprocessIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Data Preprocessing
            </Typography>
            <Typography color="text.secondary">
              Clean, transform, and prepare your data for analysis
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
        <Box maxWidth={600} mx="auto" py={6}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <SettingsIcon color="primary" sx={{ fontSize: 40 }} />
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Coming Soon
          </Typography>
          
          <Typography color="text.secondary" paragraph>
            We're working hard to bring you powerful data preprocessing tools.
            This feature will allow you to clean, transform, and prepare your
            data for analysis with just a few clicks.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check back soon for updates!
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/generate')}
            startIcon={<TableIcon />}
            sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
          >
            Generate Data
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/predict')}
            startIcon={<ChartIcon />}
          >
            Make Predictions
          </Button>
        </Box>
      </Paper>

      <Box mt={6}>
        <Typography variant="h6" gutterBottom align="center">
          Planned Features
        </Typography>
        
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <UploadIcon color="primary" />
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  Data Import
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Import data from various sources including CSV, Excel, and databases.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <SettingsIcon color="primary" />
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  Data Cleaning
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Handle missing values, duplicates, and outliers in your datasets.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <TableIcon color="primary" />
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  Data Transformation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Normalize, scale, and encode your data for better analysis.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <ChartIcon color="primary" />
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  Feature Engineering
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create new features and transform existing ones for better model performance.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Box mt={6} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Stay Updated
        </Typography>
        <Typography color="text.secondary" maxWidth={600} mx="auto" mb={3}>
          Want to be notified when this feature is released? Sign up for our newsletter to get the latest updates.
        </Typography>
        <Box
          component="form"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            maxWidth: 600,
            mx: 'auto',
          }}
          noValidate
          autoComplete="off"
        >
          <TextField
            label="Email address"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" color="primary" size="large">
            Notify Me
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default DataPreprocessing;
