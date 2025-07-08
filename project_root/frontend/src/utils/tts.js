// tts.js
// Utility for text-to-speech using browser SpeechSynthesis API

export function speak(
  text,
  {
    rate = 1,
    pitch = 1,
    volume = 1,
    lang = 'en-US',
    interrupt = true,
    onStart = null,
    onEnd = null
  } = {}
) {
  if (!window.speechSynthesis || !text) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.pitch = pitch;
  utter.volume = volume;
  utter.lang = lang;

  if (onStart) utter.onstart = onStart;
  if (onEnd) utter.onend = onEnd;

  if (interrupt) window.speechSynthesis.cancel(); // Stop ongoing speech
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}
