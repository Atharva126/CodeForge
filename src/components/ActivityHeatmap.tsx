import React from 'react';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  className?: string;
}

export default function ActivityHeatmap({ data, className = '' }: ActivityHeatmapProps) {
  // Get the color for a given count (LeetCode colors)
  const getColor = (count: number) => {
    if (count === 0) return '#161b22';
    if (count <= 2) return '#0e4429';
    if (count <= 4) return '#006d32';
    if (count <= 6) return '#26a641';
    if (count <= 8) return '#39d353';
    return '#40c463';
  };

  // Generate month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate the first day of the year
  const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
  const firstDayOfWeek = firstDayOfYear.getDay();

  // Create the calendar grid
  const calendarGrid = [];
  let currentWeek = Array(7).fill(null);
  
  // Add empty cells for the first week
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek[i] = null;
  }
  
  // Add all days to the grid
  data.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    // Add day to current week
    currentWeek[dayOfWeek] = day;
    
    // If week is complete, start new week
    if (dayOfWeek === 6) {
      calendarGrid.push([...currentWeek]);
      currentWeek = Array(7).fill(null);
    }
  });
  
  // Add the last week if it has data
  if (currentWeek.some(day => day !== null)) {
    calendarGrid.push(currentWeek);
  }

  return (
    <div className={`activity-heatmap ${className}`}>
      {/* Month labels */}
      <div className="flex justify-between mb-2 text-xs text-gray-500">
        {months.map((month, index) => (
          <div key={month} className="flex-1 text-center">
            {month}
          </div>
        ))}
      </div>
      
      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-gray-500">
        {weekdays.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="space-y-1">
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor: day ? getColor(day.count) : 'transparent',
                }}
                title={day ? `${day.date}: ${day.count} submissions` : ''}
              ></div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#161b22' }}></div>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#0e4429' }}></div>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#006d32' }}></div>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#26a641' }}></div>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#39d353' }}></div>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#40c463' }}></div>
          </div>
          <span>More</span>
        </div>
        <div className="text-xs text-gray-500">
          {data.reduce((sum, day) => sum + day.count, 0)} total submissions
        </div>
      </div>
    </div>
  );
}
