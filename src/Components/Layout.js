
import React from 'react';
import Navbar from './Navbar';

import { useLocation } from 'react-router-dom';


const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-[#0B0C15] font-sans">
            <Navbar />
            <main className="flex-grow pt-28 w-full max-w-[100vw] overflow-x-hidden flex flex-col">
                {children}
            </main>

        </div>
    );
};

export default Layout;
