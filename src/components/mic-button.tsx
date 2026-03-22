"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { MIC_BASE, MIC_LISTENING, MIC_IDLE, TEXT_META } from "@/lib/design-tokens";

export interface MicButtonHandle {
  stop: () => void;
}

interface MicButtonProps {
  onTranscript: (text: string) => void;
  onInterim: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
}

const MicButton = forwardRef<MicButtonHandle, MicButtonProps>(function MicButton({ onTranscript, onInterim, onListeningChange }, ref) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onInterimRef.current = onInterim;
  }, [onTranscript, onInterim]);

  useImperativeHandle(ref, () => ({
    stop() {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setListening(false);
        onListeningChange(false);
        onInterimRef.current("");
      }
    },
  }));

  function toggle() {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      onListeningChange(false);
      onInterimRef.current("");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          onTranscriptRef.current(transcript);
          onInterimRef.current("");
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        onInterimRef.current(interim);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      onListeningChange(false);
      onInterimRef.current("");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      onListeningChange(false);
      onInterimRef.current("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    onListeningChange(true);
  }

  if (!supported) {
    return (
      <span className={TEXT_META}>
        mic unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${MIC_BASE} ${listening ? MIC_LISTENING : MIC_IDLE}`}
      title={listening ? "Stop dictation" : "Start dictation"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
});

export default MicButton;
