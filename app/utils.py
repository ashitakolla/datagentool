import pandas as pd
import io
import re

def csv_text_to_dataframe(csv_text):
    try:
        # Clean up the CSV text - remove any extra text before/after the CSV
        cleaned_text = csv_text.strip()
        
        # Remove any markdown code blocks if present
        if cleaned_text.startswith('```'):
            # Find the first and last ``` markers
            start_idx = cleaned_text.find('\n', 3) + 1
            end_idx = cleaned_text.rfind('```')
            if end_idx > start_idx:
                cleaned_text = cleaned_text[start_idx:end_idx].strip()
        
        # Remove any language specifiers like ```csv
        cleaned_text = re.sub(r'^```\w*\n', '', cleaned_text)
        cleaned_text = re.sub(r'\n```$', '', cleaned_text)
        
        # Ensure the text ends with a newline
        if not cleaned_text.endswith('\n'):
            cleaned_text += '\n'
        
        # Try to parse as CSV with more robust settings
        df = pd.read_csv(io.StringIO(cleaned_text), 
                        encoding='utf-8',
                        on_bad_lines='skip',  # Skip problematic lines
                        skip_blank_lines=True)
        
        # Clean up column names (remove extra whitespace)
        df.columns = df.columns.str.strip()
        
        # Remove any completely empty rows
        df = df.dropna(how='all')
        
        return df
    except Exception as e:
        # If CSV parsing fails, try to extract CSV-like structure
        try:
            lines = cleaned_text.split('\n')
            csv_lines = []
            for line in lines:
                line = line.strip()
                if line and ',' in line and not line.startswith('#'):
                    csv_lines.append(line)
            
            if csv_lines:
                # Reconstruct CSV text
                csv_text_clean = '\n'.join(csv_lines)
                df = pd.read_csv(io.StringIO(csv_text_clean), 
                               encoding='utf-8',
                               on_bad_lines='skip',
                               skip_blank_lines=True)
                df.columns = df.columns.str.strip()
                df = df.dropna(how='all')
                return df
        except:
            pass
        
        raise ValueError(f"Failed to convert text to DataFrame: {e}")

def clean_dataframe_for_export(df):
    """
    Clean and validate DataFrame before CSV export
    """
    # Make a copy to avoid modifying the original
    df_clean = df.copy()
    
    # Clean column names (remove extra whitespace)
    df_clean.columns = df_clean.columns.str.strip()
    
    # Remove any completely empty rows
    df_clean = df_clean.dropna(how='all')
    
    # Fill NaN values with appropriate defaults (preserve original data types)
    for col in df_clean.columns:
        if df_clean[col].dtype == 'object':
            # For string columns, fill NaN with empty string
            df_clean[col] = df_clean[col].fillna('')
        elif df_clean[col].dtype in ['int64', 'float64']:
            # For numeric columns, fill NaN with 0
            df_clean[col] = df_clean[col].fillna(0)
        else:
            # For other types, try to preserve the original type
            df_clean[col] = df_clean[col].fillna('')
    
    # Clean string columns (remove extra whitespace)
    for col in df_clean.select_dtypes(include=['object']).columns:
        df_clean[col] = df_clean[col].astype(str).str.strip()
    
    # Ensure numeric columns are properly formatted (but don't force conversion)
    for col in df_clean.select_dtypes(include=['number']).columns:
        # Only convert if the column contains valid numeric data
        try:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
            df_clean[col] = df_clean[col].fillna(0)
        except:
            # If conversion fails, keep as is
            pass
    
    return df_clean
