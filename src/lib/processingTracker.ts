// Custom EventEmitter for React Native compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface ProcessingProgress {
  progress: number;
  status: string;
  currentStep: string;
  fileName?: string;
  fileCount?: number;
  currentFileIndex?: number;
  estimatedTimeRemaining?: number;
  details?: string;
}

export interface ProcessingStep {
  name: string;
  weight: number; // How much of the total progress this step represents
  estimatedDuration: number; // In milliseconds
}

export class ProcessingProgressTracker extends EventEmitter {
  private currentProgress: ProcessingProgress;
  private steps: ProcessingStep[];
  private currentStepIndex: number = 0;
  private stepStartTime: number = 0;
  private totalStartTime: number = 0;

  constructor() {
    super();
    this.currentProgress = {
      progress: 0,
      status: 'Initializing...',
      currentStep: 'Starting',
    };
    
    this.steps = [
      { name: 'Reading File', weight: 20, estimatedDuration: 1000 },
      { name: 'Extracting Content', weight: 30, estimatedDuration: 2000 },
      { name: 'AI Analysis', weight: 35, estimatedDuration: 3000 },
      { name: 'Creating Chunks', weight: 10, estimatedDuration: 1000 },
      { name: 'Finalizing', weight: 5, estimatedDuration: 500 },
    ];
  }

  startProcessing(fileName: string, fileCount: number = 1, currentFileIndex: number = 1) {
    this.totalStartTime = Date.now();
    this.currentStepIndex = 0;
    this.stepStartTime = Date.now();
    
    this.updateProgress({
      progress: 0,
      status: 'Starting file processing...',
      currentStep: this.steps[0].name,
      fileName,
      fileCount,
      currentFileIndex,
      estimatedTimeRemaining: this.calculateTotalEstimatedTime(),
    });
  }

  updateStep(stepName: string, customProgress?: number) {
    const stepIndex = this.steps.findIndex(step => step.name === stepName);
    if (stepIndex === -1) return;

    this.currentStepIndex = stepIndex;
    this.stepStartTime = Date.now();

    const progress = customProgress !== undefined 
      ? customProgress 
      : this.calculateProgressForStep(stepIndex);

    this.updateProgress({
      progress,
      status: `Processing ${stepName.toLowerCase()}...`,
      currentStep: stepName,
      estimatedTimeRemaining: this.calculateTimeRemaining(),
    });
  }

  updateStepProgress(stepProgress: number, details?: string) {
    const currentStep = this.steps[this.currentStepIndex];
    const stepProgressPercent = Math.min(Math.max(stepProgress, 0), 100);
    
    // Calculate progress within current step
    const stepStartProgress = this.calculateProgressForStep(this.currentStepIndex);
    const stepEndProgress = this.calculateProgressForStep(this.currentStepIndex + 1);
    const stepRange = stepEndProgress - stepStartProgress;
    const currentProgress = stepStartProgress + (stepRange * stepProgressPercent / 100);

    this.updateProgress({
      progress: Math.round(currentProgress),
      status: `${currentStep.name}... ${stepProgressPercent}%`,
      currentStep: currentStep.name,
      details,
      estimatedTimeRemaining: this.calculateTimeRemaining(),
    });
  }

  completeStep(stepName: string) {
    const stepIndex = this.steps.findIndex(step => step.name === stepName);
    if (stepIndex === -1) return;

    // Move to next step
    this.currentStepIndex = stepIndex + 1;
    
    if (this.currentStepIndex < this.steps.length) {
      const nextStep = this.steps[this.currentStepIndex];
      this.updateProgress({
        progress: this.calculateProgressForStep(this.currentStepIndex),
        status: `Starting ${nextStep.name.toLowerCase()}...`,
        currentStep: nextStep.name,
        estimatedTimeRemaining: this.calculateTimeRemaining(),
      });
    } else {
      this.completeProcessing();
    }
  }

  completeProcessing() {
    const totalTime = Date.now() - this.totalStartTime;
    
    this.updateProgress({
      progress: 100,
      status: 'Processing complete!',
      currentStep: 'Complete',
      estimatedTimeRemaining: 0,
      details: `Completed in ${Math.round(totalTime / 1000)}s`,
    });

    // Emit completion event
    setTimeout(() => {
      this.emit('complete');
    }, 1000);
  }

  setError(error: string) {
    this.updateProgress({
      progress: this.currentProgress.progress,
      status: `Error: ${error}`,
      currentStep: 'Error',
      estimatedTimeRemaining: 0,
    });
  }

  private updateProgress(updates: Partial<ProcessingProgress>) {
    this.currentProgress = { ...this.currentProgress, ...updates };
    this.emit('progress', this.currentProgress);
  }

  private calculateProgressForStep(stepIndex: number): number {
    if (stepIndex <= 0) return 0;
    if (stepIndex >= this.steps.length) return 100;

    let progress = 0;
    for (let i = 0; i < stepIndex; i++) {
      progress += this.steps[i].weight;
    }
    return progress;
  }

  private calculateTotalEstimatedTime(): number {
    return this.steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }

  private calculateTimeRemaining(): number {
    const elapsed = Date.now() - this.totalStartTime;
    const totalEstimated = this.calculateTotalEstimatedTime();
    const remainingEstimated = totalEstimated - elapsed;
    
    return Math.max(0, remainingEstimated);
  }

  getCurrentProgress(): ProcessingProgress {
    return { ...this.currentProgress };
  }

  // Simulate realistic processing with delays
  async simulateRealisticProcessing(fileName: string, fileCount: number = 1, currentFileIndex: number = 1) {
    this.startProcessing(fileName, fileCount, currentFileIndex);

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      
      // Simulate step progress with realistic delays
      const stepDuration = step.estimatedDuration;
      const updateInterval = Math.min(stepDuration / 5, 100); // Update every 100ms or 5 times per step
      const totalUpdates = Math.floor(stepDuration / updateInterval);
      
      for (let update = 0; update < totalUpdates; update++) {
        const progress = (update / totalUpdates) * 100;
        this.updateStepProgress(progress, this.getStepDetails(step.name, progress));
        
        await new Promise(resolve => setTimeout(resolve, updateInterval));
      }
      
      this.completeStep(step.name);
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause between steps
    }
  }

  private getStepDetails(stepName: string, progress: number): string {
    const details = {
      'Reading File': [
        'Opening file...',
        'Validating file format...',
        'Reading file metadata...',
        'Preparing for content extraction...',
      ],
      'Extracting Content': [
        'Analyzing file structure...',
        'Extracting text content...',
        'Processing images...',
        'Organizing content sections...',
      ],
      'AI Analysis': [
        'Sending content to AI...',
        'Analyzing content complexity...',
        'Identifying key concepts...',
        'Generating learning objectives...',
      ],
      'Creating Chunks': [
        'Segmenting content...',
        'Creating study chunks...',
        'Adding assessment questions...',
        'Optimizing chunk sizes...',
      ],
      'Finalizing': [
        'Saving processed content...',
        'Updating course data...',
        'Generating summary...',
        'Complete!',
      ],
    };

    const stepDetails = details[stepName] || ['Processing...'];
    const detailIndex = Math.floor((progress / 100) * stepDetails.length);
    return stepDetails[Math.min(detailIndex, stepDetails.length - 1)];
  }
}

export const processingTracker = new ProcessingProgressTracker();
