
'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, LabelList } from 'recharts';
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
                    tickFormatter={(str) => format(parseISO(str), 'ha')}
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const date = parseISO(payload.value);
                      // Show tick only for every 3rd hour
                      if (date.getHours() % 3 !== 0) {
                        return null;
                      }
                      return (
                        <g transform={`translate(${x},${y + 10})`}>
                          <text x={0} y={0} textAnchor="middle" fill="hsl(var(--primary-foreground))" opacity={0.8} fontSize={12}>
                            {format(date, 'ha')}
                          </text>
                        </g>
                      );
                    }}
                />
                 <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--primary))',
                        borderColor: 'hsl(var(--primary-foreground) / 0.2)',
                        borderRadius: '0.5rem',
                        color: 'hsl(var(--primary-foreground))',
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
                </Area>
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
}

    