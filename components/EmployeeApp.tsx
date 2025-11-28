
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { EmployeeStatus } from '../types';

export const EmployeeApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'payroll' | 'profile'>('home');
  
  // Persistent State for Punch In/Out
  const [punchStartTime, setPunchStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('jk_emp_punch_start');
    return saved ? parseInt(saved) : null;
  });

  const [history, setHistory] = useState<{date: number, status: string, month: number}[]>(() => {
     const saved = localStorage.getItem('jk_emp_history');
     return saved ? JSON.parse(saved) : [];
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<string>('Fetching location...');
  const [showConfetti, setShowConfetti] = useState(false);
  const [workDuration, setWorkDuration] = useState("00:00:00");

  const isPunchedIn = !!punchStartTime;

  // Clock & Work Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate Work Duration if Punched In
      if (punchStartTime) {
        const diff = now.getTime() - punchStartTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setWorkDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
         setWorkDuration("00:00:00");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [punchStartTime]);

  // Simulate Location Fetching
  useEffect(() => {
    if (activeTab === 'home') {
      setTimeout(() => {
        setLocation('123, Tech Park, Bangalore (Accuracy: 15m)');
      }, 1500);
    }
  }, [activeTab]);

  const handlePunch = () => {
    if (isPunchedIn) {
      // PUNCH OUT logic
      if (window.confirm("Are you sure you want to punch out for the day?")) {
        // Save to History
        const today = new Date();
        const newEntry = { 
           date: today.getDate(), 
           month: today.getMonth(),
           status: 'Present' 
        };
        const updatedHistory = [...history, newEntry];
        setHistory(updatedHistory);
        localStorage.setItem('jk_emp_history', JSON.stringify(updatedHistory));

        // Clear State
        localStorage.removeItem('jk_emp_punch_start');
        setPunchStartTime(null);
      }
    } else {
      // PUNCH IN logic
      const now = Date.now();
      localStorage.setItem('jk_emp_punch_start', now.toString());
      setPunchStartTime(now);
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-brand-600' : 'text-gray-400'}`}
      >
        <Icons.Fingerprint className="w-6 h-6" />
        <span className="text-[10px] font-medium">Punch</span>
      </button>
      <button 
        onClick={() => setActiveTab('calendar')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-brand-600' : 'text-gray-400'}`}
      >
        <Icons.CalendarDays className="w-6 h-6" />
        <span className="text-[10px] font-medium">Calendar</span>
      </button>
      <div className="w-12"></div> {/* Spacer for Floating Action Button if needed, or just visual balance */}
      <button 
        onClick={() => setActiveTab('payroll')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'payroll' ? 'text-brand-600' : 'text-gray-400'}`}
      >
        <Icons.FileText className="w-6 h-6" />
        <span className="text-[10px] font-medium">Payslip</span>
      </button>
      <button 
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-brand-600' : 'text-gray-400'}`}
      >
        <Icons.Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </div>
  );

  const HomeTab = () => (
    <div className="p-6 flex flex-col items-center pt-10 pb-24">
      {/* Date Header */}
      <div className="text-center mb-8">
        <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-5xl font-bold text-gray-800 mt-2 font-mono tabular-nums">
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/AM|PM/, '')}
          <span className="text-lg text-gray-400 ml-1">{currentTime.toLocaleTimeString('en-US', { hour12: true }).slice(-2)}</span>
        </h1>
      </div>

      {/* Punch Circle */}
      <div className="relative mb-10">
        {showConfetti && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
           </div>
        )}
        <button 
          onClick={handlePunch}
          className={`w-64 h-64 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 border-8 ${
            isPunchedIn 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-500 shadow-red-200' 
              : 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-500 shadow-brand-200'
          }`}
        >
          <div className={`p-4 rounded-full mb-3 ${isPunchedIn ? 'bg-red-500 text-white' : 'bg-brand-600 text-white'}`}>
             <Icons.Fingerprint className="w-10 h-10" />
          </div>
          <span className={`text-2xl font-bold ${isPunchedIn ? 'text-red-700' : 'text-brand-800'}`}>
            {isPunchedIn ? 'Punch Out' : 'Punch In'}
          </span>
          {isPunchedIn && punchStartTime && (
            <span className="text-sm text-red-600 mt-2 font-medium animate-pulse">
               Recording...
            </span>
          )}
        </button>
      </div>

      {/* Location Card */}
      <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
         <div className="p-2 bg-white rounded-lg shadow-sm text-brand-600">
            <Icons.MapPin className="w-5 h-5" />
         </div>
         <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase">Current Location</h4>
            <p className="text-sm text-gray-800 font-medium mt-1 leading-snug">{location}</p>
         </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Icons.Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Work Hrs</span>
             </div>
             <p className="text-xl font-bold text-blue-900 font-mono">{workDuration}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
             <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Icons.Briefcase className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Status</span>
             </div>
             <p className="text-xl font-bold text-purple-900">
               {isPunchedIn ? 'Active' : 'Inactive'}
             </p>
          </div>
      </div>
    </div>
  );

  const CalendarTab = () => {
    // Current Month View
    const today = new Date();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    
    // Generate days 1..30/31
    const days = Array.from({ length: daysInMonth }, (_, i) => {
       const dateNum = i + 1;
       // Find if we have history for this date
       const entry = history.find(h => h.date === dateNum && h.month === currentMonth);
       return { 
         date: dateNum, 
         status: entry ? entry.status : 'Empty' // Default to Empty if no record
       };
    });

    const presentCount = history.filter(h => h.month === currentMonth && h.status === 'Present').length;

    return (
      <div className="p-6 pt-8 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Log</h2>
        
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
           <button className="p-2 hover:bg-gray-50 rounded-lg"><Icons.ChevronRight className="w-5 h-5 rotate-180 text-gray-500" /></button>
           <span className="font-bold text-gray-800">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
           <button className="p-2 hover:bg-gray-50 rounded-lg"><Icons.ChevronRight className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Stats Summary */}
        <div className="flex justify-between mb-8 px-2">
           <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
              <span className="text-xs text-gray-500">Present</span>
              <p className="font-bold text-gray-800">{presentCount}</p>
           </div>
           <div className="text-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-1"></div>
              <span className="text-xs text-gray-500">Late</span>
              <p className="font-bold text-gray-800">0</p>
           </div>
           <div className="text-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
              <span className="text-xs text-gray-500">Absent</span>
              <p className="font-bold text-gray-800">0</p>
           </div>
           <div className="text-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto mb-1"></div>
              <span className="text-xs text-gray-500">Pending</span>
              <p className="font-bold text-gray-800">{daysInMonth - presentCount}</p>
           </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 mb-4">
           {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
           {days.map((day, i) => (
             <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium border ${
                   day.status === 'Present' ? 'bg-green-50 border-green-200 text-green-700' :
                   day.status === 'Empty' ? 'bg-white border-gray-100 text-gray-300' :
                   'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                   {day.date}
                </div>
                {day.status !== 'Empty' && (
                  <div className={`w-1.5 h-1.5 rounded-full ${
                      day.status === 'Present' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                )}
             </div>
           ))}
        </div>
      </div>
    );
  };

  const PayrollTab = () => (
    <div className="p-6 pt-8 pb-24">
       <h2 className="text-2xl font-bold text-gray-900 mb-6">Salary Slips</h2>
       
       <div className="space-y-4">
          {[
            { month: 'October 2025', amount: '22,500', status: 'Paid', date: '01 Nov 2025' },
          ].map((slip, i) => (
             <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                   {slip.status}
                </div>
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="font-bold text-gray-800">{slip.month}</h3>
                      <p className="text-xs text-gray-500 mt-1">Credited on {slip.date}</p>
                   </div>
                   <div className="bg-gray-50 p-2 rounded-lg text-brand-600">
                      <Icons.BadgeIndianRupee className="w-6 h-6" />
                   </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                   <div>
                      <p className="text-xs text-gray-500">Net Salary</p>
                      <p className="text-xl font-bold text-gray-900">₹ {slip.amount}</p>
                   </div>
                   <button className="flex items-center gap-2 text-sm text-brand-600 font-medium bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                      <Icons.Download className="w-4 h-4" /> Download
                   </button>
                </div>
             </div>
          ))}
          <p className="text-center text-sm text-gray-400 mt-8">Past slips are archived automatically.</p>
       </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="p-6 pt-8 pb-24">
       <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4 overflow-hidden">
             <img src="https://picsum.photos/200/200?random=1" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Rajesh Kumar</h2>
          <p className="text-gray-500">Sales Executive • ID: JK0024</p>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.UserPlus className="w-5 h-5" /></div>
                <span className="font-medium text-gray-700">Personal Details</span>
             </div>
             <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Icons.Settings className="w-5 h-5" /></div>
                <span className="font-medium text-gray-700">App Settings</span>
             </div>
             <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Icons.ShieldCheck className="w-5 h-5" /></div>
                <span className="font-medium text-gray-700">Privacy & Policy</span>
             </div>
             <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={onLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left group"
          >
             <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100"><Icons.LogOut className="w-5 h-5" /></div>
                <span className="font-medium text-red-600">Logout</span>
             </div>
          </button>
       </div>
       
       <p className="text-center text-xs text-gray-400 mt-8">Version 2.4.0 • JK BUDDY</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="bg-brand-600 text-white p-4 pt-8 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="font-bold">JK</span>
           </div>
           <span className="font-semibold tracking-wide">JK BUDDY</span>
        </div>
        <button className="relative p-2">
           <Icons.Bell className="w-5 h-5" />
           <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-brand-600"></span>
        </button>
      </div>

      {activeTab === 'home' && <HomeTab />}
      {activeTab === 'calendar' && <CalendarTab />}
      {activeTab === 'payroll' && <PayrollTab />}
      {activeTab === 'profile' && <ProfileTab />}

      <MobileNav />
    </div>
  );
};
