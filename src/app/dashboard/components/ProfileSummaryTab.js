'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/components/ui/badge";
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  BarChart3,
  Bell,
  Bookmark,
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  ExternalLink, 
  FileText,
  Filter,
  Flag,
  Info, 
  Layers,
  Lightbulb,
  Link2,
  ListChecks,
  ListMinus,
  ListOrdered,
  ListPlus,
  Mail,
  MapPin,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Paperclip,
  PieChart,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  Star,
  ThumbsDown, 
  ThumbsUp, 
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  ScrollText,
  Target,
  Activity
} from "lucide-react";

// Utility components for consistent UI
const ConfidenceBadge = ({ level }) => {
  const colorMap = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colorMap[level] || 'bg-gray-100 text-gray-800'}`}>
      {level?.charAt(0).toUpperCase() + level?.slice(1) || 'N/A'}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colorMap = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colorMap[priority] || 'bg-gray-100 text-gray-800'}`}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'N/A'}
    </span>
  );
};

const ImpactBadge = ({ impact }) => {
  const colorMap = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colorMap[impact] || 'bg-gray-100 text-gray-800'}`}>
      {impact?.charAt(0).toUpperCase() + impact?.slice(1) || 'N/A'}
    </span>
  );
};

const TrendIndicator = ({ trend }) => {
  if (trend === 'increasing') {
    return <ArrowUpRight className="w-4 h-4 text-green-500 inline-block ml-1" />;
  } else if (trend === 'decreasing') {
    return <ArrowDownRight className="w-4 h-4 text-red-500 inline-block ml-1" />;
  }
  return <span className="ml-1">→</span>; // Neutral/stable
};

const ProfileSummaryTab = ({ leaderProfile, executiveSummary, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderKeyFindings = () => {
    if (!executiveSummary?.executive_summary?.key_findings) return null;
    
    const { main_insights, performance_metrics } = executiveSummary.executive_summary.key_findings;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
            Main Insights
          </h3>
          <div className="space-y-4">
            {main_insights?.map((insight, index) => (
              <Card key={`insight-${index}`} className="border-l-4 border-blue-500">
                <CardContent className="p-4">
                  <p className="font-medium mb-2">{insight.insight}</p>
                  <p className="text-sm text-muted-foreground mb-2">{insight.impact}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <ConfidenceBadge level={insight.confidence_level} />
                    </div>
                    {insight.data_sources?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Sources: {insight.data_sources.join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {performance_metrics && Object.keys(performance_metrics).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
              Performance Metrics
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(performance_metrics).map(([metric, data]) => (
                <Card key={metric} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground capitalize">
                          {metric.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-2xl font-bold mt-1">
                          {data.value}
                          <TrendIndicator trend={data.trend} />
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>vs {data.comparison_period || 'previous period'}</div>
                        <div>{data.significance}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRiskAssessment = () => {
    if (!executiveSummary?.executive_summary?.risk_assessment) return null;
    
    const { identified_risks, risk_matrix } = executiveSummary.executive_summary.risk_assessment;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
          Risk Assessment
        </h3>
        
        {identified_risks?.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Identified Risks</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {identified_risks.map((risk, index) => (
                <Card key={`risk-${index}`} className="border-l-4 border-red-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-red-700">{risk.risk}</h4>
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        {risk.category}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Likelihood:</span>
                        <Badge variant={risk.likelihood === 'high' ? 'destructive' : 'outline'} 
                               className="ml-1 text-xs">
                          {risk.likelihood}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <ImpactBadge impact={risk.impact} className="ml-1" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <span className="ml-1 font-medium">{risk.risk_score}/9</span>
                      </div>
                    </div>
                    
                    {risk.mitigation_strategy && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md">
                        <p className="text-sm font-medium text-red-700">Mitigation Strategy:</p>
                        <p className="text-sm text-red-600">{risk.mitigation_strategy}</p>
                      </div>
                    )}
                    
                    {risk.contingency_plan && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-md">
                        <p className="text-sm font-medium text-amber-700">Contingency Plan:</p>
                        <p className="text-sm text-amber-600">{risk.contingency_plan}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {risk_matrix && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Risk Matrix</h4>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="bg-red-50 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">High Impact / High Probability</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {risk_matrix.high_impact_high_probability?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {risk_matrix.high_impact_high_probability.map((risk, i) => (
                        <li key={i} className="text-red-700">{risk}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No high impact, high probability risks</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-amber-50 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-800">High Impact / Low Probability</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {risk_matrix.high_impact_low_probability?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {risk_matrix.high_impact_low_probability.map((risk, i) => (
                        <li key={i} className="text-amber-700">{risk}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No high impact, low probability risks</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-yellow-50 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Low Impact / High Probability</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {risk_matrix.low_impact_high_probability?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {risk_matrix.low_impact_high_probability.map((risk, i) => (
                        <li key={i} className="text-yellow-700">{risk}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No low impact, high probability risks</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-green-50 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Low Impact / Low Probability</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {risk_matrix.low_impact_low_probability?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {risk_matrix.low_impact_low_probability.map((risk, i) => (
                        <li key={i} className="text-green-700">{risk}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No low impact, low probability risks</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderConclusion = () => {
    if (!executiveSummary?.executive_summary?.conclusion) return null;
    
    const { summary, next_steps, key_takeaways } = executiveSummary.executive_summary.conclusion;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
          Conclusion
        </h3>
        
        {summary && (
          <Card>
            <CardContent className="p-6">
              <p className="leading-relaxed">{summary}</p>
            </CardContent>
          </Card>
        )}
        
        {(next_steps?.length > 0 || key_takeaways?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {next_steps?.length > 0 && (
              <Card>
                <CardHeader className="bg-blue-50 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {next_steps.map((step, i) => (
                      <li key={i} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {key_takeaways?.length > 0 && (
              <Card>
                <CardHeader className="bg-green-50 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Key Takeaways</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {key_takeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                        <span className="text-sm">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const renderMetadata = () => {
    if (!executiveSummary?.analysis_metadata) return null;
    
    const { generated_at, parameters_used, version, generated_by } = executiveSummary.analysis_metadata;
    
    return (
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Analysis Metadata</h3>
        <div className="grid gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <span className="w-32 font-medium">Generated At:</span>
            <span>{new Date(generated_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 font-medium">Version:</span>
            <span>{version}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 font-medium">Generated By:</span>
            <span>{generated_by}</span>
          </div>
          {parameters_used && (
            <div>
              <div className="font-medium mb-1">Parameters Used:</div>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(parameters_used, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!executiveSummary?.executive_summary?.recommendations) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ListChecks className="w-5 h-5 mr-2 text-indigo-500" />
          Recommendations
        </h3>
        
        <div className="space-y-4">
          {executiveSummary.executive_summary.recommendations.map((rec, index) => (
            <Card key={`rec-${index}`} className="border-l-4 border-indigo-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-indigo-700">{rec.recommendation}</h4>
                  <PriorityBadge priority={rec.priority} />
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">{rec.rationale}</p>
                
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Timeline:</span>
                    <span className="ml-1">{rec.timeline || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Responsible:</span>
                    <span className="ml-1">{rec.responsible_party || 'Not assigned'}</span>
                  </div>
                </div>
                
                {rec.expected_outcome && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-md">
                    <p className="text-sm font-medium text-indigo-700">Expected Outcome:</p>
                    <p className="text-sm text-indigo-600">{rec.expected_outcome}</p>
                  </div>
                )}
                
                {rec.resources_required?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Resources Required:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.resources_required.map((resource, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCriticalAnalysis = () => {
    if (!executiveSummary?.executive_summary?.critical_analysis) return null;
    
    const { strengths, weaknesses } = executiveSummary.executive_summary.critical_analysis;
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
                <ThumbsUp className="w-5 h-5 mr-2" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="mb-3">{strengths?.description || 'No strengths data available.'}</p>
              
              {strengths?.supporting_evidence?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2 text-green-700">Supporting Evidence:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
                    {strengths.supporting_evidence.map((evidence, i) => (
                      <li key={i}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 pb-2">
              <CardTitle className="text-lg font-semibold text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="mb-3">{weaknesses?.description || 'No weaknesses data available.'}</p>
              
              {weaknesses?.areas_of_concern?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2 text-red-700">Areas of Concern:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    {weaknesses.areas_of_concern.map((concern, i) => (
                      <li key={i}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTrendAnalysis = () => {
    if (!executiveSummary?.executive_summary?.trend_analysis) return null;
    
    const { current_trends, emerging_patterns } = executiveSummary.executive_summary.trend_analysis;
    
    return (
      <div className="space-y-6">
        {current_trends?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
              Current Trends
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {current_trends.map((trend, index) => (
                <Card key={`trend-${index}`}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{trend.trend_name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{trend.description}</p>
                    
                    {trend.drivers?.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Key Drivers:</h5>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {trend.drivers.map((driver, i) => (
                            <li key={i}>{driver}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {trend.projected_impact && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-700">Projected Impact:</p>
                        <p className="text-sm text-blue-600">{trend.projected_impact}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {emerging_patterns?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Emerging Patterns
            </h3>
            <div className="space-y-4">
              {emerging_patterns.map((pattern, index) => (
                <Card key={`pattern-${index}`} className="border-l-4 border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          First observed: {pattern.first_observed}
                        </p>
                      </div>
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Growth: {pattern.growth_rate}
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                      <p className="text-sm font-medium text-yellow-700">Potential Impact:</p>
                      <p className="text-sm text-yellow-600">{pattern.potential_impact}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading profile and summary data. Please try again later.</p>
      </div>
    );
  }

  // Render the executive summary with all sections in a tabbed interface
  const renderExecutiveSummary = () => {
    if (!executiveSummary) return <p>No summary data available</p>;
    
    return (
      <div className="space-y-8">
        {/* Overview Section */}
        {executiveSummary.executive_summary?.overview && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Executive Summary</h2>
            <Card>
              <CardHeader>
                <CardTitle>{executiveSummary.executive_summary.overview.purpose}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Scope: {executiveSummary.executive_summary.overview.scope} | 
                  Time Period: {executiveSummary.executive_summary.overview.time_period}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">Key Objectives</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {executiveSummary.executive_summary.overview.key_objectives?.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Key Findings */}
        {executiveSummary.executive_summary?.key_findings && renderKeyFindings()}
        
        {/* Trend Analysis */}
        {executiveSummary.executive_summary?.trend_analysis && renderTrendAnalysis()}
        
        {/* Critical Analysis */}
        {executiveSummary.executive_summary?.critical_analysis && renderCriticalAnalysis()}
        
        {/* Recommendations */}
        {executiveSummary.executive_summary?.recommendations && renderRecommendations()}
        
        {/* Risk Assessment */}
        {executiveSummary.executive_summary?.risk_assessment && renderRiskAssessment()}
        
        {/* Conclusion */}
        {executiveSummary.executive_summary?.conclusion && renderConclusion()}
        
        {/* Supporting Data */}
        {executiveSummary.supporting_data && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supporting Data</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Methodology</h4>
                    <p className="text-sm text-muted-foreground">
                      {executiveSummary.supporting_data.methodology || 'No methodology provided.'}
                    </p>
                  </div>
                  
                  {executiveSummary.supporting_data.limitations?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Limitations</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {executiveSummary.supporting_data.limitations.map((limitation, i) => (
                          <li key={i}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {executiveSummary.supporting_data.assumptions?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Assumptions</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {executiveSummary.supporting_data.assumptions.map((assumption, i) => (
                          <li key={i}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Analysis Metadata */}
        {renderMetadata()}
      </div>
    );
  };

  // Render detailed sentiment analysis section
  const renderSentimentAnalysis = () => {
    if (!leaderProfile?.leader_profile?.sentiment) return null;
    
    const { overall, by_region, by_demographic } = leaderProfile.leader_profile.sentiment;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Overall Sentiment</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">Positive</p>
              <p className="text-2xl font-bold">{overall.positive}%</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">Negative</p>
              <p className="text-2xl font-bold">{overall.negative}%</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">Neutral</p>
              <p className="text-2xl font-bold">{overall.neutral}%</p>
            </div>
          </div>
        </div>
        
        {by_region && Object.keys(by_region).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Sentiment by Region</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(by_region).map(([region, data]) => (
                <Card key={region}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{region}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Positive:</span>
                        <span className="font-medium text-green-600">{data.positive}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Negative:</span>
                        <span className="font-medium text-red-600">{data.negative}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Neutral:</span>
                        <span className="font-medium text-blue-600">{data.neutral}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {by_demographic && (
          <div className="space-y-4">
            <h3 className="font-semibold">Sentiment by Demographic</h3>
            <Tabs defaultValue="age" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="age">Age</TabsTrigger>
                <TabsTrigger value="gender">Gender</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
              </TabsList>
              
              <TabsContent value="age" className="pt-4">
                {by_demographic.age_group ? (
                  <div className="space-y-2">
                    {Object.entries(by_demographic.age_group).map(([ageGroup, data]) => (
                      <div key={ageGroup} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{ageGroup}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div className="text-sm text-green-600">↑ {data.positive}%</div>
                          <div className="text-sm text-red-600">↓ {data.negative}%</div>
                          <div className="text-sm text-blue-600">→ {data.neutral}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No age group data available</p>
                )}
              </TabsContent>
              
              <TabsContent value="gender" className="pt-4">
                {by_demographic.gender ? (
                  <div className="space-y-2">
                    {Object.entries(by_demographic.gender).map(([gender, data]) => (
                      <div key={gender} className="p-3 border rounded-lg">
                        <h4 className="font-medium capitalize">{gender}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div className="text-sm text-green-600">↑ {data.positive}%</div>
                          <div className="text-sm text-red-600">↓ {data.negative}%</div>
                          <div className="text-sm text-blue-600">→ {data.neutral}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No gender data available</p>
                )}
              </TabsContent>
              
              <TabsContent value="education" className="pt-4">
                {by_demographic.education_level ? (
                  <div className="space-y-2">
                    {Object.entries(by_demographic.education_level).map(([level, data]) => (
                      <div key={level} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{level}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div className="text-sm text-green-600">↑ {data.positive}%</div>
                          <div className="text-sm text-red-600">↓ {data.negative}%</div>
                          <div className="text-sm text-blue-600">→ {data.neutral}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No education level data available</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    );
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Leader Profile</TabsTrigger>
        <TabsTrigger value="summary">Executive Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        {leaderProfile ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {leaderProfile.leader_profile?.name || 'Leader Profile'}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {leaderProfile.leader_profile?.position || ''}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Basic Information</h3>
                      <div className="space-y-1">
                        <p className="flex items-center">
                          <span className="w-32 text-muted-foreground">Party:</span>
                          <span>{leaderProfile.leader_profile?.party_affiliation || 'N/A'}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="w-32 text-muted-foreground">Constituency:</span>
                          <span>{leaderProfile.leader_profile?.constituency || 'N/A'}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="w-32 text-muted-foreground">Influence Score:</span>
                          <span className="font-medium">{leaderProfile.leader_profile?.influence_score || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Key Metrics</h3>
                      {leaderProfile.leader_profile?.key_metrics && (
                        <div className="space-y-1">
                          <p className="flex items-center">
                            <span className="w-32 text-muted-foreground">Approval Rating:</span>
                            <span className="font-medium">
                              {leaderProfile.leader_profile.key_metrics.approval_rating || 'N/A'}%
                            </span>
                          </p>
                          <p className="flex items-center">
                            <span className="w-32 text-muted-foreground">Trust Index:</span>
                            <span className="font-medium">
                              {leaderProfile.leader_profile.key_metrics.trust_index || 'N/A'}/100
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sentiment Analysis Section */}
                  {leaderProfile.leader_profile?.sentiment && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg mb-4">Sentiment Analysis</h3>
                      {renderSentimentAnalysis()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Political Career Section */}
            {leaderProfile.leader_profile?.political_career?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Political Career</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-gray-200 dark:border-gray-700 ml-4">
                    {leaderProfile.leader_profile.political_career.map((role, index) => (
                      <div key={index} className="mb-8 ml-6">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900"></div>
                        <time className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {role.year}
                        </time>
                        <h3 className="text-lg font-semibold mt-1">{role.position}</h3>
                        
                        {role.achievements?.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Achievements</h4>
                            <ul className="mt-1 space-y-1 text-sm">
                              {role.achievements.map((achievement, i) => (
                                <li key={i} className="flex items-start">
                                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>{achievement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {role.controversies?.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Controversies</h4>
                            <ul className="mt-1 space-y-1 text-sm">
                              {role.controversies.map((controversy, i) => (
                                <li key={i} className="flex items-start">
                                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>{controversy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Comparison with Peers Section */}
            {leaderProfile.leader_profile?.comparison_with_peers?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Comparison with Peers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {leaderProfile.leader_profile.comparison_with_peers.map((peer, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{peer.name}</h3>
                            <p className="text-sm text-muted-foreground">{peer.party}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">Approval Rating</div>
                            <div className={`text-lg font-bold ${
                              peer.approval_rating > (leaderProfile.leader_profile.key_metrics?.approval_rating || 0) 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {peer.approval_rating}%
                              {peer.approval_rating > (leaderProfile.leader_profile.key_metrics?.approval_rating || 0) 
                                ? ' ↑' 
                                : ' ↓'}
                            </div>
                          </div>
                        </div>
                        
                        {peer.key_differences?.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-1">Key Differences</h4>
                            <ul className="space-y-1 text-sm">
                              {peer.key_differences.map((difference, i) => (
                                <li key={i} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2"></div>
                                  <span>{difference}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Recent Activities Section */}
            {leaderProfile.leader_profile?.recent_activities?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {leaderProfile.leader_profile.recent_activities.map((activity, index) => {
                      const positivePercent = activity.media_coverage.positive || 0;
                      const negativePercent = activity.media_coverage.negative || 0;
                      const neutralPercent = activity.media_coverage.neutral || 0;
                      
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{activity.event}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                positivePercent > negativePercent 
                                  ? 'text-green-600' 
                                  : negativePercent > positivePercent 
                                    ? 'text-red-600' 
                                    : 'text-gray-600'
                              }`}>
                                {positivePercent > negativePercent ? 'Positive' : negativePercent > positivePercent ? 'Negative' : 'Neutral'}
                              </div>
                              <div className="text-xs text-muted-foreground">Media Coverage</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                              <div 
                                className="bg-green-500" 
                                style={{ width: `${positivePercent}%` }}
                                title={`Positive: ${positivePercent}%`}
                              ></div>
                              <div 
                                className="bg-red-500" 
                                style={{ width: `${negativePercent}%` }}
                                title={`Negative: ${negativePercent}%`}
                              ></div>
                              <div 
                                className="bg-gray-400" 
                                style={{ width: `${neutralPercent}%` }}
                                title={`Neutral: ${neutralPercent}%`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Positive: {positivePercent}%</span>
                              <span>Neutral: {neutralPercent}%</span>
                              <span>Negative: {negativePercent}%</span>
                            </div>
                          </div>
                          
                          {activity.impact && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <p className="text-sm font-medium text-blue-700">Impact:</p>
                              <p className="text-sm text-blue-600">{activity.impact}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Public Perception Section */}
            {leaderProfile.leader_profile?.public_perception && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Public Perception</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Strengths */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <ThumbsUp className="w-5 h-5 text-green-500 mr-2" />
                        <h3 className="text-lg font-semibold">Strengths</h3>
                      </div>
                      <ul className="space-y-2">
                        {leaderProfile.leader_profile.public_perception.strengths?.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Weaknesses */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <ThumbsDown className="w-5 h-5 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold">Weaknesses</h3>
                      </div>
                      <ul className="space-y-2">
                        {leaderProfile.leader_profile.public_perception.weaknesses?.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Opportunities */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                        <h3 className="text-lg font-semibold">Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {leaderProfile.leader_profile.public_perception.opportunities?.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Threats */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                        <h3 className="text-lg font-semibold">Threats</h3>
                      </div>
                      <ul className="space-y-2">
                        {leaderProfile.leader_profile.public_perception.threats?.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p>No profile data available</p>
        )}
      </TabsContent>

      <TabsContent value="summary" className="mt-4">
        {renderExecutiveSummary()}
      </TabsContent>
    </Tabs>
  );
};

export default ProfileSummaryTab;
