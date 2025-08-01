# DataGen AI Tool

A powerful tool for generating synthetic datasets and performing data analysis with a modern React frontend and Python backend.

## Features

- **Data Generation**: Create synthetic tabular and time-series datasets using AI
- **Image Generation**: Generate images based on text prompts
- **Data Prediction**: Upload CSV files and get predictions
- **Modern UI**: Clean, responsive interface built with React and Material-UI
- **RESTful API**: Backend built with FastAPI for easy integration

## Prerequisites

- Node.js (v16 or later)
- Python 3.8+
- pip (Python package manager)

## Getting Started

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd data_gen_tool
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

5. Start the FastAPI backend:
   ```bash
   cd app
   uvicorn api:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## Project Structure

```
data_gen_tool/
├── app/                      # Backend Python code
│   ├── __init__.py
│   ├── api.py               # FastAPI application
│   ├── generator.py         # Data generation logic
│   ├── main.py              # Original Streamlit app
│   ├── predictor.py         # Prediction logic
│   ├── requirements.txt     # Python dependencies
│   └── utils.py             # Utility functions
│
├── frontend/                # React frontend
│   ├── public/              # Static files
│   └── src/
│       ├── components/      # Reusable components
│       ├── pages/           # Page components
│       ├── App.js           # Main app component
│       └── index.js         # Entry point
│
├── .env.example             # Example environment variables
└── README.md                # This file
```

## API Endpoints

### Data Generation
- `POST /api/generate-data`
  - Generate synthetic CSV data
  - Parameters: `prompt` (string), `dataset_type` (string), `row_count` (int)

### Image Generation
- `POST /api/generate-images`
  - Generate images from text prompts
  - Parameters: `prompt` (string), `image_count` (int)

### Prediction
- `POST /api/predict`
  - Make predictions on uploaded CSV data
  - Parameters: `file` (CSV), `columns` (array), `steps` (int), `time_column` (string, optional)

## Available Scripts

In the project directory, you can run:

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (use with caution)

## Deployment

### Backend

1. Install production dependencies:
   ```bash
   pip install gunicorn uvicorn[standard]
   ```

2. Run with Gunicorn:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.api:app
   ```

### Frontend

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Serve the static files using a web server like Nginx or Apache.

## Environment Variables

### Backend
- `OPENROUTER_API_KEY`: Your OpenRouter API key for AI model access

### Frontend
- `REACT_APP_API_URL`: Base URL for the backend API (default: `http://localhost:8000`)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenRouter](https://openrouter.ai/)