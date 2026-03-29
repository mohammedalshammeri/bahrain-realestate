
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
  className?: string;
  showSeconds?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onExpire, 
  className = "",
  showSeconds = true 
}) => {
  const { language } = useLanguage();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    
    if (initial.isExpired) {
        if (onExpire) onExpire();
        return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining.isExpired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const isArabic = language === 'ar';

  if (timeLeft.isExpired) {
    return (
      <span className="text-red-500 font-bold">
        {isArabic ? 'منتهي' : 'Expired'}
      </span>
    );
  }

  // Use clear words instead of single-letter symbols
  const dayLabel = isArabic ? 'يوم' : 'days';
  const hourLabel = isArabic ? 'ساعة' : 'hours';
  const minuteLabel = isArabic ? 'دقيقة' : 'minutes';
  const secondLabel = isArabic ? 'ثانية' : 'seconds';

  return (
    <div
      className={`flex items-center justify-center gap-1 text-xs font-medium ${className}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="flex items-baseline gap-[1px]">
        <span className="font-bold text-gray-900 dark:text-white text-sm">{timeLeft.days}</span>
        <span className="text-[10px] text-gray-500">{dayLabel}</span>
      </div>
      <span className="text-gray-300">:</span>
      <div className="flex items-baseline gap-[1px]">
        <span className="font-bold text-gray-900 dark:text-white text-sm">
          {timeLeft.hours.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-gray-500">{hourLabel}</span>
      </div>
      <span className="text-gray-300">:</span>
      <div className="flex items-baseline gap-[1px]">
        <span className="font-bold text-gray-900 dark:text-white text-sm">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-gray-500">{minuteLabel}</span>
      </div>
      {showSeconds && (
        <>
          <span className="text-gray-300">:</span>
          <div className="flex items-baseline gap-[1px]">
            <span className="font-bold text-red-600 dark:text-red-400 text-sm">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-500">{secondLabel}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CountdownTimer;
