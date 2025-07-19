'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportViewer({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Get password from URL if present
  const urlPassword = searchParams.get('password');
  
  // Helper function to get sentiment data for a specific caste with normalized percentages
  const getSentimentData = (sentimentData, caste) => {
    try {
      // Check if we have sentiment_by_caste data
      const byCaste = sentimentData?.sentiment_by_caste?.[caste];
      
      if (byCaste) {
        // If we have direct sentiment data for the caste, use it
        return {
          positive: Math.min(Math.max(0, byCaste.positive || 0), 100),
          negative: Math.min(Math.max(0, byCaste.negative || 0), 100),
          neutral: Math.min(Math.max(0, byCaste.neutral || 0), 100)
        };
      }
      
      // Fallback to overall sentiment if no caste-specific data
      const overall = sentimentData?.overall_sentiment || {};
      
      // If we have overall sentiment data, use it
      if (overall.positive !== undefined) {
        return {
          positive: Math.min(Math.max(0, overall.positive || 0), 100),
          negative: Math.min(Math.max(0, overall.negative || 0), 100),
          neutral: Math.min(Math.max(0, overall.neutral || 0), 100)
        };
      }
      
      // Default to neutral if no data is available
      return { positive: 0, negative: 0, neutral: 100 };
      
    } catch (error) {
      console.error('Error in getSentimentData:', error);
      return { positive: 0, negative: 0, neutral: 100 }; // Default to neutral on error
    }
  };
  
  // Load the report
  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const url = new URL(`/api/reports/${id}`, window.location.origin);
        if (urlPassword) {
          url.searchParams.set('password', urlPassword);
        } else if (password) {
          url.searchParams.set('password', password);
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403) {
            setIsProtected(true);
            setError('This report is password protected');
            return;
          }
          throw new Error(errorData.error || 'Failed to load report');
        }
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setIsProtected(true);
          return;
        }
        
        setReport(data);
        setIsProtected(!!data.password);
        
      } catch (error) {
        console.error('Error loading report:', error);
        setError(error.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadReport();
    }
  }, [id, password, urlPassword]);
  
  // Handle password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }
    
    // The useEffect will trigger a reload with the new password
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Error Loading Report</h2>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            
            {isProtected && (
              <div className="mt-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Enter Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password to view this report"
                    />
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Report
                  </button>
                </form>
              </div>
            )}
            
            <div className="mt-6">
              <a
                href="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ← Back to home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the report
  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Report Not Found</h2>
          <p className="mt-1 text-sm text-gray-500">The requested report could not be found or has been deleted.</p>
          <div className="mt-6">
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Prepare data for charts
  const casteDistributionData = {
    labels: Object.keys(report.caste_distribution || {}),
    datasets: [{
      label: 'Population %',
      data: Object.values(report.caste_distribution || {}),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }]
  };
  
  // Get sentiment data for the first caste or overall
  const firstCaste = report.caste_distribution ? Object.keys(report.caste_distribution)[0] : null;
  const sentimentData = firstCaste ? getSentimentData(report.sentiment_analysis, firstCaste) : 
    getSentimentData(report.sentiment_analysis, 'overall');
  
  const sentimentChartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      label: 'Sentiment %',
      data: [
        sentimentData.positive || 0,
        sentimentData.negative || 0,
        sentimentData.neutral || 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1,
    }]
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caste Analysis Report</h1>
              <p className="mt-1 text-sm text-gray-500">
                Generated on {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Report Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Analysis for &quot;{report.query}&quot;
          </h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {report.region === 'all' ? 'All India' : 
                report.region.charAt(0).toUpperCase() + report.region.slice(1) + ' India'}
            </div>
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(report.timestamp).toLocaleDateString()}
            </div>
            {isProtected && (
              <div className="flex items-center text-blue-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password Protected
              </div>
            )}
          </div>
        </div>
        
        {/* Caste Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Caste Distribution</h3>
            <div className="h-64">
              <Pie 
                data={casteDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.raw}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Sentiment Analysis */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Analysis</h3>
            <div className="h-64">
              <Bar 
                data={sentimentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Percentage (%)'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.raw}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        {report.insights?.key_findings?.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
            <ul className="space-y-3">
              {report.insights.key_findings.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* News Analysis */}
        {(report.news?.positive?.length > 0 || report.news?.negative?.length > 0 || report.news?.neutral?.length > 0) && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">News Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {report.news.positive?.length > 0 && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700 mb-3">Positive Sentiment</h4>
                  <ul className="space-y-3">
                    {report.news.positive.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.source} • {new Date(item.date).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.news.negative?.length > 0 && (
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700 mb-3">Negative Sentiment</h4>
                  <ul className="space-y-3">
                    {report.news.negative.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.source} • {new Date(item.date).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.news.neutral?.length > 0 && (
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-yellow-700 mb-3">Neutral Sentiment</h4>
                  <ul className="space-y-3">
                    {report.news.neutral.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.source} • {new Date(item.date).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Trends */}
        {report.trends?.overall_trend && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800">Overall Trend</h4>
                <p className="mt-1 text-gray-600">{report.trends.overall_trend}</p>
              </div>
              
              {report.trends.notable_changes?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Notable Changes</h4>
                  <ul className="space-y-2">
                    {report.trends.notable_changes.map((change, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2"></span>
                        <span className="text-gray-600">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                Report generated on {new Date(report.timestamp).toLocaleString()} •{" "}
                <a href="/" className="text-blue-600 hover:text-blue-500 ml-1">
                  Create your own analysis
                </a>
              </p>
        </div>
      </footer>
    </div>
  );
}
