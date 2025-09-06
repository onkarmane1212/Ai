'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  MapPin
} from 'lucide-react';

// Utility components
const StatCard = ({ title, value, icon: Icon, trend, trendValue, className = '' }) => (
  <Card className={`flex-1 ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && trendValue && (
        <div className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {trendValue}% from last period
        </div>
      )}
    </CardContent>
  </Card>
);

const CasteDistribution = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Caste Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(data.caste_distribution || {}).map(([caste, details]) => {
            if (caste === 'total') return null;
            return (
              <div key={caste} className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{caste}</h4>
                <div className="text-2xl font-bold">{details.percentage}%</div>
                {details.subcastes && Object.keys(details.subcastes).length > 0 && (
                  <div className="mt-2 text-sm space-y-1">
                    <div className="font-medium text-muted-foreground">Subcastes:</div>
                    {Object.entries(details.subcastes).map(([subcaste, percentage]) => (
                      <div key={subcaste} className="flex justify-between">
                        <span className="truncate">{subcaste}</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// const SentimentByCaste = ({ data }) => {
//   if (!data) return null;

//   return (
//     <Card className="mb-6">
//       <CardHeader>
//         <CardTitle className="flex items-center">
//           <PieChart className="h-5 w-5 mr-2" />
//           Sentiment by Caste
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {Object.entries(data.sentiment_by_caste || {}).map(([caste, sentiments]) => (
//             <div key={caste} className="border rounded-lg p-4">
//               <h4 className="font-medium mb-3">{caste}</h4>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Positive</span>
//                   <span className="font-medium text-green-500">{sentiments.positive}%</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Neutral</span>
//                   <span className="font-medium text-yellow-500">{sentiments.neutral}%</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Negative</span>
//                   <span className="font-medium text-red-500">{sentiments.negative}%</span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

const SentimentByCaste = ({ data }) => {
  if (!data) return null;

  const getBarColor = (type) => {
    switch (type) {
      case "positive": return "bg-green-500";
      case "neutral": return "bg-yellow-500";
      case "negative": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Sentiment by Caste
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.sentiment_by_caste || {}).map(([caste, sentiments]) => (
            <div key={caste} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">{caste}</h4>

              {["positive", "neutral", "negative"].map((type) => (
                <div key={type} className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{type}</span>
                    <span
                      className={
                        type === "positive"
                          ? "text-green-500 font-medium"
                          : type === "neutral"
                          ? "text-yellow-500 font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {sentiments[type]}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getBarColor(type)} h-2 rounded-full`}
                      style={{ width: `${sentiments[type]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


const KeyInsights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 bg-muted/30 rounded-lg">
              <p className="font-medium">{insight.insight}</p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">Impact:</span> {insight.impact}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">Recommendation:</span> {insight.recommendation}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const RegionWiseAnalysis = ({ data }) => {
  if (!data) return null;

  const renderSentimentBars = (sentiments) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Positive</span>
        <span>{sentiments.positive}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full" 
          style={{ width: `${sentiments.positive}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span>Neutral</span>
        <span>{sentiments.neutral}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-yellow-500 h-2 rounded-full" 
          style={{ width: `${sentiments.neutral}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span>Negative</span>
        <span>{sentiments.negative}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-red-500 h-2 rounded-full" 
          style={{ width: `${sentiments.negative}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Region-wise Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="state" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="parliamentary">Parliamentary</TabsTrigger>
            <TabsTrigger value="assembly">Assembly</TabsTrigger>
            <TabsTrigger value="district">District</TabsTrigger>
          </TabsList>
          
          <TabsContent value="state" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.state_level || {}).map(([state, sentiments]) => (
                <div key={state} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{state}</h4>
                  {renderSentimentBars(sentiments)}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="parliamentary" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.parliamentary_constituency || {}).map(([constituency, sentiments]) => (
                <div key={constituency} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{constituency}</h4>
                  {renderSentimentBars(sentiments)}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="assembly" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(data.assembly_constituency || {}).map(([constituency, sentiments]) => (
                <div key={constituency} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{constituency}</h4>
                  {renderSentimentBars(sentiments)}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="district" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.district || {}).map(([district, sentiments]) => (
                <div key={district} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{district}</h4>
                  {renderSentimentBars(sentiments)}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Calculate highest and lowest sentiment from sentiment_by_caste data
const calculateSentimentStats = (sentimentByCaste) => {
  if (!sentimentByCaste) return { highest: null, lowest: null };

  let highest = { value: -Infinity, caste: '' };
  let lowest = { value: Infinity, caste: '' };

  Object.entries(sentimentByCaste).forEach(([caste, sentiments]) => {
    if (caste === 'total') return;
    
    const positive = sentiments.positive || 0;
    const negative = sentiments.negative || 0;
    // Calculate net sentiment (positive - negative)
    const netSentiment = positive - negative;
    
    if (netSentiment > highest.value) {
      highest = { value: netSentiment, caste };
    }
    
    if (netSentiment < lowest.value) {
      lowest = { value: netSentiment, caste };
    }
  });

  return {
    highest: highest.value !== -Infinity ? highest : null,
    lowest: lowest.value !== Infinity ? lowest : null
  };
};

const CasteSubcasteTab = ({ casteData, isLoading, error }) => {
  // Calculate sentiment stats from the data
  const { highest, lowest } = calculateSentimentStats(casteData?.sentiment_by_caste);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-500">Error loading caste data</h3>
        <p className="text-muted-foreground mt-2">{error.message || 'Failed to load caste analysis'}</p>
      </div>
    );
  }

  if (!casteData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No caste data available</h3>
        <p className="text-muted-foreground mt-2">Caste analysis will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Castes" 
          value={Object.keys(casteData.caste_distribution || {}).filter(k => k !== 'total').length} 
          icon={Users}
        />
        <StatCard 
          title="Highest Net Sentiment" 
          value={highest?.caste || 'N/A'}
          subtext={`${highest ? Math.round(highest.value * 10) / 10 : 0} net`}
          icon={TrendingUp}
          trend="up"
          trendValue={0}
        />
        <StatCard 
          title="Lowest Net Sentiment" 
          value={lowest?.caste || 'N/A'}
          subtext={`${lowest ? Math.round(lowest.value * 10) / 10 : 0} net`}
          icon={TrendingDown}
          trend="down"
          trendValue={0}
        />
        <StatCard 
          title="Analysis Date" 
          value={new Date(casteData.analysis_metadata?.generated_at || new Date()).toLocaleDateString()}
          icon={Info}
        />
      </div>

      {/* Main Content */}
      <CasteDistribution data={casteData} />
      <SentimentByCaste data={casteData} />
      <KeyInsights insights={casteData.key_insights || []} />
      <RegionWiseAnalysis data={casteData.region_wise_analysis} />

      {/* Analysis Metadata */}
      {casteData.analysis_metadata && (
        <Card className="bg-muted/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Analysis Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
              {Object.entries(casteData.analysis_metadata.parameters_used || {}).map(([key, value]) => (
                <div key={key}>
                  <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CasteSubcasteTab;
