import { useCallback, useEffect, useMemo, useState } from "react";
import type { JobCard, JobCardInput, JobStatus } from "../types/jobcard";
import * as jobCardService from "../services/api/jobCardService";

type Status = "loading" | "success" | "error";
export type JobStatusFilter = JobStatus | "All";

export function useJobCards(searchTerm: string, statusFilter: JobStatusFilter) {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await jobCardService.fetchJobCards();
      setJobCards(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Check your connection and try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobCards.filter((j) => {
      const matchesStatus = statusFilter === "All" || j.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        j.jobCardNumber.toLowerCase().includes(term) ||
        j.vehicleRegistration.toLowerCase().replace(/\s/g, "").includes(term.replace(/\s/g, "")) ||
        j.customerName.toLowerCase().includes(term) ||
        j.complaint.toLowerCase().includes(term)
      );
    });
  }, [jobCards, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<JobStatusFilter, number> = { All: jobCards.length, Pending: 0, "In Progress": 0, Completed: 0, Delivered: 0 };
    for (const j of jobCards) c[j.status]++;
    return c;
  }, [jobCards]);

  const create = useCallback(async (input: JobCardInput) => {
    const created = await jobCardService.createJobCard(input);
    setJobCards((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: JobCardInput) => {
    const updated = await jobCardService.updateJobCard(id, input);
    setJobCards((prev) => prev.map((j) => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await jobCardService.deleteJobCard(id);
    setJobCards((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return { jobCards: filtered, counts, status, error, reload: load, create, update, remove };
}
