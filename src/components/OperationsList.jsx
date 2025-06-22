import React from 'react';

const missions = [
  { id: "op-01", code: "Omega", description: "Track high-value target in Eastern Europe" },
  { id: "op-02", code: "n0va", description: "Infiltrate cybercrime network in Seoul" },
  { id: "op-03", code: "5ilentfire", description: "Intercept illegal arms trade in Libya" },
  { id: "op-04", code: "Omega", description: "Track high-value target in Eastern Europe" },
]

const Button = ({ children, className = "", onClick }) => {
  const buttonStyle = {
    background: "#374151",
    color: "#d1d5db",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "8px 24px",
    border: "1px solid #4b5563",
    cursor: "pointer",
    transition: "all 0.3s ease",
    clipPath: "polygon(85% 0, 100% 25%, 100% 100%, 15% 100%, 0 75%, 0 0)",
  }

  const handleMouseEnter = (e) => {
    e.target.style.background = "#4b5563"
    e.target.style.color = "#ffffff"
  }

  const handleMouseLeave = (e) => {
    e.target.style.background = "#374151"
    e.target.style.color = "#d1d5db"
  }

  return (
    <button
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

const CornerBracket = ({ position }) => {
  const baseStyle = {
    position: "absolute",
    width: "12px",
    height: "12px",
  }

  const lineStyle = {
    position: "absolute",
    backgroundColor: "#6b7280",
  }

  const positions = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
  }

  const getLines = (pos) => {
    switch (pos) {
      case "topLeft":
        return [
          { ...lineStyle, top: 0, left: 0, width: "12px", height: "2px" },
          { ...lineStyle, top: 0, left: 0, width: "2px", height: "12px" },
        ]
      case "topRight":
        return [
          { ...lineStyle, top: 0, right: 0, width: "12px", height: "2px" },
          { ...lineStyle, top: 0, right: 0, width: "2px", height: "12px" },
        ]
      case "bottomLeft":
        return [
          { ...lineStyle, bottom: 0, left: 0, width: "12px", height: "2px" },
          { ...lineStyle, bottom: 0, left: 0, width: "2px", height: "12px" },
        ]
      case "bottomRight":
        return [
          { ...lineStyle, bottom: 0, right: 0, width: "12px", height: "2px" },
          { ...lineStyle, bottom: 0, right: 0, width: "2px", height: "12px" },
        ]
      default:
        return []
    }
  }

  return (
    <div style={{ ...baseStyle, ...positions[position] }}>
      {getLines(position).map((style, index) => (
        <div key={index} style={style}></div>
      ))}
    </div>
  )
}

function OperationsList() {
  const handleDetailsClick = (missionId) => {
    console.log("Details clicked for mission:", missionId)
  }

  const handleJoinClick = (missionId) => {
    console.log("Join mission clicked for:", missionId)
  }

  return (
    <div className="flex-1 bg-black text-gray-300 p-6 font-mono overflow-y-auto h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-300 mb-1">
          Operations List <span className="text-red-500">({missions.length * 5})</span>
        </h2>
        <p className="text-sm text-gray-400">4 updates in the previous 24 hours</p>
      </div>

      <div className="space-y-6">
        {missions.map((mission) => (
          <div key={mission.id} className="bg-gray-900/30 border border-gray-600 p-6 relative">
            <CornerBracket position="topLeft" />
            <CornerBracket position="topRight" />
            <CornerBracket position="bottomLeft" />
            <CornerBracket position="bottomRight" />

            <div className="mb-3">
              <span className="text-sm text-gray-400">Mission Code: </span>
              <span className="text-white font-bold">{mission.code}</span>
            </div>

            <p className="text-gray-300 text-base mb-6 leading-relaxed">{mission.description}</p>

            <div className="flex items-center gap-4">
              <Button onClick={() => handleDetailsClick(mission.id)}>Details</Button>
              <Button onClick={() => handleJoinClick(mission.id)}>Mission »</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OperationsList
