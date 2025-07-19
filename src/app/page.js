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
const getDefaultRegionWiseAnalysis = () => ({});

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

// Helper function to get caste distribution percentage (ensures it's between 0-100)
const getCastePercentage = (casteData, caste) => {
  const percentage = casteData[caste] || 0;
  return Math.min(Math.max(0, percentage), 100);
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
  const [platformComparison, setPlatformComparison] = useState(getDefaultPlatformComparison());
  const [demographicSupport, setDemographicSupport] = useState(getDefaultDemographicSupport());
  const [leaderProfile, setLeaderProfile] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportLink, setReportLink] = useState('');
  const [isProtected, setIsProtected] = useState(true);
  
  const [filters, setFilters] = useState({
    timeRange: '1m',
    customStartDate: '',
    customEndDate: '',
    region: 'all',
    detailed: false,
    includeNews: true,
    includeTrends: true,
    sentimentThreshold: 0.6, // Default sentiment threshold
    includeSentimentBreakdown: true,
    includeSourceAnalysis: true
  });
  
  const toggleDetailedView = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      detailed: !prevFilters.detailed
    }));
  };
  
  // Available regions for filtering
  const regions = [
    { value: 'all', label: 'All India' },
    { value: 'north', label: 'North India' },
    { value: 'south', label: 'South India' },
    { value: 'east', label: 'East India' },
    { value: 'west', label: 'West India' },
    { value: 'northeast', label: 'North East' },
    { value: 'central', label: 'Central India' }
  ];
  const [newsPage, setNewsPage] = useState({
    positive: 1,
    negative: 1,
    neutral: 1
  });
  const itemsPerPage = 3; // Show 3 items at a time
  const searchInputRef = useRef(null);
  

  
  // Get paginated news items
  const getPaginatedNews = (items, type) => {
    if (!items) return [];
    const start = (newsPage[type] - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };
  
  // Handle page change
  const handlePageChange = (type, direction) => {
    setNewsPage(prev => ({
      ...prev,
      [type]: Math.max(1, prev[type] + (direction === 'next' ? 1 : -1))
    }));
    // Scroll to top of news section
    document.querySelector(`#${type}-news`)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sentiment Analysis Section Component
  const SentimentAnalysisSection = () => {
    if (!sentimentData || !Object.keys(sentimentData).length) return null;

    // Prepare data for platform sentiment comparison
    const platformData = {
      labels: Object.keys(searchResults.platform_sentiment_comparison || {}).filter(k => k !== 'Overall'),
      datasets: [
        {
          label: 'Positive',
          data: Object.entries(searchResults.platform_sentiment_comparison || {})
            .filter(([key]) => key !== 'Overall')
            .map(([_, platformData]) => platformData.positive || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Neutral',
          data: Object.entries(searchResults.platform_sentiment_comparison || {})
            .filter(([key]) => key !== 'Overall')
            .map(([_, platformData]) => platformData.neutral || 0),
          backgroundColor: 'rgba(201, 203, 207, 0.6)',
          borderColor: 'rgba(201, 203, 207, 1)',
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: Object.entries(searchResults.platform_sentiment_comparison || {})
            .filter(([key]) => key !== 'Overall')
            .map(([_, platformData]) => platformData.negative || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Prepare data for regional sentiment
    const regionalData = {
      labels: Object.keys(searchResults.region_wise_analysis || {}),
      datasets: [
        {
          label: 'Positive',
          data: Object.values(searchResults.region_wise_analysis || {}).map(r => r.positive || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Negative',
          data: Object.values(searchResults.region_wise_analysis || {}).map(r => r.negative || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Prepare data for demographic support
    const demographicSupportData = {
      labels: ['Youth (18-35)', 'Middle-age (36-55)', 'Senior (56+)', 'Urban', 'Rural'],
      datasets: [
        {
          label: 'Support %',
          data: [
            searchResults.demographic_support_base?.['Youth (18-35)'] || 0,
            searchResults.demographic_support_base?.['Middle-age (36-55)'] || 0,
            searchResults.demographic_support_base?.['Senior (56+)'] || 0,
            searchResults.demographic_support_base?.Urban || 0,
            searchResults.demographic_support_base?.Rural || 0
          ],
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

    // Calculate overall support
    const overallSupport = searchResults.demographic_support_base?.Overall || 0;

    return (
      <div className="space-y-8">
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
      // Update leader profile and executive summary
      if (searchResults.leader_profile) {
        setLeaderProfile(Array.isArray(searchResults.leader_profile) ? searchResults.leader_profile : []);
      }
      
      if (searchResults.executive_summary) {
        setExecutiveSummary(searchResults.executive_summary || '');
      }
      
      // Update caste distribution data
      if (searchResults.caste_distribution) {
        setCasteData(searchResults.caste_distribution);
        
        // Auto-select the first caste if none selected
        if (!selectedCaste) {
          const firstCaste = Object.keys(searchResults.caste_distribution)[0];
          if (firstCaste) setSelectedCaste(firstCaste);
        }
      }

      // Update sentiment data
      if (searchResults.sentiment_analysis) {
        setSentimentData(searchResults.sentiment_analysis);
      }

      // Update insights and trends
      setInsights(searchResults.insights || getDefaultInsights());
      setTrends(searchResults.trends || getDefaultTrends());
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
    e.preventDefault();
    
    const query = searchTerm.trim();
    if (!query || isLoading) return;

    setIsLoading(true);
    setError('');
    setSelectedCaste(null);
    setSaveSuccess(false);
    setReportLink('');

    try {
      // Reset data while loading
      setCasteData({});
      setSentimentData({});
      setInsights(getDefaultInsights());
      setTrends(getDefaultTrends());

      // Prepare request body with all filter parameters
      const requestBody = {
        query: query,
        analysisType: 'caste_analysis',
        region: filters.region,
        timeRange: filters.timeRange,
        detailed: filters.detailed,
        includeNews: filters.includeNews,
        includeTrends: filters.includeTrends,
        // Include detailed analysis parameters
        sentimentThreshold: filters.sentimentThreshold,
        includeSentimentBreakdown: filters.includeSentimentBreakdown,
        includeSourceAnalysis: filters.includeSourceAnalysis
      };

      // Add custom date range if custom time range is selected
      if (filters.timeRange === 'custom') {
        requestBody.customStartDate = filters.customStartDate;
        requestBody.customEndDate = filters.customEndDate;
      }

      console.log('Sending request to /api/search with filters:', requestBody);
      
      // Call the API endpoint with all filters
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Received response status:', response.status);

      if (!response.ok) {
        console.error('Error response status:', response.status);
        let errorData;
        try {
          errorData = await response.json();
          console.error('Error response data:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
          throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      let responseData;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid JSON response from server');
        }
      } catch (e) {
        console.error('Failed to read response:', e);
        throw new Error('Failed to read server response');
      }
      
      if (!responseData) {
        throw new Error('Received empty response from server');
      }
      
      if (responseData.success === false) {
        console.error('Error in response:', responseData);
        throw new Error(responseData.error || 'Request failed');
      }
      
      // Extract the actual data (remove success flag if present)
      const { success, ...data } = responseData;
      
      // Validate required fields with more detailed logging
      if (!data.caste_distribution) {
        console.error('Missing caste_distribution in response');
      }
      if (!data.sentiment_analysis) {
        console.error('Missing sentiment_analysis in response');
      }
      
      if (!data.caste_distribution || !data.sentiment_analysis) {
        console.error('Incomplete response data:', JSON.stringify(data, null, 2));
        throw new Error('Incomplete data received from server');
      }
      
      // Process and validate the API response data
      // Calculate total results based on news items if available
      const newsCount = data.news ? 
        (data.news.positive?.length || 0) + 
        (data.news.negative?.length || 0) + 
        (data.news.neutral?.length || 0) : 0;
        
      const processedData = {
        query,
        timestamp: new Date().toISOString(),
        totalResults: newsCount > 0 ? newsCount : 1, // Default to 1 if no news items but analysis exists
        caste_distribution: data.caste_distribution || {},
        sentiment_analysis: data.sentiment_analysis || {},
        // Handle both key_insights and insights for backward compatibility
        insights: {
          key_findings: data.key_insights || data.insights?.key_findings || [],
          recommendations: data.insights?.recommendations || []
        },
        // Handle trends data
        trends: {
          overall_trend: data.trends?.overall_trend || data.trends?.[0] || 'No trend data available',
          notable_changes: Array.isArray(data.trends) ? data.trends.slice(1) : (data.trends?.notable_changes || [])
        },
        // Include news if available
        news: data.news || {
          positive: [],
          negative: [],
          neutral: []
        },
        // Add new detailed analysis fields
        key_strengths_weaknesses: data.key_strengths_weaknesses || getDefaultStrengthsWeaknesses(),
        region_wise_analysis: data.region_wise_analysis || getDefaultRegionWiseAnalysis(),
        platform_sentiment_comparison: data.platform_sentiment_comparison || getDefaultPlatformComparison(),
        demographic_support_base: data.demographic_support_base || getDefaultDemographicSupport(),
        // Add executive summary and leader profile
        executive_summary: data.executive_summary || [],
        leader_profile: data.leader_profile || []
      };

      console.log('Processed data:', processedData);
      
      // Update all state with the processed data
      setSearchResults(processedData);
      setCasteData(processedData.caste_distribution || {});
      setSentimentData(processedData.sentiment_analysis || {});
      setInsights(processedData.insights || getDefaultInsights());
      setTrends(processedData.trends || getDefaultTrends());
      setStrengthsWeaknesses(processedData.key_strengths_weaknesses || getDefaultStrengthsWeaknesses());
      setRegionWiseAnalysis(processedData.region_wise_analysis || getDefaultRegionWiseAnalysis());
      setPlatformComparison(processedData.platform_sentiment_comparison || getDefaultPlatformComparison());
      setDemographicSupport(processedData.demographic_support_base || getDefaultDemographicSupport());
      
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
                <button
                  type="submit"
                  disabled={isLoading || !searchTerm.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              
              {/* Region and Time Range Selectors */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
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
              
              {error && <div className="text-red-600 text-sm">{error}</div>}
              
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
                <div className="text-gray-500 text-sm font-medium mb-1">News Analyzed</div>
                <div className="text-2xl font-bold mb-2">
                  {(searchResults.news?.positive?.length || 0) + 
                   (searchResults.news?.negative?.length || 0) + 
                   (searchResults.news?.neutral?.length || 0)}
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
                  {filters.timeRange === '24h' ? '24 Hours' :
                   filters.timeRange === '7d' ? '7 Days' :
                   filters.timeRange === '30d' ? '30 Days' :
                   filters.timeRange === '90d' ? '90 Days' :
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
                  <button
  onClick={handleSaveReport}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isSaving || !searchResults}
>
  {isSaving ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Generating PDF...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export PDF
    </>
  )}
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
                </div>
              )}
              
              {/* Region-wise Analysis */}
              {filters.detailed && searchResults.region_wise_analysis && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Regional Sentiment Analysis</h3>
                  
                  {/* Bar Chart */}
                  <div className="mb-8 h-80">
                    <Bar
                      data={{
                        labels: Object.keys(searchResults.region_wise_analysis).map(region => `${region} Region`),
                        datasets: [
                          {
                            label: 'Positive',
                            data: Object.values(searchResults.region_wise_analysis).map(data => data.positive),
                            backgroundColor: '#10B981',
                            borderRadius: 4
                          },
                          {
                            label: 'Neutral',
                            data: Object.values(searchResults.region_wise_analysis).map(data => data.neutral),
                            backgroundColor: '#F59E0B',
                            borderRadius: 4
                          },
                          {
                            label: 'Negative',
                            data: Object.values(searchResults.region_wise_analysis).map(data => data.negative),
                            backgroundColor: '#EF4444',
                            borderRadius: 4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            stacked: true,
                            grid: {
                              display: false
                            }
                          },
                          y: {
                            stacked: true,
                            max: 100,
                            ticks: {
                              callback: (value) => `${value}%`
                            },
                            grid: {
                              drawBorder: false
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
                          },
                          legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                              usePointStyle: true,
                              boxWidth: 6,
                              padding: 20
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Region Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(searchResults.region_wise_analysis).map(([region, data]) => (
                      <div key={region} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-medium text-gray-800 mb-3">{region} Region</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600">Positive</span>
                            <span className="text-sm font-medium">{data.positive}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${data.positive}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-yellow-500">Neutral</span>
                            <span className="text-sm font-medium">{data.neutral}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="h-full rounded-full bg-yellow-500"
                              style={{ width: `${data.neutral}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-red-600">Negative</span>
                            <span className="text-sm font-medium">{data.negative}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${data.negative}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
              
              {/* Source Analysis Section */}
              {searchResults.source_analysis && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Source Analysis</h3>
                  
                  {/* Top Sources */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-800">Top Sources by Coverage</h4>
                      <span className="text-sm text-gray-500">Total Sources: {searchResults.source_analysis.top_sources?.length || 0}</span>
                    </div>
                    
                    {searchResults.source_analysis.top_sources && searchResults.source_analysis.top_sources.length > 0 ? (
                      <div className="space-y-4">
                        {searchResults.source_analysis.top_sources.map((source, index) => (
                          <div key={index} className="flex flex-wrap items-center py-3 border-b border-gray-100 last:border-0">
                            <div className="w-full md:w-48 font-medium text-gray-900 mb-2 md:mb-0">
                              {source.source}
                            </div>
                            <div className="flex-1 min-w-0 md:px-4">
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full bg-blue-600 transition-all duration-500 ease-out" 
                                  style={{ width: `${source.coverage}%` }}
                                  title={`${source.coverage}% coverage`}
                                ></div>
                              </div>
                            </div>
                            <div className="w-24 text-right text-sm font-medium text-gray-700 whitespace-nowrap ml-2">
                              {source.coverage}%
                            </div>
                            <div className={`ml-3 px-3 py-1 text-xs rounded-full font-medium ${
                              source.bias === 'center' ? 'bg-blue-100 text-blue-800' :
                              source.bias === 'center-left' ? 'bg-purple-100 text-purple-800' :
                              source.bias === 'left' ? 'bg-indigo-100 text-indigo-800' :
                              source.bias === 'center-right' ? 'bg-amber-100 text-amber-800' :
                              source.bias === 'right' ? 'bg-rose-100 text-rose-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {source.bias.replace(/-/g, ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500">No source data available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Source Reliability */}
                  {searchResults.source_analysis.source_reliability && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Source Reliability</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(searchResults.source_analysis.source_reliability).map(([type, value]) => {
                          const typeLabel = type.replace(/_/g, ' ');
                          const typeColor = type === 'reliable' ? 'green' : 
                                          type === 'somewhat_reliable' ? 'yellow' : 'red';
                          
                          return (
                            <div key={type} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 capitalize">{typeLabel}</span>
                                <span className="text-sm font-bold text-gray-900">{value}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full bg-${typeColor}-500`}
                                  style={{ 
                                    width: `${value}%`,
                                    transition: 'width 1s ease-in-out'
                                  }}
                                ></div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {type === 'reliable' ? 'Highly credible sources' :
                                 type === 'somewhat_reliable' ? 'Moderately credible sources' :
                                 'Potentially biased or unreliable sources'}
                              </div>
                            </div>
                          );
                        })}
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
                              Source reliability is calculated based on fact-checking history, editorial standards, and cross-verification with other sources.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Analysis Metadata */}
              {filters.detailed && searchResults.analysis_metadata && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Analysis Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Report Information</h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Generated At</dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(searchResults.analysis_metadata.generated_at).toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Data Coverage</dt>
                          <dd className="text-sm text-gray-900 capitalize">
                            {searchResults.analysis_metadata.parameters_used.region}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Time Range</dt>
                          <dd className="text-sm text-gray-900">
                            Last {searchResults.analysis_metadata.parameters_used.time_range}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Analysis Parameters</h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Sentiment Threshold</dt>
                          <dd className="text-sm text-gray-900">
                            {searchResults.analysis_metadata.parameters_used.sentiment_threshold}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Analysis Type</dt>
                          <dd className="text-sm text-gray-900">
                            {searchResults.analysis_metadata.parameters_used.detailed ? 'Detailed' : 'Basic'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">Includes</dt>
                          <dd className="text-sm text-gray-900">
                            {[
                              searchResults.analysis_metadata.parameters_used.include_sentiment_breakdown && 'Sentiment Breakdown',
                              searchResults.analysis_metadata.parameters_used.include_source_analysis && 'Source Analysis'
                            ].filter(Boolean).join(', ')}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          This analysis is automatically generated based on the latest available data. 
                          The parameters used can be adjusted to refine the results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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