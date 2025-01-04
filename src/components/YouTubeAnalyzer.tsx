import React, { useState, useEffect } from "react";
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
import { ChannelModal } from "./ChannelModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

interface WatchTimeStats {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  averageMinutesPerDay: number;
  shortFormPercentage: number;
  longFormPercentage: number;
  peakWatchMonth: string;
  peakWatchHours: number;
  monthlyAverageHours: number;
  weekdayHours: number;
  weekendHours: number;
  longestWatchStreak: number;
  estimatedSavedTime: number; // For watching at 2x speed
  watchTimeByMonth: { month: string; hours: number }[];
  watchTimeByDayOfWeek: { day: string; hours: number }[];
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
  shortVideos: number;
  streamVideos: number;
  mostWatchedDomain: string;
  domainStats: { name: string; count: number }[];
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

export interface VideoData {
  header: string;
  title: string;
  titleUrl: string;
  subtitles?: Array<{ name: string; url: string }>;
  time: string;
  products: string[];
  activityControls: string[];
}

interface ChannelDetails {
  count: number;
  watchMinutes: number;
  firstWatch: Date;
  lastWatch: Date;
  videos: VideoData[];
}

interface YouTubeAnalyzerProps {}

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

const CHANNELS_PER_PAGE = 50; // Show 50 channels per page

const YouTubeAnalyzer: React.FC<YouTubeAnalyzerProps> = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [channelStats, setChannelStats] = useState<Record<string, ChannelDetails>>({});
  const [selectedChannel, setSelectedChannel] = useState<{
    name: string;
    details: ChannelDetails;
  } | null>(null);
  const [displayedChannels, setDisplayedChannels] = useState<ChannelStats[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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

    // Calculate watch time statistics
    const watchTimeByMonth = Object.entries(watchData.reduce((acc: Record<string, number>, video) => {
      const date = new Date(video.time);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + estimateWatchTime(video.title);
      return acc;
    }, {}))
      .map(([month, minutes]) => ({
        month,
        hours: Math.round(minutes / 60),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const peakWatchMonth = [...watchTimeByMonth].sort((a, b) => b.hours - a.hours)[0];

    // Calculate watch time by day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const watchTimeByDayOfWeek = daysOfWeek.map(day => {
      const minutes = watchData
        .filter(video => daysOfWeek[new Date(video.time).getDay()] === day)
        .reduce((acc, video) => acc + estimateWatchTime(video.title), 0);
      return { day, hours: Math.round(minutes / 60) };
    });

    // Calculate weekend vs weekday hours
    const weekdayHours = watchTimeByDayOfWeek
      .filter(({ day }) => !['Sunday', 'Saturday'].includes(day))
      .reduce((acc, { hours }) => acc + hours, 0);
    const weekendHours = watchTimeByDayOfWeek
      .filter(({ day }) => ['Sunday', 'Saturday'].includes(day))
      .reduce((acc, { hours }) => acc + hours, 0);

    // Calculate watch streak
    const watchDates = [...new Set(watchData.map(v => new Date(v.time).toDateString()))].sort();
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < watchDates.length; i++) {
      const prevDate = new Date(watchDates[i - 1]);
      const currDate = new Date(watchDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    const watchTimeStats: WatchTimeStats = {
      totalMinutes: Math.round(estimatedMinutes),
      totalHours: Math.round(estimatedMinutes / 60),
      totalDays: Math.round(estimatedMinutes / 1440),
      averageMinutesPerDay: Math.round(estimatedMinutes / totalDays),
      shortFormPercentage: Math.round((watchData.filter(v => 
        v.title.toLowerCase().includes("short") || 
        v.title.toLowerCase().includes("#shorts") ||
        v.titleUrl.toLowerCase().includes("/shorts/")
      ).length / totalVideos) * 100),
      longFormPercentage: Math.round(((watchData.filter(v => 
        v.title.toLowerCase().includes("stream") || 
        v.title.toLowerCase().includes("live") ||
        v.title.toLowerCase().includes("[live]") ||
        v.title.toLowerCase().includes("🔴")
      ).length + watchData.filter(v => !v.title.toLowerCase().includes("short") && !v.title.toLowerCase().includes("stream") && !v.title.toLowerCase().includes("live") && !v.title.toLowerCase().includes("[live]") && !v.title.toLowerCase().includes("🔴")).length) / totalVideos) * 100),
      peakWatchMonth: peakWatchMonth.month,
      peakWatchHours: peakWatchMonth.hours,
      monthlyAverageHours: Math.round(watchTimeByMonth.reduce((acc, { hours }) => acc + hours, 0) / watchTimeByMonth.length),
      weekdayHours,
      weekendHours,
      longestWatchStreak: maxStreak,
      estimatedSavedTime: Math.round(estimatedMinutes * 0.5 / 60), // Assuming average 2x speed
      watchTimeByMonth,
      watchTimeByDayOfWeek,
    };

    // Channel stats
    const channelStatsData = watchData.reduce<Record<string, ChannelDetails>>((acc, item) => {
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

    // Store channelStats in state
    setChannelStats(channelStatsData);

    // Get top channels
    const topChannels: ChannelStats[] = Object.entries(channelStatsData)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([channel, stats]) => ({
        channel: channel.length > 30 ? channel.substring(0, 30) + "..." : channel,
        videos: stats.count,
        watchTime: Math.round(stats.watchMinutes / 60), // hours
        streak: Math.round(
          (stats.lastWatch.getTime() - stats.firstWatch.getTime()) / (1000 * 60 * 60 * 24)
        ), // days
      }));

    // Calculate hourly distribution
    const hourlyDistribution: Record<number, number> = {};
    watchData.forEach((video) => {
      const hour = new Date(video.time).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Calculate yearly distribution
    const yearlyDistribution: Record<string, number> = {};
    const yearlyWatchTime: Record<string, number> = {};
    watchData.forEach((video) => {
      const year = new Date(video.time).getFullYear().toString();
      yearlyDistribution[year] = (yearlyDistribution[year] || 0) + 1;
      yearlyWatchTime[year] = (yearlyWatchTime[year] || 0) + estimateWatchTime(video.title);
    });

    // Calculate yearly data
    const yearlyData: YearlyData[] = Object.entries(yearlyDistribution)
      .map(([year, videos]) => ({
        year: parseInt(year),
        videos,
        hours: Math.round(yearlyWatchTime[year] / 60),
      }))
      .sort((a, b) => a.year - b.year);

    // Extract video domains and their counts
    const domainCounts = watchData.reduce((acc: Record<string, number>, video) => {
      try {
        const url = new URL(video.titleUrl);
        const domain = url.hostname.replace('www.', '');
        acc[domain] = (acc[domain] || 0) + 1;
      } catch (e) {
        // Skip invalid URLs
      }
      return acc;
    }, {});

    const domainStats = Object.entries(domainCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate video length distribution
    const shortVideos = watchData.filter(v => 
      v.title.toLowerCase().includes("short") || 
      v.title.toLowerCase().includes("#shorts") ||
      v.titleUrl.toLowerCase().includes("/shorts/")
    ).length;
    
    const streamVideos = watchData.filter(v => 
      v.title.toLowerCase().includes("stream") || 
      v.title.toLowerCase().includes("live") ||
      v.title.toLowerCase().includes("[live]") ||
      v.title.toLowerCase().includes("🔴")
    ).length;

    const regularVideos = totalVideos - shortVideos - streamVideos;

    // Calculate basic stats
    const basicStats: BasicStats = {
      totalVideos: watchData.length,
      totalDays,
      uniqueChannels: Object.keys(channelStatsData).length,
      averageVideosPerChannel: Math.round(watchData.length / Object.keys(channelStatsData).length),
      videosPerDay: Math.round(watchData.length / totalDays),
      firstVideo: watchData[watchData.length - 1].title,
      lastVideo: watchData[0].title,
      peakHours: Array.from({ length: 24 }, (_, i) => hourlyDistribution[i] || 0),
      mostActiveYear: Object.entries(yearlyDistribution).sort(([, a], [, b]) => b - a)[0][0],
      shortVideos,
      streamVideos,
      mostWatchedDomain: domainStats[0]?.name || 'youtube.com',
      domainStats: domainStats.slice(0, 5)
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

  // Handle scroll for channel rankings
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight * 1.2 &&
      !loading &&
      stats &&
      displayedChannels.length < stats.topChannels.length
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // Load more channels when page changes
  useEffect(() => {
    if (!stats) return;
    
    setLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      const newChannels = stats.topChannels.slice(0, page * CHANNELS_PER_PAGE);
      setDisplayedChannels(newChannels);
      setLoading(false);
    }, 300);
  }, [page, stats]);

  // Reset when new data is loaded
  useEffect(() => {
    if (stats) {
      setPage(1);
      setDisplayedChannels([]);
    }
  }, [stats]);

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
                      <p className="text-xs text-gray-400">
                        {stats.watchTimeStats.shortFormPercentage}% short form
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

              {/* Video Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Regular Videos", value: stats.basicStats.totalVideos - stats.basicStats.shortVideos - stats.basicStats.streamVideos },
                            { name: "Shorts", value: stats.basicStats.shortVideos },
                            { name: "Streams", value: stats.basicStats.streamVideos },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: "Regular Videos", value: stats.basicStats.totalVideos - stats.basicStats.shortVideos - stats.basicStats.streamVideos },
                            { name: "Shorts", value: stats.basicStats.shortVideos },
                            { name: "Streams", value: stats.basicStats.streamVideos },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.basicStats.domainStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.basicStats.domainStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Watch Time Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Watch Time Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Time Investment</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Total Hours:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.totalHours.toLocaleString()}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Days Equivalent:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.totalDays}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Daily Average:</span>{" "}
                          <span className="font-medium">{Math.round(stats.watchTimeStats.averageMinutesPerDay)} minutes</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Peak Activity</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Best Month:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.peakWatchMonth}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Hours that Month:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.peakWatchHours}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Monthly Average:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.monthlyAverageHours} hours</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Viewing Patterns</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Weekday Hours:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.weekdayHours}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Weekend Hours:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.weekendHours}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Longest Streak:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.longestWatchStreak} days</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Content Mix</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-500">Short Form:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.shortFormPercentage}%</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Long Form:</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.longFormPercentage}%</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-500">Time Saved (2x):</span>{" "}
                          <span className="font-medium">{stats.watchTimeStats.estimatedSavedTime} hours</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-80">
                      <h3 className="text-sm font-medium mb-4">Monthly Watch Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.watchTimeStats.watchTimeByMonth}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#4f46e5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-80">
                      <h3 className="text-sm font-medium mb-4">Watch Time by Day</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.watchTimeStats.watchTimeByDayOfWeek}>
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Channel Rankings */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Channel Rankings</CardTitle>
                    <span className="text-sm text-gray-500">
                      Showing {displayedChannels.length} of {stats.topChannels.length} channels
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea 
                    className="h-[600px] overflow-hidden" 
                    onScrollCapture={handleScroll}
                  >
                    <div className="pr-4">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rank
                            </th>
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
                          {displayedChannels.map((channel: ChannelStats, idx: number) => {
                            const channelDetails = channelStats[channel.channel];
                            return (
                              <tr
                                key={idx}
                                className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() =>
                                  setSelectedChannel({
                                    name: channel.channel,
                                    details: channelDetails,
                                  })
                                }
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  #{idx + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
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
                            );
                          })}
                        </tbody>
                      </table>
                      {loading && (
                        <div className="flex justify-center py-4">
                          <Spinner />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
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

          {selectedChannel && (
            <ChannelModal
              isOpen={!!selectedChannel}
              onClose={() => setSelectedChannel(null)}
              channelName={selectedChannel.name}
              videos={selectedChannel.details.videos}
              watchMinutes={selectedChannel.details.watchMinutes}
              firstWatch={selectedChannel.details.firstWatch}
              lastWatch={selectedChannel.details.lastWatch}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { YouTubeAnalyzer };
