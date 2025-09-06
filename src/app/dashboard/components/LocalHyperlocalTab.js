'use client';

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiMapPin, FiTrendingUp, FiActivity, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

const LocalHyperlocalTab = ({ query }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/localAndHyperlocal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch local/hyperlocal data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching local/hyperlocal data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading local/hyperlocal data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No data available. Try searching for a location.</p>
      </div>
    );
  }

  const renderIssues = (issues, type) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        {type === 'local' ? (
          <>
            <FiMapPin className="mr-2 text-blue-500" />
            Local Issues
          </>
        ) : (
          <>
            <FiActivity className="mr-2 text-green-500" />
            Hyperlocal Issues
          </>
        )}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues?.map((issue, index) => (
          <div key={`${type}-${index}`} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                {issue.sentiment === 'positive' ? (
                  <FiThumbsUp className="h-5 w-5 text-green-500" />
                ) : issue.sentiment === 'negative' ? (
                  <FiThumbsDown className="h-5 w-5 text-red-500" />
                ) : (
                  <FiTrendingUp className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-900">{issue.region}</h4>
                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {issue.impact_level}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{issue.issue}</p>
                {issue.suggested_interventions?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500">Suggested Actions:</p>
                    <ul className="mt-1 space-y-1">
                      {issue.suggested_interventions.map((action, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start">
                          <span className="mr-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Local & Hyperlocal Insights</h2>
        <p className="text-sm text-gray-600 mb-6">
          Analysis of local and hyperlocal issues for {query}. This data helps understand ground-level concerns and opportunities.
        </p>
      </div>

      {data.local_hyperlocal_issues?.local_issues?.length > 0 && (
        <div className="mb-8">
          {renderIssues(data.local_hyperlocal_issues.local_issues, 'local')}
        </div>
      )}

      {data.local_hyperlocal_issues?.hyperlocal_issues?.length > 0 && (
        <div className="mt-8">
          {renderIssues(data.local_hyperlocal_issues.hyperlocal_issues, 'hyperlocal')}
        </div>
      )}
    </div>
  );
};

export default LocalHyperlocalTab;
