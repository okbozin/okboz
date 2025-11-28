
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { Employee, EmployeeStatus, Department, Transaction, ListItem, CompanySettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { db, isConfigured } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// --- Sub-Components ---

// Reusable List Manager (for Departments, Roles, Holidays, etc.)
// Now supports IDs for correct deletion in Firebase
const SimpleListManager: React.FC<{
  title: string;
  placeholder: string;
  collectionName: string;
  storageKey: string;
  icon: any;
}> = ({ title, placeholder, collectionName, storageKey, icon: Icon }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (isConfigured) {
      const q = db.collection(collectionName).orderBy('name');
      const unsub = q.onSnapshot((snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });
      return () => unsub();
    } else {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        // Handle legacy string array or new object array
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
               setItems(parsed.map((s: string) => ({ id: s, name: s })));
            } else {
               setItems(parsed);
            }
          }
        } catch (e) {
          console.error("Error parsing list", e);
        }
      }
    }
  }, [collectionName, storageKey]);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    if (isConfigured) {
      await db.collection(collectionName).add({ name: newItem.trim() });
    } else {
      const newEntry = { id: Date.now().toString(), name: newItem.trim() };
      const updated = [...items, newEntry];
      setItems(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setNewItem('');
  };

  const handleDelete = async (itemId: string) => {
     if(isConfigured) {
        try {
           await db.collection(collectionName).doc(itemId).delete();
        } catch (e) {
           console.error("Error deleting doc", e);
           alert("Error deleting item. Check console.");
        }
     } else {
        const updated = items.filter(i => i.id !== itemId);
        setItems(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
     }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Icon className="w-5 h-5 text-brand-600" />
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">
         <div className="flex gap-2 mb-4">
           <input 
             type="text" 
             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
             placeholder={placeholder}
             value={newItem}
             onChange={(e) => setNewItem(e.target.value)}
           />
           <button 
             onClick={handleAdd}
             className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
           >
             <Icons.Plus className="w-5 h-5" />
           </button>
         </div>
         <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
           {items.map((item) => (
             <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-brand-200 transition-colors">
               <span className="text-gray-700 font-medium">{item.name}</span>
               <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Icons.X className="w-4 h-4" />
               </button>
             </div>
           ))}
           {items.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No items added.</p>}
         </div>
      </div>
    </div>
  );
};

// Global Company Settings Document ID
const SETTINGS_DOC_ID = 'globalConfig';

const EmployeeSettingsSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('org_structure');
  
  // Local state for toggles/settings
  const [settings, setSettings] = useState<CompanySettings>({
     attendanceMode: 'face',
     salaryMonthType: 'calendar',
     includeWeekoffs: true,
     includeHolidays: true,
     autoLiveTrack: false,
     attendanceCycle: '1-end',
     salaryRoundOff: 'none',
     notifications: {
        appPunch: true,
        emailReport: false,
        whatsappAlert: false
     }
  });

  // Load Settings
  useEffect(() => {
     if (isConfigured) {
        const unsub = db.collection('settings').doc(SETTINGS_DOC_ID).onSnapshot((doc) => {
           if (doc.exists) {
              setSettings(doc.data() as CompanySettings);
           }
        });
        return () => unsub();
     } else {
        const local = localStorage.getItem('jk_company_settings');
        if (local) setSettings(JSON.parse(local));
     }
  }, []);

  // Save Settings Helper
  const updateSetting = async (key: keyof CompanySettings, value: any) => {
     const newSettings = { ...settings, [key]: value };
     setSettings(newSettings);
     
     if (isConfigured) {
        await db.collection('settings').doc(SETTINGS_DOC_ID).set(newSettings, { merge: true });
     } else {
        localStorage.setItem('jk_company_settings', JSON.stringify(newSettings));
     }
  };

  // Special handler for nested Notification object
  const updateNotification = async (key: string, value: boolean) => {
      const newNotifs = { ...settings.notifications, [key]: value };
      updateSetting('notifications', newNotifs);
  };

  // Navigation Items
  const navGroups = [
    {
      category: "My Company",
      items: [
        { id: 'reports', label: 'My Company Report', icon: Icons.FileBarChart },
        { id: 'admins', label: 'My Team (Admins)', icon: Icons.ShieldCheck },
        { id: 'org_structure', label: 'Departments & Roles', icon: Icons.Building },
        { id: 'custom_fields', label: 'Custom Fields', icon: Icons.ListPlus },
        { id: 'inactive_emp', label: 'Inactive Employees', icon: Icons.UserMinus },
      ]
    },
    {
      category: "Attendance Settings",
      items: [
        { id: 'shifts', label: 'Shifts & Breaks', icon: Icons.Clock },
        { id: 'attendance_modes', label: 'Attendance Modes', icon: Icons.ScanFace },
      ]
    },
    {
      category: "Leaves And Holidays",
      items: [
        { id: 'leaves', label: 'Custom Paid Leaves', icon: Icons.Plane },
        { id: 'holidays', label: 'Holiday List', icon: Icons.Calendar },
      ]
    },
    {
       category: "Automation",
       items: [
          { id: 'automation', label: 'Auto Live Track', icon: Icons.Navigation }
       ]
    },
    {
        category: "Salary Settings",
        items: [
            { id: 'salary_month', label: 'Calendar Month', icon: Icons.CalendarRange },
            { id: 'salary_cycle', label: 'Attendance Cycle', icon: Icons.RotateCcw },
            { id: 'salary_import', label: 'Import Settings', icon: Icons.Upload },
            { id: 'incentives', label: 'Incentive Types', icon: Icons.Award },
            { id: 'salary_template', label: 'Salary Templates', icon: Icons.FileSpreadsheet },
            { id: 'round_off', label: 'Round Off', icon: Icons.Calculator },
        ]
    },
    {
        category: "Alert & Notification",
        items: [
            { id: 'notifications', label: 'App Notifications', icon: Icons.Bell }
        ]
    },
    {
        category: "Other Settings",
        items: [
            { id: 'feedback', label: 'Request A Feature', icon: Icons.Megaphone }
        ]
    }
  ];

  // Helper to find the active item object
  const activeItem = navGroups.flatMap(g => g.items).find(i => i.id === activeSubTab);

  // -- Content Components --

  const ReportsView = () => (
     <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Generate Reports</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                 <select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option>Daily Attendance Report</option>
                    <option>Monthly Salary Register</option>
                    <option>Employee Master Data</option>
                    <option>Leave Summary</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                 <select className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option>Excel (.xlsx)</option>
                    <option>PDF (.pdf)</option>
                    <option>CSV (.csv)</option>
                 </select>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                 <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                 <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
           </div>
           <div className="pt-4">
              <button onClick={() => alert("Report generation simulated.")} className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
                 <Icons.Download className="w-4 h-4" /> Download Report
              </button>
           </div>
        </div>
     </div>
  );

  const InactiveEmployeesView = () => {
      const [inactiveList, setInactiveList] = useState<Employee[]>([]);

      useEffect(() => {
         if(isConfigured) {
             const q = db.collection('employees').where('status', '==', 'Inactive');
             const unsub = q.onSnapshot((snap) => {
                 setInactiveList(snap.docs.map(d => ({id: d.id, ...d.data()} as Employee)));
             });
             return () => unsub();
         } else {
             // Mock data for demo
             setInactiveList([]);
         }
      }, []);

      return (
         <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Inactive Employees</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
               {inactiveList.length > 0 ? (
                  <table className="w-full text-left">
                     <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                           <th className="px-6 py-4">Name</th>
                           <th className="px-6 py-4">Role</th>
                           <th className="px-6 py-4">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {inactiveList.map(emp => (
                           <tr key={emp.id}>
                              <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                              <td className="px-6 py-4 text-gray-500">{emp.role}</td>
                              <td className="px-6 py-4">
                                 <button className="text-brand-600 hover:underline text-sm">Restore</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="p-8 text-center text-gray-400">
                     <Icons.UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                     <p>No inactive employees found.</p>
                  </div>
               )}
            </div>
         </div>
      );
  };

  const OrgStructure = () => (
     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SimpleListManager 
          title="Departments" 
          placeholder="New Department (e.g. IT, HR)" 
          collectionName="settings_departments"
          storageKey="jk_demo_departments"
          icon={Icons.Building}
        />
        <SimpleListManager 
          title="Job Roles / Designations" 
          placeholder="New Role (e.g. Manager)" 
          collectionName="settings_roles"
          storageKey="jk_demo_roles"
          icon={Icons.Briefcase}
        />
        <SimpleListManager 
          title="Office Branches" 
          placeholder="New Branch (e.g. Mumbai HQ)" 
          collectionName="settings_branches"
          storageKey="jk_demo_branches"
          icon={Icons.MapPin}
        />
     </div>
  );

  const AttendanceModes = () => (
     <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Attendance Verification Modes</h3>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
           {[
              { id: 'face', title: 'AI Face Recognition', desc: 'Verify employee face on Punch In/Out', icon: Icons.ScanFace },
              { id: 'qr', title: 'QR Code Attendance', desc: 'Scan QR code at office to punch', icon: Icons.QrCode },
              { id: 'kiosk', title: 'Attendance Kiosk', desc: 'Common device for all staff', icon: Icons.Tablet },
              { id: 'biometric', title: 'Biometric Device', desc: 'Integrate fingerprint scanner', icon: Icons.Fingerprint },
           ].map((mode, i) => {
              const isActive = settings.attendanceMode === mode.id;
              return (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => updateSetting('attendanceMode', mode.id)}>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                           <mode.icon className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800">{mode.title}</h4>
                           <p className="text-sm text-gray-500">{mode.desc}</p>
                        </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-brand-600' : 'border-gray-300'}`}>
                        {isActive && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full"></div>}
                    </div>
                </div>
              );
           })}
        </div>
     </div>
  );

  const SalaryMonthSettings = () => (
     <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Month Calculation Logic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
              { id: 'calendar', title: 'Calendar Month', desc: 'Jan (31), Feb (28/29)' },
              { id: '30day', title: '30 Day Month', desc: 'Fixed 30 days for all months' },
              { id: '26day', title: '26 Day Month', desc: 'Fixed 26 days (Excl. Sundays)' },
           ].map((opt, i) => {
              const isActive = settings.salaryMonthType === opt.id;
              return (
                  <div 
                     key={i} 
                     onClick={() => updateSetting('salaryMonthType', opt.id)}
                     className={`p-4 border rounded-xl cursor-pointer transition-all ${isActive ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                     <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold ${isActive ? 'text-brand-800' : 'text-gray-800'}`}>{opt.title}</h4>
                        {isActive && <Icons.CheckCircle2 className="w-5 h-5 text-brand-600" />}
                     </div>
                     <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
              );
           })}
        </div>
        
        <div className="mt-8">
           <h3 className="text-lg font-bold text-gray-800 mb-4">Inclusions</h3>
           <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                 <input 
                    type="checkbox" 
                    className="w-5 h-5 text-brand-600 rounded" 
                    checked={settings.includeWeekoffs} 
                    onChange={(e) => updateSetting('includeWeekoffs', e.target.checked)}
                 />
                 <span className="text-gray-700">Include Weekoffs in Salary</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                 <input 
                    type="checkbox" 
                    className="w-5 h-5 text-brand-600 rounded" 
                    checked={settings.includeHolidays}
                    onChange={(e) => updateSetting('includeHolidays', e.target.checked)}
                 />
                 <span className="text-gray-700">Include Public Holidays in Salary</span>
              </label>
           </div>
        </div>
     </div>
  );

  const AttendanceCycleView = () => (
     <div className="space-y-6">
         <h3 className="text-lg font-bold text-gray-800">Attendance Cycle</h3>
         <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
             {[
                 { id: '1-end', label: '1st to End of Month', desc: 'Standard calendar cycle (e.g. 1 Jan - 31 Jan)' },
                 { id: '26-25', label: '26th to 25th', desc: 'Salary cycle from previous month 26th to current 25th' },
                 { id: 'custom', label: 'Custom Cycle', desc: 'Define your own start and end dates' },
             ].map((opt, i) => (
                 <label key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                     <input 
                        type="radio" 
                        name="attendanceCycle" 
                        className="mt-1 w-5 h-5 text-brand-600 border-gray-300 focus:ring-brand-500" 
                        checked={settings.attendanceCycle === opt.id}
                        onChange={() => updateSetting('attendanceCycle', opt.id)}
                     />
                     <div>
                         <span className="block font-medium text-gray-900">{opt.label}</span>
                         <span className="block text-sm text-gray-500">{opt.desc}</span>
                     </div>
                 </label>
             ))}
         </div>
     </div>
  );

  const RoundOffView = () => (
      <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Salary Rounding</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Round Off Strategy</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={settings.salaryRoundOff || 'none'}
                onChange={(e) => updateSetting('salaryRoundOff', e.target.value)}
              >
                  <option value="none">No Rounding (Exact Decimal)</option>
                  <option value="nearest">Nearest Integer</option>
                  <option value="ceil">Round Up (Ceiling)</option>
                  <option value="floor">Round Down (Floor)</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">Determines how the final Net Pay is rounded in payslips.</p>
          </div>
      </div>
  );

  const NotificationSettingsView = () => (
      <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Alerts & Notifications</h3>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="p-4 flex items-center justify-between">
                  <div>
                      <h4 className="font-medium text-gray-900">App Push Notifications</h4>
                      <p className="text-sm text-gray-500">Notify regarding Punch In/Out and Leave requests.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.notifications?.appPunch ?? true}
                        onChange={(e) => updateNotification('appPunch', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
              </div>
              <div className="p-4 flex items-center justify-between">
                  <div>
                      <h4 className="font-medium text-gray-900">Email Reports</h4>
                      <p className="text-sm text-gray-500">Receive daily attendance summary via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.notifications?.emailReport ?? false}
                        onChange={(e) => updateNotification('emailReport', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
              </div>
          </div>
      </div>
  );

  const AutomationSettings = () => (
     <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                 <Icons.Navigation className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-800">Auto Live Track</h3>
                 <p className="text-gray-500">Automatically track employee GPS location when they are Punched In.</p>
              </div>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
               <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.autoLiveTrack}
                  onChange={(e) => updateSetting('autoLiveTrack', e.target.checked)}
               />
               <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600"></div>
           </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
           <p>• Requires "Location" permission on employee app.</p>
           <p>• Tracking stops automatically on Punch Out.</p>
           <p>• View live locations in the "Field Tracking" tab.</p>
        </div>
     </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeSubTab) {
      case 'reports': return <ReportsView />;
      case 'admins': return <SimpleListManager title="Admin Team" placeholder="Admin Email (e.g. hr@company.com)" collectionName="settings_admins" storageKey="jk_demo_admins" icon={Icons.ShieldCheck} />;
      case 'org_structure': return <OrgStructure />;
      case 'custom_fields': return <SimpleListManager title="Custom Employee Fields" placeholder="Field Name (e.g. Blood Group, Aadhar)" collectionName="settings_custom_fields" storageKey="jk_demo_custom_fields" icon={Icons.ListPlus} />;
      case 'inactive_emp': return <InactiveEmployeesView />;
      case 'shifts': return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SimpleListManager title="Company Shifts" placeholder="e.g. General (9-6)" collectionName="settings_shifts" storageKey="jk_demo_shifts" icon={Icons.Clock} />
            <SimpleListManager title="Breaks" placeholder="e.g. Lunch (1hr)" collectionName="settings_breaks" storageKey="jk_demo_breaks" icon={Icons.Coffee} />
         </div>
      );
      case 'attendance_modes': return <AttendanceModes />;
      case 'leaves': return <SimpleListManager title="Custom Leave Types" placeholder="e.g. Sick Leave, Casual Leave" collectionName="settings_leavetypes" storageKey="jk_demo_leavetypes" icon={Icons.Plane} />;
      case 'holidays': return <SimpleListManager title="Holiday List" placeholder="e.g. Diwali, Christmas" collectionName="settings_holidays" storageKey="jk_demo_holidays" icon={Icons.Calendar} />;
      case 'automation': return <AutomationSettings />;
      case 'salary_month': return <SalaryMonthSettings />;
      case 'salary_cycle': return <AttendanceCycleView />;
      case 'salary_import': return (
         <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
             <Icons.Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <h3 className="font-bold text-gray-700">Import Salary Data</h3>
             <p className="text-gray-500 text-sm mb-4">Upload a CSV to map biometric IDs to employee profiles.</p>
             <button className="px-4 py-2 border border-brand-600 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50">Upload CSV</button>
         </div>
      );
      case 'incentives': return <SimpleListManager title="Incentive Types" placeholder="e.g. Sales Bonus, Performance" collectionName="settings_incentives" storageKey="jk_demo_incentives" icon={Icons.Award} />;
      case 'salary_template': return <SimpleListManager title="Salary Templates" placeholder="e.g. Intern Structure, Full Time" collectionName="settings_salary_templates" storageKey="jk_demo_salary_templates" icon={Icons.FileSpreadsheet} />;
      case 'round_off': return <RoundOffView />;
      case 'notifications': return <NotificationSettingsView />;
      case 'feedback': 
         return (
            <div className="max-w-xl">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Request a Feature</h3>
               <textarea className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Tell us what you want to see next..."></textarea>
               <button className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand-600/20">Submit Feedback</button>
            </div>
         );
      default:
         return (
            <div className="text-center py-20 opacity-50">
               <Icons.Construction className="w-16 h-16 mx-auto mb-4 text-gray-400" />
               <h3 className="text-xl font-bold text-gray-600">Configuration Coming Soon</h3>
               <p>This setting module is under development.</p>
            </div>
         );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scrollbar flex-shrink-0">
         <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
               <Icons.Settings className="w-5 h-5 text-brand-600" /> Configuration
            </h2>
         </div>
         <div className="py-2">
            {navGroups.map((group, idx) => (
               <div key={idx} className="mb-4">
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{group.category}</h3>
                  <div className="space-y-0.5">
                     {group.items.map(item => (
                        <button
                           key={item.id}
                           onClick={() => setActiveSubTab(item.id)}
                           className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                              activeSubTab === item.id 
                                 ? 'bg-brand-100 text-brand-800 font-medium border-r-4 border-brand-600' 
                                 : 'text-gray-600 hover:bg-gray-100'
                           }`}
                        >
                           <item.icon className={`w-4 h-4 ${activeSubTab === item.id ? 'text-brand-600' : 'text-gray-400'}`} />
                           <span className="text-sm">{item.label}</span>
                        </button>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white custom-scrollbar">
         <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
               <div className="p-2 bg-gray-100 rounded-lg text-brand-600">
                 {activeItem && <activeItem.icon className="w-6 h-6" />}
               </div>
               <h2 className="text-2xl font-bold text-gray-800">
                  {activeItem?.label || 'Settings'}
               </h2>
            </div>
            {renderContent()}
         </div>
      </div>
    </div>
  );
};

const SiteSettingsSection: React.FC = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [mapsConfig, setMapsConfig] = useState({
    apiKey: '',
    enableTracking: false
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    // Load Firebase Config
    const saved = localStorage.getItem('jk_buddy_firebase_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch(e) { console.error("Bad config in localstorage"); }
    }

    // Load Maps Config
    const savedMaps = localStorage.getItem('jk_buddy_maps_config');
    if (savedMaps) {
      try {
         setMapsConfig(JSON.parse(savedMaps));
      } catch(e) { console.error("Bad map config"); }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleMapsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMapsConfig({ ...mapsConfig, [e.target.name]: value });
  };

  const handleSave = () => {
    if (!config.apiKey || !config.projectId) {
       alert("Please enter at least API Key and Project ID.");
       return;
    }
    // Prevent saving default placeholder as valid config
    if (config.apiKey === 'YOUR_API_KEY') {
       alert("You cannot save the default placeholder API Key. Please enter your real Firebase credentials.");
       return;
    }
    localStorage.setItem('jk_buddy_firebase_config', JSON.stringify(config));
    window.location.reload();
  };

  const handleMapsSave = () => {
    localStorage.setItem('jk_buddy_maps_config', JSON.stringify(mapsConfig));
    alert("Google Maps configuration saved successfully!");
  };

  const handleRestore = () => {
    if (window.confirm("Are you sure you want to restore default settings? This will clear your custom configuration.")) {
      localStorage.removeItem('jk_buddy_firebase_config');
      localStorage.removeItem('jk_buddy_maps_config');
      window.location.reload();
    }
  };

  const parseJsonConfig = () => {
    try {
        // Remove 'const firebaseConfig = ' and any trailing semicolons or whitespace
        let cleaned = jsonInput
            .replace(/const\s+firebaseConfig\s*=\s*/, '')
            .replace(/;$/, '')
            .trim();
        
        // If user pasted a relaxed JSON (JS object), we might need to quote keys
        // Simple heuristic: try to parse directly, if fail, try to quote keys
        // But JSON.parse is strict. 
        // Let's assume standard JSON first.
        
        // Note: The Firebase console gives a JS object, not valid JSON (keys aren't quoted).
        // e.g. { apiKey: "..." }
        // We need to convert this to valid JSON.
        
        // Regex to quote keys
        cleaned = cleaned.replace(/(\w+):/g, '"$1":');
        // Regex to replace single quotes with double quotes
        cleaned = cleaned.replace(/'/g, '"');
        
        // Remove trailing commas
        cleaned = cleaned.replace(/,\s*}/g, '}');

        const parsed = JSON.parse(cleaned);
        
        if (parsed.apiKey && parsed.projectId) {
            setConfig({
                apiKey: parsed.apiKey,
                authDomain: parsed.authDomain || '',
                projectId: parsed.projectId,
                storageBucket: parsed.storageBucket || '',
                messagingSenderId: parsed.messagingSenderId || '',
                appId: parsed.appId || ''
            });
            setShowJsonModal(false);
            setTestStatus('idle');
            setStatusMessage('Config parsed! Click "Sync & Restart" to apply.');
        } else {
            alert("Could not find apiKey or projectId in the pasted text.");
        }
    } catch (e) {
        console.error(e);
        alert("Failed to parse. Please ensure you pasted the full code block from Firebase.");
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setStatusMessage('Attempting to connect to Firebase...');
    
    try {
      const tempApp = firebase.initializeApp(config, 'testApp');
      const tempDb = tempApp.firestore();
      
      // Try to read a non-existent doc just to check connection
      try {
        await tempDb.collection('test_collection').doc('test_doc').get();
        // If we get here (even if doc doesn't exist), connection worked enough to check
        setTestStatus('success');
        setStatusMessage('Connection Successful! Configuration is valid.');
      } catch (innerError: any) {
        if (innerError.code === 'permission-denied') {
             // This is technically a success for connectivity (we reached the server)
             setTestStatus('success');
             setStatusMessage('Connected! (Note: Permission Denied - check rules if needed)');
        } else {
             throw innerError;
        }
      }
      
      await tempApp.delete();
    } catch (error: any) {
      console.error(error);
      setTestStatus('error');
      setStatusMessage(`Connection Failed: ${error.message}`);
    }
  };

  const handleSeedDatabase = async () => {
      if (!isConfigured) {
          alert("Please configure and sync Firebase keys first before initializing the database.");
          return;
      }
      if (!window.confirm("This will populate your database with default roles, departments, and settings. Continue?")) return;
      
      setIsSeeding(true);
      try {
          const batch = db.batch();
          
          // 1. Global Settings
          const settingsRef = db.collection('settings').doc('globalConfig');
          batch.set(settingsRef, {
              attendanceMode: 'face',
              salaryMonthType: 'calendar',
              includeWeekoffs: true,
              includeHolidays: true,
              autoLiveTrack: false,
              attendanceCycle: '1-end',
              salaryRoundOff: 'none',
              notifications: { appPunch: true, emailReport: false, whatsappAlert: false }
          });

          // 2. Default Departments
          const deptNames = ['Human Resources', 'IT & Development', 'Sales & Marketing', 'Operations', 'Finance'];
          deptNames.forEach(name => {
              const ref = db.collection('settings_departments').doc();
              batch.set(ref, { name });
          });

          // 3. Default Roles
          const roleNames = ['Manager', 'Team Lead', 'Senior Developer', 'Sales Executive', 'Accountant', 'Intern'];
          roleNames.forEach(name => {
              const ref = db.collection('settings_roles').doc();
              batch.set(ref, { name });
          });

          // 4. Default Branches
          const branchRef = db.collection('settings_branches').doc();
          batch.set(branchRef, { name: 'Head Office' });

          // 5. Default Shifts
          const shiftRef = db.collection('settings_shifts').doc();
          batch.set(shiftRef, { name: 'General Shift (9 AM - 6 PM)' });

          await batch.commit();
          alert("Success! Your cloud database has been initialized with default data.");
      } catch (e: any) {
          console.error(e);
          alert("Error initializing database: " + e.message + "\nCheck if your account has Write permissions.");
      } finally {
          setIsSeeding(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <Icons.Settings className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Site Settings</h2>
            <p className="text-gray-500">Configure your application connections and integrations.</p>
          </div>
       </div>

       {/* Firebase Config Card */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-50 px-6 py-4 border-b border-brand-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <Icons.Flame className="text-brand-600 w-5 h-5" />
                 <h3 className="font-bold text-brand-900">Firebase Configuration</h3>
             </div>
             <button 
                onClick={() => setShowJsonModal(true)}
                className="text-xs font-bold text-brand-700 bg-brand-100 hover:bg-brand-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
             >
                <Icons.FileCode className="w-3 h-3" /> Paste Config JSON
             </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             {Object.keys(config).map((key) => (
                <div key={key} className="space-y-1">
                   <label className="text-sm font-medium text-gray-700 capitalize">
                     {key.replace(/([A-Z])/g, ' $1').trim()}
                   </label>
                   <input 
                     type="text" 
                     name={key}
                     value={(config as any)[key]}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-sm"
                     placeholder={`Enter ${key}`}
                   />
                </div>
             ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3 w-full sm:w-auto">
               <button 
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      testStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
                      testStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
               >
                 {testStatus === 'testing' ? <Icons.RefreshCw className="animate-spin w-4 h-4" /> : <Icons.Wifi className="w-4 h-4" />}
                 Test Connection
               </button>
               {testStatus !== 'idle' && (
                  <span className={`text-xs font-medium ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                    {statusMessage}
                  </span>
               )}
             </div>

             <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-transparent text-sm font-medium transition-colors"
                >
                  <Icons.RotateCcw className="w-4 h-4" /> Restore Defaults
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg transition-all text-sm font-medium"
                >
                  <Icons.RefreshCw className="w-4 h-4" /> Sync & Restart
                </button>
             </div>
          </div>
       </div>

       {/* Database Management Card */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center gap-3">
             <Icons.Database className="text-purple-600 w-5 h-5" />
             <h3 className="font-bold text-purple-900">Database Management</h3>
          </div>
          <div className="p-6 flex items-center justify-between">
              <div>
                  <h4 className="font-bold text-gray-800">Initialize Cloud Database</h4>
                  <p className="text-sm text-gray-500 max-w-lg">
                      Populate your fresh Firestore database with default Departments, Roles, Shifts, and Global Settings. 
                      Use this only once after connecting a new project.
                  </p>
              </div>
              <button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding || !isConfigured}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                      isConfigured 
                      ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                  {isSeeding ? <Icons.RefreshCw className="animate-spin w-5 h-5" /> : <Icons.Layers className="w-5 h-5" />}
                  {isSeeding ? 'Initializing...' : 'Initialize Data'}
              </button>
          </div>
       </div>

       {/* Google Maps Integration Card */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
             <Icons.Map className="text-blue-600 w-5 h-5" />
             <h3 className="font-bold text-blue-900">Integrations: Google Maps & Field Tracking</h3>
          </div>
          
          <div className="p-6 space-y-4">
             <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Google Maps API Key</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="apiKey"
                    value={mapsConfig.apiKey}
                    onChange={handleMapsChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm pl-10"
                    placeholder="Enter AIza..."
                  />
                  <Icons.MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Required for Live Field Tracking, Distance Calculation, and Meeting Logs.</p>
             </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                      <Icons.Navigation className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800 text-sm">Enable Live Employee Tracking</h4>
                      <p className="text-xs text-gray-500">Track real-time location of checked-in field employees.</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="enableTracking" 
                    checked={mapsConfig.enableTracking}
                    onChange={handleMapsChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
             <button 
               onClick={handleMapsSave}
               className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all text-sm font-medium"
             >
               <Icons.Check className="w-4 h-4" /> Save Integration
             </button>
          </div>
       </div>

       <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Icons.Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
             <h4 className="text-sm font-bold text-blue-800">Connection Status</h4>
             <p className="text-xs text-blue-600 mt-1">
               {isConfigured 
                 ? "You are using a custom Firebase configuration. Data is syncing live." 
                 : "You are currently in Demo Mode using local browser storage. Configure Firebase above to persist data."}
             </p>
          </div>
       </div>

       {/* Paste Config Modal */}
       {showJsonModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-800">Paste Configuration Code</h3>
                   <button onClick={() => setShowJsonModal(false)} className="text-gray-400 hover:text-gray-600"><Icons.X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                   <p className="text-sm text-gray-500 mb-3">
                      Copy the code block from Firebase Console (Project Settings {'>'} General {'>'} Your apps) and paste it here.
                   </p>
                   <textarea 
                     className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                     placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "..."\n};`}
                     value={jsonInput}
                     onChange={(e) => setJsonInput(e.target.value)}
                   ></textarea>
                   <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setShowJsonModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                      <button onClick={parseJsonConfig} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-bold">Parse & Apply</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

const FieldTrackingSection: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
    const [mapApiKey, setMapApiKey] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('jk_buddy_maps_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.apiKey && parsed.enableTracking) {
                    setMapApiKey(parsed.apiKey);
                }
            } catch (e) { console.error("Bad map config"); }
        }
    }, []);

    // Filter for Active Field Employees
    const fieldAgents = useMemo(() => 
        employees.filter(e => e.workMode === 'Field' && e.status === EmployeeStatus.Present),
    [employees]);

    const selectedEmp = employees.find(e => e.id === selectedEmpId);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Sidebar List */}
            <div className="w-80 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Icons.MapPin className="w-5 h-5 text-brand-600" /> Field Agents
                        <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">{fieldAgents.length}</span>
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {fieldAgents.length > 0 ? (
                        fieldAgents.map(agent => (
                            <div 
                                key={agent.id}
                                onClick={() => setSelectedEmpId(agent.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedEmpId === agent.id 
                                    ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' 
                                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate">{agent.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{agent.location || 'Location pending...'}</p>
                                    </div>
                                    <div className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                        Live
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 px-1">
                                    <span className="flex items-center gap-1"><Icons.Clock className="w-3 h-3" /> 2m ago</span>
                                    <span className="flex items-center gap-1"><Icons.Battery className="w-3 h-3" /> 84%</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 px-4 text-gray-400">
                            <Icons.MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No field agents currently active.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative">
                {mapApiKey ? (
                    selectedEmp && selectedEmp.location ? (
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=${mapApiKey}&q=${encodeURIComponent(selectedEmp.location)}&zoom=14`}>
                        </iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-blue-900/50">
                            <Icons.Map className="w-20 h-20 mb-4 opacity-20" />
                            <h3 className="text-xl font-bold opacity-60">Select an agent to view location</h3>
                            <p className="text-sm opacity-50">Real-time GPS tracking enabled</p>
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-center p-8">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                            <Icons.MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Google Maps Not Configured</h3>
                        <p className="text-gray-500 max-w-md mt-2 mb-6">
                            To view live employee locations, you need to add a Google Maps API Key in Site Settings.
                        </p>
                        <div className="flex gap-3">
                            <button className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors">
                                Go to Settings
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Floating Info Card */}
                {selectedEmp && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-white/50 max-w-xs">
                        <h4 className="font-bold text-gray-900">{selectedEmp.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedEmp.location || 'Fetching...'}</p>
                        <div className="mt-3 flex gap-2">
                             <button className="flex-1 bg-brand-600 text-white text-xs font-bold py-2 rounded-lg">View History</button>
                             <button className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg">Call</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

interface DashboardProps {
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState(''); // New State for Search
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('personal'); // 'personal', 'attendance', 'salary', 'leaves'
  
  // Configuration Data (for Dropdowns in Add Employee)
  const [departments, setDepartments] = useState<ListItem[]>([]);
  const [roles, setRoles] = useState<ListItem[]>([]);
  const [branches, setBranches] = useState<ListItem[]>([]);
  const [shifts, setShifts] = useState<ListItem[]>([]);

  // Finance State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [financeFilter, setFinanceFilter] = useState('All'); // 'All', 'Income', 'Expense'
  const [financeAIResponse, setFinanceAIResponse] = useState('');
  const [isAnalyzingFinance, setIsAnalyzingFinance] = useState(false);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    role: '',
    department: '',
    branch: '',
    mobile: '',
    email: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: EmployeeStatus.Present,
    workMode: 'Office',
    weeklyOff: 'Sunday',
    salary: {
       ctc: 0,
       basic: 0,
       hra: 0,
       allowances: 0,
       pfDeduction: false,
       esiDeduction: false,
       ptDeduction: false
    },
    leaves: {
       casual: 6,
       sick: 6,
       privilege: 15
    }
  });

  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'Expense',
    title: '',
    transactionNumber: '',
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    status: 'Pending',
    description: ''
  });

  // Load Data
  useEffect(() => {
    // 1. Load Employees
    if (isConfigured) {
      const q = db.collection('employees').orderBy('name');
      const unsubscribe = q.onSnapshot((snapshot) => {
        const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(empList);
      }, (error) => console.error("Employee sync error:", error));
      
      // 2. Load Transactions
      const tQ = db.collection('transactions').orderBy('date', 'desc');
      const unsubscribeTrans = tQ.onSnapshot((snapshot) => {
         const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
         setTransactions(transList);
      }, (error) => console.error("Transaction sync error:", error));

      // 3. Load Departments for Dropdown
      const deptQ = db.collection('settings_departments').orderBy('name');
      const unsubDept = deptQ.onSnapshot((snap) => {
         setDepartments(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });

      // 4. Load Roles for Dropdown
      const roleQ = db.collection('settings_roles').orderBy('name');
      const unsubRole = roleQ.onSnapshot((snap) => {
         setRoles(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });

      // 5. Load Branches for Dropdown
      const branchQ = db.collection('settings_branches').orderBy('name');
      const unsubBranch = branchQ.onSnapshot((snap) => {
         setBranches(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });
      
      // 6. Load Shifts for Dropdown
      const shiftQ = db.collection('settings_shifts').orderBy('name');
      const unsubShift = shiftQ.onSnapshot((snap) => {
         setShifts(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });

      return () => {
        unsubscribe();
        unsubscribeTrans();
        unsubDept();
        unsubRole();
        unsubBranch();
        unsubShift();
      };
    } else {
      // Demo Mode: Load from Local Storage or Mock
      const localEmps = localStorage.getItem('jk_demo_employees');
      if (localEmps) {
        setEmployees(JSON.parse(localEmps));
      } else {
        // Initial Mock Data
        setEmployees([
          { id: '1', name: 'Rahul Sharma', role: 'Senior Developer', department: 'IT', status: EmployeeStatus.Present, avatar: 'https://i.pravatar.cc/150?u=1' },
          { id: '2', name: 'Priya Patel', role: 'HR Manager', department: 'HR', status: EmployeeStatus.OnLeave, avatar: 'https://i.pravatar.cc/150?u=2' },
          { id: '3', name: 'Amit Singh', role: 'Sales Executive', department: 'Sales', status: EmployeeStatus.Late, avatar: 'https://i.pravatar.cc/150?u=3' },
        ]);
      }

      const localTrans = localStorage.getItem('jk_demo_transactions');
      if (localTrans) setTransactions(JSON.parse(localTrans));

      const loadList = (key: string, setter: any) => {
          const local = localStorage.getItem(key);
          if(local) {
             const parsed = JSON.parse(local);
             if (parsed.length > 0 && typeof parsed[0] === 'string') {
                 setter(parsed.map((s: string) => ({ id: s, name: s })));
             } else {
                 setter(parsed);
             }
          }
      }

      loadList('jk_demo_departments', setDepartments);
      loadList('jk_demo_roles', setRoles);
      loadList('jk_demo_branches', setBranches);
      loadList('jk_demo_shifts', setShifts);
    }
  }, []);

  // Filter Employees based on Search Query
  const filteredEmployees = useMemo(() => {
     if (!employeeSearchQuery.trim()) return employees;
     const query = employeeSearchQuery.toLowerCase();
     return employees.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.role.toLowerCase().includes(query) || 
        emp.department.toLowerCase().includes(query)
     );
  }, [employees, employeeSearchQuery]);

  const handleAddEmployee = async () => {
    if (!newEmployee.name) return;

    const empData = {
      ...newEmployee,
      role: newEmployee.role || (roles.length > 0 ? roles[0].name : 'Employee'),
      department: newEmployee.department || (departments.length > 0 ? departments[0].name : 'General'),
      branch: newEmployee.branch || (branches.length > 0 ? branches[0].name : 'Head Office'),
      shift: newEmployee.shift || (shifts.length > 0 ? shifts[0].name : 'General Shift'),
      avatar: `https://i.pravatar.cc/150?u=${Math.random()}`
    };

    if (isConfigured) {
      await db.collection('employees').add(empData);
    } else {
      const updatedEmps = [...employees, { ...empData, id: Date.now().toString() } as Employee];
      setEmployees(updatedEmps);
      localStorage.setItem('jk_demo_employees', JSON.stringify(updatedEmps));
    }
    setShowAddEmployeeModal(false);
    // Reset form
    setNewEmployee({ 
        name: '', role: '', department: '', branch: '', mobile: '', email: '', 
        joinDate: new Date().toISOString().split('T')[0], 
        status: EmployeeStatus.Present,
        workMode: 'Office',
        weeklyOff: 'Sunday',
        salary: { ctc: 0, basic: 0, hra: 0, allowances: 0, pfDeduction: false, esiDeduction: false, ptDeduction: false },
        leaves: { casual: 6, sick: 6, privilege: 15 }
    });
    setActiveModalTab('personal');
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.title || !newTransaction.amount) return;

    const transData = {
       ...newTransaction,
       amount: Number(newTransaction.amount) || 0 // Ensure number
    };

    if (isConfigured) {
       await db.collection('transactions').add(transData);
    } else {
       const updatedTrans = [{ ...transData, id: `TXN-${Date.now()}` } as Transaction, ...transactions];
       setTransactions(updatedTrans);
       localStorage.setItem('jk_demo_transactions', JSON.stringify(updatedTrans));
    }
    setShowAddTransactionModal(false);
    setNewTransaction({
       type: 'Expense',
       title: '',
       transactionNumber: '',
       amount: 0,
       category: 'Other',
       date: new Date().toISOString().split('T')[0],
       paymentMethod: 'Bank Transfer',
       status: 'Pending',
       description: ''
    });
  };

  const askHRFinance = async () => {
     setIsAnalyzingFinance(true);
     try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const financialContext = JSON.stringify(transactions.slice(0, 20)); // Send last 20 txns
        
        const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: `Analyze these financial transactions and provide 3 short, actionable insights for the business owner. Focus on spending patterns or saving opportunities. Data: ${financialContext}`,
           config: { systemInstruction: "You are a financial advisor for a small Indian business." }
        });
        setFinanceAIResponse(response.text || "No insights generated.");
     } catch (e) {
        setFinanceAIResponse("Failed to analyze data.");
     } finally {
        setIsAnalyzingFinance(false);
     }
  };

  // --- Render Helpers ---

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-30 transition-transform duration-300">
      <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold">JK</div>
        <span className="text-lg font-bold tracking-wide">JK BUDDY</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Main</p>
        {[
          { id: 'dashboard', icon: Icons.LayoutDashboard, label: 'Dashboard' },
          { id: 'employees', icon: Icons.Users, label: 'Employees' },
          { id: 'attendance', icon: Icons.CalendarCheck, label: 'Attendance' },
          { id: 'payroll', icon: Icons.BadgeIndianRupee, label: 'Payroll' },
          { id: 'finance', icon: Icons.Wallet, label: 'Finance & Expenses' },
          { id: 'field', icon: Icons.MapPin, label: 'Field Tracking' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === item.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">Tools</p>
        {[
           { id: 'employee_settings', icon: Icons.UserCog, label: 'Employee Setting' },
           { id: 'settings', icon: Icons.Settings, label: 'Site Setting' },
        ].map((item) => (
           <button
             key={item.id}
             onClick={() => setActiveTab(item.id)}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
               activeTab === item.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'
             }`}
           >
             <item.icon className="w-5 h-5" />
             <span className="font-medium">{item.label}</span>
           </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors">
          <Icons.LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Employees', value: employees.length, icon: Icons.Users, color: 'bg-blue-500' },
          { title: 'Present Today', value: employees.filter(e => e.status === EmployeeStatus.Present).length, icon: Icons.UserPlus, color: 'bg-green-500' },
          { title: 'On Leave', value: employees.filter(e => e.status === EmployeeStatus.OnLeave).length, icon: Icons.Coffee, color: 'bg-amber-500' },
          { title: 'Late Arrivals', value: employees.filter(e => e.status === EmployeeStatus.Late).length, icon: Icons.Clock, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</h3>
              </div>
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-opacity-20`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-lg text-slate-800 whitespace-nowrap">Employee Directory</h3>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="Search by name, role..." 
                   className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                   value={employeeSearchQuery}
                   onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                />
             </div>
             <button 
               onClick={() => setShowAddEmployeeModal(true)} 
               className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium whitespace-nowrap"
             >
               <Icons.Plus className="w-4 h-4" /> Add Employee
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{emp.role}</p>
                    <p className="text-xs text-slate-500">{emp.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === 'Present' ? 'bg-green-100 text-green-800' :
                      emp.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      emp.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-slate-400 hover:text-brand-600 transition-colors">
                      <Icons.MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                       No employees found matching "{employeeSearchQuery}"
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinance = () => {
     // Filter transactions
     const filteredTrans = financeFilter === 'All' 
        ? transactions 
        : transactions.filter(t => t.type === financeFilter);
     
     const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
     const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);

     return (
       <div className="space-y-6">
          <div className="flex justify-between items-end">
             <div>
                <h2 className="text-2xl font-bold text-gray-800">Finance & Expenses</h2>
                <p className="text-gray-500">Track income, office expenses, and net balance</p>
             </div>
             <button 
                onClick={() => setShowAddTransactionModal(true)}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:shadow-brand-600/30 transition-all flex items-center gap-2"
             >
                <Icons.Plus className="w-5 h-5" /> Add Transaction
             </button>
          </div>

          {/* Finance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Icons.ArrowUpCircle className="w-24 h-24 text-green-600" />
                </div>
                <p className="text-gray-500 font-medium text-sm">Total Income</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">₹{totalIncome.toLocaleString('en-IN')}</h3>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 w-fit px-2 py-1 rounded-lg">
                   <Icons.TrendingUp className="w-3 h-3" /> +12% this month
                </div>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Icons.ArrowDownCircle className="w-24 h-24 text-red-600" />
                </div>
                <p className="text-gray-500 font-medium text-sm">Total Expenses</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">₹{totalExpense.toLocaleString('en-IN')}</h3>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 w-fit px-2 py-1 rounded-lg">
                   <Icons.TrendingDown className="w-3 h-3" /> -5% this month
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Icons.Wallet className="w-24 h-24 text-brand-600" />
                </div>
                <p className="text-gray-500 font-medium text-sm">Net Balance</p>
                <h3 className={`text-3xl font-bold mt-2 ${(totalIncome - totalExpense) >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                  ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
                </h3>
                <div className="mt-4 bg-brand-50 w-fit p-2 rounded-lg text-brand-700 cursor-pointer hover:bg-brand-100 transition-colors">
                   <Icons.Wallet className="w-5 h-5" />
                </div>
             </div>
          </div>
          
          {/* Ask AI & Filters */}
          <div className="bg-gradient-to-r from-brand-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-600/20 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <Icons.Sparkles className="w-5 h-5 text-yellow-300" />
                   <h3 className="font-bold text-lg">Ask HR AI - Finance Insights</h3>
                </div>
                <p className="text-brand-100 text-sm leading-relaxed max-w-2xl">
                   {financeAIResponse || "Click the button to analyze your spending patterns, identify unnecessary expenses, and get personalized saving tips for your business."}
                </p>
             </div>
             <button 
               onClick={askHRFinance}
               disabled={isAnalyzingFinance}
               className="bg-white text-brand-700 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-sm whitespace-nowrap"
             >
                {isAnalyzingFinance ? "Analyzing..." : "Analyze Finances"}
             </button>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search transactions..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                   </div>
                   <select 
                      value={financeFilter}
                      onChange={(e) => setFinanceFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                   >
                      <option value="All">All Types</option>
                      <option value="Income">Income Only</option>
                      <option value="Expense">Expense Only</option>
                   </select>
                </div>
                <button className="text-gray-500 hover:text-brand-600 p-2 rounded-lg hover:bg-gray-100">
                   <Icons.Download className="w-5 h-5" />
                </button>
             </div>
             <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                   <tr>
                      <th className="px-6 py-3">Date & Ref</th>
                      <th className="px-6 py-3">Transaction</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredTrans.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors group">
                         <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="font-medium text-gray-900">{txn.date}</div>
                            {txn.transactionNumber && <div className="text-xs text-gray-400 font-mono mt-0.5">#{txn.transactionNumber}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{txn.title}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-xs text-gray-400">{txn.paymentMethod}</span>
                               {txn.description && (
                                  <span className="text-xs text-gray-400 truncate max-w-[150px]" title={txn.description}>• {txn.description}</span>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                               {txn.category}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                               txn.status === 'Completed' ? 'text-green-600' : 'text-amber-600'
                            }`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${txn.status === 'Completed' ? 'bg-green-600' : 'bg-amber-600'}`}></div>
                               {txn.status}
                            </span>
                         </td>
                         <td className={`px-6 py-4 text-right font-bold ${txn.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'Income' ? '+' : '-'} ₹{Number(txn.amount).toLocaleString('en-IN')}
                         </td>
                      </tr>
                   ))}
                   {filteredTrans.length === 0 && (
                      <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            No transactions found.
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {!isConfigured && activeTab !== 'settings' && (
         <div className="bg-amber-500 text-white text-center py-1 px-4 text-xs font-medium fixed top-0 w-full z-50 shadow-md">
            Demo Mode: Data is saved locally in your browser. Configure Firebase in Site Settings to sync with cloud.
         </div>
      )}

      {renderSidebar()}
      
      <div className="ml-64 p-8 pt-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
               {activeTab === 'dashboard' ? 'Dashboard Overview' : 
                activeTab === 'employees' ? 'Employee Management' :
                activeTab === 'finance' ? 'Finance & Expenses' :
                activeTab === 'settings' ? 'System Configuration' : 
                activeTab === 'employee_settings' ? 'Employee Configuration' :
                activeTab === 'field' ? 'Field Tracking' :
                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors relative">
                <Icons.Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                DF
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="fade-in-up">
           {activeTab === 'dashboard' && renderDashboardHome()}
           {activeTab === 'employees' && renderDashboardHome()} {/* Reusing list for now */}
           {activeTab === 'finance' && renderFinance()}
           {activeTab === 'settings' && <SiteSettingsSection />}
           {activeTab === 'employee_settings' && <EmployeeSettingsSection />}
           {activeTab === 'field' && <FieldTrackingSection employees={employees} />}
           
           {/* Placeholder for other tabs */}
           {!['dashboard', 'employees', 'finance', 'settings', 'employee_settings', 'field'].includes(activeTab) && (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                 <Icons.Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-gray-400">Under Construction</h3>
                 <p className="text-gray-400 mt-2">The {activeTab} module is coming soon.</p>
              </div>
           )}
        </div>
      </div>

      {/* New Add Employee Modal - Split Layout */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex overflow-hidden h-[600px]">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
               <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-brand-700 flex items-center gap-2">
                     <Icons.UserPlus className="w-5 h-5" /> Add New Staff
                  </h3>
               </div>
               <div className="flex-1 py-2">
                  {[
                     { id: 'personal', label: 'Personal Info', icon: Icons.Users },
                     { id: 'attendance', label: 'Attendance', icon: Icons.CalendarCheck },
                     { id: 'salary', label: 'Salary Details', icon: Icons.BadgeIndianRupee },
                     { id: 'leaves', label: 'Leaves & Policies', icon: Icons.Briefcase },
                  ].map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveModalTab(tab.id)}
                        className={`w-full text-left px-6 py-3.5 flex items-center gap-3 transition-colors ${
                           activeModalTab === tab.id 
                              ? 'bg-white text-brand-600 font-bold border-r-2 border-brand-600' 
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                     >
                        <tab.icon className={`w-4 h-4 ${activeModalTab === tab.id ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className="text-sm">{tab.label}</span>
                     </button>
                  ))}
               </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 flex flex-col">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                  <h3 className="text-lg font-bold text-gray-800">
                     {activeModalTab === 'personal' ? 'Personal Information' : 
                      activeModalTab === 'attendance' ? 'Attendance Configuration' :
                      activeModalTab === 'salary' ? 'Salary Structure' : 'Leaves & Policies'}
                  </h3>
                  <button onClick={() => setShowAddEmployeeModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><Icons.X /></button>
               </div>

               <div className="flex-1 p-8 overflow-y-auto bg-white">
                  {activeModalTab === 'personal' && (
                     <div className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
                              <input 
                                 type="text" 
                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                 placeholder="e.g. Rahul Verma"
                                 value={newEmployee.name}
                                 onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number <span className="text-red-500">*</span></label>
                              <input 
                                 type="text" 
                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                 placeholder="10-digit number"
                                 value={newEmployee.mobile}
                                 onChange={(e) => setNewEmployee({...newEmployee, mobile: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Role / Designation <span className="text-red-500">*</span></label>
                              {roles.length > 0 ? (
                                 <select 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                                   value={newEmployee.role}
                                   onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                                 >
                                    <option value="">Select Role</option>
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                 </select>
                              ) : (
                                 <input 
                                   type="text" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                   placeholder="e.g. Sales Manager"
                                   value={newEmployee.role}
                                   onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                                 />
                              )}
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                              {departments.length > 0 ? (
                                 <select 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                                   value={newEmployee.department}
                                   onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                                 >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                 </select>
                              ) : (
                                 <input 
                                   type="text" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                                   placeholder="e.g. Marketing"
                                   value={newEmployee.department}
                                   onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                                 />
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch</label>
                              {branches.length > 0 ? (
                                 <select 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                                   value={newEmployee.branch}
                                   onChange={(e) => setNewEmployee({...newEmployee, branch: e.target.value})}
                                 >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                 </select>
                              ) : (
                                 <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white">
                                    <option>Head Office</option>
                                    <option>Branch 1</option>
                                 </select>
                              )}
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Joining</label>
                              <input 
                                 type="date" 
                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                 value={newEmployee.joinDate}
                                 onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})}
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Official Email</label>
                           <input 
                              type="email" 
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                              placeholder="e.g. name@company.com"
                              value={newEmployee.email}
                              onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                           />
                        </div>
                     </div>
                  )}

                  {activeModalTab === 'attendance' && (
                     <div className="space-y-6 max-w-2xl">
                         <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-6 flex items-start gap-3">
                             <Icons.Clock className="w-5 h-5 shrink-0 mt-0.5" />
                             <p>Assigning a shift ensures attendance is marked correctly. Employees can request shift changes from their app.</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Shift</label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                                    value={newEmployee.shift}
                                    onChange={(e) => setNewEmployee({...newEmployee, shift: e.target.value})}
                                >
                                    {shifts.length > 0 ? (
                                        shifts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                    ) : (
                                        <option>General Shift (9 AM - 6 PM)</option>
                                    )}
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weekly Off</label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                                    value={newEmployee.weeklyOff}
                                    onChange={(e) => setNewEmployee({...newEmployee, weeklyOff: e.target.value})}
                                >
                                    <option>Sunday</option>
                                    <option>Saturday & Sunday</option>
                                    <option>Monday</option>
                                    <option>Rotational</option>
                                </select>
                             </div>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Work Mode & Location</label>
                             <div className="grid grid-cols-3 gap-4">
                                 {['Office', 'Field', 'Remote'].map((mode) => (
                                     <div 
                                        key={mode}
                                        onClick={() => setNewEmployee({...newEmployee, workMode: mode as any})}
                                        className={`p-4 border rounded-xl text-center cursor-pointer transition-all ${
                                            newEmployee.workMode === mode 
                                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' 
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                     >
                                         <div className="font-bold text-gray-800">{mode}</div>
                                         <p className="text-xs text-gray-500 mt-1">
                                            {mode === 'Office' ? 'Fixed Location' : mode === 'Field' ? 'GPS Tracking' : 'Anywhere'}
                                         </p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                  )}

                  {activeModalTab === 'salary' && (
                     <div className="space-y-6 max-w-2xl">
                         <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Annual CTC (₹)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                   placeholder="0"
                                   value={newEmployee.salary?.ctc || ''}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee, 
                                       salary: { ...newEmployee.salary!, ctc: parseFloat(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Basic Pay (₹)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                   placeholder="0"
                                   value={newEmployee.salary?.basic || ''}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee, 
                                       salary: { ...newEmployee.salary!, basic: parseFloat(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">HRA (₹)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                   placeholder="0"
                                   value={newEmployee.salary?.hra || ''}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee, 
                                       salary: { ...newEmployee.salary!, hra: parseFloat(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Allowances (₹)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                   placeholder="0"
                                   value={newEmployee.salary?.allowances || ''}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee, 
                                       salary: { ...newEmployee.salary!, allowances: parseFloat(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                         </div>

                         <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                             <h4 className="text-sm font-bold text-gray-800 mb-2">Statutory Deductions</h4>
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-brand-600 rounded"
                                    checked={newEmployee.salary?.pfDeduction || false}
                                    onChange={(e) => setNewEmployee({
                                        ...newEmployee,
                                        salary: { ...newEmployee.salary!, pfDeduction: e.target.checked }
                                    })}
                                 />
                                 <span className="text-sm text-gray-700">Deduct Provident Fund (PF)</span>
                             </label>
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-brand-600 rounded"
                                    checked={newEmployee.salary?.esiDeduction || false}
                                    onChange={(e) => setNewEmployee({
                                        ...newEmployee,
                                        salary: { ...newEmployee.salary!, esiDeduction: e.target.checked }
                                    })}
                                 />
                                 <span className="text-sm text-gray-700">Deduct ESI</span>
                             </label>
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-brand-600 rounded"
                                    checked={newEmployee.salary?.ptDeduction || false}
                                    onChange={(e) => setNewEmployee({
                                        ...newEmployee,
                                        salary: { ...newEmployee.salary!, ptDeduction: e.target.checked }
                                    })}
                                 />
                                 <span className="text-sm text-gray-700">Deduct Professional Tax (PT)</span>
                             </label>
                         </div>
                     </div>
                  )}

                  {activeModalTab === 'leaves' && (
                     <div className="space-y-6 max-w-2xl">
                         <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800 mb-6 flex items-start gap-3">
                             <Icons.Plane className="w-5 h-5 shrink-0 mt-0.5" />
                             <p>Define the yearly leave quota for this employee. Unused leaves can be carried forward based on company policy.</p>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Casual Leave (CL)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-700"
                                   value={newEmployee.leaves?.casual}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee,
                                       leaves: { ...newEmployee.leaves!, casual: parseInt(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sick Leave (SL)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-700"
                                   value={newEmployee.leaves?.sick}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee,
                                       leaves: { ...newEmployee.leaves!, sick: parseInt(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Privilege Leave (PL)</label>
                                <input 
                                   type="number" 
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-700"
                                   value={newEmployee.leaves?.privilege}
                                   onChange={(e) => setNewEmployee({
                                       ...newEmployee,
                                       leaves: { ...newEmployee.leaves!, privilege: parseInt(e.target.value) || 0 }
                                   })}
                                />
                             </div>
                         </div>
                     </div>
                  )}
               </div>

               <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                  <button onClick={() => setShowAddEmployeeModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleAddEmployee} className="px-8 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2">
                     <Icons.CheckCircle2 className="w-4 h-4" /> Save Staff
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Add Transaction</h3>
                <button onClick={() => setShowAddTransactionModal(false)} className="text-gray-400 hover:text-gray-600"><Icons.X /></button>
             </div>
             
             <div className="p-6 space-y-4">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                   <button 
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTransaction.type === 'Income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setNewTransaction({...newTransaction, type: 'Income'})}
                   >
                      <span className="flex items-center justify-center gap-2"><Icons.ArrowUpCircle className="w-4 h-4" /> Income</span>
                   </button>
                   <button 
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTransaction.type === 'Expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setNewTransaction({...newTransaction, type: 'Expense'})}
                   >
                      <span className="flex items-center justify-center gap-2"><Icons.ArrowDownCircle className="w-4 h-4" /> Expense</span>
                   </button>
                </div>

                <div className="space-y-4">
                   {/* Transaction Number */}
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Transaction Number (Ref ID)</label>
                      <input 
                         type="text" 
                         className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                         placeholder="e.g. TXN-2025-001"
                         value={newTransaction.transactionNumber || ''}
                         onChange={(e) => setNewTransaction({...newTransaction, transactionNumber: e.target.value})}
                      />
                   </div>

                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Transaction Title</label>
                      <input 
                         type="text" 
                         className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                         placeholder="e.g. Client Payment"
                         value={newTransaction.title}
                         onChange={(e) => setNewTransaction({...newTransaction, title: e.target.value})}
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                         <select 
                            className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 bg-white"
                            value={newTransaction.category}
                            onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                         >
                            <option>Sales</option>
                            <option>Salary</option>
                            <option>Rent</option>
                            <option>Marketing</option>
                            <option>Travel</option>
                            <option>Other</option>
                         </select>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                         <input 
                            type="date" 
                            className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20"
                            value={newTransaction.date}
                            onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Amount (₹)</label>
                      <input 
                         type="number" 
                         className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 text-lg font-bold text-gray-800"
                         placeholder="0.00"
                         value={newTransaction.amount || ''}
                         onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value) || 0})}
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Payment Method</label>
                          <select 
                             className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg bg-white"
                             value={newTransaction.paymentMethod}
                             onChange={(e) => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                          >
                             <option>Bank Transfer</option>
                             <option>Cash</option>
                             <option>UPI</option>
                             <option>Cheque</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                          <select 
                             className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg bg-white"
                             value={newTransaction.status}
                             onChange={(e) => setNewTransaction({...newTransaction, status: e.target.value as any})}
                          >
                             <option>Completed</option>
                             <option>Pending</option>
                             <option>Failed</option>
                          </select>
                       </div>
                   </div>

                   {/* Description */}
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                      <textarea 
                         className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none h-20"
                         placeholder="Add additional details here..."
                         value={newTransaction.description || ''}
                         onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      />
                   </div>
                </div>
             </div>

             <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button onClick={() => setShowAddTransactionModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button 
                  onClick={handleAddTransaction} 
                  className={`px-8 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all ${
                     newTransaction.type === 'Income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                   {newTransaction.type === 'Income' ? 'Record Income' : 'Record Expense'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
