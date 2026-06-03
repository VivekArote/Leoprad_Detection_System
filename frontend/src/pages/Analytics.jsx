import React, { useState } from 'react';
import { 
  useDailyTrends, 
  useWeeklyTrends, 
  useMonthlyTrends, 
  useHourlyTrends, 
  useCameraAnalytics, 
  useConfidenceAnalytics 
} from '../hooks/queries';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [trendType, setTrendType] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  // Fetch trend data for all options
  const { data: dailyData, isLoading: loadingDaily } = useDailyTrends(30);
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyTrends(12);
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyTrends(12);

  // Fetch hourly trends, camera breakdown, and database-driven confidence analytics
  const { data: hourlyData, isLoading: loadingHourly } = useHourlyTrends(24);
  const { data: cameraData, isLoading: loadingCamera } = useCameraAnalytics();
  const { data: confidenceData, isLoading: loadingConfidence } = useConfidenceAnalytics();

  // Format daily date strings for chart
  const formattedDaily = dailyData?.map(item => {
    const d = new Date(item.date);
    return {
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      count: item.count
    };
  }) || [];

  // Format weekly strings for chart
  const formattedWeekly = weeklyData?.map(item => ({
    date: item.week,
    count: item.count
  })) || [];

  // Format monthly strings for chart
  const formattedMonthly = monthlyData?.map(item => {
    const [year, month] = item.month.split('-');
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = monthsName[parseInt(month, 10) - 1] || month;
    return {
      date: `${monthLabel} ${year}`,
      count: item.count
    };
  }) || [];

  // Determine current active trend selection
  let trendChartData = formattedDaily;
  let trendHeading = "DETECTIONS BY CALENDAR DATE";
  if (trendType === 'weekly') {
    trendChartData = formattedWeekly;
    trendHeading = "DETECTIONS BY ISO WEEK";
  } else if (trendType === 'monthly') {
    trendChartData = formattedMonthly;
    trendHeading = "DETECTIONS BY CALENDAR MONTH";
  }

  // Format hourly strings for chart
  const formattedHourly = hourlyData?.map(item => {
    const d = new Date(item.hour);
    return {
      hour: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: item.count
    };
  }) || [];

  // Format camera stats for comparison
  const formattedCamera = cameraData?.map(item => ({
    name: item.cameraId,
    count: item.count
  })) || [];

  // Format confidence distribution for chart
  const formattedConfidence = confidenceData?.distribution?.map(item => ({
    name: item.range,
    count: item.count
  })) || [];

  const isLoading = 
    loadingDaily || 
    loadingWeekly || 
    loadingMonthly || 
    loadingHourly || 
    loadingCamera || 
    loadingConfidence;

  return (
    <div className="space-y-6">
      
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 font-mono text-xs">Compiling analytical metrics from database...</div>
      ) : (
        <>
          {/* Recharts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dynamic Trends Chart (Daily/Weekly/Monthly) */}
            <div className="border border-slate-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">{trendHeading}</h2>
                <div className="flex gap-2 mt-2 sm:mt-0 font-mono text-[10px]">
                  <button 
                    onClick={() => setTrendType('daily')}
                    className={`px-2 py-0.5 border ${trendType === 'daily' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  >
                    DAILY
                  </button>
                  <button 
                    onClick={() => setTrendType('weekly')}
                    className={`px-2 py-0.5 border ${trendType === 'weekly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  >
                    WEEKLY
                  </button>
                  <button 
                    onClick={() => setTrendType('monthly')}
                    className={`px-2 py-0.5 border ${trendType === 'monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  >
                    MONTHLY
                  </button>
                </div>
              </div>
              <div className="h-60 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Bar dataKey="count" fill="#111827" barSize={trendType === 'daily' ? 10 : trendType === 'weekly' ? 18 : 24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Trends Chart */}
            <div className="border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">HOURLY INFERENCE COUNTS</h2>
              <div className="h-60 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedHourly} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="hour" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: '#111827' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Camera Station Breakdown */}
            <div className="border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">CAMERA STATION COMPARISON</h2>
              <div className="h-60 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedCamera} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Bar dataKey="count" fill="#4b5563" barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence Distribution (Dynamic Database Route) */}
            <div className="border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">CONFIDENCE DISTRIBUTION RANGE</h2>
              <div className="h-60 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedConfidence} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                    <Bar dataKey="count" fill="#6b7280" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table list */}
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4 font-mono">STATION ANALYTICAL TELEMETRY</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                    <th className="px-4 py-2">STATION ID</th>
                    <th className="px-4 py-2 text-right">TOTAL INFERENCES</th>
                    <th className="px-4 py-2 text-right">AVERAGE CONFIDENCE</th>
                    <th className="px-4 py-2 text-right">LAST INFERENCE TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {!cameraData || cameraData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-400">No active cameras in deployment.</td>
                    </tr>
                  ) : (
                    cameraData.map((c) => (
                      <tr key={c.cameraId} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.cameraId}</td>
                        <td className="px-4 py-3 text-right font-mono">{c.count}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{(c.averageConfidence * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {c.lastDetection ? new Date(c.lastDetection).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Analytics;
