import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Clock, Calendar, Play, BarChart2, Tv2, Activity } from "lucide-react";

interface WatchTimeStats {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  averageMinutesPerDay: number;
}

interface BasicStats {
  totalVideos: number;
  totalDays: number;
  uniqueChannels: number;
  averageVideosPerChannel: number;
  videosPerDay: number;
  firstVideo: string;
  lastVideo: string;
  peakHours: number[];
  mostActiveYear: string;
}

interface ChannelStats {
  channel: string;
  videos: number;
  watchTime: number;
  streak: number;
}

interface YearlyData {
  year: number;
  videos: number;
  hours: number;
}

interface HourlyData {
  hour: number;
  videos: number;
}

interface Stats {
  basicStats: BasicStats;
  watchTimeStats: WatchTimeStats;
  topChannels: ChannelStats[];
  yearlyData: YearlyData[];
  hourlyData: HourlyData[];
}

interface VideoData {
  time: string;
  title: string;
  subtitles?: Array<{ name: string }>;
}

const COLORS = [
  "#4f46e5",
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#c7d2fe",
  "#312e81",
  "#3730a3",
  "#4338ca",
  "#4f46e5",
  "#6366f1",
];

interface YouTubeAnalyzerProps {}

const YouTubeAnalyzer: React.FC<YouTubeAnalyzerProps> = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  const estimateWatchTime = (title: string): number => {
    // Rough estimation based on typical video lengths
    if (title.toLowerCase().includes("short")) return 0.75; // 45 seconds
    if (title.toLowerCase().includes("stream") || title.toLowerCase().includes("live")) return 45; // 45 minutes
    return 8; // 8 minutes average
  };

  const processFiles = async (files: FileList | null): Promise<void> => {
    if (!files) return;

    try {
      const fileContents = await Promise.all(
        Array.from(files).map((file) => file.text().then((text) => JSON.parse(text)))
      );

      const combinedData = fileContents.flat();
      const watchStats = analyzeWatchHistory(combinedData);
      setStats(watchStats);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  const analyzeWatchHistory = (watchData: VideoData[]): Stats => {
    // Sort data by date
    watchData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Basic stats
    const totalVideos = watchData.length;
    const startDate = new Date(watchData[0].time);
    const endDate = new Date(watchData[watchData.length - 1].time);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Time watched estimation
    const estimatedMinutes = watchData.reduce(
      (acc, video) => acc + estimateWatchTime(video.title),
      0
    );
    const watchTimeStats: WatchTimeStats = {
      totalMinutes: Math.round(estimatedMinutes),
      totalHours: Math.round(estimatedMinutes / 60),
      totalDays: Math.round(estimatedMinutes / 1440), // minutes in a day
      averageMinutesPerDay: Math.round(estimatedMinutes / totalDays),
    };

    // Channel stats
    const channelStats = watchData.reduce<
      Record<
        string,
        {
          count: number;
          watchMinutes: number;
          firstWatch: Date;
          lastWatch: Date;
          videos: VideoData[];
        }
      >
    >((acc, item) => {
      const channel = item.subtitles?.[0]?.name;
      if (channel) {
        if (!acc[channel]) {
          acc[channel] = {
            count: 0,
            watchMinutes: 0,
            firstWatch: new Date(item.time),
            lastWatch: new Date(item.time),
            videos: [],
          };
        }
        acc[channel].count++;
        acc[channel].watchMinutes += estimateWatchTime(item.title);
        acc[channel].lastWatch = new Date(item.time);
        acc[channel].videos.push(item);
      }
      return acc;
    }, {});

    // Get top channels
    const topChannels: ChannelStats[] = Object.entries(channelStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([channel, stats]) => ({
        channel: channel.length > 30 ? channel.substring(0, 30) + "..." : channel,
        videos: stats.count,
        watchTime: Math.round(stats.watchMinutes / 60), // hours
        streak: Math.round(
          (stats.lastWatch.getTime() - stats.firstWatch.getTime()) / (1000 * 60 * 60 * 24)
        ), // days
      }));

    // Calculate viewing patterns
    const hourlyDistribution = watchData.reduce<Record<number, number>>((acc, item) => {
      const hour = new Date(item.time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Find peak hours
    const peakHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Yearly stats
    const yearlyStats = watchData.reduce<
      Record<
        number,
        {
          videos: number;
          watchMinutes: number;
        }
      >
    >((acc, item) => {
      const year = new Date(item.time).getFullYear();
      if (!acc[year]) {
        acc[year] = {
          videos: 0,
          watchMinutes: 0,
        };
      }
      acc[year].videos++;
      acc[year].watchMinutes += estimateWatchTime(item.title);
      return acc;
    }, {});

    const yearlyData: YearlyData[] = Object.entries(yearlyStats)
      .map(([year, stats]) => ({
        year: parseInt(year),
        videos: stats.videos,
        hours: Math.round(stats.watchMinutes / 60),
      }))
      .sort((a, b) => a.year - b.year);

    // Advanced stats
    const uniqueChannels = Object.keys(channelStats).length;
    const averageVideosPerChannel = totalVideos / uniqueChannels;
    const mostActiveYear = Object.entries(yearlyStats).sort(
      ([, a], [, b]) => b.videos - a.videos
    )[0];

    const basicStats: BasicStats = {
      totalVideos,
      totalDays,
      uniqueChannels,
      averageVideosPerChannel: Math.round(averageVideosPerChannel),
      videosPerDay: Math.round((totalVideos / totalDays) * 10) / 10,
      firstVideo: new Date(startDate).toLocaleDateString(),
      lastVideo: new Date(endDate).toLocaleDateString(),
      peakHours,
      mostActiveYear: mostActiveYear[0],
    };

    return {
      basicStats,
      watchTimeStats,
      topChannels,
      yearlyData,
      hourlyData: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        videos: hourlyDistribution[i] || 0,
      })),
    };
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>YouTube Watch History Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <input
              type="file"
              multiple
              accept=".json"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {stats && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4 text-indigo-500" />
                        <span className="text-2xl font-bold">
                          {stats.basicStats.totalVideos.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Total Videos</p>
                      <p className="text-xs text-gray-400">
                        ~{stats.basicStats.videosPerDay} videos per day
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        <span className="text-2xl font-bold">
                          {stats.watchTimeStats.totalHours.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Hours Watched</p>
                      <p className="text-xs text-gray-400">
                        ~{stats.watchTimeStats.averageMinutesPerDay} minutes per day
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Tv2 className="h-4 w-4 text-indigo-500" />
                        <span className="text-2xl font-bold">
                          {stats.basicStats.uniqueChannels.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Unique Channels</p>
                      <p className="text-xs text-gray-400">
                        ~{stats.basicStats.averageVideosPerChannel} videos per channel
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        <span className="text-2xl font-bold">
                          {stats.basicStats.mostActiveYear}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Most Active Year</p>
                      <p className="text-xs text-gray-400">
                        Peak hours: {stats.basicStats.peakHours.map((h) => `${h}:00`).join(", ")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Yearly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Yearly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.yearlyData}>
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                        <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="videos"
                          stroke="#4f46e5"
                          name="Videos"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hours"
                          stroke="#6366f1"
                          name="Hours"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Channels Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Channel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Videos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Watch Time (hrs)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Days Active
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.topChannels.map((channel: ChannelStats, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {channel.channel}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {channel.videos.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {channel.watchTime.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {channel.streak.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Viewing Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.hourlyData}>
                        <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                        <YAxis />
                        <Tooltip labelFormatter={(hour) => `${hour}:00`} />
                        <Bar dataKey="videos" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { YouTubeAnalyzer };
