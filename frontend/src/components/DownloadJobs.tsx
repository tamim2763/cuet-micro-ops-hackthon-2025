import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Loader, CheckCircle2, XCircle, Clock } from "lucide-react";
import * as Sentry from "@sentry/react";
import { api } from "../lib/api";
import { DownloadJob } from "../types";
export function DownloadJobs() {
  const [fileId, setFileId] = useState("70000");
  const { data: jobs } = useQuery({
    queryKey: ["downloads"],
    queryFn: async () => {
      // Mock data for demo - replace with real API
      return [] as DownloadJob[];
    },
    refetchInterval: 2000,
  });
  const initiateMutation = useMutation({
    mutationFn: async (fileIds: number[]) => {
      const transaction = Sentry.startTransaction({
        name: "download.initiate",
      });
      try {
        const response = await api.post("/v1/download/initiate", {
          file_ids: fileIds,
        });
        transaction.finish();
        return response.data;
      } catch (error) {
        Sentry.captureException(error);
        transaction.finish();
        throw error;
      }
    },
  });
  const handleInitiate = () => {
    initiateMutation.mutate([parseInt(fileId)]);
  };
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: Clock,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      processing: {
        icon: Loader,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      completed: {
        icon: CheckCircle2,
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      failed: {
        icon: XCircle,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${badge.color} text-sm`}
      >
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };
  return (
    <div className="card">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-primary" />
        Download Jobs
      </h2>
      {/* Initiation Form */}
      <div className="flex gap-3 mb-6">
        <input
          type="number"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="Enter file ID"
          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleInitiate}
          disabled={initiateMutation.isPending}
          className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {initiateMutation.isPending ? "Initiating..." : "Start Download"}
        </button>
      </div>
      {/* Jobs List */}
      <div className="space-y-3">
        {jobs?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No download jobs yet. Start one above!
          </div>
        ) : (
          jobs?.map((job) => (
            <div
              key={job.jobId}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm">{job.jobId}</span>
                {getStatusBadge(job.status)}
              </div>
              {job.status === "processing" && job.progress && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {job.progress.current}/{job.progress.total} files
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
