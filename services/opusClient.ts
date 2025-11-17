import { OPUS_CONFIG } from '../constants';

// Type definition for job status
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface JobResult {
  status: JobStatus;
  result?: any;
}

export interface JobResponse {
  jobId: string;
  result?: any;
}

/**
 * Creates a job for the specified workflow in Opus
 */
export async function createJob(workflowId: string, workflowInput: any): Promise<string> {
  try {
    const response = await fetch(`${OPUS_CONFIG.BASE_URL}/v1/workflows/${workflowId}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPUS_CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        workflow_input: workflowInput
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create job: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const jobData = await response.json();
    return jobData.job_id || jobData.id; // Depending on how the API returns the job ID
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

/**
 * Gets the status of a job from Opus
 */
export async function getJobStatus(jobId: string): Promise<JobResult> {
  try {
    const response = await fetch(`${OPUS_CONFIG.BASE_URL}/v1/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPUS_CONFIG.API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get job status: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const jobData = await response.json();
    
    // Map the response to our expected format
    return {
      status: jobData.status as JobStatus,
      result: jobData.result || jobData.output
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

/**
 * Creates and runs a job, then waits for completion
 */
export async function runJobAndWait(
  workflowInput: any, 
  options?: { 
    pollIntervalMs?: number; 
    timeoutMs?: number 
  }
): Promise<JobResponse> {
  const workflowId = OPUS_CONFIG.WORKFLOW_ID;
  const jobId = await createJob(workflowId, workflowInput);

  const pollInterval = options?.pollIntervalMs ?? 1500;
  const timeout = options?.timeoutMs ?? 60000;
  const start = Date.now();

  while (true) {
    try {
      const { status, result } = await getJobStatus(jobId);

      if (status === "COMPLETED") {
        return { jobId, result };
      }
      if (status === "FAILED") {
        throw new Error(`Opus job ${jobId} failed`);
      }

      if (Date.now() - start > timeout) {
        throw new Error(`Opus job ${jobId} timed out`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error polling job status:', error);
      throw error;
    }
  }
}