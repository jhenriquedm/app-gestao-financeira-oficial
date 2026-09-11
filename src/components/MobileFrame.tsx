import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  Signal, 
  Maximize2, 
  Check 
} from 'lucide-react';

export type DevicePreset = 'iphone' | 'galaxy' | 'compact' | 'fullscreen';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
}) => {
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('iphone');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isNativeMobile, setIsNativeMobile] = useState(false);

  // Detect real mobile screen or installed standalone PWA
  useEffect(() => {
    const checkNativeMobile = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isNarrow = window.innerWidth <= 640;
      if (isStandalone || isNarrow) {
        setIsNativeMobile(true);
        setDevicePreset('fullscreen');
      } else {
        setIsNativeMobile(false);
      }
    };
    checkNativeMobile();
    window.addEventListener('resize', checkNativeMobile);
    return () => window.removeEventListener('resize', checkNativeMobile);
  }, []);

  // Real-time clock for the mobile status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const deviceDimensions = {
    iphone: { width: '396px', height: 'min(810px, calc(100vh - 70px))', radius: 'rounded-[42px]', bezel: 'p-2.5', name: 'iPhone 16 Pro' },
    galaxy: { width: '412px', height: 'min(820px, calc(100vh - 70px))', radius: 'rounded-[38px]', bezel: 'p-2.5', name: 'Galaxy S24' },
    compact: { width: '370px', height: 'min(700px, calc(100vh - 70px))', radius: 'rounded-[34px]', bezel: 'p-2', name: 'Mobile Compacto' },
    fullscreen: { width: '100%', height: '100%', radius: 'rounded-none', bezel: 'p-0', name: 'Tela Cheia' },
  };

  const currentDev = deviceDimensions[devicePreset];

  return (
    <div id="simulator-wrapper" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center">
      
      {/* Top Device Simulator Control Bar - Hidden on real mobile devices / installed PWA */}
      {!isNativeMobile && (
        <div 
          id="simulator-controls-bar" 
          className="w-full bg-neutral-900/90 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md text-xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-200">Modo Celular</span>
              <span className="hidden sm:inline text-neutral-400 ml-1.5">• Simulador Mobile Ativo</span>
            </div>
          </div>

          {/* Device Switcher */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              id="btn-preset-iphone"
              onClick={() => setDevicePreset('iphone')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                devicePreset === 'iphone'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>iPhone 16</span>
              {devicePreset === 'iphone' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              id="btn-preset-galaxy"
              onClick={() => setDevicePreset('galaxy')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                devicePreset === 'galaxy'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Galaxy S24</span>
              {devicePreset === 'galaxy' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              id="btn-preset-compact"
              onClick={() => setDevicePreset('compact')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                devicePreset === 'compact'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Compacto</span>
              {devicePreset === 'compact' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>

            <button
              id="btn-preset-fullscreen"
              onClick={() => setDevicePreset('fullscreen')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                devicePreset === 'fullscreen'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Tela Cheia</span>
            </button>
          </div>

          {/* Status indicator */}
          <div className="hidden lg:flex items-center gap-2 text-neutral-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Interativo • Clique e role como em um celular real</span>
          </div>
        </div>
      )}

      {/* Main Simulator Presentation Stage */}
      <div className={`flex-1 w-full flex items-center justify-center ${devicePreset === 'fullscreen' ? 'p-0' : 'p-3 sm:p-6 lg:p-8'}`}>
        
        {devicePreset === 'fullscreen' ? (
          /* Fullscreen Mobile View (e.g. when embedded on actual phone or toggled) */
          <div className="w-full max-w-md mx-auto h-screen h-[100dvh] max-h-[100dvh] bg-neutral-100 dark:bg-neutral-950 flex flex-col shadow-2xl relative overflow-hidden isolate transform-gpu transition-colors">
            {children}
          </div>
        ) : (
          /* Smartphone Hardware Chassis */
          <div
            id="smartphone-chassis"
            style={{ width: currentDev.width, height: currentDev.height }}
            className={`relative bg-neutral-900 ring-1 ring-neutral-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ${currentDev.radius} ${currentDev.bezel} transition-all duration-300 flex flex-col`}
          >
            {/* Outer Rim Details (Volume / Power buttons visual accents) */}
            <div className="absolute -left-[3px] top-24 w-[3px] h-10 bg-neutral-700 rounded-l-sm" />
            <div className="absolute -left-[3px] top-38 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
            <div className="absolute -left-[3px] top-54 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
            <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-neutral-700 rounded-r-sm" />

            {/* Inner Phone Screen - Sandboxed with transform-gpu & isolate for modal containment */}
            <div 
              id="smartphone-screen" 
              className="w-full h-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden flex flex-col relative rounded-[36px] select-none transform-gpu isolate transition-colors"
            >
              
              {/* Native Mobile Status Bar */}
              <div 
                id="mobile-status-bar" 
                className="w-full bg-neutral-900 text-white px-5 pt-2 pb-1 flex items-center justify-between z-40 shrink-0 select-none text-[11px] font-semibold tracking-tight"
              >
                {/* Left: Clock */}
                <span>{currentTime}</span>

                {/* Center: Dynamic Island / Camera Notch */}
                <div 
                  id="mobile-dynamic-island"
                  className="w-20 h-4.5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-xs transition-all hover:w-24 cursor-default"
                >
                  <div className="w-2 h-2 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-950/80" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Microfone ativo" />
                </div>

                {/* Right: Cellular, Wifi, Battery */}
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9.5px] text-neutral-300">98%</span>
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Children (App Content with fixed bottom nav and scrollable internal viewport) */}
              <div id="smartphone-content-scroll" className="flex-1 flex flex-col relative overflow-hidden">
                {children}
              </div>

              {/* Home Indicator Bar (Swipe Bar) */}
              <div 
                id="mobile-home-indicator" 
                className="w-full bg-white/95 dark:bg-neutral-900/95 pb-1.5 pt-0.5 flex justify-center items-center shrink-0 z-30 pointer-events-none transition-colors"
              >
                <div className="w-28 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
