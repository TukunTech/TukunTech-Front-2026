import { Routes } from '@angular/router';
import { Welcome } from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import {RegisterPlan} from './pages/register-plan/register-plan';
import {RegisterCaregiver} from './pages/register-caregiver/register-caregiver';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: Welcome
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'login/:role',
    component: Login
  },
  {
    path: 'register/account',
    component: RegisterCaregiver
  },
  {
    path: 'register/caregiver',
    redirectTo: '/register/account',
    pathMatch: 'full'
  },
  {
    path: 'register/patient',
    redirectTo: '/register/account',
    pathMatch: 'full'
  },
  {
    path: 'register',
    pathMatch: 'full',
    component: RegisterPlan
  }

];
