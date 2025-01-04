import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { VideoData } from "./YouTubeAnalyzer";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  videos: VideoData[];
  watchMinutes: number;
  firstWatch: Date;
  lastWatch: Date;
}

const VIDEOS_PER_PAGE = 50;

export function ChannelModal({
  isOpen,
  onClose,
  channelName,
  videos,
  watchMinutes,
  firstWatch,
  lastWatch,
}: ChannelModalProps) {
  const [displayedVideos, setDisplayedVideos] = useState<VideoData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Sort videos by date, newest first
  const sortedVideos = [...videos].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  // Calculate monthly stats
  const monthlyStats = sortedVideos.reduce((acc: any[], video) => {
    const date = new Date(video.time);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existingMonth = acc.find(m => m.month === monthYear);
    
    if (existingMonth) {
      existingMonth.videos++;
    } else {
      acc.push({ month: monthYear, videos: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  // Calculate day of week stats
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = sortedVideos.reduce((acc: any[], video) => {
    const day = daysOfWeek[new Date(video.time).getDay()];
    const existingDay = acc.find(d => d.day === day);
    
    if (existingDay) {
      existingDay.videos++;
    } else {
      acc.push({ day, videos: 1 });
    }
    return acc;
  }, daysOfWeek.map(day => ({ day, videos: 0 })));

  // Calculate channel-specific stats
  const channelUrl = videos[0]?.subtitles?.[0]?.url || '';
  const shortVideosCount = videos.filter(v => 
    v.title.toLowerCase().includes("short") || 
    v.title.toLowerCase().includes("#shorts") ||
    v.titleUrl.toLowerCase().includes("/shorts/")
  ).length;
  
  const streamCount = videos.filter(v => 
    v.title.toLowerCase().includes("stream") || 
    v.title.toLowerCase().includes("live") ||
    v.title.toLowerCase().includes("[live]") ||
    v.title.toLowerCase().includes("🔴")
  ).length;

  const regularVideosCount = videos.length - shortVideosCount - streamCount;
  
  // Get watch streak (consecutive days)
  const watchDates = [...new Set(videos.map(v => new Date(v.time).toDateString()))].sort();
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

  const loadMoreVideos = () => {
    setLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      const newVideos = sortedVideos.slice(0, page * VIDEOS_PER_PAGE);
      setDisplayedVideos(newVideos);
      setLoading(false);
    }, 500);
  };

  // Handle scroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight * 1.2 &&
      !loading &&
      displayedVideos.length < sortedVideos.length
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // Load initial videos
  useEffect(() => {
    if (isOpen) {
      loadMoreVideos();
    }
  }, [page, isOpen]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setDisplayedVideos([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{channelName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="text-sm">
            <p className="text-gray-500">First watched</p>
            <p className="font-medium">{firstWatch.toLocaleDateString()}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Last watched</p>
            <p className="font-medium">{lastWatch.toLocaleDateString()}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Total videos</p>
            <p className="font-medium">{videos.length}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Watch time</p>
            <p className="font-medium">{Math.round(watchMinutes / 60)} hours</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Regular videos</p>
            <p className="font-medium">{regularVideosCount}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Shorts</p>
            <p className="font-medium">{shortVideosCount}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Streams/Live</p>
            <p className="font-medium">{streamCount}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Max Watch Streak</p>
            <p className="font-medium">{maxStreak} days</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="h-48">
            <h4 className="text-sm font-medium mb-2">Monthly Activity</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="videos" stroke="#4f46e5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-48">
            <h4 className="text-sm font-medium mb-2">Daily Pattern</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayStats}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="videos" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ScrollArea 
          className="flex-1 mt-4" 
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4 pr-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Watch History</h4>
              <span className="text-sm text-gray-500">
                Showing {displayedVideos.length} of {sortedVideos.length} videos
              </span>
            </div>
            <div className="space-y-2">
              {displayedVideos.map((video, idx) => (
                <a
                  key={idx}
                  href={video.titleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {video.title}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(video.time).toLocaleString()}
                  </p>
                </a>
              ))}
              {loading && (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
