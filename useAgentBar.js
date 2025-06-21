import { useState, useCallback, useEffect, useRef } from 'react';

export const useAgentBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  const recordingTimerRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Recording timer effect
  useEffect(() => {
    if (isRecording && recordingStartTime > 0) {
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, recordingStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Window management functions
  const expandWindow = useCallback(() => {
    setIsExpanded(true);
    // Call your window expansion logic here
    if (window.electronAPI?.expandWindow) {
      window.electronAPI.expandWindow();
    }
  }, []);

  const collapseWindow = useCallback(() => {
    setIsExpanded(false);
    // Call your window collapse logic here
    if (window.electronAPI?.collapseWindow) {
      window.electronAPI.collapseWindow();
    }
  }, []);

  const minimizeWindow = useCallback(() => {
    if (window.electronAPI?.windowMinimize) {
      window.electronAPI.windowMinimize();
    }
  }, []);

  const maximizeWindow = useCallback(() => {
    if (window.electronAPI?.windowMaximize) {
      window.electronAPI.windowMaximize();
    }
  }, []);

  const closeWindow = useCallback(() => {
    if (window.electronAPI?.windowClose) {
      window.electronAPI.windowClose();
    }
  }, []);

  // Dragging functionality
  const startDragging = useCallback((e) => {
    if (isExpanded) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;
      
      // Get current window position and update it
      if (window.electronAPI?.setWindowPosition) {
        window.electronAPI.setWindowPosition(deltaX, deltaY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isExpanded, isDragging]);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Recording functionality
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // Handle the recorded audio blob here
        console.log('Recording stopped, audio blob:', audioBlob);
        setAudioChunks(chunks);
        
        // You can add transcription logic here
        if (window.electronAPI?.transcribeAudio) {
          // Convert blob to file and send for transcription
          const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
          // Handle transcription...
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingTime('00:00');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingStartTime(0);
    setRecordingTime('00:00');
  }, [mediaRecorder]);

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Keyboard event listener for expansion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'a' && !isExpanded) {
        expandWindow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, expandWindow]);

  return {
    // State
    isExpanded,
    isDragging,
    isRecording,
    recordingTime,
    
    // Window management
    expandWindow,
    collapseWindow,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    
    // Dragging
    startDragging,
    stopDragging,
    
    // Recording
    toggleRecording,
    startRecording,
    stopRecording,
    
    // Audio data
    audioChunks
  };
}; 