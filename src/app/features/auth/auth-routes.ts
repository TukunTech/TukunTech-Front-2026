import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import {RegisterPatient} from './pages/register-patient/register-patient';
import {RegisterPlan} from './pages/register-plan/register-plan';
import {RegisterCaregiver} from './pages/register-caregiver/register-caregiver';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Welcome
  },
  {
    path: 'login/:role',
    component: Login
  },
  {
    path: 'register/caregiver',
    component: RegisterCaregiver
  },
  {
    path: 'register/patient',
    component: RegisterPatient
  },
  {
    path: 'register',
    pathMatch: 'full',
    component: RegisterPlan
  }

];
