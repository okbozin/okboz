import React, { useState } from 'react';
import { Icons } from './Icons';

interface LandingPageProps {
    onAdminLogin: () => void;
    onEmployeeLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAdminLogin, onEmployeeLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-600/20">
                JK
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">JK BUDDY</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#solutions" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Solutions</a>
              <a href="#features" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Pricing</a>
              <a href="#about" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">About Us</a>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <button onClick={onEmployeeLogin} className="text-slate-600 font-medium hover:text-brand-600 px-4 py-2 border border-slate-200 rounded-lg transition-colors">
                 Employee Login
              </button>
              <button onClick={onAdminLogin} className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40 transform hover:-translate-y-0.5">
                Admin Dashboard
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4">
             <a href="#solutions" className="block text-slate-600 font-medium">Solutions</a>
             <a href="#features" className="block text-slate-600 font-medium">Features</a>
             <a href="#pricing" className="block text-slate-600 font-medium">Pricing</a>
             <div className="flex flex-col gap-2 pt-2">
                <button onClick={onEmployeeLogin} className="w-full border border-slate-200 text-slate-700 py-3 rounded-lg font-semibold">
                  Employee Login
                </button>
                <button onClick={onAdminLogin} className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold">
                  Admin Login
                </button>
             </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-100/50 rounded-full blur-3xl -z-10 opacity-60"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-50 text-brand-700 font-medium text-sm mb-8 border border-brand-100">
               <span className="flex h-2 w-2 rounded-full bg-brand-600 mr-2 animate-pulse"></span>
               Trusted by 10 Lakh+ Indian Businesses
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
              India's Smartest <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Employee Management</span> Platform
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Effortless attendance, automated payroll, and real-time field tracking. 
              Built specifically for Indian SMEs to eliminate paperwork and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button onClick={onAdminLogin} className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20">
                 Start Free Trial
               </button>
               <button onClick={onEmployeeLogin} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                 <Icons.Smartphone className="w-5 h-5" />
                 Open App
               </button>
            </div>
            
            {/* Hero Image Mockup */}
            <div className="mt-20 relative mx-auto max-w-5xl">
               <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl border-4 border-slate-800">
                  <img 
                    src="https://picsum.photos/1200/700?random=10" 
                    alt="Dashboard Preview" 
                    className="rounded-xl w-full h-auto opacity-90"
                  />
                  {/* Floating badges */}
                  <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block animate-bounce duration-[3000ms]">
                     <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                           <Icons.CheckCircle2 className="text-green-600 w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 font-medium">Attendance</p>
                           <p className="text-lg font-bold text-gray-900">Marked!</p>
                        </div>
                     </div>
                  </div>
                  <div className="absolute -right-8 bottom-1/3 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block animate-bounce duration-[4000ms]">
                     <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                           <Icons.BadgeIndianRupee className="text-blue-600 w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 font-medium">Salary Processed</p>
                           <p className="text-lg font-bold text-gray-900">₹ 12,45,000</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-brand-600 font-semibold tracking-wide uppercase text-sm">Powerful Features</h2>
            <h3 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Everything you need to manage your workforce</h3>
            <p className="mt-4 text-xl text-slate-500">From selfie attendance to one-click payroll, JK BUDDY handles the hard work so you can focus on growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow group">
               <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                 <Icons.Smartphone className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-3">Smart Attendance</h4>
               <p className="text-slate-600 leading-relaxed">
                 AI Face Recognition, Selfie with Geofencing, or QR Code. Let employees mark attendance from anywhere, securely.
               </p>
               <ul className="mt-6 space-y-3">
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Selfie Verification</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> GPS Geofencing</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Shift Scheduling</li>
               </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow group">
               <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                 <Icons.BadgeIndianRupee className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-3">Automated Payroll</h4>
               <p className="text-slate-600 leading-relaxed">
                 One-click salary calculation including PF, ESI, PT, and TDS. Generate professional payslips instantly.
               </p>
               <ul className="mt-6 space-y-3">
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Statutory Compliance</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Overtime & Fines</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Direct Bank Transfer</li>
               </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow group">
               <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                 <Icons.MapPin className="w-8 h-8" />
               </div>
               <h4 className="text-xl font-bold text-slate-900 mb-3">Live Field Tracking</h4>
               <p className="text-slate-600 leading-relaxed">
                 Know exactly where your field employees are. Track meetings, travel distance, and reimbursements in real-time.
               </p>
               <ul className="mt-6 space-y-3">
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Live GPS Tracking</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Meeting Logs</li>
                 <li className="flex items-center text-sm text-slate-500"><Icons.CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Travel Reports</li>
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* "Made for Bharat" Section */}
      <section className="py-20 bg-brand-600 text-white overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6">Built for Bharat <br/> No Small Business Left Behind</h2>
              <p className="text-brand-100 text-lg mb-8 leading-relaxed">
                63 million SMEs in India spend 7 hours/week on manual paperwork. JK BUDDY digitizes your operations so you can focus on your customers, not spreadsheets.
              </p>
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-white/20">
                    <h4 className="font-bold text-2xl">100%</h4>
                    <p className="text-sm text-brand-100">Safe & Secure</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur p-4 rounded-lg border border-white/20">
                    <h4 className="font-bold text-2xl">Auto</h4>
                    <p className="text-sm text-brand-100">Data Backups</p>
                 </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
               <img src="https://picsum.photos/500/500?grayscale&blur=2" alt="Indian Small Business" className="rounded-2xl shadow-2xl border-8 border-white/20 mix-blend-overlay opacity-80" />
            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-slate-500">Pay only for what you need. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {/* Plan 1 */}
             <div className="border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-slate-900">JK Attendance Lite</h3>
                <div className="my-4">
                   <span className="text-4xl font-bold text-brand-600">₹25</span>
                   <span className="text-slate-500 text-sm"> /emp/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">Simplified attendance via Selfie, GPS & QR.</p>
                <button onClick={onAdminLogin} className="w-full py-2 border border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50">Choose Plan</button>
             </div>

             {/* Plan 2 */}
             <div className="border-2 border-brand-600 rounded-2xl p-6 shadow-xl relative bg-brand-50/30">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-3 py-0.5 rounded-full text-xs font-bold tracking-wide">MOST POPULAR</div>
                <h3 className="text-lg font-bold text-slate-900">JK Payroll Pro</h3>
                <div className="my-4">
                   <span className="text-4xl font-bold text-brand-600">₹35</span>
                   <span className="text-slate-500 text-sm"> /emp/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">Full payroll automation, compliance & slips.</p>
                <button onClick={onAdminLogin} className="w-full py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Choose Plan</button>
             </div>

             {/* Plan 3 */}
             <div className="border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-slate-900">JK Locate</h3>
                <div className="my-4">
                   <span className="text-4xl font-bold text-brand-600">₹100</span>
                   <span className="text-slate-500 text-sm"> /emp/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">Real-time location tracking for field force.</p>
                <button onClick={onAdminLogin} className="w-full py-2 border border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50">Choose Plan</button>
             </div>

             {/* Plan 4 */}
             <div className="border border-slate-200 rounded-2xl p-6 hover:border-brand-500 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-slate-900">JK CRM Lite</h3>
                <div className="my-4">
                   <span className="text-4xl font-bold text-brand-600">₹250</span>
                   <span className="text-slate-500 text-sm"> /emp/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">Field trips, meetings, and expense management.</p>
                <button onClick={onAdminLogin} className="w-full py-2 border border-brand-600 text-brand-600 rounded-lg font-medium hover:bg-brand-50">Choose Plan</button>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-1">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">JK</div>
                    <span className="text-xl font-bold text-white">JK BUDDY</span>
                 </div>
                 <p className="text-sm leading-relaxed opacity-80">
                   Employee Management Simplified. Made with ❤️ in India.
                 </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-brand-400">Attendance</a></li>
                  <li><a href="#" className="hover:text-brand-400">Payroll</a></li>
                  <li><a href="#" className="hover:text-brand-400">Track</a></li>
                  <li><a href="#" className="hover:text-brand-400">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-brand-400">Help Center</a></li>
                  <li><a href="#" className="hover:text-brand-400">Contact Us</a></li>
                  <li><a href="#" className="hover:text-brand-400">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-brand-400">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Contact</h4>
                <p className="text-sm mb-2">sales@jkbuddy.in</p>
                <p className="text-sm">+91 98765 43210</p>
                <div className="flex space-x-4 mt-4">
                   {/* Social Placeholders */}
                   <div className="w-8 h-8 bg-slate-700 rounded-full hover:bg-brand-600 cursor-pointer"></div>
                   <div className="w-8 h-8 bg-slate-700 rounded-full hover:bg-brand-600 cursor-pointer"></div>
                   <div className="w-8 h-8 bg-slate-700 rounded-full hover:bg-brand-600 cursor-pointer"></div>
                </div>
              </div>
           </div>
           <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs opacity-50">
              &copy; {new Date().getFullYear()} JK BUDDY Technologies Pvt Ltd. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};