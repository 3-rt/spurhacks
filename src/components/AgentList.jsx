import React from 'react';

function AgentList() {
  const agents = [
    { id: 'agent-01', name: 'Omega', status: 'Active', mission: 'Track high-value target in Eastern Europe' },
    { id: 'agent-02', name: 'n0va', status: 'Active', mission: 'Infiltrate cybercrime network in Seoul' },
    { id: 'agent-03', name: 'S1lentfir3', status: 'Inactive', mission: 'Intercept illegal arms trade in Libya' },
  ];

  return (
    <div className="h-full bg-gray-800 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Agents</h2>
      <ul>
        {agents.map(agent => (
          <li key={agent.id} className="mb-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer">
            <div className="font-bold">{agent.name}</div>
            <div className="text-sm text-gray-400">{agent.status}</div>
            <div className="text-sm">{agent.mission}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AgentList; 