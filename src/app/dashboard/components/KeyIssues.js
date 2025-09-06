'use client';

const KeyIssues = ({ data }) => {
  const keyIssues = [
    "Infrastructure development and maintenance",
    "Healthcare system strengthening",
    "Agricultural modernization and support",
    "Youth employment and skill development",
    "Women safety and empowerment",
    "Education quality improvement",
    "Industrial development and investment",
    "Environmental conservation",
    "Digital governance expansion",
    "Social harmony and inclusion"
  ];

  const communitySentiments = [
    { group: 'Marathi Community', sentiment: '72% positive', key_issues: 'Employment, cultural preservation' },
    { group: 'Gujarati Community', sentiment: '68% positive', key_issues: 'Business environment, infrastructure' },
    { group: 'North Indian migrants', sentiment: '55% positive', key_issues: 'Integration, housing' },
    { group: 'South Indian professionals', sentiment: '63% positive', key_issues: 'Connectivity, education' },
    { group: 'Scheduled Castes', sentiment: '61% positive', key_issues: 'Reservation, welfare schemes' },
    { group: 'Other Backward Classes', sentiment: '58% positive', key_issues: 'Education, employment opportunities' }
  ];

  const casteRelatedIssues = [
    'Marathi language prominence in government communications',
    'Balanced representation in development projects across communities',
    'Cultural festival celebrations and government support',
    'Employment opportunities for local Marathi youth',
    'Integration programs for migrant communities'
  ];

  return (
    <div className="bg-white shadow rounded-xl p-6 space-y-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Issues Analysis</h3>
      
      {/* Main Key Issues */}
      <div>
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Key Policy Focus Areas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {keyIssues.map((issue, idx) => (
            <div key={`issue-${idx}`} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span className="text-gray-700">{issue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community Sentiments */}
      <div>
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Community Sentiment Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communitySentiments.map((item, idx) => (
            <div 
              key={`community-${idx}`}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h5 className="font-semibold text-gray-900 mb-2">{item.group}</h5>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Sentiment:</span>
                <span className={`font-medium ${
                  item.sentiment.includes('positive') ? 'text-green-600' : 
                  item.sentiment.includes('negative') ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {item.sentiment}
                </span>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Key Issues:</span>
                <p className="text-gray-800">{item.key_issues}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caste Related Issues */}
      <div>
        <h4 className="text-xl font-semibold text-gray-800 mb-3">Caste Related Issues</h4>
        <ul className="space-y-2">
          {casteRelatedIssues.map((issue, idx) => (
            <li key={`caste-${idx}`} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span className="text-gray-700">{issue}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default KeyIssues;
