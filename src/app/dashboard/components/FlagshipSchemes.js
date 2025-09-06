'use client';

const FlagshipSchemes = ({ data }) => {
  if (!data) return null;
  
  // Extract percentage from the overall sentiment string
  const getSentimentPercentage = (sentiment) => {
    if (!sentiment) return '0';
    const match = sentiment.match(/\d+/);
    return match ? match[0] : '0';
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Flagship Schemes Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Sentiment */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">Overall Scheme Sentiment</h4>
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mb-4">
              <span className="text-2xl font-bold text-white">
                {getSentimentPercentage(data.overall_sentiment)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">Approval Rating</p>
          </div>
        </div>

        {/* SWOT Analysis */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-gray-800 mb-3">SWOT Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.swot_analysis ? (
              Object.entries(data.swot_analysis).map(([category, items]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 capitalize mb-2">{category}</h5>
                  <ul className="space-y-2">
                    {Array.isArray(items) ? (
                      items.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-xs mr-2">•</span>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No {category} data available</p>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No SWOT analysis data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Public Feedback */}
      <div className="mt-8">
  <h4 className="font-medium text-gray-800 mb-3">Public Feedback</h4>
  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
    <p className="text-sm text-gray-700">
      {data.public_feedback || "No public feedback data available"}
    </p>
  </div>
</div>

    </div>
  );
};

export default FlagshipSchemes;
