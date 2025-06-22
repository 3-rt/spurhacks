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
  const [cotEnhancementEnabled, setCotEnhancementEnabled] = useState(true);
  const [showOnlyEnhanced, setShowOnlyEnhanced] = useState(true);
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
          // Skip raw stagehand output if we only want enhanced events
          if (showOnlyEnhanced) {
            return; // Don't show raw stagehand events when only enhanced mode is on
          }
          
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
        } else if (data.type === "enhanced-cot") {
          // Always handle enhanced COT events from Gemini
          const enhancedEvent = {
            type: data.data.type,
            content: data.data.content,
            confidence: data.data.confidence,
            step_number: data.data.step_number,
            timestamp: data.data.timestamp,
            enhanced: true,
            original_events_count: data.data.original_events_count
          };
          setCotEvents(prev => [enhancedEvent, ...prev]); // Prepend enhanced events to top
          setIsStreaming(true);
          scrollToTop();
        } else if (data.type === "output") {
          // Skip raw terminal output if we only want enhanced events
          if (showOnlyEnhanced) {
            return; // Don't show raw output when only enhanced mode is on
          }
          
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
          // Always show errors regardless of mode
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
      
      // Completion events are now handled by the COT enhancement service
      // No need to add a manual completion event since we get proper enhanced COT events
      
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
      case 'enhanced_reasoning':
        return <Brain className="w-4 h-4 text-cyan-400" />; // Special color for enhanced reasoning
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
        return <Mic className="w-4 h-4 text-green-500" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStepColor = (type, content) => {
    if (type === 'raw_output' && content.includes('category: "action"')) {
      return 'border-green-500/80 bg-green-500/20';
    }
    switch (type) {
      case 'enhanced_reasoning':
        return 'border-cyan-400/50 bg-cyan-400/15 shadow-cyan-400/20 shadow-lg'; // Special enhanced styling
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
        return 'border-green-400/30 bg-green-400/10';
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
        setCotEvents(prev => [event, ...prev]);
        setCurrentStep(event.step);
        scrollToTop();
      }, index * 1000);
    });

    setTimeout(() => {
      setIsStreaming(false);
    }, testEvents.length * 1000 + 1000);
  };

  const testEnhancedCOT = () => {
    const enhancedEvents = [
      {
        type: "enhanced_reasoning",
        content: "I'm analyzing your request to understand what you're looking for. Let me break this down into clear steps to help you effectively.",
        confidence: "high",
        step_number: 1,
        timestamp: new Date().toISOString(),
        enhanced: true,
        original_events_count: 3
      },
      {
        type: "enhanced_reasoning", 
        content: "I've identified the key components of your task and I'm now planning the most efficient approach to complete it successfully.",
        confidence: "high",
        step_number: 2,
        timestamp: new Date().toISOString(),
        enhanced: true,
        original_events_count: 4
      },
      {
        type: "enhanced_reasoning",
        content: "I'm now executing the plan step by step, making sure to handle any edge cases and provide you with the best possible result.",
        confidence: "medium",
        step_number: 3,
        timestamp: new Date().toISOString(),
        enhanced: true,
        original_events_count: 2
      }
    ];

    setIsStreaming(true);
    enhancedEvents.forEach((event, index) => {
      setTimeout(() => {
        setCotEvents(prev => [event, ...prev]);
        scrollToTop();
      }, index * 1500);
    });

    setTimeout(() => {
      setIsStreaming(false);
    }, enhancedEvents.length * 1500 + 1000);
  };

  return (
    <div className="flex h-full flex-col bg-[#121212] overflow-hidden">
      {/* Header */}
      <Card className="border-0 bg-transparent flex-shrink-0">
        <CardHeader className="pb-4 pl-6 pr-6">
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
                title="Test regular COT events"
              >
                <Zap className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={testEnhancedCOT}
                className="h-7 px-2 hover:bg-gray-800 text-cyan-400"
                disabled={isStreaming || isExecuting}
                title="Test enhanced COT with Gemini"
              >
                <Brain className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowOnlyEnhanced(!showOnlyEnhanced)}
                className={`h-7 px-2 hover:bg-gray-800 ${showOnlyEnhanced ? 'text-cyan-400' : 'text-gray-400'}`}
                title={showOnlyEnhanced ? "Show all events" : "Show only enhanced events"}
              >
                {showOnlyEnhanced ? <Brain className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
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
            <span>{showOnlyEnhanced ? "Enhanced reasoning only" : "Real-time reasoning stream"}</span>
            {showOnlyEnhanced && (
              <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30">
                Gemini Enhanced
              </span>
            )}
            {isExecuting && userQuery && (
              <span className="text-xs bg-green-700 px-2 py-1 rounded text-green-200">
                Active
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <div className="pl-4 pr-6 pt-4 pb-4 border-b border-gray-800 space-y-3 flex-shrink-0">
        <div className="relative">
          <Input
            placeholder="find me a yt vid on cows"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className={`h-12 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-500 font-mono pr-20 ${
              isExecuting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            // disabled={isExecuting}
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
              className={`h-8 w-8 p-0 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'mic-recording recording-pulse recording-glow' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleExecuteTask}
              disabled={isExecuting || !userQuery.trim()}
              className="h-8 w-10 p-0 rounded-md bg-white hover:bg-gray-200 text-gray-900"
            >
              <Square className="w-4 h-4 text-black" />
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

        {isExecuting && (
          <div className="flex items-center justify-center text-xs text-gray-400 font-mono mt-2">
            <Zap className="w-3 h-3 mr-1 text-yellow-500" />
            <span>Executing: "{userQuery}"</span>
          </div>
        )}
      </div>

      {/* COT Events Stream - Scrollable Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Card className="h-full border-0 bg-transparent">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
              <div className="pl-6 pr-6 py-4 space-y-3">
                {cotEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-sm font-mono">
                      {showOnlyEnhanced 
                        ? "Waiting for enhanced reasoning..." 
                        : "Waiting for agent thoughts..."
                      }
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {showOnlyEnhanced 
                        ? "Enter a task below to see Gemini-enhanced insights"
                        : "Enter a task below to see real-time reasoning"
                      }
                    </p>
                  </div>
                ) : (
                  cotEvents.map((event, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-3 transition-all duration-300 cot-event ${getStepColor(event.type, event.content)}`}
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
                             <span className="text-xs text-gray-400 font-mono capitalize">
                              {event.type.replace(/_/g, ' ')}
                            </span>
                            {event.enhanced && (
                              <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                Enhanced by Gemini
                              </span>
                            )}
                            {event.confidence && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                                event.confidence === 'high' ? 'bg-green-600/20 text-green-300 border border-green-500/30' :
                                event.confidence === 'medium' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30' :
                                'bg-red-600/20 text-red-300 border border-red-500/30'
                              }`}>
                                {event.confidence}
                              </span>
                            )}
                          </div>
                          <pre className="text-sm leading-relaxed text-gray-300 font-mono whitespace-pre-wrap break-words">
                            {event.content}
                          </pre>
                          {event.enhanced && event.original_events_count && (
                            <div className="text-xs text-gray-500 font-mono mt-2 italic">
                              Synthesized from {event.original_events_count} raw reasoning steps
                            </div>
                          )}
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
    </div>
  );
};

export default AgentCOTStream; 