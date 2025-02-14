"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Mon', active: 4, reports: 2 },
  { name: 'Tue', active: 3, reports: 1 },
  { name: 'Wed', active: 7, reports: 3 },
  { name: 'Thu', active: 5, reports: 2 },
  { name: 'Fri', active: 6, reports: 4 },
  { name: 'Sat', active: 8, reports: 5 },
  { name: 'Sun', active: 4, reports: 2 },
];

export function HealthTrendsChart() {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold dark:text-white">Health Activity</h3>
          <p className="text-sm text-text-muted dark:text-gray-400">Your weekly engagement</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            +12.5% vs last week
          </span>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
              }}
              cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="active" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              fill="url(#colorActive)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
