'use client';

import { FiUsers, FiThumbsUp, FiThumbsDown, FiAlertTriangle, FiTarget, FiMessageSquare, FiLayers, FiChevronRight, FiUser, FiPieChart, FiUsers as FiGroup, FiTrendingUp, FiAward, FiAlertCircle, FiBarChart2, FiStar, FiMeh } from 'react-icons/fi';
import StrategicRecommendations from './StrategicRecommendations';
import FlagshipSchemes from './FlagshipSchemes';
import KeyIssues from './KeyIssues';
import PartyWorkerSentiment from './PartyWorkerSentiment';
import DemographicAnalysis from './DemographicAnalysis';
import CasteAnalysis from './CasteAnalysis';
import OppositionTracking from './OppositionTracking';
import SentimentAnalysis from './SentimentAnalysis';

const StrategyTab = ({ data }) => {
  // Handle the nested political_strategy_report structure
  const reportData = data?.political_strategy_report || data;
  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Political Strategy Report</h2>
          <p className="text-gray-600">Comprehensive analysis for {reportData.region}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            Last Updated: {reportData.report_date}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-500">Leader</p>
            <p className="text-lg font-semibold">{reportData.leader}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-500">Party</p>
            <p className="text-lg font-semibold">{reportData.party}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm font-medium text-gray-500">Region</p>
            <p className="text-lg font-semibold">{reportData.region}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
            <p className="text-sm font-medium text-gray-500">Overall Sentiment</p>
            <p className="text-lg font-semibold">
              {reportData.sections?.sentiment_analysis?.overall_sentiment || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Performance */}
      <SocialMediaPerformance data={reportData.sections?.social_media_performance} />

      {/* Sentiment Analysis */}
      <SentimentAnalysis data={reportData.sections?.sentiment_analysis} />

      {/* Content Analysis */}
      <ContentAnalysis data={reportData.sections?.content_scanning_analysis} />

      {/* Demographic Analysis */}
      <DemographicAnalysis data={reportData.sections?.demographic_sentiment} />

      {/* Caste Analysis */}
      <CasteAnalysis data={reportData.sections?.caste_sentiment} />

      {/* Opposition Tracking */}
      <OppositionTracking data={reportData.sections?.opposition_tracking} />

      {/* Strategic Recommendations */}
      <StrategicRecommendations data={reportData.sections?.strategic_recommendations} />

      {/* Flagship Schemes */}
      <FlagshipSchemes data={reportData.sections?.flagship_schemes} />

      {/* Key Issues */}
      <KeyIssues data={reportData.sections?.key_issues} />

      {/* Party Worker Sentiment */}
      <PartyWorkerSentiment data={reportData.sections?.party_worker_sentiment} />
    </div>
  );
};

// Sub-components for each section
const SocialMediaPerformance = ({ data }) => (
  <div className="bg-white shadow rounded-xl p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Social Media Performance</h3>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Platform Comparison */}
      <div className="lg:col-span-2">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Platform Comparison</h4>
        <div className="space-y-3">
          {data?.platform_comparison?.map((platform, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{platform?.platform || 'Unknown Platform'}</span>
                <span className="text-sm font-medium">
                  {platform?.followers ? platform.followers.toLocaleString() : 'N/A'}
                  {platform?.platform === 'YouTube' ? 'subscribers' : 'followers'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${parseFloat(platform.engagement_rate) * 10}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Engagement: {platform.engagement_rate}</span>
                {platform.growth !== undefined && (
                  <span className={String(platform.growth || '').startsWith('-') ? 'text-red-500' : 'text-green-500'}>
                    {platform.growth}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ContentAnalysis = ({ data = {} }) => {
  // Provide default empty arrays if data or its properties are undefined
  const proNarratives = data?.pro_narratives || [];
  const antiNarratives = data?.anti_narratives || [];
  const viralContent = data?.viral_content || [];

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pro Narratives */}
        <div>
          <h4 className="text-lg font-medium text-green-700 mb-3">Positive Narratives</h4>
          <div className="space-y-3">
            {proNarratives.length > 0 ? (
              proNarratives.map((narrative, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <FiThumbsUp className="text-green-600 text-sm" />
                  </div>
                  <p className="text-gray-700">{narrative}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No positive narratives available</p>
            )}
          </div>
        </div>

        {/* Anti Narratives */}
        <div>
          <h4 className="text-lg font-medium text-red-700 mb-3">Negative Narratives</h4>
          <div className="space-y-3">
            {antiNarratives.length > 0 ? (
              antiNarratives.map((narrative, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <FiThumbsDown className="text-red-600 text-sm" />
                  </div>
                  <p className="text-gray-700">{narrative}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No negative narratives available</p>
            )}
          </div>
        </div>

        {/* Viral Content */}
        {/* Viral Content */}
        <div>
          <h4 className="text-lg font-medium text-blue-700 mb-3">Viral Content</h4>
          <div className="space-y-4">
            {viralContent.length > 0 ? (
              viralContent.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="p-1.5 rounded bg-blue-100 text-blue-600 mr-2">
                      <FiTrendingUp />
                    </div>
                    <span className="text-sm font-medium">{item.content}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Reach: {item.reach}</span>
                    <span>Engagement: {item.engagement}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No viral content available</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StrategyTab;
