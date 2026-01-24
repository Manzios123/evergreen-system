"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Alert from "@/components/ui/alert";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { useApiQuery, useApiMutation } from "@/lib/hooks/use-api";
import { pilotsApi } from "@/lib/api/pilots";
import { Pilot } from "@/lib/types";
import { ArrowLeftIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

export default function EditPilotPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active" as "active" | "completed" | "cancelled" | "draft" | "closed",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showLegacyStatusNote, setShowLegacyStatusNote] = useState(false);
  const [legacyOriginalStatus, setLegacyOriginalStatus] = useState("");

  // Fetch pilot data
  const {
    data: response,
    isLoading,
    error: fetchError,
  } = useApiQuery(
    ["pilot", id, "edit"],
    () => pilotsApi.getPilot(id)
  );

  const pilot = response?.data;

  // Mutation for updating
  const updatePilotMutation = useApiMutation(
    (data: Partial<Pilot>) => pilotsApi.updatePilot(id, data)
  );

  const { mutate: updatePilot } = updatePilotMutation;
  const isSubmitting = updatePilotMutation.isPending; // Changed from isLoading to isPending
  const submitError = updatePilotMutation.error;

  // Prefill form when data loads
  useEffect(() => {
    if (pilot) {
      // Handle status mapping for legacy values
      const originalStatus = pilot.status;
      let mappedStatus: "active" | "completed" | "cancelled" | "draft" | "closed" = "active";
      
      // Map backend statuses to form statuses
      if (["active", "completed", "cancelled", "draft", "closed"].includes(originalStatus)) {
        mappedStatus = originalStatus as any;
        setShowLegacyStatusNote(false);
      } else {
        // Map unknown statuses to 'active'
        mappedStatus = "active";
        setShowLegacyStatusNote(true);
        setLegacyOriginalStatus(originalStatus);
      }

      setFormData({
        name: pilot.name || "",
        description: pilot.description || "",
        start_date: pilot.start_date ? pilot.start_date.split("T")[0] : "",
        end_date: pilot.end_date ? pilot.end_date.split("T")[0] : "",
        status: mappedStatus,
      });
    }
  }, [pilot]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    if (!formData.end_date) {
      errors.end_date = "End date is required";
    } else if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        errors.end_date = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare payload - convert status to backend format
    let backendStatus = formData.status;
    // Map frontend status to backend status if needed
    if (["completed", "cancelled"].includes(formData.status)) {
      backendStatus = "closed";
    } else if (formData.status === "draft") {
      backendStatus = "draft";
    } else if (formData.status === "active") {
      backendStatus = "active";
    }

    const payload: Partial<Pilot> = {
      name: formData.name,
      description: formData.description || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      status: backendStatus as any,
    };

    updatePilot(payload, {
      onSuccess: () => {
        alert("Pilot updated successfully!");
        router.push(`/admin/pilots/${id}`);
      },
    });
  };

  const handleCancel = () => {
    router.push(`/admin/pilots/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <SkeletonLoader type="table"/>
        </div>
        <Card className="p-6">
          <SkeletonLoader type="table"/>
          <div className="space-y-4">
            <SkeletonLoader type="table"/>
            <SkeletonLoader type="table"/>
            <SkeletonLoader type="table"/>
          </div>
        </Card>
      </div>
    );
  }

  if (fetchError || !pilot) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/pilots/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Pilot
          </Link>
        </div>
        <Alert type="error" title="Failed to load pilot">
          {fetchError?.message || "Pilot not found"}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/pilots/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Pilot
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">Edit Pilot</h1>
        </div>
      </div>

      {/* Legacy status note */}
      {showLegacyStatusNote && (
        <Alert type="info" title="Status Updated">
          Original status "{legacyOriginalStatus}" has been mapped to "Active". Please select a valid status below.
        </Alert>
      )}

      {/* Submit error */}
      {submitError && (
        <Alert type="error" title="Failed to update pilot">
          {submitError.message}
        </Alert>
      )}

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter pilot name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.start_date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.start_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  {formErrors.start_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.end_date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.end_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  {formErrors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Current status: {formData.status}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}