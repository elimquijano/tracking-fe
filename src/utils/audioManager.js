let audioElement;

export const playSound = (src) => {
  if (!audioElement) {
    audioElement = new Audio(src);
  } else {
    audioElement.src = src;
  }
  audioElement.play().catch((error) => {
    console.error('Error al reproducir el sonido:', error);
  });
};

export const stopSound = () => {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
};
