import React from 'react';

export default function Cell({ type }) {
  return <div className={`w-6 h-6 md:w-8 md:h-8 border border-gray-700 ${type}`}></div>;
}
