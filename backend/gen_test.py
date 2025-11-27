import numpy as np
from scipy.io import wavfile

# Parameters
duration = 5  # seconds
sample_rate = 44100
frequency = 440  # Main tone (A4 note)
hum_frequency = 60  # Power line hum

# Generate time array
t = np.linspace(0, duration, int(sample_rate * duration))

# Generate clean signal
clean_signal = np.sin(2 * np.pi * frequency * t)

# Add 60 Hz hum and harmonics
hum = 0.3 * np.sin(2 * np.pi * hum_frequency * t)
hum += 0.15 * np.sin(2 * np.pi * 2 * hum_frequency * t)  # 120 Hz
hum += 0.08 * np.sin(2 * np.pi * 3 * hum_frequency * t)  # 180 Hz

# Combine signals
signal_with_hum = clean_signal + hum

# Normalize to 16-bit range
signal_with_hum = np.int16(signal_with_hum / np.max(np.abs(signal_with_hum)) * 32767)

# Save
wavfile.write('test_audio_with_60hz_hum.wav', sample_rate, signal_with_hum)
print("Test file created: test_audio_with_60hz_hum.wav")