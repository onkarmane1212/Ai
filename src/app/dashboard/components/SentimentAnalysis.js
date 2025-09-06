'use client';

import { FiThumbsUp, FiThumbsDown, FiMeh, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const SentimentAnalysis = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Sentiment Analysis</h3>
        <p className="text-gray-500">No sentiment data available at the moment.</p>
      </div>
    );
  }

  const parseSentimentPercentage = (str) => {
    if (!str) return 0;
    const match = String(str).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const sentimentBreakdown = data.sentiment_breakdown || {
    very_positive: '0%',
    positive: '0%',
    neutral: '0%',
    negative: '0%',
    very_negative: '0%'
  };

  const getSentimentColor = (type) => {
    switch (type) {
      case 'very_positive':
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
      case 'very_negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSentimentLabel = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Sentiment Analysis</h3>
        <div className="mt-2 md:mt-0 flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Overall:</span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {data.overall_sentiment || 'No sentiment data'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Sentiment Breakdown */}
        <div>
  <h4 className="text-lg font-medium text-gray-800 mb-3">Sentiment Breakdown</h4>
  <div className="space-y-3">
    {Object.entries(sentimentBreakdown).map(([key, value]) => {
      // Extract the first percentage in the string
      const match = value.match(/(\d+)%/);
      const percent = match ? parseInt(match[1]) : 0;

      // Decide bar color dynamically based on text
      let barColor = 'bg-yellow-500'; // default for neutral/mixed
      if (/positive/i.test(value)) barColor = 'bg-green-500';
      else if (/negative/i.test(value)) barColor = 'bg-red-500';

      return (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      );
    })}
  </div>
</div>



        {/* Sentiment Trends & Comments */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">Trends & Feedback</h4>

          {/* Trend Indicator */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              {data.sentiment_trends?.includes('increased') ? (
                <FiTrendingUp className="text-green-500 text-xl mr-2" />
              ) : data.sentiment_trends?.includes('decreased') ? (
                <FiTrendingDown className="text-red-500 text-xl mr-2" />
              ) : (
                <FiMeh className="text-yellow-500 text-xl mr-2" />
              )}
              <p className="text-sm text-gray-700">
                {data.sentiment_trends || 'No trend data available'}
              </p>
            </div>
          </div>

          {/* Top Comments */}
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-green-700 mb-2 flex items-center">
                <FiThumbsUp className="mr-1" /> Top Positive Comments
              </h5>
              <ul className="space-y-2 text-sm">
                {data.top_positive_comments?.slice(0, 2).map((comment, idx) => (
                  <li key={`pos-${idx}`} className="bg-green-50 p-3 rounded-lg">
                    {comment}
                  </li>
                )) || <li className="text-gray-500 text-sm">No positive comments available</li>}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-red-700 mb-2 flex items-center">
                <FiThumbsDown className="mr-1" /> Top Negative Comments
              </h5>
              <ul className="space-y-2 text-sm">
                {data.top_negative_comments?.slice(0, 2).map((comment, idx) => (
                  <li key={`neg-${idx}`} className="bg-red-50 p-3 rounded-lg">
                    {comment}
                  </li>
                )) || <li className="text-gray-500 text-sm">No negative comments available</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
