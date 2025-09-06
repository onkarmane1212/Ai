'use client';

import { FiMessageSquare, FiLayers, FiTarget, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';

const StrategicRecommendations = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Recommendations</h3>
        <p className="text-gray-500">No strategic recommendations available at the moment.</p>
      </div>
    );
  }

  // Safely get array data with fallback to empty array
  const getSectionItems = (section) => {
    if (!data[section] || !Array.isArray(data[section])) {
      return [];
    }
    return data[section].filter(item => item && item.trim() !== '');
  };

  const sections = [
    {
      key: 'messaging',
      title: 'Messaging',
      icon: <FiMessageSquare className="text-blue-600" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      items: getSectionItems('messaging')
    },
    {
      key: 'content_suggestions',
      title: 'Content Suggestions',
      icon: <FiLayers className="text-green-600" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      items: getSectionItems('content_suggestions')
    },
    {
      key: 'audience_targeting',
      title: 'Audience Targeting',
      icon: <FiTarget className="text-purple-600" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      items: getSectionItems('audience_targeting')
    },
    {
      key: 'crisis_management',
      title: 'Crisis Management',
      icon: <FiAlertTriangle className="text-red-600" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      items: getSectionItems('crisis_management')
    }
  ];

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Strategic Recommendations</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sections.map((section) => (
          <div key={section.key} className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className={`p-2 ${section.bgColor} rounded-lg mr-3`}>
                {section.icon}
              </div>
              <h4 className="font-medium text-gray-800">{section.title}</h4>
            </div>
            
            {section.items.length > 0 ? (
              <ul className="space-y-2">
                {section.items.slice(0, 5).map((item, idx) => (
                  <li key={`${section.key}-${idx}`} className="flex items-start">
                    <div className={`${section.bgColor} p-0.5 rounded-full mr-2 mt-1`}>
                      <FiChevronRight className={`${section.textColor} text-xs`} />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
                {section.items.length > 5 && (
                  <li className="text-xs text-gray-500 mt-2">
                    +{section.items.length - 5} more items
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No {section.title.toLowerCase()} available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategicRecommendations;
