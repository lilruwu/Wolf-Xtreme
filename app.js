const video = document.getElementById('video');
const cameraSelect = document.getElementById('cameraSelect');
const microphoneSelect = document.getElementById('microphoneSelect');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const screenButton = document.getElementById('screen');
const downloadLink = document.getElementById('download');

let mediaRecorder;
let recordedChunks = [];
let currentStream;

navigator.mediaDevices.enumerateDevices().then(devices => {
    devices.forEach(device => {
        let option = document.createElement('option');
        option.value = device.deviceId;
        if (device.kind === 'videoinput') {
            option.text = device.label || `Cámara ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        } else if (device.kind === 'audioinput') {
            option.text = device.label || `Micrófono ${microphoneSelect.length + 1}`;
            microphoneSelect.appendChild(option);
        }
    });
});

cameraSelect.addEventListener('change', () => {
    startStream();
});

microphoneSelect.addEventListener('change', () => {
    startStream();
});

function startStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    const videoSource = cameraSelect.value;
    const audioSource = microphoneSelect.value;
    const constraints = {
        video: { deviceId: videoSource ? { exact: videoSource } : undefined },
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined }
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error al acceder a los dispositivos de medios: ', error);
        });
}

screenButton.addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);
        currentStream = combinedStream;
        video.srcObject = combinedStream;
    } catch (error) {
        console.error('Error al compartir la pantalla: ', error);
    }
});

startButton.addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(currentStream);
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
    mediaRecorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
    screenButton.disabled = true;
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
    screenButton.disabled = false;
});
