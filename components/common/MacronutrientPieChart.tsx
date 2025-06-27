
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

interface MacronutrientPieChartProps {
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

const MacronutrientPieChart: React.FC<MacronutrientPieChartProps> = ({ protein, carbs, fat }) => {
  const { t } = useTranslation();

  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  if (totalCalories === 0 || isNaN(totalCalories) || !isFinite(totalCalories)) {
    return <p className="text-sm text-slate-500 py-4 text-center">{t('macronutrientBreakdown.noData')}</p>;
  }

  const data = [
    { name: t('protein'), value: proteinCalories, grams: protein.toFixed(1) },
    { name: t('carbs'), value: carbsCalories, grams: carbs.toFixed(1) },
    { name: t('fat'), value: fatCalories, grams: fat.toFixed(1) },
  ].filter(item => item.value > 0); // Only include macros with calories

  const COLORS = {
    [t('protein')]: '#38bdf8', // Tailwind sky-400
    [t('carbs')]: '#f59e0b',  // Tailwind amber-500
    [t('fat')]: '#f43f5e',     // Tailwind rose-500
  };
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, grams }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label if slice is too small

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] sm:text-xs font-medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          stroke="#f8fafc" // slate-50 for border between slices
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#cccccc'} />
          ))}
        </Pie>
        <Tooltip 
            formatter={(value: number, name: string, props) => {
                 const percentage = totalCalories > 0 ? (value / totalCalories * 100).toFixed(1) : 0;
                 return [`${props.payload.grams}g (${percentage}%)`, name]; // Show grams and percentage of total calories
            }}
            contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0', // slate-200
                borderRadius: '0.375rem', // rounded-md
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', // shadow-md
                padding: '8px 12px',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: '600' }} // slate-800
            itemStyle={{ color: '#334155' }} // slate-700
        />
        <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            formatter={(value, entry) => {
                const { color } = entry;
                const item = data.find(d => d.name === value);
                // Display name and grams in legend
                return <span style={{ color }}>{value} ({item?.grams}g)</span>;
            }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default MacronutrientPieChart;
