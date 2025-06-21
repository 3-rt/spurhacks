// Service to communicate with Stagehand browser automation agent
class StagehandService {
  constructor() {
    this.isInitialized = false;
    this.currentTask = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if we're in Electron environment
      if (window.electronAPI) {
        // Initialize Stagehand through Electron
        await window.electronAPI.initializeStagehand();
        this.isInitialized = true;
        console.log('Stagehand service initialized through Electron');
      } else {
        // Fallback for web environment
        console.log('Stagehand service initialized (web mode)');
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Stagehand service:', error);
      throw error;
    }
  }

  async executeTask(userQuery) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.currentTask = {
        query: userQuery,
        status: 'running',
        startTime: new Date(),
        activities: []
      };

      // If in Electron, use IPC to communicate with Stagehand
      if (window.electronAPI) {
        const result = await window.electronAPI.executeStagehandTask(userQuery);
        return this.processResult(result);
      } else {
        // Simulate execution for web environment
        return await this.simulateExecution(userQuery);
      }
    } catch (error) {
      console.error('Task execution failed:', error);
      this.currentTask.status = 'error';
      this.currentTask.error = error.message;
      throw error;
    }
  }

  async simulateExecution(userQuery) {
    // Simulate the execution steps for web environment
    const steps = [
      {
        type: 'Initializing Browser',
        details: 'Starting browser automation session',
        status: 'running',
        timestamp: new Date()
      },
      {
        type: 'Analyzing Task',
        details: `Processing query: "${userQuery}"`,
        status: 'thinking',
        timestamp: new Date()
      },
      {
        type: 'Navigating to Target',
        details: 'Opening browser and navigating to required websites',
        status: 'running',
        timestamp: new Date()
      },
      {
        type: 'Extracting Data',
        details: 'Gathering information from web pages',
        status: 'running',
        timestamp: new Date()
      },
      {
        type: 'Processing Results',
        details: 'Analyzing and formatting extracted data',
        status: 'running',
        timestamp: new Date()
      },
      {
        type: 'Task Complete',
        details: 'Successfully completed browser automation task',
        status: 'success',
        timestamp: new Date()
      }
    ];

    // Simulate each step with delays
    for (const step of steps) {
      this.currentTask.activities.push(step);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    this.currentTask.status = 'completed';
    this.currentTask.endTime = new Date();

    return {
      success: true,
      activities: this.currentTask.activities,
      result: `Successfully completed: ${userQuery}`,
      duration: this.currentTask.endTime - this.currentTask.startTime
    };
  }

  processResult(result) {
    if (result.success) {
      this.currentTask.status = 'completed';
      this.currentTask.endTime = new Date();
      this.currentTask.result = result.agentResult;
      
      return {
        success: true,
        activities: this.currentTask.activities,
        result: result.agentResult,
        duration: this.currentTask.endTime - this.currentTask.startTime
      };
    } else {
      this.currentTask.status = 'error';
      this.currentTask.error = result.error;
      throw new Error(result.error);
    }
  }

  stopCurrentTask() {
    if (this.currentTask && this.currentTask.status === 'running') {
      this.currentTask.status = 'stopped';
      this.currentTask.endTime = new Date();
      
      // If in Electron, send stop signal
      if (window.electronAPI) {
        window.electronAPI.stopStagehandTask();
      }
    }
  }

  getCurrentTask() {
    return this.currentTask;
  }

  reset() {
    this.currentTask = null;
  }
}

// Create singleton instance
const stagehandService = new StagehandService();

export default stagehandService; 