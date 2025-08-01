# predictor.py

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from typing import List, Optional, Dict, Any, Union

def detect_time_column(df: pd.DataFrame, target_column: str) -> Optional[str]:
    """
    Automatically detect the most likely time-based column in the dataframe.
    
    Args:
        df: Input dataframe
        target_column: The column being predicted (to exclude from detection)
        
    Returns:
        Name of the detected time column or None if not found
    """
    # List of common time-related column name patterns
    time_patterns = [
        'date', 'time', 'year', 'month', 'day', 'period',
        'quarter', 'week', 'hour', 'minute', 'second'
    ]
    
    # Check for columns with time-related names
    for col in df.columns:
        if col.lower() == target_column.lower():
            continue
            
        # Check if column name contains time-related terms
        if any(term in col.lower() for term in time_patterns):
            return col
    
    # If no obvious time column, look for numeric columns that could be years
    for col in df.select_dtypes(include=['number']).columns:
        if col.lower() == target_column.lower():
            continue
            
        unique_vals = df[col].dropna().unique()
        if len(unique_vals) > 0:
            # Check if values look like years (4 digits)
            if all(1900 <= x <= 2100 for x in unique_vals):
                return col
            # Check for sequential integers
            if (np.diff(np.sort(unique_vals)) == 1).all():
                return col
    
    return None

def detect_group_column(df: pd.DataFrame, target_column: str, time_column: Optional[str]) -> Optional[str]:
    """
    Detect potential grouping columns (e.g., Country, Region).
    """
    # Common grouping column names
    group_patterns = ['country', 'region', 'state', 'city', 'category', 'type', 'group', 'sector']
    
    for col in df.columns:
        col_lower = col.lower()
        if (col_lower != target_column.lower() and 
            col_lower != (time_column or '').lower() and
            any(term in col_lower for term in group_patterns)):
            return col
    
    # If no obvious group column, look for low-cardinality string columns
    if time_column:
        potential_groups = [c for c in df.select_dtypes(include=['object']).columns 
                          if c != target_column and c != time_column]
    else:
        potential_groups = [c for c in df.select_dtypes(include=['object']).columns 
                          if c != target_column]
    
    for col in potential_groups:
        if 1 < len(df[col].unique()) <= 20:  # Reasonable number of groups
            return col
    
    return None

def predict_time_series(
    df: pd.DataFrame, 
    target_column: str, 
    time_column: str, 
    group_column: Optional[str] = None, 
    steps: int = 5
) -> pd.DataFrame:
    """
    Perform time series prediction for the target column.
    
    Args:
        df: Input dataframe
        target_column: Column to predict
        time_column: Time column for prediction
        group_column: Optional column to group by
        steps: Number of future time steps to predict
        
    Returns:
        DataFrame with original and predicted values
    """
    # Make a copy to avoid modifying the original
    df = df.copy()
    
    # Convert target and time columns to appropriate types
    df[target_column] = pd.to_numeric(df[target_column], errors='coerce')
    
    # Convert time column to numeric first
    df[time_column] = pd.to_numeric(df[time_column], errors='coerce')
    
    # If we have a group column, ensure it's treated as a string category
    if group_column and group_column in df.columns:
        # Convert to string and then to category with explicit ordering
        df[group_column] = df[group_column].astype(str)
        categories = sorted(df[group_column].dropna().unique())
        df[group_column] = pd.Categorical(df[group_column], categories=categories, ordered=True)
    
    # Drop rows with missing target or time
    df = df.dropna(subset=[target_column, time_column])
    
    if df.empty:
        raise ValueError("No valid data for prediction after cleaning")
    
    # Sort by time and group (if applicable)
    sort_columns = [group_column, time_column] if group_column else [time_column]
    df = df.sort_values(by=sort_columns)
    
    # Function to make predictions for a single group
    def predict_group(group: pd.DataFrame) -> pd.DataFrame:
        if len(group) < 2:
            return pd.DataFrame()  # Skip groups with insufficient data
            
        # Prepare time index
        time_vals = pd.to_numeric(group[time_column])
        X = time_vals.values.reshape(-1, 1)
        y = group[target_column].values
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        
        # Create future time points
        last_time = time_vals.max()
        time_step = 1  # Default step size
        
        # Calculate time step from data if possible
        if len(time_vals) > 1:
            time_diffs = np.diff(time_vals.unique())
            if len(time_diffs) > 0:
                time_step = float(np.median(time_diffs))
        
        future_times = np.array([last_time + (i + 1) * time_step for i in range(steps)])
        
        # Make predictions
        future_predictions = model.predict(future_times.reshape(-1, 1))
        
        # Create prediction rows
        pred_rows = []
        for i, (time_val, pred_val) in enumerate(zip(future_times, future_predictions)):
            pred_row = {
                time_column: float(time_val),
                target_column: float(pred_val),
                'source': 'predicted'
            }
            
            # Copy group values if group column exists
            if group_column is not None and group_column in group.columns:
                # Get the first group value as a string
                group_value = str(group[group_column].iloc[0])
                pred_row[group_column] = group_value
                
            pred_rows.append(pred_row)
        
        return pd.DataFrame(pred_rows)
    
    # Apply prediction to each group or the entire dataset
    if group_column and group_column in df.columns:
        # Convert group column to string for consistent grouping
        df[group_column] = df[group_column].astype(str)
        predictions = df.groupby(group_column, group_keys=False).apply(predict_group).reset_index(drop=True)
    else:
        predictions = predict_group(df)
    
    # Mark original data
    df['source'] = 'original'
    
    # Ensure consistent column types before concatenation
    for col in df.columns:
        if col in predictions.columns and col != group_column:  # Skip group column for type conversion
            if pd.api.types.is_numeric_dtype(df[col]):
                predictions[col] = pd.to_numeric(predictions[col], errors='coerce')
    
    # Combine original and predicted data
    combined = pd.concat([df, predictions], ignore_index=True)
    
    # Sort by group and time
    sort_cols = [group_column, time_column] if group_column else [time_column]
    combined = combined.sort_values(by=sort_cols)
    
    # Convert all columns to native Python types for JSON serialization
    for col in combined.columns:
        if pd.api.types.is_categorical_dtype(combined[col]):
            combined[col] = combined[col].astype(str)
        elif pd.api.types.is_numeric_dtype(combined[col]):
            combined[col] = combined[col].apply(lambda x: x.item() if hasattr(x, 'item') else x)
    
    # Clean up any remaining NaN values
    combined = combined.where(pd.notnull(combined), None)
    
    return combined

def predict_column(
    df: pd.DataFrame, 
    target_column: str, 
    time_column: Optional[str] = None,
    group_column: Optional[str] = None,
    steps: int = 5
) -> Dict[str, Any]:
    """
    Main prediction function with automatic column detection.
    
    Args:
        df: Input dataframe
        target_column: Column to predict
        time_column: Optional time column (auto-detected if None)
        group_column: Optional group column (auto-detected if None)
        steps: Number of future time steps to predict
        
    Returns:
        Dictionary with prediction results and metadata
    """
    # Make a copy to avoid modifying the original
    df = df.copy()
    
    # Auto-detect time column if not provided
    if not time_column:
        time_column = detect_time_column(df, target_column)
        if not time_column:
            raise ValueError("Could not automatically detect a time column. Please specify one.")
    
    # Auto-detect group column if not provided
    if not group_column:
        group_column = detect_group_column(df, target_column, time_column)
    
    # Perform prediction
    try:
        result_df = predict_time_series(
            df=df,
            target_column=target_column,
            time_column=time_column,
            group_column=group_column,
            steps=steps
        )
        
        # Convert to dictionary for JSON serialization
        result_dict = {
            'success': True,
            'predictions': result_df.to_dict(orient='records'),
            'target_column': target_column,
            'time_column': time_column,
            'group_column': group_column,
            'steps': steps,
            'prediction_type': 'time_series',
            'prediction_method': 'linear_regression'
        }
        
        return result_dict
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'target_column': target_column,
            'time_column': time_column,
            'group_column': group_column,
            'steps': steps
        }
