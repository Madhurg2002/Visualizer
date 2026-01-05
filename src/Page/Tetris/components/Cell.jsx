import React from 'react';

export default function Cell({ type }) {
  return <div className={`w-8 h-8 border border-gray-700 ${type}`}></div>;
}
