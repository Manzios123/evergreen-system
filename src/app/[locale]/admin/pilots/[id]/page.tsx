"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/alert";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { useApiQuery } from "@/lib/hooks/use-api";
import { pilotsApi } from "@/lib/api/pilots";
import { Pilot } from "@/lib/types";
import {
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function PilotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [retryCount, setRetryCount] = useState(0);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useApiQuery(
    ["pilot", id, retryCount],
    () => pilotsApi.getPilot(id)
  );

  const pilot = response?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <SkeletonLoader type="table"/>
        </div>
        <Card className="p-6">
          <SkeletonLoader type="form"/>
          <div className="space-y-3">
            <SkeletonLoader type="card"/>
            <SkeletonLoader type="dashboard"/>
            <SkeletonLoader type="table"/>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !pilot) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pilots"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Pilots
          </Link>
        </div>
        <Alert type="error" title="Failed to load pilot">
          {error?.message || "Pilot not found"}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRetryCount((prev) => prev + 1);
                refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "closed":
      case "completed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "Draft",
      active: "Active",
      closed: "Closed",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pilots"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Pilots
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">Pilot Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/pilots/${id}/edit`}>
            <Button variant="default" className="inline-flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              Edit Pilot
            </Button>
          </Link>
        </div>
      </div>

      {/* Pilot details card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header with name and status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {pilot.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">ID: {pilot.id}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                pilot.status
              )}`}
            >
              <EyeIcon className="h-3 w-3 mr-1.5" />
              {getStatusDisplay(pilot.status)}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Description
            </h3>
            <p className="text-gray-900">
              {pilot.description || (
                <span className="text-gray-400 italic">—</span>
              )}
            </p>
          </div>

          {/* Dates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date
              </h3>
              <p className="text-gray-900">{formatDate(pilot.start_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                End Date
              </h3>
              <p className="text-gray-900">
                {formatDate(pilot.end_date) || (
                  <span className="text-gray-400 italic">—</span>
                )}
              </p>
            </div>
          </div>

          {/* Timestamps (if available) */}
          {(pilot.created_at || pilot.updated_at) && (
            <div className="pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {pilot.created_at && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Created: {new Date(pilot.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {pilot.updated_at && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Updated: {new Date(pilot.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}