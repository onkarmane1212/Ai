'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiHome, 
  FiUsers, 
  FiMap, 
  FiTrendingUp,
  FiMessageSquare,
  FiAward,
  FiBarChart2,
  FiPieChart,
  FiTarget,
  FiGlobe,
  FiClock,
  FiUser,
  FiLayers,
  FiActivity,
  FiAlertTriangle,
  FiThumbsUp,
  FiThumbsDown,
  FiChevronRight,
  FiMapPin
} from 'react-icons/fi';

// Import Tab Components
import dynamic from 'next/dynamic';

// Use dynamic imports for better performance
const StrategyTab = dynamic(
  () => import('./components/StrategyTab'),
  { ssr: false }
);

const CasteSubcasteTab = dynamic(
  () => import('./components/CasteSubcasteTab'),
  { ssr: false }
);

const ProfileSummaryTab = dynamic(
  () => import('./components/ProfileSummaryTab'),
  { ssr: false }
);

const LocalHyperlocalTab = dynamic(
  () => import('./components/LocalHyperlocalTab'),
  { ssr: false }
);

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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Region options for the dropdown with hierarchy
const regionOptions = [
  { value: 'all', label: 'All India' },
  { value: 'state', label: 'State / UT' },
  { value: 'pc', label: 'Parliamentary Constituency' },
  { value: 'ac', label: 'Assembly Constituency' },
  { value: 'district', label: 'District' },
  { value: 'taluka', label: 'Taluka' }
];

// Tab configurations
const tabs = [
  // { id: 'strategy', name: 'Strategy', icon: <FiTrendingUp className="mr-2" /> },
  // { id: 'overview', name: 'Overview', icon: <FiHome className="mr-2" /> },
  { id: 'profile', name: 'Profile/Summary', icon: <FiUser className="mr-2" /> },
  { id: 'sentiment', name: 'Sentiment', icon: <FiMessageSquare className="mr-2" /> },
  { id: 'caste', name: 'Caste', icon: <FiUsers className="mr-2" /> },
  {id:'local',name:'Local/Hyperlocal',icon:<FiMapPin className="mr-2" />},
  { id: 'caste-subcaste', name: 'Caste/Subcaste', icon: <FiActivity className="mr-2" /> },
  { id: 'region', name: 'Region', icon: <FiMap className="mr-2" /> },
  { id: 'platform', name: 'Platform', icon: <FiLayers className="mr-2" /> },
  { id: 'news', name: 'News', icon: <FiAward className="mr-2" /> },
  { id: 'leaders', name: 'Leaders', icon: <FiUser className="mr-2" /> },
  { id: 'opposition', name: 'Opposition', icon: <FiTarget className="mr-2" /> },
];

const AnalysisSources = () => (
  <div className="mt-6 bg-white rounded-lg shadow p-4">
    <p className="text-sm text-gray-600 text-center mb-3">
      Analysed from inputs received from all media and social media
    </p>
    <div className="flex flex-wrap justify-center items-center gap-6">
      <img src="/google.svg" alt="Google" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      <img src="/facebook.svg" alt="Facebook" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      <img src="/youtube.svg" alt="YouTube" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      <img src="/instagram.svg" alt="Instagram" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      <img src="/sharechat.svg" alt="ShareChat" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
      <img src="/x-twitter.svg" alt="X (Twitter)" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
    </div>
  </div>
);

const Dashboard = () => {
  const router = useRouter();
  const hasFetchedRegionData = useRef(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaste, setSelectedCaste] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionError, setRegionError] = useState(null);
  
  // State for strategy report
  

  // Define fetchRegionData before using it in useEffect
  const fetchRegionData = useCallback(async () => {
    if (activeTab !== 'region') return;
    
    setRegionLoading(true);
    setRegionError(null);
    
    try {
      const response = await fetch('/api/region', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery || 'Current political sentiment analysis',
          region: selectedRegion,
          timeRange: timeRange
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch region data');
      }

      const data = await response.json();
      
      // Update dashboard data with region data
      setDashboardData(prev => ({
        ...prev,
        region: { region_analysis: data.region_analysis }
      }));
    } catch (error) {
      console.error('Error fetching region data:', error);
      setRegionError(error.message);
    } finally {
      setRegionLoading(false);
    }
  }, [activeTab, searchQuery, selectedRegion, timeRange]);

  // Handle region data fetching
  useEffect(() => {
    // Reset fetch state when tab changes to region
    if (activeTab === 'region') {
      hasFetchedRegionData.current = false;
    }
  }, [activeTab]);

  // State for sentiment analysis
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState(null);

  // Fetch sentiment data when sentiment tab is active
  useEffect(() => {
    const fetchSentimentData = async () => {
      if (activeTab !== 'sentiment' || !searchQuery.trim()) return;
      
      setSentimentLoading(true);
      setSentimentError(null);
      
      try {
        const response = await fetch('/api/sentiment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            options: {
              region: selectedRegion,
              timeRange: timeRange,
              sentimentThreshold: 0.6,
              includeSentimentBreakdown: true,
              includeSourceAnalysis: true
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }

        const data = await response.json();
        setSentimentData(data);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setSentimentError(error.message);
      } finally {
        setSentimentLoading(false);
      }
    };

    const fetchData = async () => {
      if (activeTab === 'region' && !hasFetchedRegionData.current) {
        hasFetchedRegionData.current = true;
        await fetchRegionData();
      } else if (activeTab === 'sentiment') {
        await fetchSentimentData();
      } 
    };

    fetchData();
  }, [activeTab, selectedRegion, timeRange, fetchRegionData, searchQuery]);
  
  // Initialize all API data states
  const [dashboardData, setDashboardData] = useState({
    executiveSummary: null,
    sentiment: null,
    casteData: {
      constituency: '',
      total_population_estimate: 0,
      caste_distribution: [],
      surname_to_caste_map: {}
    },
    platformSentiment: null,
    newsData: null,
    assemblyLeaders: null,
    oppositionTracking: null,
    politicalStrategyReport: null,
    leaderProfile: null,
    isLoading: true,
    error: null
  });
  
  // Tab configurations (moved to be used in the tabs component)

  // Process caste data for visualization
  const processCasteData = (casteData) => {
    if (!casteData || !casteData.caste_distribution) return null;
    
    const labels = casteData.caste_distribution.map(item => item.caste);
    const populationData = casteData.caste_distribution.map(item => item.approx_population);
    const percentages = casteData.caste_distribution.map(item => item.percentage);
    
    return {
      labels,
      datasets: [
        {
          label: 'Population',
          data: populationData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!searchQuery.trim()) {
      setDashboardData(prev => ({
        ...prev,
        error: 'Please enter a search query',
        isLoading: false
      }));
      return;
    }
    
    setIsLoading(true);
    try {
      // Reset selected caste when making a new search
      setSelectedCaste('all');
      
      // Prepare request body with proper structure for each API
      const baseRequest = { query: searchQuery, name: searchQuery, region: selectedRegion, timeRange: timeRange };
      
      // Platform sentiment API expects options object
      const platformSentimentRequest = {
        query: searchQuery,
        options: {
          timeRange,
          region: selectedRegion,
          sentimentThreshold: 0.6 // Add default threshold
        }
      };
      
      // Define all API endpoints
      // Define all API endpoints with their status and custom request bodies
      const endpoints = [
        { 
          key: 'executiveSummary', 
          url: '/api/executive-summary',
          body: baseRequest
        },
        { 
          key: 'sentiment', 
          url: '/api/sentiment',
          body: baseRequest
        },
        { 
          key: 'casteData', 
          url: '/api/castewiseDetails',
          body: baseRequest
        },
        { 
          key: 'caste', 
          url: '/api/caste',
          body: baseRequest
        },
        { 
          key: 'regionData', 
          url: '/api/region',
          body: baseRequest
        },
        { 
          key: 'platformSentiment', 
          url: '/api/platform-sentiment',
          body: platformSentimentRequest // Use the specially formatted request
        },
        { 
          key: 'newsData', 
          url: '/api/news',
          body: baseRequest
        },
        { 
          key: 'assemblyLeaders', 
          url: '/api/assemblyLeaders',
          body: baseRequest
        },
        { 
          key: 'oppositionTracking', 
          url: '/api/oppositionTracking',
          body: baseRequest
        },
        { 
          key: 'politicalStrategyReport', 
          url: '/api/politicalStrategyReport',
          body: baseRequest
        },
        { 
          key: 'leaderProfile', 
          url: '/api/leader-profile',
          body: baseRequest
        },
        {
          key: 'localAndHyperlocal',
          url: '/api/localAndHyperlocal',
          body: baseRequest
        },
      ].filter(Boolean); // Remove any falsy values
      
      // Fetch all data in parallel with POST requests
      const responses = await Promise.allSettled(
        endpoints.map(endpoint =>
          fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpoint.body || baseRequest)
          })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => ({
            status: 'fulfilled',
            key: endpoint.key,
            data
          }))
          .catch(error => ({
            status: 'rejected',
            key: endpoint.key,
            reason: error.message
          }))
        )
      );

      // Process responses
      const newData = {
        isLoading: false,
        error: null
      };
      const errors = [];
      
      responses.forEach((response) => {
        if (response.status === 'fulfilled' && response.value?.status === 'fulfilled') {
          // Special handling for caste data
          if (response.value.key === 'casteData') {
            try {
              // Ensure the data matches our expected structure
              if (response.value.data && response.value.data.caste_distribution) {
                newData[response.value.key] = {
                  ...response.value.data,
                  caste_distribution: response.value.data.caste_distribution.map(item => ({
                    ...item,
                    approx_population: Number(item.approx_population) || 0,
                    percentage: parseFloat(item.percentage) || 0
                  }))
                };
              } else {
                throw new Error('Invalid caste data structure');
              }
            } catch (error) {
              console.error('Error processing caste data:', error);
              errors.push('casteData');
              newData.casteData = { error: 'Failed to process caste data' };
            }
          } else {
            newData[response.value.key] = response.value.data;
          }
        } else {
          const errorKey = response.reason?.key || response.value?.key || 'unknown';
          const errorMsg = response.reason?.message || 'Unknown error';
          console.error(`Error fetching ${errorKey}:`, errorMsg);
          errors.push(errorKey);
          newData[errorKey] = { error: errorMsg };
        }
      });
      
      // Update state with all responses
      setDashboardData(prev => ({
        ...prev,
        ...newData,
        isLoading: false,
        error: errors.length > 0 ? `Failed to load ${errors.length} data sources` : null
      }));
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchDashboardData();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Analyzing data for {searchQuery}...</p>
        </div>
      </div>
    );
  }

  // Initial search state
  if (!dashboardData.executiveSummary && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Political Analytics Dashboard</h1>
            <p className="text-gray-600">Gain insights into political sentiment, demographics, and strategy</p>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                placeholder="Search for a leader, political party, or constituency..."
                required
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <div className="w-full sm:w-auto">
                <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="1m">Last month</option>
                  <option value="3m">Last 3 months</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  id="region"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="caste" className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                <select
                  id="caste"
                  value={selectedCaste}
                  onChange={(e) => setSelectedCaste(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Castes</option>
                  <option value="general">General</option>
                  <option value="obc">OBC</option>
                  <option value="sc">SC</option>
                  <option value="st">ST</option>
                </select>
              </div>
              
              <div className="w-full sm:w-auto flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiSearch className="mr-2" />
                  Analyze
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-12">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Trending Searches:</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                'Narendra Modi', 'Rahul Gandhi', 'Amit Shah',
                'Uttar Pradesh', 'West Bengal', 'Tamil Nadu',
                'BJP', 'Congress', 'AAP', 'TMC', 'DMK', 'BSP'
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    // Small delay to allow state to update before fetching
                    setTimeout(() => document.querySelector('form').requestSubmit(), 100);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-800 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from all APIs
  const extractedSentimentData = dashboardData.sentiment?.sentiment_analysis || {};
  const casteData = dashboardData.caste?.caste_analysis || {};
  const platformSentiment = dashboardData.platformSentiment?.platform_analysis || {};
  
  // Process news data to combine all sentiment categories
  const newsData = [
    ...((dashboardData.newsData?.news?.positive || []).map(item => ({ ...item, sentiment: 'positive' }))),
    ...((dashboardData.newsData?.news?.negative || []).map(item => ({ ...item, sentiment: 'negative' }))),
    ...((dashboardData.newsData?.news?.neutral || []).map(item => ({ ...item, sentiment: 'neutral' })))
  ];
  
  const assemblyLeaders = dashboardData.assemblyLeaders?.assembly_leader_report || null;
  const castewiseDetails = dashboardData.castewiseDetails?.details || [];
  const localAndHyperlocal = dashboardData.localAndHyperlocal?.data || [];
  const oppositionTracking = dashboardData.oppositionTracking?.data || [];
  const politicalStrategy = dashboardData.politicalStrategyReport?.strategy || [];
  const leaderProfile = dashboardData.leaderProfile?.profile || {};

  // Chart data configurations
  const sentimentChartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [
        sentimentData?.overall_sentiment?.positive || 0,
        sentimentData?.overall_sentiment?.negative || 0,
        sentimentData?.overall_sentiment?.neutral || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', // Green
        'rgba(239, 68, 68, 0.8)',  // Red
        'rgba(156, 163, 175, 0.8)' // Gray
      ],
      borderWidth: 0
    }]
  };

  const platformChartData = platformSentiment?.platforms?.length > 0 ? {
    labels: platformSentiment.platforms.map(p => p.name),
    datasets: [
      {
        label: 'Sentiment Score',
        backgroundColor: (context) => {
          const value = context.raw;
          if (value >= 0.6) return 'rgba(16, 185, 129, 0.8)';
          if (value <= 0.4) return 'rgba(239, 68, 68, 0.8)';
          return 'rgba(156, 163, 175, 0.8)';
        },
        data: platformSentiment.platforms.map(p => p.metrics?.sentiment_score || 0),
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Mention Volume',
        type: 'line',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointRadius: 4,
        fill: false,
        data: platformSentiment.platforms.map(p => p.metrics?.mention_volume || 0),
        yAxisID: 'y1',
      }]
  } : null;

  const platformChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sentiment Analysis by Platform',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const platform = platformSentiment?.platforms?.[context.dataIndex];
            if (context.dataset.label === 'Sentiment Score') {
              return `Sentiment: ${(context.raw * 100).toFixed(1)}%`;
            } else {
              return `Mentions: ${context.raw.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'Sentiment Score (0-1)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Mention Volume'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const casteChartData = casteData ? {
    labels: Object.keys(casteData.caste_distribution || {}),
    datasets: [{
      data: Object.values(casteData.caste_distribution || {}),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',  // Blue
        'rgba(245, 158, 11, 0.8)',  // Amber
        'rgba(16, 185, 129, 0.8)',  // Emerald
        'rgba(139, 92, 246, 0.8)',  // Violet
        'rgba(20, 184, 166, 0.8)'   // Teal
      ]
    }]
  } : null;

  const regionChartData = dashboardData.region?.region_analysis?.region_wise_sentiment ? {
    labels: dashboardData.region.region_analysis.region_wise_sentiment.map(r => r.region),
    datasets: [{
      label: 'Support Base %',
      data: dashboardData.region.region_analysis.region_wise_sentiment.map(r => r.support_base_percentage || 0),
      backgroundColor: 'rgba(99, 102, 241, 0.8)'
    }]
  } : null;

  // Helper function to render metric card
  const MetricCard = ({ title, value, icon, color = 'indigo' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  // Helper function to render section header
  const SectionHeader = ({ title, description }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );

  // Region options are now defined at the top of the file

  // Tabs configuration
  const tabs = [
    // { id: 'strategy', name: 'Strategy', icon: <FiTrendingUp className="mr-2" /> },
    // { id: 'overview', name: 'Overview', icon: <FiHome className="mr-2" /> },
    { id: 'profile', name: 'Profile/Summary', icon: <FiUser className="mr-2" /> },
    { id: 'sentiment', name: 'Sentiment', icon: <FiMessageSquare className="mr-2" /> },
    { id: 'caste', name: 'Caste', icon: <FiUsers className="mr-2" /> },
    {id:'local',name:'Local/Hyperlocal',icon:<FiMapPin className="mr-2" />},
    { id: 'caste-subcaste', name: 'Caste/Subcaste', icon: <FiActivity className="mr-2" /> },
    { id: 'region', name: 'Region', icon: <FiMap className="mr-2" /> },
    { id: 'platform', name: 'Platform', icon: <FiLayers className="mr-2" /> },
    { id: 'news', name: 'News', icon: <FiAward className="mr-2" /> },
    { id: 'leaders', name: 'Leaders', icon: <FiUser className="mr-2" /> },
    { id: 'opposition', name: 'Opposition', icon: <FiTarget className="mr-2" /> },
  ];

  // Get the display name for the selected region
  const getRegionDisplayName = (value) => {
    const region = regionOptions.find(r => r.value === value);
    return region ? region.label : 'All India';
  };

  // Render caste distribution chart
  const renderCasteChart = () => {
    if (dashboardData.isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (dashboardData.casteData?.error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {dashboardData.casteData.error}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const chartData = processCasteData(dashboardData.casteData);
    
    if (!chartData) {
      return (
        <div className="text-center py-8 text-gray-500">
          No caste distribution data available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Caste Distribution - {dashboardData.casteData.constituency || 'Constituency'}</h3>
          <div className="h-64">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = dashboardData.casteData.total_population_estimate;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Population'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Caste'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Caste Distribution Table */}
        <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Caste Information</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caste</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Surnames</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Political Influence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.casteData.caste_distribution?.map((caste, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{caste.caste}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caste.approx_population?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{caste.percentage?.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {caste.dominant_surnames?.map((surname, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {surname}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{caste.political_influence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };





  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header with search */}
      <header className="bg-white shadow rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Political Analytics Dashboard</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  Analysis for: <span className="font-medium">{searchQuery || 'All'}</span>
                  {selectedRegion !== 'all' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {getRegionDisplayName(selectedRegion)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchDashboardData()}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Search leader, party, or constituency..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-full min-w-[200px]">
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
                  >
                    {regionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiSearch className="mr-2 h-4 w-4" />
                Search
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('all');
                  fetchDashboardData();
                }}
                className="inline-flex items-center px-3 py-2.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-xl shadow overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Local/Hyperlocal Tab */}
        {activeTab === 'local' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-xl p-6">
              <LocalHyperlocalTab query={searchQuery} />
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {dashboardData.politicalStrategyReport ? (
              <StrategyTab data={dashboardData.politicalStrategyReport} />
            ) : (
              <div className="bg-white shadow rounded-xl p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Loading strategy data...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caste Analysis Tab */}
        {activeTab === 'caste' && (
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Caste Wise Analysis</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCaste}
                  onChange={(e) => setSelectedCaste(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
                >
                  <option value="all">All Castes</option>
                  {dashboardData.casteData?.caste_distribution?.map((caste, index) => (
                    <option key={index} value={caste.caste}>
                      {caste.caste}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            {renderCasteChart()}
          </div>
        )}

        {/* Caste/Subcaste Analysis Tab */}
        {activeTab === 'caste-subcaste' && (
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Caste & Subcaste Analysis</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <CasteSubcasteTab 
              casteData={dashboardData.caste} 
              isLoading={dashboardData.isLoading}
              error={dashboardData.error}
            />
          </div>
        )}

        {/* Profile/Summary Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Leader Profile & Executive Summary</h2>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={dashboardData.isLoading}
                >
                  {dashboardData.isLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <ProfileSummaryTab 
              leaderProfile={dashboardData.leaderProfile}
              executiveSummary={dashboardData.executiveSummary}
              isLoading={dashboardData.isLoading}
              error={dashboardData.error}
            />
          </div>
        )}

        {/* Region Analysis Tab */}
        {activeTab === 'region' && (
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Region Wise Analysis</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
                >
                  <option value="all">All Regions</option>
                  <option value="north">North India</option>
                  <option value="south">South India</option>
                  <option value="east">East India</option>
                  <option value="west">West India</option>
                </select>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={fetchRegionData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={regionLoading}
                >
                  {regionLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            {regionError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {regionError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {regionLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : dashboardData.region?.region_analysis ? (
              <div className="space-y-6">
                {/* Region-wise Sentiment */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Region-wise Sentiment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.region.region_analysis.region_wise_sentiment?.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium">{item.region}</h4>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Support Base:</span>
                            <span>{item.support_base_percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${item.support_base_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Sentiment Distribution:</p>
                          <div className="space-y-1">
                            {Object.entries(item.sentiment_distribution).map(([key, value]) => (
                              <div key={key} className="flex items-center">
                                <span className="w-20 text-sm capitalize">{key}:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${value}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-xs w-8">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parliamentary Constituencies */}
                {dashboardData.region.region_analysis.parliamentary_constituencies?.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Key Constituencies</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constituency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Influence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incumbent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Swing Factor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.region.region_analysis.parliamentary_constituencies
                            .slice(0, 5)
                            .map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.constituency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.party_influence}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.incumbent}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.swing_factor.toLowerCase().includes('high') ? 'bg-red-100 text-red-800' :
                                    item.swing_factor.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {item.swing_factor}
                                  </span>
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Urban vs Rural Comparison */}
                {dashboardData.region.region_analysis.urban_vs_rural_comparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Urban Areas</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Support Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(dashboardData.region.region_analysis.urban_vs_rural_comparison.urban.support_distribution).map(([party, percentage]) => (
                              <div key={party} className="flex items-center">
                                <span className="w-32 text-sm capitalize">{party.replace('_', ' ')}:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm font-medium w-12">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Key Concerns</h4>
                          <div className="flex flex-wrap gap-2">
                            {dashboardData.region.region_analysis.urban_vs_rural_comparison.urban.key_concerns?.map((concern, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Rural Areas</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Support Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(dashboardData.region.region_analysis.urban_vs_rural_comparison.rural.support_distribution).map(([party, percentage]) => (
                              <div key={party} className="flex items-center">
                                <span className="w-32 text-sm capitalize">{party.replace('_', ' ')}:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm font-medium w-12">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Key Concerns</h4>
                          <div className="flex flex-wrap gap-2">
                            {dashboardData.region.region_analysis.urban_vs_rural_comparison.rural.key_concerns?.map((concern, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : !regionLoading && (
              <div className="text-center py-12">
                <FiMap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No region data available</h3>
                <p className="mt-1 text-sm text-gray-500">Select a region and time range to view analysis</p>
              </div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary */}
                <div className="bg-white rounded-xl shadow p-6">
                  <SectionHeader 
                    title="Executive Summary" 
                    description="Key insights and analysis" 
                  />
                  <div className="prose max-w-none text-gray-700">
                    {dashboardData.executiveSummary?.executive_summary ? (
                      <>
                        <h3 className="text-md font-medium">{dashboardData.executiveSummary.executive_summary.overview.purpose}</h3>
                        <p className="mt-2">{dashboardData.executiveSummary.executive_summary.overview.scope}</p>
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900">Key Findings:</h4>
                          <ul className="mt-2 space-y-2">
                            {dashboardData.executiveSummary.executive_summary.key_findings?.main_insights
                              ?.slice(0, 3)
                              .map((insight, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-indigo-500 mr-2">•</span>
                                  <span>{insight.insight}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p>No executive summary available.</p>
                    )}
                  </div>
                </div>

                
              </div>

             
            </div>
          </>
        )}

        {/* Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
              
              {sentimentLoading ? (
                <div className="flex justify-center items-center py-12">
                  <FiRefreshCw className="animate-spin text-2xl text-blue-500 mr-2" />
                  <span>Analyzing sentiment for &ldquo;{searchQuery}&rdquo;...</span>
                </div>
              ) : sentimentError ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        Error loading sentiment data: {sentimentError}
                      </p>
                    </div>
                  </div>
                </div>
              ) : sentimentData ? (
                <div className="space-y-6">
                  {/* Overall Sentiment */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Overall Sentiment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {Math.round((sentimentData.sentiment_analysis?.overall_sentiment?.positive || 0) )}%
                        </div>
                        <div className="text-sm text-green-700">Positive</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-600">
                          {Math.round((sentimentData.sentiment_analysis?.overall_sentiment?.neutral || 0))}%
                        </div>
                        <div className="text-sm text-yellow-700">Neutral</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-3xl font-bold text-red-600">
                          {Math.round((sentimentData.sentiment_analysis?.overall_sentiment?.negative || 0))}%
                        </div>
                        <div className="text-sm text-red-700">Negative</div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment by Platform */}
                  {sentimentData.platform_sentiment_comparison && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Sentiment by Platform</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment Score</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(sentimentData.platform_sentiment_comparison).map(([platform, data]) => (
                              <tr key={platform}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{platform}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    data.score > 0.6 ? 'bg-green-100 text-green-800' : 
                                    data.score < 0.4 ? 'bg-red-100 text-red-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {data.score?.toFixed(2) || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {Math.round((data.positive || 0))}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {Math.round((data.neutral || 0))}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {Math.round((data.negative || 0))}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sentiment by Caste */}
                  {sentimentData.sentiment_analysis?.sentiment_by_caste && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Sentiment by Caste</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caste</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positive</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negative</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(sentimentData.sentiment_analysis.sentiment_by_caste).map(([caste, data]) => (
                              <tr key={caste}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{caste}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                                  {Math.round((data.positive || 0))}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700">
                                  {Math.round((data.neutral || 0))}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                                  {Math.round((data.negative || 0))}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Key Phrases */}
                  {sentimentData.sentiment_analysis?.sentiment_breakdown?.key_phrases && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Key Phrases</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Positive Phrases</h4>
                          <div className="flex flex-wrap gap-2">
                            {(sentimentData.sentiment_analysis.sentiment_breakdown.key_phrases.positive || []).map((phrase, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {phrase}
                              </span>
                            ))}
                            {(sentimentData.sentiment_analysis.sentiment_breakdown.key_phrases.positive || []).length === 0 && (
                              <span className="text-sm text-gray-500">No positive phrases found</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Negative Phrases</h4>
                          <div className="flex flex-wrap gap-2">
                            {(sentimentData.sentiment_analysis.sentiment_breakdown.key_phrases.negative || []).map((phrase, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {phrase}
                              </span>
                            ))}
                            {(sentimentData.sentiment_analysis.sentiment_breakdown.key_phrases.negative || []).length === 0 && (
                              <span className="text-sm text-gray-500">No negative phrases found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Metadata */}
                  <div className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    <p>Analysis generated at: {new Date(sentimentData.analysis_metadata?.generated_at || new Date()).toLocaleString()}</p>
                    <p>Region: {sentimentData.analysis_metadata?.parameters_used?.region || 'All'}</p>
                    <p>Time Range: {sentimentData.analysis_metadata?.parameters_used?.timeRange || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sentiment data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery.trim() ? 'Analyzing...' : 'Enter a search query to analyze sentiment.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Tab */}
        {activeTab === 'platform' && (
          <div className="space-y-6">
            {/* Overview Section */}
            {platformSentiment?.overview && (
              <div className="bg-white rounded-xl shadow p-6">
                <SectionHeader 
                  title="Sentiment Overview" 
                  description="Summary of sentiment analysis across all platforms"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-opacity-10 bg-indigo-500 mr-4">
                        <FiMessageSquare className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Mentions</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {platformSentiment.overview.total_mentions?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-white p-4 rounded-lg border-l-4 ${
                    platformSentiment.overview.average_sentiment_score >= 0.6 ? 'border-green-500 bg-green-50' :
                    platformSentiment.overview.average_sentiment_score <= 0.4 ? 'border-red-500 bg-red-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-opacity-10 bg-green-500 mr-4">
                        <FiTrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Avg. Sentiment</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {platformSentiment.overview.average_sentiment_score ? 
                            `${(platformSentiment.overview.average_sentiment_score * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-opacity-10 bg-blue-500 mr-4">
                        <FiActivity className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Most Active Platform</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {platformSentiment.overview.most_active_platform || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-opacity-10 bg-purple-500 mr-4">
                        <FiPieChart className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sentiment Distribution</p>
                        <div className="flex space-x-2">
                          <span className="text-green-600 text-sm">
                            ↑{platformSentiment.overview.sentiment_distribution?.positive?.toFixed(1)}%
                          </span>
                          <span className="text-gray-500 text-sm">
                            •{platformSentiment.overview.sentiment_distribution?.neutral?.toFixed(1)}%
                          </span>
                          <span className="text-red-600 text-sm">
                            ↓{platformSentiment.overview.sentiment_distribution?.negative?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sentiment Distribution Chart */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h3>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: ['Positive', 'Neutral', 'Negative'],
                        datasets: [{
                          data: [
                            platformSentiment.overview.sentiment_distribution?.positive || 0,
                            platformSentiment.overview.sentiment_distribution?.neutral || 0,
                            platformSentiment.overview.sentiment_distribution?.negative || 0
                          ],
                          backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(156, 163, 175, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                          ],
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Platform Comparison Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <SectionHeader 
                title="Platform Comparison" 
                description="Sentiment and engagement metrics across platforms"
              />
              <div className="h-96">
                {platformChartData ? (
                  <Bar 
                    data={platformChartData}
                    options={platformChartOptions}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No platform data available
                  </div>
                )}
              </div>
            </div>

            {/* Platform Details */}
            {platformSentiment?.platforms?.map((platform, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{platform.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {platform.metrics?.mention_volume?.toLocaleString()} mentions • 
                        {(platform.metrics?.engagement_rate * 100)?.toFixed(1)}% engagement
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      platform.metrics?.sentiment_score >= 0.6 ? 'bg-green-100 text-green-800' :
                      platform.metrics?.sentiment_score <= 0.4 ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {platform.metrics?.sentiment_score ? 
                        `Sentiment: ${(platform.metrics.sentiment_score * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Demographics */}
                    {platform.demographics && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Audience Demographics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Age Groups</span>
                            </div>
                            <div className="space-y-1">
                              {Object.entries(platform.demographics.age_groups || {}).map(([age, percent]) => (
                                <div key={age} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>{age}</span>
                                    <span>{percent}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 bg-indigo-500 rounded-full" 
                                      style={{ width: `${percent}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Gender</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(platform.demographics.gender_distribution || {}).map(([gender, percent]) => (
                                <div key={gender} className="text-center">
                                  <div className="text-xs text-gray-600">{gender}</div>
                                  <div className="text-sm font-medium">{percent}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Topics */}
                    {platform.topics?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Top Topics</h4>
                        <div className="space-y-3">
                          {platform.topics.slice(0, 5).map((topic, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{topic.topic}</span>
                                <span className="font-medium">{topic.volume} mentions</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    topic.sentiment >= 0.6 ? 'bg-green-500' :
                                    topic.sentiment <= 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${(topic.volume / platform.metrics?.mention_volume) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Hashtags */}
                    {platform.metrics?.top_hashtags?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Top Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {platform.metrics.top_hashtags.slice(0, 10).map((hashtag, i) => (
                            <span 
                              key={i}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                hashtag.sentiment >= 0.6 ? 'bg-green-100 text-green-800' :
                                hashtag.sentiment <= 0.4 ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              #{hashtag.tag} ({hashtag.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform-specific Recommendations */}
                {platformSentiment.recommendations?.platform_specific
                  ?.find(rec => rec.platform.toLowerCase() === platform.name.toLowerCase())?.recommendations?.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations for {platform.name}</h4>
                    <ul className="space-y-1.5">
                      {platformSentiment.recommendations.platform_specific
                        .find(rec => rec.platform.toLowerCase() === platform.name.toLowerCase())
                        .recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-indigo-500 mr-2 mt-1">•</span>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* General Content Strategy */}
            {platformSentiment?.recommendations?.content_strategy?.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <SectionHeader 
                  title="Content Strategy Recommendations" 
                  description="General recommendations for all platforms"
                />
                <div className="space-y-3">
                  {platformSentiment.recommendations.content_strategy.map((item, i) => (
                    <div key={i} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        

        {/* Region Tab */}
        {activeTab === 'region' && dashboardData.region?.region_analysis && (
          <div className="bg-white rounded-xl shadow p-6">
            <SectionHeader 
              title="Regional Analysis" 
              description="Breakdown by geographic regions" 
            />
            <div className="h-96">
              {regionChartData ? (
                <Bar 
                  data={regionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Score: ${context.raw}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                          display: true,
                          text: 'Sentiment Score (0-10)'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No regional data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaders Tab */}
        {activeTab === 'leaders' && assemblyLeaders && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Assembly Leader Report</h2>
              
              {/* MLA and Constituency Information */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Constituency</h3>
                    <p className="text-gray-700">{assemblyLeaders.constituency || 'N/A'}</p>
                  </div>
                  
                  {assemblyLeaders.mla && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">MLA Information</h3>
                      <div className="space-y-1">
                        <p className="text-gray-700">
                          <span className="font-medium">Name:</span> {assemblyLeaders.mla.name || 'N/A'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Party:</span> {assemblyLeaders.mla.party || 'N/A'}
                        </p>
                        {assemblyLeaders.mla.term_start && (
                          <p className="text-gray-700">
                            <span className="font-medium">Term Start:</span> {assemblyLeaders.mla.term_start}
                          </p>
                        )}
                        
                        {assemblyLeaders.mla.contact && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">Contact Information:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {assemblyLeaders.mla.contact.mobile && (
                                <li className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {assemblyLeaders.mla.contact.mobile}
                                </li>
                              )}
                              {assemblyLeaders.mla.contact.email && (
                                <li className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {assemblyLeaders.mla.contact.email}
                                </li>
                              )}
                              {assemblyLeaders.mla.contact.office_address && (
                                <li className="flex items-start">
                                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{assemblyLeaders.mla.contact.office_address}</span>
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
              
              {assemblyLeaders.executive_summary && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                  <p className="text-gray-700">{assemblyLeaders.executive_summary}</p>
                </div>
              )}
              
              {assemblyLeaders.key_issues?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Key Issues</h3>
                  <div className="space-y-6">
                    {assemblyLeaders.key_issues.map((issue, index) => (
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
          </div>
        )}

        {/* Opposition Tab */}
        {activeTab === 'opposition' && dashboardData.oppositionTracking && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Opposition Tracking - {dashboardData.oppositionTracking.region}</h2>
              
              {/* Timeframe Info */}
              <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-800">
                  <span className="font-medium">Timeframe Analyzed:</span> {dashboardData.oppositionTracking.timeframe_analyzed}
                </p>
              </div>

              {/* Overall Sentiment */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Overall Sentiment Towards Opposition</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-green-800 font-medium">Positive</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.oppositionTracking.overall_sentiment_towards_opposition.positive}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <p className="text-yellow-800 font-medium">Neutral</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.oppositionTracking.overall_sentiment_towards_opposition.neutral}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-red-800 font-medium">Negative</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.oppositionTracking.overall_sentiment_towards_opposition.negative}</p>
                  </div>
                </div>
                {dashboardData.oppositionTracking.overall_sentiment_towards_opposition.summary && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{dashboardData.oppositionTracking.overall_sentiment_towards_opposition.summary}</p>
                  </div>
                )}
              </div>

              {/* Opposition Parties */}
              <div className="space-y-8">
                <h3 className="text-xl font-semibold mb-4">Opposition Parties Analysis</h3>
                
                {dashboardData.oppositionTracking.opposition_parties?.map((party, partyIndex) => (
                  <div key={partyIndex} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">{party.name}</h4>
                        {party.key_leaders?.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Key Leaders:</span> {party.key_leaders.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h5 className="font-medium mb-3">Digital Campaigns</h5>
                      <div className="space-y-4">
                        {party.digital_campaigns?.length > 0 ? (
                          party.digital_campaigns.map((campaign, campaignIndex) => (
                            <div key={campaignIndex} className="border-l-4 border-blue-200 pl-4 py-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{campaign.campaign_theme}</p>
                                  <p className="text-sm text-gray-600">Platform: {campaign.platform}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  campaign.sentiment_polarity === 'positive' ? 'bg-green-100 text-green-800' :
                                  campaign.sentiment_polarity === 'negative' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {campaign.sentiment_polarity}
                                </span>
                              </div>
                              
                              {campaign.engagement_metrics && (
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-gray-500">Likes</p>
                                    <p className="font-medium">{campaign.engagement_metrics.likes?.toLocaleString() || 'N/A'}</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-gray-500">Shares</p>
                                    <p className="font-medium">{campaign.engagement_metrics.shares?.toLocaleString() || 'N/A'}</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-gray-500">Comments</p>
                                    <p className="font-medium">{campaign.engagement_metrics.comments?.toLocaleString() || 'N/A'}</p>
                                  </div>
                                  <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-gray-500">Reach</p>
                                    <p className="font-medium">{campaign.engagement_metrics.reach_estimate?.toLocaleString() || 'N/A'}</p>
                                  </div>
                                </div>
                              )}
                              
                              {campaign.observations && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p className="font-medium">Observations:</p>
                                  <p>{campaign.observations}</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No digital campaigns data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Narrative Recommendations */}
              {dashboardData.oppositionTracking.narrative_recommendations && (
                <div className="mt-10 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                  <h3 className="text-xl font-semibold mb-4 text-indigo-900">Narrative Recommendations</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-indigo-800 mb-2">Content Strategy</h4>
                      <p className="text-gray-700">{dashboardData.oppositionTracking.narrative_recommendations.content_strategy || 'No specific strategy provided.'}</p>
                    </div>
                    
                    {dashboardData.oppositionTracking.narrative_recommendations.target_demographics?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-indigo-800 mb-2">Target Demographics</h4>
                        <div className="flex flex-wrap gap-2">
                          {dashboardData.oppositionTracking.narrative_recommendations.target_demographics.map((demo, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                              {demo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {dashboardData.oppositionTracking.narrative_recommendations.platform_priorities?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-indigo-800 mb-2">Platform Priorities</h4>
                        <div className="flex flex-wrap gap-2">
                          {dashboardData.oppositionTracking.narrative_recommendations.platform_priorities.map((platform, i) => (
                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {dashboardData.oppositionTracking.narrative_recommendations.recommended_counter_narratives?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-indigo-800 mb-2">Recommended Counter Narratives</h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          {dashboardData.oppositionTracking.narrative_recommendations.recommended_counter_narratives.map((narrative, i) => (
                            <li key={i}>{narrative}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">News Coverage</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest news articles and mentions with sentiment analysis</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <select 
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedCaste}
                    onChange={(e) => setSelectedCaste(e.target.value)}
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <select 
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="1m">Last month</option>
                    <option value="3m">Last 3 months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {newsData.length > 0 ? (
                newsData
                  .filter(article => selectedCaste === 'all' || article.sentiment === selectedCaste)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((article, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              article.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-800' 
                                : article.sentiment === 'negative' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                          </span>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{article.source}</span>
                            <span className="mx-1">•</span>
                            <time dateTime={article.date}>
                              {new Date(article.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </time>
                            {article.sentiment_score && (
                              <>
                                <span className="mx-1">•</span>
                                <span>Score: {article.sentiment_score.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                          <h3 className="mt-1 text-base font-medium text-gray-900">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {article.headline}
                            </a>
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">{article.summary}</p>
                          
                          {article.key_phrases && article.key_phrases.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {article.key_phrases.map((phrase, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {phrase}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {article.impact_analysis && article.sentiment === 'negative' && (
                            <div className="mt-2 p-2 bg-red-50 rounded-md">
                              <h4 className="text-xs font-medium text-red-800">Impact Analysis:</h4>
                              <p className="text-xs text-red-700 mt-1">{article.impact_analysis}</p>
                              {article.resolution_suggestions && article.resolution_suggestions.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="text-xs font-medium text-red-800">Suggestions:</h4>
                                  <ul className="list-disc list-inside text-xs text-red-700 mt-1 space-y-1">
                                    {article.resolution_suggestions.map((suggestion, i) => (
                                      <li key={i}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {article.image_url && (
                          <div className="ml-4 flex-shrink-0">
                            <img 
                              className="h-20 w-20 rounded-md object-cover" 
                              src={article.image_url} 
                              alt="" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No news articles found. Try a different search query.
                </div>
              )}
            </div>
            {newsData.length > 10 && (
              <div className="px-6 py-4 bg-gray-50 text-right">
                <button 
                  onClick={() => {/* Implement pagination */}}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <AnalysisSources />
    </div>
  );
};

export default Dashboard;
