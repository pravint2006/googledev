
'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartData {
    time: string;
    value: number;
}

interface HourlyWeatherChartProps {
    data: ChartData[];
    unit: string;
    color: string;
}

const CustomizedLabel = (props: any) => {
    const { x, y, stroke, value, index } = props;
    // Show label every 3 hours
    if (index % 3 === 0) {
      return (
        <text x={x} y={y} dy={-10} fill="rgba(255,255,255,0.9)" fontSize={14} textAnchor="middle">
          {value}
        </text>
      );
    }
    return null;
  };

export function HourlyWeatherChart({ data, unit, color }: HourlyWeatherChartProps) {
  return (
    <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: -10 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="time"
                    tickFormatter={(str) => {
                        const date = parseISO(str);
                        if (date.getHours() % 3 === 0) {
                            return format(date, 'ha');
                        }
                        return '';
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const date = parseISO(payload.value);
                      if (date.getHours() % 3 !== 0) {
                        return null; // Hide tick if it's not on the 3-hour mark
                      }
                      return (
                        <g transform={`translate(${x},${y + 10})`}>
                          <text x={0} y={0} textAnchor="middle" fill="#FFFFFF" fontSize={12} opacity={1}>
                            {format(date, 'ha')}
                          </text>
                        </g>
                      );
                    }}
                />
                 <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        color: '#fff',
                    }}
                    labelFormatter={(label) => format(parseISO(label), 'eeee, h:mm a')}
                    formatter={(value, name) => {
                        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                        return [`${value}${unit}`, capitalizedName];
                    }}
                    itemStyle={{ padding: 0 }}
                    labelStyle={{ marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)">
                   {/* The LabelList was showing temperature values directly on the chart, which is not desired in this case. */}
                </Area>
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
}

