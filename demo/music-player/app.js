import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Global variables
let gestureRecognizer;
let runningMode = "IMAGE";
let webcamRunning = false;
let lastVideoTime = -1;
let results = undefined;
let currentVideoIndex = 0;
let playlist = [];
let isDragging = false;
let lastGestureTime = 0;
const DEBOUNCE_TIME = 2000; // 2 seconds debounce
let isMirrorMode = true; // Add mirror mode flag
let isVideoMaximized = false; // Add flag for video size state

// DOM Elements
const loading = document.getElementById('loading');
const webcamModal = document.getElementById('webcamModal');
const enableWebcamBtn = document.getElementById('enableWebcamBtn');
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureOutput = document.getElementById('gesture_output');
const musicPlayer = document.getElementById('musicPlayer');
const playlistBtn = document.getElementById('playlistBtn');
const playlistModal = document.getElementById('playlistModal');
const playlistContainer = document.getElementById('playlist');
const addVideoBtn = document.getElementById('addVideoBtn');
const addVideoModal = document.getElementById('addVideoModal');
const videoUrl = document.getElementById('videoUrl');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const confirmAddBtn = document.getElementById('confirmAddBtn');
const closePlaylistBtn = document.getElementById('closePlaylistBtn');

// Create Gesture Hint panel
const gestureHintPanel = document.createElement('div');
gestureHintPanel.className = 'fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg shadow-lg z-50 transition-transform duration-300';
gestureHintPanel.innerHTML = `
    <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-bold">Gesture Controls</h3>
        <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
                <span class="text-sm">Mirror Mode</span>
                <input type="checkbox" id="mirrorModeToggle" class="form-checkbox h-4 w-4 text-blue-500" ${isMirrorMode ? 'checked' : ''}>
            </label>
            <button id="toggleHintPanel" class="text-white hover:text-blue-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
        <div>
            <h4 class="font-semibold text-blue-400 mb-2">Right Hand</h4>
            <ul class="text-sm space-y-1">
                <li>👋 Open Palm: Fullscreen</li>
                <li>✊ Closed Fist: Exit Fullscreen</li>
                <li>👍 Thumb Up: Play</li>
                <li>👎 Thumb Down: Pause</li>
            </ul>
        </div>
        <div>
            <h4 class="font-semibold text-green-400 mb-2">Left Hand</h4>
            <ul class="text-sm space-y-1">
                <li>👋 Open Palm: Show Playlist</li>
                <li>✊ Closed Fist: Hide Playlist</li>
                <li>👍 Thumb Up: Next Video</li>
                <li>👎 Thumb Down: Previous Video</li>
            </ul>
        </div>
    </div>
`;
document.body.appendChild(gestureHintPanel);

// Create toggle button for collapsed state
const toggleButton = document.createElement('button');
toggleButton.id = 'showHintPanel';
toggleButton.className = 'fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 hidden';
toggleButton.innerHTML = `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
    </svg>
`;
document.body.appendChild(toggleButton);

// Add toggle functionality for gesture hint panel
let isHintPanelCollapsed = false;
document.getElementById('toggleHintPanel').addEventListener('click', () => {
    isHintPanelCollapsed = !isHintPanelCollapsed;
    gestureHintPanel.style.transform = isHintPanelCollapsed ? 'translateX(calc(100% - 40px))' : 'translateX(0)';
    toggleButton.style.display = isHintPanelCollapsed ? 'block' : 'none';
});

// Add show panel functionality
document.getElementById('showHintPanel').addEventListener('click', () => {
    isHintPanelCollapsed = false;
    gestureHintPanel.style.transform = 'translateX(0)';
    toggleButton.style.display = 'none';
});

// Add mirror mode toggle handler
document.getElementById('mirrorModeToggle').addEventListener('change', (e) => {
    isMirrorMode = e.target.checked;
});

// Create marquee text container
const marqueeContainer = document.createElement('div');
marqueeContainer.className = 'fixed top-4 left-0 w-full overflow-hidden z-50 transition-opacity duration-300';
marqueeContainer.style.opacity = '0'; // Initially hidden
marqueeContainer.innerHTML = `
    <div class="marquee-text text-white text-2xl font-bold whitespace-nowrap">
        Now Playing: <span class="text-blue-400"></span>
    </div>
`;
document.body.appendChild(marqueeContainer);

// Add marquee animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes marquee {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
    }
    .marquee-text {
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
`;
document.head.appendChild(style);

// Function to update marquee text
function updateMarqueeText(title, isPlaying) {
    const marqueeText = marqueeContainer.querySelector('.marquee-text');
    marqueeText.innerHTML = `Now Playing: <span class="text-blue-400">${title}</span>`;
    
    if (isPlaying) {
        marqueeContainer.style.opacity = '1';
        marqueeText.style.animation = 'none';
        marqueeText.offsetHeight; // Trigger reflow
        marqueeText.style.animation = 'marquee 20s linear infinite';
    } else {
        marqueeContainer.style.opacity = '0';
        marqueeText.style.animation = 'none';
    }
}

// Set z-index for proper layering
video.style.zIndex = '0';
canvasElement.style.zIndex = '1';
musicPlayer.style.zIndex = '2';
playlistBtn.style.zIndex = '2';

// Hide canvas initially
canvasElement.style.display = 'none';

// Debug canvas initialization
console.log('Canvas element:', canvasElement);
console.log('Canvas context:', canvasCtx);
console.log('Canvas dimensions:', {
    width: canvasElement.width,
    height: canvasElement.height,
    clientWidth: canvasElement.clientWidth,
    clientHeight: canvasElement.clientHeight,
    offsetWidth: canvasElement.offsetWidth,
    offsetHeight: canvasElement.offsetHeight
});

// Test canvas drawing immediately
try {
    canvasCtx.fillStyle = 'red';
    canvasCtx.fillRect(0, 0, 100, 100);
    console.log('Initial test drawing completed');
} catch (error) {
    console.error('Error in initial test drawing:', error);
}

// Load playlist from localStorage or default
async function loadPlaylist() {
    try {
        const savedPlaylist = localStorage.getItem('playlist');
        if (savedPlaylist) {
            playlist = JSON.parse(savedPlaylist);
        } else {
            const response = await fetch('playlistDefault.json');
            const data = await response.json();
            playlist = data.videos;
            localStorage.setItem('playlist', JSON.stringify(playlist));
        }
        updatePlaylistUI();
        if (playlist.length > 0) {
            loadVideo(currentVideoIndex);
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
    }
}

// Update playlist UI
function updatePlaylistUI() {
    playlistContainer.innerHTML = '';
    if (playlist.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-8 text-gray-400';
        emptyState.innerHTML = `
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
            <p class="text-lg">Playlist is empty</p>
            <p class="text-sm mt-2">Add some videos to get started!</p>
        `;
        playlistContainer.appendChild(emptyState);
        return;
    }

    playlist.forEach((video, index) => {
        const videoElement = document.createElement('div');
        videoElement.className = `glass p-3 rounded-lg flex items-center space-x-3 hover:bg-opacity-50 transition-all duration-200 cursor-pointer group ${index === currentVideoIndex ? 'ring-2 ring-blue-500 bg-opacity-50' : ''}`;
        videoElement.innerHTML = `
            <div class="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-800">
                <img src="https://img.youtube.com/vi/${video.id}/default.jpg" 
                     alt="${video.title}"
                     class="w-full h-full object-cover"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxsaW5lIHgxPSI4IiB5MT0iMTIiIHgyPSIxNiIgeTI9IjEyIj48L2xpbmU+PGxpbmUgeDE9IjEyIiB5MT0iOCIgeDI9IjEyIiB5Mj0iMTYiPjwvbGluZT48L3N2Zz4='">
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                    <p class="text-sm font-medium truncate">${video.title}</p>
                    ${index === currentVideoIndex ? '<span class="text-blue-500 text-sm">▶</span>' : ''}
                </div>
                <p class="text-xs text-gray-400 mt-1">Video ${index + 1} of ${playlist.length}</p>
            </div>
            <button class="delete-video flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-index="${index}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        `;

        // Add click event to play the video
        videoElement.addEventListener('click', (e) => {
            // Don't trigger if clicking the delete button
            if (!e.target.closest('.delete-video')) {
                currentVideoIndex = index;
                loadVideo(index);
                updatePlaylistUI(); // Update UI to show current playing video
            }
        });

        playlistContainer.appendChild(videoElement);
    });

    // Add click event for delete buttons
    document.querySelectorAll('.delete-video').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the parent click event
            const index = parseInt(e.currentTarget.dataset.index);
            playlist.splice(index, 1);
            localStorage.setItem('playlist', JSON.stringify(playlist));
            updatePlaylistUI();
            if (index === currentVideoIndex) {
                currentVideoIndex = Math.min(index, playlist.length - 1);
                if (playlist.length > 0) {
                    loadVideo(currentVideoIndex);
                }
            }
        });
    });
}

// Load video by index
function loadVideo(index) {
    if (!window.player || !window.player.loadVideoById) {
        console.error('YouTube Player is not ready');
        return;
    }
    if (playlist.length === 0) return;
    currentVideoIndex = index;
    const video = playlist[index];
    window.player.loadVideoById(video.id);
    updateMarqueeText(video.title, false); // Initially not playing
}

// Initialize Gesture Recognizer
async function createGestureRecognizer() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "GPU"
            },
            runningMode: runningMode
        });
        loading.style.display = 'none';
        webcamModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error initializing gesture recognizer:', error);
    }
}

// Enable webcam
function enableCam() {
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
        return;
    }

    webcamRunning = !webcamRunning;
    enableWebcamBtn.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";

    if (webcamRunning) {
        webcamModal.classList.add('hidden');
        const constraints = { 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                video.srcObject = stream;
                video.addEventListener("loadeddata", () => {
                    // Set canvas size to match video
                    canvasElement.width = video.videoWidth;
                    canvasElement.height = video.videoHeight;
                    // Show canvas after video is loaded
                    canvasElement.style.display = 'block';
                    predictWebcam();
                });
            })
            .catch(error => {
                console.error('Error accessing webcam:', error);
                webcamRunning = false;
                enableWebcamBtn.innerText = "ENABLE PREDICTIONS";
                // Hide canvas if webcam fails
                canvasElement.style.display = 'none';
            });
    } else {
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        // Hide canvas when webcam is disabled
        canvasElement.style.display = 'none';
    }
}

// Predict webcam
async function predictWebcam() {
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    // Clear canvas first
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw video frame
    canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    if (results?.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        try {
            // Draw landmarks directly
            landmarks.forEach((landmark, index) => {
                const x = landmark.x * canvasElement.width;
                const y = landmark.y * canvasElement.height;
                
                // Draw landmark point with glow effect
                canvasCtx.shadowColor = '#FF0000';
                canvasCtx.shadowBlur = 10;
                canvasCtx.fillStyle = '#FF0000';
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
                canvasCtx.fill();

                // Reset shadow for connections
                canvasCtx.shadowBlur = 0;

                // Draw connections between landmarks
                if (index < landmarks.length - 1) {
                    const nextLandmark = landmarks[index + 1];
                    const nextX = nextLandmark.x * canvasElement.width;
                    const nextY = nextLandmark.y * canvasElement.height;

                    // Create gradient for connections
                    const gradient = canvasCtx.createLinearGradient(x, y, nextX, nextY);
                    gradient.addColorStop(0, '#00FF00');
                    gradient.addColorStop(1, '#00FFFF');

                    canvasCtx.strokeStyle = gradient;
                    canvasCtx.lineWidth = 2;
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(x, y);
                    canvasCtx.lineTo(nextX, nextY);
                    canvasCtx.stroke();
                }
            });

            // Draw gesture name if detected
            if (results.gestures && results.gestures.length > 0) {
                const gesture = results.gestures[0][0];
                let handedness = results.handednesses[0][0].displayName;
                
                // Apply mirror mode to displayed handedness
                if (isMirrorMode) {
                    handedness = handedness === 'Right' ? 'Left' : 'Right';
                }
                
                // Calculate position for text
                const x = landmarks[0].x * canvasElement.width;
                const y = landmarks[0].y * canvasElement.height - 50; // Move text higher

                // Draw background for text with rounded corners
                canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const textWidth = 200;
                const textHeight = 60; // Increased height to accommodate both lines
                const radius = 10;
                
                canvasCtx.beginPath();
                canvasCtx.moveTo(x + radius, y - textHeight);
                canvasCtx.lineTo(x + textWidth - radius, y - textHeight);
                canvasCtx.quadraticCurveTo(x + textWidth, y - textHeight, x + textWidth, y - textHeight + radius);
                canvasCtx.lineTo(x + textWidth, y - radius);
                canvasCtx.quadraticCurveTo(x + textWidth, y, x + textWidth - radius, y);
                canvasCtx.lineTo(x + radius, y);
                canvasCtx.quadraticCurveTo(x, y, x, y - radius);
                canvasCtx.lineTo(x, y - textHeight + radius);
                canvasCtx.quadraticCurveTo(x, y - textHeight, x + radius, y - textHeight);
                canvasCtx.closePath();
                canvasCtx.fill();

                // Draw gesture name with better styling
                canvasCtx.font = 'bold 16px Arial';
                canvasCtx.fillStyle = '#FFFFFF';
                canvasCtx.textAlign = 'left';
                canvasCtx.fillText(`${handedness}: ${gesture.categoryName}`, x + 10, y - 35);
                
                // Draw confidence score
                const confidence = Math.round(gesture.score * 100);
                canvasCtx.font = '14px Arial';
                canvasCtx.fillStyle = '#00FF00';
                canvasCtx.fillText(`Confidence: ${confidence}%`, x + 10, y - 15);
            }
        } catch (error) {
            console.error('Error drawing landmarks:', error);
        }
    }

    // Handle gestures
    if (results?.gestures?.length > 0 && nowInMs - lastGestureTime > DEBOUNCE_TIME) {
        const categoryName = results.gestures[0][0].categoryName;
        const handedness = results.handednesses[0][0].displayName;
        
        handleGesture(categoryName, handedness);
        lastGestureTime = nowInMs;
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Handle gestures
function handleGesture(categoryName, handedness) {
    if (!window.player || !window.player.getPlayerState) {
        console.error('YouTube Player is not ready');
        return;
    }

    // Apply mirror mode if enabled
    if (isMirrorMode) {
        handedness = handedness === 'Right' ? 'Left' : 'Right';
    }

    switch (categoryName) {
        case "Open_Palm":
            if (handedness === "Right") {
                if (window.player.getPlayerState() === YT.PlayerState.PLAYING) {
                    // Get both container and iframe
                    const container = document.getElementById('musicPlayer');
                    const iframe = container.querySelector('iframe');
                    
                    if (container && iframe && !isVideoMaximized) {
                        // Store original styles
                        container.dataset.originalPosition = container.style.position;
                        container.dataset.originalTop = container.style.top;
                        container.dataset.originalLeft = container.style.left;
                        container.dataset.originalZIndex = container.style.zIndex;
                        
                        iframe.dataset.originalWidth = iframe.style.width;
                        iframe.dataset.originalHeight = iframe.style.height;
                        iframe.dataset.originalPosition = iframe.style.position;
                        iframe.dataset.originalTop = iframe.style.top;
                        iframe.dataset.originalLeft = iframe.style.left;
                        iframe.dataset.originalZIndex = iframe.style.zIndex;
                        
                        // Maximize container
                        container.style.position = 'fixed';
                        container.style.top = '0';
                        container.style.left = '0';
                        container.style.width = '100vw';
                        container.style.height = '100vh';
                        container.style.zIndex = '1000';
                        
                        // Maximize iframe
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.style.position = 'absolute';
                        iframe.style.top = '0';
                        iframe.style.left = '0';
                        iframe.style.zIndex = '1000';
                        
                        isVideoMaximized = true;
                    }
                }
            } else if (handedness === "Left") {
                playlistModal.classList.remove('hidden');
            }
            break;
        case "Closed_Fist":
            if (handedness === "Right") {
                // Restore original sizes
                const container = document.getElementById('musicPlayer');
                const iframe = container.querySelector('iframe');
                
                if (container && iframe && isVideoMaximized) {
                    // Restore container styles
                    container.style.position = container.dataset.originalPosition || '';
                    container.style.top = container.dataset.originalTop || '';
                    container.style.left = container.dataset.originalLeft || '';
                    container.style.width = '';
                    container.style.height = '';
                    container.style.zIndex = container.dataset.originalZIndex || '';
                    
                    // Restore iframe styles
                    iframe.style.width = iframe.dataset.originalWidth || '';
                    iframe.style.height = iframe.dataset.originalHeight || '';
                    iframe.style.position = iframe.dataset.originalPosition || '';
                    iframe.style.top = iframe.dataset.originalTop || '';
                    iframe.style.left = iframe.dataset.originalLeft || '';
                    iframe.style.zIndex = iframe.dataset.originalZIndex || '';
                    
                    isVideoMaximized = false;
                }
            } else if (handedness === "Left") {
                playlistModal.classList.add('hidden');
            }
            break;
        case "Thumb_Up":
            if (handedness === "Right") {
                if (window.player.getPlayerState() !== YT.PlayerState.PLAYING) {
                    window.player.playVideo();
                }
            } else if (handedness === "Left") {
                currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
                loadVideo(currentVideoIndex);
            }
            break;
        case "Thumb_Down":
            if (handedness === "Right") {
                if (window.player.getPlayerState() === YT.PlayerState.PLAYING) {
                    window.player.pauseVideo();
                }
            } else if (handedness === "Left") {
                currentVideoIndex = (currentVideoIndex - 1 + playlist.length) % playlist.length;
                loadVideo(currentVideoIndex);
            }
            break;
        case "Victory":
            if (handedness === "Right") {
                createParticleEffect();
            } else if (handedness === "Left") {
                createHeartEffect();
            }
            break;
    }
}

// Create particle effect
function createParticleEffect() {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-50';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 rounded-full';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animation = `particle ${1 + Math.random() * 2}s ease-out forwards`;
        container.appendChild(particle);
    }

    setTimeout(() => container.remove(), 3000);
}

// Create heart effect
function createHeartEffect() {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 pointer-events-none z-50';
    document.body.appendChild(container);

    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.className = 'absolute text-4xl';
        heart.innerHTML = '❤️';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.top = `${Math.random() * 100}%`;
        heart.style.animation = `heart ${2 + Math.random() * 2}s ease-out forwards`;
        container.appendChild(heart);
    }

    setTimeout(() => container.remove(), 4000);
}

// Add effect animations to CSS
const effectStyle = document.createElement('style');
effectStyle.textContent = `
    @keyframes particle {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0);
            opacity: 0;
        }
    }
    @keyframes heart {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(${Math.random() * 100 - 50}px, -100px) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(effectStyle);

// Event Listeners
enableWebcamBtn.addEventListener('click', enableCam);
playlistBtn.addEventListener('click', () => playlistModal.classList.toggle('hidden'));
closePlaylistBtn.addEventListener('click', () => playlistModal.classList.add('hidden'));
addVideoBtn.addEventListener('click', () => addVideoModal.classList.remove('hidden'));
cancelAddBtn.addEventListener('click', () => addVideoModal.classList.add('hidden'));

confirmAddBtn.addEventListener('click', async () => {
    const url = videoUrl.value.trim();
    if (url) {
        const success = await addVideo(url);
        if (success) {
            addVideoModal.classList.add('hidden');
            videoUrl.value = '';
        } else {
            alert('Failed to add video. Please check the URL and try again.');
        }
    }
});

// Helper function to extract YouTube video ID
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Add video to playlist
async function addVideo(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        const response = await fetch(`https://noembed.com/embed?url=${url}`);
        const data = await response.json();
        
        if (!data.title) {
            throw new Error('Could not fetch video information');
        }

        playlist.push({
            id: videoId,
            title: data.title
        });
        
        localStorage.setItem('playlist', JSON.stringify(playlist));
        updatePlaylistUI();
        
        // If this is the first video, wait for player to be ready
        if (playlist.length === 1) {
            if (window.player && window.player.loadVideoById) {
                loadVideo(0);
            } else {
                console.log('Waiting for player to be ready...');
                // Wait for player to be ready
                const checkPlayer = setInterval(() => {
                    if (window.player && window.player.loadVideoById) {
                        loadVideo(0);
                        clearInterval(checkPlayer);
                    }
                }, 100);
            }
        }

        return true;
    } catch (error) {
        console.error('Error adding video:', error);
        return false;
    }
}

// Initialize
window.addEventListener('youtubePlayerReady', () => {
    console.log('Loading playlist after player is ready');
    loadPlaylist();
    
    // Add event listener for player state changes
    window.player.addEventListener('onStateChange', (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
            const currentVideo = playlist[currentVideoIndex];
            updateMarqueeText(currentVideo.title, true);
        } else {
            updateMarqueeText('', false);
        }
    });
});

createGestureRecognizer(); 