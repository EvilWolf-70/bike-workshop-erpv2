import { useCallback, useEffect, useMemo, useState } from "react";
import type { Vehicle, VehicleInput } from "../types/vehicle";
import * as vehicleService from "../services/api/vehicleService";

type Status = "loading" | "success" | "error";

export function useVehicles(searchTerm: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await vehicleService.fetchVehicles();
      setVehicles(data);
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
    if (!term) return vehicles;
    return vehicles.filter(
      (v) =>
        v.registrationNumber.toLowerCase().replace(/\s/g, "").includes(term.replace(/\s/g, "")) ||
        v.ownerName.toLowerCase().includes(term) ||
        v.brand.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term) ||
        v.ownerPhone.includes(term)
    );
  }, [vehicles, searchTerm]);

  const create = useCallback(async (input: VehicleInput) => {
    const created = await vehicleService.createVehicle(input);
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: VehicleInput) => {
    const updated = await vehicleService.updateVehicle(id, input);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await vehicleService.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { vehicles: filtered, allCount: vehicles.length, status, error, reload: load, create, update, remove };
}
