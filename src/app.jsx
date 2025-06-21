import './index.css';
import * as React from "react";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <h1>Hello react</h1>
        <div className='flex text-blue-200'>
            <p>This is a simple React application running in Electron.</p>
            <p>Modify this file to start building your app!</p>
        </div>
    </React.StrictMode>
);