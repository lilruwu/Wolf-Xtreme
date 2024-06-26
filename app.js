const screenVideo = document.getElementById('screenVideo');
const cameraVideo = document.getElementById('cameraVideo');
const cameraSelect = document.getElementById('cameraSelect');
const microphoneSelect = document.getElementById('microphoneSelect');
const positionSelect = document.getElementById('positionSelect');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const screenButton = document.getElementById('screen');
const downloadLink = document.getElementById('download');

let mediaRecorder;
let recordedChunks = [];
let screenStream;
let cameraStream;
let combinedStream;

// Get available media devices
navigator.mediaDevices.enumerateDevices().then(devices => {
    devices.forEach(device => {
        let option = document.createElement('option');
        option.value = device.deviceId;
        if (device.kind === 'videoinput') {
            option.text = device.label || `Camera ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        } else if (device.kind === 'audioinput') {
            option.text = device.label || `Microphone ${microphoneSelect.length + 1}`;
            microphoneSelect.appendChild(option);
        }
    });
});

// Change camera stream when a new camera is selected
cameraSelect.addEventListener('change', () => {
    startCameraStream();
});

// Start camera stream with selected camera
function startCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    const videoSource = cameraSelect.value;
    const constraints = {
        video: { deviceId: videoSource ? { exact: videoSource } : undefined },
        audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            cameraStream = stream;
            cameraVideo.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing camera: ', error);
        });
}

// Capture screen and combine with audio and camera
screenButton.addEventListener('click', async () => {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined } });
        combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);
        screenVideo.srcObject = combinedStream;

        // Add camera video to screen video
        const cameraPosition = positionSelect.value;
        cameraVideo.className = cameraPosition;

        mediaRecorder = new MediaRecorder(combinedStream);
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = function() {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = 'recording.webm';
            downloadLink.style.display = 'block';
        };
        screenButton.disabled = true;
        startButton.disabled = false;
    } catch (error) {
        console.error('Error sharing screen: ', error);
    }
});

startButton.addEventListener('click', () => {
    recordedChunks = [];
    if (cameraStream) {
        cameraStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
    }
    mediaRecorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
    screenButton.disabled = false;
});
