'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Auth wrapper component to handle authentication
function AuthWrapper({ children }) {
    const router = useRouter();
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    throw new Error('Not authenticated');
                }
                setIsAuthLoading(false);
            } catch (error) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return children;
}

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

// Default empty data structure
const getDefaultCasteData = () => ({});
const getDefaultSentimentData = () => ({});

// Helper function to get default insights
const getDefaultInsights = () => ({
  key_findings: [],
  recommendations: []
});

// Helper function to get default trends
const getDefaultTrends = () => ({
  overall_trend: '',
  notable_changes: []
});

// Helper function to get default strengths and weaknesses
const getDefaultStrengthsWeaknesses = () => ({
  strengths: [],
  weaknesses: []
});

// Helper function to get default region-wise analysis
const getDefaultRegionWiseAnalysis = () => ({
  state_level: {},
  parliamentary_constituency: {},
  assembly_constituency: {},
  district: {},
  taluka: {}
});

// Helper function to get default platform comparison
const getDefaultPlatformComparison = () => ({});

// Helper function to get default demographic support
const getDefaultDemographicSupport = () => ({});

// Function to handle print functionality
const handlePrint = () => {
  window.print();
};

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
    
    // If we have the old format (direct properties), use that
    const data = sentimentData[caste] || sentimentData || {};
    const total = (data.positive || 0) + (data.negative || 0) + (data.neutral || 0) || 1;
    
    // Normalize to ensure the sum is 100%
    return {
      positive: Math.min(Math.round(((data.positive || 0) / total) * 100), 100),
      negative: Math.min(Math.round(((data.negative || 0) / total) * 100), 100),
      neutral: Math.min(Math.round(((data.neutral || 0) / total) * 100), 100)
    };
  } catch (error) {
    console.error('Error in getSentimentData:', error);
    return { positive: 0, negative: 0, neutral: 100 }; // Default to neutral on error
  }
};



// Handle caste selection from pie chart
const handleCasteSelect = (casteData, elements, setSelectedCaste) => {
  if (elements.length > 0) {
    const index = elements[0].index;
    const caste = Object.keys(casteData)[index];
    if (caste) {
      setSelectedCaste(caste);
    }
  }
};

function DashboardContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCaste, setSelectedCaste] = useState(null);
  const [casteData, setCasteData] = useState(getDefaultCasteData());
  const [sentimentData, setSentimentData] = useState(getDefaultSentimentData());
  const [insights, setInsights] = useState(getDefaultInsights());
  const [trends, setTrends] = useState(getDefaultTrends());
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState(getDefaultStrengthsWeaknesses());
  const [regionWiseAnalysis, setRegionWiseAnalysis] = useState(getDefaultRegionWiseAnalysis());
  const [activeRegionTab, setActiveRegionTab] = useState('state_level');
  const [platformComparison, setPlatformComparison] = useState(getDefaultPlatformComparison());
  const [demographicSupport, setDemographicSupport] = useState(getDefaultDemographicSupport());
  const [leaderProfile, setLeaderProfile] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportLink, setReportLink] = useState('');
  const [isProtected, setIsProtected] = useState(true);
  const [politicalStrategyReport, setPoliticalStrategyReport] = useState(null);
  const [localData, setLocalData] = useState(null);
  const [castewiseDetails, setCastewiseDetails] = useState(null);
  const [oppositionTracking, setOppositionTracking] = useState(null);
  
  const [filters, setFilters] = useState({
    timeRange: '1m',
    customStartDate: '',
    customEndDate: '',
    region: 'all',
    location: {
      state: '',
      pc: '',
      ac: '',
      district: '',
      taluka: ''
    },
    detailed: false,
    includeNews: true,
    includeTrends: true,
    sentimentThreshold: 0.6, // Default sentiment threshold
    includeSentimentBreakdown: true,
    includeSourceAnalysis: true
  });
  
  
  
  // Location hierarchy for filtering
  const regions = [
    { value: 'all', label: 'All India' },
    { value: 'state', label: 'State / Union Territory' },
    { value: 'pc', label: 'Parliamentary Constituency' },
    { value: 'ac', label: 'Assembly Constituency' },
    { value: 'district', label: 'District' },
    { value: 'taluka', label: 'Taluka' }
  ];
  
  // State for selected location based on hierarchy
  const [selectedLocation, setSelectedLocation] = useState({
    state: '',
    pc: '',
    ac: '',
    district: '',
    taluka: ''
  });
  const [newsPage, setNewsPage] = useState({
    positive: 1,
    negative: 1,
    neutral: 1
  });
  const itemsPerPage = 3; // Show 3 items at a time
  const searchInputRef = useRef(null);
  

  
  

  // Helper function to render sentiment badge
  const renderSentimentBadge = (sentiment) => {
    const colorMap = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-yellow-100 text-yellow-800',
      high: 'bg-blue-100 text-blue-800',
      medium: 'bg-purple-100 text-purple-800',
      low: 'bg-gray-100 text-gray-800'
    };
    
    const color = colorMap[sentiment?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {sentiment || 'N/A'}
      </span>
    );
  };

  // Political Strategy Report Component
  const PoliticalStrategyReport = ({ report }) => {
    if (!report || !report.political_strategy_report) {
      console.log('No political strategy report data found');
      return null;
    }

    const { political_strategy_report: psr } = report;

    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Political Strategy Report</h2>
        
        {/* Overview Section */}
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-blue-800">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-blue-700">Leader</h4>
              <p className="text-gray-800">{psr.leader || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700">Party</h4>
              <p className="text-gray-800">{psr.party || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700">Region</h4>
              <p className="text-gray-800">{psr.region || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700">Report Date</h4>
              <p className="text-gray-800">{psr.report_date || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        {psr.sections?.sentiment_analysis && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Sentiment Analysis</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Overall Sentiment */}
                <div>
                  <h4 className="font-medium text-lg mb-3">Overall Sentiment</h4>
                  <div className="flex items-center space-x-3">
                    {renderSentimentBadge(psr.sections.sentiment_analysis.overall_sentiment)}
                    <span className="text-gray-700 text-lg font-medium">
                      {psr.sections.sentiment_analysis.overall_sentiment || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Sentiment Trends */}
                  {psr.sections.sentiment_analysis.sentiment_trends && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Trends</h5>
                      <div className="space-y-2">
                        {psr.sections.sentiment_analysis.sentiment_trends.week_over_week && (
                          <div className="flex justify-between text-sm">
                            <span>Week over Week:</span>
                            <span className={`${psr.sections.sentiment_analysis.sentiment_trends.week_over_week.positive_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {psr.sections.sentiment_analysis.sentiment_trends.week_over_week.positive_change > 0 ? '+' : ''}
                              {psr.sections.sentiment_analysis.sentiment_trends.week_over_week.positive_change}%
                            </span>
                          </div>
                        )}
                        {psr.sections.sentiment_analysis.sentiment_trends.month_over_month && (
                          <div className="flex justify-between text-sm">
                            <span>Month over Month:</span>
                            <span className={`${psr.sections.sentiment_analysis.sentiment_trends.month_over_month.positive_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {psr.sections.sentiment_analysis.sentiment_trends.month_over_month.positive_change > 0 ? '+' : ''}
                              {psr.sections.sentiment_analysis.sentiment_trends.month_over_month.positive_change}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sentiment Breakdown */}
                {psr.sections.sentiment_analysis.sentiment_breakdown && (
                  <div>
                    <h4 className="font-medium text-lg mb-3">Sentiment Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(psr.sections.sentiment_analysis.sentiment_breakdown).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{key}</span>
                            <span className="text-gray-700">{value}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-full rounded-full ${
                                key === 'positive' ? 'bg-green-500' :
                                key === 'negative' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Comments */}
              <div className="mt-8">
                <h4 className="font-medium text-lg mb-3">Top Comments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Positive Comments */}
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="flex items-center text-green-700 mb-2">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <h5 className="font-medium">Positive Feedback</h5>
                    </div>
                    {psr.sections.sentiment_analysis.top_positive_comments?.length > 0 ? (
                      <ul className="space-y-3 mt-2">
                        {psr.sections.sentiment_analysis.top_positive_comments.slice(0, 3).map((comment, i) => (
                          <li key={i} className="text-sm text-gray-700 border-l-2 border-green-500 pl-3 py-1">
                            <p className="italic">"{comment.text}"</p>
                            {comment.platform && (
                              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                <span>{comment.platform}</span>
                                {comment.date && <span>{new Date(comment.date).toLocaleDateString()}</span>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No positive comments available</p>
                    )}
                  </div>

                  {/* Negative Comments */}
                  <div className="bg-white p-4 rounded-lg border border-red-100">
                    <div className="flex items-center text-red-700 mb-2">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      <h5 className="font-medium">Areas for Improvement</h5>
                    </div>
                    {psr.sections.sentiment_analysis.top_negative_comments?.length > 0 ? (
                      <ul className="space-y-3 mt-2">
                        {psr.sections.sentiment_analysis.top_negative_comments.slice(0, 3).map((comment, i) => (
                          <li key={i} className="text-sm text-gray-700 border-l-2 border-red-500 pl-3 py-1">
                            <p className="italic">"{comment.text}"</p>
                            {comment.platform && (
                              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                <span>{comment.platform}</span>
                                {comment.date && <span>{new Date(comment.date).toLocaleDateString()}</span>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No negative feedback available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Caste Sentiment */}
        {psr.sections?.caste_sentiment?.caste_groups?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Caste-wise Sentiment Analysis</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Caste Groups Sentiment */}
                <div>
                  <h4 className="text-lg font-medium mb-3">Caste Group Sentiments</h4>
                  <div className="space-y-3">
                    {psr.sections.caste_sentiment.caste_groups.map((caste, i) => (
                      <div key={i} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{caste.caste}</span>
                          {renderSentimentBadge(caste.sentiment)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caste Related Issues */}
                {psr.sections.caste_sentiment.caste_related_issues?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium mb-3">Key Caste-related Issues</h4>
                    <div className="space-y-3">
                      {psr.sections.caste_sentiment.caste_related_issues.map((issue, i) => (
                        <div key={i} className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span className="text-gray-700">{issue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Caste-wise Voting Patterns (if available) */}
              {psr.sections.caste_sentiment.voting_patterns && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Voting Patterns</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Caste</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Vote Share</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Trend</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Key Issues</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(psr.sections.caste_sentiment.voting_patterns).map(([caste, data], i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{caste}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{data.vote_share}%</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {data.trend === 'increasing' ? (
                                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                                <span className={`text-sm ${data.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.trend}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {data.key_issues?.slice(0, 2).map((issue, j) => (
                                  <span key={j} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                                    {issue}
                                  </span>
                                ))}
                                {data.key_issues?.length > 2 && (
                                  <span className="text-xs text-gray-500">+{data.key_issues.length - 2} more</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Scanning Analysis */}
        {psr.sections?.content_scanning_analysis && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Content Analysis</h3>
            <div className="space-y-6">
              {/* Pro Narratives */}
              {psr.sections.content_scanning_analysis.pro_narratives?.length > 0 && (
                <div className="bg-green-50 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-green-800">Supportive Narratives</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {psr.sections.content_scanning_analysis.pro_narratives.map((narrative, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border border-green-100">
                        <p className="font-medium text-green-700 mb-2">{narrative.narrative}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Reach:</span> {narrative.reach?.toLocaleString() || 'N/A'}</p>
                          <p><span className="font-medium">Sentiment:</span> {renderSentimentBadge(narrative.sentiment)}</p>
                          {narrative.key_influencers?.length > 0 && (
                            <div>
                              <p className="font-medium">Key Influencers:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {narrative.key_influencers.map((influencer, j) => (
                                  <span key={j} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                    {influencer}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anti Narratives */}
              {psr.sections.content_scanning_analysis.anti_narratives?.length > 0 && (
                <div className="bg-red-50 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-red-800">Critical Narratives</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {psr.sections.content_scanning_analysis.anti_narratives.map((narrative, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border border-red-100">
                        <p className="font-medium text-red-700 mb-2">{narrative.narrative}</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Reach:</span> {narrative.reach?.toLocaleString() || 'N/A'}</p>
                          <p><span className="font-medium">Sentiment:</span> {renderSentimentBadge(narrative.sentiment)}</p>
                          {narrative.key_influencers?.length > 0 && (
                            <div>
                              <p className="font-medium">Key Influencers:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {narrative.key_influencers.map((influencer, j) => (
                                  <span key={j} className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                                    {influencer}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
            </div>
          </div>
        )}

        {/* Demographic Sentiment */}
        {psr.sections?.demographic_sentiment && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Demographic Analysis</h3>
            <div className="space-y-6">
              {/* Age Groups */}
              {psr.sections.demographic_sentiment.age_groups && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-800">Age Group Sentiment</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(psr.sections.demographic_sentiment.age_groups).map(([ageGroup, data], i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">{ageGroup}</span>
                          {renderSentimentBadge(data.sentiment)}
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              data.sentiment === 'positive' ? 'bg-green-500' : 
                              data.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} 
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{data.percentage}%</span>
                          <span>{data.count?.toLocaleString()} responses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Distribution */}
              {psr.sections.demographic_sentiment.gender && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <svg className="w-5 h-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 className="text-lg font-medium text-gray-800">Gender Sentiment</h4>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(psr.sections.demographic_sentiment.gender).map(([gender, data], i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium capitalize">{gender}</span>
                            <span className="text-gray-600">{data.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                data.sentiment === 'positive' ? 'bg-green-500' : 
                                data.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} 
                              style={{ width: `${data.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Income Level */}
                  {psr.sections.demographic_sentiment.income_level && (
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-4">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-lg font-medium text-gray-800">Income Level Sentiment</h4>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(psr.sections.demographic_sentiment.income_level).map(([incomeLevel, data], i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-24">
                              <span className="text-sm font-medium text-gray-700">{incomeLevel}</span>
                            </div>
                            <div className="flex-1 mx-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    data.sentiment === 'positive' ? 'bg-green-500' : 
                                    data.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} 
                                  style={{ width: `${data.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-10 text-right">
                              <span className="text-sm text-gray-600">{data.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Education Level */}
              {psr.sections.demographic_sentiment.education_level && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-800">Education Level Sentiment</h4>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(psr.sections.demographic_sentiment.education_level).map(([educationLevel, data], i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{educationLevel}</span>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">{data.percentage}%</span>
                            {renderSentimentBadge(data.sentiment, 'small')}
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              data.sentiment === 'positive' ? 'bg-green-500' : 
                              data.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} 
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Distribution */}
              {psr.sections.demographic_sentiment.region && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-800">Regional Sentiment</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Issues</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(psr.sections.demographic_sentiment.region).map(([region, data], i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{region}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {renderSentimentBadge(data.sentiment, 'small')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      data.sentiment === 'positive' ? 'bg-green-500' : 
                                      data.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} 
                                    style={{ width: `${data.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">{data.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {data.key_issues?.slice(0, 2).map((issue, j) => (
                                  <span key={j} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                                    {issue}
                                  </span>
                                ))}
                                {data.key_issues?.length > 2 && (
                                  <span className="text-xs text-gray-500">+{data.key_issues.length - 2} more</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Issues */}
        {psr.sections?.key_issues?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Issues</h3>
            <div className="space-y-4">
              {psr.sections.key_issues.map((issue, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                  <h4 className="font-medium">{issue.issue}</h4>
                  <p className="text-sm text-gray-600">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Media Performance */}
        {psr.sections?.social_media_performance && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Social Media Performance</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              {psr.sections.social_media_performance.summary && (
                <p className="mb-6 text-gray-700">{psr.sections.social_media_performance.summary}</p>
              )}
              
              {/* Platform Comparison */}
              {psr.sections.social_media_performance.platform_comparison?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-4">Platform Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {psr.sections.social_media_performance.platform_comparison.map((platform, i) => (
                      <div key={i} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">{platform.platform}</h5>
                          {renderSentimentBadge(platform.engagement_rate)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Followers:</span>
                            <span className="font-medium">
                              {platform.follower_count?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Engagement Rate:</span>
                            <span className="font-medium">
                              {platform.engagement_rate || 'N/A'}
                            </span>
                          </div>
                          {platform.growth_rate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Growth:</span>
                              <span className={`font-medium ${
                                platform.growth_rate.startsWith('+') ? 'text-green-600' : 
                                platform.growth_rate.startsWith('-') ? 'text-red-600' : 
                                'text-gray-600'
                              }`}>
                                {platform.growth_rate}
                              </span>
                            </div>
                          )}
                          {platform.ranking_vs_others && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Ranking:</span>
                              <span className="font-medium">{platform.ranking_vs_others}</span>
                            </div>
                          )}
                        </div>

                        {platform.top_performing_posts?.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h6 className="text-xs font-medium text-gray-500 mb-2">Top Posts:</h6>
                            <ul className="space-y-1">
                              {platform.top_performing_posts.slice(0, 2).map((post, j) => (
                                <li key={j} className="text-xs text-blue-600 truncate">
                                  <a href={post} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {post.length > 50 ? `${post.substring(0, 50)}...` : post}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )} 
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro and Anti Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pro Pages */}
                {psr.sections.social_media_performance.pro_pages?.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-3">Supportive Pages</h4>
                    <div className="space-y-3">
                      {psr.sections.social_media_performance.pro_pages.map((page, i) => (
                        <div key={i} className="bg-white p-3 rounded border border-green-100">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-green-700">{page.name}</h5>
                            {renderSentimentBadge('positive')}
                          </div>
                          <div className="mt-2 text-sm space-y-1">
                            <p><span className="text-gray-600">Followers:</span> {page.followers?.toLocaleString() || 'N/A'}</p>
                            <p><span className="text-gray-600">Engagement:</span> {page.engagement_rate || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anti Pages */}
                {psr.sections.social_media_performance.anti_pages?.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-3">Critical Pages</h4>
                    <div className="space-y-3">
                      {psr.sections.social_media_performance.anti_pages.map((page, i) => (
                        <div key={i} className="bg-white p-3 rounded border border-red-100">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-red-700">{page.name}</h5>
                            {renderSentimentBadge('negative')}
                          </div>
                          <div className="mt-2 text-sm space-y-1">
                            <p><span className="text-gray-600">Followers:</span> {page.followers?.toLocaleString() || 'N/A'}</p>
                            <p><span className="text-gray-600">Engagement:</span> {page.engagement_rate || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Assembly Leader Report Component
  const AssemblyLeaderReport = ({ report }) => {
    console.log('Assembly Leader Report Data:', JSON.stringify(report, null, 2));
    
    if (!report || !report.assembly_leader_report) {
      console.log('No report data or assembly_leader_report not found');
      return null;
    }
    
    const { assembly_leader_report: leaderReport } = report;
    
    if (!leaderReport.key_issues?.length && !leaderReport.executive_summary) {
      console.log('No key issues or executive summary in report');
      return null;
    }

    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assembly Leader Report</h2>
        
        {/* MLA and Constituency Information */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Constituency</h3>
              <p className="text-gray-700">{leaderReport?.constituency || 'N/A'}</p>
            </div>
            
            {leaderReport.mla && (
              <div>
                <h3 className="text-lg font-semibold text-blue-800">MLA Information</h3>
                <div className="space-y-1">
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {leaderReport.mla.name || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Party:</span> {leaderReport.mla.party || 'N/A'}
                  </p>
                  {leaderReport.mla.term_start && (
                    <p className="text-gray-700">
                      <span className="font-medium">Term Start:</span> {leaderReport.mla.term_start}
                    </p>
                  )}
                  
                  {leaderReport.mla.contact && (
                    <div className="mt-2 pt-2 border-t border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700 mb-1">Contact Information:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {leaderReport.mla.contact.mobile && (
                          <li className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {leaderReport.mla.contact.mobile}
                          </li>
                        )}
                        {leaderReport.mla.contact.email && (
                          <li className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {leaderReport.mla.contact.email}
                          </li>
                        )}
                        {leaderReport.mla.contact.office_address && (
                          <li className="flex items-start">
                            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{leaderReport.mla.contact.office_address}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {leaderReport.executive_summary && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
            <p className="text-gray-700">{leaderReport.executive_summary}</p>
          </div>
        )}
        
        {leaderReport.key_issues?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Issues</h3>
            <div className="space-y-6">
              {leaderReport.key_issues.map((issue, index) => (
                <div key={`issue-${index}`} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-medium text-gray-900">{issue.issue}</h4>
                  <div className="flex items-center mt-1 mb-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      issue.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      issue.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {issue.sentiment || 'neutral'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Impact: {issue.impact_level || 'N/A'}
                    </span>
                  </div>
                  
                  {issue.public_opinion_summary && (
                    <div className="mt-2 bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Public Opinion:</span> {issue.public_opinion_summary}
                      </p>
                    </div>
                  )}
                  
                  {issue.leader_response && (
                    <div className="mt-2 bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Leader&apos;s Response:</span> {issue.leader_response}
                      </p>
                    </div>
                  )}
                  
                  {issue.suggested_interventions?.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Suggested Interventions:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {issue.suggested_interventions.map((action, i) => (
                          <li key={`action-${i}`} className="ml-4">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Local and Hyperlocal Issues Component
  const LocalHyperlocalIssues = ({ issues }) => {
    if (!issues || (!issues.local_issues?.length && !issues.hyperlocal_issues?.length)) {
      return null;
    }

    return (
      <div className="space-y-8 mt-8">
        {issues.local_issues?.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Local Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issues.local_issues.map((issue, index) => (
                <div key={`local-${index}`} className="border p-4 rounded">
                  <h4 className="font-medium">{issue.region || 'Unspecified Region'}</h4>
                  <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      issue.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      issue.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {issue.sentiment || 'neutral'}
                    </span>
                    <span className="text-gray-500">{issue.impact_level || 'N/A'}</span>
                  </div>
                  {issue.public_opinion_summary && (
                    <p className="text-xs text-gray-500 mt-2">{issue.public_opinion_summary}</p>
                  )}
                  {issue.suggested_interventions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Suggested Actions:</p>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {issue.suggested_interventions.map((action, i) => (
                          <li key={`action-${i}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.hyperlocal_issues?.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Hyperlocal Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issues.hyperlocal_issues.map((issue, index) => (
                <div key={`hyperlocal-${index}`} className="border p-4 rounded">
                  <h4 className="font-medium">{issue.location || 'Unspecified Location'}</h4>
                  <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      issue.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      issue.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {issue.sentiment || 'neutral'}
                    </span>
                    <span className="text-gray-500">{issue.impact_level || 'N/A'}</span>
                  </div>
                  {issue.public_opinion_summary && (
                    <p className="text-xs text-gray-500 mt-2">{issue.public_opinion_summary}</p>
                  )}
                  {issue.suggested_interventions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Suggested Actions:</p>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {issue.suggested_interventions.map((action, i) => (
                          <li key={`action-${i}`}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Sentiment Analysis Section Component
  const SentimentAnalysisSection = () => {
    if (!searchResults || !sentimentData || Object.keys(sentimentData).length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
          <p className="text-gray-500">No sentiment data available. Please perform a search to see the analysis.</p>
        </div>
      );
    }

    // Safely get platform comparison data with defaults
    const platformComparison = searchResults.platform_sentiment_comparison || {};
    const platformNames = Object.keys(platformComparison).filter(k => k !== 'Overall');
    
    // Prepare data for platform sentiment comparison
    const platformData = {
      labels: platformNames,
      datasets: [
        {
          label: 'Positive',
          data: platformNames.map(platform => {
            const data = platformComparison[platform] || {};
            return data.positive || 0;
          }),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Neutral',
          data: platformNames.map(platform => {
            const data = platformComparison[platform] || {};
            return data.neutral || 0;
          }),
          backgroundColor: 'rgba(201, 203, 207, 0.6)',
          borderColor: 'rgba(201, 203, 207, 1)',
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: platformNames.map(platform => {
            const data = platformComparison[platform] || {};
            return data.negative || 0;
          }),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Safely get region-wise analysis data with defaults
    const regionWiseData = searchResults.region_wise_analysis || {};
    const regionNames = Object.keys(regionWiseData);
    
    // Prepare data for regional sentiment
    const regionalData = {
      labels: regionNames,
      datasets: [
        {
          label: 'Positive',
          data: regionNames.map(region => {
            const data = regionWiseData[region] || {};
            return data.positive || 0;
          }),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: regionNames.map(region => {
            const data = regionWiseData[region] || {};
            return data.negative || 0;
          }),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Safely get demographic support data with defaults
    const demographicSupportBase = searchResults.demographic_support_base || {};
    const supportLabels = [
      'Youth (18-35)', 
      'Middle-age (36-55)', 
      'Senior (56+)', 
      'Urban', 
      'Rural'
    ];
    
    // Prepare data for demographic support
    const demographicSupportData = {
      labels: supportLabels,
      datasets: [
        {
          label: 'Support %',
          data: supportLabels.map(label => {
            // Handle different label formats (with or without space after colon)
            const key = label.replace(':', '').trim();
            return demographicSupportBase[key] || 0;
          }),
          backgroundColor: [
            'rgba(255, 159, 64, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Calculate overall support with fallback
    const overallSupport = demographicSupportBase.Overall || 
                         (demographicSupportBase.overall_support !== undefined ? 
                          demographicSupportBase.overall_support : 0);

    return (
      <div className="space-y-8">
        {/* Castewise Details Section */}
        {castewiseDetails?.caste_distribution && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Castewise Demographic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Caste Distribution */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Caste Distribution</h3>
                <div className="space-y-4">
                  {castewiseDetails.caste_distribution.map((caste, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h4 className="font-medium">{caste.caste}</h4>
                      <p className="text-sm text-gray-600">
                        Population: {caste.approx_population} ({caste.percentage}%)
                      </p>
                      {caste.dominant_surnames?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Common Surnames: {caste.dominant_surnames.join(', ')}
                        </p>
                      )}
                      {caste.political_influence && (
                        <p className="text-xs text-gray-500 mt-1">
                          Political Influence: {caste.political_influence}
                        </p>
                      )}
                      {caste.key_issues?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-600">Key Issues:</p>
                          <ul className="text-xs text-gray-500 list-disc pl-4">
                            {caste.key_issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Surname to Caste Map */}
              {castewiseDetails.surname_to_caste_map && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Surname to Caste Mapping</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(castewiseDetails.surname_to_caste_map).map(([surname, caste]) => (
                      <div key={surname} className="bg-gray-50 p-2 rounded border text-sm">
                        <span className="font-medium">{surname}:</span> {caste}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Sentiment Comparison */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Platform Sentiment Comparison</h3>
          <div className="h-80">
            <Bar
              data={platformData}
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
                      label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value}%`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regional Sentiment Analysis */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Regional Sentiment Analysis</h3>
            <div className="h-64">
              <Bar
                data={regionalData}
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
                        label: (context) => {
                          const label = context.dataset.label || '';
                          const value = context.raw || 0;
                          return `${label}: ${value}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Demographic Support */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Demographic Support</h3>
            <div className="h-64">
              <Bar
                data={demographicSupportData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Support %'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.raw || 0;
                          return `${value}% support`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Overall Support */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Overall Support</h3>
          <div className="text-center">
            <div className="inline-block relative w-64 h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold">{overallSupport}%</div>
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-blue-600"
                  strokeWidth="10"
                  strokeDasharray={`${overallSupport * 2.51} 251`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
            </div>
            <p className="mt-2 text-gray-600">Based on weighted average across all demographic groups</p>
          </div>
        </div>
      </div>
    );
  };

  // Update data when search results change
  useEffect(() => {
    // Reset pagination when search results change
    setNewsPage({
      positive: 1,
      negative: 1,
      neutral: 1
    });
    
    if (searchResults) {
      console.log('Updating with search results:', searchResults);
      
      // Update leader profile and executive summary
      if (searchResults.leader_profile) {
        setLeaderProfile(Array.isArray(searchResults.leader_profile) ? 
          searchResults.leader_profile : []);
      }
      
      if (searchResults.executive_summary) {
        setExecutiveSummary(Array.isArray(searchResults.executive_summary) ? 
          searchResults.executive_summary.join('\n\n') : 
          String(searchResults.executive_summary || ''));
      }
      
      // Update caste distribution data
      if (searchResults.caste_distribution) {
        const distribution = {};
        // Ensure all values are numbers and handle potential string numbers
        Object.entries(searchResults.caste_distribution).forEach(([key, value]) => {
          const numValue = typeof value === 'string' ? 
            parseFloat(value.replace('%', '')) || 0 : 
            Number(value) || 0;
          distribution[key] = numValue;
        });
        setCasteData(distribution);
        
        // Auto-select the first caste if none selected or if selected caste doesn't exist
        if (!selectedCaste || !distribution[selectedCaste]) {
          const firstCaste = Object.keys(distribution)[0];
          if (firstCaste) setSelectedCaste(firstCaste);
        }
      }

      // Update sentiment data with proper defaults
      if (searchResults.sentiment_analysis) {
        const sentiment = searchResults.sentiment_analysis;
        // Ensure sentiment_by_caste exists and has proper structure
        if (sentiment.sentiment_by_caste) {
          Object.entries(sentiment.sentiment_by_caste).forEach(([caste, data]) => {
            if (data) {
              // Ensure all sentiment values are numbers
              ['positive', 'negative', 'neutral'].forEach(key => {
                if (data[key] !== undefined) {
                  data[key] = Number(data[key]) || 0;
                }
              });
            }
          });
        }
        setSentimentData(sentiment);
      }

      // Update platform comparison data if available
      if (searchResults.platform_sentiment_comparison) {
        setPlatformComparison(searchResults.platform_sentiment_comparison);
      }

      // Update region-wise analysis if available
      if (searchResults.region_wise_analysis) {
        setRegionWiseAnalysis(searchResults.region_wise_analysis);
      }

      // Update demographic support if available
      if (searchResults.demographic_support_base) {
        setDemographicSupport(searchResults.demographic_support_base);
      }

      // Update insights and trends with proper defaults
      setInsights({
        key_findings: Array.isArray(searchResults.insights?.key_findings) ? 
          searchResults.insights.key_findings : 
          (searchResults.insights ? [searchResults.insights] : []),
        recommendations: Array.isArray(searchResults.insights?.recommendations) ?
          searchResults.insights.recommendations :
          []
      });

      setTrends({
        overall_trend: searchResults.trends?.overall_trend || '',
        notable_changes: Array.isArray(searchResults.trends) 
          ? searchResults.trends.slice(1) 
          : (searchResults.trends?.notable_changes || [
              'No notable changes recorded',
              'Try a different search term',
              'Check back later for updates'
            ])
      });
    }
  }, [searchResults, selectedCaste]);

  // Handle downloading the report as PDF
  const handleSaveReport = async () => {
    if (!searchResults) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      setSaveSuccess(false);
      
      // Dynamically import the PDF components
      const { PDFViewer, PDFDownloadLink } = await import('@react-pdf/renderer');
      const PDFDocument = (await import('@/components/PDFDocument')).default;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      const blob = await fetch(
        URL.createObjectURL(
          new Blob(
            [JSON.stringify({ searchResults })],
            { type: 'application/json' }
          )
        )
      ).then(res => res.blob());
      
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', 'sentiment-analysis-report.pdf');
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Failed to generate PDF: ${error.message}`);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle time range filter change
  const handleTimeRangeChange = (e) => {
    const newTimeRange = e.target.value;
    setFilters(prev => ({
      ...prev,
      timeRange: newTimeRange,
      customStartDate: '',
      customEndDate: ''
    }));
  };

  // Handle sharing the report
  const handleShareReport = async () => {
    if (!reportLink) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Caste Analysis Report',
          text: 'Check out this caste analysis report',
          url: reportLink,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(reportLink);
        alert('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      if (error.name !== 'AbortError') {
        alert('Error sharing report');
      }
    }
  };

  const handleSearch = async (e) => {
    // Store setLocalData in a local constant to ensure it's available in the catch block
    const setLocalDataState = setLocalData;
    
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError('');
    setSearchResults(null);
    setSelectedCaste(null);
    setCasteData(getDefaultCasteData());
    setSentimentData(getDefaultSentimentData());
    setInsights(getDefaultInsights());
    setTrends(getDefaultTrends());
    setStrengthsWeaknesses(getDefaultStrengthsWeaknesses());
    setRegionWiseAnalysis(getDefaultRegionWiseAnalysis());
    setPlatformComparison(getDefaultPlatformComparison());
    setDemographicSupport(getDefaultDemographicSupport());
    setLeaderProfile([]);
    setExecutiveSummary('');
    setReportLink('');
    setSaveSuccess(false);
    setPoliticalStrategyReport(null);
    setLocalDataState(null); // Clear local data at the start
    setCastewiseDetails(null); // Clear castewise details
    
    // Prepare location data for the API request
    const locationData = {};
    if (filters.region !== 'all' && selectedLocation[filters.region]) {
      locationData[filters.region] = selectedLocation[filters.region];
    }

    try {
      // Helper function to handle API calls with error handling and logging
      const fetchWithRetry = async (url, options, retries = 1) => {
        console.log(`Attempting to call ${url} with options:`, options);
        try {
          const response = await fetch(url, options);
          console.log(`Response status for ${url}:`, response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error for ${url}: ${response.status} - ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          const data = await response.json();
          console.log(`Successfully fetched from ${url}:`, data);
          return data;
          
        } catch (error) {
          console.error(`Error in fetchWithRetry for ${url}:`, error);
          if (retries > 0) {
            console.warn(`Retrying ${url}... (${retries} attempts left)`);
            // Add a small delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
          }
          console.error(`Failed to fetch from ${url} after retries:`, error);
          return { error: `Failed to load data: ${error.message}` };
        }
      };

      // Call all APIs in parallel with error handling
      const [searchData, localData, leadersData, politicalStrategyData, castewiseData, oppositionTrackingData] = await Promise.all([
        // Main search API
        fetchWithRetry('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: searchTerm,
            name: searchTerm,
            analysisType: 'caste_analysis',
            region: filters.region,
            location: filters.region !== 'all' ? { [filters.region]: selectedLocation[filters.region] || '' } : {},
            timeRange: filters.timeRange,
            detailed: filters.detailed,
            includeNews: filters.includeNews,
            includeTrends: filters.includeTrends,
            sentimentThreshold: filters.sentimentThreshold,
            includeSentimentBreakdown: filters.includeSentimentBreakdown,
            includeSourceAnalysis: filters.includeSourceAnalysis,
            customStartDate: filters.timeRange === 'custom' ? filters.customStartDate : '',
            customEndDate: filters.timeRange === 'custom' ? filters.customEndDate : ''
          })
        }),
        // Local and Hyperlocal API
        fetchWithRetry('/api/localAndHyperlocal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `Search for ${searchTerm} in local and hyperlocal context`,
            name: searchTerm
          })
        }),
        // Assembly Leaders API
        fetchWithRetry('/api/assemblyLeaders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `Search for ${searchTerm} in assembly leaders context`,
            name: searchTerm
          })
        }),
        // Political Strategy Report API
        fetchWithRetry('/api/politicalStrategyReport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: searchTerm,
            region: filters.region,
            timeRange: filters.timeRange,
            customStartDate: filters.customStartDate,
            customEndDate: filters.customEndDate
          })
        }),
        // Castewise Details API
        fetchWithRetry('/api/castewiseDetails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: searchTerm
          })
        }),
        // Opposition Tracking API
        fetchWithRetry('/api/oppositionTracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: searchTerm
          })
        })
      ]);

      // Update local data state using the locally scoped setter
      setLocalDataState(localData);
      setCastewiseDetails(castewiseData?.caste_distribution ? {
        caste_distribution: castewiseData.caste_distribution,
        surname_to_caste_map: castewiseData.surname_to_caste_map || {}
      } : null);
      console.log('Raw opposition tracking data:', oppositionTrackingData);
      setOppositionTracking(oppositionTrackingData || null);
      
      // Log the state after setting it
      setTimeout(() => {
        console.log('Opposition tracking state after set:', oppositionTracking);
      }, 0);
      
      // Check for errors in any of the API responses
      const apiErrors = [
        searchData?.error && 'Search API: ' + searchData.error,
        localData?.error && 'Local API: ' + localData.error,
        leadersData?.error && 'Leaders API: ' + leadersData.error,
        politicalStrategyData?.error && 'Political Strategy API: ' + politicalStrategyData.error,
        castewiseData?.error && 'Castewise Details API: ' + castewiseData.error,
        oppositionTrackingData?.error && 'Opposition Tracking API: ' + oppositionTrackingData.error
      ].filter(Boolean);

      if (apiErrors.length > 0) {
        console.warn('API warnings:', apiErrors);
        // Continue processing with partial data, but show warning to user
        setError(`Some data might be incomplete: ${apiErrors.join('; ')}`);
      }

      // Log processed responses for debugging
      console.log('Search API response:', searchData);
      console.log('Local API response:', localData);
      console.log('Leaders API response:', leadersData);
      console.log('Political Strategy API response:', politicalStrategyData);
      console.log('Castewise Details API response:', castewiseData);
      console.log('Opposition Tracking API response:', oppositionTrackingData);

      // Combine all data with proper fallbacks
      const combinedData = {
        // Main search data
        ...(searchData || {}),
        
        // Local and hyperlocal data with proper nesting
        local_hyperlocal_issues: localData?.local_hyperlocal_issues || {
          local_issues: [],
          hyperlocal_issues: []
        },
        
        // Assembly leaders data with proper nesting
        assembly_leader_report: leadersData?.data?.assembly_leader_report || leadersData?.assembly_leader_report || {
          constituency: '',
          mla: {
            name: '',
            party: '',
            term_start: '',
            contact: {
              mobile: '',
              email: '',
              office_address: ''
            }
          },
          key_issues: []
        },
        
        // Political Strategy Report data - extract the nested political_strategy_report from the response
        political_strategy_report: politicalStrategyData?.political_strategy_report || {
          social_media_performance: {},
          key_issues: [],
          electoral_analysis: {},
          policy_recommendations: []
        },
        // Castewise Details data
        castewise_details: castewiseData?.caste_distribution || {
          caste_distribution: [],
          surname_to_caste_map: {}
        },
        // Opposition Tracking data
        opposition_tracking: oppositionTrackingData || {
          region: '',
          timeframe_analyzed: '',
          opposition_parties: [],
          overall_sentiment_towards_opposition: {
            positive: '',
            neutral: '',
            negative: '',
            summary: ''
          },
          narrative_recommendations: {
            content_strategy: '',
            target_demographics: [],
            platform_priorities: [],
            recommended_counter_narratives: []
          }
        },
        // Ensure query and timestamp are always set
        query: searchTerm,
        timestamp: new Date().toISOString()
      };
      console.log('Combined data assembly_leader_report :',  combinedData.assembly_leader_report),
      
      console.log('Combined data with local issues:', JSON.stringify({
        local_issues: combinedData.local_hyperlocal_issues?.local_issues,
        hyperlocal_issues: combinedData.local_hyperlocal_issues?.hyperlocal_issues
      }, null, 2));

      // Calculate total results based on news items if available
      const newsCount = combinedData.news ? 
        ((combinedData.news.positive?.length || 0) + 
        (combinedData.news.negative?.length || 0) + 
        (combinedData.news.neutral?.length || 0)) : 0;
      
      // Prepare the complete data structure with all required fields
      const processedData = {
        // Spread the combined data first
        ...combinedData,
        
        // Ensure all required top-level fields exist
        caste_distribution: combinedData.caste_distribution || {
          general: 0,
          obc: 0,
          sc: 0,
          st: 0,
          others: 0
        },
        
        sentiment_analysis: combinedData.sentiment_analysis || {
          general: { positive: 0, neutral: 0, negative: 0 },
          obc: { positive: 0, neutral: 0, negative: 0 },
          sc: { positive: 0, neutral: 0, negative: 0 },
          st: { positive: 0, neutral: 0, negative: 0 },
          others: { positive: 0, neutral: 0, negative: 0 }
        },
        
        // Structure insights properly
        insights: {
          key_findings: combinedData.key_insights || combinedData.insights?.key_findings || [
            'No key findings available',
            'Please try a different search term',
            'Check back later for updates'
          ],
          recommendations: combinedData.insights?.recommendations || [
            'Try a different search term',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        },
        
        // Structure trends with fallbacks
        trends: {
          overall_trend: combinedData.trends?.overall_trend || 'No trend data available',
          notable_changes: Array.isArray(combinedData.trends) 
            ? combinedData.trends.slice(1) 
            : (combinedData.trends?.notable_changes || [
                'No notable changes recorded',
                'Try a different search term',
                'Check back later for updates'
              ])
        },
        
        // Ensure news structure exists
        news: {
          positive: combinedData.news?.positive || [],
          negative: combinedData.news?.negative || [],
          neutral: combinedData.news?.neutral || []
        },
        
        // Set all other required fields with defaults
        key_strengths_weaknesses: combinedData.key_strengths_weaknesses || getDefaultStrengthsWeaknesses(),
        region_wise_analysis: combinedData.region_wise_analysis || getDefaultRegionWiseAnalysis(),
        platform_sentiment_comparison: combinedData.platform_sentiment_comparison || getDefaultPlatformComparison(),
        demographic_support_base: combinedData.demographic_support_base || getDefaultDemographicSupport(),
        executive_summary: combinedData.executive_summary || 'No summary available. Try a different search term or check back later.',
        leader_profile: Array.isArray(combinedData.leader_profile) ? combinedData.leader_profile : [],
        totalResults: newsCount > 0 ? newsCount : 1
      };

      console.log('Processed data:', processedData);
      
      // Update all state with the processed data
      setSearchResults(processedData);
      setCasteData(processedData.caste_distribution);
      setSentimentData(processedData.sentiment_analysis);
      setInsights(processedData.insights);
      setTrends(processedData.trends);
      setStrengthsWeaknesses(processedData.key_strengths_weaknesses);
      setRegionWiseAnalysis(processedData.region_wise_analysis);
      setPlatformComparison(processedData.platform_sentiment_comparison);
      setDemographicSupport(processedData.demographic_support_base);
      setLeaderProfile(processedData.leader_profile);
      setExecutiveSummary(processedData.executive_summary);
      // Set political strategy report data if it exists in the response
      if (processedData.political_strategy_report) {
        setPoliticalStrategyReport({
          political_strategy_report: processedData.political_strategy_report
        });
      }
      
    } catch (error) {
      console.error('Search error:', error);
      
      let errorMessage = error.message || 'An error occurred while processing your request';
      
      // Handle specific error cases
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please try again later.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      setError(errorMessage);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate colors dynamically based on the number of castes
  const getChartColors = (count) => {
    const baseColors = [
      '54, 162, 235',  // Blue
      '255, 99, 132',  // Red
      '255, 206, 86',  // Yellow
      '75, 192, 192',  // Teal
      '153, 102, 255', // Purple
      '255, 159, 64',  // Orange
      '199, 199, 199'  // Gray
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      const color = baseColors[i % baseColors.length];
      colors.push(`rgba(${color}, 0.6)`, `rgba(${color}, 1)`);
    }
    
    return {
      backgroundColors: colors.filter((_, i) => i % 2 === 0),
      borderColors: colors.filter((_, i) => i % 2 === 1)
    };
  };
  
  // Normalize caste distribution to ensure it sums to 100%
  const normalizeCasteDistribution = (distribution) => {
    if (!distribution) return {};
    
    const total = Object.values(distribution).reduce((sum, val) => sum + Math.max(0, val), 0);
    if (total <= 0) return distribution;
    
    const normalized = {};
    Object.entries(distribution).forEach(([caste, value]) => {
      normalized[caste] = Math.min(Math.round((value / total) * 100), 100);
    });
    
    return normalized;
  };

  // Prepare data for charts
  const normalizedCasteData = normalizeCasteDistribution(casteData);
  const casteDistributionData = {
    labels: Object.keys(normalizedCasteData),
    datasets: [{
      label: 'Population %',
      data: Object.values(normalizedCasteData),
      backgroundColor: getChartColors(Object.keys(normalizedCasteData).length).backgroundColors,
      borderColor: getChartColors(Object.keys(normalizedCasteData).length).borderColors,
      borderWidth: 1
    }]
  };

  const sentimentChartData = selectedCaste ? (() => {
    const sentiment = getSentimentData(sentimentData, selectedCaste);
    
    // Ensure we have valid sentiment data
    if (!sentiment || (sentiment.positive === 0 && sentiment.negative === 0 && sentiment.neutral === 0)) {
      // Default to neutral if no data is available
      return {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          label: 'Sentiment Distribution',
          data: [0, 0, 100],
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
          borderWidth: 1
        }]
      };
    }
    
    return {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        label: 'Sentiment Distribution',
        data: [
          sentiment.positive || 0,
          sentiment.negative || 0,
          sentiment.neutral || 0
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
        borderWidth: 1
      }]
    };
  })() : null;

  // Add a ref to the dashboard content
  const dashboardRef = useRef(null);

  // Function to handle PDF export
  

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Download PDF Button */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          <span>Print Report</span>
        </button>
      </div>
      
      {/* Dashboard Content with ID for PDF export */}
      <div id="dashboard-content" ref={dashboardRef} className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Caste Analysis Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Search and analyze data across different castes</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Info */}
        {console.log('Rendering with oppositionTracking:', oppositionTracking)}
        
       
        {/* Search Form */}
        <div className="max-w-5xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter a topic to analyze..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                    ref={searchInputRef}
                  />
                </div>
                {/* <button
                  type="submit"
                  disabled={isLoading || !searchTerm.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button> */}
              </div>
              
              {/* Region and Time Range Selectors */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <div className="space-y-2">
                      <select
                        id="region"
                        value={filters.region}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            region: e.target.value
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                      >
                        {regions.map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </select>
                      {filters.region !== 'all' && (
                        <input
                          type="text"
                          placeholder={`Enter ${regions.find(r => r.value === filters.region)?.label || 'location'}...`}
                          value={selectedLocation[filters.region] || ''}
                          onChange={(e) => {
                            setSelectedLocation(prev => ({
                              ...prev,
                              [filters.region]: e.target.value
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="time-range" className="block text-sm font-medium text-gray-700 mb-1">
                      Time Period
                    </label>
                    <select
                      id="time-range"
                      value={filters.timeRange}
                      onChange={handleTimeRangeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>

                {filters.timeRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="start-date"
                        value={filters.customStartDate}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            customStartDate: e.target.value
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="end-date"
                        value={filters.customEndDate}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            customEndDate: e.target.value
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                        min={filters.customStartDate}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        id="detailed-analysis"
                        type="checkbox"
                        checked={filters.detailed}
                        onChange={(e) => setFilters(prev => ({ ...prev, detailed: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="detailed-analysis" className="font-medium text-gray-700">
                        Enable Detailed Analysis
                      </label>
                      <p className="text-gray-500">Get more in-depth analysis (takes longer)</p>
                    </div>
                  </div>

                  {filters.detailed && (
                    <div className="ml-7 space-y-4 border-l-2 border-gray-200 pl-4 pt-2">
                      <div>
                        <label htmlFor="sentiment-threshold" className="block hidden text-sm font-medium text-gray-700 mb-1">
                          Sentiment Threshold: {filters.sentimentThreshold}%
                        </label>
                        <input
                          type="range"
                          id="sentiment-threshold"
                          min="50"
                          max="100"
                          step="5"
                          value={filters.sentimentThreshold}
                          onChange={(e) => setFilters(prev => ({ ...prev, sentimentThreshold: parseInt(e.target.value) }))}
                          className="w-full h-2 hidden bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Higher values reduce false positives in sentiment detection
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              id="includeSentimentBreakdown"
                              checked={filters.includeSentimentBreakdown}
                              onChange={(e) => setFilters(prev => ({ ...prev, includeSentimentBreakdown: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="includeSentimentBreakdown" className="font-medium text-gray-700">
                              Include Sentiment Breakdown
                            </label>
                            <p className="text-gray-500">Show detailed sentiment analysis by aspect</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              id="includeSourceAnalysis"
                              checked={filters.includeSourceAnalysis}
                              onChange={(e) => setFilters(prev => ({ ...prev, includeSourceAnalysis: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="includeSourceAnalysis" className="font-medium text-gray-700">
                              Include Source Analysis
                            </label>
                            <p className="text-gray-500">Analyze sentiment by news source/platform</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-md mb-3">
                  <div className="text-green-600 text-sm flex-grow">please Continue with the more details</div>
                  <button
                  type="submit"
                  disabled={isLoading || !searchTerm.trim()}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : 'Continue'}
                </button>
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !searchTerm.trim()}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : searchResults ? (
          <div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-gray-500 text-sm font-medium">Total Castes</div>
                <div className="text-2xl font-bold">{Object.keys(searchResults.caste_distribution || {}).length}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-gray-500 text-sm font-medium">Overall Sentiment</div>
                <div className="text-2xl font-bold text-green-600">
                  {searchResults.sentiment_analysis?.overall_sentiment?.positive > 
                   searchResults.sentiment_analysis?.overall_sentiment?.negative ? 'Positive' : 
                   searchResults.sentiment_analysis?.overall_sentiment?.negative > 
                   searchResults.sentiment_analysis?.overall_sentiment?.positive ? 'Negative' : 'Neutral'}
                </div>
                {searchResults.sentiment_analysis?.overall_sentiment && (
                  <div className="text-sm text-gray-500 mt-1">
                    {searchResults.sentiment_analysis.overall_sentiment.positive}% Positive
                  </div>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-gray-500 text-sm font-medium mb-1">Analyzed all news, displaying </div>
                <div className="text-2xl font-bold mb-2">
                  {(searchResults.news?.positive?.length || 0) + 
                   (searchResults.news?.negative?.length || 0) + 
                   (searchResults.news?.neutral?.length || 0)} news
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-green-600 font-medium">{searchResults.news?.positive?.length || 0}</div>
                    <div>Positive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-500 font-medium">{searchResults.news?.neutral?.length || 0}</div>
                    <div>Neutral</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-medium">{searchResults.news?.negative?.length || 0}</div>
                    <div>Negative</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-gray-500 text-sm font-medium mb-1">Time Period</div>
                <div className="text-2xl font-bold mb-2">
                  {filters.timeRange === '90d' ? '90 Days' :
                   filters.timeRange === '6m' ? '6 Months' :
                   filters.timeRange === '1y' ? '1 Year' :
                   filters.timeRange === '2y' ? '2 Years' :
                   filters.timeRange === 'custom' ? 'Custom Range' : 'All Time'}
                </div>
                {filters.timeRange === 'custom' && filters.customStartDate && filters.customEndDate && (
                  <div className="text-sm text-gray-500">
                    {new Date(filters.customStartDate).toLocaleDateString()} - {new Date(filters.customEndDate).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-2 text-xs text-blue-600">
                  Analysis generated: {new Date(searchResults.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            
            
            
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analysis for &ldquo;{searchResults.query}&rdquo;</h2>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>Analysis ID: {searchResults.analysisId || 'N/A'}</span>
                    <span className="mx-2">•</span>
                    <span>Generated: {new Date(searchResults.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2 justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                 
                </div>
              </div>
              
              {/* Analysis Summary */}
              {searchResults.key_insights?.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Key Insights</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                    {searchResults.key_insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Executive Summary */}
              {searchResults.executive_summary && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Summary</h3>
                  <div className="space-y-4 text-gray-700">
                    {Array.isArray(searchResults.executive_summary) ? (
                      // Handle array of paragraphs
                      searchResults.executive_summary.map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))
                    ) : typeof searchResults.executive_summary === 'string' ? (
                      // Handle string with newlines
                      searchResults.executive_summary.split('\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">{paragraph}</p>
                      ))
                    ) : (
                      // Fallback for other formats
                      <p className="leading-relaxed">{JSON.stringify(searchResults.executive_summary)}</p>
                    )}
                  </div>

                  {/* Data Table */}
                  {searchResults.region_wise_analysis[activeRegionTab] && 
                  Object.keys(searchResults.region_wise_analysis[activeRegionTab]).length > 0 && (
                    <div className="overflow-x-auto">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        {{
                          state_level: 'State/Union Territory Level',
                          parliamentary_constituency: 'Parliamentary Constituency Level',
                          assembly_constituency: 'Assembly Constituency Level',
                          district: 'District Level',
                          taluka: 'Taluka Level'
                        }[activeRegionTab]} Analysis
                      </h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {{
                                state_level: 'State/UT',
                                parliamentary_constituency: 'Constituency',
                                assembly_constituency: 'AC',
                                district: 'District',
                                taluka: 'Taluka'
                              }[activeRegionTab]}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(searchResults.region_wise_analysis[activeRegionTab] || {}).map(([location, data]) => (
                            <tr key={location}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{data.positive}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.neutral}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{data.negative}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Leader Profile */}
              {searchResults.leader_profile?.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Leader Profile</h3>
                  <div className="space-y-6">
                    {searchResults.leader_profile.map((leader, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                              {leader.name?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900">{leader.name || 'Unnamed Leader'}</h4>
                            <p className="text-sm text-gray-600 mb-2">{leader.position || 'Political Leader'}</p>
                            
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-700">Influence: <span className="font-medium">{leader.influence_score || 'N/A'}/100</span></span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                leader.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                leader.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leader.sentiment ? 
                                  leader.sentiment.charAt(0).toUpperCase() + leader.sentiment.slice(1) + ' Sentiment' : 
                                  'Neutral Sentiment'}
                              </span>
                            </div>
                            
                            {leader.key_quotes?.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-800 mb-1">Key Quotes:</h5>
                                <ul className="space-y-2">
                                  {leader.key_quotes.map((quote, qIndex) => (
                                    <li key={qIndex} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                                      &ldquo;{quote}&rdquo;
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
              )}
               
              {/* Caste Distribution Chart */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Caste Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-80">
                    <Pie 
                      data={casteDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                              }
                            }
                          }
                        },
                        onClick: (event, elements) => handleCasteSelect(casteData, elements, setSelectedCaste)
                      }}
                    />
                  </div>
                  
                  {/* Caste Sentiment Breakdown */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Sentiment by Caste</h4>
                    <div className="space-y-3">
                      {searchResults.sentiment_analysis?.sentiment_by_caste && Object.entries(searchResults.sentiment_analysis.sentiment_by_caste).map(([caste, sentiment]) => (
                        <div key={caste} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{caste}</span>
                            <div className="flex flex-col items-end space-y-0.5">
                              <span className="text-green-600">+{sentiment.positive}% Positive</span>
                              <span className="text-red-600">-{sentiment.negative}% Negative</span>
                              <span className="text-yellow-500">~{sentiment.neutral}% Neutral</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" 
                              style={{
                                width: '100%',
                                backgroundImage: `linear-gradient(to right, 
                                  #10B981 0% ${sentiment.positive}%, 
                                  #F59E0B ${sentiment.positive}% ${100 - sentiment.negative}%, 
                                  #EF4444 ${100 - sentiment.negative}% 100%)`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Caste Distribution Table */}
                <div className="mt-8 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caste</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.caste_distribution && Object.entries(searchResults.caste_distribution).map(([caste, percentage]) => {
                        const sentiment = searchResults.sentiment_analysis?.sentiment_by_caste?.[caste] || { positive: 0, negative: 0, neutral: 0 };
                        const score = sentiment.positive - sentiment.negative;
                        
                        return (
                          <tr key={caste} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{caste}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{percentage}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-full flex justify-between text-xs">
                                  <span className="text-green-600">+{sentiment.positive}% Positive</span>
                                  <span className="text-yellow-500">~{sentiment.neutral}% Neutral</span>
                                  <span className="text-red-600">-{sentiment.negative}% Negative</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" 
                                    style={{
                                      width: '100%',
                                      backgroundImage: `linear-gradient(to right, 
                                        #10B981 0% ${sentiment.positive}%, 
                                        #F59E0B ${sentiment.positive}% ${100 - sentiment.negative}%, 
                                        #EF4444 ${100 - sentiment.negative}% 100%)`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {score > 0 ? `+${score}` : score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              

              
              {/* Leader Profile Section */}
              {leaderProfile && leaderProfile.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Key Leaders & Influencers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaderProfile.map((leader, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                              {leader.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-md font-medium text-gray-900">{leader.name}</h4>
                            <p className="text-sm text-gray-500 mb-2">{leader.position}</p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Influence: {leader.influence_score}/100</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                leader.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                leader.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leader.sentiment?.charAt(0).toUpperCase() + leader.sentiment?.slice(1)} Sentiment
                              </span>
                            </div>
                            
                            {leader.key_quotes && leader.key_quotes.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Key Quote:</p>
                                <p className="text-xs text-gray-600 italic">&ldquo;{leader.key_quotes[0]}&rdquo;</p>
                              </div>
                            )}
                            
                            {leader.recent_activities && leader.recent_activities.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Recent Activity:</p>
                                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                                  {leader.recent_activities.slice(0, 2).map((activity, i) => (
                                    <li key={i}>{activity}</li>
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
              )}
              
              {/* Sentiment Breakdown Section */}
              {filters.detailed && filters.includeSentimentBreakdown && searchResults.sentiment_analysis?.sentiment_breakdown && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Sentiment Breakdown</h3>
                  
                  {/* Sentiment Intensity */}
                  <div className="mb-8">
                    <h4 className="text-md font-medium text-gray-800 mb-4">Sentiment Intensity</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries({
                        'Strongly Positive': searchResults.sentiment_analysis.sentiment_breakdown.intensity_analysis.strongly_positive,
                        'Positive': searchResults.sentiment_analysis.sentiment_breakdown.intensity_analysis.positive,
                        'Neutral': searchResults.sentiment_analysis.sentiment_breakdown.intensity_analysis.neutral,
                        'Negative': searchResults.sentiment_analysis.sentiment_breakdown.intensity_analysis.negative,
                        'Strongly Negative': searchResults.sentiment_analysis.sentiment_breakdown.intensity_analysis.strongly_negative
                      }).map(([label, value]) => (
                        <div key={label} className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                          <div className="text-2xl font-bold text-gray-800">
                            {value}%
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Key Phrases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">Positive Phrases</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.sentiment_analysis.sentiment_breakdown.key_phrases.positive.length > 0 ? (
                          searchResults.sentiment_analysis.sentiment_breakdown.key_phrases.positive.map((phrase, index) => (
                            <span 
                              key={`positive-${index}`} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors"
                            >
                              {phrase}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No positive phrases found</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">Negative Phrases</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.sentiment_analysis.sentiment_breakdown.key_phrases.negative.length > 0 ? (
                          searchResults.sentiment_analysis.sentiment_breakdown.key_phrases.negative.map((phrase, index) => (
                            <span 
                              key={`negative-${index}`} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors"
                            >
                              {phrase}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No negative phrases found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Render Assembly Leader Report if data exists */}
            {searchResults.assembly_leader_report && (
              <AssemblyLeaderReport report={searchResults} />
            )}
              {/* Political Strategy Report */}
              {politicalStrategyReport && (
                <PoliticalStrategyReport report={politicalStrategyReport} />
              )}
              
              {/* Opposition Tracking Section */}
        {oppositionTracking && (
          <div className="bg-white shadow rounded-lg p-6 mt-10 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Opposition Activity Tracker</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">Timeframe Analyzed</h3>
                <p className="mt-1 text-sm text-gray-600">{oppositionTracking.timeframe_analyzed || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Sentiment */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Overall Sentiment Towards Opposition</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-green-700">Positive</span>
                      <span className="text-sm text-gray-700">{oppositionTracking.overall_sentiment_towards_opposition.positive || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-yellow-600">Neutral</span>
                      <span className="text-sm text-gray-700">{oppositionTracking.overall_sentiment_towards_opposition.neutral || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-red-600">Negative</span>
                      <span className="text-sm text-gray-700">{oppositionTracking.overall_sentiment_towards_opposition.negative || 'N/A'}</span>
                    </div>
                  </div>
                  {oppositionTracking.overall_sentiment_towards_opposition.summary && (
                    <div className="mt-3 p-3 bg-white border rounded-md">
                      <p className="text-sm text-gray-700">{oppositionTracking.overall_sentiment_towards_opposition.summary}</p>
                    </div>
                  )}
                </div>

                {/* Narrative Recommendations */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Strategy</h3>
                  {oppositionTracking.narrative_recommendations.content_strategy && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Content Strategy</h4>
                      <p className="text-sm text-gray-600">{oppositionTracking.narrative_recommendations.content_strategy}</p>
                    </div>
                  )}
                  
                  {oppositionTracking.narrative_recommendations.target_demographics?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Target Demographics</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {oppositionTracking.narrative_recommendations.target_demographics.map((demo, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {demo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {oppositionTracking.narrative_recommendations.platform_priorities?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Platform Priorities</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {oppositionTracking.narrative_recommendations.platform_priorities.map((platform, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Opposition Parties */}
              {oppositionTracking.opposition_parties?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Opposition Parties Activity</h3>
                  <div className="space-y-4">
                    {oppositionTracking.opposition_parties.map((party, partyIdx) => (
                      <div key={partyIdx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{party.name}</h4>
                            {party.key_leaders?.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Key Leaders: {party.key_leaders.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {party.digital_campaigns?.length > 0 && (
                          <div className="mt-3 space-y-3">
                            <h5 className="text-sm font-medium text-gray-700">Recent Campaigns</h5>
                            <div className="space-y-4">
                              {party.digital_campaigns.map((campaign, campIdx) => (
                                <div key={campIdx} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-1">
                                        {campaign.platform}
                                      </span>
                                      <p className="text-sm font-medium text-gray-900">{campaign.campaign_theme}</p>
                                      {campaign.sentiment_polarity && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                          campaign.sentiment_polarity === 'positive' 
                                            ? 'bg-green-100 text-green-800' 
                                            : campaign.sentiment_polarity === 'negative' 
                                              ? 'bg-red-100 text-red-800' 
                                              : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {campaign.sentiment_polarity.charAt(0).toUpperCase() + campaign.sentiment_polarity.slice(1)} Sentiment
                                        </span>
                                      )}
                                    </div>
                                    {campaign.engagement_metrics && (
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500">Engagement</div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {campaign.engagement_metrics.likes || 0} 👍 • {campaign.engagement_metrics.shares || 0} 🔄
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Reach: {campaign.engagement_metrics.reach_estimate?.toLocaleString() || 'N/A'}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {campaign.observations && (
                                    <p className="mt-2 text-sm text-gray-600">{campaign.observations}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Counter Narratives */}
              {oppositionTracking.narrative_recommendations?.recommended_counter_narratives?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">Recommended Counter Narratives</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {oppositionTracking.narrative_recommendations.recommended_counter_narratives.map((narrative, idx) => (
                      <li key={idx} className="text-sm text-blue-700">{narrative}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

              {/* News Section */}
              {searchResults.news && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Latest News Coverage</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Positive News */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Positive News
                      </h4>
                      {searchResults.news.positive && searchResults.news.positive.length > 0 ? (
                        searchResults.news.positive.map((item, index) => (
                          <div key={`positive-${index}`} className="mb-4 p-4 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-gray-900">{item.headline}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span>{item.source}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No positive news found</p>
                      )}
                    </div>
                    
                    {/* Negative News */}
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Negative News
                      </h4>
                      {searchResults.news.negative && searchResults.news.negative.length > 0 ? (
                        searchResults.news.negative.map((item, index) => (
                          <div key={`negative-${index}`} className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-sm transition-shadow">
                            <h5 className="font-medium text-gray-900">{item.headline}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                            
                            {/* Impact Analysis */}
                            {item.impact_analysis && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded text-sm">
                                <div className="flex items-start">
                                  <span className="text-red-600 mr-2">⚠️</span>
                                  <div>
                                    <span className="font-medium text-red-800">Impact:</span>
                                    <p className="text-gray-700 mt-1">{item.impact_analysis}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Resolution Suggestions */}
                            {(() => {
                              const suggestions = Array.isArray(item.resolution_suggestions) 
                                ? item.resolution_suggestions 
                                : (item.resolution_suggestions && typeof item.resolution_suggestions === 'string' && item.resolution_suggestions.split) 
                                  ? item.resolution_suggestions.split(',').map(s => s.trim()).filter(Boolean)
                                  : [];
                              
                              console.log('Processed resolution suggestions:', suggestions);
                              
                              if (!suggestions.length) return null;
                              
                              return (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded text-sm">
                                  <div className="flex items-start">
                                    <span className="text-amber-600 mr-2">💡</span>
                                    <div>
                                      <span className="font-medium text-amber-800">Suggested Resolutions:</span>
                                      <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                                        {suggestions.map((suggestion, i) => (
                                          <li key={i} className="text-sm">{suggestion}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* Source and Date */}
                            <div className="mt-3 flex items-center text-xs text-gray-500">
                              <span className="font-medium">{item.source}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(item.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                            
                            {/* Sentiment Score */}
                            {item.sentiment_score && (
                              <div className="mt-2 flex items-center text-xs">
                                <span className="text-gray-500 mr-2">Sentiment:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.sentiment_score < -0.5 ? 'bg-red-100 text-red-800' :
                                  item.sentiment_score < 0 ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {item.sentiment_score.toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {/* Key Phrases */}
                            {item.key_phrases && item.key_phrases.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.key_phrases.map((phrase, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {phrase}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No negative news found</p>
                      )}
                    </div>
                    
                    {/* Neutral News */}
                    <div className="border-l-4 border-gray-400 pl-4">
                      <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Neutral News
                      </h4>
                      {searchResults.news.neutral && searchResults.news.neutral.length > 0 ? (
                        searchResults.news.neutral.map((item, index) => (
                          <div key={`neutral-${index}`} className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900">{item.headline}</h5>
                            <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span>{item.source}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No neutral news found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Platform Sentiment Comparison */}
              {filters.detailed && searchResults.platform_sentiment_comparison && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Sentiment by Platform</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(searchResults.platform_sentiment_comparison)
                      .filter(([platform]) => platform !== 'Overall')
                      .map(([platform, data]) => {
                        // Ensure data is in the correct format
                        const sentimentData = typeof data === 'object' && data !== null 
                          ? data 
                          : { 
                              positive: typeof data === 'number' ? data : 0, 
                              negative: typeof data === 'number' ? 100 - data : 0, 
                              neutral: 0 
                            };
                        
                        // Ensure values are numbers and within 0-100 range
                        const positive = Math.min(100, Math.max(0, Number(sentimentData.positive || 0)));
                        const negative = Math.min(100, Math.max(0, Number(sentimentData.negative || 0)));
                        const neutral = Math.min(100, Math.max(0, Number(sentimentData.neutral || 0)));
                        
                        // Calculate the gradient stops
                        const positiveStop = positive;
                        const neutralStart = positive;
                        const neutralEnd = 100 - negative;
                        
                        return (
                          <div key={platform} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-3">
                              <div className="w-24 font-medium text-gray-800">
                                {platform.replace('X', '//X')}
                              </div>
                              <div className="flex-1 ml-2">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div 
                                    className="h-full rounded-full"
                                    style={{
                                      width: '100%',
                                      backgroundImage: `linear-gradient(to right, 
                                        #10B981 0% ${positive}%, 
                                        #F59E0B ${neutralStart}% ${neutralEnd}%, 
                                        #EF4444 ${100 - negative}% 100%)`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded bg-green-50">
                                <div className="text-green-600 font-medium">+{positive.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">Positive</div>
                              </div>
                              <div className="p-2 rounded bg-yellow-50">
                                <div className="text-yellow-500 font-medium">~{neutral.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">Neutral</div>
                              </div>
                              <div className="p-2 rounded bg-red-50">
                                <div className="text-red-600 font-medium">-{negative.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">Negative</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
              {/* Region-wise Analysis */}
              {filters.detailed && searchResults.region_wise_analysis && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Regional Sentiment Analysis</h3>
                  
                  {/* Tabs for different location levels */}
                  <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {Object.entries({
                        state_level: 'State/UT',
                        parliamentary_constituency: 'Parliamentary',
                        assembly_constituency: 'Assembly',
                        district: 'District',
                        taluka: 'Taluka'
                      }).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setActiveRegionTab(key)}
                          className={`${activeRegionTab === key
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          {label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Chart */}
                  <div className="h-96 mb-8">
                    {searchResults.region_wise_analysis[activeRegionTab] && 
                    Object.keys(searchResults.region_wise_analysis[activeRegionTab]).length > 0 ? (
                      <Bar
                        data={{
                          labels: Object.keys(searchResults.region_wise_analysis[activeRegionTab] || {}),
                          datasets: [
                            {
                              label: 'Positive',
                              backgroundColor: 'rgba(16, 185, 129, 0.7)',
                              borderColor: 'rgba(16, 185, 129, 1)',
                              borderWidth: 1,
                              data: Object.values(searchResults.region_wise_analysis[activeRegionTab] || {}).map(data => data.positive),
                            },
                            {
                              label: 'Neutral',
                              backgroundColor: 'rgba(156, 163, 175, 0.7)',
                              borderColor: 'rgba(156, 163, 175, 1)',
                              borderWidth: 1,
                              data: Object.values(searchResults.region_wise_analysis[activeRegionTab] || {}).map(data => data.neutral),
                            },
                            {
                              label: 'Negative',
                              backgroundColor: 'rgba(239, 68, 68, 0.7)',
                              borderColor: 'rgba(239, 68, 68, 1)',
                              borderWidth: 1,
                              data: Object.values(searchResults.region_wise_analysis[activeRegionTab] || {}).map(data => data.negative),
                            },
                          ],
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              beginAtZero: true,
                              max: 100,
                              title: {
                                display: true,
                                text: 'Percentage (%)',
                              },
                            },
                            y: {
                              ticks: {
                                autoSkip: false,
                                maxRotation: 45,
                                minRotation: 45,
                              },
                            },
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  return `${label}: ${value}%`;
                                },
                              },
                            },
                            legend: {
                              position: 'top',
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No data available for this location level
                      </div>
                    )}
                  </div>

                  {/* Data Table */}
                  {searchResults.region_wise_analysis[activeRegionTab] && 
                  Object.keys(searchResults.region_wise_analysis[activeRegionTab]).length > 0 && (
                    <div className="overflow-x-auto mt-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3">
                        {{
                          state_level: 'State/Union Territory Level',
                          parliamentary_constituency: 'Parliamentary Constituency Level',
                          assembly_constituency: 'Assembly Constituency Level',
                          district: 'District Level',
                          taluka: 'Taluka Level'
                        }[activeRegionTab]} Analysis
                      </h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {{
                                state_level: 'State/UT',
                                parliamentary_constituency: 'Constituency',
                                assembly_constituency: 'AC',
                                district: 'District',
                                taluka: 'Taluka'
                              }[activeRegionTab]}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(searchResults.region_wise_analysis[activeRegionTab] || {}).map(([location, data]) => (
                            <tr key={location}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{data.positive}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.neutral}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{data.negative}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
              
              {/* Key Strengths & Weaknesses */}
              {filters.detailed && searchResults.key_strengths_weaknesses && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Key Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-green-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {searchResults.key_strengths_weaknesses.strengths.map((strength, index) => (
                          <li key={`strength-${index}`} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Weaknesses
                      </h4>
                      <ul className="space-y-2">
                        {searchResults.key_strengths_weaknesses.weaknesses.map((weakness, index) => (
                          <li key={`weakness-${index}`} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Assembly Leader Report */}
              {searchResults.assembly_leader_report && (
                <div className="mt-8">
                  <AssemblyLeaderReport report={searchResults.assembly_leader_report} />
                </div>
              )}
              
              {/* Local and Hyperlocal Issues */}
              {searchResults.local_hyperlocal_issues && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Local & Hyperlocal Issues</h2>
                  <LocalHyperlocalIssues issues={searchResults.local_hyperlocal_issues} />
                </div>
              )}
              
              {/* Key Insights */}
              {(searchResults.key_insights?.length > 0) && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Key Insights</h3>
                  <div className="space-y-4">
                    {searchResults.key_insights.map((insight, index) => (
                      <div key={`insight-${index}`} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trends */}
              {(searchResults.trends?.length > 0) && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Emerging Trends</h3>
                  <div className="space-y-4">
                    {searchResults.trends.map((trend, index) => (
                      <div key={`trend-${index}`} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-400">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-700">
                              {trend}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Demographic Support Base */}
              {filters.detailed && searchResults.demographic_support_base && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Demographic Support Base</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Age Groups */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">By Age Group</h4>
                      <div className="space-y-4">
                        {Object.entries({
                          'Youth (18-35)': searchResults.demographic_support_base['Youth (18-35)'],
                          'Middle-age (36-55)': searchResults.demographic_support_base['Middle-age (36-55)'],
                          'Senior (56+)': searchResults.demographic_support_base['Senior (56+)']
                        }).map(([ageGroup, percentage]) => (
                          <div key={ageGroup}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{ageGroup}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div 
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">By Location</h4>
                      <div className="space-y-4">
                        {Object.entries({
                          'Urban': searchResults.demographic_support_base['Urban'],
                          'Rural': searchResults.demographic_support_base['Rural']
                        }).map(([location, percentage]) => (
                          <div key={location}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{location}</span>
                              <span className="font-medium">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div 
                                className={`h-full rounded-full ${
                                  location === 'Urban' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Overall Support */}
                        <div className="pt-4 mt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <h4 className="text-md font-medium text-gray-800">Overall Support</h4>
                            <span className="text-2xl font-bold text-blue-600">
                              {searchResults.demographic_support_base['Overall']}%
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Based on weighted average across all demographic groups
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Demographic support is calculated based on sentiment analysis across different age groups and locations, weighted by their representation in the population.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Platform Sentiment Comparison */}
              {searchResults.platform_sentiment_comparison && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Platform Sentiment Comparison</h3>
                  <div className="space-y-6">
                    {Object.entries(searchResults.platform_sentiment_comparison).map(([platform, data]) => (
                      <div key={platform} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">{platform}</span>
                          <div className="flex items-center">
                            <span className={`text-sm font-semibold ${
                              data.score >= 60 ? 'text-green-600' : 
                              data.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {data.score}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">Overall</span>
                          </div>
                        </div>
                        
                        {/* Sentiment Bars */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {/* Positive */}
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-green-600">Positive</span>
                              <span>{data.positive}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${data.positive}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Neutral */}
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-yellow-600">Neutral</span>
                              <span>{data.neutral}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500"
                                style={{ width: `${data.neutral}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Negative */}
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-red-600">Negative</span>
                              <span>{data.negative}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500"
                                style={{ width: `${data.negative}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Sentiment analysis across different social media platforms shows how the topic is being discussed in various online communities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sentiment Analysis Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sentiment Analysis</h2>
                <SentimentAnalysisSection />
              </div>
              
              
              
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No search performed</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a search term above to analyze data across different castes.
              </p>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  );
};