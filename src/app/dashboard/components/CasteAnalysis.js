'use client';

const CasteAnalysis = ({ data }) => {
  if (!data?.caste_groups?.length) return null;
  
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Caste Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Caste Groups */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-gray-800 mb-3">Caste Group Sentiment</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caste Group</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Issues</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.caste_groups.map((group, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{group.group}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        String(group.sentiment || '').includes('positive') ? 'bg-green-100 text-green-800' : 
                        String(group.sentiment || '').includes('negative') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.sentiment || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {group.key_issues || 'No specific issues'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Caste Related Issues */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Caste Related Issues</h4>
          <div className="space-y-4">
            {data.caste_related_issues?.length > 0 ? (
              data.caste_related_issues.map((issue, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <p className="text-sm text-gray-700">{issue}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No specific caste-related issues reported.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasteAnalysis;
