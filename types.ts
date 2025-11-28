
import React from 'react';

export enum EmployeeStatus {
  Present = 'Present',
  Absent = 'Absent',
  HalfDay = 'Half Day',
  Late = 'Late',
  OnLeave = 'On Leave',
  CheckedOut = 'Checked Out',
  Inactive = 'Inactive'
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  branch?: string;
  mobile?: string;
  email?: string;
  joinDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: EmployeeStatus;
  avatar: string;
  location?: string;
  // New Fields
  shift?: string;
  workMode?: 'Office' | 'Field' | 'Remote';
  weeklyOff?: string;
  salary?: {
    ctc: number;
    basic: number;
    hra: number;
    allowances: number;
    pfDeduction: boolean;
    esiDeduction: boolean;
    ptDeduction: boolean;
  };
  leaves?: {
    casual: number;
    sick: number;
    privilege: number;
  };
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface ListItem {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  transactionNumber?: string;
  type: 'Income' | 'Expense';
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  status: 'Completed' | 'Pending' | 'Failed';
  description?: string;
}

export interface CompanySettings {
  attendanceMode: 'face' | 'qr' | 'kiosk' | 'biometric';
  salaryMonthType: 'calendar' | '30day' | '26day';
  attendanceCycle: '1-end' | '26-25' | 'custom';
  salaryRoundOff: 'none' | 'nearest' | 'ceil' | 'floor';
  includeWeekoffs: boolean;
  includeHolidays: boolean;
  autoLiveTrack: boolean;
  notifications: {
    appPunch: boolean;
    emailReport: boolean;
    whatsappAlert: boolean;
  };
}