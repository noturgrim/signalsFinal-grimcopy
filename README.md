# Audio Hum Remover

A web-based audio processing application that removes electrical power line interference from audio recordings using advanced digital signal processing techniques.

## Overview

Power line hum at 50Hz or 60Hz frequencies creates unwanted background noise in audio recordings. This application analyzes audio files, automatically detects the interference frequency, and removes it along with its harmonics using precision IIR notch filters, resulting in clean, professional-quality audio.

## Features

- Automatic hum frequency detection (50Hz/60Hz)
- Manual frequency selection for custom processing
- Support for multiple audio formats (WAV, MP3, OGG, FLAC)
- Real-time audio comparison (original vs processed)
- Intuitive drag-and-drop interface
- Instant download of processed audio
- Responsive design for all devices

## Technology Stack

### Backend
- Python 3.11
- Flask (REST API framework)
- SciPy (IIR notch filter implementation)
- NumPy (numerical processing)
- Pydub (multi-format audio handling)

### Frontend
- React 19
- Vite (build tool and development server)
- Tailwind CSS 4.1
- Modern JavaScript (ES6+)

## Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 16 or higher
- npm or yarn package manager

### Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend API will start on `http://localhost:5000`

### Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will start on `http://localhost:5173`

## Usage

1. Open the application in your web browser
2. Upload an audio file by clicking or dragging into the upload area
3. Select frequency mode (Auto-detect, 50Hz, or 60Hz)
4. Click "Process Audio" to remove the interference
5. Compare the original and processed audio using the built-in players
6. Download the cleaned audio file

## Technical Details

### Signal Processing

The application employs cascaded IIR notch filters to remove power line interference:

- **Filter Type**: Second-order IIR notch filter
- **Quality Factor**: Q = 30 (narrow bandwidth for precise frequency removal)
- **Target Frequencies**: Fundamental (50/60Hz) and harmonics (100/120Hz, 150/180Hz, etc.)
- **Implementation**: Zero-phase filtering via `scipy.signal.filtfilt` to prevent audio distortion

### API Endpoints

#### POST `/api/process-audio`
Processes uploaded audio file to remove hum interference.

**Request:**
- Content-Type: `multipart/form-data`
- Parameters:
  - `file`: Audio file (required)
  - `humFrequency`: "auto" | 50 | 60 (optional, default: "auto")

**Response:**
```json
{
  "success": true,
  "processedAudio": "base64_encoded_wav_data",
  "sampleRate": 44100,
  "humFrequency": 60,
  "detectedFrequency": 60,
  "autoDetected": true,
  "message": "Auto-detected and removed 60 Hz hum and harmonics"
}
```

#### POST `/api/detect-hum`
Analyzes audio file to detect hum frequency without processing.

#### GET `/api/health`
Health check endpoint for monitoring service status.

## Project Structure

```
├── backend/
│   ├── app.py              # Flask API and signal processing
│   ├── requirements.txt    # Python dependencies
│   └── Sample Audio/       # Test audio files
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # Application entry point
│   │   └── index.css       # Global styles
│   ├── public/
│   │   └── hum.svg         # Application icon
│   ├── index.html          # HTML template
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── README.md
```

## Performance Considerations

- Maximum file size: 50MB
- Processing time: 1-5 seconds for typical audio files
- Supported sample rates: All standard rates (8kHz - 192kHz)
- Memory usage: Approximately 3-5x the input file size during processing

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Deployment

The application is designed for deployment on Render.com or similar platforms. Configure environment variables:

### Backend
- `PORT`: Automatically provided by hosting platform
- `FRONTEND_URL`: Your frontend domain for CORS configuration

### Frontend
- `VITE_API_URL`: Your backend API URL

## Contributors

- Dan Lius Monsales
- Eduardo Miguel Cortes
- Regine Christian Buenafe

## License

This project is provided for educational and personal use.

---

Built with Flask, React, and SciPy
