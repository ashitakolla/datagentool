import React, { useState } from 'react';
import {
  Container, Typography, Box, Button, Grid, Paper, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Slider, TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { Publish, Timeline, Download } from '@mui/icons-material';
import axios from 'axios';

// Make sure the URL has http:// and no trailing slash
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

function DataPrediction() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [timeColumn, setTimeColumn] = useState('auto');
  const [groupColumn, setGroupColumn] = useState('none');
  const [steps, setSteps] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataPreview, setDataPreview] = useState([]);
  const [predictionResult, setPredictionResult] = useState(null);

  // Helper function to normalize column names
  const normalizeColumnName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    setError('');
    setPredictionResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          setColumns(headers);
          // Default to first column if available
          if (headers.length > 0) {
            setSelectedColumn(headers[0]);
          }
        }
      } catch (err) {
        setError('Error reading file. Please make sure it\'s a valid CSV file.');
        console.error('Error reading file:', err);
      }
    };
    reader.readAsText(file);
  };

  const handlePredict = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('column', selectedColumn);
    formData.append('steps', steps);
    formData.append('time_column', timeColumn === 'auto' ? '' : timeColumn);
    formData.append('group_column', groupColumn === 'none' ? '' : (groupColumn === 'auto' ? '' : groupColumn));

    try {
      console.log('Sending request to:', `${API_BASE_URL}/predict`);
      console.log('Form data:', {
        file: file.name,
        column: selectedColumn,
        steps,
        time_column: timeColumn,
        group_column: groupColumn
      });

      const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response received:', response);

      // Handle both single column and multiple columns response
      if (selectedColumn.toLowerCase() === 'all') {
        // For 'All' columns, we get an object with column names as keys
        setPredictionResult({
          type: 'multiple',
          data: response.data
        });
      } else {
        // For single column, we get the prediction data directly
        setPredictionResult({
          type: 'single',
          data: response.data
        });
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Failed to make prediction';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!predictionResult) return;
    
    let csvContent = '';
    let filename = '';

    if (predictionResult.type === 'multiple') {
      // For multiple columns, we need to combine all predictions
      const allRows = [];
      const allColumns = new Set();
      const columnData = {};
      
      // First pass: collect all unique column names and organize data by column
      Object.entries(predictionResult.data).forEach(([colName, result]) => {
        if (result && result.predictions) {
          result.predictions.forEach(row => {
            const key = `${row[predictionResult.data[colName].group_column || ''] || ''}_${row[predictionResult.data[colName].time_column || ''] || ''}`;
            if (!columnData[key]) {
              columnData[key] = { ...row };
            }
            columnData[key][colName] = row[colName];
            Object.keys(row).forEach(k => allColumns.add(k));
          });
        }
      });
      
      // Convert to array and sort by time
      const sortedRows = Object.values(columnData).sort((a, b) => {
        const timeA = a[predictionResult.data[Object.keys(predictionResult.data)[0]].time_column || ''];
        const timeB = b[predictionResult.data[Object.keys(predictionResult.data)[0]].time_column || ''];
        return timeA - timeB;
      });
      
      // Add header
      const columns = Array.from(allColumns);
      csvContent = columns.join(',') + '\n';
      
      // Add data rows
      sortedRows.forEach(row => {
        const rowData = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val;
        });
        csvContent += rowData.join(',') + '\n';
      });
      
      filename = `all_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Single column case (existing code)
      const { predictions } = predictionResult.data;
      if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
        console.error('No valid prediction data found');
        return;
      }
      
      const columns = Object.keys(predictions[0] || {});
      csvContent = columns.join(',') + '\n';
      
      predictions.forEach(row => {
        if (row) {
          const rowData = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return val;
          });
          csvContent += rowData.join(',') + '\n';
        }
      });
      
      filename = `predictions_${predictionResult.data.column || 'data'}.csv`;
    }
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderPredictionResults = () => {
    if (!predictionResult) return null;

    // If it's a multi-column prediction result
    if (predictionResult.type === 'multiple') {
      return (
        <div style={{ marginTop: '20px' }}>
          {Object.entries(predictionResult.data).map(([column, result]) => {
            if (!result || !result.predictions || result.predictions.length === 0) {
              return null;
            }

            // Get all unique group values if group column exists
            const groupColumn = result.group_column;
            const timeColumn = result.time_column;
            const hasGrouping = groupColumn && result.predictions.some(p => p[groupColumn]);
            
            // Get all unique group values
            const groupValues = hasGrouping 
              ? [...new Set(result.predictions.map(p => p[groupColumn]).filter(Boolean))] 
              : [null];

            return (
              <div key={column} style={{ marginBottom: '30px' }}>
                <Typography variant="h6" gutterBottom>
                  Predictions for: <strong>{column}</strong>
                  {hasGrouping && ` (Grouped by: ${groupColumn})`}
                </Typography>
                
                {result.error ? (
                  <Typography color="error">Error: {result.error}</Typography>
                ) : (
                  <div>
                    {/* Show a table for each group if grouped */}
                    {groupValues.map((groupValue, groupIndex) => {
                      // Filter predictions for this group
                      const groupPredictions = hasGrouping
                        ? result.predictions.filter(p => p[groupColumn] === groupValue)
                        : result.predictions;
                      
                      // Sort by time column if it exists
                      if (timeColumn) {
                        groupPredictions.sort((a, b) => {
                          const valA = a[timeColumn];
                          const valB = b[timeColumn];
                          
                          // Handle undefined/null values
                          if (valA == null && valB == null) return 0;
                          if (valA == null) return -1;
                          if (valB == null) return 1;
                          
                          // Convert to string for comparison if not already strings
                          const strA = String(valA);
                          const strB = String(valB);
                          
                          // For numeric values, compare as numbers
                          if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
                            return Number(valA) - Number(valB);
                          }
                          
                          // For date strings, try to parse as dates
                          const dateA = new Date(valA);
                          const dateB = new Date(valB);
                          if (!isNaN(dateA) && !isNaN(dateB)) {
                            return dateA - dateB;
                          }
                          
                          // Fall back to string comparison
                          return strA.localeCompare(strB);
                        });
                      }

                      return (
                        <div key={groupIndex} style={{ marginBottom: '30px' }}>
                          {hasGrouping && (
                            <Typography variant="subtitle1" style={{ margin: '10px 0' }}>
                              {groupColumn}: {groupValue || 'N/A'}
                            </Typography>
                          )}
                          
                          <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {Object.keys(groupPredictions[0] || {}).map((col) => (
                                    <TableCell key={col}><strong>{col}</strong></TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {groupPredictions.slice(0, 10).map((row, rowIndex) => (
                                  <TableRow 
                                    key={rowIndex}
                                    sx={{ 
                                      backgroundColor: row.source === 'predicted' ? 'rgba(255, 255, 0, 0.1)' : 'inherit',
                                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                    }}
                                  >
                                    {Object.keys(groupPredictions[0] || {}).map((col) => (
                                      <TableCell key={col}>
                                        {typeof row[col] === 'number' 
                                          ? row[col].toFixed(2) 
                                          : (row[col] || '-')}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                                {groupPredictions.length > 10 && (
                                  <TableRow>
                                    <TableCell colSpan={Object.keys(groupPredictions[0] || {}).length} align="center">
                                      ... and {groupPredictions.length - 10} more rows
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Single column prediction result
    const { predictions, column } = predictionResult.data;
    
    if (!predictions || predictions.length === 0) {
      return <Typography>No prediction data available</Typography>;
    }

    return (
      <div style={{ marginTop: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Predictions for: <strong>{column}</strong>
        </Typography>
        <div style={{ overflowX: 'auto' }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(predictions[0]).map(key => (
                    <TableCell key={key}><strong>{key}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions.slice(0, 10).map((row, idx) => (
                  <TableRow key={idx} style={{ backgroundColor: row.source === 'predicted' ? '#fff3e0' : 'inherit' }}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {predictions.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={Object.keys(predictions[0]).length} align="center">
                      ... and {predictions.length - 10} more rows
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Prediction
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Your Data
        </Typography>
        
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="contained-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="contained-button-file">
          <Button
            variant="contained"
            component="span"
            startIcon={<Publish />}
            sx={{ mb: 2 }}
          >
            Choose CSV File
          </Button>
        </label>
        
        {file && (
          <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
            {file.name}
          </Typography>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      
      {columns.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configure Prediction
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Column to Predict</InputLabel>
                <Select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  label="Column to Predict"
                  disabled={isLoading}
                >
                  <MenuItem value="all">All Numeric Columns</MenuItem>
                  {columns.map((col, index) => (
                    <MenuItem key={index} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Time Column</InputLabel>
                <Select
                  value={timeColumn}
                  onChange={(e) => setTimeColumn(e.target.value)}
                  label="Time Column"
                  disabled={isLoading}
                >
                  <MenuItem value="auto">Auto-detect</MenuItem>
                  {columns.map((col, index) => (
                    <MenuItem key={index} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Group By (Optional)</InputLabel>
                <Select
                  value={groupColumn}
                  onChange={(e) => setGroupColumn(e.target.value)}
                  label="Group By (Optional)"
                  disabled={isLoading}
                >
                  <MenuItem value="auto">Auto-detect</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                  {columns
                    .filter(col => col !== selectedColumn && 
                                 (!timeColumn || col !== timeColumn))
                    .map((col, index) => (
                      <MenuItem key={index} value={col}>
                        {col}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <Typography id="steps-slider" gutterBottom>
                  Prediction Steps: {steps}
                </Typography>
                <Slider
                  value={steps}
                  onChange={(e, newValue) => setSteps(newValue)}
                  aria-labelledby="steps-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={30}
                  disabled={isLoading}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePredict}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Timeline />}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Predicting...' : 'Run Prediction'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {dataPreview.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Preview
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {Object.keys(dataPreview[0] || {}).map((header) => (
                    <th key={header} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}
      
      {predictionResult && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              startIcon={<Download />}
            >
              Download All Predictions
            </Button>
          </div>
          {renderPredictionResults()}
        </div>
      )}
    </Container>
  );
}

export default DataPrediction;
