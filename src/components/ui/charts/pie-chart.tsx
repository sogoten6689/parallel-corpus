import React from 'react';

const PieChart: React.FC<{ data?: any; options?: any }> = ({ data, options }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
      <span className="text-gray-500 text-sm">Pie Chart Component</span>
    </div>
  );
};

export default PieChart; 