import './index.css';
import * as React from "react";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById('root'));

function App() {
    const handleClick = async () => {
        try {
            const result = await window.agent.start();
            console.log(result); // → 'Agent started'
        } catch (err) {
            console.error('Failed to run agent:', err);
        }
    };

    return (
        <div>
            <h1>Run Agent</h1>
            <button onClick={handleClick}>Start</button>
        </div>
    );
}

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);