import { useEffect, useState, useCallback } from 'react';
import type { IJob } from '../types';
import { fetchJobDetail } from '../utils/jobApi';

interface GatedTeaser {
  _id?: string;
  JobTitle?: string;
  Company?: string;
  Location?: string;
}

interface Result {
  job: IJob | null;
  gated: boolean;
  teaser: GatedTeaser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches a job's full detail through the gated endpoint.
 *
 * Backend returns one of:
 *   { gated: false, job: <full job> }     → show PublicJobDetail
 *   { gated: true, teaser: <basics> }     → show SignupGate
 *
 * `fallbackTeaser` is the list-level data we already have — used for the
 * "you were viewing" preview inside the gate without an extra round trip.
 */
export function useGatedJobDetail(jobId: string | null, fallbackTeaser?: GatedTeaser | null) {
  const [state, setState] = useState<Omit<Result, 'refetch'>>({
    job: null,
    gated: false,
    teaser: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!jobId) {
      setState({ job: null, gated: false, teaser: null, loading: false, error: null });
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetchJobDetail(jobId);
      if (res.gated) {
        setState({
          job: null,
          gated: true,
          teaser: res.teaser || fallbackTeaser || null,
          loading: false,
          error: null,
        });
      } else {
        setState({
          job: res.job as IJob,
          gated: false,
          teaser: null,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      setState({
        job: null,
        gated: false,
        teaser: null,
        loading: false,
        error: err.message || 'Failed to load job',
      });
    }
  }, [jobId, fallbackTeaser]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load } as Result;
}