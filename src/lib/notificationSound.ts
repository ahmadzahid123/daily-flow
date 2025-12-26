// Notification sound utility with looping support

let audioContext: AudioContext | null = null;
let isPlaying = false;
let currentOscillators: OscillatorNode[] = [];
let loopInterval: NodeJS.Timeout | null = null;

const playOneTone = () => {
  if (!audioContext || !isPlaying) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  currentOscillators.push(oscillator);

  // Second tone
  setTimeout(() => {
    if (!audioContext || !isPlaying) return;

    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(800, audioContext.currentTime + 0.15);

    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.4);
    currentOscillators.push(oscillator2);
  }, 300);
};

export const startNotificationSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    isPlaying = true;
    playOneTone();
    
    // Loop every 2 seconds
    loopInterval = setInterval(() => {
      if (isPlaying) {
        playOneTone();
      }
    }, 2000);

    return true;
  } catch (error) {
    console.error("Error playing notification sound:", error);
    return false;
  }
};

export const stopNotificationSound = () => {
  isPlaying = false;
  
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
  
  currentOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Already stopped
    }
  });
  currentOscillators = [];
};

// Legacy function for compatibility
export const playNotificationSound = () => {
  startNotificationSound();
  return true;
};

export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};
