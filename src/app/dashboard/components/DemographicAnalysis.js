'use client';

const DemographicAnalysis = ({ data }) => (
  <div className="bg-white shadow rounded-xl p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">Demographic Analysis</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {/* Gender Based */}
<div className="border rounded-lg p-4">
  <h4 className="font-medium text-gray-800 mb-3">Gender Sentiment</h4>
  <div className="space-y-4">
    {Object.entries(data.gender_based).map(([gender, value]) => {
      // Find all percentages in the string
      const percentages = [...value.matchAll(/(\d+)%\s*(positive|negative|neutral)?/gi)];
      
      const positive = parseInt(
        percentages.find(([, , sentiment]) => sentiment?.toLowerCase() === "positive")?.[1] || 
        percentages[0]?.[1] || 0
      );

      const negative = parseInt(
        percentages.find(([, , sentiment]) => sentiment?.toLowerCase() === "negative")?.[1] || 0
      );

      return (
        <div key={gender}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize font-medium">{gender}</span>
            <span className="text-gray-600">
              {positive}% positive
              {negative > 0 && ` • ${negative}% negative`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${positive}%` }}
            ></div>
            {negative > 0 && (
              <div
                className="h-full bg-red-500 rounded-full absolute top-0"
                style={{
                  left: `${positive}%`,
                  width: `${negative}%`
                }}
              ></div>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>

{/* Age Group */}
<div className="border rounded-lg p-4">
  <h4 className="font-medium text-gray-800 mb-3">Age Group Sentiment</h4>
  <div className="space-y-4">
    {Object.entries(data.age_group).map(([age, value]) => {
      const match = value.match(/(\d+)%\s*positive/i);
      const positive = match ? parseInt(match[1]) : 0;

      return (
        <div key={age}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{age}</span>
            <span className="text-gray-600">{positive}% positive</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${positive}%` }}
            ></div>
          </div>
        </div>
      );
    })}
  </div>
</div>


      {/* Occupation */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Occupation Sentiment</h4>
        <div className="space-y-4">
          {Object.entries(data.occupation).map(([occupation, sentiment]) => (
            <div key={occupation}>
              <div className="flex justify-between text-sm">
                <span className="capitalize font-medium">{occupation.replace(/_/g, ' ')}</span>
                <span className="text-gray-600">
                  {sentiment}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ 
                    width: `${parseInt(sentiment) || 0}%`,
                    minWidth: '0.5rem' 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DemographicAnalysis;
