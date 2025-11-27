"""
Test script to verify the notch filter is working correctly
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile
import matplotlib.pyplot as plt

# Load the test audio
sample_rate, audio_data = wavfile.read('test_audio_with_60hz_hum.wav')

# Convert to float32
if audio_data.dtype == np.int16:
    audio_float = audio_data.astype(np.float32) / 32768.0
else:
    audio_float = audio_data.astype(np.float32)

print(f"Sample rate: {sample_rate}")
print(f"Audio shape: {audio_float.shape}")
print(f"Audio dtype: {audio_float.dtype}")

# Design and apply notch filter at 60 Hz
hum_freq = 60
quality_factor = 30

print(f"\nDesigning notch filter at {hum_freq} Hz with Q={quality_factor}")

# Create the notch filter
b, a = signal.iirnotch(hum_freq, quality_factor, sample_rate)

print(f"Filter coefficients b: {b}")
print(f"Filter coefficients a: {a}")

# Apply the filter using filtfilt (zero-phase)
filtered = signal.filtfilt(b, a, audio_float)

print(f"\nFiltered audio shape: {filtered.shape}")
print(f"Filtered audio dtype: {filtered.dtype}")

# Apply filters at all harmonics
for harmonic in [1, 2, 3, 4, 5]:
    freq = hum_freq * harmonic
    if freq < sample_rate / 2:
        b, a = signal.iirnotch(freq, quality_factor, sample_rate)
        filtered = signal.filtfilt(b, a, filtered)
        print(f"Applied filter at {freq} Hz")

# Convert back to int16
filtered_int16 = (filtered * 32767).astype(np.int16)

# Save filtered audio
wavfile.write('test_filtered_output.wav', sample_rate, filtered_int16)
print(f"\nSaved filtered audio to: test_filtered_output.wav")

# Compute FFT for original and filtered
fft_original = np.fft.rfft(audio_float)
fft_filtered = np.fft.rfft(filtered)
freqs = np.fft.rfftfreq(len(audio_float), 1/sample_rate)

# Find power at 60 Hz
idx_60 = np.argmin(np.abs(freqs - 60))
power_original_60 = np.abs(fft_original[idx_60])
power_filtered_60 = np.abs(fft_filtered[idx_60])

print(f"\nPower at 60 Hz:")
print(f"  Original: {power_original_60:.2f}")
print(f"  Filtered: {power_filtered_60:.2f}")
print(f"  Reduction: {(1 - power_filtered_60/power_original_60)*100:.1f}%")

# Check 120 Hz
idx_120 = np.argmin(np.abs(freqs - 120))
power_original_120 = np.abs(fft_original[idx_120])
power_filtered_120 = np.abs(fft_filtered[idx_120])

print(f"\nPower at 120 Hz:")
print(f"  Original: {power_original_120:.2f}")
print(f"  Filtered: {power_filtered_120:.2f}")
print(f"  Reduction: {(1 - power_filtered_120/power_original_120)*100:.1f}%")

print("\n✅ Test complete! Compare test_audio_with_60hz_hum.wav with test_filtered_output.wav")

