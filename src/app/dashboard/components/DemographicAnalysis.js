'use client';

const DemographicAnalysis = ({ data = {} }) => {
  // Safely extract data with defaults
  const genderData = data?.gender_based || {};
  const ageGroupData = data?.age_group || {};
  const occupationData = data?.occupation || {};

  // Helper function to safely render sentiment value
  const renderSentimentValue = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return `${value}%`;
    if (value && typeof value === 'object') {
      // Handle nested objects (like last_week, monthly, quarterly)
      if (value.last_week || value.monthly || value.quarterly) {
        return (
          <div className="text-xs space-y-1">
            {value.last_week && <div>Last Week: {value.last_week}</div>}
            {value.monthly && <div>Monthly: {value.monthly}</div>}
            {value.quarterly && <div>Quarterly: {value.quarterly}</div>}
          </div>
        );
      }
      // Handle objects with multiple keys (like sentiment topics)
      if (Object.keys(value).length > 0) {
        return (
          <div className="text-xs space-y-1">
            {Object.entries(value).slice(0, 3).map(([key, val]) => (
              <div key={key} className="truncate">
                <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(val)}
              </div>
            ))}
            {Object.keys(value).length > 3 && (
              <div className="text-gray-400">+{Object.keys(value).length - 3} more...</div>
            )}
          </div>
        );
      }
      // Fallback for other object types - safely stringify
      try {
        return JSON.stringify(value);
      } catch (e) {
        return 'Complex data';
      }
    }
    return 'N/A';
  };

  // Helper function to extract percentage from value
  const extractPercentage = (value) => {
    if (typeof value === 'string') {
      const match = value.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') {
      if (value?.last_week) return extractPercentage(value.last_week);
      if (value?.last_7_days) return extractPercentage(value.last_7_days);
      if (value?.monthly) return extractPercentage(value.monthly);
      if (value?.last_30_days) return extractPercentage(value.last_30_days);
      if (value?.quarterly) return extractPercentage(value.quarterly);
      
      // For objects with multiple sentiment topics, calculate average or use first numeric value
      const entries = Object.entries(value);
      if (entries.length > 0) {
        const numericValues = entries
          .map(([_, val]) => extractPercentage(val))
          .filter(val => val > 0);
        
        if (numericValues.length > 0) {
          return Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length);
        }
      }
    }
    return 0;
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Demographic Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gender Based */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Gender Sentiment</h4>
          {Object.keys(genderData).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(genderData).map(([gender, value]) => {
                const percentage = extractPercentage(value);
                return (
                  <div key={gender}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{gender}</span>
                      <span className="text-gray-600">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {renderSentimentValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No gender sentiment data available</p>
          )}
        </div>

        {/* Age Group */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Age Group Sentiment</h4>
          {Object.keys(ageGroupData).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(ageGroupData).map(([age, value]) => {
                const percentage = extractPercentage(value);
                return (
                  <div key={age}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{age}</span>
                      <span className="text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {renderSentimentValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No age group sentiment data available</p>
          )}
        </div>

        {/* Occupation */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Occupation Sentiment</h4>
          {Object.keys(occupationData).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(occupationData).map(([occupation, value]) => {
                const percentage = extractPercentage(value);
                return (
                  <div key={occupation}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{occupation.replace(/_/g, ' ')}</span>
                      <span className="text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          minWidth: '0.5rem' 
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {renderSentimentValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No occupation sentiment data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemographicAnalysis;