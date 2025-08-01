from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from generator import generate_csv_data
from utils import csv_text_to_dataframe, clean_dataframe_for_export
from predictor import predict_column
import pandas as pd
import zipfile
import os
import tempfile
import json
import io
from typing import Optional, Dict, Any, List
import numpy as np

# Create a router instead of a FastAPI app
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Welcome to DataGen API"}

@router.post("/generate")
async def generate_data(
    prompt: str = Form(...),
    dataset_type: str = Form("tabular"),
    row_count: int = Form(100),
):
    try:
        # Generate CSV data using existing logic
        csv_text = generate_csv_data(prompt, dataset_type)
        df = csv_text_to_dataframe(csv_text)
        
        # Limit rows if needed
        if len(df) > row_count:
            df = df.head(row_count)
            
        # Clean the dataframe
        df_clean = clean_dataframe_for_export(df)
        
        # Convert to CSV for response
        csv_data = df_clean.to_csv(index=False, encoding='utf-8')
        
        # Prepare response
        result = {
            "success": True,
            "data": csv_data,
            "columns": list(df_clean.columns),
            "row_count": len(df_clean),
            "column_count": len(df_clean.columns)
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict")
async def predict_data(
    file: UploadFile = File(...),
    column: str = Form(None),
    steps: int = Form(5, ge=1, le=30),
    time_column: str = Form(None),
    group_column: str = Form(None)
):
    try:
        print(f"Received prediction request. Column: {column}, Steps: {steps}, Time Column: {time_column}, Group Column: {group_column}")
        
        # Read and parse the uploaded file
        contents = await file.read()
        
        # Try different encodings if needed
        encodings = ['utf-8', 'latin1', 'windows-1252']
        df = None
        
        for encoding in encodings:
            try:
                contents_str = contents.decode(encoding)
                df = pd.read_csv(io.StringIO(contents_str))
                print(f"Successfully read file with {encoding} encoding")
                break
            except Exception as e:
                print(f"Failed to read with {encoding}: {str(e)}")
                continue
        
        if df is None or df.empty:
            error_msg = "Failed to read the uploaded file. Please check if it's a valid CSV file."
            print(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        
        print(f"Original columns: {df.columns.tolist()}")
        print(f"First few rows of data:\n{df.head().to_string()}")
        
        # Convert empty strings to None for optional parameters
        time_column = time_column if time_column and time_column.lower() != 'auto' else None
        group_column = group_column if group_column and group_column.lower() != 'auto' else None
        
        # Convert steps to integer
        try:
            steps = int(steps)
        except (ValueError, TypeError):
            steps = 5  # Default value
        
        # Handle 'all' columns case
        if column and column.lower() == 'all':
            print("Predicting all numeric columns")
            all_results = {}
            
            # Get all numeric columns (excluding time and group columns)
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            if time_column and time_column in numeric_cols:
                numeric_cols.remove(time_column)
            if group_column and group_column in numeric_cols:
                numeric_cols.remove(group_column)
                
            if not numeric_cols:
                raise HTTPException(status_code=400, detail="No numeric columns found for prediction")
                
            # Predict each column
            for col in numeric_cols:
                print(f"Predicting column: {col}")
                try:
                    result = predict_column(
                        df=df,
                        target_column=col,
                        time_column=time_column,
                        group_column=group_column,
                        steps=steps
                    )
                    all_results[col] = clean_nans(result)
                except Exception as e:
                    print(f"Error predicting column {col}: {str(e)}")
                    all_results[col] = {"error": f"Failed to predict: {str(e)}"}
            
            return all_results
        
        # Single column prediction (original behavior)
        else:
            # Check if the target column exists
            if not column or column not in df.columns:
                error_msg = f"Target column '{column}' not found in the uploaded file. Available columns: {', '.join(df.columns)}"
                print(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
            
            print(f"Starting prediction with params - column: {column}, steps: {steps}, time_column: {time_column}, group_column: {group_column}")
            
            # Call the prediction function
            result = predict_column(
                df=df,
                target_column=column,
                time_column=time_column,
                group_column=group_column,
                steps=steps
            )
            
            print("Prediction completed successfully")
            return clean_nans(result)
        
    except HTTPException as he:
        print(f"HTTP Exception: {str(he.detail)}")
        raise
    except Exception as e:
        error_msg = f"Error during prediction: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

def clean_nans(obj):
    """Helper function to clean NaN values for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(item) for item in obj]
    elif pd.isna(obj):
        return None
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj) if not pd.isna(obj) else None
    return obj

# CORS middleware to allow frontend access
app = FastAPI(title="DataGen API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router with an optional prefix
app.include_router(router, prefix="/api")

# Add a simple root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to DataGen API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.api:app", host="0.0.0.0", port=8000, reload=True)
