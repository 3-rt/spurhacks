import React from 'react';

function OperationsList() {
  return (
    <div className="flex-1 bg-black text-gray-300 p-6 font-mono overflow-y-auto h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-300 mb-1">
          Operations List
        </h2>
        <p className="text-sm text-gray-400">Stagehand browser automation tasks</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900/30 border border-gray-600 p-6">
          <div className="mb-3">
            <span className="text-sm text-gray-400">Status: </span>
            <span className="text-green-400 font-bold">Active</span>
          </div>
          <p className="text-gray-300 text-base mb-6 leading-relaxed">
            Browser automation agent is ready to execute tasks. Enter commands in the input field to get started.
          </p>
          <div className="text-xs text-gray-500">
            • Voice input supported<br/>
            • Session persistence enabled<br/>
            • Memory context available
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationsList
