import { CategoricalChartProps } from "recharts";

export const chartConfig = {
  chart: {
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  },
  xAxis: {
    dataKey: "name" as const,
    fontSize: 12,
    padding: { left: 0, right: 0 },
    height: 60,
    axisLine: false,
    tickLine: false,
  },
  yAxis: {
    fontSize: 12,
    width: 60,
    axisLine: false,
    tickLine: false,
  },
  line: {
    type: "monotone" as const,
    dataKey: "value" as const,
    stroke: "#4F46E5",
    strokeWidth: 2,
    dot: false,
    activeDot: { r: 4, strokeWidth: 0 },
  },
  grid: {
    strokeDasharray: "3 3",
  },
} as const;