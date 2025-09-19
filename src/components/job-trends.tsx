"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Jan",
    "Software Engineer": 4000,
    "Data Scientist": 2400,
    "Product Manager": 2400,
  },
  {
    name: "Feb",
    "Software Engineer": 3000,
    "Data Scientist": 1398,
    "Product Manager": 2210,
  },
  {
    name: "Mar",
    "Software Engineer": 2000,
    "Data Scientist": 9800,
    "Product Manager": 2290,
  },
  {
    name: "Apr",
    "Software Engineer": 2780,
    "Data Scientist": 3908,
    "Product Manager": 2000,
  },
  {
    name: "May",
    "Software Engineer": 1890,
    "Data Scientist": 4800,
    "Product Manager": 2181,
  },
  {
    name: "Jun",
    "Software Engineer": 2390,
    "Data Scientist": 3800,
    "Product Manager": 2500,
  },
  {
    name: "Jul",
    "Software Engineer": 3490,
    "Data Scientist": 4300,
    "Product Manager": 2100,
  },
];

export function JobTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Job Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This module provides a high-level view of the employment landscape,
          allowing users to track hiring velocity for specific roles, identify
          industries with the most growth, and understand the geographical
          distribution of opportunities.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="Software Engineer"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
            />
            <Area
              type="monotone"
              dataKey="Data Scientist"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
            />
            <Area
              type="monotone"
              dataKey="Product Manager"
              stackId="1"
              stroke="#ffc658"
              fill="#ffc658"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}