import React, { useState, useEffect, useRef, useCallback } from 'react';

const AgentBar = ({ 
  onExpand, 
  onCollapse, 
  onMinimize, 
  onMaximize, 
  onClose,
  onWindowPositionChange,
  isExpanded = false,
  isDragging = false,
  onDragStart,
  onDragEnd
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTimer, setRecordingTimer] = useState(null);
  
  const titleBarRef = useRef(null);
  const recordingTimerRef = useRef(null);

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

  const handleCollapse = useCallback(() => {
    onCollapse?.();
  }, [onCollapse]);

  const handleMinimize = useCallback(() => {
    onMinimize?.();
  }, [onMinimize]);

  const handleMaximize = useCallback(() => {
    onMaximize?.();
  }, [onMaximize]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleRecordingToggle = useCallback(async () => {
    if (!isRecording) {
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
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingTime('00:00');
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setRecordingStartTime(0);
      setRecordingTime('00:00');
    }
  }, [isRecording, mediaRecorder]);

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col opacity-100 pointer-events-auto transition-opacity duration-300 rounded-xl overflow-hidden">
      {/* Custom Title Bar */}
      <div 
        ref={titleBarRef}
        className="bg-slate-900/90 h-10 flex items-center webkit-app-region-drag border-b border-slate-800/50"
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
      >
        <div className="w-full flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-200">AI Agent</span>
          </div>
          <div className="flex webkit-app-region-no-drag gap-1">
            <button 
              onClick={handleCollapse}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 6L10 6" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
            <button 
              onClick={handleMinimize}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
              </svg>
            </button>
            <button 
              onClick={handleMaximize}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-slate-800/80 hover:text-slate-200 rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
            <button 
              onClick={handleClose}
              className="w-6 h-6 border-none bg-transparent text-slate-400 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-red-600/80 hover:text-white rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex gap-3 max-w-full">
            <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex-1 leading-relaxed text-slate-200 text-sm">
              <p>Hello! I'm your AI assistant. How can I help you today?</p>
            </div>
          </div>

          {/* Example Chain of Thought Section */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-hidden">
            <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span className="text-xs font-medium text-slate-200">Thinking...</span>
              <div className="flex gap-1 ml-auto">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 bg-slate-700 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-slate-300">1</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-200 font-medium">Analyzing request:</span> User wants to create an Electron app with a draggable interface. Need to understand the requirements for window management and UI interactions.
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 bg-slate-700 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-slate-300">2</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-200 font-medium">Planning approach:</span> Will need to use Electron's BrowserWindow API with frameless and transparent options. Should implement IPC communication for window resizing and positioning.
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 bg-slate-700 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-slate-300">3</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-200 font-medium">Implementation strategy:</span> Start with a small draggable box, add click-to-expand functionality, and create smooth transitions between states. Will use Tailwind CSS for styling.
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 max-w-full">
            <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex-1 leading-relaxed text-slate-200 text-sm">
              <p>I can definitely help you create an Electron application with a draggable interface! Based on your requirements, I'll guide you through setting up a frameless window with transparent background and implementing the drag-and-expand functionality.</p>
            </div>
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="bg-slate-900/90 border-t border-slate-800/50 p-4">
          <div className="flex items-center gap-3 bg-slate-950/80 rounded-lg p-3 border border-slate-800/50 shadow-lg">
            <button className="bg-slate-800/50 border border-slate-700/50 text-slate-300 flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              Add
            </button>
            <button 
              onClick={handleRecordingToggle}
              className={`border border-slate-700/50 text-slate-300 flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1.5 rounded-md transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-200 hover:border-slate-600/50 ${
                isRecording ? 'bg-red-600/50' : 'bg-slate-800/50'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>{isRecording ? 'Stop' : 'Record'}</span>
            </button>
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder-slate-500"
            />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-700/50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                <span className="text-slate-300">On</span>
              </div>
            </div>
          </div>
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording... {recordingTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentBar; 