import { Injectable } from '@angular/core';

export interface DeviceAlertParameters {
  patientUserId: string;
  heartRateMin: number;
  heartRateMax: number;
  temperatureMin: number;
  temperatureMax: number;
  oxygenSaturation: number;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceAlertParametersStore {
  private parameters = new Map<string, DeviceAlertParameters>([
    ['patient-demo-user', this.createParameters('patient-demo-user', 70, 100, 36.1, 37.2, 95)],
    ['patient-eleanor', this.createParameters('patient-eleanor', 70, 100, 36.1, 37.2, 95)],
    ['patient-charls', this.createParameters('patient-charls', 65, 105, 36.0, 37.4, 94)],
    ['patient-miguel', this.createParameters('patient-miguel', 68, 108, 36.0, 37.6, 93)],
    ['patient-marian', this.createParameters('patient-marian', 72, 98, 36.2, 37.2, 96)],
    ['patient-robert', this.createParameters('patient-robert', 65, 100, 36.1, 37.3, 95)]
  ]);

  getParameters(patientUserId: string): DeviceAlertParameters {
    return {
      ...(
        this.parameters.get(patientUserId) ||
        this.createParameters(patientUserId, 60, 100, 36.1, 38, 95)
      )
    };
  }

  updateParameters(parameters: DeviceAlertParameters): DeviceAlertParameters {
    const nextParameters = { ...parameters };
    this.parameters.set(parameters.patientUserId, nextParameters);

    if (parameters.patientUserId === 'patient-eleanor') {
      this.parameters.set('patient-demo-user', {
        ...nextParameters,
        patientUserId: 'patient-demo-user'
      });
    }

    if (parameters.patientUserId === 'patient-demo-user') {
      this.parameters.set('patient-eleanor', {
        ...nextParameters,
        patientUserId: 'patient-eleanor'
      });
    }

    return { ...nextParameters };
  }

  private createParameters(
    patientUserId: string,
    heartRateMin: number,
    heartRateMax: number,
    temperatureMin: number,
    temperatureMax: number,
    oxygenSaturation: number
  ): DeviceAlertParameters {
    return {
      patientUserId,
      heartRateMin,
      heartRateMax,
      temperatureMin,
      temperatureMax,
      oxygenSaturation
    };
  }
}
