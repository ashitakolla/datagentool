import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Slider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Description as TableIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function DataGeneration() {
  const [tabValue, setTabValue] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [csvPreview, setCsvPreview] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setGeneratedData(null);
    setError('');
    setSuccess('');
  };

  const handleGenerateData = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the data you want to generate.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('dataset_type', tabValue === 0 ? 'tabular' : 'time_series');
      formData.append('row_count', '100');

      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/generate`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.data) {
        setGeneratedData(response.data);
        setCsvPreview(response.data.data.split('\n').slice(0, 11).join('\n'));
        setSuccess('Successfully generated data.');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      let errorMessage = 'Failed to generate data. Please try again.';
      
      if (err.response) {
        if (err.response.status === 422) {
          const validationErrors = err.response.data.detail;
          if (Array.isArray(validationErrors)) {
            errorMessage = validationErrors.map(e => `${e.loc[1]}: ${e.msg}`).join('\n');
          } else if (typeof validationErrors === 'string') {
            errorMessage = validationErrors;
          }
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the images you want to generate.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('image_count', 5);

      const response = await axios.post(`${API_BASE_URL}/api/generate-images`, formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'image_dataset.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess('Successfully generated images. Download started.');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                         (typeof err.response?.data === 'string' ? err.response.data : 
                         'Failed to generate images. Please try again.');
      setError(errorMessage);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!generatedData) return;
    
    const blob = new Blob([generatedData.data], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `synthetic_data_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const copyToClipboard = () => {
    if (!generatedData) return;
    
    navigator.clipboard.writeText(generatedData.data)
      .then(() => setSuccess('CSV data copied to clipboard!'))
      .catch(() => setError('Failed to copy to clipboard.'));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Generation
      </Typography>
      <Typography color="text.secondary" paragraph>
        Generate synthetic datasets for your projects. Choose between tabular data, time series, or images.
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="data generation tabs"
        >
          <Tab icon={<TableIcon />} label="Tabular Data" />
          <Tab icon={<TableIcon />} label="Time-Series Data" />
          <Tab icon={<ImageIcon />} label="Image Generation" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe the data you want to generate"
                placeholder="e.g., A dataset of customers with name, email, age, and purchase history"
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateData}
                  disabled={loading || !prompt.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {loading ? 'Generating...' : 'Generate Data'}
                </Button>
                
                {generatedData && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleDownloadCSV}
                    startIcon={<DownloadIcon />}
                  >
                    Download CSV
                  </Button>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              
              {generatedData ? (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">Generated Data Preview</Typography>
                      <Box>
                        <Tooltip title="Copy to clipboard">
                          <IconButton onClick={copyToClipboard} size="small">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>{csvPreview}</pre>
                      {generatedData.data.split('\n').length > 10 && (
                        <Typography variant="caption" color="text.secondary">
                          ... and {generatedData.data.split('\n').length - 10} more rows
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box>
                    <TableIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      Your generated data will appear here
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe the time-series data you want to generate"
                placeholder="e.g., Daily temperature data for New York City for the past year with date, temperature, humidity, and weather condition"
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateData}
                  disabled={loading || !prompt.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {loading ? 'Generating...' : 'Generate Time-Series Data'}
                </Button>
                
                {generatedData && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleDownloadCSV}
                    startIcon={<DownloadIcon />}
                  >
                    Download CSV
                  </Button>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              
              {generatedData ? (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">Generated Time-Series Preview</Typography>
                      <Box>
                        <Tooltip title="Copy to clipboard">
                          <IconButton onClick={copyToClipboard} size="small">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>{csvPreview}</pre>
                      {generatedData.data.split('\n').length > 10 && (
                        <Typography variant="caption" color="text.secondary">
                          ... and {generatedData.data.split('\n').length - 10} more rows
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box>
                    <TableIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      Your generated time-series data will appear here
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe the images you want to generate"
                placeholder="e.g., A photo of a cat sitting on a table with a laptop and a cup of coffee"
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
              
              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateImages}
                  disabled={loading || !prompt.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {loading ? 'Generating...' : 'Generate Images'}
                </Button>
              </Box>
              
              <Box mt={3}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Note: Image generation may take a few moments. Once complete, a ZIP file containing all images will be downloaded automatically.
                  </Typography>
                </Alert>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box>
                  <ImageIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography color="text.secondary" paragraph>
                    Generated images will be downloaded as a ZIP file
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Note: The ZIP file will contain 5 images.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default DataGeneration;
