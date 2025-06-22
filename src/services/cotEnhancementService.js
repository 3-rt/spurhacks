import { GoogleGenerativeAI } from "@google/generative-ai";

class COTEnhancementService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.reasoningBuffer = [];
    this.bufferTimeout = null;
    this.isProcessing = false;
    this.suppressRawEvents = true;
    this.initialized = false;
    
    // Don't call initializeGemini in constructor since it's now async
  }

  async initialize() {
    if (!this.initialized) {
      await this.initializeGemini();
      this.initialized = true;
    }
  }

  async initializeGemini() {
    try {
      console.log("COT Enhancement: Checking for GOOGLE_API_KEY...");
      
      // Get API key from main process
      let apiKey = null;
      if (typeof window !== 'undefined' && window.electronAPI) {
        apiKey = await window.electronAPI.getGoogleApiKey();
      } else {
        // Fallback to environment variable (for main process)
        apiKey = process.env.GOOGLE_API_KEY;
      }
      
      console.log("GOOGLE_API_KEY exists:", !!apiKey);
      
      if (apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        console.log("COT Enhancement: Gemini initialized successfully");
      } else {
        console.warn("COT Enhancement: GOOGLE_API_KEY not found - COT enhancement disabled");
      }
    } catch (error) {
      console.error("COT Enhancement: Failed to initialize Gemini:", error);
    }
  }

  // Add a raw reasoning event to the buffer
  addReasoningEvent(event) {
    console.log("COT Enhancement: addReasoningEvent called with:", event);
    
    if (!this.model) {
      console.log("COT Enhancement: No model available, skipping enhancement");
      return null; // Return null if Gemini not available
    }

    // Only buffer real Stagehand instruction types - remove generic events to eliminate hallucinations
    const reasoningTypes = [
      // Real Stagehand instruction types only
      'stagehand_observe',
      'stagehand_action', 
      'stagehand_navigation',
      'stagehand_discovery'
    ];

    if (!reasoningTypes.includes(event.type)) {
      console.log("COT Enhancement: Event type not in reasoning types, skipping:", event.type);
      return null;
    }

    console.log("COT Enhancement: Adding event to buffer:", event.type);
    this.reasoningBuffer.push(event);
    console.log("COT Enhancement: Buffer now has", this.reasoningBuffer.length, "events");

    // Clear existing timeout
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
    }

    // Process immediately if we have 3+ events, or set timeout for smaller buffers
    if (this.reasoningBuffer.length >= 3) {
      console.log("COT Enhancement: Buffer has 3+ events, processing immediately...");
      setTimeout(() => this.processReasoningBuffer(), 100); // Small delay to allow for quick successive events
    } else {
      // Set new timeout to process buffer after 1 second of no new events (faster updates)
      this.bufferTimeout = setTimeout(() => {
        console.log("COT Enhancement: Timeout triggered, processing buffer...");
        this.processReasoningBuffer();
      }, 1000);
    }

    return null; // Don't display original event immediately
  }

  // Process the buffered reasoning events with Gemini
  async processReasoningBuffer() {
    console.log("COT Enhancement: processReasoningBuffer called");
    console.log("COT Enhancement: isProcessing:", this.isProcessing);
    console.log("COT Enhancement: buffer length:", this.reasoningBuffer.length);
    console.log("COT Enhancement: model available:", !!this.model);
    
    if (this.isProcessing || this.reasoningBuffer.length === 0 || !this.model) {
      console.log("COT Enhancement: Skipping processing - conditions not met");
      return;
    }

    this.isProcessing = true;
    const eventsToProcess = [...this.reasoningBuffer];
    this.reasoningBuffer = []; // Clear buffer

    console.log("COT Enhancement: Processing", eventsToProcess.length, "events");

    try {
      // Create a summary of the reasoning events
      const reasoningText = eventsToProcess
        .map(event => `[${event.type}] ${event.content}`)
        .join('\n');

      console.log("COT Enhancement: Reasoning text to send to Gemini:");
      console.log(reasoningText);

      // Create prompt for Gemini
      const prompt = `
You are explaining the actions of a Stagehand browser automation agent. Convert these real browser automation logs into clear, human-readable explanations of what the agent is actually doing.

Real Stagehand automation logs:
${reasoningText}

Create 2-4 clear, specific statements that explain exactly what the browser automation agent is doing:
1. What it's observing or looking for on the page
2. What specific actions it's taking (clicking, typing, navigating)
3. What it discovered or found
4. Where it's navigating to

Make each statement factual and specific to the actual browser actions. DO NOT add context or assumptions beyond what's in the logs. Focus on:
- Real observations ("Looking for the search box on the page")
- Actual actions ("Typing 'cows' into the search input field")
- Real discoveries ("Found the search button")
- Actual navigation ("Navigating to the search results page")

Format as JSON array:
[
  {
    "type": "enhanced_reasoning",
    "content": "Clear explanation of the actual browser action being performed",
    "confidence": "high|medium|low",
    "step_number": 1
  }
]

Stay factual and only describe what the agent is actually doing based on the logs.
`;

      console.log("COT Enhancement: Sending request to Gemini...");
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("COT Enhancement: Received response from Gemini:");
      console.log(text);

      // Try to parse the JSON response
      let enhancedEvents;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          enhancedEvents = JSON.parse(jsonMatch[0]);
          console.log("COT Enhancement: Successfully parsed JSON response");
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("COT Enhancement: Failed to parse Gemini response:", parseError);
        // Fallback: create a single enhanced event
        enhancedEvents = [{
          type: "enhanced_reasoning",
          content: text.trim() || "AI is processing the request...",
          confidence: "medium",
          step_number: 1
        }];
        console.log("COT Enhancement: Using fallback event");
      }

      // Return enhanced events with proper timestamps
      const enhancedEventsWithTimestamp = enhancedEvents.map((event, index) => ({
        ...event,
        timestamp: new Date().toISOString(),
        original_events_count: eventsToProcess.length,
        enhanced: true
      }));

      console.log("COT Enhancement: Emitting", enhancedEventsWithTimestamp.length, "enhanced events");
      
      // Emit enhanced events
      this.emitEnhancedEvents(enhancedEventsWithTimestamp);

    } catch (error) {
      console.error("COT Enhancement: Error enhancing COT with Gemini:", error);
      
      // Fallback: create a simple summary event
      const fallbackEvent = {
        type: "enhanced_reasoning",
        content: `AI is processing ${eventsToProcess.length} reasoning steps...`,
        confidence: "low",
        step_number: 1,
        timestamp: new Date().toISOString(),
        original_events_count: eventsToProcess.length,
        enhanced: true,
        fallback: true
      };

      console.log("COT Enhancement: Using error fallback event");
      this.emitEnhancedEvents([fallbackEvent]);
    } finally {
      this.isProcessing = false;
      console.log("COT Enhancement: Processing complete");
    }
  }

  // Emit enhanced events (this will be called by the main process)
  emitEnhancedEvents(events) {
    // This method will be overridden by the main process to send events to frontend
    console.log("COT Enhancement: emitEnhancedEvents called with", events.length, "events");
    console.log("COT Enhancement: Enhanced events:", events);
  }

  // Set the emit function from the main process
  setEmitFunction(emitFn) {
    this.emitEnhancedEvents = emitFn;
  }

  // Control whether raw events should be suppressed
  setSuppressRawEvents(suppress) {
    this.suppressRawEvents = suppress;
  }

  // Check if raw events should be suppressed
  shouldSuppressRawEvents() {
    return this.suppressRawEvents && this.model; // Only suppress if enhancement is available
  }

  // Clear the buffer (useful when starting a new task)
  clearBuffer() {
    this.reasoningBuffer = [];
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
    }
  }
}

export default new COTEnhancementService(); 