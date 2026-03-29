export const getTimeAgo = (dateString: string, language: 'en' | 'ar' = 'en'): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  if (language === 'ar') {
    if (seconds < 60) return 'منذ لحظات';
    
    const minutes = Math.floor(seconds / intervals.minute);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    
    const hours = Math.floor(seconds / intervals.hour);
    if (hours < 24) return `منذ ${hours} ساعة`;
    
    const days = Math.floor(seconds / intervals.day);
    if (days < 7) return `منذ ${days} يوم`;
    
    const weeks = Math.floor(seconds / intervals.week);
    if (weeks < 4) return `منذ ${weeks} أسبوع`;
    
    const months = Math.floor(seconds / intervals.month);
    if (months < 12) return `منذ ${months} شهر`;
    
    const years = Math.floor(seconds / intervals.year);
    return `منذ ${years} سنة`;
  } else {
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / intervals.minute);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(seconds / intervals.hour);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(seconds / intervals.day);
    if (days < 7) return `${days}d ago`;
    
    const weeks = Math.floor(seconds / intervals.week);
    if (weeks < 4) return `${weeks}w ago`;
    
    const months = Math.floor(seconds / intervals.month);
    if (months < 12) return `${months}mo ago`;
    
    const years = Math.floor(seconds / intervals.year);
    return `${years}y ago`;
  }
};
