import type { User } from '../types';

export type Provider = "strava" | "samsung_health" | "google_fit" | "fitbit" | "garmin" | "apple_health" | "generic_wearable";

// Define sample mock data structures for each provider
const MOCK_DATA: Record<Provider, any[]> = {
  strava: [
    {
      "id": 900001001,
      "type": "Run",
      "name": "Easy Morning Run",
      "distance": 5000.0,
      "moving_time": 1800,
      "elapsed_time": 1900,
      "total_elevation_gain": 30.0,
      "average_speed": 2.7,
      "has_heartrate": true,
      "average_heartrate": 148,
      "max_heartrate": 172
    },
    {
      "id": 900001002,
      "type": "Ride",
      "name": "Weekend Commute",
      "distance": 12000.0,
      "moving_time": 2700,
      "elapsed_time": 2800,
      "total_elevation_gain": 80.0,
      "average_speed": 4.0,
      "has_heartrate": true,
      "average_heartrate": 135,
      "max_heartrate": 155
    }
  ],
  fitbit: [
    {
      "provider": "fitbit",
      "logId": 700001001,
      "activityType": "run",
      "device": "Fitbit Sense 2",
      "startTime": "2025-11-16T06:00:00Z",
      "durationMs": 1800000,
      "steps": 5000,
      "distance": 5.2,
      "distanceUnit": "Kilometer",
      "calories": 310,
      "heartRateZones": [
        {
          "name": "Fat Burn",
          "min": 110,
          "max": 130,
          "minutes": 12
        }
      ]
    }
  ],
  garmin: [
    {
      "activityId": 800001001,
      "activityType": "running",
      "event": "running",
      "eventType": "activity",
      "startTimeLocal": "2025-11-15T07:00:00",
      "distance": 5000,
      "duration": 1800,
      "steps": 6987,
      "calories": 320,
      "averageHR": 145,
      "maxHR": 170
    }
  ],
  samsung_health: [
    {
      "datauuid": "uuid1",
      "deviceuuid": "device1",
      "data": {
        "source_type": 1,
        "start_time": "2025-11-15T06:00:00+0000",
        "end_time": "2025-11-15T06:30:00+0000",
        "value": 4200,
        "unit": "count",
        "exercise_type": 10
      }
    }
  ],
  apple_health: [
    {
      "startDate": "2025-11-15T06:00:00-08:00",
      "endDate": "2025-11-15T06:30:00-08:00",
      "value": 4200,
      "unit": "count",
      "sourceName": "Apple Watch",
      "sourceVersion": "9.1",
      "device": "Apple Watch Series 7"
    }
  ],
  google_fit: [
    {
      "startTime": "2025-11-15T06:00:00.000Z",
      "endTime": "2025-11-15T06:30:00.000Z",
      "data": {
        "step_count_delta": 4200,
        "calories_consumed": 300,
        "distance_delta": 3000
      },
      "source": "com.google.android.gms:estimated_steps"
    }
  ],
  generic_wearable: [
    {
      "timestamp": "2025-11-15T06:00:00Z",
      "activity_type": "walking",
      "metric_value": 4200,
      "metric_unit": "steps",
      "duration_minutes": 30,
      "calories_burned": 120
    }
  ]
};

/**
 * Loads a random mock provider payload for the given provider
 */
export async function loadMockProviderPayload(provider: Provider): Promise<any> {
  // Get the array of mock data for the specified provider
  const providerData = MOCK_DATA[provider];
  
  if (!providerData || providerData.length === 0) {
    throw new Error(`No mock data available for provider: ${provider}`);
  }

  // Pick a random item from the provider data
  const randomIndex = Math.floor(Math.random() * providerData.length);
  const selectedData = providerData[randomIndex];

  return selectedData;
}

/**
 * Builds the workflow input object for Opus based on the provider and mock payload
 */
export async function buildWorkflowInputFromProvider(
  provider: Provider,
  mockPayload: any,
  userId: string,
  datetime: string
): Promise<any[]> {
  // Initialize all provider arrays as empty
  const workflowInput = [
    {
      fitbit_events: {
        id: "workflow_input_var_1_step-4",
        type: "array",
        value: [],
      },
      garmin_events: {
        id: "workflow_input_var_1_step-3",
        type: "array",
        value: [],
      },
      google_fit_events: {
        id: "workflow_input_var_1_step-6",
        type: "array",
        value: [],
      },
      strava_activities: {
        id: "workflow_input_var_1_step-1",
        type: "array",
        value: [],
      },
      apple_health_events: {
        id: "workflow_input_var_1_step-5",
        type: "array",
        value: [],
      },
      samsung_health_events: {
        id: "workflow_input_var_1_step-2",
        type: "array",
        value: [],
      },
      generic_wearable_events: {
        id: "workflow_input_var_1_step-7",
        type: "array",
        value: [],
      },
      workflow_input_rx1aqcl63: {
        id: "rx1aqcl63",
        type: "str",
        value: userId
      },
      workflow_input_dbgfl1k5j: {
        id: "dbgfl1k5j",
        type: "date",
        value: datetime
      }
    }
  ];

  // Convert the mock payload to the appropriate value array based on provider
  switch (provider) {
    case 'strava':
      const stravaActivity = mockPayload;
      workflowInput[0].strava_activities.value = [
        {
          date: new Date().toISOString(),
          user_id: userId,
          calories: stravaActivity.calories || Math.floor(Math.random() * 400) + 100,
          distance: stravaActivity.distance || 0,
          duration: stravaActivity.moving_time || Math.floor(Math.random() * 3600) + 600,
          activity_type: stravaActivity.type?.toLowerCase() || 'run',
          elevation_gain: stravaActivity.total_elevation_gain || 0
        }
      ];
      break;

    case 'fitbit':
      const fitbitActivity = mockPayload;
      workflowInput[0].fitbit_events.value = [
        {
          value: fitbitActivity.steps || fitbitActivity.distance,
          user_id: userId,
          timestamp: fitbitActivity.startTime || new Date().toISOString(),
          activity_type: fitbitActivity.activityType || 'walk',
        }
      ];
      break;

    case 'garmin':
      const garminActivity = mockPayload;
      workflowInput[0].garmin_events.value = [
        {
          user_id: userId,
          event_time: garminActivity.startTimeLocal || new Date().toISOString(),
          metric_name: 'steps',
          metric_value: garminActivity.steps || 0,
          activity_type: garminActivity.activityType || 'walking',
        }
      ];
      break;

    case 'samsung_health':
      const samsungHealthActivity = mockPayload;
      workflowInput[0].samsung_health_events.value = [
        {
          user_id: userId,
          event_date: samsungHealthActivity.data?.start_time || new Date().toISOString(),
          event_type: samsungHealthActivity.data?.exercise_type || 'walking',
          event_unit: samsungHealthActivity.data?.unit || 'count',
          event_value: samsungHealthActivity.data?.value || 0,
        }
      ];
      break;

    case 'apple_health':
      const appleHealthActivity = mockPayload;
      workflowInput[0].apple_health_events.value = [
        {
          unit: appleHealthActivity.unit || 'count',
          value: appleHealthActivity.value || 0,
          user_id: userId,
          timestamp: appleHealthActivity.startDate || new Date().toISOString(),
          event_type: 'steps' || appleHealthActivity.unit,
        }
      ];
      break;

    case 'google_fit':
      const googleFitActivity = mockPayload;
      workflowInput[0].google_fit_events.value = [
        {
          steps: googleFitActivity.data?.step_count_delta || 0,
          user_id: userId,
          calories: googleFitActivity.data?.calories_consumed || 0,
          timestamp: googleFitActivity.startTime || new Date().toISOString(),
          activity_type: 'walking',
          distance_meters: googleFitActivity.data?.distance_delta || 0,
          duration_minutes: Math.floor((googleFitActivity.endTime - googleFitActivity.startTime) / 60000) || 30,
        }
      ];
      break;

    case 'generic_wearable':
      const genericWearableActivity = mockPayload;
      workflowInput[0].generic_wearable_events.value = [
        {
          value: genericWearableActivity.metric_value || 0,
          user_id: userId,
          timestamp: genericWearableActivity.timestamp || new Date().toISOString(),
          event_type: genericWearableActivity.activity_type || 'walking',
        }
      ];
      break;

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return workflowInput;
}