import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Brain, Play, Square, RotateCcw, Zap, Target, CheckCircle, AlertTriangle, Send, Mic, MicOff } from "lucide-react";
import stagehandService from '../services/stagehandService';

const AgentCOTStream = () => {
  const [cotEvents, setCotEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const scrollAreaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Initialize the Stagehand service when component mounts
    stagehandService.initialize().catch(console.error);
  }, []);

  useEffect(() => {
    // Listen for COT events from the main process
    if (window.electronAPI) {
      const handleStream = (data) => {
        if (data.type === "stagehand-output") {
          // Create a consistent event format from Stagehand output
          const event = {
            type: data.data.type,
            content: data.data.content,
            level: data.data.level,
            timestamp: data.data.timestamp
          };
          setCotEvents(prev => [event, ...prev]); // Prepend new events to top
          setIsStreaming(true);
          scrollToTop(); // Scroll to top instead of bottom
        } else if (data.type === "output") {
          // Handle raw terminal output from Stagehand
          const event = {
            type: "raw_output",
            content: data.data,
            level: "info",
            timestamp: new Date().toISOString()
          };
          setCotEvents(prev => [event, ...prev]); // Prepend new events to top
          setIsStreaming(true);
          scrollToTop(); // Scroll to top instead of bottom
        } else if (data.type === "error") {
          // Handle error output from Stagehand
          const event = {
            type: "error",
            content: data.data,
            level: "error",
            timestamp: new Date().toISOString()
          };
          setCotEvents(prev => [event, ...prev]); // Prepend new events to top
          scrollToTop(); // Scroll to top instead of bottom
        } else if (data.type === "complete") {
          setIsStreaming(false);
          setIsExecuting(false);
        }
      };

      window.electronAPI.onStagehandStream(handleStream);
      
      return () => {
        window.electronAPI.removeAllListeners('stagehand-stream');
      };
    }
  }, []);

  const scrollToTop = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const startRecording = async () => {
    try {
      setRecordingStatus('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          setIsTranscribing(true);
          setRecordingStatus('Processing audio...');
          
          // Convert audio chunks to WAV format
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          // Generate filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `recording_${timestamp}.wav`;
          
          // Save audio file
          const saveResult = await window.electronAPI.saveAudioFile({
            buffer: Array.from(new Uint8Array(arrayBuffer)),
            filename: filename
          });
          
          if (saveResult.success) {
            setRecordingStatus('Transcribing audio...');
            
            // Transcribe audio using Groq
            const transcriptionResult = await window.electronAPI.transcribeAudio(saveResult.path);
            
            if (transcriptionResult.success) {
              setUserQuery(transcriptionResult.text);
              setRecordingStatus('Transcription complete!');
              
              // Add transcription event to COT stream
              const transcriptionEvent = {
                type: "voice_input",
                content: `Voice input transcribed: "${transcriptionResult.text}"`,
                step: 0,
                timestamp: new Date().toISOString()
              };
              setCotEvents(prev => [transcriptionEvent, ...prev]);
              scrollToTop();
            } else {
              setRecordingStatus(`Transcription failed: ${transcriptionResult.error}`);
            }
          } else {
            setRecordingStatus(`Failed to save audio: ${saveResult.error}`);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          setRecordingStatus(`Error: ${error.message}`);
        } finally {
          setIsTranscribing(false);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus('Recording... Speak now!');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus(`Error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingStatus('Processing...');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleExecuteTask = async () => {
    if (!userQuery.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setCotEvents([]); // Clear previous events
    setCurrentStep(0);
    
    try {
      // Execute the task using the Stagehand service
      const result = await stagehandService.executeTask(userQuery);
      
      // Add completion event if not already added by streaming
      if (result.success) {
        const completionEvent = {
          type: "task_complete",
          content: `Task completed successfully: ${result.result}`,
          step: 6,
          timestamp: new Date().toISOString()
        };
        setCotEvents(prev => [completionEvent, ...prev]);
      }
      
    } catch (error) {
      console.error('Task execution error:', error);
      const errorEvent = {
        type: "execution_error",
        content: `Error: ${error.message}`,
        step: -1,
        timestamp: new Date().toISOString()
      };
      setCotEvents(prev => [errorEvent, ...prev]);
    } finally {
      setIsExecuting(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isExecuting && userQuery.trim()) {
      handleExecuteTask();
    }
  };

  const stopExecution = () => {
    stagehandService.stopCurrentTask();
    setIsExecuting(false);
    setIsStreaming(false);
    const stopEvent = {
      type: "execution_stopped",
      content: "Task execution was manually stopped",
      step: -1,
      timestamp: new Date().toISOString()
    };
    setCotEvents(prev => [stopEvent, ...prev]);
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'task_start':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'agent_created':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'execution_start':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'execution_complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'screenshot':
      case 'screenshot_saved':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'task_complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
      case 'agent_error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'agent_action':
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case 'agent_llm':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'agent_debug':
        return <Target className="w-4 h-4 text-gray-400" />;
      case 'agent_info':
      case 'agent_general':
        return <Brain className="w-4 h-4 text-blue-400" />;
      case 'agent_warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'agent_result':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'raw_output':
        return <Brain className="w-4 h-4 text-gray-300" />;
      case 'thinking_start':
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case 'analyzing_request':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'planning_approach':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'executing_steps':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'execution_success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'execution_error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'execution_stopped':
        return <Square className="w-4 h-4 text-gray-500" />;
      case 'voice_input':
        return <Mic className="w-4 h-4 text-blue-400" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'task_start':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'agent_created':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'execution_start':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'execution_complete':
        return 'border-green-500/30 bg-green-500/10';
      case 'screenshot':
      case 'screenshot_saved':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'task_complete':
        return 'border-green-600/30 bg-green-600/10';
      case 'error':
      case 'agent_error':
        return 'border-red-500/30 bg-red-500/10';
      case 'agent_action':
        return 'border-indigo-500/30 bg-indigo-500/10';
      case 'agent_llm':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'agent_debug':
        return 'border-gray-400/30 bg-gray-400/10';
      case 'agent_info':
      case 'agent_general':
        return 'border-blue-400/30 bg-blue-400/10';
      case 'agent_warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'agent_result':
        return 'border-green-500/30 bg-green-500/10';
      case 'raw_output':
        return 'border-gray-300/30 bg-gray-300/10';
      case 'thinking_start':
        return 'border-indigo-500/30 bg-indigo-500/10';
      case 'analyzing_request':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'planning_approach':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'executing_steps':
        return 'border-green-500/30 bg-green-500/10';
      case 'execution_success':
        return 'border-green-600/30 bg-green-600/10';
      case 'execution_error':
        return 'border-red-500/30 bg-red-500/10';
      case 'execution_stopped':
        return 'border-gray-500/30 bg-gray-500/10';
      case 'voice_input':
        return 'border-blue-400/30 bg-blue-400/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const clearEvents = () => {
    setCotEvents([]);
    setCurrentStep(0);
  };

  const testCOTEvents = () => {
    const testEvents = [
      {
        type: "thinking_start",
        content: "Starting to think about: 'Test query'",
        step: 1,
        timestamp: new Date().toISOString()
      },
      {
        type: "analyzing_request", 
        content: "Breaking down the request into manageable steps",
        step: 2,
        timestamp: new Date().toISOString()
      },
      {
        type: "planning_approach",
        content: "Planning the best approach to complete this task",
        step: 3,
        timestamp: new Date().toISOString()
      },
      {
        type: "executing_steps",
        content: "Beginning step-by-step execution",
        step: 4,
        timestamp: new Date().toISOString()
      },
      {
        type: "execution_success",
        content: "Successfully completed all steps",
        step: 5,
        timestamp: new Date().toISOString()
      }
    ];

    setIsStreaming(true);
    testEvents.forEach((event, index) => {
      setTimeout(() => {
        setCotEvents(prev => [...prev, event]);
        setCurrentStep(event.step);
        scrollToBottom();
      }, index * 1000);
    });

    setTimeout(() => {
      setIsStreaming(false);
    }, testEvents.length * 1000 + 1000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono text-gray-300">Agent Chain of Thought</CardTitle>
            <div className="flex gap-2">
              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full thinking-indicator"></div>
                  <span>Live</span>
                </div>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={testCOTEvents}
                className="h-7 px-2 hover:bg-gray-800 text-gray-400"
                disabled={isStreaming || isExecuting}
              >
                <Zap className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearEvents}
                className="h-7 px-2 hover:bg-gray-800 text-gray-400"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <Brain className="w-4 h-4 text-green-500" />
            <span>Real-time reasoning stream</span>
            {currentStep > 0 && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                Step {currentStep}
              </span>
            )}
            {isExecuting && userQuery && (
              <span className="text-xs bg-green-700 px-2 py-1 rounded text-green-200">
                Active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Enter task for browser automation..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className={`h-8 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-500 font-mono pr-16 ${
                  isExecuting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isExecuting}
                onKeyPress={handleKeyPress}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isExecuting && (
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleRecording}
                  disabled={isExecuting || isTranscribing}
                  className={`h-6 w-6 p-0 rounded-full transition-all duration-300 ${
                    isRecording 
                      ? 'mic-recording recording-pulse recording-glow' 
                      : 'hover:bg-gray-700 text-gray-400'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            {(isRecording || isTranscribing || recordingStatus) && (
              <div className="text-xs text-gray-400 font-mono text-center">
                {isRecording && <span className="text-red-400">● Recording</span>}
                {isTranscribing && <span className="text-blue-400">Processing audio...</span>}
                {recordingStatus && !isRecording && !isTranscribing && (
                  <span className={recordingStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}>
                    {recordingStatus}
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={handleExecuteTask}
                disabled={isExecuting || !userQuery.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 border border-green-500 text-white font-mono text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                {isExecuting ? 'Executing...' : 'Execute'}
              </Button>
              {isExecuting && (
                <Button 
                  onClick={stopExecution}
                  className="bg-red-600 hover:bg-red-700 border border-red-500 text-white font-mono text-xs"
                >
                  <Square className="w-3 h-3" />
                </Button>
              )}
            </div>
            {isExecuting && (
              <div className="text-xs text-gray-400 font-mono text-center">
                Executing: "{userQuery}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* COT Events Stream */}
      <Card className={`flex-1 border-0 bg-transparent min-h-0 ${isStreaming ? 'cot-streaming' : ''}`}>
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="px-6 space-y-3">
              {cotEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-sm font-mono">Waiting for agent thoughts...</p>
                  <p className="text-xs text-gray-600 mt-2">Enter a task above to see real-time reasoning</p>
                </div>
              ) : (
                cotEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 transition-all duration-300 cot-event ${getStepColor(event.type)}`}
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStepIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">
                            {formatTimestamp(event.timestamp)}
                          </span>
                          {event.step && event.step > 0 && (
                            <span className="text-xs text-gray-400 font-mono border border-gray-600 px-2 py-0.5 rounded">
                              Step {event.step}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 font-mono capitalize">
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-300 font-mono">
                          {event.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentCOTStream; 