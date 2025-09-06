'use client';

import { FiTarget, FiAlertTriangle, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi';

const OppositionTracking = () => {
  // Sample data - replace with actual data from props if available
  const oppositionData = {
    counter_strategies: [
      "Showcase completed infrastructure projects with before/after visuals",
      "Organize regular public meetings to address concerns directly",
      "Launch citizen feedback portals for transparent governance",
      "Highlight comparative development statistics with neighboring constituencies"
    ],
    recent_opposition_campaigns: [
      'Questioning Metro project delays and cost overruns',
      'Highlighting traffic management failures in Thane',
      'Criticizing high-density construction approvals',
      'Raising concerns about water shortage in summer months'
    ],
    top_opponents: [
      {
        name: 'Rahul Narvekar',
        party: 'BJP',
        approval: '42%',
        key_strategy: 'Focusing on governance issues and development delays'
      },
      {
        name: 'Aaditya Thackeray',
        party: 'Shiv Sena (UBT)',
        approval: '38%',
        key_strategy: 'Highlighting environmental concerns and public welfare'
      },
      {
        name: 'Nitesh Rane',
        party: 'BJP',
        approval: '35%',
        key_strategy: 'Targeting local governance and infrastructure issues'
      }
    ]
  };

  const { counter_strategies, recent_opposition_campaigns, top_opponents } = oppositionData;

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Opposition Tracking</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Counter Strategies */}
        <div className="lg:col-span-2">
          <div className="flex items-center mb-4">
            <FiTarget className="text-blue-600 mr-2" />
            <h4 className="text-xl font-semibold text-gray-800">Counter Strategies</h4>
          </div>
          <div className="space-y-3">
            {counter_strategies.map((strategy, idx) => (
              <div 
                key={`strategy-${idx}`}
                className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg hover:shadow-md transition-shadow"
              >
                <p className="text-gray-800">{strategy}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Opposition Campaigns */}
        <div>
          <div className="flex items-center mb-4">
            <FiAlertTriangle className="text-orange-500 mr-2" />
            <h4 className="text-xl font-semibold text-gray-800">Recent Campaigns</h4>
          </div>
          <div className="space-y-4">
            {recent_opposition_campaigns.map((campaign, idx) => (
              <div 
                key={`campaign-${idx}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <FiClock className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-gray-800">{campaign}</p>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <FiUsers className="mr-1" />
                      <span>High Engagement</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Opponents */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <FiTrendingUp className="text-red-500 mr-2" />
          <h4 className="text-xl font-semibold text-gray-800">Top Opponents</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top_opponents.map((opponent, idx) => {
            const approval = opponent.approval ? 
              parseFloat(opponent.approval.replace('%', '')) : 0;
              
            return (
              <div 
                key={`opponent-${idx}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">{opponent.name}</h5>
                    <p className="text-sm text-gray-600">{opponent.party}</p>
                  </div>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      approval > 40 ? 'bg-red-100 text-red-800' :
                      approval > 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {approval}% Approval
                  </span>
                </div>
                {opponent.key_strategy && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Strategy:</span> {opponent.key_strategy}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OppositionTracking;
