def build_prompt(user_prompt: str) -> str:
    return f"""
You are a tool that generates realistic tabular datasets in CSV format.

The user says:
"{user_prompt}"

Generate a CSV table with the following requirements:
- Include 20+ rows and 4+ columns
- Use clear, descriptive column names
- Ensure all data is properly formatted
- No extra text, explanations, or markdown formatting
- Return ONLY the CSV data with headers

Example format:
Name,Age,City,Salary
John Doe,25,New York,50000
Jane Smith,30,Los Angeles,60000
"""

def build_time_series_prompt(user_prompt: str) -> str:
    return f"""
You are a tool that generates realistic time-series datasets in CSV format.

The user says:
"{user_prompt}"

Generate a CSV table with the following requirements:
- Include a 'date' column and at least 2 other variables
- Use realistic time formats (YYYY-MM-DD or MM/DD/YYYY)
- Span multiple years with realistic data
- Use clear, descriptive column names
- Ensure all data is properly formatted
- No extra text, explanations, or markdown formatting
- Return ONLY the CSV data with headers

Example format:
Date,Sales,Revenue,Temperature
2020-01-01,100,5000,45.2
2020-01-02,120,6000,47.8
"""
