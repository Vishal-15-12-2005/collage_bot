let speechRecognition;
let listening = false;
let shouldAlwaysListen = true;

export function initSpeechRecognition(onTranscript) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported");
    return null;
  }

  if (!speechRecognition) {
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results.map(r => r[0].transcript).join('').trim();
      const isFinal = results[results.length - 1].isFinal;

      if (!transcript) return;

      // 🧠 Interrupt speech if speaking
      if (!isFinal && window.speechSynthesis.speaking) {
        console.log('🔇 Interrupting speech...');
        window.speechSynthesis.cancel();
        if (onTranscript) onTranscript(transcript, true); // handle as final
        return;
      }

      if (onTranscript) onTranscript(transcript, isFinal);
    };

    speechRecognition.onerror = (e) => {
      console.error('SpeechRecognition Error:', e);
      listening = false;
      if (shouldAlwaysListen) {
        console.log('🔁 Restarting mic after error...');
        setTimeout(() => startListening(onTranscript), 1000);
      }
    };

    speechRecognition.onend = () => {
      listening = false;
      if (shouldAlwaysListen) {
        console.warn('🎤 Mic ended. Restarting...');
        setTimeout(() => startListening(onTranscript), 100);
      }
    };
  }

  return speechRecognition;
}

export function startListening(onTranscript) {
  shouldAlwaysListen = true;

  const recognition = initSpeechRecognition(onTranscript);
  if (!recognition || listening) return;

  try {
    recognition.start();
    listening = true;
    console.log('🎙️ Mic started');
  } catch (err) {
    console.warn('Mic already running or start failed:', err);
  }
}

export function stopListening() {
  shouldAlwaysListen = false;
  if (speechRecognition && listening) {
    speechRecognition.stop();
    listening = false;
    console.log('🛑 Mic stopped manually');
  }
}

export function speakWithAudioFeedback(text, setVolume, onEnd, onTranscript) {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel(); // cancel any previous speech

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';

  let volInterval;

  utter.onstart = () => {
    volInterval = setInterval(() => {
      const fakeVol = Math.random();
      setVolume(fakeVol);
    }, 100);
  };

  utter.onend = () => {
    clearInterval(volInterval);
    setVolume(0);
    if (onEnd) onEnd();

    // 🔁 Restart mic after speech ends
    if (shouldAlwaysListen && onTranscript) {
      startListening(onTranscript);
    }
  };

  utter.onerror = (err) => {
    console.error('🔴 SpeechSynthesis error:', err);
    clearInterval(volInterval);
    setVolume(0);
    if (onEnd) onEnd();

    if (shouldAlwaysListen && onTranscript) {
      startListening(onTranscript);
    }
  };

  synth.speak(utter);
}

export function stopSpeaking() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    console.log('🔇 Speech stopped');
  }
}
