'use client';

import { FiMessageSquare, FiTrendingUp, FiUsers } from 'react-icons/fi';

const PartyWorkerSentiment = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Party Worker Sentiment</h3>
        <p className="text-gray-500">No party worker data available at the moment.</p>
      </div>
    );
  }

  // Safely extract percentage values with fallbacks
  const extractPercentage = (str) => {
    if (!str) return 0;
    const match = String(str).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const moralePercentage = extractPercentage(data.internal_morale);
  const growthPercentage = extractPercentage(data.participation_trend);
  
  // Format participation trend text
  const formatTrendText = (trend) => {
    if (!trend) return '';
    const parts = trend.split(',');
    return parts.length > 1 ? parts[1].trim() : trend.trim();
  };

  // Get feedback items safely
  const feedbackItems = Array.isArray(data.worker_feedback) 
    ? data.worker_feedback 
    : [];

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Party Worker Sentiment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Morale */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <FiUsers className="text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-800">Internal Morale</h4>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {moralePercentage}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, moralePercentage)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {data.internal_morale || 'Satisfaction rate among active workers'}
          </p>
        </div>

        {/* Participation */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <FiTrendingUp className="text-green-600" />
            </div>
            <h4 className="font-medium text-gray-800">Participation Trend</h4>
          </div>
          <div className="flex items-baseline mb-2">
            <span className="text-2xl font-bold text-green-600">
              {growthPercentage > 0 ? '+' : ''}{growthPercentage}%
            </span>
            <span className="ml-2 text-sm text-gray-600">
              {data.participation_trend?.includes('membership') 
                ? 'growth in active membership' 
                : 'participation change'}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${growthPercentage >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
              style={{ width: `${Math.min(100, Math.abs(growthPercentage))}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {formatTrendText(data.participation_trend) || 'Trend data not available'}
          </p>
        </div>

        {/* Feedback */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <FiMessageSquare className="text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-800">Top Feedback</h4>
          </div>
          
          {feedbackItems.length > 0 ? (
            <>
              <ul className="space-y-2">
                {feedbackItems.slice(0, 10).map((feedback, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                      <FiMessageSquare className="text-blue-600 text-xs" />
                    </div>
                    <p className="text-sm text-gray-700">{feedback}</p>
                  </li>
                ))}
              </ul>
              {feedbackItems.length > 10 && (
                <p className="text-xs text-blue-600 mt-2">
                  +{feedbackItems.length - 10} more feedback items
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No feedback available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyWorkerSentiment;
