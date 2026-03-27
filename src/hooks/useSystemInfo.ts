import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useSystemInfo() {
  const [cpus, setCpus] = useState(1);
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.getSystemInfo()
      .then((data) => {
        setCpus(data.cpus);
        setEnvStatus(data.envStatus);
      })
      .catch(() => console.error('Failed to fetch system info'));
  }, []);

  return { cpus, envStatus, setEnvStatus };
}
